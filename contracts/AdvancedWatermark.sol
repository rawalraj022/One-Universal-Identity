// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Advanced Digital Asset Watermarking for OUI
/// @notice Enhanced watermarking with metadata validation, digital signatures, and multi-format support

contract AdvancedWatermark is Initializable, OwnableUpgradeable, PausableUpgradeable {
    using ECDSA for bytes32;

    enum AssetFormat {
        IMAGE,
        VIDEO,
        AUDIO,
        DOCUMENT,
        THREE_D_MODEL
    }

    enum WatermarkType {
        VISIBLE,
        INVISIBLE,
        ROBUST,
        FRAGILE
    }

    struct WatermarkMetadata {
        bytes32 assetId;
        AssetFormat format;
        WatermarkType watermarkType;
        bytes32 contentHash;
        bytes32 metadataHash;
        address creator;
        address owner;
        uint256 timestamp;
        uint256 version;
        string uri;
        bytes signature;
        bool verified;
    }

    struct ValidationResult {
        bool isAuthentic;
        bool isTampered;
        uint256 confidenceScore;
        string validationMethod;
        bytes32 validationProof;
    }

    mapping(bytes32 => WatermarkMetadata[]) public assetWatermarks;
    mapping(bytes32 => ValidationResult) public validationResults;
    mapping(address => bool) public authorizedValidators;

    uint256 public watermarkingFee;
    uint256 public validationFee;
    uint256 public totalWatermarks;

    event AssetWatermarked(bytes32 indexed assetId, address indexed creator, AssetFormat format, WatermarkType watermarkType);
    event WatermarkValidated(bytes32 indexed assetId, uint256 version, bool isAuthentic, uint256 confidenceScore);
    event ValidatorAuthorized(address indexed validator);
    event ValidatorRevoked(address indexed validator);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) public initializer {
        __Ownable_init(admin);
        __Pausable_init();

        authorizedValidators[admin] = true;
        watermarkingFee = 0.001 ether;
        validationFee = 0.0005 ether;
    }

    /// @notice Create advanced watermark with metadata
    function createAdvancedWatermark(
        bytes32 assetId,
        AssetFormat format,
        WatermarkType watermarkType,
        bytes32 contentHash,
        bytes32 metadataHash,
        string calldata uri,
        bytes calldata signature
    ) external payable whenNotPaused {
        require(msg.value >= watermarkingFee, "Insufficient watermarking fee");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            assetId, format, watermarkType, contentHash, metadataHash, uri, block.timestamp
        ));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address signer = ECDSA.recover(ethSignedMessageHash, signature);
        require(signer == msg.sender, "Invalid signature");

        WatermarkMetadata memory metadata = WatermarkMetadata({
            assetId: assetId,
            format: format,
            watermarkType: watermarkType,
            contentHash: contentHash,
            metadataHash: metadataHash,
            creator: msg.sender,
            owner: msg.sender,
            timestamp: block.timestamp,
            version: assetWatermarks[assetId].length + 1,
            uri: uri,
            signature: signature,
            verified: false
        });

        assetWatermarks[assetId].push(metadata);
        totalWatermarks++;

        emit AssetWatermarked(assetId, msg.sender, format, watermarkType);
    }

    /// @notice Transfer asset ownership and update watermark
    function transferAsset(
        bytes32 assetId,
        address newOwner,
        bytes32 newMetadataHash,
        bytes calldata signature
    ) external whenNotPaused {
        WatermarkMetadata[] storage watermarks = assetWatermarks[assetId];
        require(watermarks.length > 0, "Asset not watermarked");

        WatermarkMetadata storage latestWatermark = watermarks[watermarks.length - 1];
        require(latestWatermark.owner == msg.sender, "Not asset owner");

        // Verify transfer signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            assetId, newOwner, newMetadataHash, block.timestamp
        ));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        address signer = ECDSA.recover(ethSignedMessageHash, signature);
        require(signer == msg.sender, "Invalid transfer signature");

        // Create new version
        WatermarkMetadata memory newMetadata = WatermarkMetadata({
            assetId: assetId,
            format: latestWatermark.format,
            watermarkType: latestWatermark.watermarkType,
            contentHash: latestWatermark.contentHash,
            metadataHash: newMetadataHash,
            creator: latestWatermark.creator,
            owner: newOwner,
            timestamp: block.timestamp,
            version: latestWatermark.version + 1,
            uri: latestWatermark.uri,
            signature: signature,
            verified: false
        });

        assetWatermarks[assetId].push(newMetadata);
    }

    /// @notice Validate watermark authenticity
    function validateWatermark(
        bytes32 assetId,
        bytes32 contentHash,
        string calldata validationMethod
    ) public payable whenNotPaused returns (bool) {
        require(msg.value >= validationFee, "Insufficient validation fee");
        require(authorizedValidators[msg.sender], "Not authorized validator");

        WatermarkMetadata[] memory watermarks = assetWatermarks[assetId];
        require(watermarks.length > 0, "Asset not watermarked");

        WatermarkMetadata memory latestWatermark = watermarks[watermarks.length - 1];

        bool isAuthentic = (latestWatermark.contentHash == contentHash);
        bool isTampered = !isAuthentic;

        // Calculate confidence score based on validation method
        uint256 confidenceScore = calculateConfidenceScore(validationMethod, isAuthentic, latestWatermark);

        ValidationResult memory result = ValidationResult({
            isAuthentic: isAuthentic,
            isTampered: isTampered,
            confidenceScore: confidenceScore,
            validationMethod: validationMethod,
            validationProof: keccak256(abi.encodePacked(assetId, contentHash, validationMethod, block.timestamp))
        });

        validationResults[assetId] = result;
        latestWatermark.verified = isAuthentic;

        emit WatermarkValidated(assetId, latestWatermark.version, isAuthentic, confidenceScore);

        return isAuthentic;
    }

    /// @notice Calculate validation confidence score
    function calculateConfidenceScore(
        string memory method,
        bool isAuthentic,
        WatermarkMetadata memory watermark
    ) internal pure returns (uint256) {
        uint256 baseScore = isAuthentic ? 80 : 20;

        // Adjust based on watermark type
        if (watermark.watermarkType == WatermarkType.ROBUST) {
            baseScore += 15;
        } else if (watermark.watermarkType == WatermarkType.FRAGILE) {
            baseScore += 10;
        }

        // Adjust based on validation method
        if (keccak256(bytes(method)) == keccak256(bytes("cryptographic"))) {
            baseScore += 10;
        } else if (keccak256(bytes(method)) == keccak256(bytes("ml_analysis"))) {
            baseScore += 5;
        }

        return baseScore > 100 ? 100 : baseScore;
    }

    /// @notice Batch validate multiple assets
    function batchValidateWatermarks(
        bytes32[] calldata assetIds,
        bytes32[] calldata contentHashes,
        string calldata validationMethod
    ) external payable whenNotPaused returns (bool[] memory) {
        require(assetIds.length == contentHashes.length, "Mismatched array lengths");
        require(msg.value >= validationFee * assetIds.length, "Insufficient validation fee");
        require(authorizedValidators[msg.sender], "Not authorized validator");

        bool[] memory results = new bool[](assetIds.length);

        for (uint256 i = 0; i < assetIds.length; i++) {
            results[i] = validateWatermark(assetIds[i], contentHashes[i], validationMethod);
        }

        return results;
    }

    /// @notice Authorize a validator
    function authorizeValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = true;
        emit ValidatorAuthorized(validator);
    }

    /// @notice Revoke validator authorization
    function revokeValidator(address validator) external onlyOwner {
        authorizedValidators[validator] = false;
        emit ValidatorRevoked(validator);
    }

    /// @notice Update watermarking fee
    function updateWatermarkingFee(uint256 newFee) external onlyOwner {
        watermarkingFee = newFee;
    }

    /// @notice Update validation fee
    function updateValidationFee(uint256 newFee) external onlyOwner {
        validationFee = newFee;
    }

    /// @notice Get latest watermark metadata
    function getLatestWatermark(bytes32 assetId) external view returns (WatermarkMetadata memory) {
        WatermarkMetadata[] memory watermarks = assetWatermarks[assetId];
        require(watermarks.length > 0, "Asset not watermarked");
        return watermarks[watermarks.length - 1];
    }

    /// @notice Get all watermark versions for an asset
    function getWatermarkHistory(bytes32 assetId) external view returns (WatermarkMetadata[] memory) {
        return assetWatermarks[assetId];
    }

    /// @notice Get validation result for an asset
    function getValidationResult(bytes32 assetId) external view returns (ValidationResult memory) {
        return validationResults[assetId];
    }

    /// @notice Check if an asset has been watermarked
    function isAssetWatermarked(bytes32 assetId) external view returns (bool) {
        return assetWatermarks[assetId].length > 0;
    }

    /// @notice Withdraw accumulated fees (owner only)
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    /// @notice Pause contract operations
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause contract operations
    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}

    // Reserved storage space for future upgrades
    uint256[50] private __gap;
}