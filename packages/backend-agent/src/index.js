"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendAgent = void 0;
exports.createBackendAgent = createBackendAgent;
const core_1 = require("@stacksleuth/core");
class BackendAgent {
    constructor(config) {
        this.collector = new core_1.TraceCollector(config);
    }
    /**
     * Instrument an Express application
     */
    instrument(app) {
        // Middleware to trace all HTTP requests
        app.use((req, res, next) => {
            const trace = this.collector.startTrace(`${req.method} ${req.path}`, {
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });
            if (!trace) {
                return next();
            }
            const span = this.collector.startSpan(trace.id, `HTTP ${req.method} ${req.path}`, core_1.SpanType.HTTP_REQUEST, undefined, {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                userAgent: req.get('User-Agent')
            });
            // Store trace context in request
            req.stacksleuthTrace = trace;
            req.stacksleuthSpan = span;
            // Hook into response to complete the trace
            const originalSend = res.send;
            res.send = function (body) {
                if (span) {
                    const status = res.statusCode >= 400 ? core_1.TraceStatus.ERROR : core_1.TraceStatus.SUCCESS;
                    self.collector.completeSpan(span.id, status, {
                        statusCode: res.statusCode,
                        contentLength: Buffer.byteLength(body || '')
                    });
                }
                self.collector.completeTrace(trace.id, res.statusCode >= 400 ? core_1.TraceStatus.ERROR : core_1.TraceStatus.SUCCESS);
                return originalSend.call(this, body);
            };
            const self = this;
            next();
        });
    }
    /**
     * Manually trace a function or operation
     */
    async trace(name, operation) {
        // Get current trace from context if available
        const activeTrace = this.collector.getAllTraces().find(t => t.status === core_1.TraceStatus.PENDING);
        if (!activeTrace) {
            // Create a new trace if none exists
            const trace = this.collector.startTrace(name);
            if (!trace)
                return operation();
            const span = this.collector.startSpan(trace.id, name, core_1.SpanType.FUNCTION_CALL);
            try {
                const result = await operation();
                if (span)
                    this.collector.completeSpan(span.id, core_1.TraceStatus.SUCCESS);
                this.collector.completeTrace(trace.id, core_1.TraceStatus.SUCCESS);
                return result;
            }
            catch (error) {
                if (span) {
                    this.collector.addSpanError(span.id, error);
                    this.collector.completeSpan(span.id, core_1.TraceStatus.ERROR);
                }
                this.collector.completeTrace(trace.id, core_1.TraceStatus.ERROR);
                throw error;
            }
        }
        else {
            // Add span to existing trace
            const span = this.collector.startSpan(activeTrace.id, name, core_1.SpanType.FUNCTION_CALL);
            try {
                const result = await operation();
                if (span)
                    this.collector.completeSpan(span.id, core_1.TraceStatus.SUCCESS);
                return result;
            }
            catch (error) {
                if (span) {
                    this.collector.addSpanError(span.id, error);
                    this.collector.completeSpan(span.id, core_1.TraceStatus.ERROR);
                }
                throw error;
            }
        }
    }
    /**
     * Create a traced handler wrapper for route handlers
     */
    traceHandler(handler) {
        return async (...args) => {
            const req = args[0];
            const trace = req.stacksleuthTrace;
            if (!trace) {
                return handler(...args);
            }
            const span = this.collector.startSpan(trace.id, `Handler ${req.method} ${req.path}`, core_1.SpanType.FUNCTION_CALL);
            try {
                const result = await handler(...args);
                if (span)
                    this.collector.completeSpan(span.id, core_1.TraceStatus.SUCCESS);
                return result;
            }
            catch (error) {
                if (span) {
                    this.collector.addSpanError(span.id, error);
                    this.collector.completeSpan(span.id, core_1.TraceStatus.ERROR);
                }
                throw error;
            }
        };
    }
    /**
     * Get the trace collector instance
     */
    getCollector() {
        return this.collector;
    }
}
exports.BackendAgent = BackendAgent;
/**
 * Factory function to create a backend agent
 */
function createBackendAgent(config) {
    return new BackendAgent(config);
}
// Default export
exports.default = BackendAgent;
//# sourceMappingURL=index.js.map