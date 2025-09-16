// src/benchmarking/benchmark.ts
// Performance benchmarking utilities for OUI system

import { ethers } from 'ethers';
import { performance } from 'perf_hooks';

export interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  gasUsed?: number;
  throughput: number; // operations per second
  timestamp: number;
}

export interface LoadTestResult {
  endpoint: string;
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  timestamp: number;
}

export class OUIBenchmarker {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer;

  constructor(providerUrl: string, privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Benchmark smart contract operations
   */
  async benchmarkContractOperation(
    contract: ethers.Contract,
    methodName: string,
    args: any[] = [],
    iterations: number = 10
  ): Promise<BenchmarkResult> {
    const executionTimes: number[] = [];
    let totalGasUsed = 0;

    console.log(`Benchmarking ${methodName} with ${iterations} iterations...`);

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();

        const tx = await contract[methodName](...args);
        const receipt = await tx.wait();

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        executionTimes.push(executionTime);
        totalGasUsed += receipt.gasUsed;

        console.log(`Iteration ${i + 1}: ${executionTime.toFixed(2)}ms`);
      } catch (error) {
        console.error(`Iteration ${i + 1} failed:`, error);
        executionTimes.push(Number.MAX_VALUE); // Mark as failed
      }
    }

    const validTimes = executionTimes.filter(time => time !== Number.MAX_VALUE);
    const averageTime = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
    const minTime = Math.min(...validTimes);
    const maxTime = Math.max(...validTimes);
    const throughput = (iterations * 1000) / validTimes.reduce((sum, time) => sum + time, 0);

