/**
 * One Universal Identity (OUI) - Comprehensive Usage Examples
 *
 * This file demonstrates how to use the complete OUI system including:
 * - Smart contract interactions
 * - Backend API calls
 * - Frontend integration
 * - Mobile SDK usage
 * - Cross-chain operations
 * - AI security features
 * - DAO governance
 */

import { ethers } from 'ethers';
import { OUIClient } from '../src/mobile-sdk/OUIClient';
import { OUIIdentity__factory, UVTToken__factory, DAO__factory } from '../typechain-types';

// ============================================================================
// 1. SMART CONTRACT INTERACTIONS
// ============================================================================

class OUIContractManager {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private ouiContract: any;
  private uvtContract: any;
  private daoContract: any;

  constructor(
    rpcUrl: string,
    privateKey: string,
    contractAddresses: {
      ouiIdentity: string;
      uvtToken: string;
      dao: string;
    }
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);

    this.ouiContract = OUIIdentity__factory.connect(contractAddresses.ouiIdentity, this.signer);
    this.uvtContract = UVTToken__factory.connect(contractAddresses.uvtToken, this.signer);
    this.daoContract = DAO__factory.connect(contractAddresses.dao, this.signer);
  }

  // Create a new identity
  async createIdentity(did: string, metadata: string) {
    console.log('🚀 Creating new identity...');

    const tx = await this.ouiContract.createIdentity(did, metadata);
    const receipt = await tx.wait();

    const identityId = receipt.logs[0].args[0];
    console.log(`✅ Identity created with ID: ${identityId}`);

    return identityId;
  }

  // Update identity information
  async updateIdentity(identityId: string, newMetadata: string) {
    console.log('📝 Updating identity...');

    const tx = await this.ouiContract.updateIdentity(identityId, newMetadata);
    await tx.wait();

    console.log('✅ Identity updated successfully');
  }

  // Issue UVT tokens for identity verification
  async issueUVT(identityId: string, amount: string) {
    console.log(`🪙 Issuing ${amount} UVT tokens...`);

    const tx = await this.uvtContract.mint(identityId, ethers.parseEther(amount));
    await tx.wait();

    console.log('✅ UVT tokens issued successfully');
  }

  // Stake UVT tokens
  async stakeUVT(amount: string) {
    console.log(`💰 Staking ${amount} UVT tokens...`);

    const tx = await this.uvtContract.stake(ethers.parseEther(amount));
    await tx.wait();

    console.log('✅ UVT tokens staked successfully');
  }

  // Create a DAO proposal
  async createProposal(description: string, target: string, value: string, data: string) {
    console.log('📋 Creating DAO proposal...');

    const tx = await this.daoContract.propose(description, target, ethers.parseEther(value), data);
    const receipt = await tx.wait();

    const proposalId = receipt.logs[0].args[0];
    console.log(`✅ Proposal created with ID: ${proposalId}`);

    return proposalId;
  }

  // Vote on a proposal
  async voteOnProposal(proposalId: string, support: boolean) {
    console.log(`${support ? '👍' : '👎'} Voting on proposal ${proposalId}...`);

    const tx = await this.daoContract.castVote(proposalId, support);
    await tx.wait();

    console.log('✅ Vote cast successfully');
  }

  // Execute a proposal
  async executeProposal(proposalId: string) {
    console.log('⚡ Executing proposal...');

    const tx = await this.daoContract.execute(proposalId);
    await tx.wait();

    console.log('✅ Proposal executed successfully');
  }
}

// ============================================================================
// 2. BACKEND API INTEGRATION
// ============================================================================

class OUIBackendClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Identity operations
  async createIdentity(did: string, metadata: any) {
    return this.request('/api/v1/identities', 'POST', { did, metadata });
  }

  async getIdentity(identityId: string) {
    return this.request(`/api/v1/identities/${identityId}`);
  }

  async updateIdentity(identityId: string, metadata: any) {
    return this.request(`/api/v1/identities/${identityId}`, 'PUT', { metadata });
  }

  async getIdentityHistory(identityId: string) {
    return this.request(`/api/v1/identities/${identityId}/history`);
  }

  // UVT operations
  async getUVTBalance(identityId: string) {
    return this.request(`/api/v1/uvt/balance/${identityId}`);
  }

  async transferUVT(from: string, to: string, amount: string) {
    return this.request('/api/v1/uvt/transfer', 'POST', { from, to, amount });
  }

  // Analytics
  async getIdentityAnalytics(identityId: string, timeframe: string = '7d') {
    return this.request(`/api/v1/analytics/identity/${identityId}?timeframe=${timeframe}`);
  }

  async getSystemMetrics() {
    return this.request('/api/v1/analytics/system');
  }

  // AI Security
  async requestThreatAnalysis(identityId: string, data: any) {
    return this.request('/api/v1/ai/threat-analysis', 'POST', { identityId, data });
  }

  async getThreatReport(identityId: string) {
    return this.request(`/api/v1/ai/threat-report/${identityId}`);
  }

  // Cross-chain operations
  async initiateCrossChainTransfer(chainId: string, targetChain: string, amount: string) {
    return this.request('/api/v1/cross-chain/transfer', 'POST', {
      chainId,
      targetChain,
      amount
    });
  }

  async getCrossChainStatus(transferId: string) {
    return this.request(`/api/v1/cross-chain/status/${transferId}`);
  }

  // Privacy & ZKP
  async generateZKProof(identityId: string, attributes: string[]) {
    return this.request('/api/v1/privacy/generate-proof', 'POST', {
      identityId,
      attributes
    });
  }

  async verifyZKProof(proof: any) {
    return this.request('/api/v1/privacy/verify-proof', 'POST', { proof });
  }

  // DAO operations
  async getProposals() {
    return this.request('/api/v1/dao/proposals');
  }

  async createProposal(description: string, actions: any[]) {
    return this.request('/api/v1/dao/proposals', 'POST', {
      description,
      actions
    });
  }

  async voteOnProposal(proposalId: string, vote: boolean) {
    return this.request(`/api/v1/dao/proposals/${proposalId}/vote`, 'POST', { vote });
  }
}

// ============================================================================
// 3. MOBILE SDK INTEGRATION
// ============================================================================

class OUIMobileIntegration {
  private ouiClient: OUIClient;
  private backendClient: OUIBackendClient;

  constructor(apiUrl: string, apiKey: string) {
    this.ouiClient = new OUIClient({
      apiUrl,
      apiKey,
      enableOfflineMode: true,
      enableBiometricAuth: true
    });

    this.backendClient = new OUIBackendClient(apiUrl, apiKey);
  }

  // Initialize mobile client
  async initialize() {
    console.log('📱 Initializing OUI Mobile Client...');

    await this.ouiClient.initialize();
    console.log('✅ Mobile client initialized');
  }

  // User registration flow
  async registerUser(email: string, password: string, biometricData?: any) {
    console.log('👤 Registering new user...');

    // Create identity via mobile SDK
    const identity = await this.ouiClient.createIdentity({
      email,
      password,
      biometricData,
      metadata: {
        deviceType: 'mobile',
        registrationDate: new Date().toISOString()
      }
    });

    console.log(`✅ User registered with identity: ${identity.id}`);
    return identity;
  }

  // Authentication flow
  async authenticateUser(identityId: string, authMethod: 'password' | 'biometric' = 'biometric') {
    console.log(`🔐 Authenticating user ${identityId}...`);

    const authResult = await this.ouiClient.authenticate({
      identityId,
      method: authMethod,
      options: {
        timeout: 30000,
        allowRetry: true
      }
    });

    if (authResult.success) {
      console.log('✅ Authentication successful');
      return authResult.token;
    } else {
      console.log('❌ Authentication failed');
      throw new Error('Authentication failed');
    }
  }

  // Batch operations
  async performBatchOperations(operations: any[]) {
    console.log(`⚡ Performing ${operations.length} batch operations...`);

    const results = await this.ouiClient.batchOperations(operations);
    console.log(`✅ Batch operations completed: ${results.successful.length} successful, ${results.failed.length} failed`);

    return results;
  }

