import { TraceCollector, StackSleuthConfig, SpanType, TraceStatus } from '@stacksleuth/core';
import express from 'express';
import { Request, Response, NextFunction } from 'express';

export class BackendAgent {
  private collector: TraceCollector;

  constructor(config?: Partial<StackSleuthConfig>) {
    this.collector = new TraceCollector(config);
  }

  /**
   * Instrument an Express application
   */
  instrument(app: express.Application): void {
    // Middleware to trace all HTTP requests
    app.use((req: Request, res: Response, next: NextFunction) => {
      const trace = this.collector.startTrace(`${req.method} ${req.path}`, {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      if (!trace) {
        return next();
      }

      const span = this.collector.startSpan(
        trace.id,
        `HTTP ${req.method} ${req.path}`,
        SpanType.HTTP_REQUEST,
        undefined,
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent')
        }
      );

      // Store trace context in request
      (req as any).stacksleuthTrace = trace;
      (req as any).stacksleuthSpan = span;

      // Ensure correct `this` binding inside res.send override
      const self = this;

      // Hook into response to complete the trace
      const originalSend = res.send;
      res.send = function(body: any) {
        if (span) {
          const status = res.statusCode >= 400 ? TraceStatus.ERROR : TraceStatus.SUCCESS;
          self.collector.completeSpan(span.id, status, {
            statusCode: res.statusCode,
            contentLength: Buffer.byteLength(body || '')
          });
        }

        self.collector.completeTrace(trace.id, res.statusCode >= 400 ? TraceStatus.ERROR : TraceStatus.SUCCESS);
        return originalSend.call(this, body);
      };

      next();
    });
  }

  /**
   * Manually trace a function or operation
   */
  async trace<T>(name: string, operation: () => Promise<T>): Promise<T> {
    // Get current trace from context if available
    const activeTrace = this.collector.getAllTraces().find(t => t.status === TraceStatus.PENDING);
    
    if (!activeTrace) {
      // Create a new trace if none exists
      const trace = this.collector.startTrace(name);
      if (!trace) return operation();

      const span = this.collector.startSpan(trace.id, name, SpanType.FUNCTION_CALL);
      
      try {
        const result = await operation();
        if (span) this.collector.completeSpan(span.id, TraceStatus.SUCCESS);
        this.collector.completeTrace(trace.id, TraceStatus.SUCCESS);
        return result;
      } catch (error) {
        if (span) {
          this.collector.addSpanError(span.id, error as Error);
          this.collector.completeSpan(span.id, TraceStatus.ERROR);
        }
        this.collector.completeTrace(trace.id, TraceStatus.ERROR);
        throw error;
      }
    } else {
      // Add span to existing trace
      const span = this.collector.startSpan(activeTrace.id, name, SpanType.FUNCTION_CALL);
      
      try {
        const result = await operation();
        if (span) this.collector.completeSpan(span.id, TraceStatus.SUCCESS);
        return result;
      } catch (error) {
        if (span) {
          this.collector.addSpanError(span.id, error as Error);
          this.collector.completeSpan(span.id, TraceStatus.ERROR);
        }
        throw error;
      }
    }
  }

  /**
   * Create a traced handler wrapper for route handlers
   */
  traceHandler<T extends any[], R>(handler: (...args: T) => Promise<R>) {
    return async (...args: T): Promise<R> => {
      const req = args[0] as Request;
      const trace = (req as any).stacksleuthTrace;
      
      if (!trace) {
        return handler(...args);
      }

      const span = this.collector.startSpan(
        trace.id,
        `Handler ${req.method} ${req.path}`,
        SpanType.FUNCTION_CALL
      );

      try {
        const result = await handler(...args);
        if (span) this.collector.completeSpan(span.id, TraceStatus.SUCCESS);
        return result;
      } catch (error) {
        if (span) {
          this.collector.addSpanError(span.id, error as Error);
          this.collector.completeSpan(span.id, TraceStatus.ERROR);
        }
        throw error;
      }
    };
  }

  /**
   * Get the trace collector instance
   */
  getCollector(): TraceCollector {
    return this.collector;
  }
}

/**
 * Factory function to create a backend agent
 */
export function createBackendAgent(config?: Partial<StackSleuthConfig>): BackendAgent {
  return new BackendAgent(config);
}

// Default export
export default BackendAgent; 