import EventEmitter from 'events';
import { 
  Trace, 
  Span, 
  TraceId, 
  SpanId, 
  StackSleuthConfig, 
  TraceStatus, 
  PerformanceIssue 
} from './types';
import { Timer, IdGenerator, SamplingUtils, PerformanceUtils } from './utils';

export interface TraceCollectorEvents {
  'trace:started': (trace: Trace) => void;
  'trace:completed': (trace: Trace) => void;
  'span:started': (span: Span) => void;
  'span:completed': (span: Span) => void;
  'performance:issue': (issue: PerformanceIssue) => void;
}

export class TraceCollector extends EventEmitter {
  private traces = new Map<TraceId, Trace>();
  private activeSpans = new Map<SpanId, Span>();
  private config: StackSleuthConfig;
  private shouldSample: () => boolean;
  private samplingThrottle?: () => boolean;

  constructor(config: Partial<StackSleuthConfig> = {}) {
    super();
    
    this.config = {
      enabled: true,
      sampling: { rate: 1.0 },
      filters: {},
      output: { console: true },
      ...config
    };

    this.shouldSample = () => SamplingUtils.shouldSample(this.config.sampling.rate);
    
    if (this.config.sampling.maxTracesPerSecond) {
      this.samplingThrottle = SamplingUtils.createThrottler(
        this.config.sampling.maxTracesPerSecond
      );
    }
  }

  /**
   * Start a new trace
   */
  startTrace(name: string, metadata: Record<string, any> = {}): Trace | null {
    if (!this.config.enabled || !this.shouldSample()) {
      return null;
    }

    if (this.samplingThrottle && !this.samplingThrottle()) {
      return null;
    }

    const traceId = IdGenerator.traceId();
    const rootSpanId = IdGenerator.spanId();
    const timing = { start: Timer.now() };

    const trace: Trace = {
      id: traceId,
      name,
      timing,
      status: TraceStatus.PENDING,
      spans: [],
      metadata,
      rootSpanId
    };

    this.traces.set(traceId, trace);
    this.emit('trace:started', trace);

    return trace;
  }

  /**
   * Complete a trace
   */
  completeTrace(traceId: TraceId, status: TraceStatus = TraceStatus.SUCCESS): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.timing.end = Timer.now();
    trace.timing.duration = Timer.diff(trace.timing.start, trace.timing.end);
    trace.status = status;

    // Filter by minimum duration if configured
    if (this.config.filters.minDuration && 
        trace.timing.duration < this.config.filters.minDuration) {
      this.traces.delete(traceId);
      return;
    }

    this.emit('trace:completed', trace);
    this.analyzeTrace(trace);
  }

  /**
   * Start a new span within a trace
   */
  startSpan(
    traceId: TraceId,
    name: string,
    type: string,
    parentId?: SpanId,
    metadata: Record<string, any> = {}
  ): Span | null {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    const spanId = IdGenerator.spanId();
    const span: Span = {
      id: spanId,
      traceId,
      parentId,
      name,
      type: type as any,
      timing: { start: Timer.now() },
      status: TraceStatus.PENDING,
      metadata,
      tags: []
    };

    this.activeSpans.set(spanId, span);
    trace.spans.push(span);
    this.emit('span:started', span);

    return span;
  }

  /**
   * Complete a span
   */
  completeSpan(
    spanId: SpanId, 
    status: TraceStatus = TraceStatus.SUCCESS,
    metadata: Record<string, any> = {}
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.timing.end = Timer.now();
    span.timing.duration = Timer.diff(span.timing.start, span.timing.end);
    span.status = status;
    span.metadata = { ...span.metadata, ...metadata };

    this.activeSpans.delete(spanId);
    this.emit('span:completed', span);
  }

  /**
   * Add an error to a span
   */
  addSpanError(spanId: SpanId, error: Error): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    if (!span.errors) span.errors = [];
    span.errors.push(error);
    span.status = TraceStatus.ERROR;
  }

  /**
   * Get a trace by ID
   */
  getTrace(traceId: TraceId): Trace | undefined {
    return this.traces.get(traceId);
  }

  /**
   * Get all traces
   */
  getAllTraces(): Trace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Get traces within a time range
   */
  getTracesByTimeRange(startTime: number, endTime: number): Trace[] {
    return this.getAllTraces().filter(trace => 
      trace.timing.start.millis >= startTime && 
      trace.timing.start.millis <= endTime
    );
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const traces = this.getAllTraces();
    const durations = traces
      .filter(t => t.timing.duration !== undefined)
      .map(t => t.timing.duration!);

    const spanDurations = traces
      .flatMap(t => t.spans)
      .filter(s => s.timing.duration !== undefined)
      .map(s => s.timing.duration!);

    return {
      traces: {
        total: traces.length,
        ...PerformanceUtils.calculateStats(durations)
      },
      spans: {
        total: spanDurations.length,
        ...PerformanceUtils.calculateStats(spanDurations)
      }
    };
  }

  /**
   * Clear old traces to prevent memory leaks
   */
  cleanup(maxAge: number = 300000): void { // 5 minutes default
    const cutoff = Date.now() - maxAge;
    
    for (const [traceId, trace] of this.traces.entries()) {
      if (trace.timing.start.millis < cutoff) {
        this.traces.delete(traceId);
      }
    }
  }

  /**
   * Analyze a trace for performance issues
   */
  private analyzeTrace(trace: Trace): void {
    const issues: PerformanceIssue[] = [];

    // Detect slow operations
    if (trace.timing.duration && trace.timing.duration > 1000) {
      issues.push({
        id: IdGenerator.spanId(),
        severity: 'high',
        type: 'slow_query',
        message: `Trace "${trace.name}" took ${PerformanceUtils.formatDuration(trace.timing.duration)}`,
        suggestion: 'Consider optimizing the slowest spans in this trace',
        spanIds: trace.spans.map(s => s.id),
        traceId: trace.id
      });
    }

    // Detect N+1 queries
    const dbSpans = trace.spans.filter(s => s.type === 'db_query');
    if (dbSpans.length > 10) {
      issues.push({
        id: IdGenerator.spanId(),
        severity: 'medium',
        type: 'n_plus_one',
        message: `Potential N+1 query pattern detected (${dbSpans.length} database queries)`,
        suggestion: 'Consider using batch queries or eager loading',
        spanIds: dbSpans.map(s => s.id),
        traceId: trace.id
      });
    }

    // Emit performance issues
    issues.forEach(issue => this.emit('performance:issue', issue));
  }

  /**
   * Export traces in various formats
   */
  export(format: 'json' | 'csv' = 'json'): string {
    const traces = this.getAllTraces();
    
    if (format === 'json') {
      return JSON.stringify(traces, null, 2);
    }
    
    // Simple CSV export
    const headers = ['traceId', 'name', 'duration', 'status', 'spanCount'];
    const rows = traces.map(trace => [
      trace.id,
      trace.name,
      trace.timing.duration || 0,
      trace.status,
      trace.spans.length
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
} 