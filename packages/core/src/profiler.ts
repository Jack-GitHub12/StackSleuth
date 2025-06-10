import { TraceCollector } from './collector';
import { StackSleuthConfig, Trace, Span, TraceStatus } from './types';

export interface PerformanceMetrics {
  timestamp: number;
  duration?: number;
  memory?: number;
  cpu?: number;
  [key: string]: any;
}

export class ProfilerCore {
  private collector: TraceCollector;
  private isActive: boolean = false;
  private config: any;

  constructor(config: any = {}) {
    this.config = config;
    
    // Convert any config to StackSleuthConfig format
    const stackSleuthConfig: Partial<StackSleuthConfig> = {
      enabled: config.enabled ?? true,
      sampling: config.sampling ?? { rate: config.sampleRate ?? 1.0 },
      filters: config.filters ?? {},
      output: config.output ?? { console: true }
    };
    
    this.collector = new TraceCollector(stackSleuthConfig);
  }

  /**
   * Initialize the profiler
   */
  public async init(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    
    // Set up event listeners for debugging
    this.collector.on('trace:completed', (trace: Trace) => {
      if (this.config.output?.console) {
        console.log(`[StackSleuth] Trace completed: ${trace.name} (${trace.timing.duration}ms)`);
      }
    });

    this.collector.on('performance:issue', (issue) => {
      if (this.config.output?.console) {
        console.warn(`[StackSleuth] Performance issue: ${issue.message}`);
      }
    });

    console.log('✅ StackSleuth ProfilerCore initialized');
  }

  /**
   * Start a new trace
   */
  public startTrace(name: string, metadata?: Record<string, any>): string | null {
    if (!this.isActive) return null;
    
    const trace = this.collector.startTrace(name, metadata);
    return trace ? trace.id : null;
  }

  /**
   * Complete a trace
   */
  public completeTrace(traceId: string, status: TraceStatus = TraceStatus.SUCCESS): void {
    this.collector.completeTrace(traceId, status);
  }

  /**
   * Start a span within a trace
   */
  public startSpan(
    traceId: string,
    name: string,
    type: string,
    parentId?: string,
    metadata?: Record<string, any>
  ): string | null {
    const span = this.collector.startSpan(traceId, name, type, parentId, metadata);
    return span ? span.id : null;
  }

  /**
   * Complete a span
   */
  public completeSpan(spanId: string, status: TraceStatus = TraceStatus.SUCCESS, metadata?: Record<string, any>): void {
    this.collector.completeSpan(spanId, status, metadata);
  }

  /**
   * Record a simple metric
   */
  public recordMetric(name: string, metrics: PerformanceMetrics): void {
    if (!this.isActive) return;

    // Create a simple trace for the metric
    const trace = this.collector.startTrace(name, metrics);
    if (trace) {
      // Complete immediately with the metric data
      setTimeout(() => {
        this.collector.completeTrace(trace.id, TraceStatus.SUCCESS);
      }, 0);
    }
  }

  /**
   * Record an error
   */
  public recordError(error: Error, context?: Record<string, any>): void {
    if (!this.isActive) return;

    const trace = this.collector.startTrace('error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    });

    if (trace) {
      setTimeout(() => {
        this.collector.completeTrace(trace.id, TraceStatus.ERROR);
      }, 0);
    }
  }

  /**
   * Get performance statistics
   */
  public getStats(): any {
    return this.collector.getStats();
  }

  /**
   * Get all traces
   */
  public getTraces(): Trace[] {
    return this.collector.getAllTraces();
  }

  /**
   * Export data
   */
  public export(format: 'json' | 'csv' = 'json'): string {
    return this.collector.export(format);
  }

  /**
   * Stop the profiler and cleanup
   */
  public async stop(): Promise<void> {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.collector.cleanup();
    
    console.log('🛑 StackSleuth ProfilerCore stopped');
  }

  /**
   * Check if profiler is active
   */
  public get active(): boolean {
    return this.isActive;
  }
} 