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
export declare abstract class BaseAgent {
    protected config: AgentConfig;
    protected isActive: boolean;
    constructor(config?: AgentConfig);
    /**
     * Start the agent monitoring
     */
    abstract startMonitoring?(): void;
    /**
     * Stop the agent monitoring
     */
    abstract stopMonitoring?(): void;
    /**
     * Record a performance metric
     */
    recordMetric(name: string, value: number, metadata?: Record<string, any>): void;
    /**
     * Process a metric (override in subclasses)
     */
    protected processMetric(metric: PerformanceMetrics): void;
    /**
     * Check if the agent is enabled
     */
    get enabled(): boolean;
    /**
     * Check if the agent is active
     */
    get active(): boolean;
    /**
     * Get the current configuration
     */
    getConfig(): AgentConfig;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<AgentConfig>): void;
}
//# sourceMappingURL=base-agent.d.ts.map