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
    coordinates?: {
        x: number;
        y: number;
    };
    scrollPosition?: {
        x: number;
        y: number;
    };
    viewport?: {
        width: number;
        height: number;
    };
}
export interface DOMEvent {
    type: 'added' | 'removed' | 'attributes' | 'characterData';
    target: string;
    attributes?: {
        [key: string]: string;
    };
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
    headers?: {
        [key: string]: string;
    };
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
    viewport: {
        width: number;
        height: number;
    };
    startTime: number;
    endTime?: number;
    duration?: number;
    eventCount: number;
    errorCount: number;
}
export declare class SessionReplayAgent {
    private profiler;
    private isActive;
    private sessionId;
    private events;
    private metadata;
    private observers;
    private originalMethods;
    private eventBuffer;
    private flushInterval?;
    private maxEvents;
    private maxBufferSize;
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
    });
    /**
     * Initialize the session replay agent
     */
    init(): Promise<void>;
    /**
     * Setup user interaction tracking
     */
    private setupUserInteractionTracking;
    /**
     * Setup DOM mutation tracking
     */
    private setupDOMTracking;
    /**
     * Setup network request tracking
     */
    private setupNetworkTracking;
    /**
     * Setup performance tracking
     */
    private setupPerformanceTracking;
    /**
     * Setup console tracking
     */
    private setupConsoleTracking;
    /**
     * Setup error tracking
     */
    private setupErrorTracking;
    /**
     * Record user interaction
     */
    private recordUserInteraction;
    /**
     * Record DOM changes
     */
    private recordDOMChange;
    /**
     * Record network request
     */
    private recordNetworkRequest;
    /**
     * Record performance metric
     */
    private recordPerformanceMetric;
    /**
     * Record a session event
     */
    private recordEvent;
    /**
     * Flush buffered events to storage
     */
    flush(): void;
    /**
     * Get current session data
     */
    getSessionData(): {
        metadata: SessionMetadata;
        events: SessionEvent[];
    };
    /**
     * Export session as JSON
     */
    exportSession(): string;
    /**
     * Get session statistics
     */
    getSessionStats(): any;
    /**
     * Helper methods
     */
    private generateSessionId;
    private generateEventId;
    private getElementSelector;
    private getViewportSize;
    private isSensitiveInput;
    private estimateRequestSize;
    private estimateResponseSize;
    private serializeArgument;
    /**
     * Stop session recording
     */
    stop(): Promise<void>;
    startRecording(): Promise<void>;
    stopRecording(): Promise<void>;
    clearSession(): void;
    recordCustomEvent(type: string, data: any): void;
}
export declare const sessionReplayAgent: SessionReplayAgent;
//# sourceMappingURL=index.d.ts.map