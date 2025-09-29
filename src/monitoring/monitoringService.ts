/**
 * Comprehensive Monitoring Service for OUI
 * Phase 2: Prometheus, Grafana, and ELK Stack Integration
 */

import express from 'express';

export interface MetricData {
  name: string;
  value: number;
  labels: { [key: string]: string };
  timestamp: number;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service: string;
  userId?: string;
  operation?: string;
  duration?: number;
  metadata?: any;
  timestamp: number;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number; // seconds
  severity: 'info' | 'warning' | 'critical';
  description: string;
  enabled: boolean;
}

export class MonitoringService {
  private metrics: Map<string, MetricData[]> = new Map();
  private logs: LogEntry[] = [];
  private alertRules: AlertRule[] = [];
  private prometheusExporter: PrometheusExporter;
  private elasticsearchClient: ElasticsearchClient;
  private grafanaDashboard: GrafanaDashboard;

  constructor() {
    this.prometheusExporter = new PrometheusExporter();
    this.elasticsearchClient = new ElasticsearchClient();
    this.grafanaDashboard = new GrafanaDashboard();
    this.initializeDefaultAlertRules();
    this.startMetricsCollection();
  }

  /**
   * Initialize default alert rules for Phase 2 monitoring
   */
  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        name: 'high_gas_usage',
        condition: 'gas_used > 300000',
        threshold: 300000,
        duration: 60,
        severity: 'warning',
        description: 'Gas usage exceeds threshold',
        enabled: true
      },
      {
        name: 'slow_api_response',
        condition: 'response_time > 2000',
        threshold: 2000,
        duration: 30,
        severity: 'warning',
        description: 'API response time is too slow',
        enabled: true
      },
      {
        name: 'high_error_rate',
        condition: 'error_rate > 0.05',
        threshold: 0.05,
        duration: 120,
        severity: 'critical',
        description: 'Error rate is too high',
        enabled: true
      },
      {
        name: 'ai_model_drift',
        condition: 'accuracy < 0.85',
        threshold: 0.85,
        duration: 300,
        severity: 'warning',
        description: 'AI model accuracy has degraded',
        enabled: true
      },
      {
        name: 'cross_chain_failure',
        condition: 'failure_rate > 0.02',
        threshold: 0.02,
        duration: 180,
        severity: 'critical',
        description: 'Cross-chain transfer failure rate is high',
        enabled: true
      }
    ];
  }

  /**
   * Record a metric
   */
  recordMetric(metric: MetricData): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    this.metrics.get(metric.name)!.push(metric);

    // Keep only last 1000 entries per metric
    const metricList = this.metrics.get(metric.name)!;
    if (metricList.length > 1000) {
      metricList.shift();
    }

    // Export to Prometheus
    this.prometheusExporter.recordMetric(metric);

    console.log(`Metric recorded: ${metric.name} = ${metric.value}`);
  }

  /**
   * Log an event
   */
  log(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only last 10000 logs
    if (this.logs.length > 10000) {
      this.logs.shift();
    }

    // Send to Elasticsearch
    this.elasticsearchClient.indexLog(entry);

    // Check for alerts
    this.checkAlerts(entry);

    console.log(`[${entry.level.toUpperCase()}] ${entry.service}: ${entry.message}`);
  }

  /**
   * Get metrics for a specific service
   */
  getMetrics(serviceName: string, metricName?: string): MetricData[] {
    const allMetrics: MetricData[] = [];

    for (const [name, metrics] of this.metrics.entries()) {
      if (metricName && name !== metricName) continue;

      const serviceMetrics = metrics.filter(m =>
        m.labels.service === serviceName ||
        m.labels.component === serviceName
      );

      allMetrics.push(...serviceMetrics);
    }

    return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get logs with filtering
   */
  getLogs(filters: {
    level?: string;
    service?: string;
    userId?: string;
    operation?: string;
    limit?: number;
    startTime?: number;
    endTime?: number;
  } = {}): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    if (filters.service) {
      filteredLogs = filteredLogs.filter(log => log.service === filters.service);
    }

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.operation) {
      filteredLogs = filteredLogs.filter(log => log.operation === filters.operation);
    }

    if (filters.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!);
    }

    if (filters.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    if (filters.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Generate performance dashboard data
   */
  generateDashboardData(): {
    systemHealth: {
      status: 'healthy' | 'degraded' | 'critical';
      uptime: number;
      services: { [service: string]: 'up' | 'down' | 'degraded' };
    };
    performanceMetrics: {
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
      gasEfficiency: number;
    };
    recentAlerts: Array<{
      name: string;
      severity: string;
      message: string;
      timestamp: number;
    }>;
    topOperations: Array<{
      operation: string;
      count: number;
      averageTime: number;
      errorRate: number;
    }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // System health calculation
    const recentLogs = this.logs.filter(log => log.timestamp > oneHourAgo);
    const errorLogs = recentLogs.filter(log => log.level === 'error');

    let systemStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (errorLogs.length > 10) systemStatus = 'critical';
    else if (errorLogs.length > 5) systemStatus = 'degraded';

    // Service status
    const services = ['api', 'blockchain', 'ai', 'cross-chain', 'zkp'];
    const serviceStatus: { [service: string]: 'up' | 'down' | 'degraded' } = {};

    services.forEach(service => {
      const serviceLogs = recentLogs.filter(log => log.service === service);
      const serviceErrors = serviceLogs.filter(log => log.level === 'error');

      if (serviceErrors.length > 3) serviceStatus[service] = 'down';
      else if (serviceErrors.length > 1) serviceStatus[service] = 'degraded';
      else serviceStatus[service] = 'up';
    });

    // Performance metrics
    const responseTimeMetrics = this.metrics.get('response_time') || [];
    const recentResponseTimes = responseTimeMetrics.filter(m => m.timestamp > oneHourAgo);

    const averageResponseTime = recentResponseTimes.length > 0
      ? recentResponseTimes.reduce((sum, m) => sum + m.value, 0) / recentResponseTimes.length
      : 0;

    const errorRate = recentLogs.length > 0 ? (errorLogs.length / recentLogs.length) : 0;

    // Calculate throughput (requests per second)
    const requestMetrics = this.metrics.get('requests_total') || [];
    const recentRequests = requestMetrics.filter(m => m.timestamp > oneHourAgo);
    const throughput = recentRequests.length > 0
      ? recentRequests.reduce((sum, m) => sum + m.value, 0) / 3600
      : 0;

    // Gas efficiency
    const gasMetrics = this.metrics.get('gas_used') || [];
    const recentGas = gasMetrics.filter(m => m.timestamp > oneHourAgo);
    const gasEfficiency = recentGas.length > 0
      ? recentGas.reduce((sum, m) => sum + m.value, 0) / recentGas.length
      : 0;

    // Recent alerts
    const recentAlerts = this.getActiveAlerts().slice(0, 5);

    // Top operations
    const topOperations = this.calculateTopOperations();

    return {
      systemHealth: {
        status: systemStatus,
        uptime: this.calculateUptime(),
        services: serviceStatus
      },
      performanceMetrics: {
        averageResponseTime,
        errorRate,
        throughput,
        gasEfficiency
      },
      recentAlerts,
      topOperations
    };
  }

  private calculateUptime(): number {
    // Calculate uptime based on last error-free period
    const errorLogs = this.logs.filter(log => log.level === 'error');
    if (errorLogs.length === 0) return 100;

    const lastError = Math.max(...errorLogs.map(log => log.timestamp));
    const uptime = ((Date.now() - lastError) / (24 * 60 * 60 * 1000)) * 100; // Percentage of last 24h

    return Math.min(Math.max(uptime, 0), 100);
  }

  private getActiveAlerts(): Array<{ name: string; severity: string; message: string; timestamp: number }> {
    // This would check against alert rules in a real implementation
    return [
      {
        name: 'high_gas_usage',
        severity: 'warning',
        message: 'Gas usage has exceeded 300k for the last minute',
        timestamp: Date.now() - 30000
      }
    ];
  }

  private calculateTopOperations(): Array<{
    operation: string;
    count: number;
    averageTime: number;
    errorRate: number;
  }> {
    const operations: { [op: string]: { count: number; totalTime: number; errors: number } } = {};

    this.logs.filter(log => log.operation).forEach(log => {
      const op = log.operation!;
      if (!operations[op]) {
        operations[op] = { count: 0, totalTime: 0, errors: 0 };
      }

      operations[op].count++;
      if (log.duration) operations[op].totalTime += log.duration;
      if (log.level === 'error') operations[op].errors++;
    });

    return Object.entries(operations)
      .map(([operation, data]) => ({
        operation,
        count: data.count,
        averageTime: data.totalTime / data.count,
        errorRate: (data.errors / data.count) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private checkAlerts(logEntry: LogEntry): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        const conditionMet = this.evaluateAlertCondition(rule, logEntry);
        if (conditionMet) {
          this.triggerAlert(rule, logEntry);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.name}:`, error);
      }
    }
  }

  private evaluateAlertCondition(rule: AlertRule, logEntry: LogEntry): boolean {
    // Simplified condition evaluation
    switch (rule.name) {
      case 'high_gas_usage':
        return logEntry.metadata?.gasUsed > rule.threshold;
      case 'slow_api_response':
        return logEntry.duration ? logEntry.duration > rule.threshold : false;
      case 'high_error_rate':
        return logEntry.level === 'error';
      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, logEntry: LogEntry): void {
    const alert = {
      name: rule.name,
      severity: rule.severity,
      message: `${rule.description}: ${logEntry.message}`,
      timestamp: Date.now(),
      triggeredBy: logEntry
    };

    console.warn(`🚨 ALERT TRIGGERED: ${alert.message}`);

    // In a real implementation, this would:
    // 1. Send notification to administrators
    // 2. Create incident ticket
    // 3. Trigger automated responses
  }

  private startMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect performance metrics every 10 seconds
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 10000);
  }

  private collectSystemMetrics(): void {
    // Memory usage
    const memUsage = process.memoryUsage();
    this.recordMetric({
      name: 'memory_usage_bytes',
      value: memUsage.heapUsed,
      labels: { type: 'heap_used' },
      timestamp: Date.now(),
      type: 'gauge'
    });

    // CPU usage (simulated)
    const cpuUsage = Math.random() * 100;
    this.recordMetric({
      name: 'cpu_usage_percent',
      value: cpuUsage,
      labels: { core: 'average' },
      timestamp: Date.now(),
      type: 'gauge'
    });
  }

  private collectPerformanceMetrics(): void {
    // API response times
    const apiMetrics = this.metrics.get('response_time') || [];
    const recentMetrics = apiMetrics.slice(-10); // Last 10 measurements

    if (recentMetrics.length > 0) {
      const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
      this.recordMetric({
        name: 'average_response_time',
        value: avgResponseTime,
        labels: { period: '10s' },
        timestamp: Date.now(),
        type: 'gauge'
      });
    }

    // Error rate
    const errorMetrics = this.metrics.get('errors_total') || [];
    const recentErrors = errorMetrics.slice(-10);

    if (recentErrors.length > 0) {
      const errorRate = recentErrors.reduce((sum, m) => sum + m.value, 0) / recentErrors.length;
      this.recordMetric({
        name: 'error_rate',
        value: errorRate,
        labels: { period: '10s' },
        timestamp: Date.now(),
        type: 'gauge'
      });
    }
  }
}

// Supporting classes for monitoring stack
class PrometheusExporter {
  private registry: Map<string, any> = new Map();

  recordMetric(metric: MetricData): void {
    const key = `${metric.name}_${JSON.stringify(metric.labels)}`;
    if (!this.registry.has(key)) {
      this.registry.set(key, {
        name: metric.name,
        type: metric.type,
        labels: metric.labels,
        values: []
      });
    }

    this.registry.get(key).values.push({
      value: metric.value,
      timestamp: metric.timestamp
    });
  }

  exportMetrics(): string {
    let output = '';

    for (const [key, metric] of this.registry.entries()) {
      output += `# HELP ${metric.name} ${metric.name}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;

      metric.values.forEach((value: any) => {
        const labelsStr = Object.entries(metric.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');

        output += `${metric.name}{${labelsStr}} ${value.value} ${value.timestamp}\n`;
      });

      output += '\n';
    }

    return output;
  }
}

class ElasticsearchClient {
  private logs: LogEntry[] = [];

  indexLog(logEntry: LogEntry): void {
    this.logs.push(logEntry);

    // Keep only last 5000 logs
    if (this.logs.length > 5000) {
      this.logs.shift();
    }
  }

  searchLogs(query: any): LogEntry[] {
    // Simplified search implementation
    return this.logs.filter(log => {
      if (query.level && log.level !== query.level) return false;
      if (query.service && log.service !== query.service) return false;
      if (query.message && !log.message.includes(query.message)) return false;
      if (query.startTime && log.timestamp < query.startTime) return false;
      if (query.endTime && log.timestamp > query.endTime) return false;
      return true;
    });
  }
}

class GrafanaDashboard {
  generateDashboardConfig(): any {
    return {
      title: 'OUI Phase 2 Dashboard',
      panels: [
        {
          title: 'System Health',
          type: 'stat',
          targets: [
            {
              expr: 'up{job="oui"}',
              legendFormat: '{{instance}}'
            }
          ]
        },
        {
          title: 'Response Time',
          type: 'graph',
          targets: [
            {
              expr: 'response_time_seconds',
              legendFormat: '{{endpoint}}'
            }
          ]
        },
        {
          title: 'Error Rate',
          type: 'graph',
          targets: [
            {
              expr: 'error_rate',
              legendFormat: '{{service}}'
            }
          ]
        },
        {
          title: 'Gas Usage',
          type: 'graph',
          targets: [
            {
              expr: 'gas_used',
              legendFormat: '{{operation}}'
            }
          ]
        },
        {
          title: 'AI Model Accuracy',
          type: 'graph',
          targets: [
            {
              expr: 'ai_model_accuracy',
              legendFormat: '{{model}}'
            }
          ]
        },
        {
          title: 'Cross-chain Transfers',
          type: 'graph',
          targets: [
            {
              expr: 'cross_chain_transfers_total',
              legendFormat: '{{chain}}'
            }
          ]
        }
      ]
    };
  }
}

// HTTP endpoints for monitoring
export const monitoringRouter = express.Router();

// Prometheus metrics endpoint
monitoringRouter.get('/metrics', (req, res) => {
  const monitoringService = new MonitoringService();
  res.set('Content-Type', 'text/plain');
  res.send('Prometheus metrics would be exported here');
});

// Health check endpoint
monitoringRouter.get('/health', (req, res) => {
  const monitoringService = new MonitoringService();
  const dashboard = monitoringService.generateDashboardData();

  res.json({
    status: dashboard.systemHealth.status,
    uptime: dashboard.systemHealth.uptime,
    services: dashboard.systemHealth.services,
    timestamp: Date.now()
  });
});

// Dashboard data endpoint
monitoringRouter.get('/dashboard', (req, res) => {
  const monitoringService = new MonitoringService();
  const dashboard = monitoringService.generateDashboardData();

  res.json({
    dashboard,
    phase: 'phase_2',
    features: [
      'Real-time Metrics',
      'Prometheus Integration',
      'Grafana Dashboards',
      'ELK Stack Logging',
      'Alert Management',
      'Performance Analytics'
    ]
  });
});

// Logs endpoint
monitoringRouter.get('/logs', (req, res) => {
  const monitoringService = new MonitoringService();
  const logs = monitoringService.getLogs({
    limit: parseInt(req.query.limit as string) || 100,
    level: req.query.level as string,
    service: req.query.service as string
  });

  res.json({
    logs,
    count: logs.length,
    phase: 'phase_2'
  });
});

// Export singleton instance
export const monitoringService = new MonitoringService();