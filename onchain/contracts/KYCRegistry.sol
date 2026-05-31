// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ASSA WAVE KYC Registry (KYCRegistry)
 * @notice On-chain source of truth for KYC-approved addresses. A single `isKYCed`
 *         boolean, written only by `KYC_OPERATOR_ROLE` after off-chain OFAC + nationality
 *         screening (US/CN and sanction filtering are enforced operationally BEFORE
 *         `setKYCed(addr, true)` — the single bool cannot encode jurisdiction/expiry;
 *         a v2 registry will add those fields).
 *
 * @dev Standalone (Decision #3): NOT coupled into TokenSale.purchase(); the sale gates
 *      on its own per-round whitelist. This registry is consumed by the frontend/backend
 *      for gating + as the canonical on-chain attestation.
 */
contract KYCRegistry is AccessControl {
    bytes32 public constant KYC_OPERATOR_ROLE = keccak256("KYC_OPERATOR_ROLE");

    mapping(address => bool) private _kyced;
    uint256 public kycedCount;

    event KYCStatusChanged(address indexed account, bool approved, address indexed operator);

    constructor(address admin) {
        require(admin != address(0), "KYC: admin zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KYC_OPERATOR_ROLE, admin);
    }

    /// @notice Whether `account` has passed KYC.
    function isKYCed(address account) external view returns (bool) {
        return _kyced[account];
    }

    /// @notice Approve or revoke a single address.
    function setKYCed(address account, bool approved) external onlyRole(KYC_OPERATOR_ROLE) {
        _setKYCed(account, approved);
    }

    /// @notice Batch approve/revoke (same status for all entries).
    function setKYCedBatch(address[] calldata accounts, bool approved)
        external
        onlyRole(KYC_OPERATOR_ROLE)
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            _setKYCed(accounts[i], approved);
        }
    }

    function _setKYCed(address account, bool approved) internal {
        require(account != address(0), "KYC: account zero");
        if (_kyced[account] == approved) return; // no-op, keep count accurate
        _kyced[account] = approved;
        if (approved) {
            kycedCount += 1;
        } else {
            kycedCount -= 1;
        }
        emit KYCStatusChanged(account, approved, msg.sender);
    }
}
