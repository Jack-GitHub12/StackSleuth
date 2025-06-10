import { Trace, TraceStatus } from './types';
export interface PerformanceMetrics {
    timestamp: number;
    duration?: number;
    memory?: number;
    cpu?: number;
    [key: string]: any;
}
export declare class ProfilerCore {
    private collector;
    private isActive;
    private config;
    constructor(config?: any);
    /**
     * Initialize the profiler
     */
    init(): Promise<void>;
    /**
     * Start a new trace
     */
    startTrace(name: string, metadata?: Record<string, any>): string | null;
    /**
     * Complete a trace
     */
    completeTrace(traceId: string, status?: TraceStatus): void;
    /**
     * Start a span within a trace
     */
    startSpan(traceId: string, name: string, type: string, parentId?: string, metadata?: Record<string, any>): string | null;
    /**
     * Complete a span
     */
    completeSpan(spanId: string, status?: TraceStatus, metadata?: Record<string, any>): void;
    /**
     * Record a simple metric
     */
    recordMetric(name: string, metrics: PerformanceMetrics): void;
    /**
     * Record an error
     */
    recordError(error: Error, context?: Record<string, any>): void;
    /**
     * Get performance statistics
     */
    getStats(): any;
    /**
     * Get all traces
     */
    getTraces(): Trace[];
    /**
     * Export data
     */
    export(format?: 'json' | 'csv'): string;
    /**
     * Stop the profiler and cleanup
     */
    stop(): Promise<void>;
    /**
     * Check if profiler is active
     */
    get active(): boolean;
}
//# sourceMappingURL=profiler.d.ts.map