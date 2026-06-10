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
 *      The floor holds for the contract's lifetime: it is checked both at construction
 *      and on every `updateDelay`, so no governance proposal can drop below it.
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
        _checkDelayFloor(minDelay);
    }

    /**
     * @dev OZ's updateDelay is self-administered (callable only by the timelock
     *      executing a scheduled operation), but without this override a single
     *      governance proposal could permanently remove the mainnet exit window
     *      via `updateDelay(0)`. Re-apply the floor on every change.
     */
    function updateDelay(uint256 newDelay) public virtual override {
        _checkDelayFloor(newDelay);
        super.updateDelay(newDelay);
    }

    function _checkDelayFloor(uint256 newDelay) internal view {
        if (_floorEnforced()) {
            require(newDelay >= MIN_DELAY_FLOOR, "Timelock: below 48h floor");
        }
    }

    /// @dev Floor applies on Base mainnet only; virtual so a test harness can force it on.
    function _floorEnforced() internal view virtual returns (bool) {
        return block.chainid == MAINNET_CHAIN_ID;
    }
}
