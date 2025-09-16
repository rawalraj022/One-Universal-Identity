# One Universal Identity (OUI) - Developer Guide

## Getting Started

Welcome to the One Universal Identity (OUI) developer guide. This comprehensive guide will help you integrate OUI into your applications, understand the architecture, and leverage the full power of decentralized identity.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Smart Contract Integration](#smart-contract-integration)
4. [Backend API Integration](#backend-api-integration)
5. [Frontend Integration](#frontend-integration)
6. [Mobile SDK Integration](#mobile-sdk-integration)
7. [Security Best Practices](#security-best-practices)
8. [Testing & Debugging](#testing--debugging)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

```bash
# Required software
Node.js >= 18.0.0
npm or yarn
Git

# For blockchain development
Hardhat
ethers.js v6
MetaMask or compatible wallet
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/one-universal-identity.git
cd one-universal-identity

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration
```

### Basic Usage Example

```typescript
import { createOUIClient } from '@oui/sdk';
import { ethers } from 'ethers';

// Initialize client
const ouiClient = createOUIClient('https://api.oui.com/v1', 'mainnet');

// Connect wallet
const wallet = await ouiClient.connectWallet(window.ethereum);

// Create identity
const identity = await ouiClient.createIdentity(
  `did:ethr:${wallet.address}`
);

// Issue UVT
const uvt = await ouiClient.issueUVT('kyc-verified', 365);

// Watermark asset
const asset = await ouiClient.watermarkAsset(
  'asset-123',
  'image',
  { creator: 'Artist Name' }
);

console.log('OUI integration complete!');
```

---

## Core Concepts

### Universal Identity (DID)

A Decentralized Identifier (DID) is a unique identifier that is globally unique, resolvable, and cryptographically verifiable.

```typescript
// DID Structure
const did = 'did:ethr:0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

// DID Components:
// - did:         Method scheme
// - ethr:        Method name (Ethereum)
// - 0x...:       Method-specific identifier (Ethereum address)
```

### Universal Verification Tokens (UVT)

UVTs are cryptographic tokens that prove identity verification without revealing sensitive data.

```typescript
interface UVTData {
  tokenId: string;        // Unique token identifier
  credentialId: string;   // Type of credential (kyc, age, etc.)
  issuedAt: Date;         // Issuance timestamp
  expiresAt: Date;        // Expiration timestamp
  valid: boolean;         // Current validity status
  issuer: string;         // Issuing authority
}
```

### Zero-Knowledge Proofs (ZKP)

ZKP allows proving possession of information without revealing the information itself.

```typescript
// Selective disclosure example
const proof = await ouiClient.selectiveDisclosure({
  attributes: ['age', 'citizenship'],
  verifier: 'service-provider',
  proofType: 'range-proof'
});
```

### Cross-Chain Identity

Identity that works seamlessly across multiple blockchain networks.

```typescript
// Bridge identity to Polygon
const bridgeResult = await ouiClient.initiateCrossChainTransfer(
  137, // Polygon chain ID
  '0', // No native tokens
  identity.did
);
```

---

## Smart Contract Integration

### Contract Deployment

```typescript
import { ethers } from 'ethers';
import { OUIIdentity__factory, UVTToken__factory } from '../typechain-types';

async function deployContracts() {
  const [deployer] = await ethers.getSigners();

  // Deploy OUI Identity contract
  const ouiIdentity = await new OUIIdentity__factory(deployer).deploy();
  await ouiIdentity.waitForDeployment();

  // Deploy UVT Token contract
  const uvtToken = await new UVTToken__factory(deployer).deploy();
  await uvtToken.waitForDeployment();

  // Initialize contracts
  await uvtToken.initialize(
    deployer.address, // admin
    deployer.address, // minter
    deployer.address, // pauser
    deployer.address, // upgrader
    ethers.parseEther('0.001'), // minting fee
    ethers.parseEther('0.0005'), // verification reward
    500 // staking reward rate (5%)
  );

  return {
    ouiIdentity: await ouiIdentity.getAddress(),
    uvtToken: await uvtToken.getAddress()
  };
}
```

### Identity Management

```typescript
class IdentityManager {
  private contract: ethers.Contract;

  constructor(contractAddress: string, signer: ethers.Signer) {
    this.contract = new ethers.Contract(
      contractAddress,
      OUI_IDENTITY_ABI,
      signer
    );
  }

  async registerIdentity(did: string): Promise<string> {
    const didHash = ethers.keccak256(ethers.toUtf8Bytes(did));

    const tx = await this.contract.createIdentity(didHash);
    const receipt = await tx.wait();

    // Extract identity creation event
    const event = receipt.logs.find(log =>
      log.topics[0] === ethers.keccak256(
        ethers.toUtf8Bytes('IdentityCreated(address,bytes32)')
      )
    );

    return receipt.hash;
  }

  async issueUVT(credentialId: string, expiresInDays: number): Promise<string> {
    const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(credentialId));
    const expiresAt = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);

    const tx = await this.contract.issueUVT(credentialHash, expiresAt);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  async verifyUVT(tokenId: string): Promise<boolean> {
    return await this.contract.isUVTValid(tokenId);
  }
}
```

### Event Listening

```typescript
function setupEventListeners(contract: ethers.Contract) {
  // Listen for identity creation
  contract.on('IdentityCreated', (owner, did) => {
    console.log(`New identity created: ${did} by ${owner}`);
    // Handle identity creation event
  });

  // Listen for UVT issuance
  contract.on('UVTIssued', (tokenId, owner, credentialId) => {
    console.log(`UVT issued: ${tokenId} to ${owner}`);
    // Handle UVT issuance event
  });

  // Listen for UVT revocation
  contract.on('UVTRevoked', (tokenId) => {
    console.log(`UVT revoked: ${tokenId}`);
    // Handle UVT revocation event
  });
}
```

---

## Backend API Integration

### REST API Client

```typescript
class OUIRestClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async registerIdentity(did: string, owner: string): Promise<any> {
    return this.request('/identity/register', {
      method: 'POST',
      body: JSON.stringify({ did, owner })
    });
  }

  async issueUVT(credentialId: string, expiresAt: number): Promise<any> {
    return this.request('/identity/issue-uvt', {
      method: 'POST',
      body: JSON.stringify({ credentialId, expiresAt })
    });
  }

  async getAnalytics(): Promise<any> {
    return this.request('/analytics/dashboard');
  }

  async analyzeThreat(userData: any): Promise<any> {
    return this.request('/ai/analyze-threat', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
}
```

### WebSocket Integration

```typescript
class OUIWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'identity.updated':
        console.log('Identity updated:', data.payload);
        break;
      case 'uvt.issued':
        console.log('UVT issued:', data.payload);
        break;
      case 'threat.detected':
        console.log('Threat detected:', data.payload);
        break;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

---

## Frontend Integration

### React Hook Integration

```typescript
// hooks/useOUI.ts
import { useState, useEffect } from 'react';
import { createOUIClient } from '@oui/sdk';

export function useOUI() {
  const [client, setClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ouiClient = createOUIClient(
      process.env.REACT_APP_OUI_API_URL || 'http://localhost:3001',
      'mainnet'
    );
    setClient(ouiClient);
  }, []);

  const connectWallet = async () => {
    if (!client) return;

    try {
      setLoading(true);
      const wallet = await client.connectWallet(window.ethereum);
      setIsConnected(true);

      // Load existing identity
      const existingIdentity = await client.getIdentity();
      setIdentity(existingIdentity);

    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerIdentity = async (did: string) => {
    if (!client || !isConnected) return;

    try {
      setLoading(true);
      const newIdentity = await client.createIdentity(did);
      setIdentity(newIdentity);
    } catch (error) {
      console.error('Identity registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const issueUVT = async (credentialId: string, expiresInDays: number) => {
    if (!client || !isConnected) return;

    try {
      setLoading(true);
      const uvt = await client.issueUVT(credentialId, expiresInDays);
      // Refresh identity to include new UVT
      const updatedIdentity = await client.getIdentity();
      setIdentity(updatedIdentity);
      return uvt;
    } catch (error) {
      console.error('UVT issuance failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    client,
    isConnected,
    identity,
    loading,
    connectWallet,
    registerIdentity,
    issueUVT
  };
}
```

### React Component Example

```tsx
// components/OUIDashboard.tsx
import React from 'react';
import { useOUI } from '../hooks/useOUI';

const OUIDashboard: React.FC = () => {
  const { isConnected, identity, loading, connectWallet, registerIdentity, issueUVT } = useOUI();

  if (!isConnected) {
    return (
      <div className="connect-prompt">
        <h2>Connect Your Wallet</h2>
        <p>Connect your wallet to access One Universal Identity features.</p>
        <button onClick={connectWallet} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    );
  }

  return (
    <div className="oui-dashboard">
      <div className="identity-section">
        <h3>Your Universal Identity</h3>
        {identity ? (
          <div className="identity-info">
            <p><strong>DID:</strong> {identity.did}</p>
            <p><strong>Status:</strong> {identity.status}</p>
            <p><strong>UVTs Issued:</strong> {identity.uvts?.length || 0}</p>
          </div>
        ) : (
          <div className="register-section">
            <p>No identity registered yet.</p>
            <button
              onClick={() => registerIdentity(`did:ethr:${Date.now()}`)}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Identity'}
            </button>
          </div>
        )}
      </div>

      <div className="uvt-section">
        <h3>Universal Verification Tokens</h3>
        <button
          onClick={() => issueUVT('kyc-verified', 365)}
          disabled={loading}
        >
          {loading ? 'Issuing...' : 'Issue KYC UVT'}
        </button>
      </div>
    </div>
  );
};

export default OUIDashboard;
```

---

## Mobile SDK Integration

### React Native Setup

```bash
npm install @oui/mobile-sdk react-native-mmkv react-native-encrypted-storage
# or
yarn add @oui/mobile-sdk react-native-mmkv react-native-encrypted-storage
```

### iOS Configuration

Add to `ios/Podfile`:

```ruby
pod 'OUI-Mobile-SDK', '~> 1.0.0'
```

### Android Configuration

Add to `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.oui:mobile-sdk:1.0.0'
}
```

### Basic Usage

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import OUIClient from '@oui/mobile-sdk';

const App: React.FC = () => {
  const [client, setClient] = useState<OUIClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initializeOUI();
  }, []);

  const initializeOUI = async () => {
    const ouiClient = new OUIClient({
      apiBaseUrl: 'https://api.oui.com/v1',
      network: 'mainnet',
      enableEncryption: true,
      enableOfflineMode: true
    });

    await ouiClient.initialize();
    setClient(ouiClient);
  };

  const connectWallet = async () => {
    if (!client) return;

    try {
      const wallet = await client.connectWallet();
      setIsConnected(true);
      console.log('Wallet connected:', wallet.address);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>One Universal Identity</Text>
      <Button
        title={isConnected ? "Connected" : "Connect Wallet"}
        onPress={connectWallet}
        disabled={isConnected}
      />
    </View>
  );
};

export default App;
```

### Advanced Mobile Features

```typescript
// Identity management
const createIdentity = async () => {
  if (!client) return;

  const did = `did:ethr:${Date.now()}`;
  const identity = await client.createIdentity(did, signature);
  console.log('Identity created:', identity);
};

// Biometric authentication
const enableBiometrics = async () => {
  const biometricConfig = {
    enableFaceID: true,
    enableTouchID: true,
    enableBiometricPrompt: true
  };

  await client.configureBiometrics(biometricConfig);
};

// Offline mode
const enableOfflineMode = async () => {
  await client.enableOfflineMode();

  // Operations will be queued and synced when online
  const identity = await client.createIdentity(did); // Works offline
};

// Secure storage
const storeSecureData = async () => {
  await client.secureStore.setItem('user-preferences', userPrefs);
  const storedData = await client.secureStore.getItem('user-preferences');
};
```

---

## Security Best Practices

### API Key Management

```typescript
// Never expose API keys in client-side code
const API_CONFIG = {
  baseUrl: process.env.REACT_APP_OUI_API_URL,
  // API key should be handled server-side
};
```

### Input Validation

```typescript
function validateDID(did: string): boolean {
  const didRegex = /^did:ethr:0x[a-fA-F0-9]{40}/;
  return didRegex.test(did);
}

function validateCredentialId(credentialId: string): boolean {
  // Credential IDs should be alphanumeric with hyphens
  const credentialRegex = /^[a-zA-Z0-9-]+$/;
  return credentialRegex.test(credentialId) && credentialId.length <= 100;
}
```

### Error Handling

```typescript
class OUISecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.name = 'OUISecurityError';
  }
}

function handleSecurityError(error: any): void {
  if (error instanceof OUISecurityError) {
    switch (error.severity) {
      case 'high':
        // Log security incident
        console.error('Security incident:', error);
        // Notify security team
        break;
      case 'medium':
        console.warn('Security warning:', error);
        break;
      default:
        console.info('Security info:', error);
    }
  }
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }
}

// Usage
const apiLimiter = new RateLimiter(100, 60000); // 100 requests per minute

async function makeAPIRequest(endpoint: string, data: any) {
  if (!apiLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded');
  }

  return ouiClient.request(endpoint, data);
}
```

---

## Testing & Debugging

### Unit Testing Setup

```typescript
// tests/identity-manager.test.ts
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { IdentityManager } from '../src/identity-manager';

describe('IdentityManager', () => {
  let identityManager: IdentityManager;
  let owner: any;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    // Deploy contracts and initialize IdentityManager
    identityManager = new IdentityManager(contractAddress, owner);
  });

  describe('registerIdentity', () => {
    it('should register a valid DID', async () => {
      const did = 'did:ethr:0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      const txHash = await identityManager.registerIdentity(did);

      expect(txHash).to.be.a('string');
      expect(txHash).to.match(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should reject invalid DID format', async () => {
      const invalidDid = 'invalid-did-format';

      await expect(identityManager.registerIdentity(invalidDid))
        .to.be.rejectedWith('Invalid DID format');
    });
  });

  describe('issueUVT', () => {
    it('should issue UVT with valid parameters', async () => {
      const credentialId = 'kyc-verification-001';
      const txHash = await identityManager.issueUVT(credentialId, 365);

      expect(txHash).to.be.a('string');
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/api-integration.test.ts
import { expect } from 'chai';
import request from 'supertest';
import { app } from '../../src/server';

describe('API Integration Tests', () => {
  describe('Identity Lifecycle', () => {
    let testIdentity: any;

    it('should complete full identity lifecycle', async () => {
      // Register identity
      const registerResponse = await request(app)
        .post('/api/identity/register')
        .send({
          did: 'did:ethr:test-integration',
          owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        })
        .expect(200);

      testIdentity = registerResponse.body.identity;

      // Issue UVT
      const uvtResponse = await request(app)
        .post('/api/identity/issue-uvt')
        .send({
          credentialId: 'integration-test',
          expiresAt: Math.floor(Date.now() / 1000) + 86400,
          owner: testIdentity.owner
        })
        .expect(200);

      // Verify UVT
      await request(app)
        .get(`/api/identity/uvt/${uvtResponse.body.uvt.tokenId}`)
        .expect(200)
        .then(response => {
          expect(response.body.isValid).to.be.true;
        });
    });
  });
});
```

---

## Deployment Guide

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
OUI_API_URL=https://api.oui.com/v1
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port
JWT_SECRET=your-jwt-secret
API_ENCRYPTION_KEY=your-encryption-key
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  oui-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://db:5432/oui
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=oui
      - POSTGRES_USER=ouiuser
      - POSTGRES_PASSWORD=securepassword

  redis:
    image: redis:7-alpine
```

### Kubernetes Deployment

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oui-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: oui-backend
  template:
    metadata:
      labels:
        app: oui-backend
    spec:
      containers:
      - name: oui-backend
        image: oui/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## Troubleshooting

### Common Issues

#### 1. Contract Deployment Failures

```typescript
// Check gas limit
const gasEstimate = await contract.estimateGas.deployment();
// Increase gas limit if needed
const deployTx = await contract.deploymentTransaction({
  gasLimit: gasEstimate * 2
});
```

#### 2. API Connection Issues

```typescript
// Check API connectivity
const healthCheck = await ouiClient.healthCheck();
if (healthCheck.status !== 'healthy') {
  console.error('API health issues:', healthCheck);
}
```

#### 3. Wallet Connection Problems

```typescript
// Verify wallet compatibility
if (typeof window.ethereum === 'undefined') {
  console.error('MetaMask or compatible wallet not detected');
}

// Check network
const network = await provider.getNetwork();
if (network.chainId !== 1) {
  console.warn('Not connected to Ethereum mainnet');
}
```

#### 4. Transaction Failures

```typescript
// Handle transaction failures
try {
  const tx = await contract.someFunction(args);
  const receipt = await tx.wait();

  if (receipt.status === 0) {
    console.error('Transaction reverted');
    // Parse revert reason from logs
  }
} catch (error) {
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    console.error('Gas estimation failed - check contract logic');
  }
}
```

### Debug Logging

```typescript
// Enable debug logging
const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data);
  }
};
```

### Performance Monitoring

```typescript
// Monitor API performance
const performanceMonitor = {
  startTimer: (operation: string) => {
    return { operation, startTime: Date.now() };
  },

  endTimer: (timer: any) => {
    const duration = Date.now() - timer.startTime;
    logger.debug(`${timer.operation} took ${duration}ms`);

    // Log slow operations
    if (duration > 5000) {
      logger.warn(`Slow operation detected: ${timer.operation}`);
    }

    return duration;
  }
};
```

---

## Next Steps

1. **Explore Examples**: Check the [examples directory](./examples/) for comprehensive code samples
2. **Join the Community**: Connect with other OUI developers on [Discord](https://discord.gg/oui)
3. **Contribute**: Submit issues, feature requests, or pull requests on [GitHub](https://github.com/your-org/one-universal-identity)
4. **Stay Updated**: Follow the [changelog](./CHANGELOG.md) for new releases and features

For additional support, visit our [documentation portal](https://docs.oui.com) or contact the developer support team.