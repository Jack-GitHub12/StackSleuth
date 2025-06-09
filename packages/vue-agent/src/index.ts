import { App, Plugin, inject, InjectionKey, ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { TraceCollector, StackSleuthConfig, SpanType, TraceStatus, WebVital } from '@stacksleuth/core';

// Global collector instance
let globalCollector: TraceCollector | null = null;

// Injection key for Vue's provide/inject
const StackSleuthKey: InjectionKey<TraceCollector> = Symbol('StackSleuth');

/**
 * Vue 3 plugin for StackSleuth
 */
export const StackSleuthPlugin: Plugin = {
  install(app: App, options: Partial<StackSleuthConfig> = {}) {
    // Create collector instance
    if (!globalCollector) {
      globalCollector = new TraceCollector({
        enabled: true,
        sampling: { rate: 1.0 },
        output: { console: true },
        ...options
      });
    }

    // Provide collector to all components
    app.provide(StackSleuthKey, globalCollector);

    // Set up global performance monitoring
    if (typeof window !== 'undefined') {
      setupWebVitals(globalCollector);
      setupResourceTracking(globalCollector);
      setupVueDevtools(globalCollector);
    }

    // Add global properties
    app.config.globalProperties.$stacksleuth = globalCollector;

    // Hook into Vue's component lifecycle for automatic tracing
    app.mixin({
      beforeCreate() {
        const instance = getCurrentInstance();
        if (instance && globalCollector) {
          const componentName = instance.type.name || instance.type.__name || 'AnonymousComponent';
          
          // Start component trace
          const trace = globalCollector.startTrace(`Vue Component: ${componentName}`);
          if (trace) {
            const span = globalCollector.startSpan(
              trace.id,
              `Render ${componentName}`,
              SpanType.REACT_RENDER, // Using REACT_RENDER for consistency
              undefined,
              {
                componentName,
                framework: 'vue'
              }
            );

            // Store trace info in component instance
            (instance as any).__stacksleuth = { trace, span };
          }
        }
      },

      mounted() {
        const instance = getCurrentInstance();
        if (instance && (instance as any).__stacksleuth && globalCollector) {
          const { trace, span } = (instance as any).__stacksleuth;
          
          // Complete the render span
          if (span) globalCollector.completeSpan(span.id, TraceStatus.SUCCESS);
          if (trace) globalCollector.completeTrace(trace.id, TraceStatus.SUCCESS);
        }
      },

      beforeUnmount() {
        const instance = getCurrentInstance();
        if (instance && (instance as any).__stacksleuth && globalCollector) {
          const { trace } = (instance as any).__stacksleuth;
          
          // Track component unmount
          if (trace) {
            const unmountSpan = globalCollector.startSpan(
              trace.id,
              `Unmount ${instance.type.name || 'Component'}`,
              SpanType.CUSTOM
            );
            if (unmountSpan) {
              globalCollector.completeSpan(unmountSpan.id, TraceStatus.SUCCESS);
            }
          }
        }
      }
    });
  }
};

/**
 * Composable for using StackSleuth in Vue components
 */
export function useStackSleuth() {
  const collector = inject(StackSleuthKey);
  
  if (!collector) {
    throw new Error('StackSleuth plugin not installed. Use app.use(StackSleuthPlugin)');
  }

  /**
   * Trace an async operation
   */
  const trace = async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
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
  };

  /**
   * Create a traced ref that monitors changes
   */
  const tracedRef = <T>(initialValue: T, name?: string) => {
    const reactiveRef = ref(initialValue);
    const refName = name || 'reactive-value';

    // Track ref changes
    const originalValue = reactiveRef.value;
    let changeCount = 0;

    // Override the ref's setter to trace changes
    const proxy = new Proxy(reactiveRef, {
      set(target, property, value) {
        if (property === 'value' && value !== target.value) {
          changeCount++;
          
          const trace = collector.startTrace(`Ref Change: ${refName}`);
          if (trace) {
            const span = collector.startSpan(
              trace.id,
              `Update ${refName}`,
              SpanType.CUSTOM,
              undefined,
              {
                refName,
                changeCount,
                oldValue: typeof target.value,
                newValue: typeof value
              }
            );

            // Complete immediately since ref updates are synchronous
            if (span) collector.completeSpan(span.id, TraceStatus.SUCCESS);
            collector.completeTrace(trace.id, TraceStatus.SUCCESS);
          }
        }
        
        return Reflect.set(target, property, value);
      }
    });

    return proxy;
  };

  /**
   * Trace component lifecycle events
   */
  const traceLifecycle = (eventName: string) => {
    const instance = getCurrentInstance();
    const componentName = instance?.type.name || 'Component';
    
    const trace = collector.startTrace(`${componentName}: ${eventName}`);
    if (trace) {
      const span = collector.startSpan(
        trace.id,
        `${eventName} Hook`,
        SpanType.CUSTOM,
        undefined,
        { componentName, lifecycle: eventName }
      );

      if (span) collector.completeSpan(span.id, TraceStatus.SUCCESS);
      collector.completeTrace(trace.id, TraceStatus.SUCCESS);
    }
  };

  return {
    collector,
    trace,
    tracedRef,
    traceLifecycle
  };
}

/**
 * Set up Web Vitals monitoring
 */
function setupWebVitals(collector: TraceCollector) {
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
    timestamp: Date.now(),
    framework: 'vue'
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
            size: entry.transferSize,
            framework: 'vue'
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
 * Set up Vue DevTools integration
 */
function setupVueDevtools(collector: TraceCollector) {
  // Hook into Vue DevTools if available
  if (typeof window !== 'undefined' && (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
    const devtools = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    
    devtools.on('component:updated', (component: any) => {
      const trace = collector.startTrace(`DevTools: Component Updated`);
      if (trace) {
        const span = collector.startSpan(
          trace.id,
          `Update ${component.name || 'Component'}`,
          SpanType.CUSTOM,
          undefined,
          {
            componentName: component.name,
            framework: 'vue',
            source: 'devtools'
          }
        );

        if (span) collector.completeSpan(span.id, TraceStatus.SUCCESS);
        collector.completeTrace(trace.id, TraceStatus.SUCCESS);
      }
    });
  }
}

/**
 * Get the global collector instance
 */
export function getCollector(): TraceCollector | null {
  return globalCollector;
}

// Default export
export default StackSleuthPlugin; 