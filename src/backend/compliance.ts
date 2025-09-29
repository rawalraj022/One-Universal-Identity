/**
 * Compliance Module for OUI
 * Phase 2: Advanced Security Features
 */

import express from 'express';
import { realZKPService } from '../zkp-verifier/realZKPService';
import { submitZKPVerification } from '../zkp-verifier/zkp';

const router = express.Router();

export interface ComplianceCheck {
  checkType: 'age_verification' | 'kyc_verification' | 'aml_screening' | 'sanctions_check';
  userId: string;
  data: any;
  required: boolean;
}

export interface ComplianceResult {
  userId: string;
  checks: ComplianceCheckResult[];
  overallStatus: 'compliant' | 'non_compliant' | 'pending' | 'failed';
  riskScore: number;
  recommendations: string[];
  timestamp: number;
}

export interface ComplianceCheckResult {
  checkType: string;
  status: 'passed' | 'failed' | 'pending' | 'error';
  score: number;
  details: any;
  verified: boolean;
}

/**
 * POST /compliance/check
 * Perform comprehensive compliance checks for a user
 */
router.post('/check', async (req, res) => {
  try {
    const { userId, checks } = req.body;

    if (!userId || !checks || !Array.isArray(checks)) {
      return res.status(400).json({
        error: 'userId and checks array are required'
      });
    }

    console.log(`Performing compliance checks for user: ${userId}`);

    const complianceResults: ComplianceCheckResult[] = [];
    let totalScore = 0;

    for (const check of checks) {
      const result = await performComplianceCheck(check);
      complianceResults.push(result);
      if (result.status === 'passed') {
        totalScore += result.score;
      }
    }

    const overallScore = checks.length > 0 ? totalScore / checks.length : 0;
    const overallStatus = overallScore >= 0.8 ? 'compliant' :
                         overallScore >= 0.5 ? 'pending' : 'non_compliant';

    const recommendations = generateComplianceRecommendations(complianceResults);

    const result: ComplianceResult = {
      userId,
      checks: complianceResults,
      overallStatus,
      riskScore: 100 - (overallScore * 100), // Convert to risk score
      recommendations,
      timestamp: Date.now()
    };

    res.json({
      success: true,
      phase: 'phase_2',
      compliance: result
    });

  } catch (error: any) {
    console.error('Compliance check failed:', error);
    res.status(500).json({
      error: 'Compliance check failed',
      message: error.message
    });
  }
});

/**
 * POST /compliance/age-verification
 * Perform age verification using ZKP
 */
