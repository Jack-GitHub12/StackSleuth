import { BaseAgent, AgentConfig, MetricType } from '@stacksleuth/core';
import { Connection, createConnection } from 'mysql2/promise';
import { MySQLConfig, QueryMetrics, ConnectionPoolMetrics } from './types';

export class MySQLAgent extends BaseAgent {
  private connection?: Connection;
  private config: MySQLConfig;
  private queryMetrics: Map<string, QueryMetrics> = new Map();
  private poolMetrics: ConnectionPoolMetrics = {
    active: 0,
    idle: 0,
    waiting: 0,
    total: 0
  };

  constructor(config: MySQLConfig & AgentConfig) {
    super(config);
    this.config = config;
  }

  async start(): Promise<void> {
    await super.start();
    
    try {
      this.connection = await createConnection({
        host: this.config.host,
        port: this.config.port || 3306,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database
      });

      this.setupQueryInterception();
      this.startMetricsCollection();
      
      this.logger.info('MySQL Agent started successfully');
    } catch (error) {
      this.logger.error('Failed to start MySQL Agent', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
    }
    await super.stop();
  }

  private setupQueryInterception(): void {
    // Intercept and monitor queries
    const originalQuery = this.connection!.query.bind(this.connection);
    
    (this.connection as any).query = async (sql: string, values?: any) => {
      const startTime = Date.now();
      const queryId = this.generateQueryId(sql);
      
      try {
        const result = await originalQuery(sql, values);
        const duration = Date.now() - startTime;
        
        this.recordQueryMetrics(queryId, sql, duration, true);
        
        // Track slow queries
        if (duration > (this.config.slowQueryThreshold || 1000)) {
          this.recordMetric({
            type: MetricType.DATABASE,
            name: 'mysql.slow_query',
            value: duration,
            unit: 'ms',
            tags: {
              query: this.sanitizeQuery(sql),
              database: this.config.database
            }
          });
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.recordQueryMetrics(queryId, sql, duration, false);
        throw error;
      }
    };
  }

  private startMetricsCollection(): void {
    // Collect connection pool metrics
    setInterval(async () => {
      try {
        const [rows] = await this.connection!.query(
          "SHOW STATUS WHERE Variable_name IN ('Threads_connected', 'Threads_running', 'Max_used_connections')"
        );
        
        const status = (rows as any[]).reduce((acc, row) => {
          acc[row.Variable_name] = parseInt(row.Value, 10);
          return acc;
        }, {} as any);
        
        this.poolMetrics = {
          active: status.Threads_running || 0,
          idle: (status.Threads_connected || 0) - (status.Threads_running || 0),
          waiting: 0,
          total: status.Threads_connected || 0
        };
        
        this.recordMetric({
          type: MetricType.DATABASE,
          name: 'mysql.connections.active',
          value: this.poolMetrics.active,
          unit: 'connections'
        });
        
        this.recordMetric({
          type: MetricType.DATABASE,
          name: 'mysql.connections.idle',
          value: this.poolMetrics.idle,
          unit: 'connections'
        });
      } catch (error) {
        this.logger.error('Failed to collect MySQL metrics', error);
      }
    }, this.config.metricsInterval || 30000);
    
    // Collect query performance schema metrics
    if (this.config.enablePerformanceSchema) {
      this.collectPerformanceSchemaMetrics();
    }
  }

  private async collectPerformanceSchemaMetrics(): Promise<void> {
    setInterval(async () => {
      try {
        const [rows] = await this.connection!.query(`
          SELECT 
            DIGEST_TEXT as query,
            COUNT_STAR as executions,
            AVG_TIMER_WAIT/1000000000 as avg_time_ms,
            SUM_TIMER_WAIT/1000000000 as total_time_ms,
            SUM_ROWS_SENT as rows_sent,
            SUM_ROWS_EXAMINED as rows_examined
          FROM performance_schema.events_statements_summary_by_digest
          WHERE DIGEST_TEXT IS NOT NULL
          ORDER BY SUM_TIMER_WAIT DESC
          LIMIT 10
        `);
        
        (rows as any[]).forEach(row => {
          this.recordMetric({
            type: MetricType.DATABASE,
            name: 'mysql.query.performance',
            value: row.avg_time_ms,
            unit: 'ms',
            tags: {
              query: this.sanitizeQuery(row.query),
              executions: row.executions.toString(),
              rows_examined: row.rows_examined.toString()
            }
          });
        });
      } catch (error) {
        this.logger.warn('Performance schema not available or not enabled');
      }
    }, this.config.performanceSchemaInterval || 60000);
  }

  private recordQueryMetrics(queryId: string, sql: string, duration: number, success: boolean): void {
    const existing = this.queryMetrics.get(queryId) || {
      query: this.sanitizeQuery(sql),
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errors: 0
    };
    
    existing.count++;
    existing.totalDuration += duration;
    existing.avgDuration = existing.totalDuration / existing.count;
    existing.minDuration = Math.min(existing.minDuration, duration);
    existing.maxDuration = Math.max(existing.maxDuration, duration);
    
    if (!success) {
      existing.errors++;
    }
    
    this.queryMetrics.set(queryId, existing);
    
    this.recordMetric({
      type: MetricType.DATABASE,
      name: 'mysql.query.duration',
      value: duration,
      unit: 'ms',
      tags: {
        query_type: this.getQueryType(sql),
        success: success.toString()
      }
    });
  }

  private generateQueryId(sql: string): string {
    // Generate a normalized query ID for grouping similar queries
    const normalized = sql
      .replace(/\s+/g, ' ')
      .replace(/\d+/g, '?')
      .replace(/'[^']*'/g, '?')
      .toLowerCase()
      .trim();
    
    return Buffer.from(normalized).toString('base64').substring(0, 16);
  }

  private sanitizeQuery(sql: string): string {
    // Remove sensitive data from queries
    return sql
      .replace(/'[^']*'/g, "'?'")
      .replace(/\d{4,}/g, '####')
      .substring(0, 200);
  }

  private getQueryType(sql: string): string {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('CREATE')) return 'CREATE';
    if (trimmed.startsWith('DROP')) return 'DROP';
    if (trimmed.startsWith('ALTER')) return 'ALTER';
    return 'OTHER';
  }

  getQueryMetrics(): QueryMetrics[] {
    return Array.from(this.queryMetrics.values())
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 100);
  }

  getConnectionPoolMetrics(): ConnectionPoolMetrics {
    return { ...this.poolMetrics };
  }
}