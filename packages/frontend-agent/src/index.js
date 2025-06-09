"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackSleuthProvider = StackSleuthProvider;
exports.useTrace = useTrace;
exports.withTracing = withTracing;
exports.getCollector = getCollector;
const react_1 = __importStar(require("react"));
const core_1 = require("@stacksleuth/core");
// Global collector instance
let globalCollector = null;
// Context for React integration
const StackSleuthContext = (0, react_1.createContext)(null);
/**
 * Provider component that wraps your React app
 */
function StackSleuthProvider({ children, config }) {
    const [collector] = (0, react_1.useState)(() => {
        if (!globalCollector) {
            globalCollector = new core_1.TraceCollector({
                enabled: true,
                sampling: { rate: 1.0 },
                output: { console: true },
                ...config
            });
        }
        return globalCollector;
    });
    (0, react_1.useEffect)(() => {
        // Set up Web Vitals monitoring
        setupWebVitals(collector);
        // Set up component render tracking
        setupComponentTracking(collector);
        // Set up resource loading tracking
        setupResourceTracking(collector);
        return () => {
            // Cleanup if needed
        };
    }, [collector]);
    return react_1.default.createElement(StackSleuthContext.Provider, { value: collector }, children);
}
/**
 * Hook to access the trace collector
 */
function useTrace() {
    const collector = (0, react_1.useContext)(StackSleuthContext);
    if (!collector) {
        throw new Error('useTrace must be used within a StackSleuthProvider');
    }
    return {
        /**
         * Manually trace an operation
         */
        trace: async (name, operation) => {
            const trace = collector.startTrace(name);
            if (!trace)
                return operation();
            const span = collector.startSpan(trace.id, name, core_1.SpanType.FUNCTION_CALL);
            try {
                const result = await operation();
                if (span)
                    collector.completeSpan(span.id, core_1.TraceStatus.SUCCESS);
                collector.completeTrace(trace.id, core_1.TraceStatus.SUCCESS);
                return result;
            }
            catch (error) {
                if (span) {
                    collector.addSpanError(span.id, error);
                    collector.completeSpan(span.id, core_1.TraceStatus.ERROR);
                }
                collector.completeTrace(trace.id, core_1.TraceStatus.ERROR);
                throw error;
            }
        },
        /**
         * Get the collector instance
         */
        collector
    };
}
/**
 * Higher-order component to automatically trace component renders
 */
function withTracing(Component, options) {
    const displayName = options?.name || Component.displayName || Component.name || 'Component';
    const TracedComponent = react_1.default.forwardRef((props, ref) => {
        const collector = (0, react_1.useContext)(StackSleuthContext);
        (0, react_1.useEffect)(() => {
            if (!collector)
                return;
            const trace = collector.startTrace(`Render ${displayName}`);
            if (!trace)
                return;
            const span = collector.startSpan(trace.id, `React Render: ${displayName}`, core_1.SpanType.REACT_RENDER, undefined, {
                componentName: displayName,
                props: Object.keys(props).length
            });
            // Complete the span after render
            Promise.resolve().then(() => {
                if (span)
                    collector.completeSpan(span.id, core_1.TraceStatus.SUCCESS);
                collector.completeTrace(trace.id, core_1.TraceStatus.SUCCESS);
            });
        });
        return react_1.default.createElement(Component, { ...props, ref });
    });
    TracedComponent.displayName = `withTracing(${displayName})`;
    return TracedComponent;
}
/**
 * Set up Web Vitals monitoring
 */
function setupWebVitals(collector) {
    // Check if we're in a browser environment
    if (typeof window === 'undefined')
        return;
    // Track Core Web Vitals using the browser's Performance API
    if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                trackWebVital(collector, 'LCP', lastEntry.startTime);
            }
        });
        try {
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        }
        catch (e) {
            // LCP not supported
        }
        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                trackWebVital(collector, 'FID', entry.processingStart - entry.startTime);
            });
        });
        try {
            fidObserver.observe({ entryTypes: ['first-input'] });
        }
        catch (e) {
            // FID not supported
        }
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
        });
        try {
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
        catch (e) {
            // CLS not supported
        }
        // Report CLS when the page is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                trackWebVital(collector, 'CLS', clsValue);
            }
        });
    }
    // Track page load time
    window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        trackWebVital(collector, 'TTFB', performance.timing.responseStart - performance.timing.requestStart);
        trackWebVital(collector, 'FCP', loadTime);
    });
}
/**
 * Track a Web Vital metric
 */
function trackWebVital(collector, name, value) {
    const trace = collector.startTrace(`Web Vital: ${name}`, {
        metricName: name,
        value,
        timestamp: Date.now()
    });
    if (trace) {
        const span = collector.startSpan(trace.id, `${name} Measurement`, core_1.SpanType.CUSTOM, undefined, { value, unit: name === 'CLS' ? 'score' : 'ms' });
        if (span)
            collector.completeSpan(span.id, core_1.TraceStatus.SUCCESS);
        collector.completeTrace(trace.id, core_1.TraceStatus.SUCCESS);
    }
}
/**
 * Set up component render tracking
 */
function setupComponentTracking(collector) {
    // This would require React DevTools integration or custom instrumentation
    // For now, we'll rely on the withTracing HOC and useTrace hook
}
/**
 * Set up resource loading tracking
 */
function setupResourceTracking(collector) {
    if (typeof window === 'undefined')
        return;
    // Track resource loading
    if ('PerformanceObserver' in window) {
        const resourceObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                if (entry.entryType === 'resource' && entry.duration > 10) {
                    const trace = collector.startTrace(`Resource: ${entry.name}`, {
                        url: entry.name,
                        type: entry.initiatorType,
                        size: entry.transferSize
                    });
                    if (trace) {
                        const span = collector.startSpan(trace.id, `Load ${entry.initiatorType}: ${entry.name.split('/').pop()}`, core_1.SpanType.CUSTOM, undefined, {
                            duration: entry.duration,
                            size: entry.transferSize,
                            type: entry.initiatorType
                        });
                        if (span)
                            collector.completeSpan(span.id, core_1.TraceStatus.SUCCESS);
                        collector.completeTrace(trace.id, core_1.TraceStatus.SUCCESS);
                    }
                }
            });
        });
        try {
            resourceObserver.observe({ entryTypes: ['resource'] });
        }
        catch (e) {
            // Resource timing not supported
        }
    }
}
/**
 * Get the global collector instance
 */
function getCollector() {
    return globalCollector;
}
// Default export
exports.default = StackSleuthProvider;
//# sourceMappingURL=index.js.map