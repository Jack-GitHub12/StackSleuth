import { TraceCollector, StackSleuthConfig } from '@stacksleuth/core';
import { MongoClient, Db, Collection, Document } from 'mongodb';
interface MongoInstrumentationOptions {
    enableQueryLogging?: boolean;
    slowQueryThreshold?: number;
    logDocuments?: boolean;
    maxDocumentSize?: number;
}
/**
 * MongoDB agent for performance instrumentation
 */
export declare class MongoDBAgent {
    private collector;
    private options;
    constructor(config?: Partial<StackSleuthConfig>, options?: MongoInstrumentationOptions);
    /**
     * Instrument a MongoDB client
     */
    instrumentClient(client: MongoClient): MongoClient;
    /**
     * Instrument a MongoDB database
     */
    instrumentDb(db: Db): Db;
    /**
     * Instrument a MongoDB collection
     */
    instrumentCollection<T extends Document = Document>(collection: Collection<T>, collectionName: string): Collection<T>;
    /**
     * Create a wrapper for MongoDB operations
     */
    private createMethodWrapper;
    /**
     * Complete operation tracing
     */
    private completeOperation;
    /**
     * Get operation type from method name
     */
    private getOperationType;
    /**
     * Sanitize query for logging
     */
    private sanitizeQuery;
    /**
     * Mask sensitive fields in queries
     */
    private maskSensitiveFields;
    /**
     * Estimate document count from operation arguments
     */
    private estimateDocumentCount;
    /**
     * Get actual document count from result
     */
    private getDocumentCount;
    /**
     * Estimate result size in bytes
     */
    private estimateResultSize;
    /**
     * Get the trace collector instance
     */
    getCollector(): TraceCollector;
}
/**
 * Instrument a MongoDB client with default settings
 */
export declare function instrumentMongoDB(client: MongoClient, options?: MongoInstrumentationOptions): MongoClient;
/**
 * Instrument a MongoDB database with default settings
 */
export declare function instrumentMongoDb(db: Db, options?: MongoInstrumentationOptions): Db;
/**
 * Instrument a MongoDB collection with default settings
 */
export declare function instrumentMongoCollection<T extends Document = Document>(collection: Collection<T>, collectionName: string, options?: MongoInstrumentationOptions): Collection<T>;
/**
 * Create a MongoDB agent instance
 */
export declare function createMongoDBAgent(config?: Partial<StackSleuthConfig>, options?: MongoInstrumentationOptions): MongoDBAgent;
export default MongoDBAgent;
//# sourceMappingURL=index.d.ts.map