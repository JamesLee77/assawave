// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ASSA WAVE Token Sale (TokenSale)
 * @notice 3-round, fixed-price private sale paid in USDC (6 decimals). Purchases are
 *         non-circulating: each allocation vests inside this contract using the same
 *         TGE + cliff + linear model as TokenVesting (Spec §3.3), so a buyer claims
 *         their $ASSA over time via `claim(roundId)`.
 *
 * @dev Design decisions baked in (DEVELOPMENT_PLAN §8):
 *      - #3 Gating: per-round `whitelist[roundId][addr]` boolean (KYCRegistry is used
 *        in tandem off-chain/frontend; not coupled into purchase() — zero extra audit
 *        surface here).
 *      - #4 Model: self-contained, id-indexed allocations (not pushed into TokenVesting).
 *      - #17 Pausable: `purchase` is `whenNotPaused`; `claim` is exempt so buyers can
 *        always withdraw vested tokens even during an emergency pause.
 *      - Price freeze: a round cannot be reconfigured once it has sold any tokens.
 *      USDC flows directly to the Treasury (non-custodial — the sale never holds USDC).
 *      The sale must be pre-funded with $ASSA covering its round hard caps.
 */
contract TokenSale is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant SALE_ADMIN_ROLE = keccak256("SALE_ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint256 private constant ASSA_UNIT = 1e18;

    struct Round {
        string  name;
        uint256 priceUsdc;     // USDC (6 decimals) per 1 ASSA (1e18). Frozen on configure.
        uint128 hardCapTokens; // Round token cap (18 decimals)
        uint128 soldTokens;
        uint64  startTime;
        uint64  endTime;
        uint32  cliffSeconds;
        uint32  vestSeconds;   // Linear window AFTER the cliff
        uint16  tgeBps;        // TGE immediate-unlock portion (<= 10000)
        bool    active;
    }

    struct Allocation {
        uint128 totalAllocated; // ASSA bought in this round (18 decimals)
        uint128 claimed;
        uint64  startTime;      // TGE start, frozen at first purchase
        uint32  cliffSeconds;
        uint32  vestSeconds;
        uint16  tgeBps;
    }

    IERC20 public immutable assaToken;
    IERC20 public immutable usdcToken;
    address public treasury;

    Round[] private _rounds;
    mapping(uint256 => mapping(address => Allocation)) public allocations;
    mapping(uint256 => mapping(address => bool)) public whitelist;

    /// @notice Sum of (totalAllocated - claimed) still owed to buyers in $ASSA.
    uint256 public totalOutstanding;

    event RoundConfigured(uint256 indexed roundId, string name, uint256 priceUsdc, uint128 hardCapTokens, uint16 tgeBps);
    event WhitelistSet(uint256 indexed roundId, address indexed account, bool allowed);
    event Purchased(uint256 indexed roundId, address indexed buyer, uint256 assaAmount, uint256 usdcPaid);
    event Claimed(uint256 indexed roundId, address indexed buyer, uint256 assaAmount);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event TokensRecovered(address indexed token, address indexed to, uint256 amount);

    constructor(address assaToken_, address usdcToken_, address treasury_, address admin) {
        require(assaToken_ != address(0), "Sale: assa zero");
        require(usdcToken_ != address(0), "Sale: usdc zero");
        require(treasury_ != address(0), "Sale: treasury zero");
        require(admin != address(0), "Sale: admin zero");

        assaToken = IERC20(assaToken_);
        usdcToken = IERC20(usdcToken_);
        treasury = treasury_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SALE_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // ------------------------------------------------------------------
    // Admin configuration
    // ------------------------------------------------------------------

    /**
     * @notice Create (roundId == count) or update (price-frozen) a round.
     * @dev An existing round can only be updated while it has sold nothing
     *      (`soldTokens == 0`), enforcing the price freeze.
     */
    function configureRound(
        uint256 roundId,
        string calldata name,
        uint256 priceUsdc,
        uint128 hardCapTokens,
        uint64 startTime,
        uint64 endTime,
        uint32 cliffSeconds,
        uint32 vestSeconds,
        uint16 tgeBps,
        bool active
    ) external onlyRole(SALE_ADMIN_ROLE) {
        require(priceUsdc > 0, "Sale: price zero");
        require(hardCapTokens > 0, "Sale: cap zero");
        require(endTime > startTime, "Sale: bad window");
        require(tgeBps <= BPS_DENOMINATOR, "Sale: tgeBps > 100%");
        require(tgeBps == BPS_DENOMINATOR || vestSeconds > 0, "Sale: zero-length linear");
        require(roundId <= _rounds.length, "Sale: bad roundId");

        if (roundId == _rounds.length) {
            _rounds.push(
                Round({
                    name: name,
                    priceUsdc: priceUsdc,
                    hardCapTokens: hardCapTokens,
                    soldTokens: 0,
                    startTime: startTime,
                    endTime: endTime,
                    cliffSeconds: cliffSeconds,
                    vestSeconds: vestSeconds,
                    tgeBps: tgeBps,
                    active: active
                })
            );
        } else {
            Round storage r = _rounds[roundId];
            require(r.soldTokens == 0, "Sale: round frozen (sold>0)");
            r.name = name;
            r.priceUsdc = priceUsdc;
            r.hardCapTokens = hardCapTokens;
            r.startTime = startTime;
            r.endTime = endTime;
            r.cliffSeconds = cliffSeconds;
            r.vestSeconds = vestSeconds;
            r.tgeBps = tgeBps;
            r.active = active;
        }

        emit RoundConfigured(roundId, name, priceUsdc, hardCapTokens, tgeBps);
    }

    /// @notice Toggle a round's active flag without touching frozen price/cap.
    function setRoundActive(uint256 roundId, bool active) external onlyRole(SALE_ADMIN_ROLE) {
        _rounds[roundId].active = active;
    }

    function setWhitelist(uint256 roundId, address[] calldata accounts, bool allowed)
        external
        onlyRole(SALE_ADMIN_ROLE)
    {
        require(roundId < _rounds.length, "Sale: bad roundId");
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[roundId][accounts[i]] = allowed;
            emit WhitelistSet(roundId, accounts[i], allowed);
        }
    }

    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "Sale: treasury zero");
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ------------------------------------------------------------------
    // Buyer: purchase / claim
    // ------------------------------------------------------------------

    /**
     * @notice Buy `assaAmount` (18 decimals) of $ASSA in `roundId`, paying USDC.
     * @dev USDC is pulled straight to the Treasury. The purchase is recorded as a
     *      vesting allocation; tokens are claimed later via `claim`.
     */
    function purchase(uint256 roundId, uint256 assaAmount)
        external
        nonReentrant
        whenNotPaused
    {
        require(roundId < _rounds.length, "Sale: bad roundId");
        require(assaAmount > 0, "Sale: amount zero");

        Round storage r = _rounds[roundId];
        require(r.active, "Sale: round inactive");
        require(block.timestamp >= r.startTime && block.timestamp <= r.endTime, "Sale: round closed");
        require(whitelist[roundId][msg.sender], "Sale: not whitelisted");
        require(r.soldTokens + assaAmount <= r.hardCapTokens, "Sale: exceeds round cap");

        uint256 usdcCost = (assaAmount * r.priceUsdc) / ASSA_UNIT;
        require(usdcCost > 0, "Sale: dust amount");

        r.soldTokens += uint128(assaAmount);

        Allocation storage a = allocations[roundId][msg.sender];
        if (a.totalAllocated == 0) {
            // Freeze schedule params at first purchase in this round.
            a.startTime = uint64(block.timestamp);
            a.cliffSeconds = r.cliffSeconds;
            a.vestSeconds = r.vestSeconds;
            a.tgeBps = r.tgeBps;
        }
        a.totalAllocated += uint128(assaAmount);
        totalOutstanding += assaAmount;

        usdcToken.safeTransferFrom(msg.sender, treasury, usdcCost);

        emit Purchased(roundId, msg.sender, assaAmount, usdcCost);
    }

    /// @notice Claim all currently-vested-but-unclaimed $ASSA for `roundId`. Pause-exempt.
    function claim(uint256 roundId) external nonReentrant {
        Allocation storage a = allocations[roundId][msg.sender];
        require(a.totalAllocated > 0, "Sale: no allocation");

        uint256 amount = _vested(a, block.timestamp) - a.claimed;
        require(amount > 0, "Sale: nothing claimable");

        a.claimed += uint128(amount);
        totalOutstanding -= amount;

        assaToken.safeTransfer(msg.sender, amount);
        emit Claimed(roundId, msg.sender, amount);
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    function claimable(uint256 roundId, address user) external view returns (uint256) {
        Allocation storage a = allocations[roundId][user];
        if (a.totalAllocated == 0) return 0;
        return _vested(a, block.timestamp) - a.claimed;
    }

    function getRound(uint256 roundId) external view returns (Round memory) {
        return _rounds[roundId];
    }

    function getRoundCount() external view returns (uint256) {
        return _rounds.length;
    }

    /// @notice USDC cost (6 decimals) for buying `assaAmount` (18 decimals) in `roundId`.
    function quoteUsdc(uint256 roundId, uint256 assaAmount) external view returns (uint256) {
        return (assaAmount * _rounds[roundId].priceUsdc) / ASSA_UNIT;
    }

    // ------------------------------------------------------------------
    // Recovery
    // ------------------------------------------------------------------

    /// @notice Recover non-owed tokens. For $ASSA only the surplus above buyer obligations.
    function recoverERC20(address tokenAddr, address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(to != address(0), "Sale: to zero");
        if (tokenAddr == address(assaToken)) {
            uint256 bal = assaToken.balanceOf(address(this));
            uint256 surplus = bal > totalOutstanding ? bal - totalOutstanding : 0;
            require(amount <= surplus, "Sale: exceeds surplus");
        }
        IERC20(tokenAddr).safeTransfer(to, amount);
        emit TokensRecovered(tokenAddr, to, amount);
    }

    // ------------------------------------------------------------------
    // Internal vesting accounting (Spec §3.3 — mirrors TokenVesting)
    // ------------------------------------------------------------------

    function _vested(Allocation memory a, uint256 ts) internal pure returns (uint256) {
        if (ts < a.startTime) return 0;

        uint256 total = a.totalAllocated;
        uint256 tge = (total * a.tgeBps) / BPS_DENOMINATOR;

        uint256 cliffEnd = uint256(a.startTime) + a.cliffSeconds;
        if (ts < cliffEnd) {
            return tge;
        }

        uint256 linearEnd = cliffEnd + a.vestSeconds;
        if (ts >= linearEnd) {
            return total;
        }

        uint256 linearPortion = total - tge;
        uint256 elapsed = ts - cliffEnd;
        return tge + (linearPortion * elapsed) / a.vestSeconds;
    }
}
