// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IASSAToken {
    function burn(uint256 amount) external;
}

interface IDexRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

/**
 * @title ASSA WAVE BME Revenue Burner (BMEBurner)
 * @notice Receives USDC revenue allocations, swaps them for $ASSA on-chain via DEX, 
 *         and immediately burns the purchased $ASSA to permanent black hole.
 */
contract BMEBurner is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant REVENUE_PROCESSOR_ROLE = keccak256("REVENUE_PROCESSOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable assaToken;
    IERC20 public usdcToken;
    IDexRouter public dexRouter;

    event RevenueProcessed(uint256 usdcAmountIn, uint256 assaAmountBurned, uint256 deadline);
    event DexRouterUpdated(address indexed oldRouter, address indexed newRouter);
    event UsdcTokenUpdated(address indexed oldUsdc, address indexed newUsdc);

    constructor(
        address assaToken_,
        address usdcToken_,
        address dexRouter_,
        address admin
    ) {
        require(assaToken_ != address(0), "BMEBurner: assa zero");
        require(usdcToken_ != address(0), "BMEBurner: usdc zero");
        require(dexRouter_ != address(0), "BMEBurner: router zero");
        require(admin != address(0), "BMEBurner: admin zero");

        assaToken = IERC20(assaToken_);
        usdcToken = IERC20(usdcToken_);
        dexRouter = IDexRouter(dexRouter_);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(REVENUE_PROCESSOR_ROLE, admin);
    }

    /**
     * @notice Receives USDC, performs a swap for ASSA on-chain, and burns the ASSA.
     * @param usdcAmount The amount of USDC to swap (6 decimals).
     * @param minAssaOut The slippage guard: minimum amount of ASSA to accept (18 decimals).
     * @param deadline The transaction deadline timestamp.
     */
    function processRevenue(
        uint256 usdcAmount,
        uint256 minAssaOut,
        uint256 deadline
    ) external onlyRole(REVENUE_PROCESSOR_ROLE) nonReentrant {
        require(usdcAmount > 0, "BMEBurner: usdc amount zero");
        require(deadline >= block.timestamp, "BMEBurner: deadline expired");

        // 1. Pull USDC from processor (requires prior allowance)
        usdcToken.safeTransferFrom(msg.sender, address(this), usdcAmount);

        // 2. Approve Dex Router
        usdcToken.approve(address(dexRouter), usdcAmount);

        // 3. Setup Swap path: USDC -> ASSA
        address[] memory path = new address[](2);
        path[0] = address(usdcToken);
        path[1] = address(assaToken);

        uint256 initialAssaBalance = assaToken.balanceOf(address(this));

        // 4. Perform swap
        dexRouter.swapExactTokensForTokens(
            usdcAmount,
            minAssaOut,
            path,
            address(this),
            deadline
        );

        uint256 finalAssaBalance = assaToken.balanceOf(address(this));
        uint256 assaAcquired = finalAssaBalance - initialAssaBalance;
        require(assaAcquired >= minAssaOut, "BMEBurner: slippage check failed");

        // 5. Burn acquired ASSA
        IASSAToken(address(assaToken)).burn(assaAcquired);

        emit RevenueProcessed(usdcAmount, assaAcquired, deadline);
    }

    /**
     * @notice Admin function to update the DEX router address.
     */
    function updateDexRouter(address newRouter) external onlyRole(ADMIN_ROLE) {
        require(newRouter != address(0), "BMEBurner: router zero");
        address old = address(dexRouter);
        dexRouter = IDexRouter(newRouter);
        emit DexRouterUpdated(old, newRouter);
    }

    /**
     * @notice Admin function to update the USDC token address.
     */
    function updateUsdcToken(address newUsdc) external onlyRole(ADMIN_ROLE) {
        require(newUsdc != address(0), "BMEBurner: usdc zero");
        address old = address(usdcToken);
        usdcToken = IERC20(newUsdc);
        emit UsdcTokenUpdated(old, newUsdc);
    }
}
