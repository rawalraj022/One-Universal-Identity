// src/networks/interoperability.ts
// Multi-chain interoperability for OUI

import { ethers } from 'ethers';
import { createCrossChainBridgeService, DEFAULT_BRIDGE_CONFIG, type BridgeRequest, type CrossChainBridgeService } from './crossChainBridge';

export type ChainType = 'ethereum' | 'polygon' | 'optimism' | 'arbitrum' | 'bsc' | 'crosschain';

export interface ChainConnectionResult {
  chain: ChainType;
  connected: boolean;
  details?: string;
  blockNumber?: number;
  gasPrice?: string;
  latency?: number;
}

export interface TransferData {
  type: 'identity' | 'asset' | 'uvt';
  identityId?: string;
  assetId?: string;
  amount?: string;
  recipient?: string;
  metadata?: any;
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
  bridgeFee?: string;
  estimatedCompletion?: number; // timestamp
  error?: string;
}

// Chain ID mappings
const CHAIN_IDS: { [key in ChainType]: number } = {
  ethereum: 1,
  polygon: 137,
  optimism: 10,
  arbitrum: 42161,
  bsc: 56,
  crosschain: 0
};

// Global bridge service instance
let bridgeService: CrossChainBridgeService;

/**
 * Initialize the interoperability service
 */
export function initializeInteroperability(): void {
  if (!bridgeService) {
    bridgeService = createCrossChainBridgeService(DEFAULT_BRIDGE_CONFIG);
  }
}

/**
 * Connects to a specified blockchain network.
 * @param chain - ChainType
 * @returns ChainConnectionResult
 */
export async function connectToChain(chain: ChainType): Promise<ChainConnectionResult> {
  try {
    if (!bridgeService) {
      initializeInteroperability();
    }

    const startTime = Date.now();
    const chainId = CHAIN_IDS[chain];

    if (chainId === 0) {
      // Cross-chain is not a specific chain
      return {
        chain,
        connected: true,
        details: 'Cross-chain service operational',
        latency: Date.now() - startTime
      };
    }

    // Try to get chain stats to verify connection
    const stats = await bridgeService.getChainStats(chainId);

    return {
      chain,
      connected: true,
      details: `Connected to ${chain} network`,
      blockNumber: 0, // Would get from provider
      gasPrice: '0', // Would get from provider
      latency: Date.now() - startTime
    };
  } catch (error: any) {
    console.error(`Failed to connect to ${chain}:`, error);
    return {
      chain,
      connected: false,
      details: `Connection failed: ${error.message}`
    };
  }
}

/**
 * Transfers identity or asset data across chains.
 * @param fromChain - Source chain
 * @param toChain - Destination chain
 * @param data - Transfer data
 * @returns TransferResult
 */
