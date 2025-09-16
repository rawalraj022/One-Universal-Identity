// src/backend/dao.ts
// Backend API for OUI DAO governance

import express from 'express';
import { ethers } from 'ethers';
import { getBlockchainService } from '../utils/blockchain';
import { getDatabaseService } from '../utils/database';

const router = express.Router();

/**
 * POST /dao/proposal
 * Creates a new DAO proposal
 */
router.post('/proposal', async (req, res) => {
  try {
    const { description, duration, proposer } = req.body;

    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('dao');

    // For now, use mock implementation
    // In production: const tx = await contract.createProposal(description, duration);

    const proposalId = Math.floor(Math.random() * 1000000); // Mock proposal ID

    // Save to database
    const db = getDatabaseService();
    const proposalData = {
      id: proposalId,
      description,
      duration,
      proposer: proposer || '0x0000000000000000000000000000000000000000',
      startTime: Date.now(),
      endTime: Date.now() + (duration * 1000),
      voteCount: 0,
      executed: false,
      status: 'active'
    };

    await db.saveTransaction(proposalData);

    res.json({
      success: true,
      proposal: proposalData,
      message: 'Proposal created successfully'
    });
  } catch (error: any) {
    console.error('Proposal creation error:', error);
    res.status(500).json({
      error: 'Failed to create proposal',
      details: error.message
    });
  }
});

/**
 * POST /dao/vote
 * Votes on a DAO proposal
 */
router.post('/vote', async (req, res) => {
  try {
    const { proposalId, voter } = req.body;

    if (!proposalId) {
      return res.status(400).json({ error: 'Proposal ID is required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('dao');

    // For now, use mock implementation
    // In production: const tx = await contract.vote(proposalId);

    // Save to database
    const db = getDatabaseService();
    const voteData = {
      type: 'dao_vote',
      proposalId: parseInt(proposalId),
      voter: voter || '0x0000000000000000000000000000000000000000',
      timestamp: new Date().toISOString(),
      vote: 'yes' // Could be yes/no/abstain
    };

    await db.saveTransaction(voteData);

    res.json({
      success: true,
      vote: voteData,
      message: 'Vote recorded successfully'
    });
  } catch (error: any) {
    console.error('Voting error:', error);
    res.status(500).json({
      error: 'Failed to record vote',
      details: error.message
    });
  }
});

/**
 * POST /dao/execute
 * Executes a DAO proposal
 */
router.post('/execute', async (req, res) => {
  try {
    const { proposalId, executor } = req.body;

    if (!proposalId) {
      return res.status(400).json({ error: 'Proposal ID is required' });
    }

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('dao');

    // For now, use mock implementation
    // In production: const tx = await contract.executeProposal(proposalId);

    // Update in database
    const db = getDatabaseService();
    const executionData = {
      type: 'dao_execution',
      proposalId: parseInt(proposalId),
      executor: executor || '0x0000000000000000000000000000000000000000',
      timestamp: new Date().toISOString(),
      executed: true
    };

    await db.saveTransaction(executionData);

    res.json({
      success: true,
      execution: executionData,
      message: 'Proposal executed successfully'
    });
  } catch (error: any) {
    console.error('Proposal execution error:', error);
    res.status(500).json({
      error: 'Failed to execute proposal',
      details: error.message
    });
  }
});

/**
 * GET /dao/proposal/:proposalId
 * Gets DAO proposal details
 */
router.get('/proposal/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;

    // Get blockchain service
    const blockchainService = getBlockchainService();
    const contract = blockchainService.getContract('dao');

    // For now, use mock implementation
    // In production: const proposal = await contract.getProposal(proposalId);

    const mockProposal = {
      id: parseInt(proposalId),
      proposer: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      description: 'Upgrade AI detection module to version 2.0',
      voteCount: Math.floor(Math.random() * 100) + 10,
      startTime: Date.now() - (24 * 60 * 60 * 1000), // 1 day ago
      endTime: Date.now() + (6 * 24 * 60 * 60 * 1000), // 6 days from now
      executed: false
    };

    res.json({
      proposal: mockProposal,
      retrievedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Proposal retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve proposal',
      details: error.message
    });
  }
});

/**
 * GET /dao/proposals
 * Gets all active DAO proposals
 */
router.get('/proposals', async (req, res) => {
  try {
    // Get from database
    const db = getDatabaseService();

    // Mock proposals list
    const proposals = [
      {
        id: 1,
        description: 'Upgrade AI detection module to version 2.0',
        proposer: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        voteCount: 45,
        startTime: Date.now() - (24 * 60 * 60 * 1000),
        endTime: Date.now() + (6 * 24 * 60 * 60 * 1000),
        executed: false
      },
      {
        id: 2,
        description: 'Add support for Polygon network',
        proposer: '0x1234567890123456789012345678901234567890',
        voteCount: 32,
        startTime: Date.now() - (48 * 60 * 60 * 1000),
        endTime: Date.now() + (3 * 24 * 60 * 60 * 1000),
        executed: false
      }
    ];

    res.json({
      proposals,
      total: proposals.length,
      retrievedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Proposals retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve proposals',
      details: error.message
    });
  }
});

/**
 * GET /dao/stats
 * Gets DAO statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Mock DAO statistics
    const stats = {
      totalProposals: 15,
      activeProposals: 3,
      executedProposals: 12,
      totalVotes: 1250,
      averageParticipation: 78.5,
      treasuryBalance: '15000', // ETH
      governanceTokenSupply: '1000000'
    };

    res.json({
      stats,
      retrievedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('DAO stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve DAO stats',
      details: error.message
    });
  }
});

export default router;