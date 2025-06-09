"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorUtils = exports.SamplingUtils = exports.PerformanceUtils = exports.IdGenerator = exports.Timer = void 0;
const uuid_1 = require("uuid");
/**
 * High-resolution timing utilities
 */
class Timer {
    static now() {
        const hrTime = process.hrtime.bigint();
        const nanos = Number(hrTime);
        const millis = Date.now();
        return { nanos, millis };
    }
    static diff(start, end) {
        return (end.nanos - start.nanos) / Timer.NS_PER_MS;
    }
    static since(start) {
        return Timer.diff(start, Timer.now());
    }
}
exports.Timer = Timer;
Timer.NS_PER_MS = 1e6;
/**
 * ID generation utilities
 */
class IdGenerator {
    static traceId() {
        return (0, uuid_1.v4)();
    }
    static spanId() {
        return (0, uuid_1.v4)();
    }
    static shortId(id) {
        return id.substring(0, 8);
    }
}
exports.IdGenerator = IdGenerator;
/**
 * Performance calculation utilities
 */
class PerformanceUtils {
    static calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        if (Number.isInteger(index)) {
            return sorted[index];
        }
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }
    static calculateStats(values) {
        if (values.length === 0) {
            return {
                min: 0,
                max: 0,
                avg: 0,
                p50: 0,
                p95: 0,
                p99: 0,
                count: 0
            };
        }
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        return {
            min,
            max,
            avg,
            p50: this.calculatePercentile(values, 50),
            p95: this.calculatePercentile(values, 95),
            p99: this.calculatePercentile(values, 99),
            count: values.length
        };
    }
    static formatDuration(milliseconds) {
        if (milliseconds < 1) {
            return `${(milliseconds * 1000).toFixed(2)}μs`;
        }
        else if (milliseconds < 1000) {
            return `${milliseconds.toFixed(2)}ms`;
        }
        else {
            return `${(milliseconds / 1000).toFixed(2)}s`;
        }
    }
    static formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}
exports.PerformanceUtils = PerformanceUtils;
/**
 * Sampling utilities
 */
class SamplingUtils {
    static shouldSample(rate) {
        return Math.random() < rate;
    }
    static createThrottler(maxPerSecond) {
        let tokens = maxPerSecond;
        let lastRefill = Date.now();
        return () => {
            const now = Date.now();
            const elapsed = now - lastRefill;
            // Refill tokens based on elapsed time
            if (elapsed >= 1000) {
                tokens = maxPerSecond;
                lastRefill = now;
            }
            if (tokens > 0) {
                tokens--;
                return true;
            }
            return false;
        };
    }
}
exports.SamplingUtils = SamplingUtils;
/**
 * Error handling utilities
 */
class ErrorUtils {
    static serializeError(error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        };
    }
    static isRetryableError(error) {
        // Define which errors should trigger retries
        return error.name === 'NetworkError' ||
            error.name === 'TimeoutError' ||
            error.message.includes('ECONNRESET');
    }
}
exports.ErrorUtils = ErrorUtils;
//# sourceMappingURL=utils.js.map