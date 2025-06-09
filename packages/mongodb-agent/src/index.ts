import { TraceCollector, StackSleuthConfig, SpanType, TraceStatus } from '@stacksleuth/core';
import { MongoClient, Db, Collection, Document } from 'mongodb';

interface MongoInstrumentationOptions {
  enableQueryLogging?: boolean;
  slowQueryThreshold?: number; // milliseconds
  logDocuments?: boolean;
  maxDocumentSize?: number; // bytes
}

/**
 * MongoDB agent for performance instrumentation
 */
export class MongoDBAgent {
  private collector: TraceCollector;
  private options: MongoInstrumentationOptions;

  constructor(config?: Partial<StackSleuthConfig>, options?: MongoInstrumentationOptions) {
    this.collector = new TraceCollector(config);
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
  instrumentClient(client: MongoClient): MongoClient {
    const originalDb = client.db.bind(client);
    
    client.db = (...args: any[]) => {
      const db = originalDb(...args);
      return this.instrumentDb(db);
    };

    return client;
  }

  /**
   * Instrument a MongoDB database
   */
  instrumentDb(db: Db): Db {
    const originalCollection = db.collection.bind(db);
    
    db.collection = <TSchema extends Document = Document>(name: string, options?: any) => {
      const collection = originalCollection<TSchema>(name, options);
      return this.instrumentCollection(collection, name);
    };

    return db;
  }

  /**
   * Instrument a MongoDB collection
   */
  instrumentCollection<T extends Document = Document>(collection: Collection<T>, collectionName: string): Collection<T> {
    // List of methods to instrument
    const methodsToInstrument = [
      'find', 'findOne', 'insertOne', 'insertMany',
      'updateOne', 'updateMany', 'deleteOne', 'deleteMany',
      'replaceOne', 'aggregate', 'countDocuments', 'estimatedDocumentCount',
      'findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete',
      'createIndex', 'dropIndex', 'listIndexes'
    ];

    methodsToInstrument.forEach(methodName => {
      const originalMethod = (collection as any)[methodName];
      if (typeof originalMethod === 'function') {
        (collection as any)[methodName] = this.createMethodWrapper(
          originalMethod.bind(collection),
          methodName,
          collectionName
        );
      }
    });

    return collection;
  }

  /**
   * Create a wrapper for MongoDB operations
   */
  private createMethodWrapper(originalMethod: Function, operationName: string, collectionName: string) {
    return (...args: any[]) => {
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

      const span = this.collector.startSpan(
        trace.id,
        `MongoDB ${operationType}`,
        SpanType.DB_QUERY,
        undefined,
        {
          operation: operationName,
          collection: collectionName,
          database: 'mongodb',
          query: this.sanitizeQuery(args[0]),
          documentCount: this.estimateDocumentCount(operationName, args)
        }
      );

      const startTime = Date.now();
      const result = originalMethod(...args);

      // Handle both promise and cursor results
      if (result && typeof result.then === 'function') {
        // Promise-based operation
        return result
          .then((opResult: any) => {
            const duration = Date.now() - startTime;
            this.completeOperation(span, trace, duration, opResult, null, operationName);
            return opResult;
          })
          .catch((error: Error) => {
            const duration = Date.now() - startTime;
            this.completeOperation(span, trace, duration, null, error, operationName);
            throw error;
          });
      } else if (result && typeof result.toArray === 'function') {
        // Cursor result - wrap toArray method
        const originalToArray = result.toArray.bind(result);
        result.toArray = () => {
          return originalToArray()
            .then((docs: any[]) => {
              const duration = Date.now() - startTime;
              this.completeOperation(span, trace, duration, docs, null, operationName);
              return docs;
            })
            .catch((error: Error) => {
              const duration = Date.now() - startTime;
              this.completeOperation(span, trace, duration, null, error, operationName);
              throw error;
            });
        };
        return result;
      } else {
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
  private completeOperation(
    span: any,
    trace: any,
    duration: number,
    result: any,
    error: Error | null,
    operationName: string
  ): void {
    if (span) {
      const metadata = {
        duration,
        documentsProcessed: this.getDocumentCount(result, operationName),
        resultSize: this.estimateResultSize(result)
      };

      if (error) {
        this.collector.addSpanError(span.id, error);
        this.collector.completeSpan(span.id, TraceStatus.ERROR, metadata);
      } else {
        this.collector.completeSpan(span.id, TraceStatus.SUCCESS, metadata);
      }

      // Log slow queries
      if (this.options.enableQueryLogging && duration > (this.options.slowQueryThreshold || 100)) {
        console.warn(`🐌 Slow MongoDB operation detected (${duration}ms): ${operationName} on ${span.metadata.collection}`);
      }
    }

    if (trace) {
      const status = error ? TraceStatus.ERROR : TraceStatus.SUCCESS;
      this.collector.completeTrace(trace.id, status);
    }
  }

  /**
   * Get operation type from method name
   */
  private getOperationType(operationName: string): string {
    if (operationName.startsWith('find')) return 'FIND';
    if (operationName.startsWith('insert')) return 'INSERT';
    if (operationName.startsWith('update')) return 'UPDATE';
    if (operationName.startsWith('delete')) return 'DELETE';
    if (operationName.startsWith('replace')) return 'REPLACE';
    if (operationName === 'aggregate') return 'AGGREGATE';
    if (operationName.includes('count')) return 'COUNT';
    if (operationName.includes('Index')) return 'INDEX';
    return operationName.toUpperCase();
  }

  /**
   * Sanitize query for logging
   */
  private sanitizeQuery(query: any): string {
    if (!query) return 'null';

    try {
      const sanitized = this.options.logDocuments 
        ? JSON.stringify(query)
        : this.maskSensitiveFields(query);
      
      // Limit size
      const maxSize = this.options.maxDocumentSize || 1024;
      return sanitized.length > maxSize 
        ? sanitized.substring(0, maxSize) + '...[truncated]'
        : sanitized;
    } catch (e) {
      return '[unable to serialize query]';
    }
  }

  /**
   * Mask sensitive fields in queries
   */
  private maskSensitiveFields(obj: any): string {
    if (typeof obj !== 'object' || obj === null) {
      return String(obj);
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const masked = { ...obj };

    for (const key in masked) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        masked[key] = '[REDACTED]';
      } else if (typeof masked[key] === 'object') {
        masked[key] = JSON.parse(this.maskSensitiveFields(masked[key]));
      }
    }

    return JSON.stringify(masked);
  }

  /**
   * Estimate document count from operation arguments
   */
  private estimateDocumentCount(operationName: string, args: any[]): number {
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
  private getDocumentCount(result: any, operationName: string): number {
    if (!result) return 0;

    if (Array.isArray(result)) {
      return result.length;
    }

    if (result.insertedCount !== undefined) return result.insertedCount;
    if (result.modifiedCount !== undefined) return result.modifiedCount;
    if (result.deletedCount !== undefined) return result.deletedCount;
    if (result.matchedCount !== undefined) return result.matchedCount;
    if (result.upsertedCount !== undefined) return result.upsertedCount;

    if (operationName.includes('One')) return 1;
    
    return 0;
  }

  /**
   * Estimate result size in bytes
   */
  private estimateResultSize(result: any): number {
    if (!result) return 0;

    try {
      const serialized = JSON.stringify(result);
      return Buffer.byteLength(serialized, 'utf8');
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get the trace collector instance
   */
  getCollector(): TraceCollector {
    return this.collector;
  }
}

/**
 * Instrument a MongoDB client with default settings
 */
export function instrumentMongoDB(
  client: MongoClient,
  options?: MongoInstrumentationOptions
): MongoClient {
  const agent = new MongoDBAgent(undefined, options);
  return agent.instrumentClient(client);
}

/**
 * Instrument a MongoDB database with default settings
 */
export function instrumentMongoDb(
  db: Db,
  options?: MongoInstrumentationOptions
): Db {
  const agent = new MongoDBAgent(undefined, options);
  return agent.instrumentDb(db);
}

/**
 * Instrument a MongoDB collection with default settings
 */
export function instrumentMongoCollection<T extends Document = Document>(
  collection: Collection<T>,
  collectionName: string,
  options?: MongoInstrumentationOptions
): Collection<T> {
  const agent = new MongoDBAgent(undefined, options);
  return agent.instrumentCollection(collection, collectionName);
}

/**
 * Create a MongoDB agent instance
 */
export function createMongoDBAgent(
  config?: Partial<StackSleuthConfig>,
  options?: MongoInstrumentationOptions
): MongoDBAgent {
  return new MongoDBAgent(config, options);
}

// Default export
export default MongoDBAgent; 