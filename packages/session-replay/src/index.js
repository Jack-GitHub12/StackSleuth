"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionReplayAgent = exports.SessionReplayAgent = void 0;
const core_1 = require("@stacksleuth/core");
class SessionReplayAgent {
    constructor(config) {
        this.isActive = false;
        this.events = [];
        this.observers = {};
        this.originalMethods = new Map();
        this.eventBuffer = [];
        this.maxEvents = 10000;
        this.maxBufferSize = 100;
        this.profiler = new core_1.ProfilerCore(config);
        this.sessionId = this.generateSessionId();
        this.maxEvents = config?.maxEvents || 10000;
        this.maxBufferSize = config?.maxBufferSize || 100;
        this.metadata = {
            sessionId: this.sessionId,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
            url: typeof window !== 'undefined' ? window.location.href : 'N/A',
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
    async init() {
        if (this.isActive || typeof window === 'undefined')
            return;
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
    setupUserInteractionTracking() {
        const events = ['click', 'scroll', 'input', 'focus', 'blur', 'keypress', 'resize'];
        events.forEach(eventType => {
            const handler = (event) => {
                this.recordUserInteraction(eventType, event);
            };
            document.addEventListener(eventType, handler, { passive: true, capture: true });
            this.observers[eventType] = handler;
        });
        // Special handling for scroll with throttling
        let scrollTimeout;
        const scrollHandler = (event) => {
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
    setupDOMTracking() {
        if (!window.MutationObserver)
            return;
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
    setupNetworkTracking() {
        // Intercept fetch
        const originalFetch = window.fetch;
        this.originalMethods.set('fetch', originalFetch);
        window.fetch = async (input, init) => {
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
            }
            catch (error) {
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
        XMLHttpRequest.prototype.open = function (method, url, ...args) {
            this._stacksleuth = {
                method,
                url: url.toString(),
                startTime: Date.now()
            };
            return originalXHROpen.apply(this, [method, url, ...args]);
        };
        XMLHttpRequest.prototype.send = function (body) {
            const xhr = this;
            const data = xhr._stacksleuth;
            if (data) {
                const originalOnReadyStateChange = xhr.onreadystatechange;
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        const networkEvent = {
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
                        window._stacksleuth_replay_agent?.recordNetworkRequest(networkEvent);
                    }
                    if (originalOnReadyStateChange) {
                        originalOnReadyStateChange.call(xhr, new Event('readystatechange'));
                    }
                };
            }
            return originalXHRSend.apply(this, [body]);
        };
        // Store reference for XHR tracking
        window._stacksleuth_replay_agent = this;
    }
    /**
     * Setup performance tracking
     */
    setupPerformanceTracking() {
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
                entries.forEach((entry) => {
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
                entries.forEach((entry) => {
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
                const navigation = performance.getEntriesByType('navigation')[0];
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
    setupConsoleTracking() {
        const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'];
        consoleMethods.forEach(method => {
            const originalMethod = console[method];
            this.originalMethods.set(`console_${method}`, originalMethod);
            console[method] = (...args) => {
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
    setupErrorTracking() {
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
    recordUserInteraction(type, event) {
        const target = this.getElementSelector(event.target);
        const data = { type, target };
        switch (type) {
            case 'click':
                const clickEvent = event;
                data.coordinates = { x: clickEvent.clientX, y: clickEvent.clientY };
                break;
            case 'scroll':
                data.scrollPosition = { x: window.scrollX, y: window.scrollY };
                break;
            case 'input':
                const inputEvent = event;
                const inputTarget = inputEvent.target;
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
    recordDOMChange(mutation) {
        const target = this.getElementSelector(mutation.target);
        let data;
        switch (mutation.type) {
            case 'childList':
                if (mutation.addedNodes.length > 0) {
                    data = {
                        type: 'added',
                        target,
                        nodeName: mutation.addedNodes[0].nodeName
                    };
                }
                else if (mutation.removedNodes.length > 0) {
                    data = {
                        type: 'removed',
                        target,
                        nodeName: mutation.removedNodes[0].nodeName
                    };
                }
                else {
                    return;
                }
                break;
            case 'attributes':
                data = {
                    type: 'attributes',
                    target,
                    attributes: {
                        [mutation.attributeName]: mutation.target.getAttribute(mutation.attributeName)
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
    recordNetworkRequest(networkData) {
        this.recordEvent({
            type: 'network_request',
            data: networkData
        });
    }
    /**
     * Record performance metric
     */
    recordPerformanceMetric(perfData) {
        this.recordEvent({
            type: 'performance',
            data: perfData
        });
    }
    /**
     * Record a session event
     */
    recordEvent(event) {
        if (!this.isActive)
            return;
        const sessionEvent = {
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
    flush() {
        if (this.eventBuffer.length === 0)
            return;
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
    getSessionData() {
        this.flush();
        return {
            metadata: { ...this.metadata },
            events: [...this.events]
        };
    }
    /**
     * Export session as JSON
     */
    exportSession() {
        const sessionData = this.getSessionData();
        return JSON.stringify(sessionData, null, 2);
    }
    /**
     * Get session statistics
     */
    getSessionStats() {
        const eventTypes = this.events.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {});
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
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getElementSelector(element) {
        if (!element)
            return 'unknown';
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
    getViewportSize() {
        if (typeof window === 'undefined') {
            return { width: 0, height: 0 };
        }
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    isSensitiveInput(element) {
        const sensitiveTypes = ['password', 'email', 'tel', 'number'];
        const sensitiveNames = ['password', 'email', 'phone', 'credit', 'ssn', 'social'];
        return sensitiveTypes.includes(element.type) ||
            sensitiveNames.some(name => element.name?.toLowerCase().includes(name) ||
                element.id?.toLowerCase().includes(name));
    }
    estimateRequestSize(init) {
        if (!init?.body)
            return 0;
        if (typeof init.body === 'string') {
            return init.body.length;
        }
        return JSON.stringify(init.body).length;
    }
    estimateResponseSize(response) {
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength, 10) : 0;
    }
    serializeArgument(arg) {
        if (arg === null || arg === undefined)
            return arg;
        if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean')
            return arg;
        if (arg instanceof Error)
            return { name: arg.name, message: arg.message, stack: arg.stack };
        if (typeof arg === 'object') {
            try {
                return JSON.parse(JSON.stringify(arg));
            }
            catch {
                return '[Circular or Non-serializable Object]';
            }
        }
        return String(arg);
    }
    /**
     * Stop session recording
     */
    async stop() {
        if (!this.isActive)
            return;
        this.isActive = false;
        // Clear flush interval
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        // Restore original methods
        this.originalMethods.forEach((method, key) => {
            if (key === 'fetch') {
                window.fetch = method;
            }
            else if (key === 'xhr_open') {
                XMLHttpRequest.prototype.open = method;
            }
            else if (key === 'xhr_send') {
                XMLHttpRequest.prototype.send = method;
            }
            else if (key.startsWith('console_')) {
                const consoleMethod = key.replace('console_', '');
                console[consoleMethod] = method;
            }
        });
        // Disconnect observers
        Object.values(this.observers).forEach(observer => {
            if (observer && typeof observer.disconnect === 'function') {
                observer.disconnect();
            }
            else if (typeof observer === 'function') {
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
    startRecording() {
        return this.init();
    }
    async stopRecording() {
        await this.stop();
    }
    clearSession() {
        this.events = [];
        this.metadata.eventCount = 0;
        this.metadata.errorCount = 0;
    }
    recordCustomEvent(type, data) {
        this.recordEvent({
            type: 'custom',
            data: { type, ...data }
        });
    }
}
exports.SessionReplayAgent = SessionReplayAgent;
// Export default instance
exports.sessionReplayAgent = new SessionReplayAgent();
// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    exports.sessionReplayAgent.init().catch(console.error);
}
//# sourceMappingURL=index.js.map