// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";

/// @title Proxy Contract for OUIIdentity Upgradeable
/// @notice Transparent proxy for OUIIdentity contract upgrades

contract OUIIdentityProxy is ERC1967Proxy {
    constructor(
        address _logic,
        address admin_,
        bytes memory _data
    ) ERC1967Proxy(_logic, _data) {
        ERC1967Utils.changeAdmin(admin_);
    }

    modifier ifAdmin() {
        if (msg.sender == ERC1967Utils.getAdmin()) {
            _;
        } else {
            _fallback();
        }
    }

    function admin() external ifAdmin returns (address) {
        return ERC1967Utils.getAdmin();
    }

    function implementation() external ifAdmin returns (address) {
        return ERC1967Utils.getImplementation();
    }

    function changeAdmin(address newAdmin) external ifAdmin {
        ERC1967Utils.changeAdmin(newAdmin);
    }

    function upgradeTo(address newImplementation) external ifAdmin {
        ERC1967Utils.upgradeToAndCall(newImplementation, "");
    }

    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable ifAdmin {
        ERC1967Utils.upgradeToAndCall(newImplementation, data);
    }

    receive() external payable {
        _fallback();
    }
}