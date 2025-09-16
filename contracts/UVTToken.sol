// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title Universal Verification Token (UVT) ERC-20
/// @notice Economic token for OUI verification system with advanced features

contract UVTToken is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public mintingFee; // Fee for minting UVTs
    uint256 public verificationReward; // Reward for successful verifications

    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingTimestamp;
    uint256 public stakingRewardRate; // Annual staking reward rate (basis points)

    event UVTMinted(address indexed to, uint256 amount, bytes32 indexed tokenId);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event VerificationReward(address indexed verifier, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address defaultAdmin,
        address minter,
        address pauser,
        address upgrader,
        uint256 _mintingFee,
        uint256 _verificationReward,
        uint256 _stakingRewardRate
    ) public initializer {
        __ERC20_init("Universal Verification Token", "UVT");
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(UPGRADER_ROLE, upgrader);

        mintingFee = _mintingFee;
        verificationReward = _verificationReward;
        stakingRewardRate = _stakingRewardRate;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /// @notice Mint UVTs for verified identities (only minter)
    function mintForVerification(
        address to,
        uint256 amount,
        bytes32 tokenId
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit UVTMinted(to, amount, tokenId);
    }

    /// @notice Burn UVTs when verification expires
    function burnExpiredUVT(uint256 amount) external whenNotPaused {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
    }

    /// @notice Stake UVTs for rewards
    function stake(uint256 amount) external whenNotPaused {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(amount > 0, "Cannot stake 0 tokens");

        _transfer(msg.sender, address(this), amount);
        stakingBalance[msg.sender] += amount;

        if (stakingTimestamp[msg.sender] == 0) {
            stakingTimestamp[msg.sender] = block.timestamp;
        }

        emit Staked(msg.sender, amount);
    }

    /// @notice Unstake UVTs with rewards
    function unstake(uint256 amount) external whenNotPaused nonReentrant {
        require(stakingBalance[msg.sender] >= amount, "Insufficient staked balance");

        // Calculate staking rewards
        uint256 stakingDuration = block.timestamp - stakingTimestamp[msg.sender];
        uint256 reward = (stakingBalance[msg.sender] * stakingRewardRate * stakingDuration) / (365 days * 10000);

        stakingBalance[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount + reward);

        if (stakingBalance[msg.sender] == 0) {
            stakingTimestamp[msg.sender] = 0;
        }

        emit Unstaked(msg.sender, amount, reward);
    }

    /// @notice Claim verification rewards
    function claimVerificationReward() external whenNotPaused {
        require(balanceOf(msg.sender) >= verificationReward, "Insufficient balance for reward");
        _mint(msg.sender, verificationReward);
        emit VerificationReward(msg.sender, verificationReward);
    }

    /// @notice Get staking info
    function getStakingInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 stakingTime,
        uint256 pendingRewards
    ) {
        uint256 duration = block.timestamp - stakingTimestamp[user];
        uint256 rewards = (stakingBalance[user] * stakingRewardRate * duration) / (365 days * 10000);

        return (stakingBalance[user], stakingTimestamp[user], rewards);
    }

    /// @notice Update minting fee (admin only)
    function updateMintingFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        mintingFee = newFee;
    }

    /// @notice Update verification reward (admin only)
    function updateVerificationReward(uint256 newReward) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verificationReward = newReward;
    }

    /// @notice Update staking reward rate (admin only)
    function updateStakingRewardRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate <= 5000, "Rate cannot exceed 50%");
        stakingRewardRate = newRate;
    }

    /// @notice Pause contract (pauser only)
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpause contract (pauser only)
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Transfer with fee deduction
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        uint256 fee = (amount * mintingFee) / 10000; // Fee in basis points
        uint256 netAmount = amount - fee;

        if (fee > 0) {
            _burn(msg.sender, fee);
        }

        return super.transfer(to, netAmount);
    }

    /// @notice TransferFrom with fee deduction
    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        uint256 fee = (amount * mintingFee) / 10000;
        uint256 netAmount = amount - fee;

        if (fee > 0) {
            _burn(from, fee);
        }

        return super.transferFrom(from, to, netAmount);
    }

    // Reserved storage space for future upgrades
    uint256[50] private __gap;
}