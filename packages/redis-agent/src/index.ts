import { ProfilerCore, PerformanceMetrics } from '@stacksleuth/core';

export interface RedisOperationMetrics {
  command: string;
  duration: number;
  keyCount: number;
  dataSize: number;
  success: boolean;
  error?: string;
  timestamp: number;
  connectionId: string;
}

export interface RedisConnectionMetrics {
  id: string;
  host: string;
  port: number;
  database: number;
  connectTime: number;
  totalOperations: number;
  avgResponseTime: number;
  errorRate: number;
  lastActivity: number;
  memoryUsage: number;
}

export interface RedisPerformanceStats {
  totalOperations: number;
  avgResponseTime: number;
  slowQueries: RedisOperationMetrics[];
  errorRate: number;
  topCommands: Array<{ command: string; count: number; avgDuration: number }>;
  connectionPool: RedisConnectionMetrics[];
  memoryStats: {
    total: number;
    used: number;
    peak: number;
    fragmentation: number;
  };
}

export class RedisAgent {
  private profiler: ProfilerCore;
  private operationMetrics: RedisOperationMetrics[] = [];
  private connectionMetrics: Map<string, RedisConnectionMetrics> = new Map();
  private isActive: boolean = false;
  private slowQueryThreshold: number = 100; // ms
  private maxMetricsHistory: number = 10000;
  private metricsInterval?: NodeJS.Timeout;

  constructor(config?: { 
    endpoint?: string; 
    apiKey?: string; 
    slowQueryThreshold?: number;
    maxMetricsHistory?: number;
    autoInit?: boolean;
  }) {
    this.profiler = new ProfilerCore(config);
    this.slowQueryThreshold = config?.slowQueryThreshold || 100;
    this.maxMetricsHistory = config?.maxMetricsHistory || 10000;
    
    // Don't auto-initialize to prevent hanging in tests
    if (config?.autoInit !== false && process.env.NODE_ENV !== 'test') {
      // Only auto-init in non-test environments
      setTimeout(() => this.init().catch(console.error), 0);
    }
  }

  /**
   * Initialize the Redis agent and start monitoring
   */
  public async init(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    
    try {
      await this.profiler.init();
    } catch (error) {
      // Don't fail if profiler can't initialize (e.g., in tests)
      console.warn('⚠️  ProfilerCore initialization failed:', error);
    }
    
    // Instrument Redis clients
    this.instrumentRedisClient();
    this.instrumentIORedisClient();
    this.startPeriodicMetricsCollection();
    
    console.log('🔄 Redis Agent initialized');
  }

  /**
   * Instrument the standard redis client
   */
  private instrumentRedisClient(): void {
    try {
      const redis = require('redis');
      if (!redis) return;

      // Patch createClient method
      const originalCreateClient = redis.createClient;
      redis.createClient = (...args: any[]) => {
        const client = originalCreateClient.apply(redis, args);
        this.wrapRedisClient(client, 'redis');
        return client;
      };

      console.log('✅ Redis client instrumented');
    } catch (error) {
      // Redis not installed, skip instrumentation
    }
  }

  /**
   * Instrument IORedis client
   */
  private instrumentIORedisClient(): void {
    try {
      const IORedis = require('ioredis');
      if (!IORedis) return;

      // Patch IORedis constructor
      const originalIORedis = IORedis.prototype.constructor;
      const self = this;
      
      IORedis.prototype.constructor = function(this: any, ...args: any[]) {
        const result = originalIORedis.apply(this, args);
        (this as any).redisAgent = self;
        self.wrapIORedisClient(this, 'ioredis');
        return result;
      };

      console.log('✅ IORedis client instrumented');
    } catch (error) {
      // IORedis not installed, skip instrumentation
    }
  }

  /**
   * Wrap Redis client methods for monitoring
   */
  private wrapRedisClient(client: any, clientType: string): void {
    const connectionId = this.generateConnectionId(client, clientType);
    
    // Track connection
    this.trackConnection(client, connectionId, clientType);

    // Wrap common Redis commands
    const commands = [
      'get', 'set', 'del', 'exists', 'incr', 'decr', 'hget', 'hset', 'hdel',
      'lpush', 'rpush', 'lpop', 'rpop', 'sadd', 'srem', 'smembers', 'zadd',
      'zrem', 'zrange', 'zrevrange', 'expire', 'ttl', 'keys', 'scan', 'eval',
      'multi', 'exec', 'watch', 'unwatch', 'publish', 'subscribe'
    ];

    commands.forEach(command => {
      if (typeof client[command] === 'function') {
        const originalMethod = client[command];
        client[command] = (...args: any[]) => {
          return this.wrapRedisOperation(
            originalMethod.bind(client),
            command,
            args,
            connectionId
          );
        };
      }
    });

    // Wrap sendCommand for generic command tracking
    if (typeof client.sendCommand === 'function') {
      const originalSendCommand = client.sendCommand;
      client.sendCommand = (command: any, ...args: any[]) => {
        return this.wrapRedisOperation(
          originalSendCommand.bind(client),
          command.name || 'UNKNOWN',
          args,
          connectionId
        );
      };
    }
  }

