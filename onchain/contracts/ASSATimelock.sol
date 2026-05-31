// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title ASSA WAVE Timelock (ASSATimelock)
 * @notice OZ TimelockController with a 48-hour minimum-delay floor for governance.
 *         The ultimate admin of the protocol (token roles, sale config, treasury,
 *         upgrades) is a Gnosis Safe multisig acting through this timelock.
 *
 * @dev The 48h floor is enforced on Base mainnet (chainid 8453) only. Local dev chains
 *      and testnets (Base Sepolia, etc.) allow shorter delays so the full
 *      propose -> wait -> execute governance loop can be rehearsed without a two-day wait.
 */
contract ASSATimelock is TimelockController {
    uint256 public constant MIN_DELAY_FLOOR = 48 hours;
    uint256 public constant MAINNET_CHAIN_ID = 8453;

    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {
        if (block.chainid == MAINNET_CHAIN_ID) {
            require(minDelay >= MIN_DELAY_FLOOR, "Timelock: below 48h floor");
        }
    }
}
