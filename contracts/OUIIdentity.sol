// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title One Universal Identity (OUI) & Universal Verification Token (UVT)
/// @notice Core contract for universal identity and on-chain verification token

contract OUIIdentity {
    struct UniversalIdentity {
        address owner;
        bytes32 did;
        uint256 created;
        uint256 updated;
        uint256 version;
        bool active;
    }

    struct IdentityVersion {
        bytes32 did;
        address owner;
        uint256 timestamp;
        uint256 version;
        string changeType;
    }

    struct UniversalVerificationToken {
        bytes32 tokenId;
        address identityOwner;
        bytes32 credentialId;
        uint256 issuedAt;
        uint256 expiresAt;
        bool valid;
    }

    mapping(address => UniversalIdentity) public identities;
    mapping(bytes32 => UniversalVerificationToken) public uvTokens;
    mapping(address => IdentityVersion[]) public identityHistory;

    event IdentityCreated(address indexed owner, bytes32 did);
    event UVTIssued(bytes32 indexed tokenId, address indexed owner, bytes32 credentialId);
    event IdentityUpdated(address indexed owner, bytes32 did);
    event UVTRevoked(bytes32 indexed tokenId);

    /// @notice Create a universal identity
    function createIdentity(bytes32 did) external {
        require(identities[msg.sender].created == 0, "Identity already exists");
        identities[msg.sender] = UniversalIdentity({
            owner: msg.sender,
            did: did,
            created: block.timestamp,
            updated: block.timestamp,
            version: 1,
            active: true
        });

        // Add to history
        identityHistory[msg.sender].push(IdentityVersion({
            did: did,
            owner: msg.sender,
            timestamp: block.timestamp,
            version: 1,
            changeType: "created"
        }));

        emit IdentityCreated(msg.sender, did);
    }

    /// @notice Update universal identity
    function updateIdentity(bytes32 did) external {
        UniversalIdentity storage identity = identities[msg.sender];
        require(identity.created != 0, "Identity does not exist");

        uint256 newVersion = identity.version + 1;
        identity.did = did;
        identity.updated = block.timestamp;
        identity.version = newVersion;

        // Add to history
        identityHistory[msg.sender].push(IdentityVersion({
            did: did,
            owner: msg.sender,
            timestamp: block.timestamp,
            version: newVersion,
            changeType: "updated"
        }));

        emit IdentityUpdated(msg.sender, did);
    }

    /// @notice Issue a Universal Verification Token (UVT)
    function issueUVT(bytes32 credentialId, uint256 expiresAt) external returns (bytes32) {
        require(identities[msg.sender].active, "Identity not active");
        bytes32 tokenId = keccak256(abi.encodePacked(msg.sender, credentialId, block.timestamp));
        uvTokens[tokenId] = UniversalVerificationToken({
            tokenId: tokenId,
            identityOwner: msg.sender,
            credentialId: credentialId,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            valid: true
        });
        emit UVTIssued(tokenId, msg.sender, credentialId);
        return tokenId;
    }

    /// @notice Revoke a UVT
    function revokeUVT(bytes32 tokenId) external {
        UniversalVerificationToken storage token = uvTokens[tokenId];
        require(token.identityOwner == msg.sender, "Not token owner");
        require(token.valid, "Token already revoked");
        token.valid = false;
        emit UVTRevoked(tokenId);
    }

    /// @notice Check if UVT is valid
    function isUVTValid(bytes32 tokenId) external view returns (bool) {
        UniversalVerificationToken memory token = uvTokens[tokenId];
        return token.valid && block.timestamp < token.expiresAt;
    }

    /// @notice Get identity version
    function getIdentityVersion(address owner) external view returns (uint256) {
        UniversalIdentity memory identity = identities[owner];
        require(identity.created != 0, "Identity does not exist");
        return identity.version;
    }

    /// @notice Get identity history
    function getIdentityHistory(address owner) external view returns (IdentityVersion[] memory) {
        return identityHistory[owner];
    }

    /// @notice Get latest identity version details
    function getLatestIdentityVersion(address owner) external view returns (IdentityVersion memory) {
        IdentityVersion[] memory history = identityHistory[owner];
        require(history.length > 0, "No identity history found");
        return history[history.length - 1];
    }
}