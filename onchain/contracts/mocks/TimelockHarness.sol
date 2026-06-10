// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ASSATimelock} from "../ASSATimelock.sol";

/**
 * @dev Test fixture: ASSATimelock with the mainnet 48h floor forced ON so the
 *      floor paths (constructor + updateDelay) are unit-testable off-mainnet.
 */
contract TimelockHarness is ASSATimelock {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) ASSATimelock(minDelay, proposers, executors, admin) {}

    function _floorEnforced() internal pure override returns (bool) {
        return true;
    }
}
