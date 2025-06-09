import { TimeStamp, TraceId, SpanId } from './types';
/**
 * High-resolution timing utilities
 */
export declare class Timer {
    private static readonly NS_PER_MS;
    static now(): TimeStamp;
    static diff(start: TimeStamp, end: TimeStamp): number;
    static since(start: TimeStamp): number;
}
/**
 * ID generation utilities
 */
export declare class IdGenerator {
    static traceId(): TraceId;
    static spanId(): SpanId;
    static shortId(id: string): string;
}
/**
 * Performance calculation utilities
 */
export declare class PerformanceUtils {
    static calculatePercentile(values: number[], percentile: number): number;
    static calculateStats(values: number[]): {
        min: number;
        max: number;
        avg: number;
        p50: number;
        p95: number;
        p99: number;
        count: number;
    };
    static formatDuration(milliseconds: number): string;
    static formatBytes(bytes: number): string;
}
/**
 * Sampling utilities
 */
export declare class SamplingUtils {
    static shouldSample(rate: number): boolean;
    static createThrottler(maxPerSecond: number): () => boolean;
}
/**
 * Error handling utilities
 */
export declare class ErrorUtils {
    static serializeError(error: Error): {
        name: string;
        message: string;
        stack: string | undefined;
        timestamp: number;
    };
    static isRetryableError(error: Error): boolean;
}
//# sourceMappingURL=utils.d.ts.map