    return {
      operation: methodName,
      iterations,
      totalTime: validTimes.reduce((sum, time) => sum + time, 0),
      averageTime,
      minTime,
      maxTime,
      gasUsed: totalGasUsed / iterations,
      throughput,
      timestamp: Date.now()
    };
  }

  /**
   * Benchmark identity creation operations
   */
  async benchmarkIdentityCreation(
    ouiContract: ethers.Contract,
    iterations: number = 50
  ): Promise<BenchmarkResult> {
    const results: BenchmarkResult[] = [];

    console.log(`Benchmarking identity creation with ${iterations} identities...`);

    for (let i = 0; i < Math.ceil(iterations / 10); i++) {
      const batchSize = Math.min(10, iterations - i * 10);

      // Create multiple identities in parallel
      const promises = [];
      for (let j = 0; j < batchSize; j++) {
        const did = `did:ethr:test-${i * 10 + j}-${Date.now()}`;
        const didHash = ethers.keccak256(ethers.toUtf8Bytes(did));
        promises.push(ouiContract.createIdentity(didHash));
      }

      try {
        const startTime = performance.now();
        const txs = await Promise.all(promises);
        await Promise.all(txs.map(tx => tx.wait()));
        const endTime = performance.now();

        const executionTime = endTime - startTime;
        results.push({
          operation: 'batchIdentityCreation',
          iterations: batchSize,
          totalTime: executionTime,
          averageTime: executionTime / batchSize,
          minTime: executionTime / batchSize,
          maxTime: executionTime / batchSize,
          throughput: (batchSize * 1000) / executionTime,
          timestamp: Date.now()
        });

        console.log(`Batch ${i + 1}: ${batchSize} identities in ${executionTime.toFixed(2)}ms`);
      } catch (error) {
        console.error(`Batch ${i + 1} failed:`, error);
      }
    }

    // Return aggregated results
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
    const totalIterations = results.reduce((sum, r) => sum + r.iterations, 0);

    return {
      operation: 'identityCreation',
      iterations: totalIterations,
      totalTime,
      averageTime: totalTime / totalIterations,
      minTime: Math.min(...results.map(r => r.minTime)),
      maxTime: Math.max(...results.map(r => r.maxTime)),
      throughput: (totalIterations * 1000) / totalTime,
      timestamp: Date.now()
    };
  }

  /**
   * Benchmark UVT operations
   */
  async benchmarkUVTOperations(
    ouiContract: ethers.Contract,
    iterations: number = 30
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    // First create identities
    console.log('Creating test identities for UVT benchmarking...');
    const identities: string[] = [];
    for (let i = 0; i < Math.min(iterations, 10); i++) {
      try {
        const did = `did:ethr:uvt-test-${i}-${Date.now()}`;
        const didHash = ethers.keccak256(ethers.toUtf8Bytes(did));
        const tx = await ouiContract.createIdentity(didHash);
        await tx.wait();
        identities.push(didHash);
      } catch (error) {
        console.error(`Failed to create identity ${i}:`, error);
      }
    }

    if (identities.length === 0) {
      throw new Error('No identities created for UVT testing');
    }

    // Benchmark UVT issuance
    console.log(`Benchmarking UVT issuance with ${iterations} tokens...`);
    const issuanceTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();

        const credentialId = ethers.keccak256(ethers.toUtf8Bytes(`credential-${i}`));
        const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

        const tx = await ouiContract.issueUVT(credentialId, expiresAt);
        await tx.wait();

        const endTime = performance.now();
        issuanceTimes.push(endTime - startTime);

        console.log(`UVT ${i + 1}: ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
        console.error(`UVT ${i + 1} issuance failed:`, error);
        issuanceTimes.push(Number.MAX_VALUE);
      }
    }

    const validIssuanceTimes = issuanceTimes.filter(time => time !== Number.MAX_VALUE);
    results.push({
      operation: 'uvtIssuance',
      iterations,
      totalTime: validIssuanceTimes.reduce((sum, time) => sum + time, 0),
      averageTime: validIssuanceTimes.reduce((sum, time) => sum + time, 0) / validIssuanceTimes.length,
      minTime: Math.min(...validIssuanceTimes),
      maxTime: Math.max(...validIssuanceTimes),
      throughput: (iterations * 1000) / validIssuanceTimes.reduce((sum, time) => sum + time, 0),
      timestamp: Date.now()
    });

    return results;
  }

  /**
   * Benchmark watermarking operations
   */
  async benchmarkWatermarking(
    watermarkContract: ethers.Contract,
    iterations: number = 20
  ): Promise<BenchmarkResult> {
    const executionTimes: number[] = [];

    console.log(`Benchmarking asset watermarking with ${iterations} assets...`);

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();

        const assetId = ethers.keccak256(ethers.toUtf8Bytes(`asset-${i}-${Date.now()}`));
        const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(`metadata-${i}`));

        const tx = await watermarkContract.watermarkAsset(
          assetId,
          ethers.ZeroHash, // ouiDid placeholder
          'image',
          metadataHash
        );
        await tx.wait();

        const endTime = performance.now();
        executionTimes.push(endTime - startTime);

        console.log(`Asset ${i + 1}: ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
        console.error(`Asset ${i + 1} watermarking failed:`, error);
        executionTimes.push(Number.MAX_VALUE);
      }
    }

    const validTimes = executionTimes.filter(time => time !== Number.MAX_VALUE);

    return {
      operation: 'assetWatermarking',
      iterations,
      totalTime: validTimes.reduce((sum, time) => sum + time, 0),
      averageTime: validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length,
      minTime: Math.min(...validTimes),
      maxTime: Math.max(...validTimes),
      throughput: (iterations * 1000) / validTimes.reduce((sum, time) => sum + time, 0),
      timestamp: Date.now()
    };
  }

  /**
   * Run comprehensive benchmark suite
   */
  async runComprehensiveBenchmark(
    ouiContract: ethers.Contract,
    watermarkContract: ethers.Contract
  ): Promise<{
    identityBenchmark: BenchmarkResult;
    uvtBenchmark: BenchmarkResult[];
    watermarkBenchmark: BenchmarkResult;
    summary: any;
  }> {
    console.log('Starting comprehensive OUI benchmark suite...');

    const identityBenchmark = await this.benchmarkIdentityCreation(ouiContract, 20);
    const uvtBenchmark = await this.benchmarkUVTOperations(ouiContract, 15);
    const watermarkBenchmark = await this.benchmarkWatermarking(watermarkContract, 10);

    const summary = {
      totalOperations: identityBenchmark.iterations + uvtBenchmark[0].iterations + watermarkBenchmark.iterations,
      averageThroughput: (identityBenchmark.throughput + uvtBenchmark[0].throughput + watermarkBenchmark.throughput) / 3,
      fastestOperation: Math.min(identityBenchmark.averageTime, uvtBenchmark[0].averageTime, watermarkBenchmark.averageTime),
      slowestOperation: Math.max(identityBenchmark.averageTime, uvtBenchmark[0].averageTime, watermarkBenchmark.averageTime),
      timestamp: Date.now()
    };

    console.log('Benchmark suite completed!');
    console.log('Summary:', summary);

    return {
      identityBenchmark,
      uvtBenchmark,
      watermarkBenchmark,
      summary
    };
  }

  /**
   * Export benchmark results to JSON
   */
  exportResults(results: BenchmarkResult | BenchmarkResult[], filename: string): void {
    const data = Array.isArray(results) ? results : [results];
    const jsonData = JSON.stringify(data, null, 2);

    // In Node.js environment, this would write to file
    // For now, just log to console
    console.log(`Benchmark Results (${filename}):`);
    console.log(jsonData);
  }
}

