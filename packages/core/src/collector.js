"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceCollector = void 0;
const events_1 = __importDefault(require("events"));
const types_1 = require("./types");
const utils_1 = require("./utils");
class TraceCollector extends events_1.default {
    constructor(config = {}) {
        super();
        this.traces = new Map();
        this.activeSpans = new Map();
        this.config = {
            enabled: true,
            sampling: { rate: 1.0 },
            filters: {},
            output: { console: true },
            ...config
        };
        this.shouldSample = () => utils_1.SamplingUtils.shouldSample(this.config.sampling.rate);
        if (this.config.sampling.maxTracesPerSecond) {
            this.samplingThrottle = utils_1.SamplingUtils.createThrottler(this.config.sampling.maxTracesPerSecond);
        }
    }
    /**
     * Start a new trace
     */
    startTrace(name, metadata = {}) {
        if (!this.config.enabled || !this.shouldSample()) {
            return null;
        }
        if (this.samplingThrottle && !this.samplingThrottle()) {
            return null;
        }
        const traceId = utils_1.IdGenerator.traceId();
        const rootSpanId = utils_1.IdGenerator.spanId();
        const timing = { start: utils_1.Timer.now() };
        const trace = {
            id: traceId,
            name,
            timing,
            status: types_1.TraceStatus.PENDING,
            spans: [],
            metadata,
            rootSpanId
        };
        this.traces.set(traceId, trace);
        this.emit('trace:started', trace);
        return trace;
    }
    /**
     * Complete a trace
     */
    completeTrace(traceId, status = types_1.TraceStatus.SUCCESS) {
        const trace = this.traces.get(traceId);
        if (!trace)
            return;
        trace.timing.end = utils_1.Timer.now();
        trace.timing.duration = utils_1.Timer.diff(trace.timing.start, trace.timing.end);
        trace.status = status;
        // Filter by minimum duration if configured
        if (this.config.filters.minDuration &&
            trace.timing.duration < this.config.filters.minDuration) {
            this.traces.delete(traceId);
            return;
        }
        this.emit('trace:completed', trace);
        this.analyzeTrace(trace);
    }
    /**
     * Start a new span within a trace
     */
    startSpan(traceId, name, type, parentId, metadata = {}) {
        const trace = this.traces.get(traceId);
        if (!trace)
            return null;
        const spanId = utils_1.IdGenerator.spanId();
        const span = {
            id: spanId,
            traceId,
            parentId,
            name,
            type: type,
            timing: { start: utils_1.Timer.now() },
            status: types_1.TraceStatus.PENDING,
            metadata,
            tags: []
        };
        this.activeSpans.set(spanId, span);
        trace.spans.push(span);
        this.emit('span:started', span);
        return span;
    }
    /**
     * Complete a span
     */
    completeSpan(spanId, status = types_1.TraceStatus.SUCCESS, metadata = {}) {
        const span = this.activeSpans.get(spanId);
        if (!span)
            return;
        span.timing.end = utils_1.Timer.now();
        span.timing.duration = utils_1.Timer.diff(span.timing.start, span.timing.end);
        span.status = status;
        span.metadata = { ...span.metadata, ...metadata };
        this.activeSpans.delete(spanId);
        this.emit('span:completed', span);
    }
    /**
     * Add an error to a span
     */
    addSpanError(spanId, error) {
        const span = this.activeSpans.get(spanId);
        if (!span)
            return;
        if (!span.errors)
            span.errors = [];
        span.errors.push(error);
        span.status = types_1.TraceStatus.ERROR;
    }
    /**
     * Get a trace by ID
     */
    getTrace(traceId) {
        return this.traces.get(traceId);
    }
    /**
     * Get all traces
     */
    getAllTraces() {
        return Array.from(this.traces.values());
    }
    /**
     * Get traces within a time range
     */
    getTracesByTimeRange(startTime, endTime) {
        return this.getAllTraces().filter(trace => trace.timing.start.millis >= startTime &&
            trace.timing.start.millis <= endTime);
    }
    /**
     * Get performance statistics
     */
    getStats() {
        const traces = this.getAllTraces();
        const durations = traces
            .filter(t => t.timing.duration !== undefined)
            .map(t => t.timing.duration);
        const spanDurations = traces
            .flatMap(t => t.spans)
            .filter(s => s.timing.duration !== undefined)
            .map(s => s.timing.duration);
        return {
            traces: {
                total: traces.length,
                ...utils_1.PerformanceUtils.calculateStats(durations)
            },
            spans: {
                total: spanDurations.length,
                ...utils_1.PerformanceUtils.calculateStats(spanDurations)
            }
        };
    }
    /**
     * Clear old traces to prevent memory leaks
     */
    cleanup(maxAge = 300000) {
        const cutoff = Date.now() - maxAge;
        for (const [traceId, trace] of this.traces.entries()) {
            if (trace.timing.start.millis < cutoff) {
                this.traces.delete(traceId);
            }
        }
    }
    /**
     * Analyze a trace for performance issues
     */
    analyzeTrace(trace) {
        const issues = [];
        // Detect slow operations
        if (trace.timing.duration && trace.timing.duration > 1000) {
            issues.push({
                id: utils_1.IdGenerator.spanId(),
                severity: 'high',
                type: 'slow_query',
                message: `Trace "${trace.name}" took ${utils_1.PerformanceUtils.formatDuration(trace.timing.duration)}`,
                suggestion: 'Consider optimizing the slowest spans in this trace',
                spanIds: trace.spans.map(s => s.id),
                traceId: trace.id
            });
        }
        // Detect N+1 queries
        const dbSpans = trace.spans.filter(s => s.type === 'db_query');
        if (dbSpans.length > 10) {
            issues.push({
                id: utils_1.IdGenerator.spanId(),
                severity: 'medium',
                type: 'n_plus_one',
                message: `Potential N+1 query pattern detected (${dbSpans.length} database queries)`,
                suggestion: 'Consider using batch queries or eager loading',
                spanIds: dbSpans.map(s => s.id),
                traceId: trace.id
            });
        }
        // Emit performance issues
        issues.forEach(issue => this.emit('performance:issue', issue));
    }
    /**
     * Export traces in various formats
     */
    export(format = 'json') {
        const traces = this.getAllTraces();
        if (format === 'json') {
            return JSON.stringify(traces, null, 2);
        }
        // Simple CSV export
        const headers = ['traceId', 'name', 'duration', 'status', 'spanCount'];
        const rows = traces.map(trace => [
            trace.id,
            trace.name,
            trace.timing.duration || 0,
            trace.status,
            trace.spans.length
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}
exports.TraceCollector = TraceCollector;
//# sourceMappingURL=collector.js.map