export async function crossChainTransfer(
  fromChain: ChainType,
  toChain: ChainType,
  data: TransferData
): Promise<TransferResult> {
  try {
    if (!bridgeService) {
      initializeInteroperability();
    }

    // Validate chains
    if (fromChain === toChain) {
      return {
        success: false,
        error: 'Source and destination chains must be different'
      };
    }

    if (fromChain === 'crosschain' || toChain === 'crosschain') {
      return {
        success: false,
        error: 'Invalid chain selection'
      };
    }

    // Validate transfer data
    if (!data.recipient || !ethers.isAddress(data.recipient)) {
      return {
        success: false,
        error: 'Invalid recipient address'
      };
    }

    // Prepare bridge request
    const bridgeRequest: BridgeRequest = {
      userAddress: data.recipient,
      dstChainId: CHAIN_IDS[toChain],
      identityId: data.identityId || data.assetId || 'unknown',
      amount: data.amount || '0',
      adapterParams: '0x' // Default adapter params
    };

    // Initiate bridge transfer
    const result = await bridgeService.initiateBridge(bridgeRequest);

    return {
      success: true,
      txHash: result.txHash,
      bridgeFee: result.estimatedFee,
      estimatedCompletion: Date.now() + (5 * 60 * 1000) // 5 minutes estimate
    };

  } catch (error: any) {
    console.error('Cross-chain transfer failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get supported chains for interoperability
 * @returns Array of supported chains
 */
export async function getSupportedChains(): Promise<Array<{ chain: ChainType; chainId: number; name: string }>> {
  try {
    if (!bridgeService) {
      initializeInteroperability();
    }

    const chains = await bridgeService.getSupportedChains();

    return chains.map(chainInfo => ({
      chain: Object.keys(CHAIN_IDS).find(key => CHAIN_IDS[key as ChainType] === chainInfo.chainId) as ChainType,
      chainId: chainInfo.chainId,
      name: chainInfo.name
    }));
  } catch (error: any) {
    console.error('Failed to get supported chains:', error);
    return [];
  }
}

/**
 * Estimate cross-chain transfer cost
 * @param fromChain - Source chain
 * @param toChain - Destination chain
 * @param data - Transfer data
 * @returns Estimated cost breakdown
 */
export async function estimateTransferCost(
  fromChain: ChainType,
  toChain: ChainType,
  data: TransferData
): Promise<{
  bridgeFee: string;
  gasFee: string;
  totalCost: string;
  estimatedTime: number; // in minutes
}> {
  try {
    if (!bridgeService) {
      initializeInteroperability();
    }

    const bridgeRequest: BridgeRequest = {
      userAddress: data.recipient || ethers.ZeroAddress,
      dstChainId: CHAIN_IDS[toChain],
      identityId: data.identityId || data.assetId || 'unknown',
      amount: data.amount || '0'
    };

    const bridgeFee = await bridgeService.estimateBridgeFee(bridgeRequest);
    const gasFee = ethers.formatEther(ethers.parseEther('0.0005')); // Mock gas fee

    const totalCost = (parseFloat(bridgeFee) + parseFloat(gasFee)).toString();

    return {
      bridgeFee,
      gasFee,
      totalCost,
      estimatedTime: 5 // 5 minutes
    };
  } catch (error: any) {
    console.error('Cost estimation failed:', error);
    throw new Error(`Cost estimation failed: ${error.message}`);
  }
}

/**
 * Get transfer status
 * @param txHash - Transaction hash
 * @param chainId - Chain ID
 * @returns Transfer status
 */
export async function getTransferStatus(
  txHash: string,
  chainId: number
): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confirmations?: number;
  errorMessage?: string;
  timestamp: number;
}> {
  try {
    if (!bridgeService) {
      initializeInteroperability();
    }

    const status = await bridgeService.getBridgeStatus(txHash, chainId);

    return {
      status: status.status,
      confirmations: status.status === 'completed' ? 1 : 0,
      errorMessage: status.errorMessage,
      timestamp: status.timestamp
    };
  } catch (error: any) {
    console.error('Status check failed:', error);
    throw new Error(`Status check failed: ${error.message}`);
  }
}

/**
 * Get user's cross-chain transfer history
 * @param userAddress - User address
 * @param limit - Maximum number of records
 * @returns Transfer history
 */
export async function getTransferHistory(
  userAddress: string,
  limit: number = 10
): Promise<Array<{
  txHash: string;
  fromChain: ChainType;
  toChain: ChainType;
  amount: string;
  status: string;
  timestamp: number;
}>> {
  try {
    if (!bridgeService) {
      initializeInteroperability();
    }

    // Get history from all chains
    const allHistory: any[] = [];

    for (const [chainName, chainId] of Object.entries(CHAIN_IDS)) {
      if (chainId === 0) continue; // Skip crosschain

      try {
        const history = await bridgeService.getBridgeHistory(userAddress, limit);

        history.forEach(item => {
          allHistory.push({
            txHash: item.txHash || item.requestId,
            fromChain: chainName as ChainType,
            toChain: Object.keys(CHAIN_IDS).find(key => CHAIN_IDS[key as ChainType] === item.dstChainId) as ChainType,
            amount: '0', // Would need to decode from transaction
            status: item.status,
            timestamp: item.timestamp
          });
        });
      } catch (error) {
        console.warn(`Failed to get history for chain ${chainName}:`, error);
      }
    }

    // Sort by timestamp and limit
    return allHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

  } catch (error: any) {
    console.error('Transfer history retrieval failed:', error);
    throw new Error(`Transfer history retrieval failed: ${error.message}`);
  }
}

/**
 * Validate cross-chain compatibility
 * @param fromChain - Source chain
 * @param toChain - Destination chain
 * @param dataType - Type of data being transferred
 * @returns Compatibility result
 */
export function validateCrossChainCompatibility(
  fromChain: ChainType,
  toChain: ChainType,
  dataType: TransferData['type']
): {
  compatible: boolean;
  supported: boolean;
  warnings?: string[];
} {
  // All supported chains are compatible for basic transfers
  const supportedChains = ['ethereum', 'polygon', 'optimism', 'arbitrum', 'bsc'];
  const warnings: string[] = [];

  if (!supportedChains.includes(fromChain) || !supportedChains.includes(toChain)) {
    return {
      compatible: false,
      supported: false,
      warnings: ['One or both chains are not supported']
    };
  }

  // Add specific warnings based on data type and chains
  if (dataType === 'asset' && (fromChain === 'bsc' || toChain === 'bsc')) {
    warnings.push('Asset transfers to/from BSC may have higher fees');
  }

  if (dataType === 'identity' && (fromChain === 'optimism' || toChain === 'optimism')) {
    warnings.push('Identity transfers involving Optimism may take longer to confirm');
  }

  return {
    compatible: true,
    supported: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}