/**
 * OUI Provider for Mobile App
 * Integrates OUI Mobile SDK with React Native
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { OUIClient, createOUIClient, WalletInfo, IdentityData } from '../../../src/mobile-sdk/OUIClient';

interface OUIContextType {
  ouiClient: OUIClient | null;
  walletInfo: WalletInfo | null;
  identity: IdentityData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Connection methods
  connectWallet: (walletProvider: any) => Promise<void>;
  disconnectWallet: () => Promise<void>;

  // Identity methods
  createIdentity: (did: string) => Promise<void>;
  refreshIdentity: () => Promise<void>;

  // Phase 2 features
  analyzeSecurity: () => Promise<void>;
  performZKPAgeVerification: () => Promise<void>;
  initiateCrossChainTransfer: (dstChainId: number, amount: string) => Promise<void>;
}

const OUIContext = createContext<OUIContextType | undefined>(undefined);

interface OUIProviderProps {
  children: ReactNode;
  apiUrl?: string;
  network?: 'mainnet' | 'testnet' | 'localhost';
}

export const OUIProvider: React.FC<OUIProviderProps> = ({
  children,
  apiUrl = 'http://localhost:3001',
  network = 'localhost'
}) => {
  const [ouiClient, setOuiClient] = useState<OUIClient | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [identity, setIdentity] = useState<IdentityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize OUI client
  useEffect(() => {
    try {
      const client = createOUIClient(apiUrl, network);
      setOuiClient(client);
      console.log('OUI Client initialized (Phase 2 Mobile SDK)');
    } catch (err) {
      console.error('Failed to initialize OUI client:', err);
      setError('Failed to initialize OUI client');
    }
  }, [apiUrl, network]);

  const connectWallet = async (walletProvider: any) => {
    if (!ouiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const wallet = await ouiClient.connectWallet(walletProvider);
      setWalletInfo(wallet);

      // Try to get existing identity
      await refreshIdentity();

      console.log('Wallet connected successfully');
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message);
      Alert.alert('Connection Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    if (!ouiClient) return;

    setIsLoading(true);
    try {
      await ouiClient.disconnectWallet();
      setWalletInfo(null);
      setIdentity(null);
      console.log('Wallet disconnected');
    } catch (err: any) {
      console.error('Wallet disconnection failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createIdentity = async (did: string) => {
    if (!ouiClient || !walletInfo) return;

    setIsLoading(true);
    setError(null);

    try {
      const newIdentity = await ouiClient.createIdentity(did);
      setIdentity(newIdentity);
      Alert.alert('Success', 'Identity created successfully!');
      console.log('Identity created:', newIdentity);
    } catch (err: any) {
      console.error('Identity creation failed:', err);
      setError(err.message);
      Alert.alert('Creation Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshIdentity = async () => {
    if (!ouiClient || !walletInfo) return;

    try {
      const existingIdentity = await ouiClient.getIdentity();
      setIdentity(existingIdentity);
      console.log('Identity refreshed:', existingIdentity);
    } catch (err: any) {
      console.log('No existing identity found or error:', err.message);
      setIdentity(null);
    }
  };

  // Phase 2: AI Security Analysis
  const analyzeSecurity = async () => {
    if (!ouiClient || !walletInfo) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const analysis = await ouiClient.analyzeIdentityRisk();

      Alert.alert(
        'Security Analysis',
        `Overall Risk: ${analysis.overallRisk}\nThreat Score: ${analysis.threatScore}\nThreats Detected: ${analysis.detectedThreats.length}`,
        [{ text: 'OK' }]
      );

      console.log('Security analysis completed:', analysis);
    } catch (err: any) {
      console.error('Security analysis failed:', err);
      setError(err.message);
      Alert.alert('Analysis Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 2: ZKP Age Verification
  const performZKPAgeVerification = async () => {
    if (!ouiClient || !walletInfo) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request birth date from user (in real app, this would come from ID document)
      Alert.prompt(
        'Age Verification',
        'Enter your birth date (YYYY-MM-DD):',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Verify',
            onPress: async (birthDate) => {
              if (!birthDate) return;

              try {
                // In a real implementation, this would create a ZKP proof
                const verificationResult = {
                  verified: true,
                  age: 25, // Mock calculation
                  status: 'verified'
                };

                Alert.alert(
                  'Age Verification Result',
                  `Status: ${verificationResult.status}\nEstimated Age: ${verificationResult.age} years`,
                  [{ text: 'OK' }]
                );

                console.log('ZKP age verification completed:', verificationResult);
              } catch (zkpError: any) {
                Alert.alert('Verification Failed', zkpError.message);
              }
            }
          }
        ]
      );
    } catch (err: any) {
      console.error('ZKP age verification failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 2: Cross-Chain Transfer
  const initiateCrossChainTransfer = async (dstChainId: number, amount: string) => {
    if (!ouiClient || !walletInfo || !identity) {
      Alert.alert('Error', 'Wallet and identity required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const transferResult = await ouiClient.initiateCrossChainTransfer(
        dstChainId,
        amount,
        identity.did
      );

      Alert.alert(
        'Cross-Chain Transfer',
        `Transfer initiated!\nRequest ID: ${transferResult.requestId}\nFee: ${transferResult.estimatedFee} ETH`,
        [{ text: 'OK' }]
      );

      console.log('Cross-chain transfer initiated:', transferResult);
    } catch (err: any) {
      console.error('Cross-chain transfer failed:', err);
      setError(err.message);
      Alert.alert('Transfer Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const value: OUIContextType = {
    ouiClient,
    walletInfo,
    identity,
    isConnected: !!walletInfo,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    createIdentity,
    refreshIdentity,
    analyzeSecurity,
    performZKPAgeVerification,
    initiateCrossChainTransfer,
  };

  return (
    <OUIContext.Provider value={value}>
      {children}
    </OUIContext.Provider>
  );
};

export const useOUI = (): OUIContextType => {
  const context = useContext(OUIContext);
  if (context === undefined) {
    throw new Error('useOUI must be used within an OUIProvider');
  }
  return context;
};