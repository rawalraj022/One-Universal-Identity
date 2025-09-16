// src/backend/aiDetection.ts
// Backend API for AI threat detection

import express from 'express';
import { aiModelService } from '../ai-detection/mlModels';
import type { ThreatAnalysisInput } from '../ai-detection/mlModels';

const router = express.Router();

/**
 * POST /ai/analyze-threat
 * Analyze user data for potential threats using ML models
 */
router.post('/analyze-threat', async (req, res) => {
  try {
    const input: ThreatAnalysisInput = {
      userId: req.body.userId,
      behaviorData: req.body.behaviorData,
      biometricData: req.body.biometricData,
      contentData: req.body.contentData,
      transactionData: req.body.transactionData,
      timestamp: Date.now()
    };

    // Validate required fields
    if (!input.userId) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    const analysisResult = await aiModelService.analyzeThreat(input);

    res.json({
      success: true,
      userId: input.userId,
      analysis: analysisResult
    });
  } catch (error: any) {
    console.error('Threat analysis error:', error);
    res.status(500).json({
      error: 'Threat analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /ai/detect-fraud
 * Specialized fraud detection endpoint
 */
router.post('/detect-fraud', async (req, res) => {
  try {
    const { userId, transactionData, behaviorData } = req.body;

    if (!userId || !transactionData) {
      return res.status(400).json({
        error: 'userId and transactionData are required'
      });
    }

    const input: ThreatAnalysisInput = {
      userId,
      transactionData,
      behaviorData,
      timestamp: Date.now()
    };

    const analysisResult = await aiModelService.analyzeThreat(input);

    // Filter for fraud-related results
    const fraudResults = analysisResult.detectedThreats.filter(
      threat => threat.threatType === 'fraud'
    );

    res.json({
      success: true,
      userId,
      fraudAnalysis: {
        overallRisk: analysisResult.overallRisk,
        fraudScore: fraudResults.length > 0 ? fraudResults[0].confidence : 0,
        recommendations: analysisResult.recommendations
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Fraud detection failed',
      message: error.message
    });
  }
});

/**
 * POST /ai/verify-biometric
 * Biometric verification endpoint
 */
router.post('/verify-biometric', async (req, res) => {
  try {
    const { userId, biometricData } = req.body;

    if (!userId || !biometricData) {
      return res.status(400).json({
        error: 'userId and biometricData are required'
      });
    }

    const input: ThreatAnalysisInput = {
      userId,
      biometricData,
      timestamp: Date.now()
    };

    const analysisResult = await aiModelService.analyzeThreat(input);

    // Filter for biometric verification results
    const biometricResults = analysisResult.detectedThreats.filter(
      threat => threat.modelName === 'biometric_verification'
    );

    res.json({
      success: true,
      userId,
      biometricVerification: {
        verified: biometricResults.length > 0 && biometricResults[0].confidence > 0.7,
        confidence: biometricResults.length > 0 ? biometricResults[0].confidence : 0,
        riskLevel: biometricResults.length > 0 ? biometricResults[0].riskLevel : 'unknown'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Biometric verification failed',
      message: error.message
    });
  }
});

/**
 * POST /ai/detect-deepfake
 * Deepfake detection endpoint
 */
router.post('/detect-deepfake', async (req, res) => {
  try {
    const { userId, contentData } = req.body;

    if (!userId || !contentData) {
      return res.status(400).json({
        error: 'userId and contentData are required'
      });
    }

    const input: ThreatAnalysisInput = {
      userId,
      contentData,
      timestamp: Date.now()
    };

    const analysisResult = await aiModelService.analyzeThreat(input);

    // Filter for deepfake detection results
    const deepfakeResults = analysisResult.detectedThreats.filter(
      threat => threat.threatType === 'deepfake'
    );

    res.json({
      success: true,
      userId,
      deepfakeAnalysis: {
        isDeepfake: deepfakeResults.length > 0 && deepfakeResults[0].confidence > 0.5,
        confidence: deepfakeResults.length > 0 ? deepfakeResults[0].confidence : 0,
        riskLevel: deepfakeResults.length > 0 ? deepfakeResults[0].riskLevel : 'low'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Deepfake detection failed',
      message: error.message
    });
  }
});

/**
 * GET /ai/models
 * Get list of available ML models
 */
router.get('/models', async (req, res) => {
  try {
    const models = aiModelService.getAvailableModels();

    res.json({
      models,
      count: models.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get models',
      message: error.message
    });
  }
});

/**
 * GET /ai/model/:modelName/status
 * Get status of a specific ML model
 */
router.get('/model/:modelName/status', async (req, res) => {
  try {
    const { modelName } = req.params;
    const status = await aiModelService.getModelStatus(modelName);

    res.json({
      modelName,
      status
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get model status',
      message: error.message
    });
  }
});

/**
 * POST /ai/train-model
 * Trigger model retraining (admin only)
 */
router.post('/train-model', async (req, res) => {
  try {
    const { modelName, trainingData } = req.body;

    if (!modelName) {
      return res.status(400).json({
        error: 'modelName is required'
      });
    }

    // In a real implementation, this would trigger model training
    // For now, return mock response
    console.log(`Training model ${modelName} with data:`, trainingData);

    res.json({
      success: true,
      modelName,
      trainingId: `train_${Date.now()}`,
      status: 'training_started',
      estimatedDuration: '2 hours'
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Model training failed',
      message: error.message
    });
  }
});

/**
 * GET /ai/threat-history/:userId
 * Get threat analysis history for a user
 */
router.get('/threat-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '10' } = req.query;

    // In a real implementation, this would query a database
    // For now, return mock history
    const mockHistory = [];
    for (let i = 0; i < parseInt(limit as string); i++) {
      mockHistory.push({
        userId,
        timestamp: Date.now() - (i * 86400000), // One day intervals
        threatScore: Math.floor(Math.random() * 100),
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        detectedThreats: ['fraud', 'anomaly', 'identity_theft'][Math.floor(Math.random() * 3)]
      });
    }

    res.json({
      userId,
      history: mockHistory,
      count: mockHistory.length
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get threat history',
      message: error.message
    });
  }
});

/**
 * POST /ai/report-false-positive
 * Report false positive detection for model improvement
 */
router.post('/report-false-positive', async (req, res) => {
  try {
    const { userId, modelName, originalPrediction, actualResult, feedback } = req.body;

    if (!userId || !modelName || !originalPrediction) {
      return res.status(400).json({
        error: 'userId, modelName, and originalPrediction are required'
      });
    }

    // Log false positive for model retraining
    console.log('False positive reported:', {
      userId,
      modelName,
      originalPrediction,
      actualResult,
      feedback,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      message: 'False positive reported successfully',
      reportId: `fp_${Date.now()}`
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to report false positive',
      message: error.message
    });
  }
});

export default router;