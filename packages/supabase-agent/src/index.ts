import { ProfilerCore } from '@stacksleuth/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

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

export class SupabaseAgent {
  private profiler: ProfilerCore;
  private client?: SupabaseClient;
  private isActive: boolean = false;
  private operationMetrics: Map<string, SupabaseOperationMetrics[]> = new Map();
  private realtimeMetrics: Map<string, SupabaseRealtimeMetrics[]> = new Map();
  private storageMetrics: SupabaseStorageMetrics[] = [];
  private authMetrics: SupabaseAuthMetrics[] = [];
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private originalMethods: Map<string, any> = new Map();

  constructor(config?: {
    endpoint?: string;
    apiKey?: string;
    slowQueryThreshold?: number;
    maxMetricsHistory?: number;
    monitorRealtime?: boolean;
    monitorStorage?: boolean;
    monitorAuth?: boolean;
  }) {
    this.profiler = new ProfilerCore(config);
  }

  /**
   * Initialize the Supabase agent
   */
  public async init(supabaseUrl?: string, supabaseKey?: string): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;
    await this.profiler.init();

    // Initialize Supabase client if credentials provided
    if (supabaseUrl && supabaseKey) {
      this.client = createClient(supabaseUrl, supabaseKey);
      this.instrumentSupabaseClient();
    }

