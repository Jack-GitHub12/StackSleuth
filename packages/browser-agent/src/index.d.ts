import { Browser, Page } from 'playwright';
export interface BrowserSessionMetrics {
    sessionId: string;
    browser: string;
    startTime: number;
    endTime?: number;
    pageCount: number;
    totalNetworkRequests: number;
    totalConsoleErrors: number;
    memoryUsage: number;
    cpuUsage: number;
    userActions: UserAction[];
}
export interface UserAction {
    type: 'click' | 'type' | 'scroll' | 'navigate' | 'wait' | 'screenshot';
    timestamp: number;
    target?: string;
    value?: string;
    duration?: number;
    success: boolean;
    error?: string;
}
export interface CrawlResult {
    url: string;
    statusCode: number;
    loadTime: number;
    contentSize: number;
    links: string[];
    images: string[];
    scripts: string[];
    errors: string[];
    performance: {
        domContentLoaded: number;
        loadComplete: number;
        firstContentfulPaint: number;
        largestContentfulPaint: number;
    };
}
export interface DebugSession {
    id: string;
    url: string;
    browser: Browser;
    page: Page;
    startTime: number;
    networkLogs: any[];
    consoleLogs: any[];
    errorLogs: any[];
    screenshots: string[];
}
export declare class BrowserAgent {
    private profiler;
    private activeSessions;
    private sessionMetrics;
    private isActive;
    private wsServer?;
    constructor(config?: {
        endpoint?: string;
        apiKey?: string;
        wsPort?: number;
        trackUserInteractions?: boolean;
        trackNetworkRequests?: boolean;
        trackPerformance?: boolean;
    });
    /**
     * Initialize the browser agent
     */
    init(): Promise<void>;
    /**
     * Create a new debug session
     */
    createDebugSession(url: string, options?: {
        browserType?: 'chromium' | 'firefox' | 'webkit';
        headless?: boolean;
        viewport?: {
            width: number;
            height: number;
        };
        userAgent?: string;
        recordVideo?: boolean;
        recordHar?: boolean;
    }): Promise<string>;
    /**
     * Setup page event listeners for debugging
     */
    private setupPageListeners;
    /**
     * Navigate to a URL in a session
     */
    navigateToUrl(sessionId: string, url: string): Promise<void>;
    /**
     * Simulate user click
     */
    click(sessionId: string, selector: string): Promise<void>;
    /**
     * Simulate user typing
     */
    type(sessionId: string, selector: string, text: string): Promise<void>;
    /**
     * Take a screenshot
     */
    screenshot(sessionId: string, path?: string): Promise<string>;
    /**
     * Crawl a website and extract data
     */
    crawlWebsite(url: string, options?: {
        maxDepth?: number;
        maxPages?: number;
        followExternalLinks?: boolean;
        respectRobotsTxt?: boolean;
        delay?: number;
    }): Promise<CrawlResult[]>;
    /**
     * Crawl a single page
     */
    private crawlSinglePage;
    /**
     * Setup WebSocket server for real-time debugging
     */
    private setupWebSocketServer;
    /**
     * Handle WebSocket commands
     */
    private handleWebSocketCommand;
    /**
     * Record user action
     */
    private recordUserAction;
    /**
     * Update session metrics
     */
    private updateSessionMetric;
    /**
     * Get session metrics
     */
    getSessionMetrics(sessionId: string): BrowserSessionMetrics | undefined;
    /**
     * Get live logs for a session
     */
    getLiveLogs(sessionId: string): any;
    /**
     * Close a debug session
     */
    closeSession(sessionId: string): Promise<void>;
    /**
     * Utility methods
     */
    private generateSessionId;
    private isSameDomain;
    /**
     * Get all active sessions
     */
    getActiveSessions(): string[];
    /**
     * Stop the browser agent
     */
    stop(): Promise<void>;
    /**
     * Legacy compatibility wrappers for tests
     */
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;
    getPageMetrics(): {
        pageLoadTime: number;
    };
    getPerformanceData(): {
        resourceTimings: PerformanceResourceTiming[];
    };
    getUserInteractions(): any[];
    getBrowserInfo(): {
        userAgent: string;
    };
}
export declare const browserAgent: BrowserAgent;
//# sourceMappingURL=index.d.ts.map