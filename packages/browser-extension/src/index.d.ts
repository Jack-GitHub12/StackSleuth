import { BaseAgent, AgentConfig } from '@stacksleuth/core';
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
export declare class BrowserExtension extends BaseAgent {
    protected config: ExtensionConfig;
    private metrics;
    private tabData;
    protected isActive: boolean;
    constructor(config?: ExtensionConfig);
    startMonitoring(): void;
    stopMonitoring(): void;
    initialize(): Promise<void>;
    private isExtensionEnvironment;
    private setupMessageHandling;
    private setupDevToolsPanel;
    private setupContentScript;
    private shouldInjectIntoTab;
    private handleContentScriptMessage;
    private mapMessageTypeToMetricType;
    private updateTabPerformanceData;
    private handleTabComplete;
    private collectInitialMetrics;
    private startDetailedProfiling;
    private stopDetailedProfiling;
    getMetrics(): ExtensionMetric[];
    getTabData(tabId?: number): TabPerformanceData | TabPerformanceData[];
    getPerformanceSummary(): {
        totalTabs: number;
        averageLoadTime: number;
        totalResources: number;
        totalInteractions: number;
        totalErrors: number;
        slowestTabs: {
            url: string;
            loadTime: number;
            resourceCount: number;
        }[];
    };
    injectContentScript(tabId: number): Promise<void>;
    clearMetrics(): void;
    destroy(): void;
}
export default BrowserExtension;
//# sourceMappingURL=index.d.ts.map