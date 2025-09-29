// src/zkp-verifier/zkp.ts
// Backend integration for ZKP verification in OUI

import { ethers } from 'ethers';
import { realZKPService } from './realZKPService';
// import ZKPVerifier ABI and contract address as needed

export interface ZKPVerificationRequest {
  credentialId: string;
  proofType: string;
  proof: any;
}

export interface ZKPVerificationResult {
  requestId: string;
  verified: boolean;
  status: string;
  timestamp?: number;
  processingTime?: number;
  gasUsed?: number;
  proofType?: string;
  error?: string;
}

/**
 * Submits a real ZKP verification request (Phase 2 implementation).
 * @param req - ZKPVerificationRequest
 * @returns ZKPVerificationResult
 */
export async function submitZKPVerification(req: ZKPVerificationRequest): Promise<ZKPVerificationResult> {
  console.log('Using real ZKP service for verification (Phase 2)');

  try {
    return await realZKPService.submitZKPVerification(req);
  } catch (error: any) {
    console.error('Real ZKP verification failed, returning error result:', error);
    return {
      requestId: `error_${Date.now()}`,
      verified: false,
      status: 'error',
      error: error.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Checks if a credential is verified via real ZKP (Phase 2 implementation).
 * @param credentialId - string
 * @returns boolean
 */
export async function isCredentialVerified(credentialId: string): Promise<boolean> {
  try {
    console.log('Using real ZKP service for credential verification (Phase 2)');
    return await realZKPService.isCredentialVerified(credentialId);
  } catch (error) {
    console.error('Real ZKP credential verification failed:', error);
    return false;
  }
}