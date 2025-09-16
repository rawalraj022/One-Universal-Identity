// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/// @title OUI Compliance Module
/// @notice KYC/AML compliance system with regulatory reporting

contract ComplianceModule is Initializable, AccessControlUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    enum KYCStatus {
        NOT_SUBMITTED,
        PENDING,
        APPROVED,
        REJECTED,
        EXPIRED
    }

    enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        EXTREME
    }

    struct KYCProfile {
        KYCStatus status;
        RiskLevel riskLevel;
        uint256 submissionTime;
        uint256 approvalTime;
        uint256 expiryTime;
        string jurisdiction;
        bytes32 documentsHash;
        address approvedBy;
        string rejectionReason;
    }

    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        bytes32 txHash;
        string currency;
        string purpose;
        RiskLevel riskAssessment;
    }

    struct RegulatoryReport {
        uint256 reportId;
        string reportType;
        uint256 timestamp;
        bytes32 dataHash;
        string jurisdiction;
        bool submitted;
    }

    mapping(address => KYCProfile) public kycProfiles;
    mapping(bytes32 => Transaction) public transactions;
    mapping(uint256 => RegulatoryReport) public regulatoryReports;

    uint256 public kycExpiryPeriod = 365 days;
    uint256 public highRiskThreshold = 10000 * 10**18; // 10k USD equivalent
    uint256 public reportCounter;

    // Blacklist for sanctioned addresses
    mapping(address => bool) public blacklistedAddresses;
    mapping(bytes32 => bool) public blacklistedDocuments;

    event KYCSubmitted(address indexed user, bytes32 documentsHash);
    event KYCApproved(address indexed user, address indexed officer);
    event KYCRejected(address indexed user, string reason);
    event TransactionMonitored(bytes32 indexed txId, RiskLevel risk);
    event AddressBlacklisted(address indexed addr, string reason);
    event RegulatoryReportSubmitted(uint256 indexed reportId, string reportType);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_OFFICER_ROLE, admin);
    }

    /// @notice Submit KYC documents
    function submitKYC(bytes32 documentsHash, string calldata jurisdiction) external whenNotPaused {
        KYCProfile storage profile = kycProfiles[msg.sender];

        require(profile.status != KYCStatus.APPROVED || block.timestamp >= profile.expiryTime, "KYC still valid");

        profile.status = KYCStatus.PENDING;
        profile.submissionTime = block.timestamp;
        profile.documentsHash = documentsHash;
        profile.jurisdiction = jurisdiction;

        emit KYCSubmitted(msg.sender, documentsHash);
    }

    /// @notice Approve KYC (compliance officer only)
    function approveKYC(address user, RiskLevel riskLevel) external onlyRole(COMPLIANCE_OFFICER_ROLE) whenNotPaused {
        KYCProfile storage profile = kycProfiles[user];
        require(profile.status == KYCStatus.PENDING, "KYC not pending");

        profile.status = KYCStatus.APPROVED;
        profile.riskLevel = riskLevel;
        profile.approvalTime = block.timestamp;
        profile.expiryTime = block.timestamp + kycExpiryPeriod;
        profile.approvedBy = msg.sender;

        emit KYCApproved(user, msg.sender);
    }

    /// @notice Reject KYC (compliance officer only)
    function rejectKYC(address user, string calldata reason) external onlyRole(COMPLIANCE_OFFICER_ROLE) whenNotPaused {
        KYCProfile storage profile = kycProfiles[user];
        require(profile.status == KYCStatus.PENDING, "KYC not pending");

        profile.status = KYCStatus.REJECTED;
        profile.rejectionReason = reason;

        emit KYCRejected(user, reason);
    }

    /// @notice Monitor and record transaction for AML compliance
    function monitorTransaction(
        address from,
        address to,
        uint256 amount,
        bytes32 txHash,
        string calldata currency,
        string calldata purpose
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) whenNotPaused {
        require(!blacklistedAddresses[from] && !blacklistedAddresses[to], "Blacklisted address");

        RiskLevel risk = assessTransactionRisk(from, to, amount);

        transactions[txHash] = Transaction({
            from: from,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            txHash: txHash,
            currency: currency,
            purpose: purpose,
            riskAssessment: risk
        });

        // Flag high-risk transactions for manual review
        if (risk >= RiskLevel.HIGH) {
            emit TransactionMonitored(txHash, risk);
        }
    }

    /// @notice Assess transaction risk based on amount and parties
    function assessTransactionRisk(address from, address to, uint256 amount) public view returns (RiskLevel) {
        KYCProfile memory fromProfile = kycProfiles[from];
        KYCProfile memory toProfile = kycProfiles[to];

        // Check if parties are KYC approved
        if (fromProfile.status != KYCStatus.APPROVED || toProfile.status != KYCStatus.APPROVED) {
            return RiskLevel.EXTREME;
        }

        // Check risk levels
        RiskLevel maxPartyRisk = fromProfile.riskLevel > toProfile.riskLevel ? fromProfile.riskLevel : toProfile.riskLevel;

        // Check amount threshold
        if (amount >= highRiskThreshold) {
            return RiskLevel.HIGH;
        }

        return maxPartyRisk;
    }

    /// @notice Blacklist an address (compliance officer only)
    function blacklistAddress(address addr, string calldata reason) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        blacklistedAddresses[addr] = true;
        emit AddressBlacklisted(addr, reason);
    }

    /// @notice Remove address from blacklist (compliance officer only)
    function removeFromBlacklist(address addr) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        blacklistedAddresses[addr] = false;
    }

    /// @notice Submit regulatory report
    function submitRegulatoryReport(
        string calldata reportType,
        bytes32 dataHash,
        string calldata jurisdiction
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) whenNotPaused returns (uint256) {
        reportCounter++;
        regulatoryReports[reportCounter] = RegulatoryReport({
            reportId: reportCounter,
            reportType: reportType,
            timestamp: block.timestamp,
            dataHash: dataHash,
            jurisdiction: jurisdiction,
            submitted: true
        });

        emit RegulatoryReportSubmitted(reportCounter, reportType);
        return reportCounter;
    }

    /// @notice Update KYC expiry period (admin only)
    function updateKYCExpiryPeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        kycExpiryPeriod = newPeriod;
    }

    /// @notice Update high risk threshold (admin only)
    function updateHighRiskThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        highRiskThreshold = newThreshold;
    }

    /// @notice Check if address is compliant for transactions
    function isCompliant(address addr) external view returns (bool) {
        KYCProfile memory profile = kycProfiles[addr];
        return profile.status == KYCStatus.APPROVED &&
               block.timestamp < profile.expiryTime &&
               !blacklistedAddresses[addr];
    }

    /// @notice Get KYC profile details
    function getKYCProfile(address user) external view returns (
        KYCStatus status,
        RiskLevel riskLevel,
        uint256 submissionTime,
        uint256 approvalTime,
        uint256 expiryTime,
        string memory jurisdiction,
        address approvedBy
    ) {
        KYCProfile memory profile = kycProfiles[user];
        return (
            profile.status,
            profile.riskLevel,
            profile.submissionTime,
            profile.approvalTime,
            profile.expiryTime,
            profile.jurisdiction,
            profile.approvedBy
        );
    }

    /// @notice Get transaction details
    function getTransaction(bytes32 txHash) external view returns (
        address from,
        address to,
        uint256 amount,
        uint256 timestamp,
        string memory currency,
        string memory purpose,
        RiskLevel riskAssessment
    ) {
        Transaction memory tx = transactions[txHash];
        return (
            tx.from,
            tx.to,
            tx.amount,
            tx.timestamp,
            tx.currency,
            tx.purpose,
            tx.riskAssessment
        );
    }

    /// @notice Pause compliance operations (admin only)
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause compliance operations (admin only)
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Reserved storage space for future upgrades
    uint256[50] private __gap;
}