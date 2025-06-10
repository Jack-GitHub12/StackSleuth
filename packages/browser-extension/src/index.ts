import { BaseAgent, AgentConfig } from '@stacksleuth/core';

// Browser Extension specific interfaces
export interface ExtensionConfig extends AgentConfig {
  enableContentScript?: boolean;
  enableDevTools?: boolean;
  enablePopup?: boolean;
  autoInject?: boolean;
  trackingDomains?: string[];
  excludedDomains?: string[];
}

export interface DevToolsPanel {
  id: string;
  title: string;
  iconPath: string;
  panelPath: string;
}

export interface ContentScriptMessage {
  type: 'performance-data' | 'user-interaction' | 'network-request' | 'console-log' | 'error';
  data: any;
  timestamp: number;
  tabId?: number;
  url?: string;
}

export interface ExtensionMetric {
  tabId: number;
  url: string;
  timestamp: number;
  type: 'page-load' | 'navigation' | 'resource-load' | 'user-interaction' | 'error';
  data: any;
}

export interface TabPerformanceData {
  tabId: number;
  url: string;
  loadTime: number;
  resources: Array<{
    name: string;
    type: string;
    loadTime: number;
    size: number;
  }>;
  interactions: Array<{
    type: string;
    element: string;
    timestamp: number;
  }>;
  errors: Array<{
    message: string;
    stack: string;
    timestamp: number;
  }>;
  memoryUsage?: {
    used: number;
    total: number;
  };
}

export class BrowserExtension extends BaseAgent {
  protected config: ExtensionConfig;
  private metrics: ExtensionMetric[] = [];
  private tabData: Map<number, TabPerformanceData> = new Map();
  protected isActive = false;

  constructor(config: ExtensionConfig = {}) {
    super(config);
    this.config = {
      enableContentScript: true,
      enableDevTools: true,
      enablePopup: true,
      autoInject: true,
      trackingDomains: [],
      excludedDomains: ['chrome://'],
      ...config
    };
  }

  public startMonitoring(): void {
    this.initialize();
  }

  public stopMonitoring(): void {
    this.destroy();
  }

  public async initialize(): Promise<void> {
    if (!this.isExtensionEnvironment()) {
      console.warn('StackSleuth Extension can only run in browser extension environment');
      return;
    }

    console.log('Initializing StackSleuth Browser Extension...');
    
    this.setupMessageHandling();
    
    if (this.config.enableDevTools) {
      this.setupDevToolsPanel();
    }

    if (this.config.enableContentScript) {
      this.setupContentScript();
    }

    this.isActive = true;
  }

  private isExtensionEnvironment(): boolean {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  }

