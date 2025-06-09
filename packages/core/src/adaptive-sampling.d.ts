import { TraceCollector } from './collector';
export interface SamplingMetrics {
    tracesPerSecond: number;
    avgTraceSize: number;
    memoryUsage: number;
    cpuUsage: number;
    errorRate: number;
}
export interface AdaptiveSamplingConfig {
    enabled: boolean;
    targetTracesPerSecond: number;
    maxMemoryUsageMB: number;
    minSamplingRate: number;
    maxSamplingRate: number;
    adjustmentInterval: number;
    aggressiveness: number;
}
export interface SamplingDecision {
    shouldSample: boolean;
    reason: string;
    currentRate: number;
    metrics: SamplingMetrics;
}
/**
 * Adaptive sampling system that automatically adjusts sampling rates
 * based on current system load and performance characteristics
 */
export declare class AdaptiveSampler {
    private config;
    private collector;
    private currentRate;
    private metrics;
    private metricsHistory;
    private lastAdjustment;
    private traceCount;
    private memoryBaseline;
    private intervalId?;
    constructor(collector: TraceCollector, config?: Partial<AdaptiveSamplingConfig>);
    /**
     * Decide whether to sample a new trace
     */
    shouldSample(): SamplingDecision;
    /**
     * Get current sampling rate
     */
    getCurrentRate(): number;
    /**
     * Get current metrics
     */
    getMetrics(): SamplingMetrics;
    /**
     * Get metrics history
     */
    getMetricsHistory(): SamplingMetrics[];
    /**
     * Force adjustment of sampling rate
     */
    adjustSamplingRate(): void;
    /**
     * Calculate adjustment to sampling rate
     */
    private calculateAdjustment;
    /**
     * Update current metrics
     */
    private updateMetrics;
    /**
     * Estimate trace size in bytes
     */
    private estimateTraceSize;
    /**
     * Estimate CPU usage (simplified)
     */
    private estimateCpuUsage;
    /**
     * Get initial metrics
     */
    private getInitialMetrics;
    /**
     * Start monitoring and automatic adjustments
     */
    private startMonitoring;
    /**
     * Stop monitoring
     */
    stop(): void;
    /**
     * Get configuration
     */
    getConfig(): AdaptiveSamplingConfig;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<AdaptiveSamplingConfig>): void;
    /**
     * Generate sampling report
     */
    generateReport(): string;
}
//# sourceMappingURL=adaptive-sampling.d.ts.map