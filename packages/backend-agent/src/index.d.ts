import { TraceCollector, StackSleuthConfig } from '@stacksleuth/core';
import express from 'express';
export declare class BackendAgent {
    private collector;
    constructor(config?: Partial<StackSleuthConfig>);
    /**
     * Instrument an Express application
     */
    instrument(app: express.Application): void;
    /**
     * Manually trace a function or operation
     */
    trace<T>(name: string, operation: () => Promise<T>): Promise<T>;
    /**
     * Create a traced handler wrapper for route handlers
     */
    traceHandler<T extends any[], R>(handler: (...args: T) => Promise<R>): (...args: T) => Promise<R>;
    /**
     * Get the trace collector instance
     */
    getCollector(): TraceCollector;
}
/**
 * Factory function to create a backend agent
 */
export declare function createBackendAgent(config?: Partial<StackSleuthConfig>): BackendAgent;
export default BackendAgent;
//# sourceMappingURL=index.d.ts.map