// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockDexRouter
 * @notice Replicates standard Uniswap V2 swapExactTokensForTokens method 
 *         with a configurable exchange rate for testing the BMEBurner contract.
 */
contract MockDexRouter {
    using SafeERC20 for IERC20;

    // Default rate: 1 USDC (1e6) yields 10 ASSA (10e18).
    // Decimals conversion: 10 * 10^18 / 10^6 = 10 * 10^12.
    uint256 public exchangeRate = 10 * 10**12;

    function setExchangeRate(uint256 newRate) external {
        exchangeRate = newRate;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(path.length >= 2, "MockDexRouter: path invalid");
        require(deadline >= block.timestamp, "MockDexRouter: expired");

        IERC20 inputToken = IERC20(path[0]);
        IERC20 outputToken = IERC20(path[path.length - 1]);

        // Pull input tokens from caller (must be approved beforehand)
        inputToken.safeTransferFrom(msg.sender, address(this), amountIn);

        // Calculate swap output
        uint256 amountOut = amountIn * exchangeRate;
        require(amountOut >= amountOutMin, "MockDexRouter: slippage limit exceeded");

        // Send swapped tokens to destination
        outputToken.safeTransfer(to, amountOut);

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
    }
}
