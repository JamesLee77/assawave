// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ASSA WAVE Utility Token ($ASSA)
 * @notice Capped, burnable, permit, and voting-escrow compatible utility token.
 *         Main token governing the ASSA WAVE ecosystem.
 * @dev Burning uses the standard ERC20Burnable paths only: holders burn their own
 *      balance, and burnFrom always spends allowance — no role can burn another
 *      holder's tokens. The cap applies to LIFETIME issuance (`totalMinted`), so
 *      burned supply can never be re-minted.
 */
contract ASSAToken is ERC20, ERC20Permit, ERC20Votes, ERC20Burnable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant CAP = 10_000_000_000 * 10**18; // 10 Billion hard cap

    /// @notice Cumulative amount ever minted. Monotonic — burns never reduce it.
    uint256 public totalMinted;

    event TokensRecovered(address indexed token, address indexed to, uint256 amount);

    constructor(address admin)
        ERC20("ASSA WAVE", "ASSA")
        ERC20Permit("ASSA WAVE")
    {
        require(admin != address(0), "ASSAToken: admin zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /**
     * @notice Mints $ASSA tokens. Restricted to MINTER_ROLE.
     * @dev Lifetime issuance is checked against the hard cap; burning does not
     *      free headroom for new mints.
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        uint256 minted = totalMinted + amount;
        require(minted <= CAP, "ASSAToken: cap exceeded");
        totalMinted = minted;
        _mint(to, amount);
    }

    /**
     * @notice Recover other ERC-20 tokens accidentally sent to this contract (cannot recover self).
     */
    function recoverERC20(address tokenAddr, address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(tokenAddr != address(this), "ASSAToken: cannot recover self");
        require(to != address(0), "ASSAToken: to zero");
        IERC20(tokenAddr).safeTransfer(to, amount);
        emit TokensRecovered(tokenAddr, to, amount);
    }

    // -------- Required Overrides --------

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
