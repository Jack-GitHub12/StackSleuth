"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAgent = exports.SupabaseAgent = void 0;
const core_1 = require("@stacksleuth/core");
const supabase_js_1 = require("@supabase/supabase-js");
class SupabaseAgent {
    constructor(config) {
        this.isActive = false;
        this.operationMetrics = new Map();
        this.realtimeMetrics = new Map();
        this.storageMetrics = [];
        this.authMetrics = [];
        this.activeChannels = new Map();
        this.originalMethods = new Map();
        this.profiler = new core_1.ProfilerCore(config);
    }
    /**
     * Initialize the Supabase agent
     */
    async init(supabaseUrl, supabaseKey) {
        if (this.isActive)
            return;
        this.isActive = true;
        await this.profiler.init();
        // Initialize Supabase client if credentials provided
        if (supabaseUrl && supabaseKey) {
            this.client = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
            this.instrumentSupabaseClient();
        }
        console.log('✅ Supabase Agent initialized');
    }
    /**
     * Instrument an existing Supabase client
     */
    instrumentClient(client) {
        this.client = client;
        this.instrumentSupabaseClient();
    }
    /**
     * Instrument Supabase client methods
     */
    instrumentSupabaseClient() {
        if (!this.client)
            return;
        // Instrument database operations
        this.instrumentDatabaseOperations();
        // Instrument realtime operations
        this.instrumentRealtimeOperations();
        // Instrument storage operations
        this.instrumentStorageOperations();
        // Instrument auth operations
        this.instrumentAuthOperations();
        console.log('🔄 Supabase client instrumented');
    }
    /**
     * Instrument database operations
     */
    instrumentDatabaseOperations() {
        if (!this.client)
            return;
        const originalFrom = this.client.from.bind(this.client);
        this.originalMethods.set('from', originalFrom);
        this.client.from = (table) => {
            const queryBuilder = originalFrom(table);
            return this.wrapQueryBuilder(queryBuilder, table);
        };
        // Instrument RPC calls using type assertion to avoid type conflicts
        const originalRpc = this.client.rpc.bind(this.client);
        this.originalMethods.set('rpc', originalRpc);
        // Override with type assertion to avoid Supabase type complexity
        this.client.rpc = (fn, args, options) => {
            const startTime = Date.now();
            const promise = originalRpc(fn, args, options);
            const resultPromise = Promise.resolve(promise);
            return resultPromise.then((result) => {
                this.recordOperation({
                    operation: 'rpc',
                    table: fn,
                    duration: Date.now() - startTime,
                    rowCount: result.data?.length,
                    querySize: JSON.stringify(args || {}).length,
                    cacheHit: false,
                    timestamp: Date.now()
                });
                return result;
            }).catch((error) => {
                this.recordOperation({
                    operation: 'rpc',
                    table: fn,
                    duration: Date.now() - startTime,
                    querySize: JSON.stringify(args || {}).length,
                    cacheHit: false,
                    error: error.message,
                    timestamp: Date.now()
                });
                throw error;
            });
        };
    }
    /**
     * Wrap query builder methods
     */
    wrapQueryBuilder(queryBuilder, tableName) {
        const operations = ['select', 'insert', 'update', 'delete', 'upsert'];
        operations.forEach(operation => {
            if (queryBuilder[operation]) {
                const originalMethod = queryBuilder[operation].bind(queryBuilder);
                queryBuilder[operation] = (...args) => {
                    const startTime = Date.now();
                    const result = originalMethod(...args);
                    // If result has a then method, it's a promise-like object
                    if (result && typeof result.then === 'function') {
                        return result.then((response) => {
                            this.recordOperation({
                                operation: operation,
                                table: tableName,
                                duration: Date.now() - startTime,
                                rowCount: response.data?.length || (response.count !== null ? response.count : 1),
                                querySize: JSON.stringify(args).length,
                                cacheHit: false,
                                error: response.error?.message,
                                timestamp: Date.now()
                            });
                            return response;
                        });
                    }
                    return result;
                };
            }
        });
        return queryBuilder;
    }
    /**
     * Instrument realtime operations
     */
    instrumentRealtimeOperations() {
        if (!this.client)
            return;
        const originalChannel = this.client.channel.bind(this.client);
        this.originalMethods.set('channel', originalChannel);
        this.client.channel = (name, opts) => {
            const channel = originalChannel(name, opts);
            this.instrumentChannel(channel, name);
            return channel;
        };
    }
    /**
     * Instrument a realtime channel
     */
    instrumentChannel(channel, channelName) {
        this.activeChannels.set(channelName, channel);
        // Monitor channel events using the standard Supabase API
        try {
            // Subscribe to all changes on this channel
            channel.on('*', { event: '*' }, (payload) => {
                const startTime = Date.now();
                this.recordRealtimeEvent({
                    channel: channelName,
                    event: payload.eventType || 'unknown',
                    subscriptionCount: this.activeChannels.size,
                    messageSize: JSON.stringify(payload).length,
                    latency: Date.now() - startTime,
                    connectionStatus: 'connected',
                    timestamp: Date.now()
                });
            });
            // Note: Supabase realtime channels don't expose onError/onClose methods
            // We'll monitor connection status through the subscription response
        }
        catch (error) {
            this.recordRealtimeEvent({
                channel: channelName,
                event: 'error',
                subscriptionCount: this.activeChannels.size,
                messageSize: JSON.stringify(error).length,
                latency: 0,
                connectionStatus: 'disconnected',
                timestamp: Date.now()
            });
        }
    }
    /**
     * Instrument storage operations
     */
    instrumentStorageOperations() {
        if (!this.client?.storage)
            return;
        const originalFrom = this.client.storage.from.bind(this.client.storage);
        this.originalMethods.set('storageFrom', originalFrom);
        this.client.storage.from = (bucketName) => {
            const bucket = originalFrom(bucketName);
            return this.wrapStorageBucket(bucket, bucketName);
        };
    }
    /**
     * Wrap storage bucket methods
     */
    wrapStorageBucket(bucket, bucketName) {
        const operations = ['upload', 'download', 'remove', 'list'];
        operations.forEach(operation => {
            if (bucket[operation]) {
                const originalMethod = bucket[operation].bind(bucket);
                bucket[operation] = (...args) => {
                    const startTime = Date.now();
                    const result = originalMethod(...args);
                    if (result && typeof result.then === 'function') {
                        return result.then((response) => {
                            this.recordStorageOperation({
                                bucket: bucketName,
                                operation: operation,
                                fileSize: this.getFileSize(args[0], response),
                                duration: Date.now() - startTime,
                                error: response.error?.message,
                                timestamp: Date.now()
                            });
                            return response;
                        });
                    }
                    return result;
                };
            }
        });
        return bucket;
    }
    /**
     * Instrument auth operations
     */
    instrumentAuthOperations() {
        if (!this.client?.auth)
            return;
        const authMethods = [
            'signInWithPassword',
            'signInWithOAuth',
            'signUp',
            'signOut',
            'getUser',
            'refreshToken'
        ];
        authMethods.forEach(method => {
            const authClient = this.client.auth;
            if (authClient[method] && typeof authClient[method] === 'function') {
                const originalMethod = authClient[method].bind(authClient);
                this.originalMethods.set(`auth_${method}`, originalMethod);
                authClient[method] = (...args) => {
                    const startTime = Date.now();
                    const result = originalMethod(...args);
                    if (result && typeof result.then === 'function') {
                        return result.then((response) => {
                            this.recordAuthOperation({
                                operation: this.mapAuthOperation(method),
                                provider: args[0]?.provider,
                                duration: Date.now() - startTime,
                                success: !response.error,
                                error: response.error?.message,
                                timestamp: Date.now()
                            });
                            return response;
                        });
                    }
                    return result;
                };
            }
        });
    }
    /**
     * Record database operation metrics
     */
    recordOperation(metrics) {
        const tableMetrics = this.operationMetrics.get(metrics.table || 'unknown') || [];
        tableMetrics.push(metrics);
        // Keep only last 1000 metrics per table
        if (tableMetrics.length > 1000) {
            tableMetrics.shift();
        }
        this.operationMetrics.set(metrics.table || 'unknown', tableMetrics);
        this.profiler.recordMetric('supabase_operation', {
            ...metrics,
            timestamp: Date.now()
        });
    }
    /**
     * Record realtime event metrics
     */
    recordRealtimeEvent(metrics) {
        const channelMetrics = this.realtimeMetrics.get(metrics.channel) || [];
        channelMetrics.push(metrics);
        if (channelMetrics.length > 500) {
            channelMetrics.shift();
        }
        this.realtimeMetrics.set(metrics.channel, channelMetrics);
        this.profiler.recordMetric('supabase_realtime', {
            ...metrics,
            timestamp: Date.now()
        });
    }
    /**
     * Record storage operation metrics
     */
    recordStorageOperation(metrics) {
        this.storageMetrics.push(metrics);
        if (this.storageMetrics.length > 500) {
            this.storageMetrics.shift();
        }
        this.profiler.recordMetric('supabase_storage', {
            ...metrics,
            timestamp: Date.now()
        });
    }
    /**
     * Record auth operation metrics
     */
    recordAuthOperation(metrics) {
        this.authMetrics.push(metrics);
        if (this.authMetrics.length > 200) {
            this.authMetrics.shift();
        }
        this.profiler.recordMetric('supabase_auth', {
            ...metrics,
            timestamp: Date.now()
        });
    }
    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const allOperations = Array.from(this.operationMetrics.values()).flat();
        const allRealtimeEvents = Array.from(this.realtimeMetrics.values()).flat();
        return {
            database: {
                totalOperations: allOperations.length,
                averageDuration: allOperations.reduce((sum, op) => sum + op.duration, 0) / allOperations.length || 0,
                slowQueries: allOperations.filter(op => op.duration > 1000).length,
                errorRate: allOperations.filter(op => op.error).length / allOperations.length || 0,
                topTables: this.getTopTables(),
                cacheHitRate: allOperations.filter(op => op.cacheHit).length / allOperations.length || 0
            },
            realtime: {
                activeChannels: this.activeChannels.size,
                totalEvents: allRealtimeEvents.length,
                averageLatency: allRealtimeEvents.reduce((sum, event) => sum + event.latency, 0) / allRealtimeEvents.length || 0,
                connectionStatus: this.getOverallConnectionStatus()
            },
            storage: {
                totalOperations: this.storageMetrics.length,
                totalDataTransferred: this.storageMetrics.reduce((sum, op) => sum + op.fileSize, 0),
                averageDuration: this.storageMetrics.reduce((sum, op) => sum + op.duration, 0) / this.storageMetrics.length || 0
            },
            auth: {
                totalOperations: this.authMetrics.length,
                successRate: this.authMetrics.filter(op => op.success).length / this.authMetrics.length || 0,
                averageDuration: this.authMetrics.reduce((sum, op) => sum + op.duration, 0) / this.authMetrics.length || 0
            }
        };
    }
    /**
     * Get table operation statistics
     */
    getTableStats(tableName) {
        const operations = this.operationMetrics.get(tableName) || [];
        return {
            totalOperations: operations.length,
            averageDuration: operations.reduce((sum, op) => sum + op.duration, 0) / operations.length || 0,
            operationTypes: this.groupBy(operations, 'operation'),
            recentErrors: operations.filter(op => op.error).slice(-5),
            performanceTrend: this.calculatePerformanceTrend(operations)
        };
    }
    /**
     * Helper methods
     */
    getFileSize(fileName, response) {
        if (response.data && typeof response.data === 'object') {
            return JSON.stringify(response.data).length;
        }
        return 0;
    }
    mapAuthOperation(method) {
        const mapping = {
            'signInWithPassword': 'signIn',
            'signInWithOAuth': 'signIn',
            'signUp': 'signUp',
            'signOut': 'signOut',
            'getUser': 'getUser',
            'refreshToken': 'refreshToken'
        };
        return mapping[method] || 'getUser';
    }
    getTopTables() {
        return Array.from(this.operationMetrics.entries())
            .map(([table, operations]) => ({ table, operations: operations.length }))
            .sort((a, b) => b.operations - a.operations)
            .slice(0, 10);
    }
    getOverallConnectionStatus() {
        const channels = Array.from(this.activeChannels.values());
        if (channels.length === 0)
            return 'disconnected';
        const connected = channels.filter(ch => ch.state === 'joined').length;
        if (connected === channels.length)
            return 'connected';
        if (connected === 0)
            return 'disconnected';
        return 'mixed';
    }
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const value = String(item[key]);
            groups[value] = (groups[value] || 0) + 1;
            return groups;
        }, {});
    }
    calculatePerformanceTrend(operations) {
        const recent = operations.slice(-50);
        const older = operations.slice(-100, -50);
        const recentAvg = recent.reduce((sum, op) => sum + op.duration, 0) / recent.length || 0;
        const olderAvg = older.reduce((sum, op) => sum + op.duration, 0) / older.length || 0;
        return {
            trend: recentAvg > olderAvg ? 'slower' : 'faster',
            change: olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0
        };
    }
    /**
     * Export metrics
     */
    exportMetrics() {
        return {
            operations: Object.fromEntries(this.operationMetrics),
            realtime: Object.fromEntries(this.realtimeMetrics),
            storage: this.storageMetrics,
            auth: this.authMetrics,
            summary: this.getPerformanceSummary()
        };
    }
    /**
     * Stop monitoring and cleanup
     */
    async stop() {
        if (!this.isActive)
            return;
        // Restore original methods
        if (this.client) {
            this.originalMethods.forEach((method, key) => {
                if (key === 'from' && this.client) {
                    this.client.from = method;
                }
                else if (key === 'rpc' && this.client) {
                    this.client.rpc = method;
                }
                else if (key === 'channel' && this.client) {
                    this.client.channel = method;
                }
                else if (key === 'storageFrom' && this.client?.storage) {
                    this.client.storage.from = method;
                }
                else if (key.startsWith('auth_') && this.client?.auth) {
                    const methodName = key.replace('auth_', '');
                    this.client.auth[methodName] = method;
                }
            });
        }
        // Unsubscribe from all channels
        this.activeChannels.forEach(channel => {
            try {
                channel.unsubscribe();
            }
            catch (error) {
                console.warn('Error unsubscribing from channel:', error);
            }
        });
        this.isActive = false;
        await this.profiler.stop();
        console.log('🛑 Supabase Agent stopped');
    }
    /** TEST COMPATIBILITY WRAPPERS */
    startMonitoring() {
        return this.init();
    }
    async stopMonitoring() {
        await this.stop();
    }
    getOperationMetrics() {
        return Array.from(this.operationMetrics.values()).flat();
    }
    getTableStatistics() {
        return Array.from(this.operationMetrics.keys());
    }
}
exports.SupabaseAgent = SupabaseAgent;
// Export default instance
exports.supabaseAgent = new SupabaseAgent();
// Auto-initialize if in browser/Node environment
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
    // Note: Requires manual init with credentials
    console.log('💡 Supabase Agent ready - call supabaseAgent.init(url, key) to start monitoring');
}
//# sourceMappingURL=index.js.map