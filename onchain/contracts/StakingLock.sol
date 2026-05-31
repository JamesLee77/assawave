// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ASSA WAVE Staking & Locking Contract (veASSA)
 * @notice Enforces a strict zero-yield (no APY/rewards) locking mechanism.
 *         Locked tokens grant governance voting weight and tier level weights.
 *         All lockup weights decay linearly as the remaining locking time approaches zero.
 *
 * @dev Non-transferable by construction: a veASSA position lives only in `locks[user]`
 *      and there is deliberately NO transfer/approve/delegate-of-position function — the
 *      weight cannot be moved or sold, only the original locker can `withdraw` principal
 *      after expiry. (Negative invariant, enforced by tests + static ABI scan.)
 *
 *      Zero-yield by construction: there is NO reward/emission/oracle path. Locking only
 *      removes sell-side supply; it never pays out anything beyond the original principal.
 *
 *      Historical voting power: every change to a user's lock (lock / increaseAmount /
 *      increaseUnlockTime / withdraw) appends a checkpoint `Point{amount, end, ts}`, so
 *      `votingPowerAt(user, ts)` can reconstruct the time-decayed weight at any past
 *      timestamp — the input a future ERC-5805 / Governor integration needs. Global-supply
 *      checkpointing (Curve-style bias/slope aggregate) is deferred to Phase 3.
 */
