// src/mobile-sdk/OUIClient.ts
// Mobile SDK for One Universal Identity

import axios, { AxiosInstance } from 'axios';

export interface OUIConfig {
  apiBaseUrl: string;
  contractAddresses: {
    ouiIdentity: string;
    uvtToken: string;
    dao: string;
    watermark: string;
  };
  network: 'mainnet' | 'testnet' | 'localhost';
}

export interface IdentityData {
  did: string;
  publicKey: string;
  createdAt: Date;
}

export interface UVTData {
  tokenId: string;
  credentialId: string;
  issuedAt: Date;
  expiresAt: Date;
  valid: boolean;
}

export interface WalletInfo {
  address: string;
  balance: string;
  connected: boolean;
}

export class OUIClient {
  private config: OUIConfig;
  private httpClient: AxiosInstance;
  private walletInfo: WalletInfo | null = null;

  constructor(config: OUIConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OUI-Mobile-SDK/1.0'
      }
    });
  }

  // Authentication & Wallet Management
  async connectWallet(walletProvider: any): Promise<WalletInfo> {
    try {
      // Connect to wallet (MetaMask, Trust Wallet, etc.)
      const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      // Get balance
      const balance = await walletProvider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      this.walletInfo = {
        address,
        balance: parseInt(balance, 16).toString(),
        connected: true
      };

      return this.walletInfo;
    } catch (error) {
      throw new Error(`Wallet connection failed: ${error}`);
    }
  }

  async disconnectWallet(): Promise<void> {
    this.walletInfo = null;
  }

  getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }

  // Identity Management
  async createIdentity(did: string, signature?: string): Promise<IdentityData> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await this.httpClient.post('/identity/register', {
        did,
        address: this.walletInfo.address,
        signature
      });

      return {
        did,
        publicKey: response.data.publicKey,
        createdAt: new Date(response.data.createdAt)
      };
    } catch (error: any) {
      throw new Error(`Identity creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getIdentity(): Promise<IdentityData | null> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await this.httpClient.get(`/identity/${this.walletInfo.address}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get identity: ${error.response?.data?.message || error.message}`);
    }
  }

  // UVT Management
  async issueUVT(credentialId: string, expiresInDays: number = 365): Promise<UVTData> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const expiresAt = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);

      const response = await this.httpClient.post('/identity/issue-uvt', {
        credentialId,
        expiresAt,
        address: this.walletInfo.address
      });

      return {
        tokenId: response.data.tokenId,
        credentialId,
        issuedAt: new Date(),
        expiresAt: new Date(expiresAt * 1000),
        valid: true
      };
    } catch (error: any) {
      throw new Error(`UVT issuance failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async verifyUVT(tokenId: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(`/identity/uvt/${tokenId}`);
      return response.data.valid;
    } catch (error: any) {
      throw new Error(`UVT verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // DAO Operations
  async createProposal(description: string, durationInDays: number = 7): Promise<string> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const duration = durationInDays * 24 * 60 * 60; // Convert to seconds

      const response = await this.httpClient.post('/dao/proposal', {
        description,
        duration,
        address: this.walletInfo.address
      });

      return response.data.proposalId;
    } catch (error: any) {
      throw new Error(`Proposal creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async voteOnProposal(proposalId: string): Promise<void> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.httpClient.post('/dao/vote', {
        proposalId,
        address: this.walletInfo.address
      });
    } catch (error: any) {
      throw new Error(`Voting failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getProposal(proposalId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/dao/proposal/${proposalId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get proposal: ${error.response?.data?.message || error.message}`);
    }
  }

  // Digital Asset Watermarking
  async watermarkAsset(
    assetId: string,
    assetType: 'image' | 'video' | 'audio' | 'document',
    metadata: any
  ): Promise<string> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await this.httpClient.post('/watermark', {
        assetId,
        assetType,
        metadata: JSON.stringify(metadata),
        address: this.walletInfo.address
      });

      return response.data.assetId;
    } catch (error: any) {
      throw new Error(`Asset watermarking failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async verifyWatermark(assetId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/watermark/${assetId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Watermark verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Analytics & Monitoring
  async getAnalytics(period: '24h' | '7d' | '30d' = '24h'): Promise<any> {
    try {
      const response = await this.httpClient.get('/analytics/dashboard', {
        params: { period }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get analytics: ${error.response?.data?.message || error.message}`);
    }
  }

  // Utility functions
  async signMessage(message: string): Promise<string> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    // This would integrate with the wallet provider's signing method
    // Implementation depends on the specific wallet provider
    throw new Error('Sign message not implemented for current wallet provider');
  }

  async sendTransaction(to: string, amount: string, data?: string): Promise<string> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    // This would integrate with the wallet provider's transaction method
    // Implementation depends on the specific wallet provider
    throw new Error('Send transaction not implemented for current wallet provider');
  }

  // Configuration
  updateConfig(newConfig: Partial<OUIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.httpClient.defaults.baseURL = this.config.apiBaseUrl;
  }

  getConfig(): OUIConfig {
    return { ...this.config };
  }
}

// Factory function for easy initialization
export function createOUIClient(apiBaseUrl: string, network: 'mainnet' | 'testnet' | 'localhost' = 'mainnet'): OUIClient {
  const config: OUIConfig = {
    apiBaseUrl,
    network,
    contractAddresses: {
      ouiIdentity: getContractAddress('ouiIdentity', network),
      uvtToken: getContractAddress('uvtToken', network),
      dao: getContractAddress('dao', network),
      watermark: getContractAddress('watermark', network)
    }
  };

  return new OUIClient(config);
}

// Helper function to get contract addresses based on network
function getContractAddress(contract: string, network: string): string {
  // In production, these would be real deployed contract addresses
  const addresses: Record<string, Record<string, string>> = {
    mainnet: {
      ouiIdentity: '0x1234567890123456789012345678901234567890',
      uvtToken: '0x1234567890123456789012345678901234567891',
      dao: '0x1234567890123456789012345678901234567892',
      watermark: '0x1234567890123456789012345678901234567893'
    },
    testnet: {
      ouiIdentity: '0x2234567890123456789012345678901234567890',
      uvtToken: '0x2234567890123456789012345678901234567891',
      dao: '0x2234567890123456789012345678901234567892',
      watermark: '0x2234567890123456789012345678901234567893'
    },
    localhost: {
      ouiIdentity: '0x3234567890123456789012345678901234567890',
      uvtToken: '0x3234567890123456789012345678901234567891',
      dao: '0x3234567890123456789012345678901234567892',
      watermark: '0x3234567890123456789012345678901234567893'
    }
  };

  return addresses[network]?.[contract] || addresses.mainnet[contract];
}