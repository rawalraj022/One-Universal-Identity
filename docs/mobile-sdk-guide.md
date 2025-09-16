# One Universal Identity (OUI) - Mobile SDK Guide

## Overview

The OUI Mobile SDK provides a comprehensive, cross-platform solution for integrating One Universal Identity into mobile applications. Built with TypeScript/JavaScript, it supports both React Native and Cordova/Ionic frameworks.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Core Features](#core-features)
5. [API Reference](#api-reference)
6. [Advanced Usage](#advanced-usage)
7. [Security](#security)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **React Native**: 0.60+
- **iOS**: Xcode 12+, iOS 11+
- **Android**: Android Studio 4+, API level 21+
- **Node.js**: 16+

### Basic Setup

```typescript
import OUIClient from '@oui/mobile-sdk';

const client = new OUIClient({
  apiBaseUrl: 'https://api.oui.com/v1',
  network: 'mainnet',
  enableOfflineMode: true,
  enableBiometrics: true
});

await client.initialize();
```

---

## Installation

### React Native

```bash
npm install @oui/mobile-sdk react-native-mmkv react-native-encrypted-storage
# or
yarn add @oui/mobile-sdk react-native-mmkv react-native-encrypted-storage
```

### iOS Setup

1. **Add to Podfile**:
```ruby
pod 'OUI-Mobile-SDK', '~> 1.0.0'
```

2. **Update Info.plist**:
```xml
<key>NSFaceIDUsageDescription</key>
<string>This app uses Face ID for biometric authentication</string>
<key>NSCameraUsageDescription</key>
<string>This app uses camera for biometric verification</string>
```

### Android Setup

1. **Add to build.gradle**:
```gradle
dependencies {
    implementation 'com.oui:mobile-sdk:1.0.0'
}
```

2. **Update AndroidManifest.xml**:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

---

## Configuration

### Client Configuration

```typescript
interface OUIConfig {
  apiBaseUrl: string;           // API endpoint URL
  network: 'mainnet' | 'testnet' | 'localhost';
  enableOfflineMode?: boolean;  // Enable offline operations
  enableBiometrics?: boolean;   // Enable biometric authentication
  enableEncryption?: boolean;   // Enable data encryption
  timeout?: number;            // Request timeout in milliseconds
  retryAttempts?: number;      // Number of retry attempts
}

const config: OUIConfig = {
  apiBaseUrl: 'https://api.oui.com/v1',
  network: 'mainnet',
  enableOfflineMode: true,
  enableBiometrics: true,
  enableEncryption: true,
  timeout: 30000,
  retryAttempts: 3
};
```

### Environment-Specific Configuration

```typescript
const getConfig = (environment: string): OUIConfig => {
  const configs = {
    development: {
      apiBaseUrl: 'http://localhost:3001',
      network: 'localhost' as const,
      enableOfflineMode: true,
      enableBiometrics: false
    },
    staging: {
      apiBaseUrl: 'https://api-staging.oui.com/v1',
      network: 'testnet' as const,
      enableOfflineMode: true,
      enableBiometrics: true
    },
    production: {
      apiBaseUrl: 'https://api.oui.com/v1',
      network: 'mainnet' as const,
      enableOfflineMode: true,
      enableBiometrics: true,
      enableEncryption: true
    }
  };

  return configs[environment] || configs.production;
};
```

---

## Core Features

### 1. Identity Management

#### Create Identity
```typescript
const did = `did:ethr:${walletAddress}`;
const identity = await ouiClient.createIdentity(did, signature);

console.log('Identity created:', identity.did);
```

#### Retrieve Identity
```typescript
const identity = await ouiClient.getIdentity();
if (identity) {
  console.log('Current identity:', identity.did);
} else {
  console.log('No identity registered');
}
```

#### Update Identity
```typescript
const newDid = `did:ethr:${walletAddress}-updated`;
const updatedIdentity = await ouiClient.createIdentity(newDid, signature);
```

### 2. UVT Operations

#### Issue UVT
```typescript
const uvt = await ouiClient.issueUVT('kyc-verification', 365);

console.log('UVT issued:', {
  tokenId: uvt.tokenId,
  credentialId: uvt.credentialId,
  expiresAt: uvt.expiresAt
});
```

#### Verify UVT
```typescript
const isValid = await ouiClient.verifyUVT(uvt.tokenId);

if (isValid) {
  console.log('UVT is valid and not expired');
} else {
  console.log('UVT is invalid or expired');
}
```

### 3. DAO Governance

#### Create Proposal
```typescript
const proposalId = await ouiClient.createProposal(
  'Upgrade AI detection module to v2.1',
  7 // 7 days voting period
);

console.log('Proposal created:', proposalId);
```

#### Vote on Proposal
```typescript
await ouiClient.voteOnProposal(proposalId);
console.log('Vote cast successfully');
```

#### Get Proposal Details
```typescript
const proposal = await ouiClient.getProposal(proposalId);
console.log('Proposal:', {
  description: proposal.description,
  voteCount: proposal.voteCount,
  executed: proposal.executed
});
```

### 4. Digital Asset Watermarking

#### Watermark Asset
```typescript
const assetMetadata = {
  title: 'Digital Artwork',
  creator: 'Artist Name',
  license: 'CC-BY-SA',
  creationDate: '2024-01-15'
};

const assetId = await ouiClient.watermarkAsset(
  'artwork-001',
  'image',
  assetMetadata
);

console.log('Asset watermarked:', assetId);
```

#### Verify Watermark
```typescript
const verification = await ouiClient.verifyWatermark(assetId);

console.log('Verification result:', {
  isAuthentic: verification.isAuthentic,
  confidenceScore: verification.confidenceScore,
  verifiedAt: verification.verifiedAt
});
```

### 5. AI Threat Detection

#### Analyze Identity Risk
```typescript
const riskAnalysis = await ouiClient.analyzeIdentityRisk();

console.log('Risk analysis:', {
  overallRisk: riskAnalysis.overallRisk,
  threatScore: riskAnalysis.threatScore,
  recommendations: riskAnalysis.recommendations
});
```

#### Specialized Detection
```typescript
// Fraud detection
const fraudResult = await ouiClient.detectFraud({
  userId: 'user-123',
  transactionData: { amount: 1000, frequency: 5 },
  behaviorData: { /* behavior patterns */ }
});

// Biometric verification
const biometricResult = await ouiClient.verifyBiometric({
  userId: 'user-123',
  biometricData: { facialFeatures: '...' }
});

// Deepfake detection
const deepfakeResult = await ouiClient.detectDeepfake({
  userId: 'user-123',
  contentData: { image: 'base64-data' }
});
```

### 6. Cross-Chain Operations

#### Bridge Identity
```typescript
const bridgeResult = await ouiClient.initiateCrossChainTransfer(
  137, // Polygon chain ID
  '0', // No native tokens
  identity.did
);

console.log('Bridge initiated:', bridgeResult.txHash);
```

#### Check Transfer Status
```typescript
const status = await ouiClient.getTransferStatus(
  bridgeResult.txHash,
  1 // Source chain ID
);

console.log('Transfer status:', status.status);
```

---

## API Reference

### OUIClient Class

#### Constructor
```typescript
new OUIClient(config: OUIConfig)
```

#### Methods

##### Authentication & Wallet
- `connectWallet(provider: any): Promise<WalletInfo>`
- `disconnectWallet(): Promise<void>`
- `getWalletInfo(): WalletInfo | null`

##### Identity Management
- `createIdentity(did: string, signature?: string): Promise<IdentityData>`
- `getIdentity(): Promise<IdentityData | null>`

##### UVT Operations
- `issueUVT(credentialId: string, expiresInDays: number): Promise<UVTData>`
- `verifyUVT(tokenId: string): Promise<boolean>`

##### DAO Governance
- `createProposal(description: string, durationInDays: number): Promise<string>`
- `voteOnProposal(proposalId: string): Promise<void>`
- `getProposal(proposalId: string): Promise<any>`

##### Asset Watermarking
- `watermarkAsset(assetId: string, assetType: string, metadata: any): Promise<string>`
- `verifyWatermark(assetId: string): Promise<any>`

##### AI Security
- `analyzeIdentityRisk(): Promise<any>`
- `getAnalytics(period?: string): Promise<any>`

##### Cross-Chain
- `initiateCrossChainTransfer(dstChainId: number, amount: string, identityId: string): Promise<any>`
- `getTransferStatus(txHash: string, srcChainId: number): Promise<any>`

##### Utility
- `batchOperations(operations: BatchOperation[]): Promise<any[]>`
- `healthCheck(): Promise<HealthCheckResult>`
- `updateConfig(config: Partial<OUIConfig>): void`

---

## Advanced Usage

### Offline Mode

```typescript
// Enable offline mode during initialization
const client = new OUIClient({
  apiBaseUrl: 'https://api.oui.com/v1',
  network: 'mainnet',
  enableOfflineMode: true
});

// Operations will be queued when offline
const identity = await client.createIdentity(did); // Works offline
const uvt = await client.issueUVT('credential', 365); // Queued for later

// Sync when back online
await client.syncOfflineOperations();
```

### Batch Operations

```typescript
const operations = [
  {
    type: 'identity',
    data: { did: 'did:ethr:user-123' }
  },
  {
    type: 'uvt',
    data: { credentialId: 'kyc-001', expiresInDays: 365 }
  },
  {
    type: 'watermark',
    data: {
      assetId: 'image-001',
      assetType: 'image',
      metadata: { title: 'My Image' }
    }
  }
];

const results = await client.batchOperations(operations);

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Operation ${index + 1} succeeded:`, result.result);
  } else {
    console.error(`Operation ${index + 1} failed:`, result.error);
  }
});
```

### Biometric Authentication

```typescript
// Configure biometrics
await client.configureBiometrics({
  enableFaceID: true,
  enableTouchID: true,
  enableBiometricPrompt: true
});

