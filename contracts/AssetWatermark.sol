// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title OUI Digital Asset Watermarking
/// @notice Embeds and verifies OUI-based watermarks for images, audio, and video

contract AssetWatermark {
    struct WatermarkedAsset {
        bytes32 assetId;
        address owner;
        bytes32 ouiDid;
        string assetType; // "image", "audio", "video"
        string metadataHash;
        uint256 timestamp;
    }

    mapping(bytes32 => WatermarkedAsset) public assets;

    event AssetWatermarked(bytes32 indexed assetId, address indexed owner, bytes32 ouiDid, string assetType, string metadataHash, uint256 timestamp);

    /// @notice Watermark a digital asset with OUI identity
    function watermarkAsset(
        bytes32 assetId,
        bytes32 ouiDid,
        string calldata assetType,
        string calldata metadataHash
    ) external {
        require(assets[assetId].timestamp == 0, "Asset already watermarked");
        assets[assetId] = WatermarkedAsset({
            assetId: assetId,
            owner: msg.sender,
            ouiDid: ouiDid,
            assetType: assetType,
            metadataHash: metadataHash,
            timestamp: block.timestamp
        });
        emit AssetWatermarked(assetId, msg.sender, ouiDid, assetType, metadataHash, block.timestamp);
    }

    /// @notice Get watermark details for an asset
    function getWatermark(bytes32 assetId) external view returns (
        address owner,
        bytes32 ouiDid,
        string memory assetType,
        string memory metadataHash,
        uint256 timestamp
    ) {
        WatermarkedAsset memory asset = assets[assetId];
        require(asset.timestamp != 0, "Asset not watermarked");
        return (
            asset.owner,
            asset.ouiDid,
            asset.assetType,
            asset.metadataHash,
            asset.timestamp
        );
    }
}