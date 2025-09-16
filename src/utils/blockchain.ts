import { ethers } from 'ethers';

// Contract ABIs (simplified for this example)
const OUI_IDENTITY_ABI = [
  "function createIdentity(bytes32 did) external",
  "function updateIdentity(bytes32 did) external",
  "function issueUVT(bytes32 credentialId, uint256 expiresAt) external returns (bytes32)",
  "function revokeUVT(bytes32 tokenId) external",
  "function isUVTValid(bytes32 tokenId) external view returns (bool)"
];

const UVT_TOKEN_ABI = [
  "function mintForVerification(address to, uint256 amount, bytes32 tokenId) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

const DAO_ABI = [
  "function createProposal(string calldata description, uint256 duration) external returns (uint256)",
  "function vote(uint256 proposalId) external",
  "function executeProposal(uint256 proposalId) external",
  "function getProposal(uint256 proposalId) external view returns (address, string memory, uint256, uint256, uint256, bool)"
];

const WATERMARK_ABI = [
  "function createAdvancedWatermark(bytes32 assetId, uint8 format, uint8 watermarkType, bytes32 contentHash, bytes32 metadataHash, string calldata uri, bytes calldata signature) external payable",
  "function getLatestWatermark(bytes32 assetId) external view returns (tuple(bytes32, uint8, uint8, bytes32, bytes32, address, address, uint256, uint256, string, bytes, bool))"
];

// Contract addresses (would be loaded from deployment files in production)
const CONTRACT_ADDRESSES = {
  ouiIdentity: process.env.OUI_IDENTITY_ADDRESS || '0x0000000000000000000000000000000000000000',
  uvtToken: process.env.UVT_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
  dao: process.env.DAO_ADDRESS || '0x0000000000000000000000000000000000000000',
  watermark: process.env.WATERMARK_ADDRESS || '0x0000000000000000000000000000000000000000',
  crossChainBridge: process.env.CROSS_CHAIN_BRIDGE_ADDRESS || '0x0000000000000000000000000000000000000000',
  zkpVerifier: process.env.ZKP_VERIFIER_ADDRESS || '0x0000000000000000000000000000000000000000',
  compliance: process.env.COMPLIANCE_ADDRESS || '0x0000000000000000000000000000000000000000'
};

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contracts: { [key: string]: ethers.Contract } = {};

  async initialize() {
    try {
      // Initialize provider
      const rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize signer (if private key is provided)
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }

      // Initialize contracts
      await this.initializeContracts();

      console.log('✅ Blockchain connection initialized');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain connection:', error);
      throw error;
    }
  }

  private async initializeContracts() {
    if (!this.provider) throw new Error('Provider not initialized');

    // Use signer if available, otherwise use provider for read-only operations
    const contractSigner = this.signer || this.provider;

    this.contracts = {
      ouiIdentity: new ethers.Contract(CONTRACT_ADDRESSES.ouiIdentity, OUI_IDENTITY_ABI, contractSigner),
      uvtToken: new ethers.Contract(CONTRACT_ADDRESSES.uvtToken, UVT_TOKEN_ABI, contractSigner),
      dao: new ethers.Contract(CONTRACT_ADDRESSES.dao, DAO_ABI, contractSigner),
      watermark: new ethers.Contract(CONTRACT_ADDRESSES.watermark, WATERMARK_ABI, contractSigner)
    };
  }

  getContract(name: string): ethers.Contract {
    const contract = this.contracts[name];
    if (!contract) {
      throw new Error(`Contract ${name} not found`);
    }
    return contract;
  }

  getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  async getNetworkInfo() {
    if (!this.provider) return null;
    return await this.provider.getNetwork();
  }

  async getGasPrice() {
    if (!this.provider) return null;
    return await this.provider.getFeeData();
  }
}

// Global blockchain service instance
const blockchainService = new BlockchainService();

export async function initializeBlockchainConnection() {
  await blockchainService.initialize();
  return blockchainService;
}

export function getBlockchainService() {
  return blockchainService;
}

export { CONTRACT_ADDRESSES };