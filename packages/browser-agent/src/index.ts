import { ProfilerCore } from '@stacksleuth/core';
import { Browser, Page, chromium, firefox, webkit } from 'playwright';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import WebSocket from 'ws';

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

export class BrowserAgent {
  private profiler: ProfilerCore;
  private activeSessions: Map<string, DebugSession> = new Map();
  private sessionMetrics: Map<string, BrowserSessionMetrics> = new Map();
  private isActive: boolean = false;
  private wsServer?: WebSocket.Server;

  constructor(config?: { 
    endpoint?: string; 
    apiKey?: string;
    wsPort?: number;
    trackUserInteractions?: boolean;
    trackNetworkRequests?: boolean;
    trackPerformance?: boolean;
  }) {
    this.profiler = new ProfilerCore(config);
    
    // Setup WebSocket server for real-time debugging
    if (config?.wsPort) {
      this.setupWebSocketServer(config.wsPort);
    }
  }

  /**
   * Initialize the browser agent
   */
  public async init(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    await this.profiler.init();
    
    console.log('🔄 Browser Agent initialized');
  }

  /**
   * Create a new debug session
   */
  public async createDebugSession(
    url: string,
    options: {
      browserType?: 'chromium' | 'firefox' | 'webkit';
      headless?: boolean;
      viewport?: { width: number; height: number };
      userAgent?: string;
      recordVideo?: boolean;
      recordHar?: boolean;
    } = {}
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const browserType = options.browserType || 'chromium';
    
    let browser: Browser;
    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch({ 
          headless: options.headless ?? false,
          args: ['--disable-dev-shm-usage']
        });
        break;
      case 'webkit':
        browser = await webkit.launch({ 
          headless: options.headless ?? false 
        });
        break;
      default:
        browser = await chromium.launch({ 
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
    
    const session: DebugSession = {
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
  private setupPageListeners(session: DebugSession): void {
    const { page } = session;

    // Network monitoring
    page.on('request', (request: any) => {
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

    page.on('response', (response: any) => {
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
    page.on('console', (message: any) => {
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
    page.on('pageerror', (error: any) => {
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
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
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
      } catch (error) {
        console.warn('Failed to collect performance metrics:', error);
      }
    });
  }

  /**
   * Navigate to a URL in a session
   */
  public async navigateToUrl(sessionId: string, url: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

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
    } catch (error) {
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
  public async click(sessionId: string, selector: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

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
    } catch (error) {
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
  public async type(sessionId: string, selector: string, text: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

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
    } catch (error) {
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
  public async screenshot(sessionId: string, path?: string): Promise<string> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

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
    } catch (error) {
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
  public async crawlWebsite(
    url: string,
    options: {
      maxDepth?: number;
      maxPages?: number;
      followExternalLinks?: boolean;
      respectRobotsTxt?: boolean;
      delay?: number;
    } = {}
  ): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    const visited = new Set<string>();
    const toVisit = [url];
    const maxDepth = options.maxDepth || 2;
    const maxPages = options.maxPages || 50;
    const delay = options.delay || 1000;

    const sessionId = await this.createDebugSession(url, { headless: true });
    const session = this.activeSessions.get(sessionId)!;

    try {
      let currentDepth = 0;
      
      while (toVisit.length > 0 && results.length < maxPages && currentDepth < maxDepth) {
        const currentUrl = toVisit.shift()!;
        if (visited.has(currentUrl)) continue;
        
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
          
        } catch (error) {
          console.warn(`Failed to crawl ${currentUrl}:`, error);
        }
        
        currentDepth++;
      }
    } finally {
      await this.closeSession(sessionId);
    }

    return results;
  }

  /**
   * Crawl a single page
   */
  private async crawlSinglePage(session: DebugSession, url: string): Promise<CrawlResult> {
    const startTime = Date.now();
    
    await session.page.goto(url, { waitUntil: 'networkidle' });
    
    const content = await session.page.content();
    const $ = cheerio.load(content);
    
    // Extract links
    const links: string[] = [];
    $('a[href]').each((_: any, element: any) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, url).toString();
          links.push(absoluteUrl);
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    // Extract images
    const images: string[] = [];
    $('img[src]').each((_: any, element: any) => {
      const src = $(element).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, url).toString();
          images.push(absoluteUrl);
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    // Extract scripts
    const scripts: string[] = [];
    $('script[src]').each((_: any, element: any) => {
      const src = $(element).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, url).toString();
          scripts.push(absoluteUrl);
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    // Get performance metrics
    const performance = await session.page.evaluate(() => {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
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
  private setupWebSocketServer(port: number): void {
    this.wsServer = new WebSocket.Server({ port });
    
    this.wsServer.on('connection', (ws) => {
      console.log('Debug client connected');
      
      ws.on('message', async (message) => {
        try {
          const command = JSON.parse(message.toString());
          const result = await this.handleWebSocketCommand(command);
          ws.send(JSON.stringify({ id: command.id, result }));
        } catch (error) {
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
  private async handleWebSocketCommand(command: any): Promise<any> {
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
  private recordUserAction(sessionId: string, action: UserAction): void {
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
  private updateSessionMetric(sessionId: string, type: 'networkRequest' | 'consoleError'): void {
    const metrics = this.sessionMetrics.get(sessionId);
    if (!metrics) return;

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
  public getSessionMetrics(sessionId: string): BrowserSessionMetrics | undefined {
    return this.sessionMetrics.get(sessionId);
  }

  /**
   * Get live logs for a session
   */
  public getLiveLogs(sessionId: string): any {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

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
  public async closeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      await session.browser.close();
    } catch (error) {
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
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isSameDomain(url1: string, url2: string): boolean {
    try {
      return new URL(url1).hostname === new URL(url2).hostname;
    } catch {
      return false;
    }
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * Stop the browser agent
   */
  public async stop(): Promise<void> {
    if (!this.isActive) return;

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
  public startMonitoring(): Promise<void> {
    return this.init();
  }

  public async stopMonitoring(): Promise<void> {
    await this.stop();
  }

  public getPageMetrics(): { pageLoadTime: number } {
    // Simple metric based on active session 0 or placeholder
    const session = Array.from(this.sessionMetrics.values())[0];
    return {
      pageLoadTime: session ? Date.now() - session.startTime : 0
    };
  }

  public getPerformanceData(): { resourceTimings: PerformanceResourceTiming[] } {
    return {
      resourceTimings: typeof performance !== 'undefined' ? (performance.getEntriesByType('resource') as PerformanceResourceTiming[]) : []
    };
  }

  public getUserInteractions(): any[] {
    const session = Array.from(this.sessionMetrics.values())[0];
    return session ? session.userActions : [];
  }

  public getBrowserInfo(): { userAgent: string } {
    return { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js' };
  }
}

// Export default instance
export const browserAgent = new BrowserAgent();

// Auto-initialize
browserAgent.init().catch(console.error); 