// Utility functions for load testing
export class LoadTester {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async loadTestEndpoint(
    endpoint: string,
    concurrentUsers: number = 10,
    totalRequests: number = 100,
    requestData?: any
  ): Promise<LoadTestResult> {
    const responseTimes: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;

    console.log(`Load testing ${endpoint} with ${concurrentUsers} concurrent users...`);

    // Simple load testing implementation
    const promises: Promise<void>[] = [];

    for (let i = 0; i < totalRequests; i++) {
      promises.push(
        (async () => {
          try {
            const startTime = performance.now();

            // Make request (simplified - would use axios/fetch in real implementation)
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
              method: requestData ? 'POST' : 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              body: requestData ? JSON.stringify(requestData) : undefined,
            });

            const endTime = performance.now();

            if (response.ok) {
              successfulRequests++;
              responseTimes.push(endTime - startTime);
            } else {
              failedRequests++;
            }
          } catch (error) {
            failedRequests++;
            console.error(`Request ${i + 1} failed:`, error);
          }
        })()
      );

      // Control concurrency
      if (promises.length >= concurrentUsers) {
        await Promise.all(promises.splice(0, concurrentUsers));
      }
    }

    // Wait for remaining requests
    await Promise.all(promises);

    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95ResponseTime = sortedTimes[p95Index] || 0;

    return {
      endpoint,
      concurrentUsers,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime,
      errorRate: (failedRequests / totalRequests) * 100,
      timestamp: Date.now()
    };
  }

  async comprehensiveLoadTest(): Promise<LoadTestResult[]> {
    const endpoints = [
      '/analytics/dashboard',
      '/identity',
      '/dao/proposal/1',
      '/watermark/test-asset-id'
    ];

    const results: LoadTestResult[] = [];

    for (const endpoint of endpoints) {
      const result = await this.loadTestEndpoint(endpoint, 5, 20);
      results.push(result);
      console.log(`Load test for ${endpoint}: ${result.successfulRequests}/${result.totalRequests} successful`);
    }

    return results;
  }
}

// Helper function to run benchmarks
export async function runBenchmarkSuite(
  providerUrl: string,
  privateKey: string,
  contractAddresses: {
    ouiIdentity: string;
    watermark: string;
  }
): Promise<void> {
  const benchmarker = new OUIBenchmarker(providerUrl, privateKey);

  // Contract instances would be created here with actual ABIs
  // const ouiContract = new ethers.Contract(contractAddresses.ouiIdentity, ouiABI, signer);
  // const watermarkContract = new ethers.Contract(contractAddresses.watermark, watermarkABI, signer);

  console.log('Benchmark suite setup complete. Contracts need to be instantiated with actual ABIs.');
}