// Biometric verification
const biometricResult = await client.verifyBiometric({
  userId: 'user-123',
  biometricData: {
    facialFeatures: 'base64-encoded-data',
    voicePatterns: 'base64-encoded-data'
  }
});

if (biometricResult.verified) {
  console.log('Biometric authentication successful');
}
```

### Custom Event Listeners

```typescript
// Listen for identity events
client.on('identity.created', (data) => {
  console.log('New identity created:', data);
});

client.on('uvt.issued', (data) => {
  console.log('UVT issued:', data);
});

client.on('threat.detected', (data) => {
  console.log('Security threat detected:', data);
  // Handle security alerts
});
```

### Error Handling & Retry Logic

```typescript
try {
  const result = await client.createIdentity(did);
  console.log('Identity created:', result);
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    console.log('Network error, will retry automatically');
  } else if (error.code === 'VALIDATION_ERROR') {
    console.log('Validation error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Security

### Data Encryption

```typescript
// Enable encryption
const client = new OUIClient({
  apiBaseUrl: 'https://api.oui.com/v1',
  network: 'mainnet',
  enableEncryption: true
});

// All sensitive data is automatically encrypted
const identity = await client.createIdentity(did); // Data encrypted in transit and at rest
```

### Secure Storage

```typescript
// Store sensitive data securely
await client.secureStore.setItem('user-credentials', credentials);
await client.secureStore.setItem('biometric-templates', templates);

// Retrieve securely
const credentials = await client.secureStore.getItem('user-credentials');
const templates = await client.secureStore.getItem('biometric-templates');
```

### Certificate Pinning

```typescript
// Configure SSL certificate pinning
const client = new OUIClient({
  apiBaseUrl: 'https://api.oui.com/v1',
  network: 'mainnet',
  sslPinning: {
    enabled: true,
    certificates: ['certificate-hash-1', 'certificate-hash-2']
  }
});
```

### Rate Limiting

```typescript
// Implement client-side rate limiting
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 100,
  windowMs: 60000, // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }
};

// Use before API calls
if (!rateLimiter.canMakeRequest()) {
  throw new Error('Rate limit exceeded');
}

const result = await client.createIdentity(did);
```

---

## Troubleshooting

### Common Issues

#### 1. Wallet Connection Failed

```typescript
// Check if wallet is installed
if (!window.ethereum) {
  console.error('MetaMask or compatible wallet not found');
  // Prompt user to install wallet
}

// Check network compatibility
const chainId = await window.ethereum.request({ method: 'eth_chainId' });
if (chainId !== '0x1') { // Ethereum mainnet
  console.warn('Please switch to Ethereum mainnet');
}
```

#### 2. Biometric Authentication Failed

```typescript
// Check biometric availability
const biometricAvailable = await client.isBiometricAvailable();

if (!biometricAvailable) {
  console.warn('Biometric authentication not available on this device');
  // Fall back to other authentication methods
}

// Handle biometric errors
try {
  const result = await client.verifyBiometric(biometricData);
} catch (error) {
  if (error.code === 'BIOMETRIC_LOCKED') {
    console.log('Biometric authentication temporarily locked');
    // Prompt user to try again later
  }
}
```

#### 3. Offline Mode Issues

```typescript
// Check offline status
const isOffline = !navigator.onLine;

if (isOffline) {
  console.log('Device is offline, operations will be queued');
  // Show offline indicator to user
}

// Monitor online status
window.addEventListener('online', async () => {
  console.log('Device is back online');
  await client.syncOfflineOperations();
});

window.addEventListener('offline', () => {
  console.log('Device went offline');
});
```

#### 4. Memory Issues

```typescript
// Clear cached data periodically
setInterval(async () => {
  await client.clearCache();
  console.log('Cache cleared');
}, 30 * 60 * 1000); // Every 30 minutes

// Monitor memory usage
if ('memory' in performance) {
  const memInfo = (performance as any).memory;
  console.log('Memory usage:', {
    used: Math.round(memInfo.usedJSHeapSize / 1048576),
    total: Math.round(memInfo.totalJSHeapSize / 1048576),
    limit: Math.round(memInfo.jsHeapSizeLimit / 1048576)
  });
}
```

### Debug Logging

```typescript
// Enable debug logging
client.setLogLevel('debug');

// Log custom events
client.on('log', (level, message, data) => {
  switch (level) {
    case 'debug':
      console.debug(message, data);
      break;
    case 'info':
      console.info(message, data);
      break;
    case 'warn':
      console.warn(message, data);
      break;
    case 'error':
      console.error(message, data);
      break;
  }
});
```

### Performance Monitoring

```typescript
// Monitor API call performance
const performanceMonitor = {
  startTimer: (operation: string) => {
    return { operation, startTime: Date.now() };
  },

  endTimer: (timer: any) => {
    const duration = Date.now() - timer.startTime;

    if (duration > 5000) {
      console.warn(`Slow operation: ${timer.operation} took ${duration}ms`);
    }

    return duration;
  }
};

// Usage
const timer = performanceMonitor.startTimer('createIdentity');
const result = await client.createIdentity(did);
performanceMonitor.endTimer(timer);
```

---

## Migration Guide

### From v0.x to v1.0

#### Breaking Changes

1. **Configuration Structure**:
```typescript
// Old
const client = new OUIClient('https://api.oui.com/v1', 'mainnet');

// New
const client = new OUIClient({
  apiBaseUrl: 'https://api.oui.com/v1',
  network: 'mainnet',
  enableOfflineMode: true
});
```

2. **Error Handling**:
```typescript
// Old
try {
  await client.createIdentity(did);
} catch (error) {
  console.error(error.message);
}

// New
try {
  await client.createIdentity(did);
} catch (error) {
  console.error(error.code, error.message);
}
```

#### New Features

1. **Offline Mode**: Operations queue when offline
2. **Batch Operations**: Execute multiple operations atomically
3. **Enhanced Security**: Biometric authentication and encryption
4. **Real-time Events**: WebSocket-based event streaming

---

## Support

### Getting Help

- **Documentation**: [docs.oui.com/mobile-sdk](https://docs.oui.com/mobile-sdk)
- **API Reference**: [api.oui.com](https://api.oui.com)
- **Community**: [Discord](https://discord.gg/oui)
- **Issues**: [GitHub Issues](https://github.com/your-org/one-universal-identity/issues)

### Example Applications

Check out our example applications:

- **React Native Example**: `examples/react-native-app/`
- **Ionic Example**: `examples/ionic-app/`
- **Cordova Example**: `examples/cordova-app/`

---

## Changelog

### Version 1.0.0
- Initial release with core identity management
- UVT operations and verification
- DAO governance integration
- Digital asset watermarking
- AI-powered threat detection
- Cross-chain operations support
- Offline mode and batch operations
- Biometric authentication
- Comprehensive security features

For the latest updates, see the [changelog](https://github.com/your-org/one-universal-identity/blob/main/CHANGELOG.md).