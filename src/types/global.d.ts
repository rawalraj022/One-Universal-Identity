// Global type definitions for One Universal Identity

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IdentityData {
  did: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface UVTData {
  tokenId: string;
  credentialId: string;
  owner: string;
  issuedAt: number;
  expiresAt: number;
  status: 'active' | 'expired' | 'revoked';
}

export interface ContractAddresses {
  OUIIdentity: string;
  uvtToken: string;
  dao: string;
  watermark: string;
  crossChainBridge: string;
  zkpVerifier: string;
  compliance: string;
}

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  privateKey?: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        did: string;
        role: string;
      };
      startTime?: number;
    }
  }
}