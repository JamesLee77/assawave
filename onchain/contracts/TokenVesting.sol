// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ASSA WAVE Token Vesting (TokenVesting)
 * @notice Categorized cliff + linear vesting with a TGE immediate-unlock portion.
 *         Used for Founder, Team, Investor, Partner, ECO, and Marketing allocations.
 *
 * @dev Vesting accounting follows the Contract Spec §3.3 (single source of truth),
 *      deliberately replacing the ccm `startTime`-based linearity (which caused a
 *      cliff-jump and had no TGE concept). The model is:
 *
 *          tge     = total * tgeBps / 1e4                          // unlocked at `start`
 *          linear  = (total - tge) over [start+cliff, start+cliff+duration]
 *          vested(t):
 *              t <  start                        -> 0
 *              start <= t < start+cliff          -> tge
 *              start+cliff <= t < start+cliff+duration
 *                                                -> tge + (total-tge) * (t-(start+cliff)) / duration
 *              t >= start+cliff+duration         -> total
 *
 *      `duration` is the LINEAR window measured AFTER the cliff (e.g. R1 "Linear 18m"
 *      means duration = 18 months and full vest at cliff+18m). This avoids the doc's
 *      `[start+cliff, start+duration]` ambiguity and prevents TGE/linear double-counting.
 *
 *      Schedules are id-indexed (Decision #4) so the same surface serves the portal
 *      Vesting page (scheduleIdsOf -> releasable(id) -> release(id)).
 */
contract TokenVesting is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant VESTING_ADMIN_ROLE = keccak256("VESTING_ADMIN_ROLE");

    uint16 public constant BPS_DENOMINATOR = 10_000;

    struct Schedule {
        address beneficiary;
        uint128 total;      // Total ASSA granted (18 decimals)
        uint128 claimed;    // ASSA already released
        uint64  start;      // Vesting start timestamp (TGE)
        uint32  cliff;      // Cliff length in seconds (linear begins after this)
        uint32  duration;   // Linear window in seconds, measured AFTER the cliff
        uint16  tgeBps;     // TGE immediate-unlock portion in basis points (<= 10000)
        uint8   category;   // Free-form category tag (Founder/Team/Investor/...)
        bool    revocable;  // Whether VESTING_ADMIN may revoke the unvested remainder
        bool    revoked;    // Whether the schedule has been revoked
    }

    IERC20 public immutable assaToken;

    Schedule[] private _schedules;
    mapping(address => uint256[]) private _scheduleIds;

    /// @notice Sum of (total - claimed) the contract still owes across live schedules.
    ///         Guards recoverERC20 from clawing back tokens promised to beneficiaries.
    uint256 public totalOutstanding;

    event ScheduleCreated(
        uint256 indexed id,
        address indexed beneficiary,
        uint256 total,
        uint16 tgeBps,
        uint32 cliff,
        uint32 duration,
        uint8 category,
        bool revocable
    );
    event Released(uint256 indexed id, address indexed beneficiary, uint256 amount);
    event Revoked(uint256 indexed id, address indexed beneficiary, uint256 refundedUnvested);
    event TokensRecovered(address indexed token, address indexed to, uint256 amount);

    constructor(address assaToken_, address admin) {
        require(assaToken_ != address(0), "Vesting: token zero");
        require(admin != address(0), "Vesting: admin zero");
        assaToken = IERC20(assaToken_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VESTING_ADMIN_ROLE, admin);
    }

    // ------------------------------------------------------------------
    // Admin: schedule creation / revocation
    // ------------------------------------------------------------------

    /**
     * @notice Create a vesting schedule. The contract must already hold (or be funded
     *         with) enough ASSA to cover `total`; this is enforced lazily at release time
     *         but `totalOutstanding` accounting assumes the contract is pre-funded.
     */
    function createSchedule(
        address beneficiary,
        uint256 total,
        uint16 tgeBps,
        uint32 cliff,
        uint32 duration,
        bool revocable,
        uint8 category
    ) external onlyRole(VESTING_ADMIN_ROLE) returns (uint256 id) {
        require(beneficiary != address(0), "Vesting: beneficiary zero");
        require(total > 0, "Vesting: total zero");
        require(total <= type(uint128).max, "Vesting: total overflow");
        require(tgeBps <= BPS_DENOMINATOR, "Vesting: tgeBps > 100%");
        // A schedule with no TGE and no linear window would lock funds forever.
        require(tgeBps == BPS_DENOMINATOR || duration > 0, "Vesting: zero-length linear");

        id = _schedules.length;
        _schedules.push(
            Schedule({
                beneficiary: beneficiary,
                total: uint128(total),
                claimed: 0,
                start: uint64(block.timestamp),
                cliff: cliff,
                duration: duration,
                tgeBps: tgeBps,
                category: category,
                revocable: revocable,
                revoked: false
            })
        );
        _scheduleIds[beneficiary].push(id);
        totalOutstanding += total;

        emit ScheduleCreated(id, beneficiary, total, tgeBps, cliff, duration, category, revocable);
    }

    /**
     * @notice Revoke the unvested remainder of a revocable schedule.
     * @dev Already-vested tokens remain claimable by the beneficiary. The unvested
     *      portion is freed (returns to the contract balance, recoverable by admin).
     */
    function revoke(uint256 id) external onlyRole(VESTING_ADMIN_ROLE) {
        Schedule storage s = _schedules[id];
        require(s.total > 0, "Vesting: no schedule");
        require(s.revocable, "Vesting: not revocable");
        require(!s.revoked, "Vesting: already revoked");

        uint256 vestedNow = _vestedAmount(s, block.timestamp);
        uint256 unvested = s.total - vestedNow;

        // Freeze the schedule at the currently-vested amount: future releasable
        // becomes (vestedNow - claimed), nothing more.
        s.total = uint128(vestedNow);
        s.revoked = true;
        totalOutstanding -= unvested;

        emit Revoked(id, s.beneficiary, unvested);
    }

    // ------------------------------------------------------------------
    // Beneficiary: claim
    // ------------------------------------------------------------------

    /// @notice Release all currently-vested-but-unclaimed tokens for schedule `id`.
    function release(uint256 id) external nonReentrant {
        _release(id);
    }

    /// @notice Release across every schedule belonging to `msg.sender`.
    function releaseAll() external nonReentrant {
        uint256[] storage ids = _scheduleIds[msg.sender];
        uint256 len = ids.length;
        require(len > 0, "Vesting: no schedules");
        for (uint256 i = 0; i < len; i++) {
            _releaseIfAny(ids[i]);
        }
    }

    function _release(uint256 id) internal {
        uint256 amount = _doRelease(id);
        require(amount > 0, "Vesting: nothing releasable");
    }

    function _releaseIfAny(uint256 id) internal {
        _doRelease(id);
    }

    function _doRelease(uint256 id) internal returns (uint256 amount) {
        Schedule storage s = _schedules[id];
        require(s.beneficiary != address(0), "Vesting: no schedule");

        amount = _vestedAmount(s, block.timestamp) - s.claimed;
        if (amount == 0) return 0;

        s.claimed += uint128(amount);
        totalOutstanding -= amount;

        assaToken.safeTransfer(s.beneficiary, amount);
        emit Released(id, s.beneficiary, amount);
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    /// @notice Currently releasable amount for schedule `id`.
    function releasable(uint256 id) external view returns (uint256) {
        Schedule storage s = _schedules[id];
        if (s.beneficiary == address(0)) return 0;
        return _vestedAmount(s, block.timestamp) - s.claimed;
    }

    /// @notice Total vested (claimed + claimable) for schedule `id` at the current time.
    function vestedOf(uint256 id) external view returns (uint256) {
        return _vestedAmount(_schedules[id], block.timestamp);
    }

    function getSchedule(uint256 id) external view returns (Schedule memory) {
        return _schedules[id];
    }

    /// @notice Raw schedule fields (portal-compatible tuple accessor).
    function schedules(uint256 id)
        external
        view
        returns (
            address beneficiary,
            uint256 total,
            uint256 claimed,
            uint256 start,
            uint256 cliff,
            uint256 duration,
            uint16 tgeBps,
            uint8 category,
            bool revocable,
            bool revoked
        )
    {
        Schedule storage s = _schedules[id];
        return (s.beneficiary, s.total, s.claimed, s.start, s.cliff, s.duration, s.tgeBps, s.category, s.revocable, s.revoked);
    }

    function scheduleIdsOf(address who) external view returns (uint256[] memory) {
        return _scheduleIds[who];
    }

    function scheduleCountOf(address who) external view returns (uint256) {
        return _scheduleIds[who].length;
    }

    function getScheduleCount() external view returns (uint256) {
        return _schedules.length;
    }

    // ------------------------------------------------------------------
    // Recovery
    // ------------------------------------------------------------------

    /**
     * @notice Recover tokens not owed to beneficiaries. For ASSA, only the surplus
     *         above `totalOutstanding` may be withdrawn; other tokens are fully recoverable.
     */
    function recoverERC20(address tokenAddr, address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(to != address(0), "Vesting: to zero");
        if (tokenAddr == address(assaToken)) {
            uint256 bal = assaToken.balanceOf(address(this));
            uint256 surplus = bal > totalOutstanding ? bal - totalOutstanding : 0;
            require(amount <= surplus, "Vesting: exceeds surplus");
        }
        IERC20(tokenAddr).safeTransfer(to, amount);
        emit TokensRecovered(tokenAddr, to, amount);
    }

    // ------------------------------------------------------------------
    // Internal accounting (Spec §3.3)
    // ------------------------------------------------------------------

    function _vestedAmount(Schedule memory s, uint256 ts) internal pure returns (uint256) {
        // A revoked schedule is frozen: `revoke()` already cut `total` down to the
        // amount vested at revocation, so the whole remaining total IS the vested
        // amount. Re-applying the curve to the reduced total would shrink vested
        // below `claimed` and underflow every release/releasable until the original
        // timeline caught up.
        if (s.revoked) return s.total;

        if (ts < s.start) return 0;

        uint256 total = s.total;
        uint256 tge = (total * s.tgeBps) / BPS_DENOMINATOR;

        uint256 cliffEnd = uint256(s.start) + s.cliff;
        if (ts < cliffEnd) {
            return tge;
        }

        uint256 linearEnd = cliffEnd + s.duration;
        if (ts >= linearEnd) {
            return total;
        }

        // start+cliff <= ts < start+cliff+duration  (duration > 0 here)
        uint256 linearPortion = total - tge;
        uint256 elapsed = ts - cliffEnd;
        return tge + (linearPortion * elapsed) / s.duration;
    }
}
