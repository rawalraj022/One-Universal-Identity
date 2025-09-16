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

  // Enhanced functionality with AI and Analytics
  async analyzeIdentityRisk(): Promise<any> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await this.httpClient.post('/ai/analyze-threat', {
        userId: this.walletInfo.address,
        behaviorData: {
          loginPatterns: [{ timestamp: Date.now(), success: true }],
          deviceInfo: { fingerprint: 'mobile-device' },
          sessionDuration: 300
        }
      });

      return response.data.analysis;
    } catch (error: any) {
      throw new Error(`Risk analysis failed: ${error.response?.data?.message || error.message}`);
    }
  }


  // Cross-chain functionality
  async initiateCrossChainTransfer(
    dstChainId: number,
    amount: string,
    identityId: string
  ): Promise<any> {
    if (!this.walletInfo?.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await this.httpClient.post('/cross-chain/bridge', {
        userAddress: this.walletInfo.address,
        dstChainId,
        identityId,
        amount
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Cross-chain transfer failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getTransferStatus(txHash: string, srcChainId: number): Promise<any> {
    try {
      const response = await this.httpClient.get(`/cross-chain/status/${txHash}`, {
        params: { srcChainId }
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Status check failed: ${error.response?.data?.message || error.message}`);
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

  // Batch operations
  async batchOperations(operations: Array<{
    type: 'identity' | 'uvt' | 'watermark' | 'dao';
    data: any;
  }>): Promise<any[]> {
    const results = [];

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'identity':
            const identityResult = await this.createIdentity(operation.data.did);
            results.push({ success: true, type: 'identity', result: identityResult });
            break;
          case 'uvt':
            const uvtResult = await this.issueUVT(operation.data.credentialId, operation.data.expiresInDays);
            results.push({ success: true, type: 'uvt', result: uvtResult });
            break;
          case 'watermark':
            const watermarkResult = await this.watermarkAsset(
              operation.data.assetId,
              operation.data.assetType,
              operation.data.metadata
            );
            results.push({ success: true, type: 'watermark', result: watermarkResult });
            break;
          case 'dao':
            const daoResult = await this.createProposal(operation.data.description, operation.data.duration);
            results.push({ success: true, type: 'dao', result: daoResult });
            break;
        }
      } catch (error: any) {
        results.push({
          success: false,
          type: operation.type,
          error: error.message
        });
      }
    }

    return results;
  }

  // Enhanced error handling and retry logic
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError;
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    timestamp: number;
  }> {
    const services = {
      identity: false,
      uvt: false,
      dao: false,
      watermark: false,
      ai: false,
      analytics: false,
      crossChain: false
    };

    try {
      // Test identity service
      await this.httpClient.get('/identity/health');
      services.identity = true;
    } catch {}

    try {
      // Test UVT service
      await this.httpClient.get('/identity/uvt/health');
      services.uvt = true;
    } catch {}

    try {
      // Test DAO service
      await this.httpClient.get('/dao/health');
      services.dao = true;
    } catch {}

    try {
      // Test watermark service
      await this.httpClient.get('/watermark/health');
      services.watermark = true;
    } catch {}

    try {
      // Test AI service
      await this.httpClient.get('/ai/health');
      services.ai = true;
    } catch {}

    try {
      // Test analytics service
      await this.httpClient.get('/analytics/health');
      services.analytics = true;
    } catch {}

    try {
      // Test cross-chain service
      await this.httpClient.get('/cross-chain/health');
      services.crossChain = true;
    } catch {}

    const healthyCount = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalServices) {
      status = 'healthy';
    } else if (healthyCount >= totalServices / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      timestamp: Date.now()
    };
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