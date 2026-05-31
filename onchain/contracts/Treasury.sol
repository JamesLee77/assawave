// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ASSA WAVE Treasury (Treasury)
 * @notice Custodies protocol funds: receiver of TokenSale USDC and holder of the $ASSA
 *         distribution buckets (Ecosystem, Liquidity, Marketing, Reserve, ...). Withdrawals
 *         are gated by `TREASURY_ROLE`, which in production is the Safe → Timelock.
 *
 * @dev On-chain bucket accounting: each bucket has a planned `allocation` (a cap, set by
 *      admin) and a running `released` total. Withdrawing against a bucket increments
 *      `released` and reverts if it would exceed the bucket's allocation. Buckets are an
 *      accounting overlay — funds are fungible in the vault — giving auditors a verifiable
 *      "how much of each bucket has actually left the treasury" trail.
 */
contract Treasury is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    /// @notice Planned size of each named bucket (in $ASSA, 18 decimals).
    mapping(bytes32 => uint256) public allocation;
    /// @notice Cumulative amount released from each bucket.
    mapping(bytes32 => uint256) public released;

    event BucketAllocationSet(bytes32 indexed bucket, uint256 amount);
    event Withdrawn(bytes32 indexed bucket, address indexed token, address indexed to, uint256 amount);
    event Recovered(address indexed token, address indexed to, uint256 amount);

    constructor(address admin) {
        require(admin != address(0), "Treasury: admin zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURY_ROLE, admin);
    }

    /// @notice Set (or update) a bucket's planned allocation cap. Cannot drop below released.
    function setBucketAllocation(bytes32 bucket, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount >= released[bucket], "Treasury: below released");
        allocation[bucket] = amount;
        emit BucketAllocationSet(bucket, amount);
    }

    /// @notice Remaining headroom in a bucket.
    function bucketRemaining(bytes32 bucket) external view returns (uint256) {
        uint256 a = allocation[bucket];
        uint256 r = released[bucket];
        return a > r ? a - r : 0;
    }

    /**
     * @notice Withdraw `amount` of `token` to `to`, charged against `bucket`.
     * @dev The bucket cap is enforced for accounting on every token (the cap is denominated
     *      in the token being withdrawn — use distinct bucket ids per token if mixing).
     *      Pass `bucket = bytes32(0)` for an unbucketed withdrawal (no cap check).
     */
    function withdraw(bytes32 bucket, address token, address to, uint256 amount)
        external
        onlyRole(TREASURY_ROLE)
        nonReentrant
    {
        require(to != address(0), "Treasury: to zero");
        require(amount > 0, "Treasury: amount zero");

        if (bucket != bytes32(0)) {
            uint256 newReleased = released[bucket] + amount;
            require(newReleased <= allocation[bucket], "Treasury: exceeds bucket");
            released[bucket] = newReleased;
        }

        IERC20(token).safeTransfer(to, amount);
        emit Withdrawn(bucket, token, to, amount);
    }

    /// @notice Escape hatch for unbucketed/stray tokens, admin-only.
    function recover(address token, address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Treasury: to zero");
        IERC20(token).safeTransfer(to, amount);
        emit Recovered(token, to, amount);
    }
}