    console.log('✅ Supabase Agent initialized');
  }

  /**
   * Instrument an existing Supabase client
   */
  public instrumentClient(client: SupabaseClient): void {
    this.client = client;
    this.instrumentSupabaseClient();
  }

  /**
   * Instrument Supabase client methods
   */
  private instrumentSupabaseClient(): void {
    if (!this.client) return;

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
  private instrumentDatabaseOperations(): void {
    if (!this.client) return;

    // Check if from method exists
    if (this.client.from && typeof this.client.from === 'function') {
      const originalFrom = this.client.from.bind(this.client);
      this.originalMethods.set('from', originalFrom);

      this.client.from = (table: string) => {
        const queryBuilder = originalFrom(table);
        return this.wrapQueryBuilder(queryBuilder, table);
      };
    }

    // Instrument RPC calls using type assertion to avoid type conflicts
    if (this.client.rpc && typeof this.client.rpc === 'function') {
      const originalRpc = this.client.rpc.bind(this.client);
      this.originalMethods.set('rpc', originalRpc);

      // Override with type assertion to avoid Supabase type complexity
      (this.client as any).rpc = (fn: string, args?: any, options?: any) => {
        const startTime = Date.now();
        
        const promise = originalRpc(fn, args, options);
        
        const resultPromise = Promise.resolve(promise);
        return resultPromise.then((result: any) => {
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
        }).catch((error: any) => {
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
  }

  /**
   * Wrap query builder methods
   */
  private wrapQueryBuilder(queryBuilder: any, tableName: string): any {
    const operations = ['select', 'insert', 'update', 'delete', 'upsert'];
    
    operations.forEach(operation => {
      if (queryBuilder[operation]) {
        const originalMethod = queryBuilder[operation].bind(queryBuilder);
        
        queryBuilder[operation] = (...args: any[]) => {
          const startTime = Date.now();
          const result = originalMethod(...args);
          
          // If result has a then method, it's a promise-like object
          if (result && typeof result.then === 'function') {
            return result.then((response: any) => {
              this.recordOperation({
                operation: operation as any,
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
  private instrumentRealtimeOperations(): void {
    if (!this.client) return;

    if (this.client.channel && typeof this.client.channel === 'function') {
      const originalChannel = this.client.channel.bind(this.client);
      this.originalMethods.set('channel', originalChannel);

      this.client.channel = (name: string, opts?: any) => {
        const channel = originalChannel(name, opts);
        this.instrumentChannel(channel, name);
        return channel;
      };
    }
  }

  /**
   * Instrument a realtime channel
   */
  private instrumentChannel(channel: RealtimeChannel, channelName: string): void {
    this.activeChannels.set(channelName, channel);

    // Monitor channel events using the standard Supabase API
    try {
      // Subscribe to all changes on this channel
      channel.on('*' as any, { event: '*' }, (payload: any) => {
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
    } catch (error) {
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
  private instrumentStorageOperations(): void {
    if (!this.client?.storage) return;

    if (this.client.storage.from && typeof this.client.storage.from === 'function') {
      const originalFrom = this.client.storage.from.bind(this.client.storage);
      this.originalMethods.set('storageFrom', originalFrom);

      this.client.storage.from = (bucketName: string) => {
        const bucket = originalFrom(bucketName);
        return this.wrapStorageBucket(bucket, bucketName);
      };
    }
  }

  /**
   * Wrap storage bucket methods
   */
  private wrapStorageBucket(bucket: any, bucketName: string): any {
    const operations = ['upload', 'download', 'remove', 'list'];

    operations.forEach(operation => {
      if (bucket[operation]) {
        const originalMethod = bucket[operation].bind(bucket);
        
        bucket[operation] = (...args: any[]) => {
          const startTime = Date.now();
          const result = originalMethod(...args);
          
          if (result && typeof result.then === 'function') {
            return result.then((response: any) => {
              this.recordStorageOperation({
                bucket: bucketName,
                operation: operation as any,
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
  private instrumentAuthOperations(): void {
    if (!this.client?.auth) return;

    const authMethods = [
      'signInWithPassword',
      'signInWithOAuth',
      'signUp',
      'signOut',
      'getUser',
      'refreshToken'
    ];

    authMethods.forEach(method => {
      const authClient = this.client!.auth as any;
      if (authClient[method] && typeof authClient[method] === 'function') {
        const originalMethod = authClient[method].bind(authClient);
        this.originalMethods.set(`auth_${method}`, originalMethod);
        
        authClient[method] = (...args: any[]) => {
          const startTime = Date.now();
          const result = originalMethod(...args);
          
          if (result && typeof result.then === 'function') {
            return result.then((response: any) => {
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
  private recordOperation(metrics: SupabaseOperationMetrics): void {
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
  private recordRealtimeEvent(metrics: SupabaseRealtimeMetrics): void {
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
  private recordStorageOperation(metrics: SupabaseStorageMetrics): void {
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
  private recordAuthOperation(metrics: SupabaseAuthMetrics): void {
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
   * Get table operation statistics
   */
  public getTableStats(tableName: string): any {
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
  private getFileSize(fileName: any, response: any): number {
    if (response.data && typeof response.data === 'object') {
      return JSON.stringify(response.data).length;
    }
    return 0;
  }

  private mapAuthOperation(method: string): SupabaseAuthMetrics['operation'] {
    const mapping: { [key: string]: SupabaseAuthMetrics['operation'] } = {
      'signInWithPassword': 'signIn',
      'signInWithOAuth': 'signIn',
      'signUp': 'signUp',
      'signOut': 'signOut',
      'getUser': 'getUser',
      'refreshToken': 'refreshToken'
    };
    return mapping[method] || 'getUser';
  }

  private getTopTables(): Array<{ table: string; operations: number }> {
    return Array.from(this.operationMetrics.entries())
      .map(([table, operations]) => ({ table, operations: operations.length }))
      .sort((a, b) => b.operations - a.operations)
      .slice(0, 10);
  }

  private getOverallConnectionStatus(): 'connected' | 'disconnected' | 'mixed' {
    const channels = Array.from(this.activeChannels.values());
    if (channels.length === 0) return 'disconnected';
    
    const connected = channels.filter(ch => ch.state === 'joined').length;
    if (connected === channels.length) return 'connected';
    if (connected === 0) return 'disconnected';
    return 'mixed';
  }

  private groupBy<T>(array: T[], key: keyof T): { [key: string]: number } {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {} as { [key: string]: number });
  }

  private calculatePerformanceTrend(operations: SupabaseOperationMetrics[]): any {
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
  public exportMetrics(): any {
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
  public async stop(): Promise<void> {
    if (!this.isActive) return;

    // Restore original methods
    if (this.client) {
      this.originalMethods.forEach((method, key) => {
        if (key === 'from' && this.client) {
          this.client.from = method;
        } else if (key === 'rpc' && this.client) {
          this.client.rpc = method;
        } else if (key === 'channel' && this.client) {
          this.client.channel = method;
        } else if (key === 'storageFrom' && this.client?.storage) {
          this.client.storage.from = method;
        } else if (key.startsWith('auth_') && this.client?.auth) {
          const methodName = key.replace('auth_', '');
          (this.client.auth as any)[methodName] = method;
        }
      });
    }

    // Unsubscribe from all channels
    this.activeChannels.forEach(channel => {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing from channel:', error);
      }
    });

    this.isActive = false;
    await this.profiler.stop();
    
    console.log('🛑 Supabase Agent stopped');
  }

  /** TEST COMPATIBILITY WRAPPERS */
  public startMonitoring(): Promise<void> {
    return this.init();
  }

  public async stopMonitoring(): Promise<void> {
    await this.stop();
  }

  public getOperationMetrics(): any[] {
    return Array.from(this.operationMetrics.values()).flat();
  }

  public getTableStatistics(): any[] {
    return Array.from(this.operationMetrics.keys());
  }

  public getPerformanceSummary(): any {
    const allOperations = Array.from(this.operationMetrics.values()).flat();
    
    // Return the expected format for tests
    return {
      totalOperations: allOperations.length,
      averageResponseTime: allOperations.reduce((sum, op) => sum + op.duration, 0) / allOperations.length || 0,
      database: {
        totalOperations: allOperations.length,
        averageDuration: allOperations.reduce((sum, op) => sum + op.duration, 0) / allOperations.length || 0,
        slowQueries: allOperations.filter(op => op.duration > 1000).length,
        errorRate: allOperations.filter(op => op.error).length / allOperations.length || 0,
        topTables: this.getTopTables(),
        cacheHitRate: allOperations.filter(op => op.cacheHit).length / allOperations.length || 0
      },
      realtime: {
        totalEvents: Array.from(this.realtimeMetrics.values()).flat().length,
        activeChannels: this.activeChannels.size,
        averageLatency: Array.from(this.realtimeMetrics.values()).flat().reduce((sum, m) => sum + m.latency, 0) / Array.from(this.realtimeMetrics.values()).flat().length || 0
      },
      storage: {
        totalOperations: this.storageMetrics.length,
        averageDuration: this.storageMetrics.reduce((sum, m) => sum + m.duration, 0) / this.storageMetrics.length || 0,
        totalTransferred: this.storageMetrics.reduce((sum, m) => sum + m.fileSize, 0)
      },
      auth: {
        totalOperations: this.authMetrics.length,
        successRate: this.authMetrics.filter(m => m.success).length / this.authMetrics.length || 0,
        averageDuration: this.authMetrics.reduce((sum, m) => sum + m.duration, 0) / this.authMetrics.length || 0
      }
    };
  }
}

// Export default instance
export const supabaseAgent = new SupabaseAgent();

// Auto-initialize if in browser/Node environment
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  // Note: Requires manual init with credentials
  console.log('💡 Supabase Agent ready - call supabaseAgent.init(url, key) to start monitoring');
} 