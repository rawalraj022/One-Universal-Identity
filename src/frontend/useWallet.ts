// src/frontend/useWallet.ts
// React hook for Web3 wallet integration

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface WalletState {
  address: string | null;
  balance: string;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface ContractConnection {
  ouiIdentity: ethers.Contract | null;
  uvtToken: ethers.Contract | null;
  dao: ethers.Contract | null;
  watermark: ethers.Contract | null;
}

const CONTRACT_ADDRESSES = {
  ouiIdentity: '0x...', // Replace with actual deployed addresses
  uvtToken: '0x...',
  dao: '0x...',
  watermark: '0x...'
};

const CONTRACT_ABIS = {
  ouiIdentity: [], // Replace with actual ABIs
  uvtToken: [],
  dao: [],
  watermark: []
};

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    balance: '0',
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null
  });

  const [contracts, setContracts] = useState<ContractConnection>({
    ouiIdentity: null,
    uvtToken: null,
    dao: null,
    watermark: null
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const setupEventListeners = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      await disconnectWallet();
    } else {
      setWalletState(prev => ({
        ...prev,
        address: accounts[0]
      }));
      await updateBalance(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setWalletState(prev => ({
      ...prev,
      chainId: parseInt(chainId, 16)
    }));
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setWalletState(prev => ({
        ...prev,
        error: 'MetaMask or compatible wallet not found'
      }));
      return;
    }

    try {
      setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();

      setProvider(ethersProvider);
      setSigner(ethersSigner);

      // Get network information
      const network = await ethersProvider.getNetwork();
      const balance = await ethersProvider.getBalance(accounts[0]);

      // Initialize contracts
      const contractInstances = {
        ouiIdentity: new ethers.Contract(CONTRACT_ADDRESSES.ouiIdentity, CONTRACT_ABIS.ouiIdentity, ethersSigner),
        uvtToken: new ethers.Contract(CONTRACT_ADDRESSES.uvtToken, CONTRACT_ABIS.uvtToken, ethersSigner),
        dao: new ethers.Contract(CONTRACT_ADDRESSES.dao, CONTRACT_ABIS.dao, ethersSigner),
        watermark: new ethers.Contract(CONTRACT_ADDRESSES.watermark, CONTRACT_ABIS.watermark, ethersSigner)
      };

      setContracts(contractInstances);

      setWalletState({
        address: accounts[0],
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
        isConnected: true,
        isConnecting: false,
        error: null
      });

    } catch (error: any) {
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet'
      }));
    }
  };

  const disconnectWallet = async () => {
    setWalletState({
      address: null,
      balance: '0',
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null
    });

    setContracts({
      ouiIdentity: null,
      uvtToken: null,
      dao: null,
      watermark: null
    });

    setProvider(null);
    setSigner(null);
  };

  const updateBalance = async (address: string) => {
    if (provider) {
      try {
        const balance = await provider.getBalance(address);
        setWalletState(prev => ({
          ...prev,
          balance: ethers.formatEther(balance)
        }));
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    }
  };

  const switchNetwork = async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (error: any) {
      // If network doesn't exist, you might want to add it
      if (error.code === 4902) {
        console.log('Network not found, you might want to add it');
      }
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!signer) throw new Error('Wallet not connected');

    try {
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      throw new Error('Failed to sign message');
    }
  };

  const sendTransaction = async (to: string, amount: string, data?: string) => {
    if (!signer) throw new Error('Wallet not connected');

    try {
      const tx = {
        to,
        value: ethers.parseEther(amount),
        ...(data && { data })
      };

      const transaction = await signer.sendTransaction(tx);
      return await transaction.wait();
    } catch (error) {
      throw new Error('Transaction failed');
    }
  };

  // Contract interaction helpers
  const createIdentity = async (did: string) => {
    if (!contracts.ouiIdentity) throw new Error('Contract not initialized');

    try {
      const didHash = ethers.keccak256(ethers.toUtf8Bytes(did));
      const tx = await contracts.ouiIdentity.createIdentity(didHash);
      return await tx.wait();
    } catch (error) {
      throw new Error('Failed to create identity');
    }
  };

  const issueUVT = async (credentialId: string, expiresAt: number) => {
    if (!contracts.ouiIdentity) throw new Error('Contract not initialized');

    try {
      const tx = await contracts.ouiIdentity.issueUVT(credentialId, expiresAt);
      return await tx.wait();
    } catch (error) {
      throw new Error('Failed to issue UVT');
    }
  };

  const stakeUVT = async (amount: string) => {
    if (!contracts.uvtToken) throw new Error('Contract not initialized');

    try {
      const tx = await contracts.uvtToken.stake(ethers.parseEther(amount));
      return await tx.wait();
    } catch (error) {
      throw new Error('Failed to stake UVT');
    }
  };

  const createProposal = async (description: string, duration: number) => {
    if (!contracts.dao) throw new Error('Contract not initialized');

    try {
      const tx = await contracts.dao.createProposal(description, duration);
      return await tx.wait();
    } catch (error) {
      throw new Error('Failed to create proposal');
    }
  };

  const watermarkAsset = async (
    assetId: string,
    format: string,
    watermarkType: string,
    metadataHash: string
  ) => {
    if (!contracts.watermark) throw new Error('Contract not initialized');

    try {
      const tx = await contracts.watermark.watermarkAsset(
        assetId,
        format,
        watermarkType,
        metadataHash
      );
      return await tx.wait();
    } catch (error) {
      throw new Error('Failed to watermark asset');
    }
  };

  return {
    // State
    ...walletState,
    contracts,

    // Actions
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signMessage,
    sendTransaction,

    // Contract interactions
    createIdentity,
    issueUVT,
    stakeUVT,
    createProposal,
    watermarkAsset
  };
}

// TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}