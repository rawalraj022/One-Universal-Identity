// src/backend/crossChain.ts
// Backend API for cross-chain bridge operations

import express from 'express';
import { CrossChainBridgeService, createCrossChainBridgeService, DEFAULT_BRIDGE_CONFIG } from '../networks/crossChainBridge';

const router = express.Router();

// Initialize bridge service with default config
const bridgeService = createCrossChainBridgeService(DEFAULT_BRIDGE_CONFIG);

/**
 * POST /cross-chain/bridge
 * Initiate a cross-chain bridge transfer
 */
router.post('/bridge', async (req, res) => {
  try {
    const { userAddress, dstChainId, identityId, amount, adapterParams } = req.body;

    if (!userAddress || !dstChainId || !identityId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: userAddress, dstChainId, identityId, amount'
      });
    }

    const request = {
      userAddress,
      dstChainId: parseInt(dstChainId),
      identityId,
      amount: amount.toString(),
      adapterParams: adapterParams || '0x'
    };

    const result = await bridgeService.initiateBridge(request);

    res.json({
      success: true,
      ...result,
      message: 'Bridge initiated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Bridge initiation failed',
      message: error.message
    });
  }
});

/**
 * GET /cross-chain/estimate-fee
 * Estimate bridge fee for a transfer
 */
router.get('/estimate-fee', async (req, res) => {
  try {
    const { dstChainId, amount } = req.query;

    if (!dstChainId || !amount) {
      return res.status(400).json({
        error: 'Missing required query parameters: dstChainId, amount'
      });
    }

    const request = {
      userAddress: '0x0000000000000000000000000000000000000000', // Dummy address for estimation
      dstChainId: parseInt(dstChainId as string),
      identityId: '0x' + '0'.repeat(64), // Dummy identity ID
      amount: amount as string
    };

    const estimatedFee = await bridgeService.estimateBridgeFee(request);

    res.json({
      estimatedFee,
      dstChainId: parseInt(dstChainId as string),
      amount
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Fee estimation failed',
      message: error.message
    });
  }
});

/**
 * GET /cross-chain/status/:txHash
 * Get bridge transaction status
 */
router.get('/status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const { srcChainId } = req.query;

    if (!srcChainId) {
      return res.status(400).json({
        error: 'Missing required query parameter: srcChainId'
      });
    }

    const status = await bridgeService.getBridgeStatus(txHash, parseInt(srcChainId as string));

    res.json(status);
  } catch (error: any) {
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

/**
 * GET /cross-chain/chains
 * Get list of supported chains
 */
router.get('/chains', async (req, res) => {
  try {
    const chains = await bridgeService.getSupportedChains();
    res.json({ chains });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get supported chains',
      message: error.message
    });
  }
});

/**
 * GET /cross-chain/stats/:chainId
 * Get bridge statistics for a specific chain
 */
router.get('/stats/:chainId', async (req, res) => {
  try {
    const { chainId } = req.params;
    const stats = await bridgeService.getChainStats(parseInt(chainId));

    res.json({
      chainId: parseInt(chainId),
      ...stats
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get chain statistics',
      message: error.message
    });
  }
});

/**
 * GET /cross-chain/history/:userAddress
 * Get bridge history for a user
 */
router.get('/history/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { limit = '10' } = req.query;

    const history = await bridgeService.getBridgeHistory(userAddress, parseInt(limit as string));

    res.json({
      userAddress,
      history,
      count: history.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get bridge history',
      message: error.message
    });
  }
});

/**
 * POST /cross-chain/validate-address
 * Validate if an address is valid on a specific chain
 */
router.post('/validate-address', async (req, res) => {
  try {
    const { address, chainId } = req.body;

    if (!address || !chainId) {
      return res.status(400).json({
        error: 'Missing required fields: address, chainId'
      });
    }

    // Basic validation - in a real implementation, this would check the address format for the specific chain
    const isValid = address.startsWith('0x') && address.length === 42;

    res.json({
      address,
      chainId: parseInt(chainId),
      isValid,
      message: isValid ? 'Address is valid' : 'Invalid address format'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Address validation failed',
      message: error.message
    });
  }
});

/**
 * GET /cross-chain/gas-price/:chainId
 * Get current gas price for a chain
 */
router.get('/gas-price/:chainId', async (req, res) => {
  try {
    const { chainId } = req.params;

    // In a real implementation, this would query the chain's gas price
    // For now, return mock data
    const mockGasPrice = {
      1: { gasPrice: '20000000000', lastUpdated: Date.now() }, // Ethereum
      137: { gasPrice: '50000000000', lastUpdated: Date.now() }, // Polygon
      42161: { gasPrice: '100000000', lastUpdated: Date.now() }, // Arbitrum
      10: { gasPrice: '100000000', lastUpdated: Date.now() }, // Optimism
      56: { gasPrice: '5000000000', lastUpdated: Date.now() } // BSC
    };

    const gasPrice = mockGasPrice[parseInt(chainId) as keyof typeof mockGasPrice];

    if (!gasPrice) {
      return res.status(404).json({
        error: 'Chain not supported or gas price not available'
      });
    }

    res.json({
      chainId: parseInt(chainId),
      ...gasPrice
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get gas price',
      message: error.message
    });
  }
});

export default router;