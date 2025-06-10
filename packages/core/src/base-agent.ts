import { PerformanceMetrics } from './profiler';

export interface AgentConfig {
  enabled?: boolean;
  endpoint?: string;
  apiKey?: string;
  sampleRate?: number;
  bufferSize?: number;
  flushInterval?: number;
  debug?: boolean;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected isActive: boolean = false;

  constructor(config: AgentConfig = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      bufferSize: 1000,
      flushInterval: 5000,
      debug: false,
      ...config
    };
  }

  /**
   * Start the agent monitoring
   */
  public abstract startMonitoring?(): void;

  /**
   * Stop the agent monitoring
   */
  public abstract stopMonitoring?(): void;

  /**
   * Record a performance metric
   */
  public recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      [name]: value,
      ...metadata
    };

    this.processMetric(metric);
  }

  /**
   * Process a metric (override in subclasses)
   */
  protected processMetric(metric: PerformanceMetrics): void {
    if (this.config.debug) {
      console.log(`[${this.constructor.name}] Metric:`, metric);
    }
  }

  /**
   * Check if the agent is enabled
   */
  public get enabled(): boolean {
    return this.config.enabled ?? true;
  }

  /**
   * Check if the agent is active
   */
  public get active(): boolean {
    return this.isActive;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
} 