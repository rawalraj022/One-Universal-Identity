// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title Proxy Contract for OUIIdentity Upgradeable
/// @notice Transparent proxy for OUIIdentity contract upgrades

contract OUIIdentityProxy is ERC1967Proxy {
    constructor(
        address _logic,
        address admin_,
        bytes memory _data
    ) ERC1967Proxy(_logic, _data) {
        _changeAdmin(admin_);
    }

    modifier ifAdmin() {
        if (msg.sender == _getAdmin()) {
            _;
        } else {
            _fallback();
        }
    }

    function admin() external ifAdmin returns (address) {
        return _getAdmin();
    }

    function implementation() external ifAdmin returns (address) {
        return _getImplementation();
    }

    function changeAdmin(address newAdmin) external ifAdmin {
        _changeAdmin(newAdmin);
    }

    function upgradeTo(address newImplementation) external ifAdmin {
        _upgradeTo(newImplementation);
    }

    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable ifAdmin {
        _upgradeToAndCall(newImplementation, data, true);
    }

    receive() external payable override {
        _fallback();
    }
}