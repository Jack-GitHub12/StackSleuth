"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilerCore = void 0;
const collector_1 = require("./collector");
const types_1 = require("./types");
class ProfilerCore {
    constructor(config = {}) {
        this.isActive = false;
        this.config = config;
        // Convert any config to StackSleuthConfig format
        const stackSleuthConfig = {
            enabled: config.enabled ?? true,
            sampling: config.sampling ?? { rate: config.sampleRate ?? 1.0 },
            filters: config.filters ?? {},
            output: config.output ?? { console: true }
        };
        this.collector = new collector_1.TraceCollector(stackSleuthConfig);
    }
    /**
     * Initialize the profiler
     */
    async init() {
        if (this.isActive)
            return;
        this.isActive = true;
        // Set up event listeners for debugging
        this.collector.on('trace:completed', (trace) => {
            if (this.config.output?.console) {
                console.log(`[StackSleuth] Trace completed: ${trace.name} (${trace.timing.duration}ms)`);
            }
        });
        this.collector.on('performance:issue', (issue) => {
            if (this.config.output?.console) {
                console.warn(`[StackSleuth] Performance issue: ${issue.message}`);
            }
        });
        console.log('✅ StackSleuth ProfilerCore initialized');
    }
    /**
     * Start a new trace
     */
    startTrace(name, metadata) {
        if (!this.isActive)
            return null;
        const trace = this.collector.startTrace(name, metadata);
        return trace ? trace.id : null;
    }
    /**
     * Complete a trace
     */
    completeTrace(traceId, status = types_1.TraceStatus.SUCCESS) {
        this.collector.completeTrace(traceId, status);
    }
    /**
     * Start a span within a trace
     */
    startSpan(traceId, name, type, parentId, metadata) {
        const span = this.collector.startSpan(traceId, name, type, parentId, metadata);
        return span ? span.id : null;
    }
    /**
     * Complete a span
     */
    completeSpan(spanId, status = types_1.TraceStatus.SUCCESS, metadata) {
        this.collector.completeSpan(spanId, status, metadata);
    }
    /**
     * Record a simple metric
     */
    recordMetric(name, metrics) {
        if (!this.isActive)
            return;
        // Create a simple trace for the metric
        const trace = this.collector.startTrace(name, metrics);
        if (trace) {
            // Complete immediately with the metric data
            setTimeout(() => {
                this.collector.completeTrace(trace.id, types_1.TraceStatus.SUCCESS);
            }, 0);
        }
    }
    /**
     * Record an error
     */
    recordError(error, context) {
        if (!this.isActive)
            return;
        const trace = this.collector.startTrace('error', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context
        });
        if (trace) {
            setTimeout(() => {
                this.collector.completeTrace(trace.id, types_1.TraceStatus.ERROR);
            }, 0);
        }
    }
    /**
     * Get performance statistics
     */
    getStats() {
        return this.collector.getStats();
    }
    /**
     * Get all traces
     */
    getTraces() {
        return this.collector.getAllTraces();
    }
    /**
     * Export data
     */
    export(format = 'json') {
        return this.collector.export(format);
    }
    /**
     * Stop the profiler and cleanup
     */
    async stop() {
        if (!this.isActive)
            return;
        this.isActive = false;
        this.collector.cleanup();
        console.log('🛑 StackSleuth ProfilerCore stopped');
    }
    /**
     * Check if profiler is active
     */
    get active() {
        return this.isActive;
    }
}
exports.ProfilerCore = ProfilerCore;
//# sourceMappingURL=profiler.js.map