  private setupMessageHandling(): void {
    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message: ContentScriptMessage, sender, sendResponse) => {
        this.handleContentScriptMessage(message, sender);
        sendResponse({ status: 'received' });
      });
    }

    // Handle tab updates
    if (chrome.tabs && chrome.tabs.onUpdated) {
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
          this.handleTabComplete(tabId, tab.url);
        }
      });
    }

    // Handle tab removal
    if (chrome.tabs && chrome.tabs.onRemoved) {
      chrome.tabs.onRemoved.addListener((tabId) => {
        this.tabData.delete(tabId);
      });
    }
  }

  private setupDevToolsPanel(): void {
    // This would typically be called from devtools.js
    if (chrome.devtools && chrome.devtools.panels) {
      chrome.devtools.panels.create(
        'StackSleuth',
        'icons/icon48.png',
        'devtools/panel.html',
        (panel) => {
          console.log('StackSleuth DevTools panel created');
          
          panel.onShown.addListener((window) => {
            // Panel shown - start collecting detailed metrics
            this.startDetailedProfiling();
          });

          panel.onHidden.addListener(() => {
            // Panel hidden - reduce metric collection
            this.stopDetailedProfiling();
          });
        }
      );
    }
  }

  private setupContentScript(): void {
    // This method would be called to prepare content script injection
    if (chrome.scripting) {
      // Inject content script into all applicable tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id && tab.url && this.shouldInjectIntoTab(tab.url)) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content-script.js']
            });
          }
        });
      });
    }
  }

  private shouldInjectIntoTab(url: string): boolean {
    // Check if URL should be excluded
    for (const excluded of this.config.excludedDomains || []) {
      if (url.startsWith(excluded)) {
        return false;
      }
    }

    // Check if URL is in tracking domains (if specified)
    if (this.config.trackingDomains && this.config.trackingDomains.length > 0) {
      return this.config.trackingDomains.some(domain => url.includes(domain));
    }

    return true;
  }

  private handleContentScriptMessage(message: ContentScriptMessage, sender: chrome.runtime.MessageSender): void {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    // Store metric
    this.metrics.push({
      tabId,
      url: sender.tab?.url || '',
      timestamp: message.timestamp,
      type: this.mapMessageTypeToMetricType(message.type),
      data: message.data
    });

    // Update tab performance data
    this.updateTabPerformanceData(tabId, message);

    // Keep only recent metrics (last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private mapMessageTypeToMetricType(messageType: string): ExtensionMetric['type'] {
    switch (messageType) {
      case 'performance-data':
        return 'page-load';
      case 'network-request':
        return 'resource-load';
      case 'user-interaction':
        return 'user-interaction';
      case 'error':
      case 'console-log':
        return 'error';
      default:
        return 'page-load';
    }
  }

  private updateTabPerformanceData(tabId: number, message: ContentScriptMessage): void {
    let tabData = this.tabData.get(tabId);
    
    if (!tabData) {
      tabData = {
        tabId,
        url: message.url || '',
        loadTime: 0,
        resources: [],
        interactions: [],
        errors: []
      };
      this.tabData.set(tabId, tabData);
    }

    switch (message.type) {
      case 'performance-data':
        if (message.data.loadTime) {
          tabData.loadTime = message.data.loadTime;
        }
        if (message.data.resources) {
          tabData.resources = message.data.resources;
        }
        if (message.data.memoryUsage) {
          tabData.memoryUsage = message.data.memoryUsage;
        }
        break;

      case 'user-interaction':
        tabData.interactions.push({
          type: message.data.type,
          element: message.data.element,
          timestamp: message.timestamp
        });
        break;

      case 'error':
        tabData.errors.push({
          message: message.data.message,
          stack: message.data.stack,
          timestamp: message.timestamp
        });
        break;
    }
  }

  private handleTabComplete(tabId: number, url: string): void {
    // Tab loading complete - collect initial metrics
    if (chrome.scripting && this.shouldInjectIntoTab(url)) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: this.collectInitialMetrics
      });
    }
  }

  private collectInitialMetrics(): void {
    // This function runs in the page context
    const performanceData = {
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      resources: performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        type: (entry as any).initiatorType || 'unknown',
        loadTime: entry.duration,
        size: (entry as any).transferSize || 0
      })),
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : undefined
    };

    // Send to background script
    if (chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'performance-data',
        data: performanceData,
        timestamp: Date.now()
      });
    }
  }

  private startDetailedProfiling(): void {
    // Start collecting detailed performance metrics when devtools panel is open
    console.log('Starting detailed profiling...');
  }

  private stopDetailedProfiling(): void {
    // Reduce metric collection when devtools panel is closed
    console.log('Stopping detailed profiling...');
  }

  public getMetrics(): ExtensionMetric[] {
    return [...this.metrics];
  }

  public getTabData(tabId?: number): TabPerformanceData | TabPerformanceData[] {
    if (tabId !== undefined) {
      return this.tabData.get(tabId) || {
        tabId,
        url: '',
        loadTime: 0,
        resources: [],
        interactions: [],
        errors: []
      };
    }
    return Array.from(this.tabData.values());
  }

  public getPerformanceSummary() {
    const allTabData = Array.from(this.tabData.values());
    
    return {
      totalTabs: allTabData.length,
      averageLoadTime: allTabData.length > 0 
        ? allTabData.reduce((sum, tab) => sum + tab.loadTime, 0) / allTabData.length 
        : 0,
      totalResources: allTabData.reduce((sum, tab) => sum + tab.resources.length, 0),
      totalInteractions: allTabData.reduce((sum, tab) => sum + tab.interactions.length, 0),
      totalErrors: allTabData.reduce((sum, tab) => sum + tab.errors.length, 0),
      slowestTabs: allTabData
        .sort((a, b) => b.loadTime - a.loadTime)
        .slice(0, 5)
        .map(tab => ({
          url: tab.url,
          loadTime: tab.loadTime,
          resourceCount: tab.resources.length
        }))
    };
  }

  public async injectContentScript(tabId: number): Promise<void> {
    if (chrome.scripting) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-script.js']
        });
        console.log(`Content script injected into tab ${tabId}`);
      } catch (error) {
        console.error(`Failed to inject content script into tab ${tabId}:`, error);
      }
    }
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.tabData.clear();
  }

  public destroy(): void {
    this.isActive = false;
    this.clearMetrics();
    console.log('StackSleuth Browser Extension destroyed');
  }
}

// Export for use in different extension contexts
export default BrowserExtension; 