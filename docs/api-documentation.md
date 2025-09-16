# One Universal Identity (OUI) - API Documentation

## Overview

This document provides comprehensive API documentation for the One Universal Identity (OUI) system, including REST API endpoints, WebSocket events, and client SDK integration.

---

## Base URL

```
Production: https://api.oui.com/v1
Staging: https://api-staging.oui.com/v1
Development: http://localhost:3001/api
```

---

## Authentication

All API requests require authentication using JWT tokens or API keys.

### Headers

```http
Authorization: Bearer <jwt_token>
X-API-Key: <api_key>
Content-Type: application/json
```

---

## Identity Management API

### Register Identity

Register a new universal identity for a user.

```http
POST /identity/register
```

**Request Body:**
```json
{
  "did": "did:ethr:0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "owner": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "signature": "0x...",
  "metadata": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "identity": {
    "did": "did:ethr:0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "owner": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Identity registered successfully"
}
```

### Get Identity

Retrieve identity information by DID.

```http
GET /identity/{did}
```

**Response (200 OK):**
```json
{
  "did": "did:ethr:0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "identity": {
    "owner": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "uvts": ["0xabc123...", "0xdef456..."]
  },
  "retrievedAt": "2024-01-15T10:35:00Z"
}
```

### Update Identity

Update existing identity information.

```http
PUT /identity/update
```

**Request Body:**
```json
{
  "did": "did:ethr:0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "newDid": "did:ethr:0x742d35Cc6634C0532925a3b844Bc454e4438f44f",
  "signature": "0x...",
  "metadata": {
    "name": "John Smith"
  }
}
```

### Issue UVT

Issue a Universal Verification Token.

```http
POST /identity/issue-uvt
```

**Request Body:**
```json
{
  "credentialId": "kyc-verification-001",
  "expiresAt": 1705123200,
  "owner": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "metadata": {
    "type": "kyc",
    "level": "standard",
    "issuer": "compliant-kyc-provider"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "uvt": {
    "tokenId": "0xabc123def456...",
    "credentialId": "kyc-verification-001",
    "issuedAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2025-01-15T10:30:00Z",
    "valid": true,
    "issuer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
  }
}
```

### Verify UVT

Verify the validity of a UVT.

```http
GET /identity/uvt/{tokenId}
```

**Response (200 OK):**
```json
{
  "tokenId": "0xabc123def456...",
  "isValid": true,
  "checkedAt": "2024-01-15T10:35:00Z",
  "expiresAt": "2025-01-15T10:30:00Z",
  "timeRemaining": 31536000
}
```

---

## DAO Governance API

### Create Proposal

Create a new DAO governance proposal.

```http
POST /dao/proposal
```

**Request Body:**
```json
{
  "description": "Upgrade AI detection module to version 2.1",
  "duration": 604800,
  "proposer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "metadata": {
    "category": "technical",
    "priority": "high",
    "estimatedCost": "50000"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "proposal": {
    "id": 123,
    "description": "Upgrade AI detection module to version 2.1",
    "proposer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "voteCount": 0,
    "startTime": "2024-01-15T10:30:00Z",
    "endTime": "2024-01-22T10:30:00Z",
    "status": "active"
  }
}
```

### Vote on Proposal

Cast a vote on an active proposal.

```http
POST /dao/vote
```

**Request Body:**
```json
{
  "proposalId": 123,
  "voter": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "vote": "yes",
  "signature": "0x..."
}
```

### Get Proposal

Retrieve proposal details.

```http
GET /dao/proposal/{proposalId}
```

**Response (200 OK):**
```json
{
  "proposal": {
    "id": 123,
    "proposer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "description": "Upgrade AI detection module to version 2.1",
    "voteCount": 45,
    "startTime": "2024-01-15T10:30:00Z",
    "endTime": "2024-01-22T10:30:00Z",
    "executed": false,
    "status": "active"
  }
}
```

---

## Digital Asset Watermarking API

### Watermark Asset

Apply watermark to a digital asset.

```http
POST /watermark
```

**Request Body:**
```json
{
  "assetId": "0x1234567890abcdef...",
  "assetType": "image",
  "ouiDid": "did:ethr:0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "metadata": {
    "title": "Digital Artwork",
    "creator": "Artist Name",
    "license": "CC-BY-SA",
    "creationDate": "2024-01-15"
  },
  "contentHash": "0xabcdef123456...",
  "signature": "0x..."
}
```

### Verify Watermark

Verify the authenticity of a watermarked asset.

```http
POST /watermark/verify
```

**Request Body:**
```json
{
  "assetId": "0x1234567890abcdef...",
  "contentHash": "0xabcdef123456...",
  "validationMethod": "cryptographic"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "verification": {
    "assetId": "0x1234567890abcdef...",
    "isAuthentic": true,
    "isTampered": false,
    "confidenceScore": 98.5,
    "validationMethod": "cryptographic",
    "verifiedAt": "2024-01-15T10:35:00Z"
  }
}
```

---

## AI Threat Detection API

### Analyze Threat

Perform comprehensive threat analysis on user data.

```http
POST /ai/analyze-threat
```

