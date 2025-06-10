"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
class BaseAgent {
    constructor(config = {}) {
        this.isActive = false;
        this.config = {
            enabled: true,
            sampleRate: 1.0,
            bufferSize: 1000,
            flushInterval: 5000,
            debug: false,
            ...config
        };
    }
    /**
     * Record a performance metric
     */
    recordMetric(name, value, metadata) {
        const metric = {
            timestamp: Date.now(),
            [name]: value,
            ...metadata
        };
        this.processMetric(metric);
    }
    /**
     * Process a metric (override in subclasses)
     */
    processMetric(metric) {
        if (this.config.debug) {
            console.log(`[${this.constructor.name}] Metric:`, metric);
        }
    }
    /**
     * Check if the agent is enabled
     */
    get enabled() {
        return this.config.enabled ?? true;
    }
    /**
     * Check if the agent is active
     */
    get active() {
        return this.isActive;
    }
    /**
     * Get the current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=base-agent.js.map