import { ProfilerCore } from '@stacksleuth/core';

export interface SessionEvent {
  id: string;
  type: 'dom_mutation' | 'user_interaction' | 'network_request' | 'console_log' | 'error' | 'performance';
  timestamp: number;
  data: any;
}

export interface UserInteractionEvent {
  type: 'click' | 'scroll' | 'input' | 'focus' | 'blur' | 'keypress' | 'resize';
  target: string;
  value?: string;
  coordinates?: { x: number; y: number };
  scrollPosition?: { x: number; y: number };
  viewport?: { width: number; height: number };
}

export interface DOMEvent {
  type: 'added' | 'removed' | 'attributes' | 'characterData';
  target: string;
  attributes?: { [key: string]: string };
  textContent?: string;
  nodeName?: string;
}

export interface NetworkEvent {
  url: string;
  method: string;
  status?: number;
  duration: number;
  requestSize: number;
  responseSize: number;
  headers?: { [key: string]: string };
  error?: string;
}

export interface PerformanceEvent {
  metric: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'custom';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

export interface SessionMetadata {
  sessionId: string;
  userId?: string;
  userAgent: string;
  url: string;
  referrer: string;
  viewport: { width: number; height: number };
  startTime: number;
  endTime?: number;
  duration?: number;
  eventCount: number;
  errorCount: number;
}

export class SessionReplayAgent {
  private profiler: ProfilerCore;
  private isActive: boolean = false;
  private sessionId: string;
  private events: SessionEvent[] = [];
  private metadata: SessionMetadata;
  private observers: { [key: string]: any } = {};
  private originalMethods: Map<string, any> = new Map();
  private eventBuffer: SessionEvent[] = [];
  private flushInterval?: NodeJS.Timeout;
  private maxEvents: number = 10000;
  private maxBufferSize: number = 100;

  constructor(config?: {
    endpoint?: string;
    apiKey?: string;
    maxEvents?: number;
    maxBufferSize?: number;
    bufferSize?: number;
    autoFlush?: boolean;
    flushInterval?: number;
    enableUserInteractions?: boolean;
    enableDOMTracking?: boolean;
    enableNetworkTracking?: boolean;
    enablePerformanceTracking?: boolean;
    enableConsoleTracking?: boolean;
    enablePrivacyMode?: boolean;
  }) {
    this.profiler = new ProfilerCore(config);
    this.sessionId = this.generateSessionId();
    this.maxEvents = config?.maxEvents || 10000;
    this.maxBufferSize = config?.maxBufferSize || 100;

    this.metadata = {
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      url: typeof window !== 'undefined' && window.location ? window.location.href : 'N/A',
      referrer: typeof document !== 'undefined' ? document.referrer : 'N/A',
      viewport: this.getViewportSize(),
      startTime: Date.now(),
      eventCount: 0,
      errorCount: 0
    };

    // Auto-flush if enabled
    if (config?.autoFlush !== false) {
      this.flushInterval = setInterval(() => {
        this.flush();
      }, config?.flushInterval || 5000);
    }
  }

  /**
   * Initialize the session replay agent
   */
  public async init(): Promise<void> {
    if (this.isActive || typeof window === 'undefined') return;

    this.isActive = true;
    await this.profiler.init();

    // Setup tracking
    this.setupUserInteractionTracking();
    this.setupDOMTracking();
    this.setupNetworkTracking();
    this.setupPerformanceTracking();
    this.setupConsoleTracking();
    this.setupErrorTracking();

    // Record initial page state
    this.recordEvent({
      type: 'performance',
      data: {
        type: 'session_start',
        metadata: this.metadata
      }
    });

    console.log('✅ Session Replay Agent initialized');
  }

