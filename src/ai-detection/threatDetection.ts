// src/ai-detection/threatDetection.ts
// AI module for identity threat analysis in OUI

import { aiModelService, ThreatAnalysisInput } from './mlModels';

export type ThreatType = 'identity_theft' | 'synthetic_identity' | 'deepfake' | 'fraud' | 'anomaly';

export interface ThreatDetectionResult {
  threatType: ThreatType;
  detected: boolean;
  confidence: number; // 0.0 - 1.0
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details?: any;
  processingTime?: number;
  timestamp?: number;
}

/**
 * Detects identity threats using AI models.
 * @param userId - User identifier
 * @param inputData - User behavior, biometric, or content data
 * @returns Promise<ThreatDetectionResult[]>
 */
export async function detectIdentityThreats(
  userId: string,
  inputData: Partial<ThreatAnalysisInput>
): Promise<ThreatDetectionResult[]> {
  try {
    // Prepare input for AI model service
    const analysisInput: ThreatAnalysisInput = {
      userId,
      behaviorData: inputData.behaviorData,
      biometricData: inputData.biometricData,
      contentData: inputData.contentData,
      transactionData: inputData.transactionData,
      timestamp: Date.now()
    };

    // Analyze threat using AI models
    const analysisResult = await aiModelService.analyzeThreat(analysisInput);

    // Convert to legacy format
    const results: ThreatDetectionResult[] = analysisResult.detectedThreats.map(threat => ({
      threatType: threat.threatType as ThreatType,
      detected: threat.confidence > 0.5, // Threshold for detection
      confidence: threat.confidence,
      riskLevel: threat.riskLevel,
      details: threat.details,
      processingTime: threat.processingTime,
      timestamp: threat.timestamp
    }));

    // Add synthetic identity detection if not already present
    const hasSyntheticIdentity = results.some(r => r.threatType === 'synthetic_identity');
    if (!hasSyntheticIdentity) {
      const syntheticScore = calculateSyntheticIdentityScore(inputData);
      results.push({
        threatType: 'synthetic_identity',
        detected: syntheticScore > 0.6,
        confidence: syntheticScore,
        riskLevel: syntheticScore > 0.8 ? 'high' : syntheticScore > 0.6 ? 'medium' : 'low',
        details: { method: 'pattern_analysis' },
        processingTime: 50,
        timestamp: Date.now()
      });
    }

    return results;
  } catch (error: any) {
    console.error('Identity threat detection error:', error);

    // Return fallback results
    return [
      {
        threatType: 'identity_theft',
        detected: false,
        confidence: 0.0,
        riskLevel: 'low',
        details: `Detection failed: ${error.message}`,
        processingTime: 0,
        timestamp: Date.now()
      },
      {
        threatType: 'synthetic_identity',
        detected: false,
        confidence: 0.0,
        riskLevel: 'low',
        details: `Detection failed: ${error.message}`,
        processingTime: 0,
        timestamp: Date.now()
      },
      {
        threatType: 'deepfake',
        detected: false,
        confidence: 0.0,
        riskLevel: 'low',
        details: `Detection failed: ${error.message}`,
        processingTime: 0,
        timestamp: Date.now()
      }
    ];
  }
}

/**
 * Helper function to calculate synthetic identity score
 */
function calculateSyntheticIdentityScore(inputData: Partial<ThreatAnalysisInput>): number {
  let score = 0;

  // Check for synthetic identity indicators
  if (inputData.behaviorData) {
    // New account with no history
    if (inputData.behaviorData.loginPatterns.length < 3) {
      score += 0.3;
    }

    // Unusual device fingerprint
    if (inputData.behaviorData.deviceInfo.fingerprint === 'new') {
      score += 0.2;
    }

    // Limited IP history
    if (inputData.behaviorData.ipHistory.length < 2) {
      score += 0.25;
    }
  }

  if (inputData.transactionData) {
    // Unusual transaction patterns
    if (inputData.transactionData.frequency > 15) {
      score += 0.15;
    }
  }

  return Math.min(score, 1.0);
}

/**
 * Get threat analysis summary for a user
 * @param userId - User identifier
 * @param inputData - User data for analysis
 * @returns Promise<{overallRisk: string, threatCount: number}>
 */
export async function getThreatSummary(
  userId: string,
  inputData: Partial<ThreatAnalysisInput>
): Promise<{ overallRisk: string; threatCount: number; recommendations: string[] }> {
  try {
    const threats = await detectIdentityThreats(userId, inputData);

    const detectedThreats = threats.filter(t => t.detected);
    const overallRisk = calculateOverallRisk(threats);

    // Generate recommendations based on threats
    const recommendations = generateRecommendations(threats);

    return {
      overallRisk,
      threatCount: detectedThreats.length,
      recommendations
    };
  } catch (error) {
    console.error('Threat summary error:', error);
    return {
      overallRisk: 'unknown',
      threatCount: 0,
      recommendations: ['Unable to analyze threats at this time']
    };
  }
}

/**
 * Calculate overall risk level from multiple threat results
 */
function calculateOverallRisk(threats: ThreatDetectionResult[]): string {
  const riskLevels = threats.map(t => t.riskLevel);
  const maxRisk = Math.max(...riskLevels.map(r =>
    r === 'critical' ? 4 : r === 'high' ? 3 : r === 'medium' ? 2 : 1
  ));

  if (maxRisk >= 4) return 'critical';
  if (maxRisk >= 3) return 'high';
  if (maxRisk >= 2) return 'medium';
  return 'low';
}

/**
 * Generate security recommendations based on detected threats
 */
function generateRecommendations(threats: ThreatDetectionResult[]): string[] {
  const recommendations: string[] = [];
  const detectedThreats = threats.filter(t => t.detected);

  if (detectedThreats.length === 0) {
    recommendations.push('No immediate security concerns detected');
    return recommendations;
  }

  for (const threat of detectedThreats) {
    switch (threat.threatType) {
      case 'identity_theft':
        recommendations.push('Consider additional identity verification');
        recommendations.push('Review account access logs');
        break;
      case 'synthetic_identity':
        recommendations.push('Verify account creation details');
        recommendations.push('Check for unusual account patterns');
        break;
      case 'deepfake':
        recommendations.push('Verify user identity through alternative channels');
        recommendations.push('Request additional biometric verification');
        break;
      case 'fraud':
        recommendations.push('Review recent transactions');
        recommendations.push('Consider transaction limits');
        break;
      case 'anomaly':
        recommendations.push('Monitor account activity closely');
        recommendations.push('Check for unusual behavior patterns');
        break;
    }
  }

  return [...new Set(recommendations)]; // Remove duplicates
}