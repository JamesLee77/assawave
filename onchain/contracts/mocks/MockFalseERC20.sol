// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @dev Test fixture: an ERC20-shaped token whose transfer always returns false
 *      without reverting — the failure mode SafeERC20 exists to catch.
 */
contract MockFalseERC20 {
    string public name = "False Token";
    string public symbol = "FALSE";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address, uint256) external pure returns (bool) {
        return false;
    }
}
