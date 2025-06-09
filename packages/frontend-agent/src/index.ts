import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TraceCollector, StackSleuthConfig, SpanType, TraceStatus, WebVital } from '@stacksleuth/core';

// Global collector instance
let globalCollector: TraceCollector | null = null;

// Context for React integration
const StackSleuthContext = createContext<TraceCollector | null>(null);

interface StackSleuthProviderProps {
  children: ReactNode;
  config?: Partial<StackSleuthConfig>;
}

/**
 * Provider component that wraps your React app
 */
export function StackSleuthProvider({ children, config }: StackSleuthProviderProps) {
  const [collector] = useState(() => {
    if (!globalCollector) {
      globalCollector = new TraceCollector({
        enabled: true,
        sampling: { rate: 1.0 },
        output: { console: true },
        ...config
      });
    }
    return globalCollector;
  });

  useEffect(() => {
    // Set up Web Vitals monitoring
    setupWebVitals(collector);
    
    // Set up component render tracking
    setupComponentTracking(collector);
    
    // Set up resource loading tracking
    setupResourceTracking(collector);

    return () => {
      // Cleanup if needed
    };
  }, [collector]);

  return React.createElement(
    StackSleuthContext.Provider,
    { value: collector },
    children
  );
}

/**
 * Hook to access the trace collector
 */
export function useTrace() {
  const collector = useContext(StackSleuthContext);
  
  if (!collector) {
    throw new Error('useTrace must be used within a StackSleuthProvider');
  }

  return {
    /**
     * Manually trace an operation
     */
    trace: async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
      const trace = collector.startTrace(name);
      if (!trace) return operation();

      const span = collector.startSpan(trace.id, name, SpanType.FUNCTION_CALL);

      try {
        const result = await operation();
        if (span) collector.completeSpan(span.id, TraceStatus.SUCCESS);
        collector.completeTrace(trace.id, TraceStatus.SUCCESS);
        return result;
      } catch (error) {
        if (span) {
          collector.addSpanError(span.id, error as Error);
          collector.completeSpan(span.id, TraceStatus.ERROR);
        }
        collector.completeTrace(trace.id, TraceStatus.ERROR);
        throw error;
      }
    },

    /**
     * Get the collector instance
     */
    collector
  };
}

/**
 * Higher-order component to automatically trace component renders
 */
export function withTracing<P extends object>(
  Component: React.ComponentType<P>,
  options?: { name?: string }
) {
  const displayName = options?.name || Component.displayName || Component.name || 'Component';
  
  const TracedComponent = React.forwardRef<any, P>((props, ref) => {
    const collector = useContext(StackSleuthContext);
    
    useEffect(() => {
      if (!collector) return;

      const trace = collector.startTrace(`Render ${displayName}`);
      if (!trace) return;

      const span = collector.startSpan(
        trace.id,
        `React Render: ${displayName}`,
        SpanType.REACT_RENDER,
        undefined,
        {
          componentName: displayName,
          props: Object.keys(props as object).length
        }
      );

      // Complete the span after render
      Promise.resolve().then(() => {
        if (span) collector.completeSpan(span.id, TraceStatus.SUCCESS);
        collector.completeTrace(trace.id, TraceStatus.SUCCESS);
      });
    });

    return React.createElement(Component, { ...props, ref } as any);
  });

  TracedComponent.displayName = `withTracing(${displayName})`;
  return TracedComponent;
}

/**
 * Set up Web Vitals monitoring
 */
function setupWebVitals(collector: TraceCollector) {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals using the browser's Performance API
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      if (lastEntry) {
        trackWebVital(collector, 'LCP', lastEntry.startTime);
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        trackWebVital(collector, 'FID', entry.processingStart - entry.startTime);
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }

    // Report CLS when the page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        trackWebVital(collector, 'CLS', clsValue);
      }
    });
  }

  // Track page load time
  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    trackWebVital(collector, 'TTFB', performance.timing.responseStart - performance.timing.requestStart);
    trackWebVital(collector, 'FCP', loadTime);
  });
}

/**
 * Track a Web Vital metric
 */
function trackWebVital(collector: TraceCollector, name: WebVital['name'], value: number) {
  const trace = collector.startTrace(`Web Vital: ${name}`, {
    metricName: name,
    value,
    timestamp: Date.now()
  });

  if (trace) {
    const span = collector.startSpan(
      trace.id,
      `${name} Measurement`,
      SpanType.CUSTOM,
      undefined,
      { value, unit: name === 'CLS' ? 'score' : 'ms' }
    );

    if (span) collector.completeSpan(span.id, TraceStatus.SUCCESS);
    collector.completeTrace(trace.id, TraceStatus.SUCCESS);
  }
}

/**
 * Set up component render tracking
 */
function setupComponentTracking(collector: TraceCollector) {
  // This would require React DevTools integration or custom instrumentation
  // For now, we'll rely on the withTracing HOC and useTrace hook
}

/**
 * Set up resource loading tracking
 */
function setupResourceTracking(collector: TraceCollector) {
  if (typeof window === 'undefined') return;

  // Track resource loading
  if ('PerformanceObserver' in window) {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (entry.entryType === 'resource' && entry.duration > 10) {
          const trace = collector.startTrace(`Resource: ${entry.name}`, {
            url: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize
          });

          if (trace) {
            const span = collector.startSpan(
              trace.id,
              `Load ${entry.initiatorType}: ${entry.name.split('/').pop()}`,
              SpanType.CUSTOM,
              undefined,
              {
                duration: entry.duration,
                size: entry.transferSize,
                type: entry.initiatorType
              }
            );

            if (span) collector.completeSpan(span.id, TraceStatus.SUCCESS);
            collector.completeTrace(trace.id, TraceStatus.SUCCESS);
          }
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Resource timing not supported
    }
  }
}

/**
 * Get the global collector instance
 */
export function getCollector(): TraceCollector | null {
  return globalCollector;
}

// Default export
export default StackSleuthProvider; 