**Request Body:**
```json
{
  "userId": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "behaviorData": {
    "loginPatterns": [
      {
        "timestamp": 1705123200,
        "ipAddress": "192.168.1.1",
        "success": true,
        "location": "New York, US"
      }
    ],
    "deviceInfo": {
      "fingerprint": "device-abc123",
      "os": "iOS",
      "browser": "Safari"
    }
  },
  "biometricData": {
    "facialFeatures": "base64-encoded-data",
    "voicePatterns": "base64-encoded-data"
  },
  "transactionData": {
    "amount": 1000,
    "frequency": 5,
    "location": "New York, US"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "userId": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "analysis": {
    "overallRisk": "low",
    "threatScore": 15.2,
    "detectedThreats": [
      {
        "modelName": "behavior_analysis",
        "threatType": "anomaly",
        "confidence": 0.12,
        "riskLevel": "low",
        "details": "Minor behavioral anomaly detected"
      }
    ],
    "recommendations": [
      "Continue monitoring user activity"
    ],
    "processingTime": 145,
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

### Fraud Detection

Specialized fraud detection endpoint.

```http
POST /ai/detect-fraud
```

### Biometric Verification

Verify user biometric data.

```http
POST /ai/verify-biometric
```

### Deepfake Detection

Detect deepfake content.

```http
POST /ai/detect-deepfake
```

---

## Analytics & Monitoring API

### Get System Dashboard

Retrieve comprehensive system analytics.

```http
GET /analytics/dashboard
```

**Response (200 OK):**
```json
{
  "systemHealth": {
    "status": "healthy",
    "uptime": 99.9,
    "performance": 95.2
  },
  "securityStatus": {
    "threatLevel": "low",
    "compliance": 98.5,
    "incidents": 3
  },
  "usageStats": {
    "activeUsers": 1250,
    "growth": 8.5,
    "efficiency": 92.3
  },
  "keyMetrics": {
    "totalIdentities": 15420,
    "totalUVTs": 8750,
    "networkLoad": 45000,
    "avgResponseTime": 145
  }
}
```

### Get Security Analytics

Retrieve security-related metrics.

```http
GET /analytics/security
```

### Get Usage Statistics

Retrieve user activity and usage metrics.

```http
GET /analytics/usage
```

---

## Cross-Chain Operations API

### Initiate Bridge Transfer

Transfer identity or assets across chains.

```http
POST /cross-chain/bridge
```

**Request Body:**
```json
{
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "dstChainId": 137,
  "identityId": "0xabc123...",
  "amount": "1.5",
  "adapterParams": "0x..."
}
```

### Estimate Bridge Fee

Get estimated fee for cross-chain transfer.

```http
GET /cross-chain/estimate-fee?dstChainId=137&amount=1.5
```

**Response (200 OK):**
```json
{
  "estimatedFee": "0.005",
  "dstChainId": 137,
  "amount": "1.5",
  "estimatedTime": 300
}
```

### Get Bridge Status

Check status of bridge transaction.

```http
GET /cross-chain/status/{txHash}?srcChainId=1
```

### Get Supported Chains

Retrieve list of supported blockchain networks.

```http
GET /cross-chain/chains
```

---

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": "Additional error details",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `AUTHENTICATION_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Rate Limits

API endpoints have rate limits to ensure fair usage:

- **Identity endpoints**: 100 requests/minute
- **DAO endpoints**: 50 requests/minute
- **Analytics endpoints**: 200 requests/minute
- **AI endpoints**: 30 requests/minute
- **Cross-chain endpoints**: 20 requests/minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705123800
```

---

## WebSocket Events

Real-time updates via WebSocket connection.

```javascript
const ws = new WebSocket('wss://api.oui.com/v1/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Available Events

- `identity.updated`: Identity information changed
- `uvt.issued`: New UVT issued
- `proposal.created`: New DAO proposal
- `vote.cast`: Vote cast on proposal
- `asset.watermarked`: Asset watermarked
- `threat.detected`: Security threat detected
- `bridge.completed`: Cross-chain transfer completed

---

## SDK Integration

### JavaScript/TypeScript SDK

```javascript
import { createOUIClient } from '@oui/sdk';

const client = createOUIClient('https://api.oui.com/v1', 'mainnet');

// Connect wallet
await client.connectWallet(window.ethereum);

// Register identity
const identity = await client.createIdentity('did:ethr:0x...');

// Issue UVT
const uvt = await client.issueUVT('kyc-001', 365);

// Analyze threats
const analysis = await client.analyzeIdentityRisk();
```

### Mobile SDK (React Native)

```javascript
import OUIClient from '@oui/mobile-sdk';

const client = new OUIClient({
  apiBaseUrl: 'https://api.oui.com/v1',
  network: 'mainnet'
});

// Initialize
await client.initialize();

// Use SDK methods
const identity = await client.createIdentity(did);
```

---

## Changelog

### Version 1.0.0
- Initial API release
- Core identity management
- UVT issuance and verification
- DAO governance
- Digital asset watermarking
- AI threat detection
- Cross-chain operations
- Analytics and monitoring

For more detailed examples and advanced usage, see the [Examples Documentation](./examples.md).