  /**
   * Setup user interaction tracking
   */
  private setupUserInteractionTracking(): void {
    const events = ['click', 'scroll', 'input', 'focus', 'blur', 'keypress', 'resize'];

    events.forEach(eventType => {
      const handler = (event: Event) => {
        this.recordUserInteraction(eventType as any, event);
      };

      document.addEventListener(eventType, handler, { passive: true, capture: true });
      this.observers[eventType] = handler;
    });

    // Special handling for scroll with throttling
    let scrollTimeout: NodeJS.Timeout;
    const scrollHandler = (event: Event) => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.recordUserInteraction('scroll', event);
      }, 100);
    };

    document.addEventListener('scroll', scrollHandler, { passive: true });
    this.observers['scroll_throttled'] = scrollHandler;
  }

  /**
   * Setup DOM mutation tracking
   */
  private setupDOMTracking(): void {
    if (!window.MutationObserver) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        this.recordDOMChange(mutation);
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true
    });

    this.observers['mutation'] = observer;
  }

  /**
   * Setup network request tracking
   */
  private setupNetworkTracking(): void {
    // Intercept fetch
    const originalFetch = window.fetch;
    this.originalMethods.set('fetch', originalFetch);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';

      try {
        const response = await originalFetch(input, init);
        
        this.recordNetworkRequest({
          url,
          method,
          status: response.status,
          duration: Date.now() - startTime,
          requestSize: this.estimateRequestSize(init),
          responseSize: this.estimateResponseSize(response)
        });

        return response;
      } catch (error) {
        this.recordNetworkRequest({
          url,
          method,
          duration: Date.now() - startTime,
          requestSize: this.estimateRequestSize(init),
          responseSize: 0,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    this.originalMethods.set('xhr_open', originalXHROpen);
    this.originalMethods.set('xhr_send', originalXHRSend);

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any)._stacksleuth = {
        method,
        url: url.toString(),
        startTime: Date.now()
      };
      return originalXHROpen.apply(this, [method, url, ...args] as any);
    };

    XMLHttpRequest.prototype.send = function(body?: any) {
      const xhr = this;
      const data = (xhr as any)._stacksleuth;

      if (data) {
        const originalOnReadyStateChange = xhr.onreadystatechange;
        
        xhr.onreadystatechange = function(this: XMLHttpRequest) {
          if (xhr.readyState === 4) {
            const networkEvent: NetworkEvent = {
              url: data.url,
              method: data.method,
              status: xhr.status,
              duration: Date.now() - data.startTime,
              requestSize: body ? JSON.stringify(body).length : 0,
              responseSize: xhr.responseText?.length || 0
            };

            if (xhr.status >= 400) {
              networkEvent.error = `HTTP ${xhr.status}`;
            }

            // Access the outer scope SessionReplayAgent instance
            // This is a bit tricky, but we'll use a global reference
            (window as any)._stacksleuth_replay_agent?.recordNetworkRequest(networkEvent);
          }

          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.call(xhr, new Event('readystatechange'));
          }
        };
      }

      return originalXHRSend.apply(this, [body] as any);
    };

    // Store reference for XHR tracking
    (window as any)._stacksleuth_replay_agent = this;
  }

  /**
   * Setup performance tracking
   */
  private setupPerformanceTracking(): void {
    // Web Vitals tracking
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordPerformanceMetric({
          metric: 'LCP',
          value: lastEntry.startTime,
          rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          
          this.recordPerformanceMetric({
            metric: 'FID',
            value: fid,
            rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'
          });
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let cumulativeLayoutShift = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cumulativeLayoutShift += entry.value;
          }
        });

        this.recordPerformanceMetric({
          metric: 'CLS',
          value: cumulativeLayoutShift,
          rating: cumulativeLayoutShift < 0.1 ? 'good' : cumulativeLayoutShift < 0.25 ? 'needs-improvement' : 'poor'
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.recordPerformanceMetric({
            metric: 'TTFB',
            value: navigation.responseStart - navigation.requestStart,
            rating: navigation.responseStart - navigation.requestStart < 600 ? 'good' : 'needs-improvement'
          });
        }
      }, 0);
    });
  }

  /**
   * Setup console tracking
   */
  private setupConsoleTracking(): void {
    const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'];

    consoleMethods.forEach(method => {
      const originalMethod = (console as any)[method];
      this.originalMethods.set(`console_${method}`, originalMethod);

      (console as any)[method] = (...args: any[]) => {
        this.recordEvent({
          type: 'console_log',
          data: {
            level: method,
            args: args.map(arg => this.serializeArgument(arg)),
            stack: method === 'error' ? new Error().stack : undefined
          }
        });

        return originalMethod.apply(console, args);
      };
    });
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.recordEvent({
        type: 'error',
        data: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
          type: 'javascript'
        }
      });
      this.metadata.errorCount++;
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordEvent({
        type: 'error',
        data: {
          message: 'Unhandled Promise Rejection',
          reason: String(event.reason),
          stack: event.reason?.stack,
          type: 'promise'
        }
      });
      this.metadata.errorCount++;
    });
  }

  /**
   * Record user interaction
   */
  private recordUserInteraction(type: UserInteractionEvent['type'], event: Event): void {
    const target = this.getElementSelector(event.target as Element);
    const data: UserInteractionEvent = { type, target };

    switch (type) {
      case 'click':
        const clickEvent = event as MouseEvent;
        data.coordinates = { x: clickEvent.clientX, y: clickEvent.clientY };
        break;
      
      case 'scroll':
        data.scrollPosition = { x: window.scrollX, y: window.scrollY };
        break;
      
      case 'input':
        const inputEvent = event as InputEvent;
        const inputTarget = inputEvent.target as HTMLInputElement;
        if (inputTarget && !this.isSensitiveInput(inputTarget)) {
          data.value = inputTarget.value;
        }
        break;
      
      case 'resize':
        data.viewport = this.getViewportSize();
        break;
    }

    this.recordEvent({
      type: 'user_interaction',
      data
    });
  }

  /**
   * Record DOM changes
   */
  private recordDOMChange(mutation: MutationRecord): void {
    const target = this.getElementSelector(mutation.target as Element);

    let data: DOMEvent;

    switch (mutation.type) {
      case 'childList':
        if (mutation.addedNodes.length > 0) {
          data = {
            type: 'added',
            target,
            nodeName: (mutation.addedNodes[0] as Element).nodeName
          };
        } else if (mutation.removedNodes.length > 0) {
          data = {
            type: 'removed',
            target,
            nodeName: (mutation.removedNodes[0] as Element).nodeName
          };
        } else {
          return;
        }
        break;

      case 'attributes':
        data = {
          type: 'attributes',
          target,
          attributes: {
            [mutation.attributeName!]: (mutation.target as Element).getAttribute(mutation.attributeName!)!
          }
        };
        break;

      case 'characterData':
        data = {
          type: 'characterData',
          target,
          textContent: mutation.target.textContent || ''
        };
        break;

      default:
        return;
    }

    this.recordEvent({
      type: 'dom_mutation',
      data
    });
  }

  /**
   * Record network request
   */
  private recordNetworkRequest(networkData: NetworkEvent): void {
    this.recordEvent({
      type: 'network_request',
      data: networkData
    });
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(perfData: PerformanceEvent): void {
    this.recordEvent({
      type: 'performance',
      data: perfData
    });
  }

  /**
   * Record a session event
   */
  private recordEvent(event: Omit<SessionEvent, 'id' | 'timestamp'>): void {
    if (!this.isActive) return;

    const sessionEvent: SessionEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...event
    };

    this.eventBuffer.push(sessionEvent);
    this.metadata.eventCount++;

    // Auto-flush buffer if it gets too large
    if (this.eventBuffer.length >= this.maxBufferSize) {
      this.flush();
    }

    // Record with profiler
    this.profiler.recordMetric('session_event', {
      sessionKey: this.sessionId,
      eventType: event.type,
      timestamp: sessionEvent.timestamp
    });
  }

  /**
   * Flush buffered events to storage
   */
  public flush(): void {
    if (this.eventBuffer.length === 0) return;

    // Move buffer to main events array
    this.events.push(...this.eventBuffer);
    this.eventBuffer = [];

    // Trim events if we exceed maximum
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Update metadata
    this.metadata.duration = Date.now() - this.metadata.startTime;
  }

  /**
   * Get current session data
   */
  public getSessionData(): { metadata: SessionMetadata; events: SessionEvent[] } {
    this.flush();
    return {
      metadata: { ...this.metadata },
      events: [...this.events]
    };
  }

  /**
   * Export session as JSON
   */
  public exportSession(): string {
    const sessionData = this.getSessionData();
    return JSON.stringify(sessionData, null, 2);
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): any {
    const eventTypes = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const errors = this.events.filter(e => e.type === 'error');
    const networkRequests = this.events.filter(e => e.type === 'network_request');
    const userInteractions = this.events.filter(e => e.type === 'user_interaction');

    return {
      sessionId: this.sessionId,
      duration: this.metadata.duration,
      totalEvents: this.events.length,
      eventTypes,
      errorCount: errors.length,
      networkRequestCount: networkRequests.length,
      userInteractionCount: userInteractions.length,
      averageEventRate: this.metadata.duration ? (this.events.length / (this.metadata.duration / 1000)) : 0
    };
  }

  /**
   * Helper methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getElementSelector(element: Element): string {
    if (!element) return 'unknown';

    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.toString().split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }

    return selector;
  }

  private getViewportSize(): { width: number; height: number } {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  private isSensitiveInput(element: HTMLInputElement): boolean {
    const sensitiveTypes = ['password', 'email', 'tel', 'number'];
    const sensitiveNames = ['password', 'email', 'phone', 'credit', 'ssn', 'social'];
    
    return sensitiveTypes.includes(element.type) ||
           sensitiveNames.some(name => 
             element.name?.toLowerCase().includes(name) ||
             element.id?.toLowerCase().includes(name)
           );
  }

  private estimateRequestSize(init?: RequestInit): number {
    if (!init?.body) return 0;
    
    if (typeof init.body === 'string') {
      return init.body.length;
    }
    
    return JSON.stringify(init.body).length;
  }

  private estimateResponseSize(response: Response): number {
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  private serializeArgument(arg: any): any {
    if (arg === null || arg === undefined) return arg;
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') return arg;
    if (arg instanceof Error) return { name: arg.name, message: arg.message, stack: arg.stack };
    if (typeof arg === 'object') {
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch {
        return '[Circular or Non-serializable Object]';
      }
    }
    return String(arg);
  }

  /**
   * Stop session recording
   */
  public async stop(): Promise<void> {
    if (!this.isActive) return;

    this.isActive = false;

    // Clear flush interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Restore original methods
    this.originalMethods.forEach((method, key) => {
      if (key === 'fetch') {
        window.fetch = method;
      } else if (key === 'xhr_open') {
        XMLHttpRequest.prototype.open = method;
      } else if (key === 'xhr_send') {
        XMLHttpRequest.prototype.send = method;
      } else if (key.startsWith('console_')) {
        const consoleMethod = key.replace('console_', '');
        (console as any)[consoleMethod] = method;
      }
    });

    // Disconnect observers
    Object.values(this.observers).forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      } else if (typeof observer === 'function') {
        // Event listener - would need to remove manually
        // For simplicity, we'll just mark them as inactive
      }
    });

    // Final flush
    this.flush();

    // Update metadata
    this.metadata.endTime = Date.now();
    this.metadata.duration = this.metadata.endTime - this.metadata.startTime;

    // Record session end
    this.profiler.recordMetric('session_end', {
      ...this.metadata,
      timestamp: Date.now()
    });

    await this.profiler.stop();
    
    console.log('🛑 Session Replay Agent stopped');
  }

  // NEW METHODS FOR TESTS
  public startRecording(): Promise<void> {
    return this.init();
  }

  public async stopRecording(): Promise<void> {
    await this.stop();
  }

  public clearSession(): void {
    this.events = [];
    this.metadata.eventCount = 0;
    this.metadata.errorCount = 0;
  }

  public recordCustomEvent(type: string, data: any): void {
    this.recordEvent({
      type: 'custom' as any,
      data: { type, ...data }
    });
  }
}

// Export default instance
export const sessionReplayAgent = new SessionReplayAgent();

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  sessionReplayAgent.init().catch(console.error);
} 