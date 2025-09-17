// src/backend/identity.ts
// Backend API for One Universal Identity registration, verification, and selective disclosure

import express from 'express';
import { ethers } from 'ethers';
import { getBlockchainService } from '../utils/blockchain';
import { getDatabaseService } from '../utils/database';

const router = express.Router();

/**
 * POST /identity/register
 * Registers a new universal identity
 */
router.post('/register', async (req, res) => {
  try {
    const { did, signature } = req.body;

    if (!did) {
      return res.status(400).json({ error: 'DID is required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('ouiIdentity');

    // For now, use mock implementation since contracts aren't deployed
    // In production: const tx = await contract.createIdentity(did);

    // Save to database
    const db = getDatabaseService();
    const identityData = {
      did,
      owner: req.body.owner || '0x0000000000000000000000000000000000000000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      status: 'active'
    };

    const savedIdentity = await db.saveIdentity(identityData);

    res.json({
      success: true,
      identity: savedIdentity,
      message: 'Identity registered successfully'
    });
  } catch (error: any) {
    console.error('Identity registration error:', error);
    res.status(500).json({
      error: 'Failed to register identity',
      details: error.message
    });
  }
});

/**
 * PUT /identity/update
 * Updates an existing universal identity
 */
router.put('/update', async (req, res) => {
  try {
    const { did, newDid, signature } = req.body;

    if (!did || !newDid) {
      return res.status(400).json({ error: 'Current DID and new DID are required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('ouiIdentity');

    // For now, use mock implementation
    // In production: const tx = await contract.updateIdentity(newDid);

    // Update in database
    const db = getDatabaseService();
    const existingIdentity = await db.getIdentity(did);

    if (!existingIdentity.exists) {
      return res.status(404).json({ error: 'Identity not found' });
    }

    const updatedIdentity = {
      ...existingIdentity,
      did: newDid,
      updatedAt: new Date().toISOString(),
      version: ((existingIdentity as any).version || 1) + 1
    };

    await db.saveIdentity(updatedIdentity);

    res.json({
      success: true,
      identity: updatedIdentity,
      message: 'Identity updated successfully'
    });
  } catch (error: any) {
    console.error('Identity update error:', error);
    res.status(500).json({
      error: 'Failed to update identity',
      details: error.message
    });
  }
});

/**
 * POST /identity/issue-uvt
 * Issues a Universal Verification Token (UVT)
 */
router.post('/issue-uvt', async (req, res) => {
  try {
    const { credentialId, expiresAt, owner } = req.body;

    if (!credentialId || !expiresAt) {
      return res.status(400).json({ error: 'Credential ID and expiration time are required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('ouiIdentity');

    // Generate token ID (in production, this would come from contract)
    const tokenId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'bytes32', 'uint256'],
        [owner || '0x0000000000000000000000000000000000000000', credentialId, Date.now()]
      )
    );

    // For now, use mock implementation
    // In production: const tx = await contract.issueUVT(credentialId, expiresAt);

    // Save to database
    const db = getDatabaseService();
    const uvtData = {
      tokenId,
      credentialId,
      owner: owner || '0x0000000000000000000000000000000000000000',
      issuedAt: Date.now(),
      expiresAt,
      status: 'active'
    };

    await db.saveTransaction(uvtData);

    res.json({
      success: true,
      uvt: uvtData,
      message: 'UVT issued successfully'
    });
  } catch (error: any) {
    console.error('UVT issuance error:', error);
    res.status(500).json({
      error: 'Failed to issue UVT',
      details: error.message
    });
  }
});

/**
 * GET /identity/uvt/:tokenId
 * Checks if a UVT is valid
 */
router.get('/uvt/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('ouiIdentity');

    // For now, use mock implementation
    // In production: const isValid = await contract.isUVTValid(tokenId);

    const isValid = Math.random() > 0.1; // Mock validity check

    res.json({
      tokenId,
      isValid,
      checkedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('UVT validation error:', error);
    res.status(500).json({
      error: 'Failed to validate UVT',
      details: error.message
    });
  }
});

/**
 * POST /identity/selective-disclosure
 * Handles selective disclosure requests (zero-knowledge proof integration)
 */
router.post('/selective-disclosure', async (req, res) => {
  try {
    const { attributes, proof, verifier } = req.body;

    if (!attributes || !proof) {
      return res.status(400).json({ error: 'Attributes and proof are required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('zkpVerifier');

    // For now, use mock ZKP verification
    // In production: const isValid = await contract.verifyProof(proof);

    const isValid = Math.random() > 0.05; // Mock ZKP verification

    // Save disclosure request
    const db = getDatabaseService();
    await db.saveTransaction({
      type: 'selective_disclosure',
      attributes,
      proof,
      verifier,
      verified: isValid,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      verified: isValid,
      attributes: isValid ? attributes : null,
      message: isValid ? 'Selective disclosure verified' : 'Verification failed'
    });
  } catch (error: any) {
    console.error('Selective disclosure error:', error);
    res.status(500).json({
      error: 'Failed to process selective disclosure',
      details: error.message
    });
  }
});

/**
 * GET /identity/:did
 * Gets identity information
 */
router.get('/:did', async (req, res) => {
  try {
    const { did } = req.params;

    // Get from database
    const db = getDatabaseService();
    const identity = await db.getIdentity(did);

    if (!identity.exists) {
      return res.status(404).json({ error: 'Identity not found' });
    }

    res.json({
      did,
      identity,
      retrievedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Identity retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve identity',
      details: error.message
    });
  }
});

/**
 * GET /identity/history/:owner
 * Gets identity history for an owner address
 */
router.get('/history/:owner', async (req, res) => {
  try {
    const { owner } = req.params;

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('ouiIdentity');

    // For now, use mock implementation
    // In production: const history = await contract.getIdentityHistory(owner);

    // Mock identity history
    const history = [
      {
        did: '0x' + Math.random().toString(16).substr(2, 64),
        owner: owner,
        timestamp: Date.now() - (7 * 24 * 60 * 60 * 1000),
        version: 1,
        changeType: 'created'
      },
      {
        did: '0x' + Math.random().toString(16).substr(2, 64),
        owner: owner,
        timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
        version: 2,
        changeType: 'updated'
      }
    ];

    res.json({
      owner,
      history,
      totalVersions: history.length,
      retrievedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Identity history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve identity history',
      details: error.message
    });
  }
});

export default router;