contract StakingLock is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Lock {
        uint128 amount;  // Locked ASSA amount (18 decimals)
        uint64 start;    // Timestamp when lock was initiated
        uint64 end;      // Timestamp when lock expires
    }

    /// @notice Historical checkpoint of a user's lock state, written on every change.
    struct Point {
        uint128 amount;  // Lock amount in effect from `ts`
        uint64 end;      // Lock end in effect from `ts`
        uint64 ts;       // Timestamp the checkpoint was written
    }

    IERC20 public immutable assaToken;
    uint256 public constant MAX_LOCK_DURATION = 4 * 365 days; // 4 Years
    uint256 public constant MIN_LOCK_DURATION = 7 days;       // 1 Week

    mapping(address => Lock) public locks;
    mapping(address => Point[]) private _history;
    uint256 public totalLocked;

    // Tier thresholds in ASSA token units (18 decimals)
    uint256 public bronzeThreshold = 1_000 * 10**18;
    uint256 public silverThreshold = 10_000 * 10**18;
    uint256 public goldThreshold = 100_000 * 10**18;
    uint256 public legendThreshold = 1_000_000 * 10**18;

    enum Tier { NONE, BRONZE, SILVER, GOLD, LEGEND }

    event Locked(address indexed user, uint256 amount, uint256 start, uint256 end);
    event AmountIncreased(address indexed user, uint256 additionalAmount, uint256 totalAmount);
    event UnlockTimeIncreased(address indexed user, uint256 oldEnd, uint256 newEnd);
    event Withdrawn(address indexed user, uint256 amount);
    event TierThresholdsUpdated(uint256 bronze, uint256 silver, uint256 gold, uint256 legend);
    event Checkpoint(address indexed user, uint256 amount, uint256 end, uint256 ts);

    constructor(address assaToken_, address admin) {
        require(assaToken_ != address(0), "StakingLock: token zero");
        require(admin != address(0), "StakingLock: admin zero");
        assaToken = IERC20(assaToken_);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /**
     * @notice Locks ASSA tokens for a specific duration.
     * @param amount The amount of ASSA to lock (18 decimals).
     * @param duration The locking duration in seconds (must be between 7 days and 4 years).
     */
    function lock(uint256 amount, uint256 duration) external nonReentrant {
        require(amount > 0, "StakingLock: amount zero");
        require(duration >= MIN_LOCK_DURATION, "StakingLock: lock duration below minimum");
        require(duration <= MAX_LOCK_DURATION, "StakingLock: lock duration exceeds maximum");

        Lock storage userLock = locks[msg.sender];
        require(userLock.amount == 0, "StakingLock: active lock exists, use increaseAmount/increaseUnlockTime");

        uint64 start = uint64(block.timestamp);
        uint64 end = uint64(block.timestamp + duration);

        userLock.amount = uint128(amount);
        userLock.start = start;
        userLock.end = end;

        totalLocked += amount;

        _checkpoint(msg.sender, userLock.amount, end);

        assaToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Locked(msg.sender, amount, start, end);
    }

    /**
     * @notice Add more tokens to an active locked position.
     * @param amount Additional ASSA tokens to lock (18 decimals).
     */
    function increaseAmount(uint256 amount) external nonReentrant {
        require(amount > 0, "StakingLock: amount zero");

        Lock storage userLock = locks[msg.sender];
        require(userLock.amount > 0, "StakingLock: no active lock");
        require(userLock.end > block.timestamp, "StakingLock: lock expired, withdraw first");

        userLock.amount += uint128(amount);
        totalLocked += amount;

        _checkpoint(msg.sender, userLock.amount, userLock.end);

        assaToken.safeTransferFrom(msg.sender, address(this), amount);

        emit AmountIncreased(msg.sender, amount, userLock.amount);
    }

    /**
     * @notice Extend the expiration date of an active locked position.
     * @param duration Additional duration in seconds to extend the lock.
     */
    function increaseUnlockTime(uint256 duration) external nonReentrant {
        Lock storage userLock = locks[msg.sender];
        require(userLock.amount > 0, "StakingLock: no active lock");
        require(userLock.end > block.timestamp, "StakingLock: lock expired, withdraw first");

        uint64 oldEnd = userLock.end;
        uint64 newEnd = uint64(oldEnd + duration);
        require(newEnd <= block.timestamp + MAX_LOCK_DURATION, "StakingLock: lock duration exceeds maximum");
        require(newEnd > oldEnd, "StakingLock: duration must increase end time");

        userLock.end = newEnd;

        _checkpoint(msg.sender, userLock.amount, newEnd);

        emit UnlockTimeIncreased(msg.sender, oldEnd, newEnd);
    }

    /**
     * @notice Withdraw locked tokens after lock period has expired.
     * @dev Restores original capital to the user.
     */
    function withdraw() external nonReentrant {
        Lock storage userLock = locks[msg.sender];
        require(userLock.amount > 0, "StakingLock: no active lock");
        require(block.timestamp >= userLock.end, "StakingLock: lock not yet expired");

        uint256 amount = userLock.amount;

        // Reset user lock state
        userLock.amount = 0;
        userLock.start = 0;
        userLock.end = 0;

        totalLocked -= amount;

        _checkpoint(msg.sender, 0, 0);

        assaToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Calculates the current voting power of a user.
     * @dev Linear decay calculation: votingPower = amount * (remainingSeconds / MAX_LOCK_DURATION)
     */
    function votingPower(address user) public view returns (uint256) {
        Lock memory userLock = locks[user];
        if (userLock.amount == 0 || block.timestamp >= userLock.end) {
            return 0;
        }

        uint256 timeLeft = userLock.end - block.timestamp;
        return (uint256(userLock.amount) * timeLeft) / MAX_LOCK_DURATION;
    }

    /**
     * @notice Reconstructs a user's time-decayed voting power at a past `timestamp`.
     * @dev Binary-searches the checkpoint in effect at `timestamp` and applies linear
     *      decay from that point's `amount`/`end`. Returns 0 before the first checkpoint
     *      or once the lock in effect had expired by `timestamp`.
     */
    function votingPowerAt(address user, uint256 timestamp) external view returns (uint256) {
        Point[] storage h = _history[user];
        uint256 n = h.length;
        if (n == 0 || timestamp < h[0].ts) {
            return 0;
        }

        // Rightmost checkpoint with ts <= timestamp.
        uint256 lo = 0;
        uint256 hi = n - 1;
        uint256 idx = 0;
        while (lo <= hi) {
            uint256 mid = (lo + hi) / 2;
            if (h[mid].ts <= timestamp) {
                idx = mid;
                lo = mid + 1;
            } else {
                if (mid == 0) break;
                hi = mid - 1;
            }
        }

        Point storage p = h[idx];
        if (p.amount == 0 || timestamp >= p.end) {
            return 0;
        }
        return (uint256(p.amount) * (uint256(p.end) - timestamp)) / MAX_LOCK_DURATION;
    }

    /// @notice Number of checkpoints recorded for `user`.
    function lockHistoryLength(address user) external view returns (uint256) {
        return _history[user].length;
    }

    /// @notice Read checkpoint `index` for `user`.
    function lockHistoryAt(address user, uint256 index) external view returns (Point memory) {
        return _history[user][index];
    }

    function _checkpoint(address user, uint256 amount, uint256 end) internal {
        _history[user].push(Point({amount: uint128(amount), end: uint64(end), ts: uint64(block.timestamp)}));
        emit Checkpoint(user, amount, end, block.timestamp);
    }

    /**
     * @notice Returns the user's VIP tier level based on their locked ASSA amount.
     */
    function tierOf(address user) public view returns (Tier) {
        Lock memory userLock = locks[user];
        if (userLock.amount == 0 || block.timestamp >= userLock.end) {
            return Tier.NONE;
        }

        uint256 amount = userLock.amount;
        if (amount >= legendThreshold) return Tier.LEGEND;
        if (amount >= goldThreshold) return Tier.GOLD;
        if (amount >= silverThreshold) return Tier.SILVER;
        if (amount >= bronzeThreshold) return Tier.BRONZE;
        return Tier.NONE;
    }

    /**
     * @notice Returns the ecosystem multiplier weight associated with the user's tier.
     * @dev Weights are denominated in percentage points (100 = 1.0x, 200 = 2.0x, etc.)
     */
    function tierWeight(address user) external view returns (uint256) {
        Tier tier = tierOf(user);
        if (tier == Tier.LEGEND) return 200; // 2.0x multiplier
        if (tier == Tier.GOLD) return 150;   // 1.5x multiplier
        if (tier == Tier.SILVER) return 125; // 1.25x multiplier
        if (tier == Tier.BRONZE) return 110; // 1.1x multiplier
        return 100;                          // 1.0x baseline
    }

    /**
     * @notice Set new threshold bounds for ecosystem tiers.
     */
    function updateTierThresholds(
        uint256 bronze,
        uint256 silver,
        uint256 gold,
        uint256 legend
    ) external onlyRole(ADMIN_ROLE) {
        require(bronze < silver && silver < gold && gold < legend, "StakingLock: invalid thresholds sequence");
        bronzeThreshold = bronze;
        silverThreshold = silver;
        goldThreshold = gold;
        legendThreshold = legend;
        emit TierThresholdsUpdated(bronze, silver, gold, legend);
    }
}
