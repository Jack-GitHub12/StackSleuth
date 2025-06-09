import EventEmitter from 'events';
import { Trace, Span, TraceId, SpanId, StackSleuthConfig, TraceStatus, PerformanceIssue } from './types';
export interface TraceCollectorEvents {
    'trace:started': (trace: Trace) => void;
    'trace:completed': (trace: Trace) => void;
    'span:started': (span: Span) => void;
    'span:completed': (span: Span) => void;
    'performance:issue': (issue: PerformanceIssue) => void;
}
export declare class TraceCollector extends EventEmitter {
    private traces;
    private activeSpans;
    private config;
    private shouldSample;
    private samplingThrottle?;
    constructor(config?: Partial<StackSleuthConfig>);
    /**
     * Start a new trace
     */
    startTrace(name: string, metadata?: Record<string, any>): Trace | null;
    /**
     * Complete a trace
     */
    completeTrace(traceId: TraceId, status?: TraceStatus): void;
    /**
     * Start a new span within a trace
     */
    startSpan(traceId: TraceId, name: string, type: string, parentId?: SpanId, metadata?: Record<string, any>): Span | null;
    /**
     * Complete a span
     */
    completeSpan(spanId: SpanId, status?: TraceStatus, metadata?: Record<string, any>): void;
    /**
     * Add an error to a span
     */
    addSpanError(spanId: SpanId, error: Error): void;
    /**
     * Get a trace by ID
     */
    getTrace(traceId: TraceId): Trace | undefined;
    /**
     * Get all traces
     */
    getAllTraces(): Trace[];
    /**
     * Get traces within a time range
     */
    getTracesByTimeRange(startTime: number, endTime: number): Trace[];
    /**
     * Get performance statistics
     */
    getStats(): {
        traces: {
            min: number;
            max: number;
            avg: number;
            p50: number;
            p95: number;
            p99: number;
            count: number;
            total: number;
        };
        spans: {
            min: number;
            max: number;
            avg: number;
            p50: number;
            p95: number;
            p99: number;
            count: number;
            total: number;
        };
    };
    /**
     * Clear old traces to prevent memory leaks
     */
    cleanup(maxAge?: number): void;
    /**
     * Analyze a trace for performance issues
     */
    private analyzeTrace;
    /**
     * Export traces in various formats
     */
    export(format?: 'json' | 'csv'): string;
}
//# sourceMappingURL=collector.d.ts.map