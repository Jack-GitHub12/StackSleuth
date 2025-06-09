import { TraceCollector, StackSleuthConfig } from '@stacksleuth/core';
import { Pool, Client, PoolClient } from 'pg';
interface DbInstrumentationOptions {
    enableQueryLogging?: boolean;
    slowQueryThreshold?: number;
    logValues?: boolean;
}
/**
 * Database agent for PostgreSQL instrumentation
 */
export declare class DatabaseAgent {
    private collector;
    private options;
    constructor(config?: Partial<StackSleuthConfig>, options?: DbInstrumentationOptions);
    /**
     * Instrument a PostgreSQL Pool
     */
    instrumentPool(pool: Pool): Pool;
    /**
     * Instrument a PostgreSQL Client
     */
    instrumentClient(client: Client | PoolClient): void;
    /**
     * Create a query wrapper that traces database operations
     */
    private createQueryWrapper;
    /**
     * Complete query tracing
     */
    private completeQuery;
    /**
     * Extract the query type (SELECT, INSERT, UPDATE, etc.)
     */
    private getQueryType;
    /**
     * Extract table name from query
     */
    private extractTableName;
    /**
     * Sanitize query by removing parameter values
     */
    private sanitizeQuery;
    /**
     * Get the trace collector instance
     */
    getCollector(): TraceCollector;
}
/**
 * Instrument a PostgreSQL pool with default settings
 */
export declare function instrumentPg(pool: Pool, options?: DbInstrumentationOptions): Pool;
/**
 * Instrument a PostgreSQL client with default settings
 */
export declare function instrumentPgClient(client: Client, options?: DbInstrumentationOptions): void;
/**
 * Create a database agent instance
 */
export declare function createDatabaseAgent(config?: Partial<StackSleuthConfig>, options?: DbInstrumentationOptions): DatabaseAgent;
export default DatabaseAgent;
//# sourceMappingURL=index.d.ts.map