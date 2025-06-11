import { SupabaseClient } from '@supabase/supabase-js';
export interface SupabaseOperationMetrics {
    operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | 'rpc' | 'storage' | 'auth';
    table?: string;
    duration: number;
    rowCount?: number;
    querySize: number;
    cacheHit: boolean;
    error?: string;
    timestamp: number;
}
export interface SupabaseRealtimeMetrics {
    channel: string;
    event: string;
    subscriptionCount: number;
    messageSize: number;
    latency: number;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    timestamp: number;
}
export interface SupabaseStorageMetrics {
    bucket: string;
    operation: 'upload' | 'download' | 'delete' | 'list';
    fileSize: number;
    duration: number;
    error?: string;
    timestamp: number;
}
export interface SupabaseAuthMetrics {
    operation: 'signIn' | 'signUp' | 'signOut' | 'getUser' | 'refreshToken';
    provider?: string;
    duration: number;
    success: boolean;
    error?: string;
    timestamp: number;
}
export declare class SupabaseAgent {
    private profiler;
    private client?;
    private isActive;
    private operationMetrics;
    private realtimeMetrics;
    private storageMetrics;
    private authMetrics;
    private activeChannels;
    private originalMethods;
    constructor(config?: {
        endpoint?: string;
        apiKey?: string;
        slowQueryThreshold?: number;
        maxMetricsHistory?: number;
        monitorRealtime?: boolean;
        monitorStorage?: boolean;
        monitorAuth?: boolean;
    });
    /**
     * Initialize the Supabase agent
     */
    init(supabaseUrl?: string, supabaseKey?: string): Promise<void>;
    /**
     * Instrument an existing Supabase client
     */
    instrumentClient(client: SupabaseClient): void;
    /**
     * Instrument Supabase client methods
     */
    private instrumentSupabaseClient;
    /**
     * Instrument database operations
     */
    private instrumentDatabaseOperations;
    /**
     * Wrap query builder methods
     */
    private wrapQueryBuilder;
    /**
     * Instrument realtime operations
     */
    private instrumentRealtimeOperations;
    /**
     * Instrument a realtime channel
     */
    private instrumentChannel;
    /**
     * Instrument storage operations
     */
    private instrumentStorageOperations;
    /**
     * Wrap storage bucket methods
     */
    private wrapStorageBucket;
    /**
     * Instrument auth operations
     */
    private instrumentAuthOperations;
    /**
     * Record database operation metrics
     */
    private recordOperation;
    /**
     * Record realtime event metrics
     */
    private recordRealtimeEvent;
    /**
     * Record storage operation metrics
     */
    private recordStorageOperation;
    /**
     * Record auth operation metrics
     */
    private recordAuthOperation;
    /**
     * Get performance summary
     */
    getPerformanceSummary(): any;
    /**
     * Get table operation statistics
     */
    getTableStats(tableName: string): any;
    /**
     * Helper methods
     */
    private getFileSize;
    private mapAuthOperation;
    private getTopTables;
    private getOverallConnectionStatus;
    private groupBy;
    private calculatePerformanceTrend;
    /**
     * Export metrics
     */
    exportMetrics(): any;
    /**
     * Stop monitoring and cleanup
     */
    stop(): Promise<void>;
    /** TEST COMPATIBILITY WRAPPERS */
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;
    getOperationMetrics(): any[];
    getTableStatistics(): any[];
}
export declare const supabaseAgent: SupabaseAgent;
//# sourceMappingURL=index.d.ts.map