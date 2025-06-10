"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaravelAgent = void 0;
const core_1 = require("@stacksleuth/core");
const axios_1 = __importDefault(require("axios"));
const ws_1 = require("ws");
class LaravelAgent extends core_1.BaseAgent {
    constructor(config = {}) {
        super(config);
        this.middlewareMetrics = [];
        this.eloquentMetrics = [];
        this.routeMetrics = [];
        this.jobMetrics = [];
        this.cacheMetrics = [];
        this.isMonitoring = false;
        this.config = {
            laravelServerUrl: 'http://localhost:8000',
            monitorEloquent: true,
            monitorMiddleware: true,
            monitorRoutes: true,
            monitorJobs: true,
            monitorCache: true,
            enableRealTimeUpdates: false,
            customMiddleware: [],
            eloquentModels: [],
            ...config
        };
    }
    startMonitoring() {
        if (this.isMonitoring) {
            console.warn('Laravel monitoring is already active');
            return;
        }
        this.isMonitoring = true;
        console.log('Starting Laravel performance monitoring...');
        if (this.config.enableRealTimeUpdates) {
            this.setupWebSocketConnection();
        }
        // Start periodic data collection
        this.startPeriodicCollection();
    }
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        console.log('Stopping Laravel performance monitoring...');
        if (this.websocket) {
            this.websocket.close();
            this.websocket = undefined;
        }
        this.stopPeriodicCollection();
    }
    setupWebSocketConnection() {
        try {
            const wsUrl = this.config.laravelServerUrl?.replace('http', 'ws') + '/ws/stacksleuth';
            this.websocket = new ws_1.WebSocket(wsUrl);
            this.websocket.on('open', () => {
                console.log('Connected to Laravel WebSocket for real-time monitoring');
            });
            this.websocket.on('message', (data) => {
                try {
                    const metric = JSON.parse(data);
                    this.processRealTimeMetric(metric);
                }
                catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });
            this.websocket.on('error', (error) => {
                console.error('Laravel WebSocket error:', error);
            });
        }
        catch (error) {
            console.error('Failed to setup WebSocket connection:', error);
        }
    }
    processRealTimeMetric(metric) {
        switch (metric.type) {
            case 'middleware':
                this.recordMiddlewareMetric(metric.data);
                break;
            case 'eloquent':
                this.recordEloquentMetric(metric.data);
                break;
            case 'route':
                this.recordRouteMetric(metric.data);
                break;
            case 'job':
                this.recordJobMetric(metric.data);
                break;
            case 'cache':
                this.recordCacheMetric(metric.data);
                break;
        }
    }
    recordMiddlewareMetric(metric) {
        if (!this.config.monitorMiddleware)
            return;
        this.middlewareMetrics.push({
            ...metric,
            timestamp: metric.timestamp || Date.now()
        });
        // Keep only recent metrics (last 1000)
        if (this.middlewareMetrics.length > 1000) {
            this.middlewareMetrics = this.middlewareMetrics.slice(-1000);
        }
    }
    recordEloquentMetric(metric) {
        if (!this.config.monitorEloquent)
            return;
        this.eloquentMetrics.push({
            ...metric,
            timestamp: metric.timestamp || Date.now()
        });
        // Keep only recent metrics (last 1000)
        if (this.eloquentMetrics.length > 1000) {
            this.eloquentMetrics = this.eloquentMetrics.slice(-1000);
        }
    }
    recordRouteMetric(metric) {
        if (!this.config.monitorRoutes)
            return;
        this.routeMetrics.push({
            ...metric,
            timestamp: metric.timestamp || Date.now()
        });
        // Keep only recent metrics (last 1000)
        if (this.routeMetrics.length > 1000) {
            this.routeMetrics = this.routeMetrics.slice(-1000);
        }
    }
    recordJobMetric(metric) {
        if (!this.config.monitorJobs)
            return;
        this.jobMetrics.push({
            ...metric,
            timestamp: metric.timestamp || Date.now()
        });
        // Keep only recent metrics (last 500)
        if (this.jobMetrics.length > 500) {
            this.jobMetrics = this.jobMetrics.slice(-500);
        }
    }
    recordCacheMetric(metric) {
        if (!this.config.monitorCache)
            return;
        this.cacheMetrics.push({
            ...metric,
            timestamp: metric.timestamp || Date.now()
        });
        // Keep only recent metrics (last 1000)
        if (this.cacheMetrics.length > 1000) {
            this.cacheMetrics = this.cacheMetrics.slice(-1000);
        }
    }
    async collectLaravelMetrics() {
        try {
            const response = await axios_1.default.get(`${this.config.laravelServerUrl}/api/stacksleuth/metrics`, { timeout: 5000 });
            const metrics = response.data;
            if (metrics.middleware && this.config.monitorMiddleware) {
                metrics.middleware.forEach((metric) => {
                    this.recordMiddlewareMetric(metric);
                });
            }
            if (metrics.eloquent && this.config.monitorEloquent) {
                metrics.eloquent.forEach((metric) => {
                    this.recordEloquentMetric(metric);
                });
            }
            if (metrics.routes && this.config.monitorRoutes) {
                metrics.routes.forEach((metric) => {
                    this.recordRouteMetric(metric);
                });
            }
            if (metrics.jobs && this.config.monitorJobs) {
                metrics.jobs.forEach((metric) => {
                    this.recordJobMetric(metric);
                });
            }
            if (metrics.cache && this.config.monitorCache) {
                metrics.cache.forEach((metric) => {
                    this.recordCacheMetric(metric);
                });
            }
        }
        catch (error) {
            console.error('Error collecting Laravel metrics:', error);
        }
    }
    getMiddlewareMetrics() {
        return [...this.middlewareMetrics];
    }
    getEloquentMetrics() {
        return [...this.eloquentMetrics];
    }
    getRouteMetrics() {
        return [...this.routeMetrics];
    }
    getJobMetrics() {
        return [...this.jobMetrics];
    }
    getCacheMetrics() {
        return [...this.cacheMetrics];
    }
    getPerformanceSummary() {
        const totalRequests = this.routeMetrics.length;
        const averageResponseTime = totalRequests > 0
            ? this.routeMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalRequests
            : 0;
        // Calculate slowest routes
        const routeStats = new Map();
        this.routeMetrics.forEach(metric => {
            const key = metric.routeUri;
            const current = routeStats.get(key) || { totalTime: 0, count: 0, action: metric.controllerAction };
            current.totalTime += metric.executionTime;
            current.count += 1;
            routeStats.set(key, current);
        });
        const slowestRoutes = Array.from(routeStats.entries())
            .map(([uri, stats]) => ({
            uri,
            action: stats.action,
            averageTime: stats.totalTime / stats.count,
            requestCount: stats.count
        }))
            .sort((a, b) => b.averageTime - a.averageTime)
            .slice(0, 10);
        // Calculate Eloquent performance
        const totalQueries = this.eloquentMetrics.length;
        const averageQueryTime = totalQueries > 0
            ? this.eloquentMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalQueries
            : 0;
        const queryStats = new Map();
        this.eloquentMetrics.forEach(metric => {
            const key = metric.query.substring(0, 100); // Truncate for grouping
            const current = queryStats.get(key) || { totalTime: 0, count: 0 };
            current.totalTime += metric.executionTime;
            current.count += 1;
            queryStats.set(key, current);
        });
        const slowestQueries = Array.from(queryStats.entries())
            .map(([query, stats]) => ({
            query,
            averageTime: stats.totalTime / stats.count,
            executionCount: stats.count
        }))
            .sort((a, b) => b.averageTime - a.averageTime)
            .slice(0, 10);
        // Calculate model statistics
        const modelStats = new Map();
        this.eloquentMetrics.forEach(metric => {
            if (metric.model) {
                const current = modelStats.get(metric.model) || { totalTime: 0, count: 0 };
                current.totalTime += metric.executionTime;
                current.count += 1;
                modelStats.set(metric.model, current);
            }
        });
        const modelStatistics = Array.from(modelStats.entries())
            .map(([model, stats]) => ({
            model,
            queryCount: stats.count,
            averageTime: stats.totalTime / stats.count
        }));
        // Calculate cache performance
        const cacheHits = this.cacheMetrics.filter(metric => metric.hit).length;
        const totalCacheOps = this.cacheMetrics.length;
        const hitRate = totalCacheOps > 0 ? (cacheHits / totalCacheOps) * 100 : 0;
        const missRate = 100 - hitRate;
        const cacheOperationStats = new Map();
        this.cacheMetrics.forEach(metric => {
            const current = cacheOperationStats.get(metric.operation) || { totalTime: 0, count: 0 };
            current.totalTime += metric.executionTime;
            current.count += 1;
            cacheOperationStats.set(metric.operation, current);
        });
        const operationStats = Array.from(cacheOperationStats.entries())
            .map(([operation, stats]) => ({
            operation,
            count: stats.count,
            averageTime: stats.totalTime / stats.count
        }));
        // Calculate job performance
        const completedJobs = this.jobMetrics.filter(metric => metric.status === 'completed').length;
        const totalJobs = this.jobMetrics.length;
        const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
        const averageJobTime = totalJobs > 0
            ? this.jobMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalJobs
            : 0;
        const failedJobs = this.jobMetrics.filter(metric => metric.status === 'failed').length;
        // Calculate error rate
        const errorResponses = this.routeMetrics.filter(metric => metric.statusCode >= 400).length;
        const errorRate = totalRequests > 0 ? (errorResponses / totalRequests) * 100 : 0;
        return {
            totalRequests,
            averageResponseTime,
            slowestRoutes,
            eloquentPerformance: {
                totalQueries,
                averageQueryTime,
                slowestQueries,
                modelStats: modelStatistics
            },
            middlewarePerformance: [],
            cachePerformance: {
                hitRate,
                missRate,
                averageAccessTime: totalCacheOps > 0
                    ? this.cacheMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalCacheOps
                    : 0,
                operationStats
            },
            jobPerformance: {
                totalJobs,
                successRate,
                averageExecutionTime: averageJobTime,
                failedJobs
            },
            errorRate,
            memoryUsage: {
                average: totalRequests > 0
                    ? this.routeMetrics.reduce((sum, metric) => sum + metric.memoryUsage, 0) / totalRequests
                    : 0,
                peak: Math.max(...this.routeMetrics.map(metric => metric.memoryUsage), 0)
            }
        };
    }
    clearMetrics() {
        this.middlewareMetrics = [];
        this.eloquentMetrics = [];
        this.routeMetrics = [];
        this.jobMetrics = [];
        this.cacheMetrics = [];
    }
    startPeriodicCollection() {
        // Collect metrics every 10 seconds
        const interval = setInterval(async () => {
            if (!this.isMonitoring) {
                clearInterval(interval);
                return;
            }
            await this.collectLaravelMetrics();
        }, 10000);
    }
    stopPeriodicCollection() {
        // Implementation would stop any active intervals
    }
}
exports.LaravelAgent = LaravelAgent;
//# sourceMappingURL=index.js.map