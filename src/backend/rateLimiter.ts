/**
 * API Rate Limiting and DDoS Protection for OUI
 * Phase 3: Production Security and Performance
 */

import express from 'express';

export interface RateLimitRule {
  id: string;
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | '*';
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: express.Request) => string;
  handler?: (req: express.Request, res: express.Response) => void;
  enabled: boolean;
}

export interface RateLimitResult {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  uniqueIPs: number;
  topOffenders: Array<{
    ip: string;
    requestCount: number;
    blockedCount: number;
  }>;
}

export interface DDoSProtectionConfig {
  enabled: boolean;
  maxRequestsPerSecond: number;
  maxConnectionsPerIP: number;
  blockDuration: number; // milliseconds
  whitelist: string[];
  blacklist: string[];
  adaptiveThreshold: boolean;
}

export class RateLimiter {
  private rules: Map<string, RateLimitRule> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number; blocked: boolean }[]> = new Map();
  private ipBlacklist: Set<string> = new Set();
  private ipWhitelist: Set<string> = new Set();
  private ddosConfig: DDoSProtectionConfig;
  private globalRequestCounts: Map<string, number[]> = new Map();

  constructor(ddosConfig: DDoSProtectionConfig) {
    this.ddosConfig = ddosConfig;
    this.initializeDefaultRules();
    this.startCleanupTask();
  }

  /**
   * Initialize default rate limiting rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: RateLimitRule[] = [
      {
        id: 'global_api_limit',
        name: 'Global API Rate Limit',
        endpoint: '/api/*',
        method: '*',
        windowMs: 60000, // 1 minute
        maxRequests: 1000,
        enabled: true
      },
      {
        id: 'identity_creation_limit',
        name: 'Identity Creation Rate Limit',
        endpoint: '/api/identity/register',
        method: 'POST',
        windowMs: 60000, // 1 minute
        maxRequests: 10, // Max 10 identities per minute per IP
        enabled: true
      },
      {
        id: 'uvt_issuance_limit',
        name: 'UVT Issuance Rate Limit',
        endpoint: '/api/identity/issue-uvt',
        method: 'POST',
        windowMs: 60000,
        maxRequests: 50,
        enabled: true
      },
      {
        id: 'cross_chain_limit',
        name: 'Cross-chain Transfer Rate Limit',
        endpoint: '/api/cross-chain/bridge',
        method: 'POST',
        windowMs: 300000, // 5 minutes
        maxRequests: 5, // Max 5 cross-chain transfers per 5 minutes
        enabled: true
      },
      {
        id: 'ai_analysis_limit',
        name: 'AI Analysis Rate Limit',
        endpoint: '/api/ai/analyze-threat',
        method: 'POST',
        windowMs: 60000,
        maxRequests: 20,
        enabled: true
      },
      {
        id: 'zkp_verification_limit',
        name: 'ZKP Verification Rate Limit',
        endpoint: '/api/compliance/*',
        method: '*',
        windowMs: 60000,
        maxRequests: 30,
        enabled: true
      },
      {
        id: 'batch_operations_limit',
        name: 'Batch Operations Rate Limit',
        endpoint: '/*/batch*',
        method: '*',
        windowMs: 60000,
        maxRequests: 5, // Max 5 batch operations per minute
        enabled: true
      }
    ];

    for (const rule of defaultRules) {
      this.addRule(rule);
    }
  }

  /**
   * Add a rate limiting rule
   */
  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a rate limiting rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Check if request should be rate limited
   */
  checkRateLimit(req: express.Request): {
    allowed: boolean;
    rule?: RateLimitRule;
    resetTime?: number;
    remainingRequests?: number;
  } {
    const clientIP = this.getClientIP(req);
    const endpoint = req.path;
    const method = req.method;

    // Check whitelist
    if (this.ipWhitelist.has(clientIP)) {
      return { allowed: true };
    }

    // Check blacklist
    if (this.ipBlacklist.has(clientIP)) {
      return {
        allowed: false,
        rule: this.getBlacklistRule(),
        resetTime: Date.now() + this.ddosConfig.blockDuration
      };
    }

    // Check each applicable rule
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!this.matchesRule(rule, endpoint, method)) continue;

      const key = this.generateKey(rule, req);
      const now = Date.now();

      // Initialize or get current window
      if (!this.requestCounts.has(key)) {
        this.requestCounts.set(key, []);
      }

      const windows = this.requestCounts.get(key)!;

      // Clean expired windows
      const validWindows = windows.filter(w => now < w.resetTime);

      // Check if limit exceeded
      const currentWindow = validWindows.find(w => w.resetTime > now);
      const requestCount = currentWindow ? currentWindow.count : 0;

      if (requestCount >= rule.maxRequests) {
        // Record blocked request
        this.recordBlockedRequest(clientIP);

        return {
          allowed: false,
          rule,
          resetTime: currentWindow?.resetTime,
          remainingRequests: 0
        };
      }

      // Update request count
      if (currentWindow) {
        currentWindow.count++;
      } else {
        // Create new window
        validWindows.push({
          count: 1,
          resetTime: now + rule.windowMs,
          blocked: false
        });
      }

      this.requestCounts.set(key, validWindows);

      return {
        allowed: true,
        rule,
        resetTime: currentWindow?.resetTime || (now + rule.windowMs),
        remainingRequests: rule.maxRequests - requestCount - 1
      };
    }

    return { allowed: true };
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: express.Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();
  }

  /**
   * Check if request matches rule
   */
  private matchesRule(rule: RateLimitRule, endpoint: string, method: string): boolean {
    const endpointMatch = rule.endpoint.includes('*') ?
      this.matchWildcard(rule.endpoint, endpoint) :
      rule.endpoint === endpoint;

    const methodMatch = rule.method === '*' || rule.method === method;

    return endpointMatch && methodMatch;
  }

  /**
   * Simple wildcard matching
   */
  private matchWildcard(pattern: string, target: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(target);
  }

  /**
   * Generate cache key for rule
   */
  private generateKey(rule: RateLimitRule, req: express.Request): string {
    if (rule.keyGenerator) {
      return rule.keyGenerator(req);
    }

    // Default key generator uses IP + endpoint
    const ip = this.getClientIP(req);
    return `${ip}:${req.method}:${req.path}`;
  }

  /**
   * Record blocked request for DDoS detection
   */
  private recordBlockedRequest(clientIP: string): void {
    const now = Date.now();
    const windowKey = `${clientIP}_${Math.floor(now / 1000)}`; // Per second window

    if (!this.globalRequestCounts.has(windowKey)) {
      this.globalRequestCounts.set(windowKey, []);
    }

    const counts = this.globalRequestCounts.get(windowKey)!;
    counts.push(now);

    // Check for DDoS attack
    if (counts.length > this.ddosConfig.maxRequestsPerSecond) {
      this.triggerDDoSProtection(clientIP);
    }
  }

  /**
   * Trigger DDoS protection
   */
  private triggerDDoSProtection(clientIP: string): void {
    if (!this.ddosConfig.enabled) return;

    console.warn(`🚨 DDoS Protection: Blocking IP ${clientIP} for suspicious activity`);

    this.ipBlacklist.add(clientIP);

    // Auto-remove from blacklist after block duration
    setTimeout(() => {
      this.ipBlacklist.delete(clientIP);
      console.log(`✅ DDoS Protection: Unblocked IP ${clientIP}`);
    }, this.ddosConfig.blockDuration);
  }

  /**
   * Get blacklist rule
   */
  private getBlacklistRule(): RateLimitRule {
    return {
      id: 'ddos_blacklist',
      name: 'DDoS Blacklist Rule',
      endpoint: '*',
      method: '*',
      windowMs: this.ddosConfig.blockDuration,
      maxRequests: 0,
      enabled: true
    };
  }

  /**
   * Adaptive rate limiting based on system load
   */
  adjustLimitsBasedOnLoad(systemLoad: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    errorRate: number;
  }): void {
    if (!this.ddosConfig.adaptiveThreshold) return;

    // Adjust limits based on system load
    const loadFactor = Math.max(
      systemLoad.cpuUsage / 100,
      systemLoad.memoryUsage / 100,
      systemLoad.errorRate
    );

    if (loadFactor > 0.8) {
      // High load - reduce limits
      this.adjustAllLimits(-0.3); // 30% reduction
    } else if (loadFactor < 0.3) {
      // Low load - increase limits
      this.adjustAllLimits(0.2); // 20% increase
    }
  }

  /**
   * Adjust all rate limits by a factor
   */
  private adjustAllLimits(factor: number): void {
    for (const rule of this.rules.values()) {
      if (rule.enabled) {
        rule.maxRequests = Math.max(1, Math.floor(rule.maxRequests * (1 + factor)));
      }
    }
  }

  /**
   * Clean up expired rate limit windows
   */
  private startCleanupTask(): void {
    setInterval(() => {
      this.cleanupExpiredWindows();
    }, 60000); // Clean every minute
  }

  private cleanupExpiredWindows(): void {
    const now = Date.now();

    for (const [key, windows] of this.requestCounts.entries()) {
      const validWindows = windows.filter(w => w.resetTime > now);

      if (validWindows.length === 0) {
        this.requestCounts.delete(key);
      } else {
        this.requestCounts.set(key, validWindows);
      }
    }

    // Clean old global request counts
    for (const [windowKey, counts] of this.globalRequestCounts.entries()) {
      const validCounts = counts.filter(timestamp => now - timestamp < 60000); // Keep last minute

      if (validCounts.length === 0) {
        this.globalRequestCounts.delete(windowKey);
      } else {
        this.globalRequestCounts.set(windowKey, validCounts);
      }
    }
  }

  /**
   * Get rate limiting statistics
   */
  getStatistics(): RateLimitResult {
    let totalRequests = 0;
    let blockedRequests = 0;
    let allowedRequests = 0;
    const ipCounts: Map<string, { total: number; blocked: number }> = new Map();

    // Analyze request counts
    for (const [key, windows] of this.requestCounts.entries()) {
      for (const window of windows) {
        totalRequests += window.count;
        if (window.blocked) {
          blockedRequests += window.count;
        } else {
          allowedRequests += window.count;
        }

        // Extract IP from key
        const ip = key.split(':')[0];
        if (!ipCounts.has(ip)) {
          ipCounts.set(ip, { total: 0, blocked: 0 });
        }
        const ipData = ipCounts.get(ip)!;
        ipData.total += window.count;
        if (window.blocked) {
          ipData.blocked += window.count;
        }
      }
    }

    // Get top offenders
    const topOffenders = Array.from(ipCounts.entries())
      .map(([ip, data]) => ({
        ip,
        requestCount: data.total,
        blockedCount: data.blocked
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    return {
      totalRequests,
      blockedRequests,
      allowedRequests,
      uniqueIPs: ipCounts.size,
      topOffenders
    };
  }

  /**
   * Add IP to whitelist
   */
  addToWhitelist(ip: string): void {
    this.ipWhitelist.add(ip);
    this.ipBlacklist.delete(ip); // Remove from blacklist if present
  }

  /**
   * Remove IP from whitelist
   */
  removeFromWhitelist(ip: string): void {
    this.ipWhitelist.delete(ip);
  }

  /**
   * Add IP to blacklist
   */
  addToBlacklist(ip: string): void {
    this.ipBlacklist.add(ip);
    this.ipWhitelist.delete(ip); // Remove from whitelist if present
  }

  /**
   * Remove IP from blacklist
   */
  removeFromBlacklist(ip: string): void {
    this.ipBlacklist.delete(ip);
  }

  /**
   * Get current whitelist
   */
  getWhitelist(): string[] {
    return Array.from(this.ipWhitelist);
  }

  /**
   * Get current blacklist
   */
  getBlacklist(): string[] {
    return Array.from(this.ipBlacklist);
  }
}

// Express middleware function
export function createRateLimitMiddleware(rateLimiter: RateLimiter) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const result = rateLimiter.checkRateLimit(req);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': result.rule?.maxRequests || 'unlimited',
      'X-RateLimit-Remaining': result.remainingRequests || 'unlimited',
      'X-RateLimit-Reset': result.resetTime || 'unknown',
      'X-RateLimit-Allowed': result.allowed ? 'true' : 'false'
    });

    if (!result.allowed) {
      // Record blocked request
      rateLimiter['recordBlockedRequest'](rateLimiter['getClientIP'](req));

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        resetTime: result.resetTime,
        retryAfter: Math.ceil((result.resetTime! - Date.now()) / 1000)
      });
    }

    next();
  };
}

// Default DDoS protection configuration
export const DEFAULT_DDOS_CONFIG: DDoSProtectionConfig = {
  enabled: true,
  maxRequestsPerSecond: 100,
  maxConnectionsPerIP: 50,
  blockDuration: 300000, // 5 minutes
  whitelist: [
    '127.0.0.1',
    '10.0.0.0/8', // Private networks
    '192.168.0.0/16',
    '172.16.0.0/12'
  ],
  blacklist: [],
  adaptiveThreshold: true
};

// Export singleton instance
export const rateLimiter = new RateLimiter(DEFAULT_DDOS_CONFIG);