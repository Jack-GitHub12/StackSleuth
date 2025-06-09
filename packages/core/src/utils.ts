import { v4 as uuidv4 } from 'uuid';
import { TimeStamp, TraceId, SpanId } from './types';

/**
 * High-resolution timing utilities
 */
export class Timer {
  private static readonly NS_PER_MS = 1e6;

  static now(): TimeStamp {
    const hrTime = process.hrtime.bigint();
    const nanos = Number(hrTime);
    const millis = Date.now();
    
    return { nanos, millis };
  }

  static diff(start: TimeStamp, end: TimeStamp): number {
    return (end.nanos - start.nanos) / Timer.NS_PER_MS;
  }

  static since(start: TimeStamp): number {
    return Timer.diff(start, Timer.now());
  }
}

/**
 * ID generation utilities
 */
export class IdGenerator {
  static traceId(): TraceId {
    return uuidv4();
  }

  static spanId(): SpanId {
    return uuidv4();
  }

  static shortId(id: string): string {
    return id.substring(0, 8);
  }
}

/**
 * Performance calculation utilities
 */
export class PerformanceUtils {
  static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
      return sorted[index];
    }
    
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  static calculateStats(values: number[]) {
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        count: 0
      };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      min,
      max,
      avg,
      p50: this.calculatePercentile(values, 50),
      p95: this.calculatePercentile(values, 95),
      p99: this.calculatePercentile(values, 99),
      count: values.length
    };
  }

  static formatDuration(milliseconds: number): string {
    if (milliseconds < 1) {
      return `${(milliseconds * 1000).toFixed(2)}μs`;
    } else if (milliseconds < 1000) {
      return `${milliseconds.toFixed(2)}ms`;
    } else {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    }
  }

  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

/**
 * Sampling utilities
 */
export class SamplingUtils {
  static shouldSample(rate: number): boolean {
    return Math.random() < rate;
  }

  static createThrottler(maxPerSecond: number) {
    let tokens = maxPerSecond;
    let lastRefill = Date.now();

    return () => {
      const now = Date.now();
      const elapsed = now - lastRefill;
      
      // Refill tokens based on elapsed time
      if (elapsed >= 1000) {
        tokens = maxPerSecond;
        lastRefill = now;
      }

      if (tokens > 0) {
        tokens--;
        return true;
      }

      return false;
    };
  }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
  static serializeError(error: Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    };
  }

  static isRetryableError(error: Error): boolean {
    // Define which errors should trigger retries
    return error.name === 'NetworkError' ||
           error.name === 'TimeoutError' ||
           error.message.includes('ECONNRESET');
  }
} 