"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseAgent = void 0;
exports.instrumentPg = instrumentPg;
exports.instrumentPgClient = instrumentPgClient;
exports.createDatabaseAgent = createDatabaseAgent;
const core_1 = require("@stacksleuth/core");
/**
 * Database agent for PostgreSQL instrumentation
 */
class DatabaseAgent {
    constructor(config, options) {
        this.collector = new core_1.TraceCollector(config);
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
    instrumentPool(pool) {
        const originalQuery = pool.query.bind(pool);
        const originalConnect = pool.connect.bind(pool);
        // Instrument query method
        pool.query = this.createQueryWrapper(originalQuery);
        // Instrument connect method to return instrumented clients
        pool.connect = (callback) => {
            if (callback) {
                return originalConnect((err, client, done) => {
                    if (err)
                        return callback(err);
                    if (client) {
                        this.instrumentClient(client);
                    }
                    callback(err, client, done);
                });
            }
            else {
                return originalConnect().then((client) => {
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
    instrumentClient(client) {
        const originalQuery = client.query.bind(client);
        client.query = this.createQueryWrapper(originalQuery);
    }
    /**
     * Create a query wrapper that traces database operations
     */
    createQueryWrapper(originalQuery) {
        return (...args) => {
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
            const span = this.collector.startSpan(trace.id, `PostgreSQL ${this.getQueryType(queryText)}`, core_1.SpanType.DB_QUERY, undefined, {
                query: this.options.logValues ? queryText : this.sanitizeQuery(queryText),
                database: 'postgresql',
                table: this.extractTableName(queryText),
                paramCount: Array.isArray(queryValues) ? queryValues.length : 0
            });
            const startTime = Date.now();
            const result = originalQuery(...args);
            // Handle both callback and promise-based queries
            if (result && typeof result.then === 'function') {
                // Promise-based query
                return result
                    .then((queryResult) => {
                    const duration = Date.now() - startTime;
                    this.completeQuery(span, trace, duration, queryResult, null);
                    return queryResult;
                })
                    .catch((error) => {
                    const duration = Date.now() - startTime;
                    this.completeQuery(span, trace, duration, null, error);
                    throw error;
                });
            }
            else {
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
    completeQuery(span, trace, duration, result, error) {
        if (span) {
            const metadata = {
                duration,
                rowCount: result?.rowCount || 0,
                command: result?.command || 'unknown'
            };
            if (error) {
                this.collector.addSpanError(span.id, error);
                this.collector.completeSpan(span.id, core_1.TraceStatus.ERROR, metadata);
            }
            else {
                this.collector.completeSpan(span.id, core_1.TraceStatus.SUCCESS, metadata);
            }
            // Log slow queries
            if (this.options.enableQueryLogging && duration > (this.options.slowQueryThreshold || 100)) {
                console.warn(`🐌 Slow query detected (${duration}ms):`, span.metadata.query);
            }
        }
        if (trace) {
            const status = error ? core_1.TraceStatus.ERROR : core_1.TraceStatus.SUCCESS;
            this.collector.completeTrace(trace.id, status);
        }
    }
    /**
     * Extract the query type (SELECT, INSERT, UPDATE, etc.)
     */
    getQueryType(query) {
        const match = query.trim().match(/^(\w+)/i);
        return match ? match[1].toUpperCase() : 'UNKNOWN';
    }
    /**
     * Extract table name from query
     */
    extractTableName(query) {
        // Simple regex to extract table name - could be improved
        const patterns = [
            /FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
            /INSERT\s+INTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
            /UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/i,
            /DELETE\s+FROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i
        ];
        for (const pattern of patterns) {
            const match = query.match(pattern);
            if (match)
                return match[1];
        }
        return 'unknown';
    }
    /**
     * Sanitize query by removing parameter values
     */
    sanitizeQuery(query) {
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
    getCollector() {
        return this.collector;
    }
}
exports.DatabaseAgent = DatabaseAgent;
/**
 * Instrument a PostgreSQL pool with default settings
 */
function instrumentPg(pool, options) {
    const agent = new DatabaseAgent(undefined, options);
    return agent.instrumentPool(pool);
}
/**
 * Instrument a PostgreSQL client with default settings
 */
function instrumentPgClient(client, options) {
    const agent = new DatabaseAgent(undefined, options);
    agent.instrumentClient(client);
}
/**
 * Create a database agent instance
 */
function createDatabaseAgent(config, options) {
    return new DatabaseAgent(config, options);
}
// Default export
exports.default = DatabaseAgent;
//# sourceMappingURL=index.js.map