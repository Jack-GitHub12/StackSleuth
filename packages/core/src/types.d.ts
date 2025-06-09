/**
 * Core types for StackSleuth performance tracing
 */
export type TraceId = string;
export type SpanId = string;
export type ComponentId = string;
export declare enum SpanType {
    HTTP_REQUEST = "http_request",
    DB_QUERY = "db_query",
    REACT_RENDER = "react_render",
    FUNCTION_CALL = "function_call",
    CUSTOM = "custom"
}
export declare enum TraceStatus {
    PENDING = "pending",
    SUCCESS = "success",
    ERROR = "error",
    TIMEOUT = "timeout"
}
export interface TimeStamp {
    /** High-resolution timestamp in nanoseconds */
    nanos: number;
    /** Unix timestamp in milliseconds for easier date handling */
    millis: number;
}
export interface SpanTiming {
    start: TimeStamp;
    end?: TimeStamp;
    duration?: number;
}
export interface SpanMetadata {
    [key: string]: string | number | boolean | null;
}
export interface Span {
    id: SpanId;
    traceId: TraceId;
    parentId?: SpanId;
    name: string;
    type: SpanType;
    timing: SpanTiming;
    status: TraceStatus;
    metadata: SpanMetadata;
    tags: string[];
    errors?: Error[];
}
export interface Trace {
    id: TraceId;
    name: string;
    timing: SpanTiming;
    status: TraceStatus;
    spans: Span[];
    metadata: SpanMetadata;
    /** Root span that started this trace */
    rootSpanId: SpanId;
}
export interface WebVital {
    name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
    value: number;
    delta: number;
    id: string;
}
export interface ReactRenderSpan extends Span {
    type: SpanType.REACT_RENDER;
    metadata: SpanMetadata & {
        componentName: string;
        props?: Record<string, any>;
        hooks?: string[];
        renderCount?: number;
    };
}
export interface HttpRequestSpan extends Span {
    type: SpanType.HTTP_REQUEST;
    metadata: SpanMetadata & {
        method: string;
        url: string;
        statusCode?: number;
        userAgent?: string;
        contentLength?: number;
    };
}
export interface DbQuerySpan extends Span {
    type: SpanType.DB_QUERY;
    metadata: SpanMetadata & {
        query: string;
        database: string;
        table?: string;
        rowsAffected?: number;
        connectionPool?: string;
    };
}
export interface PerformanceIssue {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'memory_leak' | 'n_plus_one' | 'slow_query' | 'over_rendering' | 'large_bundle';
    message: string;
    suggestion?: string;
    spanIds: SpanId[];
    traceId: TraceId;
}
export interface StackSleuthConfig {
    enabled: boolean;
    sampling: {
        rate: number;
        maxTracesPerSecond?: number;
    };
    filters: {
        excludeUrls?: RegExp[];
        excludeComponents?: string[];
        minDuration?: number;
    };
    output: {
        console?: boolean;
        dashboard?: {
            enabled: boolean;
            port: number;
            host: string;
        };
        export?: {
            format: 'json' | 'csv';
            path: string;
        };
    };
}
//# sourceMappingURL=types.d.ts.map