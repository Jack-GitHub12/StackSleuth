"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBAgent = void 0;
exports.instrumentMongoDB = instrumentMongoDB;
exports.instrumentMongoDb = instrumentMongoDb;
exports.instrumentMongoCollection = instrumentMongoCollection;
exports.createMongoDBAgent = createMongoDBAgent;
const core_1 = require("@stacksleuth/core");
/**
 * MongoDB agent for performance instrumentation
 */
class MongoDBAgent {
    constructor(config, options) {
        this.collector = new core_1.TraceCollector(config);
        this.options = {
            enableQueryLogging: true,
            slowQueryThreshold: 100,
            logDocuments: false,
            maxDocumentSize: 1024,
            ...options
        };
    }
    /**
     * Instrument a MongoDB client
     */
    instrumentClient(client) {
        const originalDb = client.db.bind(client);
        client.db = (...args) => {
            const db = originalDb(...args);
            return this.instrumentDb(db);
        };
        return client;
    }
    /**
     * Instrument a MongoDB database
     */
    instrumentDb(db) {
        const originalCollection = db.collection.bind(db);
        db.collection = (name, options) => {
            const collection = originalCollection(name, options);
            return this.instrumentCollection(collection, name);
        };
        return db;
    }
    /**
     * Instrument a MongoDB collection
     */
    instrumentCollection(collection, collectionName) {
        // List of methods to instrument
        const methodsToInstrument = [
            'find', 'findOne', 'insertOne', 'insertMany',
            'updateOne', 'updateMany', 'deleteOne', 'deleteMany',
            'replaceOne', 'aggregate', 'countDocuments', 'estimatedDocumentCount',
            'findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete',
            'createIndex', 'dropIndex', 'listIndexes'
        ];
        methodsToInstrument.forEach(methodName => {
            const originalMethod = collection[methodName];
            if (typeof originalMethod === 'function') {
                collection[methodName] = this.createMethodWrapper(originalMethod.bind(collection), methodName, collectionName);
            }
        });
        return collection;
    }
    /**
     * Create a wrapper for MongoDB operations
     */
    createMethodWrapper(originalMethod, operationName, collectionName) {
        return (...args) => {
            const operationType = this.getOperationType(operationName);
            const operationDetail = `${operationType} ${collectionName}`;
            // Start tracing
            const trace = this.collector.startTrace(`MongoDB: ${operationDetail}`, {
                operation: operationName,
                collection: collectionName,
                database: 'mongodb'
            });
            if (!trace) {
                return originalMethod(...args);
            }
            const span = this.collector.startSpan(trace.id, `MongoDB ${operationType}`, core_1.SpanType.DB_QUERY, undefined, {
                operation: operationName,
                collection: collectionName,
                database: 'mongodb',
                query: this.sanitizeQuery(args[0]),
                documentCount: this.estimateDocumentCount(operationName, args)
            });
            const startTime = Date.now();
            const result = originalMethod(...args);
            // Handle both promise and cursor results
            if (result && typeof result.then === 'function') {
                // Promise-based operation
                return result
                    .then((opResult) => {
                    const duration = Date.now() - startTime;
                    this.completeOperation(span, trace, duration, opResult, null, operationName);
                    return opResult;
                })
                    .catch((error) => {
                    const duration = Date.now() - startTime;
                    this.completeOperation(span, trace, duration, null, error, operationName);
                    throw error;
                });
            }
            else if (result && typeof result.toArray === 'function') {
                // Cursor result - wrap toArray method
                const originalToArray = result.toArray.bind(result);
                result.toArray = () => {
                    return originalToArray()
                        .then((docs) => {
                        const duration = Date.now() - startTime;
                        this.completeOperation(span, trace, duration, docs, null, operationName);
                        return docs;
                    })
                        .catch((error) => {
                        const duration = Date.now() - startTime;
                        this.completeOperation(span, trace, duration, null, error, operationName);
                        throw error;
                    });
                };
                return result;
            }
            else {
                // Synchronous result
                const duration = Date.now() - startTime;
                this.completeOperation(span, trace, duration, result, null, operationName);
                return result;
            }
        };
    }
    /**
     * Complete operation tracing
     */
    completeOperation(span, trace, duration, result, error, operationName) {
        if (span) {
            const metadata = {
                duration,
                documentsProcessed: this.getDocumentCount(result, operationName),
                resultSize: this.estimateResultSize(result)
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
                console.warn(`🐌 Slow MongoDB operation detected (${duration}ms): ${operationName} on ${span.metadata.collection}`);
            }
        }
        if (trace) {
            const status = error ? core_1.TraceStatus.ERROR : core_1.TraceStatus.SUCCESS;
            this.collector.completeTrace(trace.id, status);
        }
    }
    /**
     * Get operation type from method name
     */
    getOperationType(operationName) {
        if (operationName.startsWith('find'))
            return 'FIND';
        if (operationName.startsWith('insert'))
            return 'INSERT';
        if (operationName.startsWith('update'))
            return 'UPDATE';
        if (operationName.startsWith('delete'))
            return 'DELETE';
        if (operationName.startsWith('replace'))
            return 'REPLACE';
        if (operationName === 'aggregate')
            return 'AGGREGATE';
        if (operationName.includes('count'))
            return 'COUNT';
        if (operationName.includes('Index'))
            return 'INDEX';
        return operationName.toUpperCase();
    }
    /**
     * Sanitize query for logging
     */
    sanitizeQuery(query) {
        if (!query)
            return 'null';
        try {
            const sanitized = this.options.logDocuments
                ? JSON.stringify(query)
                : this.maskSensitiveFields(query);
            // Limit size
            const maxSize = this.options.maxDocumentSize || 1024;
            return sanitized.length > maxSize
                ? sanitized.substring(0, maxSize) + '...[truncated]'
                : sanitized;
        }
        catch (e) {
            return '[unable to serialize query]';
        }
    }
    /**
     * Mask sensitive fields in queries
     */
    maskSensitiveFields(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return String(obj);
        }
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
        const masked = { ...obj };
        for (const key in masked) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                masked[key] = '[REDACTED]';
            }
            else if (typeof masked[key] === 'object') {
                masked[key] = JSON.parse(this.maskSensitiveFields(masked[key]));
            }
        }
        return JSON.stringify(masked);
    }
    /**
     * Estimate document count from operation arguments
     */
    estimateDocumentCount(operationName, args) {
        if (operationName === 'insertMany' && Array.isArray(args[0])) {
            return args[0].length;
        }
        if (operationName.includes('insert') || operationName.includes('update') || operationName.includes('delete')) {
            return 1;
        }
        return 0; // Will be determined from result
    }
    /**
     * Get actual document count from result
     */
    getDocumentCount(result, operationName) {
        if (!result)
            return 0;
        if (Array.isArray(result)) {
            return result.length;
        }
        if (result.insertedCount !== undefined)
            return result.insertedCount;
        if (result.modifiedCount !== undefined)
            return result.modifiedCount;
        if (result.deletedCount !== undefined)
            return result.deletedCount;
        if (result.matchedCount !== undefined)
            return result.matchedCount;
        if (result.upsertedCount !== undefined)
            return result.upsertedCount;
        if (operationName.includes('One'))
            return 1;
        return 0;
    }
    /**
     * Estimate result size in bytes
     */
    estimateResultSize(result) {
        if (!result)
            return 0;
        try {
            const serialized = JSON.stringify(result);
            return Buffer.byteLength(serialized, 'utf8');
        }
        catch (e) {
            return 0;
        }
    }
    /**
     * Get the trace collector instance
     */
    getCollector() {
        return this.collector;
    }
}
exports.MongoDBAgent = MongoDBAgent;
/**
 * Instrument a MongoDB client with default settings
 */
function instrumentMongoDB(client, options) {
    const agent = new MongoDBAgent(undefined, options);
    return agent.instrumentClient(client);
}
/**
 * Instrument a MongoDB database with default settings
 */
function instrumentMongoDb(db, options) {
    const agent = new MongoDBAgent(undefined, options);
    return agent.instrumentDb(db);
}
/**
 * Instrument a MongoDB collection with default settings
 */
function instrumentMongoCollection(collection, collectionName, options) {
    const agent = new MongoDBAgent(undefined, options);
    return agent.instrumentCollection(collection, collectionName);
}
/**
 * Create a MongoDB agent instance
 */
function createMongoDBAgent(config, options) {
    return new MongoDBAgent(config, options);
}
// Default export
exports.default = MongoDBAgent;
//# sourceMappingURL=index.js.map