"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveSampler = void 0;
/**
 * Adaptive sampling system that automatically adjusts sampling rates
 * based on current system load and performance characteristics
 */
class AdaptiveSampler {
    constructor(collector, config = {}) {
        this.metricsHistory = [];
        this.lastAdjustment = Date.now();
        this.traceCount = 0;
        this.memoryBaseline = 0;
        this.collector = collector;
        this.config = {
            enabled: true,
            targetTracesPerSecond: 100,
            maxMemoryUsageMB: 500,
            minSamplingRate: 0.01, // 1%
            maxSamplingRate: 1.0, // 100%
            adjustmentInterval: 30000, // 30 seconds
            aggressiveness: 0.5,
            ...config
        };
        this.currentRate = 1.0; // Start with full sampling
        this.metrics = this.getInitialMetrics();
        if (typeof process !== 'undefined') {
            this.memoryBaseline = process.memoryUsage().heapUsed / 1024 / 1024;
        }
        if (this.config.enabled) {
            this.startMonitoring();
        }
    }
    /**
     * Decide whether to sample a new trace
     */
    shouldSample() {
        if (!this.config.enabled) {
            return {
                shouldSample: true,
                reason: 'Adaptive sampling disabled',
                currentRate: 1.0,
                metrics: this.metrics
            };
        }
        this.traceCount++;
        // Update metrics
        this.updateMetrics();
        // Apply current sampling rate
        const shouldSample = Math.random() < this.currentRate;
        // Determine reason
        let reason = `Sampling at ${(this.currentRate * 100).toFixed(1)}%`;
        if (this.metrics.tracesPerSecond > this.config.targetTracesPerSecond) {
            reason += ' (high traffic)';
        }
        if (this.metrics.memoryUsage > this.config.maxMemoryUsageMB) {
            reason += ' (high memory)';
        }
        if (this.metrics.errorRate > 0.05) {
            reason += ' (elevated errors)';
        }
        return {
            shouldSample,
            reason,
            currentRate: this.currentRate,
            metrics: this.metrics
        };
    }
    /**
     * Get current sampling rate
     */
    getCurrentRate() {
        return this.currentRate;
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get metrics history
     */
    getMetricsHistory() {
        return [...this.metricsHistory];
    }
    /**
     * Force adjustment of sampling rate
     */
    adjustSamplingRate() {
        if (!this.config.enabled)
            return;
        const now = Date.now();
        const timeSinceLastAdjustment = now - this.lastAdjustment;
        if (timeSinceLastAdjustment < this.config.adjustmentInterval) {
            return; // Too soon to adjust
        }
        const previousRate = this.currentRate;
        const adjustment = this.calculateAdjustment();
        this.currentRate = Math.max(this.config.minSamplingRate, Math.min(this.config.maxSamplingRate, this.currentRate + adjustment));
        this.lastAdjustment = now;
        // Log significant changes
        if (Math.abs(adjustment) > 0.1) {
            console.log(`📊 StackSleuth: Adaptive sampling rate changed from ${(previousRate * 100).toFixed(1)}% to ${(this.currentRate * 100).toFixed(1)}%`);
            console.log(`   Reason: TPS=${this.metrics.tracesPerSecond.toFixed(1)}, Memory=${this.metrics.memoryUsage.toFixed(1)}MB, Errors=${(this.metrics.errorRate * 100).toFixed(1)}%`);
        }
        // Store metrics history
        this.metricsHistory.push({ ...this.metrics });
        if (this.metricsHistory.length > 100) {
            this.metricsHistory = this.metricsHistory.slice(-100);
        }
    }
    /**
     * Calculate adjustment to sampling rate
     */
    calculateAdjustment() {
        let adjustment = 0;
        const aggressiveness = this.config.aggressiveness;
        // Traffic-based adjustment
        const trafficRatio = this.metrics.tracesPerSecond / this.config.targetTracesPerSecond;
        if (trafficRatio > 1.2) {
            // Too much traffic, reduce sampling
            adjustment -= 0.1 * aggressiveness * (trafficRatio - 1);
        }
        else if (trafficRatio < 0.8) {
            // Low traffic, can increase sampling
            adjustment += 0.05 * aggressiveness * (1 - trafficRatio);
        }
        // Memory-based adjustment
        const memoryRatio = this.metrics.memoryUsage / this.config.maxMemoryUsageMB;
        if (memoryRatio > 0.8) {
            // High memory usage, reduce sampling aggressively
            adjustment -= 0.2 * aggressiveness * (memoryRatio - 0.8) * 5;
        }
        // Error-based adjustment
        if (this.metrics.errorRate > 0.05) {
            // High error rate, increase sampling to capture more error traces
            adjustment += 0.1 * aggressiveness * this.metrics.errorRate * 20;
        }
        // CPU-based adjustment (if available)
        if (this.metrics.cpuUsage > 0.8) {
            adjustment -= 0.15 * aggressiveness * (this.metrics.cpuUsage - 0.8) * 5;
        }
        // Trace size adjustment
        const avgTraceSizeKB = this.metrics.avgTraceSize / 1024;
        if (avgTraceSizeKB > 100) {
            // Large traces, reduce sampling
            adjustment -= 0.05 * aggressiveness * (avgTraceSizeKB / 100 - 1);
        }
        return Math.max(-0.3, Math.min(0.3, adjustment)); // Limit adjustment range
    }
    /**
     * Update current metrics
     */
    updateMetrics() {
        const now = Date.now();
        const traces = this.collector.getAllTraces();
        // Calculate traces per second (last 60 seconds)
        const recentTraces = traces.filter(t => t.timing.start.millis > now - 60000);
        this.metrics.tracesPerSecond = recentTraces.length / 60;
        // Calculate average trace size
        if (traces.length > 0) {
            const totalSize = traces.reduce((sum, trace) => {
                return sum + this.estimateTraceSize(trace);
            }, 0);
            this.metrics.avgTraceSize = totalSize / traces.length;
        }
        // Update memory usage
        if (typeof process !== 'undefined') {
            const memUsage = process.memoryUsage();
            this.metrics.memoryUsage = memUsage.heapUsed / 1024 / 1024;
        }
        // Calculate error rate
        const errorTraces = traces.filter(t => t.status === 'error').length;
        this.metrics.errorRate = traces.length > 0 ? errorTraces / traces.length : 0;
        // CPU usage (simplified estimation)
        this.metrics.cpuUsage = this.estimateCpuUsage();
    }
    /**
     * Estimate trace size in bytes
     */
    estimateTraceSize(trace) {
        try {
            return JSON.stringify(trace).length;
        }
        catch (e) {
            return 1000; // Default estimate
        }
    }
    /**
     * Estimate CPU usage (simplified)
     */
    estimateCpuUsage() {
        if (typeof process !== 'undefined' && process.cpuUsage) {
            try {
                const cpuUsage = process.cpuUsage();
                const total = cpuUsage.user + cpuUsage.system;
                // This is a simplified estimation - in production you'd want more sophisticated CPU monitoring
                return Math.min(1.0, total / 1000000 / 1000); // Convert to percentage
            }
            catch (e) {
                return 0.5; // Default estimate
            }
        }
        return 0.5;
    }
    /**
     * Get initial metrics
     */
    getInitialMetrics() {
        return {
            tracesPerSecond: 0,
            avgTraceSize: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            errorRate: 0
        };
    }
    /**
     * Start monitoring and automatic adjustments
     */
    startMonitoring() {
        this.intervalId = setInterval(() => {
            this.adjustSamplingRate();
        }, this.config.adjustmentInterval);
        // Clean up on process exit
        if (typeof process !== 'undefined') {
            process.on('exit', () => this.stop());
            process.on('SIGINT', () => this.stop());
            process.on('SIGTERM', () => this.stop());
        }
    }
    /**
     * Stop monitoring
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.config.enabled && !this.intervalId) {
            this.startMonitoring();
        }
        else if (!this.config.enabled && this.intervalId) {
            this.stop();
        }
    }
    /**
     * Generate sampling report
     */
    generateReport() {
        const history = this.metricsHistory.slice(-10); // Last 10 measurements
        if (history.length === 0) {
            return 'No sampling history available';
        }
        const avgTPS = history.reduce((sum, m) => sum + m.tracesPerSecond, 0) / history.length;
        const avgMemory = history.reduce((sum, m) => sum + m.memoryUsage, 0) / history.length;
        const avgErrors = history.reduce((sum, m) => sum + m.errorRate, 0) / history.length;
        return `
StackSleuth Adaptive Sampling Report
===================================
Current Rate: ${(this.currentRate * 100).toFixed(1)}%
Target TPS: ${this.config.targetTracesPerSecond}
Actual TPS: ${avgTPS.toFixed(1)}
Memory Usage: ${avgMemory.toFixed(1)}MB (limit: ${this.config.maxMemoryUsageMB}MB)
Error Rate: ${(avgErrors * 100).toFixed(2)}%
Measurements: ${history.length}
Status: ${this.config.enabled ? 'Active' : 'Disabled'}
    `;
    }
}
exports.AdaptiveSampler = AdaptiveSampler;
//# sourceMappingURL=adaptive-sampling.js.map