// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/// @title Cross-Chain Identity Bridge for OUI
/// @notice Enables cross-chain identity and UVT transfers using LayerZero protocol

contract CrossChainIdentityBridge is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    // LayerZero interfaces (simplified)
    ILayerZeroEndpoint public lzEndpoint;

    // Chain ID mappings
    mapping(uint16 => bool) public supportedChains;
    mapping(uint16 => bytes) public trustedRemoteAddresses;

    // Bridge fees and limits
    uint256 public bridgeFee;
    uint256 public maxBridgeAmount;
    uint256 public minBridgeAmount;

    // Bridge statistics
    struct BridgeStats {
        uint256 totalBridged;
        uint256 totalFees;
        uint256 successfulTransfers;
        uint256 failedTransfers;
    }

    mapping(uint16 => BridgeStats) public chainStats;

    // Events
    event BridgeInitiated(
        address indexed user,
        uint16 indexed dstChainId,
        bytes32 indexed identityId,
        uint256 amount,
        uint256 fee
    );

    event BridgeCompleted(
        address indexed user,
        uint16 indexed srcChainId,
        bytes32 indexed identityId,
        uint256 amount
    );

    event BridgeFailed(
        address indexed user,
        uint16 indexed dstChainId,
        bytes32 indexed identityId,
        string reason
    );

    event ChainSupportAdded(uint16 chainId);
    event ChainSupportRemoved(uint16 chainId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _lzEndpoint,
        uint256 _bridgeFee,
        uint256 _maxBridgeAmount,
        uint256 _minBridgeAmount
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        lzEndpoint = ILayerZeroEndpoint(_lzEndpoint);
        bridgeFee = _bridgeFee;
        maxBridgeAmount = _maxBridgeAmount;
        minBridgeAmount = _minBridgeAmount;
    }

    /// @notice Bridge identity and UVT tokens to destination chain
    function bridgeIdentity(
        uint16 _dstChainId,
        bytes32 _identityId,
        uint256 _amount,
        bytes calldata _adapterParams
    ) external payable whenNotPaused nonReentrant {
        require(supportedChains[_dstChainId], "Chain not supported");
        require(_amount >= minBridgeAmount && _amount <= maxBridgeAmount, "Invalid bridge amount");
        require(msg.value >= bridgeFee, "Insufficient bridge fee");

        // Encode bridge data
        bytes memory payload = abi.encode(
            msg.sender,
            _identityId,
            _amount,
            block.timestamp
        );

        // Send cross-chain message via LayerZero
        lzEndpoint.send{value: msg.value - bridgeFee}(
            _dstChainId,
            trustedRemoteAddresses[_dstChainId],
            payload,
            payable(msg.sender),
            address(0),
            _adapterParams
        );

        // Update statistics
        chainStats[_dstChainId].totalBridged += _amount;
        chainStats[_dstChainId].totalFees += bridgeFee;

        emit BridgeInitiated(msg.sender, _dstChainId, _identityId, _amount, bridgeFee);
    }

    /// @notice Receive cross-chain message (called by LayerZero)
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external override whenNotPaused {
        require(msg.sender == address(lzEndpoint), "Only LayerZero endpoint");
        require(
            _srcAddress.length == trustedRemoteAddresses[_srcChainId].length &&
            keccak256(_srcAddress) == keccak256(trustedRemoteAddresses[_srcChainId]),
            "Invalid source address"
        );

        // Decode payload
        (
            address user,
            bytes32 identityId,
            uint256 amount,
            uint256 timestamp
        ) = abi.decode(_payload, (address, bytes32, uint256, uint256));

        // Process bridge completion
        _processBridgeCompletion(user, _srcChainId, identityId, amount);
    }

    function _processBridgeCompletion(
        address _user,
        uint16 _srcChainId,
        bytes32 _identityId,
        uint256 _amount
    ) internal {
        // Here you would mint UVT tokens on destination chain
        // and verify/create identity record

        // For now, emit completion event
        chainStats[_srcChainId].successfulTransfers++;

        emit BridgeCompleted(_user, _srcChainId, _identityId, _amount);
    }

    /// @notice Add support for a destination chain
    function addSupportedChain(
        uint16 _chainId,
        bytes calldata _remoteAddress
    ) external onlyOwner {
        supportedChains[_chainId] = true;
        trustedRemoteAddresses[_chainId] = _remoteAddress;

        emit ChainSupportAdded(_chainId);
    }

    /// @notice Remove support for a chain
    function removeSupportedChain(uint16 _chainId) external onlyOwner {
        supportedChains[_chainId] = false;
        delete trustedRemoteAddresses[_chainId];

        emit ChainSupportRemoved(_chainId);
    }

    /// @notice Update bridge fees
    function updateBridgeFee(uint256 _newFee) external onlyOwner {
        bridgeFee = _newFee;
    }

    /// @notice Update bridge amount limits
    function updateBridgeLimits(
        uint256 _minAmount,
        uint256 _maxAmount
    ) external onlyOwner {
        minBridgeAmount = _minAmount;
        maxBridgeAmount = _maxAmount;
    }

    /// @notice Estimate bridge fee for a destination chain
    function estimateBridgeFee(
        uint16 _dstChainId,
        bytes calldata _payload,
        bytes calldata _adapterParams
    ) external view returns (uint256) {
        return lzEndpoint.estimateFees(
            _dstChainId,
            address(this),
            _payload,
            false,
            _adapterParams
        );
    }

    /// @notice Get bridge statistics for a chain
    function getBridgeStats(uint16 _chainId) external view returns (BridgeStats memory) {
        return chainStats[_chainId];
    }

    /// @notice Get all supported chains
    function getSupportedChains() external view returns (uint16[] memory) {
        uint16[] memory chains = new uint16[](100); // Max 100 chains
        uint256 count = 0;

        for (uint16 i = 1; i <= 100 && count < 100; i++) {
            if (supportedChains[i]) {
                chains[count] = i;
                count++;
            }
        }

        // Resize array
        uint16[] memory result = new uint16[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = chains[i];
        }

        return result;
    }

    /// @notice Emergency pause bridge operations
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause bridge operations
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Withdraw accumulated fees
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    // LayerZero interface (simplified)
    interface ILayerZeroEndpoint {
        function send(
            uint16 _dstChainId,
            bytes calldata _destination,
            bytes calldata _payload,
            address payable _refundAddress,
            address _zroPaymentAddress,
            bytes calldata _adapterParams
        ) external payable;

        function estimateFees(
            uint16 _dstChainId,
            address _userApplication,
            bytes calldata _payload,
            bool _payInZRO,
            bytes calldata _adapterParams
        ) external view returns (uint256);

        function lzReceive(
            uint16 _srcChainId,
            bytes calldata _srcAddress,
            uint64 _nonce,
            bytes calldata _payload
        ) external;
    }

    // Reserved storage space for future upgrades
    uint256[50] private __gap;
}