  // Offline mode operations
  async performOfflineOperations() {
    console.log('🔄 Processing offline operations...');

    const offlineOperations = await this.ouiClient.getOfflineOperations();

    if (offlineOperations.length > 0) {
      console.log(`📋 Processing ${offlineOperations.length} offline operations...`);

      for (const operation of offlineOperations) {
        try {
          await this.backendClient.request(operation.endpoint, operation.method, operation.data);
          await this.ouiClient.markOperationComplete(operation.id);
        } catch (error) {
          console.error(`❌ Failed to process offline operation ${operation.id}:`, error);
        }
      }

      console.log('✅ Offline operations processed');
    } else {
      console.log('ℹ️ No offline operations to process');
    }
  }

  // Real-time notifications
  setupRealtimeNotifications() {
    console.log('🔔 Setting up real-time notifications...');

    this.ouiClient.on('identity-updated', (data) => {
      console.log('📝 Identity updated:', data);
    });

    this.ouiClient.on('security-alert', (alert) => {
      console.log('🚨 Security alert:', alert);
    });

    this.ouiClient.on('uvt-transaction', (transaction) => {
      console.log('💸 UVT transaction:', transaction);
    });
  }

  // Biometric authentication
  async setupBiometricAuth(identityId: string) {
    console.log('👆 Setting up biometric authentication...');

    const biometricResult = await this.ouiClient.setupBiometric({
      identityId,
      options: {
        fallbackToPIN: true,
        invalidateOnNewBiometric: true
      }
    });

    console.log('✅ Biometric authentication setup complete');
    return biometricResult;
  }
}

// ============================================================================
// 4. COMPREHENSIVE USAGE EXAMPLE
// ============================================================================

