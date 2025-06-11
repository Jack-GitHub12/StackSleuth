"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserAgent = exports.BrowserAgent = void 0;
const core_1 = require("@stacksleuth/core");
const playwright_1 = require("playwright");
const cheerio = __importStar(require("cheerio"));
const ws_1 = __importDefault(require("ws"));
class BrowserAgent {
    constructor(config) {
        this.activeSessions = new Map();
        this.sessionMetrics = new Map();
        this.isActive = false;
        this.profiler = new core_1.ProfilerCore(config);
        // Setup WebSocket server for real-time debugging
        if (config?.wsPort) {
            this.setupWebSocketServer(config.wsPort);
        }
    }
    /**
     * Initialize the browser agent
     */
    async init() {
        if (this.isActive)
            return;
        this.isActive = true;
        await this.profiler.init();
        console.log('🔄 Browser Agent initialized');
    }
    /**
     * Create a new debug session
     */
    async createDebugSession(url, options = {}) {
        const sessionId = this.generateSessionId();
        const browserType = options.browserType || 'chromium';
        let browser;
        switch (browserType) {
            case 'firefox':
                browser = await playwright_1.firefox.launch({
                    headless: options.headless ?? false,
                    args: ['--disable-dev-shm-usage']
                });
                break;
            case 'webkit':
                browser = await playwright_1.webkit.launch({
                    headless: options.headless ?? false
                });
                break;
            default:
                browser = await playwright_1.chromium.launch({
                    headless: options.headless ?? false,
                    args: ['--disable-dev-shm-usage', '--no-sandbox']
                });
        }
        const context = await browser.newContext({
            viewport: options.viewport || { width: 1920, height: 1080 },
            userAgent: options.userAgent,
            recordVideo: options.recordVideo ? { dir: './recordings' } : undefined,
            recordHar: options.recordHar ? { path: `./recordings/${sessionId}.har` } : undefined
        });
        const page = await context.newPage();
        const session = {
            id: sessionId,
            url,
            browser,
            page,
            startTime: Date.now(),
            networkLogs: [],
            consoleLogs: [],
            errorLogs: [],
            screenshots: []
        };
        this.setupPageListeners(session);
        this.activeSessions.set(sessionId, session);
        // Initialize session metrics
        this.sessionMetrics.set(sessionId, {
            sessionId,
            browser: browserType,
            startTime: Date.now(),
            pageCount: 1,
            totalNetworkRequests: 0,
            totalConsoleErrors: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            userActions: []
        });
        // Navigate to URL
        await this.navigateToUrl(sessionId, url);
        return sessionId;
    }
    /**
     * Setup page event listeners for debugging
     */
    setupPageListeners(session) {
        const { page } = session;
        // Network monitoring
        page.on('request', (request) => {
            session.networkLogs.push({
                type: 'request',
                timestamp: Date.now(),
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData()
            });
            this.updateSessionMetric(session.id, 'networkRequest');
        });
        page.on('response', (response) => {
            session.networkLogs.push({
                type: 'response',
                timestamp: Date.now(),
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                size: response.headers()['content-length'] || 0
            });
        });
        // Console monitoring
        page.on('console', (message) => {
            const log = {
                type: message.type(),
                timestamp: Date.now(),
                text: message.text(),
                location: message.location()
            };
            session.consoleLogs.push(log);
            if (message.type() === 'error') {
                session.errorLogs.push(log);
                this.updateSessionMetric(session.id, 'consoleError');
            }
        });
        // Error monitoring
        page.on('pageerror', (error) => {
            const errorLog = {
                type: 'pageerror',
                timestamp: Date.now(),
                message: error.message,
                stack: error.stack
            };
            session.errorLogs.push(errorLog);
            this.updateSessionMetric(session.id, 'consoleError');
        });
        // Performance monitoring
        page.on('load', async () => {
            try {
                const metrics = await page.evaluate(() => {
                    const navigation = performance.getEntriesByType('navigation')[0];
                    const paint = performance.getEntriesByType('paint');
                    return {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                        largestContentfulPaint: 0 // Would need additional setup
                    };
                });
                this.profiler.recordMetric('browser_page_performance', {
                    sessionId: session.id,
                    url: session.url,
                    ...metrics,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                console.warn('Failed to collect performance metrics:', error);
            }
        });
    }
    /**
     * Navigate to a URL in a session
     */
    async navigateToUrl(sessionId, url) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            throw new Error(`Session ${sessionId} not found`);
        const startTime = Date.now();
        try {
            await session.page.goto(url, { waitUntil: 'networkidle' });
            this.recordUserAction(sessionId, {
                type: 'navigate',
                timestamp: Date.now(),
                target: url,
                duration: Date.now() - startTime,
                success: true
            });
        }
        catch (error) {
            this.recordUserAction(sessionId, {
                type: 'navigate',
                timestamp: Date.now(),
                target: url,
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Simulate user click
     */
    async click(sessionId, selector) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            throw new Error(`Session ${sessionId} not found`);
        const startTime = Date.now();
        try {
            await session.page.click(selector);
            this.recordUserAction(sessionId, {
                type: 'click',
                timestamp: Date.now(),
                target: selector,
                duration: Date.now() - startTime,
                success: true
            });
        }
        catch (error) {
            this.recordUserAction(sessionId, {
                type: 'click',
                timestamp: Date.now(),
                target: selector,
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Simulate user typing
     */
    async type(sessionId, selector, text) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            throw new Error(`Session ${sessionId} not found`);
        const startTime = Date.now();
        try {
            await session.page.fill(selector, text);
            this.recordUserAction(sessionId, {
                type: 'type',
                timestamp: Date.now(),
                target: selector,
                value: text,
                duration: Date.now() - startTime,
                success: true
            });
        }
        catch (error) {
            this.recordUserAction(sessionId, {
                type: 'type',
                timestamp: Date.now(),
                target: selector,
                value: text,
                duration: Date.now() - startTime,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Take a screenshot
     */
    async screenshot(sessionId, path) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            throw new Error(`Session ${sessionId} not found`);
        const screenshotPath = path || `./screenshots/${sessionId}_${Date.now()}.png`;
        try {
            await session.page.screenshot({ path: screenshotPath, fullPage: true });
            session.screenshots.push(screenshotPath);
            this.recordUserAction(sessionId, {
                type: 'screenshot',
                timestamp: Date.now(),
                target: screenshotPath,
                success: true
            });
            return screenshotPath;
        }
        catch (error) {
            this.recordUserAction(sessionId, {
                type: 'screenshot',
                timestamp: Date.now(),
                target: screenshotPath,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Crawl a website and extract data
     */
    async crawlWebsite(url, options = {}) {
        const results = [];
        const visited = new Set();
        const toVisit = [url];
        const maxDepth = options.maxDepth || 2;
        const maxPages = options.maxPages || 50;
        const delay = options.delay || 1000;
        const sessionId = await this.createDebugSession(url, { headless: true });
        const session = this.activeSessions.get(sessionId);
        try {
            let currentDepth = 0;
            while (toVisit.length > 0 && results.length < maxPages && currentDepth < maxDepth) {
                const currentUrl = toVisit.shift();
                if (visited.has(currentUrl))
                    continue;
                visited.add(currentUrl);
                try {
                    const result = await this.crawlSinglePage(session, currentUrl);
                    results.push(result);
                    // Add new links to visit
                    if (options.followExternalLinks || this.isSameDomain(url, currentUrl)) {
                        result.links
                            .filter(link => !visited.has(link))
                            .slice(0, 10) // Limit links per page
                            .forEach(link => toVisit.push(link));
                    }
                    // Delay between requests
                    if (delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                catch (error) {
                    console.warn(`Failed to crawl ${currentUrl}:`, error);
                }
                currentDepth++;
            }
        }
        finally {
            await this.closeSession(sessionId);
        }
        return results;
    }
    /**
     * Crawl a single page
     */
    async crawlSinglePage(session, url) {
        const startTime = Date.now();
        await session.page.goto(url, { waitUntil: 'networkidle' });
        const content = await session.page.content();
        const $ = cheerio.load(content);
        // Extract links
        const links = [];
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
                try {
                    const absoluteUrl = new URL(href, url).toString();
                    links.push(absoluteUrl);
                }
                catch (error) {
                    // Invalid URL, skip
                }
            }
        });
        // Extract images
        const images = [];
        $('img[src]').each((_, element) => {
            const src = $(element).attr('src');
            if (src) {
                try {
                    const absoluteUrl = new URL(src, url).toString();
                    images.push(absoluteUrl);
                }
                catch (error) {
                    // Invalid URL, skip
                }
            }
        });
        // Extract scripts
        const scripts = [];
        $('script[src]').each((_, element) => {
            const src = $(element).attr('src');
            if (src) {
                try {
                    const absoluteUrl = new URL(src, url).toString();
                    scripts.push(absoluteUrl);
                }
                catch (error) {
                    // Invalid URL, skip
                }
            }
        });
        // Get performance metrics
        const performance = await session.page.evaluate(() => {
            const navigation = window.performance.getEntriesByType('navigation')[0];
            const paint = window.performance.getEntriesByType('paint');
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                largestContentfulPaint: 0 // Would need additional setup
            };
        });
        const loadTime = Date.now() - startTime;
        return {
            url,
            statusCode: 200, // Playwright doesn't fail on non-200 status by default
            loadTime,
            contentSize: content.length,
            links: [...new Set(links)], // Remove duplicates
            images: [...new Set(images)],
            scripts: [...new Set(scripts)],
            errors: session.errorLogs.map(log => log.message || log.text).slice(-10),
            performance
        };
    }
    /**
     * Setup WebSocket server for real-time debugging
     */
    setupWebSocketServer(port) {
        this.wsServer = new ws_1.default.Server({ port });
        this.wsServer.on('connection', (ws) => {
            console.log('Debug client connected');
            ws.on('message', async (message) => {
                try {
                    const command = JSON.parse(message.toString());
                    const result = await this.handleWebSocketCommand(command);
                    ws.send(JSON.stringify({ id: command.id, result }));
                }
                catch (error) {
                    const cmd = JSON.parse(message.toString());
                    ws.send(JSON.stringify({
                        id: cmd.id,
                        error: error instanceof Error ? error.message : String(error)
                    }));
                }
            });
        });
        console.log(`🔄 WebSocket debug server started on port ${port}`);
    }
    /**
     * Handle WebSocket commands
     */
    async handleWebSocketCommand(command) {
        switch (command.type) {
            case 'createSession':
                return await this.createDebugSession(command.url, command.options);
            case 'navigate':
                await this.navigateToUrl(command.sessionId, command.url);
                return { success: true };
            case 'click':
                await this.click(command.sessionId, command.selector);
                return { success: true };
            case 'type':
                await this.type(command.sessionId, command.selector, command.text);
                return { success: true };
            case 'screenshot':
                return await this.screenshot(command.sessionId, command.path);
            case 'getSessionMetrics':
                return this.getSessionMetrics(command.sessionId);
            case 'getLiveLogs':
                return this.getLiveLogs(command.sessionId);
            default:
                throw new Error(`Unknown command type: ${command.type}`);
        }
    }
    /**
     * Record user action
     */
    recordUserAction(sessionId, action) {
        const metrics = this.sessionMetrics.get(sessionId);
        if (metrics) {
            metrics.userActions.push(action);
            this.sessionMetrics.set(sessionId, metrics);
        }
        this.profiler.recordMetric('browser_user_action', {
            sessionId,
            ...action
        });
    }
    /**
     * Update session metrics
     */
    updateSessionMetric(sessionId, type) {
        const metrics = this.sessionMetrics.get(sessionId);
        if (!metrics)
            return;
        switch (type) {
            case 'networkRequest':
                metrics.totalNetworkRequests++;
                break;
            case 'consoleError':
                metrics.totalConsoleErrors++;
                break;
        }
        this.sessionMetrics.set(sessionId, metrics);
    }
    /**
     * Get session metrics
     */
    getSessionMetrics(sessionId) {
        return this.sessionMetrics.get(sessionId);
    }
    /**
     * Get live logs for a session
     */
    getLiveLogs(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return null;
        return {
            networkLogs: session.networkLogs.slice(-50),
            consoleLogs: session.consoleLogs.slice(-50),
            errorLogs: session.errorLogs.slice(-20),
            screenshots: session.screenshots
        };
    }
    /**
     * Close a debug session
     */
    async closeSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session)
            return;
        try {
            await session.browser.close();
        }
        catch (error) {
            console.warn('Error closing browser:', error);
        }
        // Update session metrics
        const metrics = this.sessionMetrics.get(sessionId);
        if (metrics) {
            metrics.endTime = Date.now();
            this.sessionMetrics.set(sessionId, metrics);
        }
        this.activeSessions.delete(sessionId);
        this.profiler.recordMetric('browser_session_closed', {
            sessionId,
            duration: metrics ? (Date.now() - metrics.startTime) : 0,
            timestamp: Date.now()
        });
    }
    /**
     * Utility methods
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    isSameDomain(url1, url2) {
        try {
            return new URL(url1).hostname === new URL(url2).hostname;
        }
        catch {
            return false;
        }
    }
    /**
     * Get all active sessions
     */
    getActiveSessions() {
        return Array.from(this.activeSessions.keys());
    }
    /**
     * Stop the browser agent
     */
    async stop() {
        if (!this.isActive)
            return;
        // Close all active sessions
        const sessionIds = Array.from(this.activeSessions.keys());
        await Promise.all(sessionIds.map(id => this.closeSession(id)));
        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close();
        }
        this.isActive = false;
        await this.profiler.stop();
        console.log('🛑 Browser Agent stopped');
    }
    /**
     * Legacy compatibility wrappers for tests
     */
    startMonitoring() {
        return this.init();
    }
    async stopMonitoring() {
        await this.stop();
    }
    getPageMetrics() {
        // Simple metric based on active session 0 or placeholder
        const session = Array.from(this.sessionMetrics.values())[0];
        return {
            pageLoadTime: session ? Date.now() - session.startTime : 0
        };
    }
    getPerformanceData() {
        return {
            resourceTimings: typeof performance !== 'undefined' ? performance.getEntriesByType('resource') : []
        };
    }
    getUserInteractions() {
        const session = Array.from(this.sessionMetrics.values())[0];
        return session ? session.userActions : [];
    }
    getBrowserInfo() {
        return { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js' };
    }
}
exports.BrowserAgent = BrowserAgent;
// Export default instance
exports.browserAgent = new BrowserAgent();
// Auto-initialize
exports.browserAgent.init().catch(console.error);
//# sourceMappingURL=index.js.map