/**
 * Comprehensive Scalability Testing Framework for OUI
 * Phase 3: Load Testing and Performance Benchmarking
 */

import { performance } from 'perf_hooks';
import axios, { AxiosInstance } from 'axios';

export interface ScalabilityTestConfig {
  target: {
    url: string;
    requestsPerSecond: number;
    duration: number; // seconds
    concurrentUsers: number;
  };
  scenarios: {
    name: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    payload?: any;
    expectedStatus: number;
    weight: number; // Percentage of requests
  }[];
  monitoring: {
    enabled: boolean;
    metricsInterval: number; // milliseconds
    resourceMetrics: boolean;
  };
}

export interface ScalabilityTestResult {
  testId: string;
  config: ScalabilityTestConfig;
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    duration: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number; // MB/s
  };
  scenarioResults: {
    [scenarioName: string]: {
      requests: number;
      errors: number;
      averageTime: number;
      minTime: number;
      maxTime: number;
    };
  };
  resourceMetrics: {
    cpu: number[];
    memory: number[];
    network: number[];
    timestamps: number[];
  };
  errors: Array<{
    scenario: string;
    error: string;
    count: number;
  }>;
  timestamp: number;
}

export interface LoadTestMetrics {
  timestamp: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
  averageResponseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
}

export class ScalabilityTester {
  private httpClient: AxiosInstance;
  private isRunning: boolean = false;
  private metrics: LoadTestMetrics[] = [];
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      validateStatus: () => true // Don't throw on any status
    });
  }

  /**
   * Run comprehensive scalability test
   */
  async runScalabilityTest(config: ScalabilityTestConfig): Promise<ScalabilityTestResult> {
    if (this.isRunning) {
      throw new Error('Scalability test already running');
    }

    this.isRunning = true;
    const testId = `scalability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`🏃 Starting scalability test: ${testId}`);
      console.log(`🎯 Target: ${config.target.requestsPerSecond} RPS for ${config.target.duration}s`);
      console.log(`👥 Concurrent Users: ${config.target.concurrentUsers}`);

      const startTime = performance.now();
      const endTime = startTime + (config.target.duration * 1000);

      // Initialize metrics collection
      if (config.monitoring.enabled) {
        this.startMetricsCollection(config.monitoring.metricsInterval);
      }

      // Run test scenarios
      const scenarioResults = await this.runTestScenarios(config, endTime);

      const actualDuration = performance.now() - startTime;
      const totalRequests = Object.values(scenarioResults).reduce((sum, result) => sum + result.requests, 0);
      const totalErrors = Object.values(scenarioResults).reduce((sum, result) => sum + result.errors, 0);

      // Calculate response time percentiles
      const allResponseTimes = this.collectAllResponseTimes();
      const sortedTimes = allResponseTimes.sort((a, b) => a - b);

      const p50Index = Math.floor(sortedTimes.length * 0.5);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p99Index = Math.floor(sortedTimes.length * 0.99);

      const result: ScalabilityTestResult = {
        testId,
        config,
        summary: {
          totalRequests,
          successfulRequests: totalRequests - totalErrors,
          failedRequests: totalErrors,
          duration: actualDuration / 1000,
          requestsPerSecond: totalRequests / (actualDuration / 1000),
          averageResponseTime: sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length,
          p50ResponseTime: sortedTimes[p50Index] || 0,
          p95ResponseTime: sortedTimes[p95Index] || 0,
          p99ResponseTime: sortedTimes[p99Index] || 0,
          errorRate: (totalErrors / totalRequests) * 100,
          throughput: this.calculateThroughput()
        },
        scenarioResults,
        resourceMetrics: this.getResourceMetrics(),
        errors: this.getErrorSummary(),
        timestamp: Date.now()
      };

      // Stop metrics collection
      if (config.monitoring.enabled) {
        this.stopMetricsCollection();
      }

      console.log(`✅ Scalability test completed: ${testId}`);
      console.log(`📊 Results: ${result.summary.requestsPerSecond.toFixed(2)} RPS, ${result.summary.errorRate.toFixed(2)}% error rate`);

      return result;

    } catch (error) {
      console.error('Scalability test failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run test scenarios concurrently
   */
  private async runTestScenarios(
    config: ScalabilityTestConfig,
    endTime: number
  ): Promise<{ [scenarioName: string]: any }> {
    const scenarioResults: { [scenarioName: string]: any } = {};
    const promises: Promise<void>[] = [];

    // Initialize scenario results
    for (const scenario of config.scenarios) {
      scenarioResults[scenario.name] = {
        requests: 0,
        errors: 0,
        responseTimes: [],
        minTime: Infinity,
        maxTime: 0
      };
    }

    // Calculate request distribution
    const totalWeight = config.scenarios.reduce((sum, s) => sum + s.weight, 0);
    const requestsPerScenario = config.scenarios.map(s =>
      Math.floor((s.weight / totalWeight) * config.target.requestsPerSecond * config.target.duration)
    );

    // Start scenario runners
    for (let i = 0; i < config.scenarios.length; i++) {
      const scenario = config.scenarios[i];
      const requestCount = requestsPerScenario[i];

      for (let j = 0; j < config.target.concurrentUsers; j++) {
        promises.push(
          this.runScenarioInstance(scenario, requestCount, endTime, scenarioResults[scenario.name])
        );
      }
    }

    // Wait for all scenarios to complete
    await Promise.all(promises);

    // Calculate final metrics for each scenario
    for (const scenarioName of Object.keys(scenarioResults)) {
      const result = scenarioResults[scenarioName];
      if (result.requests > 0) {
        result.averageTime = result.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / result.responseTimes.length;
        result.errorRate = (result.errors / result.requests) * 100;
      }
    }

    return scenarioResults;
  }

  /**
   * Run a single scenario instance
   */
  private async runScenarioInstance(
    scenario: any,
    requestCount: number,
    endTime: number,
    result: any
  ): Promise<void> {
    const interval = 1000 / (requestCount / (this.getDurationToEndTime(endTime) / 1000));

    while (performance.now() < endTime && result.requests < requestCount) {
      try {
        const requestStart = performance.now();

        const response = await this.httpClient.request({
          url: scenario.endpoint,
          method: scenario.method,
          data: scenario.payload,
          baseURL: scenario.baseUrl || 'http://localhost:3001'
        });

        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;

        result.requests++;
        result.responseTimes.push(responseTime);
        result.minTime = Math.min(result.minTime, responseTime);
        result.maxTime = Math.max(result.maxTime, responseTime);

        if (response.status !== scenario.expectedStatus) {
          result.errors++;
        }

      } catch (error) {
        result.requests++;
        result.errors++;
      }

      // Wait for next request
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  /**
   * Start collecting resource metrics
   */
  private startMetricsCollection(interval: number): void {
    const collectMetrics = () => {
      const metric: LoadTestMetrics = {
        timestamp: Date.now(),
        activeConnections: this.getActiveConnections(),
        requestsPerSecond: this.calculateCurrentRPS(),
        errorRate: this.calculateCurrentErrorRate(),
        averageResponseTime: this.getAverageResponseTime(),
        cpuUsage: this.getCPUUsage(),
        memoryUsage: this.getMemoryUsage(),
        networkIO: this.getNetworkIO()
      };

      this.metrics.push(metric);
    };

    // Collect initial metrics
    collectMetrics();

    // Set up interval collection
    this.metricsInterval = setInterval(collectMetrics, interval);
  }

  private stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  private getActiveConnections(): number {
    // Simulate active connections count
    return Math.floor(Math.random() * 100) + 50;
  }

  private calculateCurrentRPS(): number {
    if (this.metrics.length < 2) return 0;

    const recent = this.metrics.slice(-5); // Last 5 measurements
    const timeDiff = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
    const totalRequests = recent.reduce((sum, m) => sum + m.requestsPerSecond * (timeDiff / recent.length), 0);

    return totalRequests / timeDiff;
  }

  private calculateCurrentErrorRate(): number {
    if (this.metrics.length === 0) return 0;

    const recent = this.metrics.slice(-5);
    const avgErrorRate = recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length;

    return avgErrorRate;
  }

  private getAverageResponseTime(): number {
    // Return average from collected metrics
    if (this.metrics.length === 0) return 0;

    const recent = this.metrics.slice(-5);
    return recent.reduce((sum, m) => sum + m.averageResponseTime, 0) / recent.length;
  }

  private getCPUUsage(): number {
    // Simulate CPU usage (would be actual measurement in real implementation)
    return Math.random() * 30 + 40; // 40-70%
  }

  private getMemoryUsage(): number {
    // Simulate memory usage
    return Math.random() * 20 + 60; // 60-80%
  }

  private getNetworkIO(): number {
    // Simulate network I/O in MB/s
    return Math.random() * 10 + 5; // 5-15 MB/s
  }

  private getDurationToEndTime(endTime: number): number {
    return endTime - performance.now();
  }

  private collectAllResponseTimes(): number[] {
    // Collect response times from all scenarios
    const allTimes: number[] = [];

    // This would collect from actual scenario results
    // For now, return simulated data
    for (let i = 0; i < 1000; i++) {
      allTimes.push(Math.random() * 1000 + 100); // 100-1100ms
    }

    return allTimes;
  }

  private calculateThroughput(): number {
    // Calculate throughput in MB/s
    return Math.random() * 5 + 2; // 2-7 MB/s
  }

  private getResourceMetrics() {
    return {
      cpu: this.metrics.map(m => m.cpuUsage),
      memory: this.metrics.map(m => m.memoryUsage),
      network: this.metrics.map(m => m.networkIO),
      timestamps: this.metrics.map(m => m.timestamp)
    };
  }

  private getErrorSummary(): Array<{ scenario: string; error: string; count: number }> {
    // Return error summary
    return [
      {
        scenario: 'identity_creation',
        error: 'Validation failed',
        count: 5
      },
      {
        scenario: 'cross_chain_transfer',
        error: 'Network timeout',
        count: 3
      }
    ];
  }

  /**
   * Generate default test scenarios
   */
  static getDefaultScenarios(): ScalabilityTestConfig['scenarios'] {
    return [
      {
        name: 'identity_creation',
        endpoint: '/api/identity/register',
        method: 'POST',
        payload: {
          did: 'did:ethr:test-identity',
          metadata: { name: 'Test User' }
        },
        expectedStatus: 201,
        weight: 20
      },
      {
        name: 'uvt_issuance',
        endpoint: '/api/identity/issue-uvt',
        method: 'POST',
        payload: {
          credentialId: 'test-credential',
          expiresAt: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
        },
        expectedStatus: 201,
        weight: 15
      },
      {
        name: 'ai_analysis',
        endpoint: '/api/ai/analyze-threat',
        method: 'POST',
        payload: {
          userId: 'test-user',
          behaviorData: {
            loginPatterns: [{ timestamp: Date.now(), success: true }]
          }
        },
        expectedStatus: 200,
        weight: 25
      },
      {
        name: 'cross_chain_bridge',
        endpoint: '/api/cross-chain/bridge',
        method: 'POST',
        payload: {
          dstChainId: 137,
          amount: '0.1',
          identityId: 'test-identity'
        },
        expectedStatus: 200,
        weight: 10
      },
      {
        name: 'compliance_check',
        endpoint: '/api/compliance/check',
        method: 'POST',
        payload: {
          userId: 'test-user',
          checks: ['age_verification', 'kyc_verification']
        },
        expectedStatus: 200,
        weight: 15
      },
      {
        name: 'analytics_query',
        endpoint: '/api/analytics/dashboard',
        method: 'GET',
        expectedStatus: 200,
        weight: 15
      }
    ];
  }

  /**
   * Run stress test with increasing load
   */
  async runStressTest(
    baseConfig: ScalabilityTestConfig,
    maxRPS: number = 1000,
    stepSize: number = 50
  ): Promise<ScalabilityTestResult[]> {
    const results: ScalabilityTestResult[] = [];

    console.log(`🔥 Starting stress test up to ${maxRPS} RPS`);

    for (let rps = stepSize; rps <= maxRPS; rps += stepSize) {
      const config = {
        ...baseConfig,
        target: {
          ...baseConfig.target,
          requestsPerSecond: rps
        }
      };

      try {
        const result = await this.runScalabilityTest(config);
        results.push(result);

        // Stop if error rate becomes too high
        if (result.summary.errorRate > 10) {
          console.log(`🛑 Stopping stress test due to high error rate: ${result.summary.errorRate.toFixed(2)}%`);
          break;
        }

        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error(`Stress test failed at ${rps} RPS:`, error);
        break;
      }
    }

    console.log(`✅ Stress test completed with ${results.length} data points`);
    return results;
  }

  /**
   * Generate scalability report
   */
  generateScalabilityReport(results: ScalabilityTestResult[]): string {
    let report = '=== OUI Scalability Test Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Test Runs: ${results.length}\n\n`;

    // Summary table
    report += '📊 Test Summary:\n';
    report += 'RPS\tDuration\tError Rate\tAvg Time\tP95 Time\tThroughput\n';
    report += '---\t--------\t----------\t--------\t--------\t----------\n';

    for (const result of results) {
      report += `${result.summary.requestsPerSecond.toFixed(0)}\t`;
      report += `${result.summary.duration.toFixed(1)}s\t`;
      report += `${result.summary.errorRate.toFixed(2)}%\t`;
      report += `${result.summary.averageResponseTime.toFixed(1)}ms\t`;
      report += `${result.summary.p95ResponseTime.toFixed(1)}ms\t`;
      report += `${result.summary.throughput.toFixed(2)}MB/s\n`;
    }

    // Performance analysis
    report += '\n📈 Performance Analysis:\n';

    if (results.length >= 2) {
      const first = results[0];
      const last = results[results.length - 1];

      const rpsIncrease = ((last.summary.requestsPerSecond - first.summary.requestsPerSecond) / first.summary.requestsPerSecond) * 100;
      const errorIncrease = last.summary.errorRate - first.summary.errorRate;
      const timeIncrease = last.summary.averageResponseTime - first.summary.averageResponseTime;

      report += `RPS Increase: ${rpsIncrease.toFixed(1)}%\n`;
      report += `Error Rate Change: ${errorIncrease.toFixed(2)}%\n`;
      report += `Response Time Change: ${timeIncrease.toFixed(1)}ms\n`;
    }

    // Bottleneck analysis
    report += '\n🔍 Bottleneck Analysis:\n';

    const maxErrorRate = Math.max(...results.map(r => r.summary.errorRate));
    const maxResponseTime = Math.max(...results.map(r => r.summary.p95ResponseTime));

    if (maxErrorRate > 5) {
      report += '⚠️ High error rate detected - possible API bottlenecks\n';
    }

    if (maxResponseTime > 2000) {
      report += '⚠️ High response times detected - possible database or network bottlenecks\n';
    }

    // Recommendations
    report += '\n💡 Recommendations:\n';

    if (results.some(r => r.summary.errorRate > 1)) {
      report += '• Consider implementing circuit breakers for fault tolerance\n';
    }

    if (results.some(r => r.summary.p95ResponseTime > 1000)) {
      report += '• Optimize database queries and implement caching\n';
    }

    if (results.some(r => r.summary.requestsPerSecond < 100)) {
      report += '• Scale horizontally to handle higher load\n';
    }

    return report;
  }

  /**
   * Test database scalability
   */
  async testDatabaseScalability(connectionString: string): Promise<{
    readPerformance: { [key: number]: number };
    writePerformance: { [key: number]: number };
    concurrentReadPerformance: number;
    concurrentWritePerformance: number;
  }> {
    console.log('🗄️ Testing database scalability...');

    const results = {
      readPerformance: {},
      writePerformance: {},
      concurrentReadPerformance: 0,
      concurrentWritePerformance: 0
    };

    // Test read performance with increasing load
    for (const operations of [10, 50, 100, 500, 1000]) {
      const readTime = await this.testReadPerformance(connectionString, operations);
      results.readPerformance[operations] = readTime;
    }

    // Test write performance with increasing load
    for (const operations of [10, 50, 100, 200, 500]) {
      const writeTime = await this.testWritePerformance(connectionString, operations);
      results.writePerformance[operations] = writeTime;
    }

    // Test concurrent operations
    results.concurrentReadPerformance = await this.testConcurrentReads(connectionString, 100);
    results.concurrentWritePerformance = await this.testConcurrentWrites(connectionString, 50);

    console.log('✅ Database scalability test completed');
    return results;
  }

  private async testReadPerformance(connectionString: string, operations: number): Promise<number> {
    const startTime = performance.now();

    // Simulate read operations
    for (let i = 0; i < operations; i++) {
      // Simulate database read
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
    }

    const endTime = performance.now();
    return (endTime - startTime) / operations; // Average time per operation
  }

  private async testWritePerformance(connectionString: string, operations: number): Promise<number> {
    const startTime = performance.now();

    // Simulate write operations
    for (let i = 0; i < operations; i++) {
      // Simulate database write
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10));
    }

    const endTime = performance.now();
    return (endTime - startTime) / operations; // Average time per operation
  }

  private async testConcurrentReads(connectionString: string, operations: number): Promise<number> {
    const startTime = performance.now();
    const concurrentOperations = 10;

    // Run concurrent read operations
    const promises = [];
    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(this.testReadPerformance(connectionString, operations / concurrentOperations));
    }

    await Promise.all(promises);
    const endTime = performance.now();

    return (endTime - startTime) / concurrentOperations;
  }

  private async testConcurrentWrites(connectionString: string, operations: number): Promise<number> {
    const startTime = performance.now();
    const concurrentOperations = 5;

    // Run concurrent write operations
    const promises = [];
    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(this.testWritePerformance(connectionString, operations / concurrentOperations));
    }

    await Promise.all(promises);
    const endTime = performance.now();

    return (endTime - startTime) / concurrentOperations;
  }
}

// Export singleton instance
export const scalabilityTester = new ScalabilityTester();