router.post('/age-verification', async (req, res) => {
  try {
    const { userId, birthDate, currentDate } = req.body;

    if (!userId || !birthDate) {
      return res.status(400).json({
        error: 'userId and birthDate are required'
      });
    }

    // Calculate age in days
    const birth = new Date(birthDate);
    const current = currentDate ? new Date(currentDate) : new Date();
    const ageInDays = Math.floor((current.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    const ageInYears = ageInDays / 365;

    // Check if user is adult (18+ years)
    const isAdult = ageInYears >= 18;

    if (!isAdult) {
      return res.json({
        success: true,
        verified: false,
        age: ageInYears,
        status: 'underage',
        message: 'User must be 18 years or older'
      });
    }

    // Create ZKP verification request for privacy-preserving age verification
    const zkpRequest = {
      credentialId: `age_${userId}`,
      proofType: 'age_verification',
      proof: {
        birthDate,
        currentDate: current.toISOString(),
        isAdult,
        // In real implementation, this would be a proper ZKP proof
        proofData: 'simulated_zkp_proof'
      }
    };

    const zkpResult = await submitZKPVerification(zkpRequest);

    res.json({
      success: true,
      verified: zkpResult.verified,
      age: ageInYears,
      status: zkpResult.verified ? 'verified' : 'failed',
      zkpResult,
      phase: 'phase_2'
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Age verification failed',
      message: error.message
    });
  }
});

/**
 * GET /compliance/zkp-stats
 * Get ZKP verification statistics
 */
router.get('/zkp-stats', async (req, res) => {
  try {
    const stats = await realZKPService.getVerificationStats();

    res.json({
      success: true,
      phase: 'phase_2',
      stats,
      timestamp: Date.now()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get ZKP stats',
      message: error.message
    });
  }
});

/**
 * POST /compliance/batch-verify
 * Batch verify multiple ZKP proofs
 */
router.post('/batch-verify', async (req, res) => {
  try {
    const { proofs } = req.body;

    if (!proofs || !Array.isArray(proofs)) {
      return res.status(400).json({
        error: 'proofs array is required'
      });
    }

    console.log(`Processing batch ZKP verification for ${proofs.length} proofs`);

    const results = await realZKPService.batchVerify(proofs);

    const successful = results.filter(r => r.verified).length;
    const failed = results.filter(r => r.status === 'failed').length;
    const errors = results.filter(r => r.status === 'error').length;

    res.json({
      success: true,
      phase: 'phase_2',
      batchResults: results,
      summary: {
        total: proofs.length,
        successful,
        failed,
        errors,
        successRate: (successful / proofs.length) * 100
      },
      timestamp: Date.now()
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'Batch ZKP verification failed',
      message: error.message
    });
  }
});

/**
 * Perform individual compliance check
 */
async function performComplianceCheck(check: ComplianceCheck): Promise<ComplianceCheckResult> {
  try {
    switch (check.checkType) {
      case 'age_verification':
        return await performAgeVerificationCheck(check);
      case 'kyc_verification':
        return await performKYCVerificationCheck(check);
      case 'aml_screening':
        return await performAMLScreeningCheck(check);
      case 'sanctions_check':
        return await performSanctionsCheck(check);
      default:
        return {
          checkType: check.checkType,
          status: 'error',
          score: 0,
          details: { error: 'Unknown check type' },
          verified: false
        };
    }
  } catch (error: any) {
    return {
      checkType: check.checkType,
      status: 'error',
      score: 0,
      details: { error: error.message },
      verified: false
    };
  }
}

/**
 * Perform age verification check
 */
async function performAgeVerificationCheck(check: ComplianceCheck): Promise<ComplianceCheckResult> {
  try {
    // Simulate age verification process
    const birthDate = check.data.birthDate;
    const currentDate = check.data.currentDate || new Date();

    if (!birthDate) {
      return {
        checkType: check.checkType,
        status: 'failed',
        score: 0,
        details: { reason: 'Birth date not provided' },
        verified: false
      };
    }

    const birth = new Date(birthDate);
    const ageInYears = Math.floor((currentDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365));

    const isAdult = ageInYears >= 18;
    const score = isAdult ? 1.0 : 0.0;

    return {
      checkType: check.checkType,
      status: isAdult ? 'passed' : 'failed',
      score,
      details: {
        age: ageInYears,
        isAdult,
        birthDate,
        currentDate
      },
      verified: isAdult
    };

  } catch (error: any) {
    return {
      checkType: check.checkType,
      status: 'error',
      score: 0,
      details: { error: error.message },
      verified: false
    };
  }
}

/**
 * Perform KYC verification check
 */
async function performKYCVerificationCheck(check: ComplianceCheck): Promise<ComplianceCheckResult> {
  try {
    // Simulate KYC document verification
    const documents = check.data.documents || [];

    if (documents.length === 0) {
      return {
        checkType: check.checkType,
        status: 'failed',
        score: 0,
        details: { reason: 'No documents provided' },
        verified: false
      };
    }

    // Simulate document verification process
    const verifiedDocs = documents.filter((doc: any) => doc.verified !== false).length;
    const score = verifiedDocs / documents.length;

    return {
      checkType: check.checkType,
      status: score >= 0.8 ? 'passed' : 'failed',
      score,
      details: {
        totalDocuments: documents.length,
        verifiedDocuments: verifiedDocs,
        documents
      },
      verified: score >= 0.8
    };

  } catch (error: any) {
    return {
      checkType: check.checkType,
      status: 'error',
      score: 0,
      details: { error: error.message },
      verified: false
    };
  }
}

/**
 * Perform AML screening check
 */
async function performAMLScreeningCheck(check: ComplianceCheck): Promise<ComplianceCheckResult> {
  try {
    // Simulate AML screening against watchlists
    const userData = check.data;

    // Simulate screening delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate 95% pass rate for demonstration
    const passed = Math.random() > 0.05;

    return {
      checkType: check.checkType,
      status: passed ? 'passed' : 'failed',
      score: passed ? 1.0 : 0.0,
      details: {
        screened: true,
        watchlistMatches: passed ? 0 : 1,
        riskLevel: passed ? 'low' : 'high'
      },
      verified: passed
    };

  } catch (error: any) {
    return {
      checkType: check.checkType,
      status: 'error',
      score: 0,
      details: { error: error.message },
      verified: false
    };
  }
}

/**
 * Perform sanctions check
 */
async function performSanctionsCheck(check: ComplianceCheck): Promise<ComplianceCheckResult> {
  try {
    // Simulate sanctions list screening
    const userData = check.data;

    // Simulate screening delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Simulate 98% pass rate for demonstration
    const passed = Math.random() > 0.02;

    return {
      checkType: check.checkType,
      status: passed ? 'passed' : 'failed',
      score: passed ? 1.0 : 0.0,
      details: {
        screened: true,
        sanctionsMatches: passed ? 0 : 1,
        riskLevel: passed ? 'low' : 'critical'
      },
      verified: passed
    };

  } catch (error: any) {
    return {
      checkType: check.checkType,
      status: 'error',
      score: 0,
      details: { error: error.message },
      verified: false
    };
  }
}

/**
 * Generate compliance recommendations
 */
function generateComplianceRecommendations(results: ComplianceCheckResult[]): string[] {
  const recommendations: string[] = [];
  const failedChecks = results.filter(r => r.status === 'failed');

  if (failedChecks.length === 0) {
    recommendations.push('All compliance checks passed successfully');
    return recommendations;
  }

  for (const check of failedChecks) {
    switch (check.checkType) {
      case 'age_verification':
        recommendations.push('Age verification required: User must be 18+ years old');
        recommendations.push('Request government-issued ID for age verification');
        break;
      case 'kyc_verification':
        recommendations.push('KYC verification required: Additional documentation needed');
        recommendations.push('Request passport or driver\'s license for identity verification');
        break;
      case 'aml_screening':
        recommendations.push('AML screening failed: Enhanced due diligence required');
        recommendations.push('Request source of funds documentation');
        break;
      case 'sanctions_check':
        recommendations.push('Sanctions check failed: Immediate account restriction recommended');
        recommendations.push('Perform enhanced sanctions screening');
        break;
    }
  }

  return recommendations;
}

export default router;