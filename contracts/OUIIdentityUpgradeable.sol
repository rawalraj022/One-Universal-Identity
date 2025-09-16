// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/// @title Upgradeable One Universal Identity (OUI) & Universal Verification Token (UVT)
/// @notice Upgradeable version of OUIIdentity with advanced features

contract OUIIdentityUpgradeable is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    struct UniversalIdentity {
        address owner;
        bytes32 did;
        uint256 created;
        uint256 updated;
        bool active;
        uint256 reputationScore;
        uint256 totalUVTs;
    }

    struct UniversalVerificationToken {
        bytes32 tokenId;
        address identityOwner;
        bytes32 credentialId;
        uint256 issuedAt;
        uint256 expiresAt;
        bool valid;
        string tokenType;
        uint256 verificationCount;
    }

    mapping(address => UniversalIdentity) public identities;
    mapping(bytes32 => UniversalVerificationToken) public uvTokens;

    // Advanced features
    uint256 public totalIdentities;
    uint256 public totalUVTs;
    uint256 public minReputationScore;
    uint256 public maxUVTsPerIdentity;

    // Events
    event IdentityCreated(address indexed owner, bytes32 did, uint256 reputationScore);
    event UVTIssued(bytes32 indexed tokenId, address indexed owner, bytes32 credentialId, string tokenType);
    event ReputationUpdated(address indexed identity, uint256 newScore);
    event EmergencyAction(address indexed admin, string action);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        uint256 _minReputationScore,
        uint256 _maxUVTsPerIdentity
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        minReputationScore = _minReputationScore;
        maxUVTsPerIdentity = _maxUVTsPerIdentity;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Create a universal identity with initial reputation
    function createIdentity(bytes32 did) external whenNotPaused nonReentrant {
        require(identities[msg.sender].created == 0, "Identity already exists");
        require(bytes32(did) != bytes32(0), "Invalid DID");

        identities[msg.sender] = UniversalIdentity({
            owner: msg.sender,
            did: did,
            created: block.timestamp,
            updated: block.timestamp,
            active: true,
            reputationScore: minReputationScore,
            totalUVTs: 0
        });

        totalIdentities++;
        emit IdentityCreated(msg.sender, did, minReputationScore);
    }

    /// @notice Update universal identity
    function updateIdentity(bytes32 did) external whenNotPaused nonReentrant {
        UniversalIdentity storage identity = identities[msg.sender];
        require(identity.created != 0, "Identity does not exist");
        require(identity.active, "Identity is deactivated");

        identity.did = did;
        identity.updated = block.timestamp;
        emit IdentityUpdated(msg.sender, did);
    }

    /// @notice Issue a Universal Verification Token with type
    function issueUVT(
        bytes32 credentialId,
        uint256 expiresAt,
        string calldata tokenType
    ) external whenNotPaused nonReentrant returns (bytes32) {
        UniversalIdentity storage identity = identities[msg.sender];
        require(identity.created != 0, "Identity does not exist");
        require(identity.active, "Identity is deactivated");
        require(identity.totalUVTs < maxUVTsPerIdentity, "Max UVTs reached");
        require(expiresAt > block.timestamp, "Invalid expiration");

        bytes32 tokenId = keccak256(abi.encodePacked(
            msg.sender,
            credentialId,
            tokenType,
            block.timestamp
        ));

        uvTokens[tokenId] = UniversalVerificationToken({
            tokenId: tokenId,
            identityOwner: msg.sender,
            credentialId: credentialId,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            valid: true,
            tokenType: tokenType,
            verificationCount: 0
        });

        identity.totalUVTs++;
        totalUVTs++;
        emit UVTIssued(tokenId, msg.sender, credentialId, tokenType);

        return tokenId;
    }

    /// @notice Revoke a UVT
    function revokeUVT(bytes32 tokenId) external whenNotPaused nonReentrant {
        UniversalVerificationToken storage token = uvTokens[tokenId];
        require(token.identityOwner == msg.sender || owner() == msg.sender, "Not authorized");
        require(token.valid, "Token already revoked");

        token.valid = false;
        identities[token.identityOwner].totalUVTs--;

        emit UVTRevoked(tokenId);
    }

    /// @notice Check if UVT is valid and increment verification count
    function isUVTValid(bytes32 tokenId) external returns (bool) {
        UniversalVerificationToken storage token = uvTokens[tokenId];
        if (!token.valid || block.timestamp > token.expiresAt) {
            return false;
        }

        token.verificationCount++;
        return true;
    }

    /// @notice Update identity reputation score
    function updateReputation(address identityOwner, uint256 newScore) external onlyOwner {
        UniversalIdentity storage identity = identities[identityOwner];
        require(identity.created != 0, "Identity does not exist");

        identity.reputationScore = newScore;
        emit ReputationUpdated(identityOwner, newScore);
    }

    /// @notice Emergency pause all operations
    function emergencyPause() external onlyOwner {
        _pause();
        emit EmergencyAction(msg.sender, "Contract paused");
    }

    /// @notice Emergency unpause operations
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emit EmergencyAction(msg.sender, "Contract unpaused");
    }

    /// @notice Get identity details
    function getIdentity(address owner) external view returns (
        bytes32 did,
        uint256 created,
        uint256 updated,
        bool active,
        uint256 reputationScore,
        uint256 totalUVTsCount
    ) {
        UniversalIdentity memory identity = identities[owner];
        require(identity.created != 0, "Identity does not exist");

        return (
            identity.did,
            identity.created,
            identity.updated,
            identity.active,
            identity.reputationScore,
            identity.totalUVTs
        );
    }

    /// @notice Get UVT details
    function getUVT(bytes32 tokenId) external view returns (
        address identityOwner,
        bytes32 credentialId,
        uint256 issuedAt,
        uint256 expiresAt,
        bool valid,
        string memory tokenType,
        uint256 verificationCount
    ) {
        UniversalVerificationToken memory token = uvTokens[tokenId];
        require(token.issuedAt != 0, "UVT does not exist");

        return (
            token.identityOwner,
            token.credentialId,
            token.issuedAt,
            token.expiresAt,
            token.valid,
            token.tokenType,
            token.verificationCount
        );
    }

    // Reserved storage space for future upgrades
    uint256[50] private __gap;
}