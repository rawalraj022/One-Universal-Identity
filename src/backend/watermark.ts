// src/backend/watermark.ts
// Backend API for OUI watermarking system

import express from 'express';
import { ethers } from 'ethers';
import { getBlockchainService } from '../utils/blockchain';
import { getDatabaseService } from '../utils/database';

const router = express.Router();

/**
 * POST /watermark
 * Watermarks a digital asset
 */
router.post('/', async (req, res) => {
  try {
    const { assetId, ouiDid, assetType, metadataHash, contentHash, creator } = req.body;

    if (!assetId || !ouiDid || !assetType) {
      return res.status(400).json({ error: 'Asset ID, OUI DID, and asset type are required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('watermark');

    // Generate asset hash for watermarking
    const assetHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'bytes32', 'string', 'string'],
        [assetId, ouiDid, assetType, metadataHash || '']
      )
    );

    // For now, use mock implementation
    // In production: const tx = await contract.createAdvancedWatermark(assetId, assetType, contentHash, metadataHash, uri, signature);

    // Save to database
    const db = getDatabaseService();
    const watermarkData = {
      assetId,
      ouiDid,
      assetType,
      metadataHash: metadataHash || '',
      contentHash: contentHash || assetHash,
      creator: creator || '0x0000000000000000000000000000000000000000',
      createdAt: new Date().toISOString(),
      status: 'watermarked',
      version: 1
    };

    await db.saveWatermark(watermarkData);

    res.json({
      success: true,
      watermark: watermarkData,
      message: 'Asset watermarked successfully'
    });
  } catch (error: any) {
    console.error('Watermark creation error:', error);
    res.status(500).json({
      error: 'Failed to watermark asset',
      details: error.message
    });
  }
});

/**
 * GET /watermark/:assetId
 * Gets watermark details for an asset
 */
router.get('/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('watermark');

    // For now, use mock implementation
    // In production: const watermark = await contract.getLatestWatermark(assetId);

    // Get from database
    const db = getDatabaseService();
    const watermark = await db.getWatermark(assetId);

    if (!watermark.exists) {
      return res.status(404).json({ error: 'Asset not watermarked' });
    }

    res.json({
      assetId,
      watermark,
      retrievedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Watermark retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve watermark',
      details: error.message
    });
  }
});

/**
 * POST /watermark/verify
 * Verifies a watermarked asset
 */
router.post('/verify', async (req, res) => {
  try {
    const { assetId, contentHash, validationMethod } = req.body;

    if (!assetId || !contentHash) {
      return res.status(400).json({ error: 'Asset ID and content hash are required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('watermark');

    // For now, use mock verification
    // In production: const result = await contract.validateWatermark(assetId, contentHash, validationMethod);

    const isAuthentic = Math.random() > 0.1; // Mock authenticity check
    const confidenceScore = isAuthentic ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 10;

    const verificationResult = {
      assetId,
      isAuthentic,
      isTampered: !isAuthentic,
      confidenceScore,
      validationMethod: validationMethod || 'cryptographic',
      validationProof: ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'bytes32', 'string'],
          [assetId, contentHash, validationMethod || 'cryptographic']
        )
      ),
      verifiedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      verification: verificationResult,
      message: isAuthentic ? 'Asset verified successfully' : 'Asset verification failed'
    });
  } catch (error: any) {
    console.error('Asset verification error:', error);
    res.status(500).json({
      error: 'Failed to verify asset',
      details: error.message
    });
  }
});

/**
 * POST /watermark/transfer
 * Transfers ownership of a watermarked asset
 */
router.post('/transfer', async (req, res) => {
  try {
    const { assetId, newOwner, newMetadataHash, signature } = req.body;

    if (!assetId || !newOwner) {
      return res.status(400).json({ error: 'Asset ID and new owner are required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('watermark');

    // For now, use mock implementation
    // In production: const tx = await contract.transferAsset(assetId, newOwner, newMetadataHash, signature);

    // Update in database
    const db = getDatabaseService();
    const existingWatermark = await db.getWatermark(assetId);

    if (!existingWatermark.exists) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const updatedWatermark = {
      ...existingWatermark,
      owner: newOwner,
      metadataHash: newMetadataHash || existingWatermark.metadataHash,
      transferredAt: new Date().toISOString(),
      version: (existingWatermark.version || 1) + 1
    };

    await db.saveWatermark(updatedWatermark);

    res.json({
      success: true,
      transfer: {
        assetId,
        previousOwner: existingWatermark.creator,
        newOwner,
        transferredAt: updatedWatermark.transferredAt
      },
      message: 'Asset ownership transferred successfully'
    });
  } catch (error: any) {
    console.error('Asset transfer error:', error);
    res.status(500).json({
      error: 'Failed to transfer asset',
      details: error.message
    });
  }
});

/**
 * GET /watermark/history/:assetId
 * Gets watermark history for an asset
 */
router.get('/history/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;

    // Mock watermark history
    const history = [
      {
        version: 1,
        creator: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
        action: 'created'
      },
      {
        version: 2,
        owner: '0x1234567890123456789012345678901234567890',
        timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
        action: 'transferred'
      }
    ];

    res.json({
      assetId,
      history,
      totalVersions: history.length,
      retrievedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Watermark history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve watermark history',
      details: error.message
    });
  }
});

/**
 * GET /watermark/stats
 * Gets watermarking statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Mock watermarking statistics
    const stats = {
      totalWatermarks: 15420,
      activeWatermarks: 12850,
      verifiedThisMonth: 2340,
      tamperedAssets: 45,
      averageConfidenceScore: 87.5,
      popularFormats: {
        image: 65,
        video: 25,
        document: 8,
        audio: 2
      }
    };

    res.json({
      stats,
      retrievedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Watermark stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve watermark stats',
      details: error.message
    });
  }
});

export default router;