  /**
   * Wrap IORedis client methods
   */
  private wrapIORedisClient(client: any, clientType: string): void {
    const connectionId = this.generateConnectionId(client, clientType);
    
    // Track connection
    this.trackConnection(client, connectionId, clientType);

    // Wrap sendCommand method
    if (typeof client.sendCommand === 'function') {
      const originalSendCommand = client.sendCommand;
      client.sendCommand = (command: any, ...args: any[]) => {
        return this.wrapRedisOperation(
          originalSendCommand.bind(client),
          command.name || 'UNKNOWN',
          args,
          connectionId
        );
      };
    }

    // Wrap common commands directly
    const commands = Object.getOwnPropertyNames(client.constructor.prototype)
      .filter(name => typeof client[name] === 'function' && name !== 'constructor');

    commands.forEach(command => {
      if (this.isRedisCommand(command) && typeof client[command] === 'function') {
        const originalMethod = client[command];
        client[command] = (...args: any[]) => {
          return this.wrapRedisOperation(
            originalMethod.bind(client),
            command.toUpperCase(),
            args,
            connectionId
          );
        };
      }
    });
  }

  /**
   * Wrap Redis operations for performance monitoring
   */
  private async wrapRedisOperation(
    originalMethod: Function,
    command: string,
    args: any[],
    connectionId: string
  ): Promise<any> {
    const startTime = performance.now();
    const timestamp = Date.now();
    
    let result: any;
    let success = true;
    let error: string | undefined;
    
    try {
      result = await originalMethod(...args);
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      
      const metrics: RedisOperationMetrics = {
        command: command.toUpperCase(),
        duration,
        keyCount: this.extractKeyCount(command, args),
        dataSize: this.calculateDataSize(args, result),
        success,
        error,
        timestamp,
        connectionId
      };

      this.recordOperationMetrics(metrics);
      this.updateConnectionMetrics(connectionId, metrics);
    }
    
    return result;
  }

  /**
   * Track Redis connection
   */
  private trackConnection(client: any, connectionId: string, clientType: string): void {
    const connectStartTime = performance.now();
    
    client.on('connect', () => {
      const connectTime = performance.now() - connectStartTime;
      
      const connectionMetrics: RedisConnectionMetrics = {
        id: connectionId,
        host: client.options?.host || 'localhost',
        port: client.options?.port || 6379,
        database: client.options?.db || 0,
        connectTime,
        totalOperations: 0,
        avgResponseTime: 0,
        errorRate: 0,
        lastActivity: Date.now(),
        memoryUsage: 0
      };
      
      this.connectionMetrics.set(connectionId, connectionMetrics);
      
      this.profiler.recordMetric('redis_connection_established', {
        connectionId,
        clientType,
        connectTime,
        timestamp: Date.now()
      });
    });

    client.on('error', (error: Error) => {
      this.profiler.recordMetric('redis_connection_error', {
        connectionId,
        error: error.message,
        timestamp: Date.now()
      });
    });

    client.on('end', () => {
      this.profiler.recordMetric('redis_connection_closed', {
        connectionId,
        timestamp: Date.now()
      });
      this.connectionMetrics.delete(connectionId);
    });
  }

  /**
   * Record operation metrics (made public for testing)
   */
  public recordOperationMetrics(metrics: RedisOperationMetrics): void {
    this.operationMetrics.push(metrics);
    
    // Maintain history limit
    if (this.operationMetrics.length > this.maxMetricsHistory) {
      this.operationMetrics.splice(0, this.operationMetrics.length - this.maxMetricsHistory);
    }

    try {
      // Record with profiler (only if active)
      if (this.isActive) {
        this.profiler.recordMetric('redis_operation', metrics);

        // Record slow queries
        if (metrics.duration > this.slowQueryThreshold) {
          this.profiler.recordMetric('redis_slow_query', metrics);
        }
      }
    } catch (error) {
      // Don't fail on profiler errors
      console.warn('⚠️  Failed to record metrics:', error);
    }
  }

  /**
   * Update connection metrics
   */
  private updateConnectionMetrics(connectionId: string, operationMetrics: RedisOperationMetrics): void {
    const connection = this.connectionMetrics.get(connectionId);
    if (!connection) return;

    connection.totalOperations++;
    connection.lastActivity = Date.now();
    
    // Update average response time
    connection.avgResponseTime = (
      (connection.avgResponseTime * (connection.totalOperations - 1) + operationMetrics.duration) /
      connection.totalOperations
    );

    // Update error rate
    if (!operationMetrics.success) {
      const errorCount = this.operationMetrics
        .filter(m => m.connectionId === connectionId && !m.success)
        .length;
      connection.errorRate = errorCount / connection.totalOperations;
    }

    this.connectionMetrics.set(connectionId, connection);
  }

