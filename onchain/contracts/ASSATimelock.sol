// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title ASSA WAVE Timelock (ASSATimelock)
 * @notice OZ TimelockController with a 48-hour minimum-delay floor for governance.
 *         The ultimate admin of the protocol (token roles, sale config, treasury,
 *         upgrades) is a Gnosis Safe multisig acting through this timelock.
 *
 * @dev The 48h floor is relaxed only on local dev chains (31337 hardhat / 1337) so the
 *      test/deploy rehearsal flow doesn't have to wait two days. On Base mainnet/Sepolia
 *      the floor is enforced.
 */
contract ASSATimelock is TimelockController {
    uint256 public constant MIN_DELAY_FLOOR = 48 hours;

    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {
        if (block.chainid != 31337 && block.chainid != 1337) {
            require(minDelay >= MIN_DELAY_FLOOR, "Timelock: below 48h floor");
        }
    }
}
