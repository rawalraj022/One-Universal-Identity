// src/backend/analytics.ts
// Analytics and monitoring dashboard API for OUI

import express from 'express';

const router = express.Router();

// Metrics storage (in production, use a proper database)
interface SystemMetrics {
  timestamp: number;
  totalIdentities: number;
  totalUVTs: number;
  totalTransactions: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  gasUsage: number;
  networkLatency: number;
}

interface SecurityMetrics {
  timestamp: number;
  threatDetections: number;
  blockedTransactions: number;
  complianceViolations: number;
  falsePositives: number;
  responseTime: number;
}

interface UsageMetrics {
  timestamp: number;
  dailyActiveUsers: number;
  verificationRequests: number;
  watermarkCreations: number;
  daoProposals: number;
  apiCalls: number;
}

let systemMetrics: SystemMetrics[] = [];
let securityMetrics: SecurityMetrics[] = [];
let usageMetrics: UsageMetrics[] = [];

// Mock data generator for demonstration
function generateMockMetrics() {
  const now = Date.now();
  systemMetrics.push({
    timestamp: now,
    totalIdentities: Math.floor(Math.random() * 10000) + 5000,
    totalUVTs: Math.floor(Math.random() * 5000) + 1000,
    totalTransactions: Math.floor(Math.random() * 100000) + 50000,
    activeUsers: Math.floor(Math.random() * 1000) + 200,
    systemHealth: Math.random() > 0.1 ? 'healthy' : 'warning',
    gasUsage: Math.floor(Math.random() * 1000000) + 500000,
    networkLatency: Math.floor(Math.random() * 100) + 20
  });

  securityMetrics.push({
    timestamp: now,
    threatDetections: Math.floor(Math.random() * 100) + 10,
    blockedTransactions: Math.floor(Math.random() * 50) + 5,
    complianceViolations: Math.floor(Math.random() * 20) + 2,
    falsePositives: Math.floor(Math.random() * 10) + 1,
    responseTime: Math.floor(Math.random() * 500) + 100
  });

  usageMetrics.push({
    timestamp: now,
    dailyActiveUsers: Math.floor(Math.random() * 500) + 100,
    verificationRequests: Math.floor(Math.random() * 1000) + 200,
    watermarkCreations: Math.floor(Math.random() * 200) + 50,
    daoProposals: Math.floor(Math.random() * 20) + 5,
    apiCalls: Math.floor(Math.random() * 5000) + 1000
  });

  // Keep only last 100 entries
  if (systemMetrics.length > 100) systemMetrics.shift();
  if (securityMetrics.length > 100) securityMetrics.shift();
  if (usageMetrics.length > 100) usageMetrics.shift();
}

// Initialize with some mock data
for (let i = 0; i < 10; i++) {
  generateMockMetrics();
}

// Generate new metrics every 5 minutes
setInterval(generateMockMetrics, 5 * 60 * 1000);

/**
 * GET /analytics/system
 * Get system health and performance metrics
 */