async function comprehensiveOUIExample() {
  console.log('🚀 Starting comprehensive OUI usage example...\n');

  // ============================================================================
  // SETUP
  // ============================================================================

  // Contract addresses (replace with your deployed addresses)
  const contractAddresses = {
    ouiIdentity: '0x1234567890123456789012345678901234567890',
    uvtToken: '0x0987654321098765432109876543210987654321',
    dao: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  };

  // Initialize contract manager
  const contractManager = new OUIContractManager(
    'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    'YOUR_PRIVATE_KEY',
    contractAddresses
  );

  // Initialize backend client
  const backendClient = new OUIBackendClient(
    'https://api.oui.com/v1',
    'YOUR_API_KEY'
  );

  // Initialize mobile integration
  const mobileClient = new OUIMobileIntegration(
    'https://api.oui.com/v1',
    'YOUR_API_KEY'
  );

  await mobileClient.initialize();

  // ============================================================================
  // IDENTITY MANAGEMENT
  // ============================================================================

  console.log('=== IDENTITY MANAGEMENT ===');

  // Create identity via contract
  const identityId = await contractManager.createIdentity(
    'did:ethr:0x1234567890123456789012345678901234567890',
    JSON.stringify({
      name: 'John Doe',
      email: 'john.doe@example.com',
      createdAt: new Date().toISOString()
    })
  );

  // Update identity via backend
  await backendClient.updateIdentity(identityId, {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St, Anytown, USA'
  });

  // Get identity information
  const identity = await backendClient.getIdentity(identityId);
  console.log('📋 Identity:', identity);

  // ============================================================================
  // UVT TOKEN OPERATIONS
  // ============================================================================

  console.log('\n=== UVT TOKEN OPERATIONS ===');

  // Issue UVT tokens
  await contractManager.issueUVT(identityId, '1000');

  // Check UVT balance
  const balance = await backendClient.getUVTBalance(identityId);
  console.log(`💰 UVT Balance: ${balance.amount} UVT`);

  // Stake UVT tokens
  await contractManager.stakeUVT('500');

  // ============================================================================
  // AI SECURITY FEATURES
  // ============================================================================

  console.log('\n=== AI SECURITY FEATURES ===');

  // Request threat analysis
  const threatAnalysis = await backendClient.requestThreatAnalysis(identityId, {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    location: 'New York, USA',
    behavior: {
      loginAttempts: 3,
      failedAttempts: 0,
      timeOfDay: '14:30',
      deviceFingerprint: 'abc123...'
    }
  });

  console.log('🛡️ Threat Analysis Result:', threatAnalysis);

  // Get threat report
  const threatReport = await backendClient.getThreatReport(identityId);
  console.log('📊 Threat Report:', threatReport);

  // ============================================================================
  // PRIVACY & ZKP
  // ============================================================================

  console.log('\n=== PRIVACY & ZKP ===');

  // Generate ZK proof for selective disclosure
  const proof = await backendClient.generateZKProof(identityId, ['name', 'age']);
  console.log('🔐 ZK Proof generated:', proof.proof);

  // Verify ZK proof
  const verification = await backendClient.verifyZKProof(proof);
  console.log(`✅ ZK Proof verification: ${verification.valid ? 'Valid' : 'Invalid'}`);

  // ============================================================================
  // CROSS-CHAIN OPERATIONS
  // ============================================================================

  console.log('\n=== CROSS-CHAIN OPERATIONS ===');

  // Initiate cross-chain transfer
  const transfer = await backendClient.initiateCrossChainTransfer(
    'ethereum',
    'polygon',
    '100'
  );
  console.log('🌉 Cross-chain transfer initiated:', transfer.transferId);

  // Check transfer status
  const status = await backendClient.getCrossChainStatus(transfer.transferId);
  console.log('📈 Transfer status:', status);

  // ============================================================================
  // DAO GOVERNANCE
  // ============================================================================

  console.log('\n=== DAO GOVERNANCE ===');

  // Create proposal
  const proposalId = await contractManager.createProposal(
    'Increase UVT reward rate to 600',
    contractAddresses.uvtToken,
    '0',
    '0x...' // Encoded function call
  );

  // Vote on proposal
  await contractManager.voteOnProposal(proposalId, true);

  // Execute proposal (if it passes)
  try {
    await contractManager.executeProposal(proposalId);
    console.log('⚡ Proposal executed successfully');
  } catch (error) {
    console.log('⏳ Proposal execution failed or not ready yet');
  }

  // ============================================================================
  // MOBILE INTEGRATION
  // ============================================================================

  console.log('\n=== MOBILE INTEGRATION ===');

  // Register user via mobile
  const mobileUser = await mobileClient.registerUser(
    'john.doe@example.com',
    'securePassword123',
    { fingerprint: 'fingerprint_data', faceId: 'face_id_data' }
  );

  // Setup biometric authentication
  await mobileClient.setupBiometricAuth(mobileUser.id);

  // Authenticate user
  const authToken = await mobileClient.authenticateUser(mobileUser.id);

  // Setup real-time notifications
  mobileClient.setupRealtimeNotifications();

  // Perform batch operations
  const batchResults = await mobileClient.performBatchOperations([
    {
      type: 'identity-update',
      data: { name: 'John Doe Updated' }
    },
    {
      type: 'uvt-transfer',
      data: { to: 'recipient_address', amount: '50' }
    }
  ]);

  // Process offline operations
  await mobileClient.performOfflineOperations();

  // ============================================================================
  // ANALYTICS & MONITORING
  // ============================================================================

  console.log('\n=== ANALYTICS & MONITORING ===');

  // Get identity analytics
  const analytics = await backendClient.getIdentityAnalytics(identityId, '30d');
  console.log('📊 Identity Analytics:', analytics);

  // Get system metrics
  const systemMetrics = await backendClient.getSystemMetrics();
  console.log('📈 System Metrics:', systemMetrics);

  // ============================================================================
  // CLEANUP & FINALIZATION
  // ============================================================================

  console.log('\n🎉 Comprehensive OUI example completed successfully!');
  console.log('📝 Summary of operations:');
  console.log(`   • Created identity: ${identityId}`);
  console.log(`   • Issued UVT tokens: 1000`);
  console.log(`   • Performed threat analysis: ${threatAnalysis.riskLevel}`);
  console.log(`   • Generated ZK proof: ${verification.valid ? 'Verified' : 'Failed'}`);
  console.log(`   • Initiated cross-chain transfer: ${transfer.transferId}`);
  console.log(`   • Created DAO proposal: ${proposalId}`);
  console.log(`   • Registered mobile user: ${mobileUser.id}`);
  console.log(`   • Completed batch operations: ${batchResults.successful.length}`);
}

// ============================================================================
// USAGE
// ============================================================================

// Run the comprehensive example
if (require.main === module) {
  comprehensiveOUIExample().catch(console.error);
}

// Export classes for external usage
export {
  OUIContractManager,
  OUIBackendClient,
  OUIMobileIntegration,
  comprehensiveOUIExample
};