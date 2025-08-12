import { BaseAgent, AgentConfig } from '@stacksleuth/core';
import { Connection, createConnection } from 'mysql2/promise';
import { MySQLConfig, QueryMetrics, ConnectionPoolMetrics } from './types';

export class MySQLAgent extends BaseAgent {
  private connection?: Connection;
  private mysqlConfig: MySQLConfig;
  private queryMetrics: Map<string, QueryMetrics> = new Map();
  private poolMetrics: ConnectionPoolMetrics = {
    active: 0,
    idle: 0,
    waiting: 0,
    total: 0
  };
  private metricsInterval?: NodeJS.Timeout;
  private performanceInterval?: NodeJS.Timeout;

  constructor(config: MySQLConfig & AgentConfig) {
    super(config);
    this.mysqlConfig = config;
  }

  async startMonitoring(): Promise<void> {
    this.isActive = true;
    
    try {
      this.connection = await createConnection({
        host: this.mysqlConfig.host,
        port: this.mysqlConfig.port || 3306,
        user: this.mysqlConfig.user,
        password: this.mysqlConfig.password,
        database: this.mysqlConfig.database
      });

      this.setupQueryInterception();
      this.startMetricsCollection();
      
      if (this.config.debug) {
        console.log('[MySQLAgent] Started successfully');
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[MySQLAgent] Failed to start', error);
      }
      throw error;
    }
  }

  async stopMonitoring(): Promise<void> {
    this.isActive = false;
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
    }
    
    if (this.connection) {
      await this.connection.end();
    }
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
        if (duration > (this.mysqlConfig.slowQueryThreshold || 1000)) {
          this.recordMetric('mysql.slow_query', duration, {
            query: this.sanitizeQuery(sql),
            database: this.mysqlConfig.database
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
    this.metricsInterval = setInterval(async () => {
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
        
        this.recordMetric('mysql.connections.active', this.poolMetrics.active, {
          unit: 'connections'
        });
        
        this.recordMetric('mysql.connections.idle', this.poolMetrics.idle, {
          unit: 'connections'
        });
      } catch (error) {
        if (this.config.debug) {
          console.error('[MySQLAgent] Failed to collect metrics', error);
        }
      }
    }, this.mysqlConfig.metricsInterval || 30000);
    
    // Collect query performance schema metrics
    if (this.mysqlConfig.enablePerformanceSchema) {
      this.collectPerformanceSchemaMetrics();
    }
  }

  private async collectPerformanceSchemaMetrics(): Promise<void> {
    this.performanceInterval = setInterval(async () => {
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
          this.recordMetric('mysql.query.performance', row.avg_time_ms, {
            unit: 'ms',
            query: this.sanitizeQuery(row.query),
            executions: row.executions.toString(),
            rows_examined: row.rows_examined.toString()
          });
        });
      } catch (error) {
        if (this.config.debug) {
          console.warn('[MySQLAgent] Performance schema not available or not enabled');
        }
      }
    }, this.mysqlConfig.performanceSchemaInterval || 60000);
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
    
    this.recordMetric('mysql.query.duration', duration, {
      unit: 'ms',
      query_type: this.getQueryType(sql),
      success: success.toString()
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