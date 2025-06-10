"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DjangoAgent = void 0;
const core_1 = require("@stacksleuth/core");
const axios_1 = __importDefault(require("axios"));
const ws_1 = require("ws");
class DjangoAgent extends core_1.BaseAgent {
    constructor(config = {}) {
        super(config);
        this.middlewareMetrics = [];
        this.databaseMetrics = [];
        this.viewMetrics = [];
        this.sessionMetrics = new Map();
        this.isMonitoring = false;
        this.config = {
            djangoServerUrl: 'http://localhost:8000',
            monitorDatabase: true,
            monitorMiddleware: true,
            monitorViews: true,
            monitorSessions: true,
            enableRealTimeUpdates: false,
            customMiddleware: [],
            ...config
        };
    }
    startMonitoring() {
        if (this.isMonitoring) {
            console.warn('Django monitoring is already active');
            return;
        }
        this.isMonitoring = true;
        console.log('Starting Django performance monitoring...');
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
        console.log('Stopping Django performance monitoring...');
        if (this.websocket) {
            this.websocket.close();
            this.websocket = undefined;
        }
        this.stopPeriodicCollection();
    }
    setupWebSocketConnection() {
        try {
            const wsUrl = this.config.djangoServerUrl?.replace('http', 'ws') + '/ws/stacksleuth/';
            this.websocket = new ws_1.WebSocket(wsUrl);
            this.websocket.on('open', () => {
                console.log('Connected to Django WebSocket for real-time monitoring');
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
                console.error('Django WebSocket error:', error);
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
            case 'database':
                this.recordDatabaseMetric(metric.data);
                break;
            case 'view':
                this.recordViewMetric(metric.data);
                break;
            case 'session':
                this.recordSessionMetric(metric.data);
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
    recordDatabaseMetric(metric) {
        if (!this.config.monitorDatabase)
            return;
        this.databaseMetrics.push({
            ...metric,
            timestamp: metric.timestamp || Date.now()
        });
        // Keep only recent metrics (last 1000)
        if (this.databaseMetrics.length > 1000) {
            this.databaseMetrics = this.databaseMetrics.slice(-1000);
        }
    }
    recordViewMetric(metric) {
        if (!this.config.monitorViews)
            return;
        this.viewMetrics.push({
            ...metric,
            timestamp: metric.timestamp || Date.now()
        });
        // Keep only recent metrics (last 1000)
        if (this.viewMetrics.length > 1000) {
            this.viewMetrics = this.viewMetrics.slice(-1000);
        }
    }
    recordSessionMetric(metric) {
        if (!this.config.monitorSessions)
            return;
        this.sessionMetrics.set(metric.sessionKey, {
            ...metric,
            lastActivity: Date.now()
        });
        // Clean up old sessions (older than 24 hours)
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        for (const [key, session] of this.sessionMetrics.entries()) {
            if (session.lastActivity < oneDayAgo) {
                this.sessionMetrics.delete(key);
            }
        }
    }
    async collectDjangoMetrics() {
        try {
            const response = await axios_1.default.get(`${this.config.djangoServerUrl}/api/stacksleuth/metrics/`, { timeout: 5000 });
            const metrics = response.data;
            if (metrics.middleware && this.config.monitorMiddleware) {
                metrics.middleware.forEach((metric) => {
                    this.recordMiddlewareMetric(metric);
                });
            }
            if (metrics.database && this.config.monitorDatabase) {
                metrics.database.forEach((metric) => {
                    this.recordDatabaseMetric(metric);
                });
            }
            if (metrics.views && this.config.monitorViews) {
                metrics.views.forEach((metric) => {
                    this.recordViewMetric(metric);
                });
            }
            if (metrics.sessions && this.config.monitorSessions) {
                metrics.sessions.forEach((metric) => {
                    this.recordSessionMetric(metric);
                });
            }
        }
        catch (error) {
            console.error('Error collecting Django metrics:', error);
        }
    }
    getMiddlewareMetrics() {
        return [...this.middlewareMetrics];
    }
    getDatabaseMetrics() {
        return [...this.databaseMetrics];
    }
    getViewMetrics() {
        return [...this.viewMetrics];
    }
    getSessionMetrics() {
        return Array.from(this.sessionMetrics.values());
    }
    getPerformanceSummary() {
        const totalRequests = this.viewMetrics.length;
        const averageResponseTime = totalRequests > 0
            ? this.viewMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalRequests
            : 0;
        // Calculate slowest endpoints
        const endpointStats = new Map();
        this.viewMetrics.forEach(metric => {
            const key = metric.requestPath;
            const current = endpointStats.get(key) || { totalTime: 0, count: 0 };
            current.totalTime += metric.executionTime;
            current.count += 1;
            endpointStats.set(key, current);
        });
        const slowestEndpoints = Array.from(endpointStats.entries())
            .map(([path, stats]) => ({
            path,
            averageTime: stats.totalTime / stats.count,
            requestCount: stats.count
        }))
            .sort((a, b) => b.averageTime - a.averageTime)
            .slice(0, 10);
        // Calculate database performance
        const totalQueries = this.databaseMetrics.length;
        const averageQueryTime = totalQueries > 0
            ? this.databaseMetrics.reduce((sum, metric) => sum + metric.executionTime, 0) / totalQueries
            : 0;
        const queryStats = new Map();
        this.databaseMetrics.forEach(metric => {
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
        // Calculate middleware performance
        const middlewareStats = new Map();
        this.middlewareMetrics.forEach(metric => {
            const current = middlewareStats.get(metric.middlewareName) || { totalTime: 0, count: 0 };
            current.totalTime += metric.executionTime;
            current.count += 1;
            middlewareStats.set(metric.middlewareName, current);
        });
        const middlewarePerformance = Array.from(middlewareStats.entries())
            .map(([name, stats]) => ({
            name,
            averageTime: stats.totalTime / stats.count,
            requestCount: stats.count
        }));
        // Calculate error rate
        const errorResponses = this.viewMetrics.filter(metric => metric.statusCode >= 400).length;
        const errorRate = totalRequests > 0 ? (errorResponses / totalRequests) * 100 : 0;
        return {
            totalRequests,
            averageResponseTime,
            slowestEndpoints,
            databasePerformance: {
                totalQueries,
                averageQueryTime,
                slowestQueries
            },
            middlewarePerformance,
            errorRate,
            memoryUsage: {
                average: 0, // Would be populated by actual Django integration
                peak: 0
            }
        };
    }
    clearMetrics() {
        this.middlewareMetrics = [];
        this.databaseMetrics = [];
        this.viewMetrics = [];
        this.sessionMetrics.clear();
    }
    startPeriodicCollection() {
        // Collect metrics every 10 seconds
        const interval = setInterval(async () => {
            if (!this.isMonitoring) {
                clearInterval(interval);
                return;
            }
            await this.collectDjangoMetrics();
        }, 10000);
    }
    stopPeriodicCollection() {
        // Implementation would stop any active intervals
    }
}
exports.DjangoAgent = DjangoAgent;
//# sourceMappingURL=index.js.map