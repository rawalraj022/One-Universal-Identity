/**
 * Simple OUI API Server for AIdentiCore Integration
 * Provides the API endpoints needed by the AIdentiCore system
 * This serves as a lightweight implementation for testing and development
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'OUI API Server Running'
  });
});

// Generate unique IDs
function generateUniqueId(prefix = 'oui') {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

function generateWatermarkId() {
  return `asset_${crypto.randomBytes(16).toString('hex')}`;
}

// ========================================
// IDENTITY API ENDPOINTS
// ========================================

// Create identity
app.post('/api/identity/register', (req, res) => {
  try {
    const { did, universalId, metadata } = req.body;

    if (!did || !universalId) {
      return res.status(400).json({
        success: false,
        error: 'DID and Universal ID are required'
      });
    }

    const identityId = generateUniqueId('identity');
    const identityData = {
      id: identityId,
      did,
      universalId,
      status: 'active',
      createdAt: new Date().toISOString(),
      metadata: metadata || {}
    };

    console.log(`✅ Identity registered: ${did} -> ${universalId}`);

    res.json({
      success: true,
      identity: identityData,
      message: 'Identity registered successfully'
    });
  } catch (error) {
    console.error('❌ Identity registration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Issue UVT (Universal Verification Token)
app.post('/api/identity/issue-uvt', (req, res) => {
  try {
    const { credentialId, universalId, expiresIn } = req.body;

    if (!credentialId || !universalId) {
      return res.status(400).json({
        success: false,
        error: 'Credential ID and Universal ID are required'
      });
    }

    const tokenId = generateUniqueId('uvt');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresIn || 365));

    const uvtData = {
      tokenId,
      credentialId,
      universalId,
      status: 'active',
      issuedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      blockchainTxHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainNetwork: 'ethereum'
    };

    console.log(`✅ UVT issued: ${tokenId} for ${universalId}`);

    res.json({
      success: true,
      token: uvtData,
      message: 'UVT issued successfully'
    });
  } catch (error) {
    console.error('❌ UVT issuance failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify UVT
app.post('/api/identity/verify-uvt', (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        error: 'Token ID is required'
      });
    }

    // Simulate verification (in real implementation, this would check blockchain)
    const isValid = Math.random() > 0.1; // 90% success rate for testing
    const verificationResult = {
      tokenId,
      isValid,
      status: isValid ? 'active' : 'expired',
      verificationMethod: 'blockchain',
      blockchainVerified: true,
      confidenceScore: isValid ? 95 : 0,
      verifiedAt: new Date().toISOString()
    };

    console.log(`✅ UVT verified: ${tokenId} -> ${isValid ? 'VALID' : 'INVALID'}`);

    res.json({
      success: true,
      verification: verificationResult,
      message: `UVT ${isValid ? 'verified' : 'invalid or expired'}`
    });
  } catch (error) {
    console.error('❌ UVT verification failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// WATERMARK API ENDPOINTS
// ========================================

// Create watermark
app.post('/api/watermark', (req, res) => {
  try {
    const { imageUrl, assetId, universalId, metadata } = req.body;

    if (!imageUrl && !assetId) {
      return res.status(400).json({
        success: false,
        error: 'Image URL or Asset ID is required'
      });
    }

    const watermarkId = generateWatermarkId();
    const contentHash = crypto.createHash('sha256')
      .update(`${imageUrl || assetId}_${universalId}_${Date.now()}`)
      .digest('hex');

    const watermarkData = {
      watermarkId,
      assetId: assetId || `asset_${Date.now()}`,
      assetType: 'image',
      assetUrl: imageUrl,
      contentHash,
      metadataHash: crypto.createHash('sha256').update(JSON.stringify(metadata || {})).digest('hex'),
      watermarkType: 'robust',
      creatorId: universalId,
      ownerId: universalId,
      universalId,
      blockchainTxHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockchainNetwork: 'ethereum',
      contractAddress: `0x${crypto.randomBytes(20).toString('hex')}`,
      status: 'created',
      verificationScore: 95,
      lastVerifiedAt: new Date().toISOString(),
      verificationMethod: 'cryptographic',
      metadata: metadata || {},
      createdAt: new Date().toISOString()
    };

    console.log(`✅ Watermark created: ${watermarkId} for ${universalId}`);

    res.json({
      success: true,
      watermark: watermarkData,
      message: 'Blockchain watermark created successfully'
    });
  } catch (error) {
    console.error('❌ Watermark creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify watermark
app.post('/api/watermark/:watermarkId/verify', (req, res) => {
  try {
    const { watermarkId } = req.params;

    // Simulate verification (in real implementation, this would check blockchain)
    const isAuthentic = Math.random() > 0.05; // 95% success rate for testing

    const verificationResult = {
      watermarkId,
      verified: isAuthentic,
      tampered: !isAuthentic,
      confidenceScore: isAuthentic ? 95 : 20,
      validationMethod: 'cryptographic',
      blockchainVerified: true,
      verificationHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      gasUsed: Math.floor(Math.random() * 100000),
      blockchainTxHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      metadata: {
        verificationTime: new Date().toISOString(),
        blockchainConfirmations: Math.floor(Math.random() * 12) + 1
      },
      verifiedAt: new Date().toISOString()
    };

    console.log(`✅ Watermark verified: ${watermarkId} -> ${isAuthentic ? 'AUTHENTIC' : 'TAMPERED'}`);

    res.json({
      success: true,
      verification: verificationResult,
      message: `Watermark is ${isAuthentic ? 'authentic' : 'tampered or corrupted'}`
    });
  } catch (error) {
    console.error('❌ Watermark verification failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// CROSS-CHAIN BRIDGE API ENDPOINTS
// ========================================

// Initiate bridge
app.post('/api/bridge/initiate', (req, res) => {
  try {
    const { sourceUniversalId, sourceChain, targetChain, bridgeType, assetId } = req.body;

    if (!sourceUniversalId || !targetChain) {
      return res.status(400).json({
        success: false,
        error: 'Source Universal ID and Target Chain are required'
      });
    }

    const bridgeId = generateUniqueId('bridge');
    const bridgeData = {
      bridgeId,
      sourceUniversalId,
      sourceChain: sourceChain || 'ethereum',
      targetChain,
      bridgeType: bridgeType || 'identity',
      assetId,
      status: 'pending',
      confirmations: 0,
      initiatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      metadata: {
        gasEstimate: Math.floor(Math.random() * 200000),
        estimatedTime: '5-10 minutes'
      }
    };

    console.log(`✅ Bridge initiated: ${bridgeId} from ${sourceChain} to ${targetChain}`);

    res.json({
      success: true,
      bridge: bridgeData,
      message: 'Cross-chain bridge initiated successfully'
    });
  } catch (error) {
    console.error('❌ Bridge initiation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete bridge
app.post('/api/bridge/complete', (req, res) => {
  try {
    const { bridgeId, targetAddress, targetTxHash } = req.body;

    if (!bridgeId || !targetAddress) {
      return res.status(400).json({
        success: false,
        error: 'Bridge ID and Target Address are required'
      });
    }

    const bridgeResult = {
      bridgeId,
      targetAddress,
      targetTxHash: targetTxHash || `0x${crypto.randomBytes(32).toString('hex')}`,
      status: 'completed',
      confirmations: Math.floor(Math.random() * 12) + 1,
      completedAt: new Date().toISOString(),
      gasUsed: Math.floor(Math.random() * 300000),
      bridgeFee: (Math.random() * 0.01).toFixed(6)
    };

    console.log(`✅ Bridge completed: ${bridgeId} -> ${targetAddress}`);

    res.json({
      success: true,
      bridge: bridgeResult,
      message: 'Cross-chain bridge completed successfully'
    });
  } catch (error) {
    console.error('❌ Bridge completion failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get bridge status
app.get('/api/bridge/:bridgeId/status', (req, res) => {
  try {
    const { bridgeId } = req.params;

    // Simulate bridge status (in real implementation, this would check blockchain)
    const statuses = ['pending', 'processing', 'completed', 'failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const statusData = {
      bridgeId,
      status: randomStatus,
      confirmations: Math.floor(Math.random() * 12),
      progress: Math.floor(Math.random() * 100),
      estimatedTimeRemaining: randomStatus === 'completed' ? 0 : Math.floor(Math.random() * 600), // seconds
      gasUsed: Math.floor(Math.random() * 300000),
      createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString() // within last hour
    };

    console.log(`📊 Bridge status: ${bridgeId} -> ${randomStatus}`);

    res.json({
      success: true,
      status: statusData,
      message: `Bridge status: ${randomStatus}`
    });
  } catch (error) {
    console.error('❌ Bridge status check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// ANALYTICS API ENDPOINTS
// ========================================

// Get analytics
app.get('/api/analytics/:timeframe', (req, res) => {
  try {
    const { timeframe } = req.params;
    const validTimeframes = ['hour', 'day', 'week', 'month', 'year'];

    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeframe. Use: hour, day, week, month, year'
      });
    }

    // Generate mock analytics data
    const analyticsData = {
      timeframe,
      totalIdentities: Math.floor(Math.random() * 10000) + 5000,
      totalUVTs: Math.floor(Math.random() * 5000) + 2000,
      totalWatermarks: Math.floor(Math.random() * 3000) + 1000,
      totalBridges: Math.floor(Math.random() * 500) + 100,
      activeUsers: Math.floor(Math.random() * 1000) + 200,
      successRate: (Math.random() * 20 + 80).toFixed(2), // 80-100%
      averageResponseTime: Math.floor(Math.random() * 500) + 100, // ms
      blockchainOperations: Math.floor(Math.random() * 2000) + 500,
      gasUsed: Math.floor(Math.random() * 1000000) + 500000,
      generatedAt: new Date().toISOString()
    };

    console.log(`📊 Analytics requested: ${timeframe}`);

    res.json({
      success: true,
      analytics: analyticsData,
      message: `Analytics data for ${timeframe}`
    });
  } catch (error) {
    console.error('❌ Analytics request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'POST /api/identity/register',
      'POST /api/identity/issue-uvt',
      'POST /api/identity/verify-uvt',
      'POST /api/watermark',
      'POST /api/watermark/:watermarkId/verify',
      'POST /api/bridge/initiate',
      'POST /api/bridge/complete',
      'GET /api/bridge/:bridgeId/status',
      'GET /api/analytics/:timeframe'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// SERVER STARTUP
// ========================================

app.listen(PORT, () => {
  console.log(`🚀 OUI API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Available endpoints:`);
  console.log(`   POST /api/identity/register`);
  console.log(`   POST /api/identity/issue-uvt`);
  console.log(`   POST /api/identity/verify-uvt`);
  console.log(`   POST /api/watermark`);
  console.log(`   POST /api/watermark/:watermarkId/verify`);
  console.log(`   POST /api/bridge/initiate`);
  console.log(`   POST /api/bridge/complete`);
  console.log(`   GET /api/bridge/:bridgeId/status`);
  console.log(`   GET /api/analytics/:timeframe`);
  console.log(`\n✅ Ready to serve AIdentiCore integration requests!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;