  /**
   * Start periodic metrics collection
   */
  private startPeriodicMetricsCollection(): void {
    // Clear any existing interval
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.metricsInterval = setInterval(() => {
      this.collectRedisInfo();
      this.cleanupOldMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Collect Redis INFO metrics
   */
  private async collectRedisInfo(): Promise<void> {
    for (const [connectionId, connection] of this.connectionMetrics) {
      try {
        // This would need to be implemented based on the specific Redis client
        // For now, we'll simulate memory collection
        const memoryUsage = process.memoryUsage().heapUsed;
        connection.memoryUsage = memoryUsage;
        
        this.profiler.recordMetric('redis_memory_usage', {
          connectionId,
          memoryUsage,
          timestamp: Date.now()
        });
      } catch (error) {
        // Ignore errors for now
      }
    }
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour ago
    this.operationMetrics = this.operationMetrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(client: any, clientType: string): string {
    const host = client.options?.host || 'localhost';
    const port = client.options?.port || 6379;
    const db = client.options?.db || 0;
    return `${clientType}:${host}:${port}:${db}:${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract key count from command arguments
   */
  private extractKeyCount(command: string, args: any[]): number {
    const keyCommands = ['GET', 'SET', 'DEL', 'EXISTS', 'INCR', 'DECR'];
    const multiKeyCommands = ['MGET', 'MSET', 'DEL'];
    
    if (keyCommands.includes(command.toUpperCase())) {
      return 1;
    }
    
    if (multiKeyCommands.includes(command.toUpperCase())) {
      return Math.max(1, Math.floor(args.length / 2));
    }
    
    return args.length > 0 ? 1 : 0;
  }

  /**
   * Calculate data size of operation
   */
  private calculateDataSize(args: any[], result?: any): number {
    let size = 0;
    
    // Calculate args size
    args.forEach(arg => {
      if (typeof arg === 'string') {
        size += arg.length;
      } else if (Buffer.isBuffer(arg)) {
        size += arg.length;
      } else if (typeof arg === 'object') {
        size += JSON.stringify(arg).length;
      }
    });
    
    // Calculate result size
    if (result) {
      if (typeof result === 'string') {
        size += result.length;
      } else if (Array.isArray(result)) {
        size += result.reduce((sum, item) => sum + (typeof item === 'string' ? item.length : 0), 0);
      } else if (typeof result === 'object') {
        size += JSON.stringify(result).length;
      }
    }
    
    return size;
  }

  /**
   * Check if method is a Redis command
   */
  private isRedisCommand(methodName: string): boolean {
    const redisCommands = [
      'get', 'set', 'del', 'exists', 'incr', 'decr', 'hget', 'hset', 'hdel',
      'lpush', 'rpush', 'lpop', 'rpop', 'sadd', 'srem', 'smembers', 'zadd',
      'zrem', 'zrange', 'zrevrange', 'expire', 'ttl', 'keys', 'scan', 'eval',
      'multi', 'exec', 'watch', 'unwatch', 'publish', 'subscribe', 'mget', 'mset'
    ];
    
    return redisCommands.includes(methodName.toLowerCase());
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): RedisPerformanceStats {
    const totalOperations = this.operationMetrics.length;
    const avgResponseTime = totalOperations > 0 
      ? this.operationMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0;
    
    const slowQueries = this.operationMetrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    const errorCount = this.operationMetrics.filter(m => !m.success).length;
    const errorRate = totalOperations > 0 ? errorCount / totalOperations : 0;
    
    // Calculate top commands
    const commandStats = new Map<string, { count: number; totalDuration: number }>();
    this.operationMetrics.forEach(m => {
      const existing = commandStats.get(m.command) || { count: 0, totalDuration: 0 };
      existing.count++;
      existing.totalDuration += m.duration;
      commandStats.set(m.command, existing);
    });
    
    const topCommands = Array.from(commandStats.entries())
      .map(([command, stats]) => ({
        command,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalOperations,
      avgResponseTime,
      slowQueries,
      errorRate,
      topCommands,
      connectionPool: Array.from(this.connectionMetrics.values()),
      memoryStats: {
        total: 0, // Would be collected from Redis INFO
        used: 0,
        peak: 0,
        fragmentation: 0
      }
    };
  }

  /**
   * Get recent operations
   */
  public getRecentOperations(limit: number = 100): RedisOperationMetrics[] {
    return this.operationMetrics
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get connection metrics
   */
  public getConnectionMetrics(): RedisConnectionMetrics[] {
    return Array.from(this.connectionMetrics.values());
  }

  /**
   * Stop the Redis agent and cleanup resources
   */
  public async stop(): Promise<void> {
    this.isActive = false;
    
    // Clear metrics collection interval
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
    
    // Clear metrics
    this.operationMetrics = [];
    this.connectionMetrics.clear();
    
    try {
      await this.profiler.stop();
    } catch (error) {
      // Ignore errors during stop
    }
    
    console.log('🛑 Redis Agent stopped');
  }
}

// Export default instance
export const redisAgent = new RedisAgent();

// Auto-initialize
redisAgent.init().catch(console.error); 