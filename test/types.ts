// Test types and interfaces

import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

export interface Signers {
  [key: string]: SignerWithAddress;
  admin: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
  user3: SignerWithAddress;
}

export interface TestContext {
  signers: Signers;
  contracts: {
    ouiIdentity?: any;
    uvtToken?: any;
    dao?: any;
    watermark?: any;
    advancedWatermark?: any;
    zkpVerifier?: any;
    compliance?: any;
    crossChainBridge?: any;
  };
}

export interface TestFixture {
  signers: Signers;
  contracts: TestContext['contracts'];
  deployContracts: () => Promise<TestContext['contracts']>;
}

export interface PerformanceMetrics {
  gasUsed: number;
  executionTime: number;
  blockNumber: number;
  timestamp: number;
}

export interface TestMetrics {
  testName: string;
  duration: number;
  gasUsed: number;
  passed: boolean;
  error?: string;
}