router.get('/system', async (req, res) => {
  try {
    const latestMetrics = systemMetrics[systemMetrics.length - 1];
    const historicalData = systemMetrics.slice(-24); // Last 24 data points

    res.json({
      current: latestMetrics,
      historical: historicalData,
      alerts: generateSystemAlerts(latestMetrics)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
});

/**
 * GET /analytics/security
 * Get security and compliance metrics
 */
router.get('/security', async (req, res) => {
  try {
    const latestMetrics = securityMetrics[securityMetrics.length - 1];
    const historicalData = securityMetrics.slice(-24);

    res.json({
      current: latestMetrics,
      historical: historicalData,
      riskAssessment: calculateRiskLevel(latestMetrics)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security metrics' });
  }
});

/**
 * GET /analytics/usage
 * Get user activity and usage metrics
 */
router.get('/usage', async (req, res) => {
  try {
    const latestMetrics = usageMetrics[usageMetrics.length - 1];
    const historicalData = usageMetrics.slice(-24);

    res.json({
      current: latestMetrics,
      historical: historicalData,
      growth: calculateGrowthRate(usageMetrics)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch usage metrics' });
  }
});

/**
 * GET /analytics/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const system = systemMetrics[systemMetrics.length - 1];
    const security = securityMetrics[securityMetrics.length - 1];
    const usage = usageMetrics[usageMetrics.length - 1];

    res.json({
      systemHealth: {
        status: system.systemHealth,
        uptime: calculateUptime(systemMetrics),
        performance: calculatePerformanceScore(system)
      },
      securityStatus: {
        threatLevel: calculateThreatLevel(security),
        compliance: calculateComplianceScore(security),
        incidents: security.threatDetections + security.blockedTransactions
      },
      usageStats: {
        activeUsers: usage.dailyActiveUsers,
        growth: calculateGrowthRate(usageMetrics),
        efficiency: calculateEfficiencyScore(usage)
      },
      keyMetrics: {
        totalIdentities: system.totalIdentities,
        totalUVTs: system.totalUVTs,
        networkLoad: system.totalTransactions,
        avgResponseTime: security.responseTime
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * POST /analytics/log-event
 * Log custom events for analytics
 */
router.post('/log-event', async (req, res) => {
  try {
    const { eventType, eventData } = req.body;

    // In production, store in database
    console.log(`Analytics Event: ${eventType}`, eventData);

    res.json({ success: true, message: 'Event logged successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log event' });
  }
});

/**
 * GET /analytics/report
 * Generate detailed analytics report
 */
router.get('/report', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    const hours = period === '24h' ? 24 : period === '7d' ? 168 : 24;

    const systemData = systemMetrics.slice(-hours);
    const securityData = securityMetrics.slice(-hours);
    const usageData = usageMetrics.slice(-hours);

    const report = {
      period: period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalIdentities: systemData[systemData.length - 1].totalIdentities,
        totalUVTs: systemData[systemData.length - 1].totalUVTs,
        avgDailyActiveUsers: usageData.reduce((sum, m) => sum + m.dailyActiveUsers, 0) / usageData.length,
        securityIncidents: securityData.reduce((sum, m) => sum + m.threatDetections, 0),
        systemUptime: calculateUptime(systemData)
      },
      trends: {
        identityGrowth: calculateGrowthRate(systemData.map(m => ({ timestamp: m.timestamp, value: m.totalIdentities }))),
        uvtGrowth: calculateGrowthRate(systemData.map(m => ({ timestamp: m.timestamp, value: m.totalUVTs }))),
        userActivity: calculateGrowthRate(usageData)
      },
      alerts: generateSystemAlerts(systemData[systemData.length - 1])
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Helper functions
function generateSystemAlerts(metrics: SystemMetrics): string[] {
  const alerts: string[] = [];

  if (metrics.systemHealth === 'critical') {
    alerts.push('Critical system health detected');
  }

  if (metrics.networkLatency > 100) {
    alerts.push('High network latency detected');
  }

  if (metrics.gasUsage > 800000) {
    alerts.push('High gas usage detected');
  }

  return alerts;
}

function calculateRiskLevel(metrics: SecurityMetrics): 'low' | 'medium' | 'high' {
  const riskScore = (metrics.threatDetections * 2 + metrics.blockedTransactions * 3 + metrics.complianceViolations * 5) / 10;

  if (riskScore > 50) return 'high';
  if (riskScore > 20) return 'medium';
  return 'low';
}

function calculateGrowthRate(metrics: any[]): number {
  if (metrics.length < 2) return 0;

  const first = metrics[0].dailyActiveUsers || metrics[0].value || 0;
  const last = metrics[metrics.length - 1].dailyActiveUsers || metrics[metrics.length - 1].value || 0;

  return ((last - first) / first) * 100;
}

function calculateUptime(metrics: SystemMetrics[]): number {
  const healthyCount = metrics.filter(m => m.systemHealth === 'healthy').length;
  return (healthyCount / metrics.length) * 100;
}

function calculatePerformanceScore(metrics: SystemMetrics): number {
  let score = 100;
  score -= Math.min(metrics.networkLatency / 10, 20); // Deduct for latency
  score -= Math.min(metrics.gasUsage / 100000, 30); // Deduct for gas usage
  return Math.max(score, 0);
}

function calculateThreatLevel(metrics: SecurityMetrics): string {
  if (metrics.threatDetections > 50) return 'high';
  if (metrics.threatDetections > 20) return 'medium';
  return 'low';
}

function calculateComplianceScore(metrics: SecurityMetrics): number {
  const maxViolations = 10;
  return Math.max(0, 100 - (metrics.complianceViolations / maxViolations) * 100);
}

function calculateEfficiencyScore(metrics: UsageMetrics): number {
  // Simple efficiency calculation based on API calls per active user
  const efficiency = metrics.apiCalls / Math.max(metrics.dailyActiveUsers, 1);
  return Math.min(efficiency * 10, 100); // Scale to 0-100
}

export default router;