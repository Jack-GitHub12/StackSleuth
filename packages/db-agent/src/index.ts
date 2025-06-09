import { TraceCollector, StackSleuthConfig, SpanType, TraceStatus } from '@stacksleuth/core';
import { Pool, Client, PoolClient } from 'pg';

interface DbInstrumentationOptions {
  enableQueryLogging?: boolean;
  slowQueryThreshold?: number; // milliseconds
  logValues?: boolean;
}

/**
 * Database agent for PostgreSQL instrumentation
 */
export class DatabaseAgent {
  private collector: TraceCollector;
  private options: DbInstrumentationOptions;

  constructor(config?: Partial<StackSleuthConfig>, options?: DbInstrumentationOptions) {
    this.collector = new TraceCollector(config);
    this.options = {
      enableQueryLogging: true,
      slowQueryThreshold: 100,
      logValues: false,
      ...options
    };
  }

  /**
   * Instrument a PostgreSQL Pool
   */
  instrumentPool(pool: Pool): Pool {
    const originalQuery = pool.query.bind(pool);
    const originalConnect = pool.connect.bind(pool);

    // Instrument query method
    pool.query = this.createQueryWrapper(originalQuery);

    // Instrument connect method to return instrumented clients
    (pool.connect as any) = (callback?: any) => {
      if (callback) {
        return originalConnect((err: Error | undefined, client?: PoolClient, done?: any) => {
          if (err) return callback(err);
          if (client) {
            this.instrumentClient(client);
          }
          callback(err, client, done);
        });
      } else {
        return originalConnect().then((client: PoolClient) => {
          this.instrumentClient(client);
          return client;
        });
      }
    };

    return pool;
  }

  /**
   * Instrument a PostgreSQL Client
   */
  instrumentClient(client: Client | PoolClient): void {
    const originalQuery = client.query.bind(client);
    client.query = this.createQueryWrapper(originalQuery);
  }

  /**
   * Create a query wrapper that traces database operations
   */
  private createQueryWrapper(originalQuery: Function) {
    return (...args: any[]) => {
      const queryText = typeof args[0] === 'string' ? args[0] : args[0]?.text || 'Unknown query';
      const queryValues = args[1] || [];
      
      // Start tracing
      const trace = this.collector.startTrace(`DB Query: ${this.getQueryType(queryText)}`, {
        query: this.options.logValues ? queryText : this.sanitizeQuery(queryText),
        database: 'postgresql'
      });

      if (!trace) {
        return originalQuery(...args);
      }

      const span = this.collector.startSpan(
        trace.id,
        `PostgreSQL ${this.getQueryType(queryText)}`,
        SpanType.DB_QUERY,
        undefined,
        {
          query: this.options.logValues ? queryText : this.sanitizeQuery(queryText),
          database: 'postgresql',
          table: this.extractTableName(queryText),
          paramCount: Array.isArray(queryValues) ? queryValues.length : 0
        }
      );

      const startTime = Date.now();
      const result = originalQuery(...args);

      // Handle both callback and promise-based queries
      if (result && typeof result.then === 'function') {
        // Promise-based query
        return result
          .then((queryResult: any) => {
            const duration = Date.now() - startTime;
            this.completeQuery(span, trace, duration, queryResult, null);
            return queryResult;
          })
          .catch((error: Error) => {
            const duration = Date.now() - startTime;
            this.completeQuery(span, trace, duration, null, error);
            throw error;
          });
      } else {
        // Callback-based query or synchronous result
        const duration = Date.now() - startTime;
        this.completeQuery(span, trace, duration, result, null);
        return result;
      }
    };
  }

  /**
   * Complete query tracing
   */
  private completeQuery(
    span: any, 
    trace: any, 
    duration: number, 
    result: any, 
    error: Error | null
  ): void {
    if (span) {
      const metadata = {
        duration,
        rowCount: result?.rowCount || 0,
        command: result?.command || 'unknown'
      };

      if (error) {
        this.collector.addSpanError(span.id, error);
        this.collector.completeSpan(span.id, TraceStatus.ERROR, metadata);
      } else {
        this.collector.completeSpan(span.id, TraceStatus.SUCCESS, metadata);
      }

      // Log slow queries
      if (this.options.enableQueryLogging && duration > (this.options.slowQueryThreshold || 100)) {
        console.warn(`🐌 Slow query detected (${duration}ms):`, span.metadata.query);
      }
    }

    if (trace) {
      const status = error ? TraceStatus.ERROR : TraceStatus.SUCCESS;
      this.collector.completeTrace(trace.id, status);
    }
  }

  /**
   * Extract the query type (SELECT, INSERT, UPDATE, etc.)
   */
  private getQueryType(query: string): string {
    const match = query.trim().match(/^(\w+)/i);
    return match ? match[1].toUpperCase() : 'UNKNOWN';
  }

  /**
   * Extract table name from query
   */
  private extractTableName(query: string): string {
    // Simple regex to extract table name - could be improved
    const patterns = [
      /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
      /INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
      /UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
      /DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) return match[1];
    }

    return 'unknown';
  }

  /**
   * Sanitize query by removing parameter values
   */
  private sanitizeQuery(query: string): string {
    // Replace parameter placeholders with generic markers
    return query
      .replace(/\$\d+/g, '$?')
      .replace(/'[^']*'/g, "'?'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get the trace collector instance
   */
  getCollector(): TraceCollector {
    return this.collector;
  }
}

/**
 * Instrument a PostgreSQL pool with default settings
 */
export function instrumentPg(
  pool: Pool,
  options?: DbInstrumentationOptions
): Pool {
  const agent = new DatabaseAgent(undefined, options);
  return agent.instrumentPool(pool);
}

/**
 * Instrument a PostgreSQL client with default settings
 */
export function instrumentPgClient(
  client: Client,
  options?: DbInstrumentationOptions
): void {
  const agent = new DatabaseAgent(undefined, options);
  agent.instrumentClient(client);
}

/**
 * Create a database agent instance
 */
export function createDatabaseAgent(
  config?: Partial<StackSleuthConfig>,
  options?: DbInstrumentationOptions
): DatabaseAgent {
  return new DatabaseAgent(config, options);
}

// Default export
export default DatabaseAgent; 