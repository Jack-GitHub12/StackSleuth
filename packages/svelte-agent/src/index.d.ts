export interface SvelteComponentMetrics {
    name: string;
    renderTime: number;
    updateTime: number;
    mountTime: number;
    destroyTime: number;
    propsCount: number;
    stateCount: number;
    computedCount: number;
    memoryUsage: number;
}
export interface SvelteStoreMetrics {
    name: string;
    subscriptions: number;
    updateFrequency: number;
    valueSize: number;
    lastUpdate: number;
}
export declare class SvelteAgent {
    private profiler;
    private componentMetrics;
    private storeMetrics;
    private isActive;
    private observerConfig;
    constructor(config?: {
        endpoint?: string;
        apiKey?: string;
        sampleRate?: number;
    });
    /**
     * Initialize the Svelte agent and start monitoring
     */
    init(): Promise<void>;
    /**
     * Instrument Svelte components for performance monitoring
     */
    private instrumentSvelteComponents;
    /**
     * Instrument Svelte stores for monitoring
     */
    private instrumentSvelteStores;
    /**
     * Setup mutation observer for DOM changes
     */
    private setupMutationObserver;
    /**
     * Track memory usage periodically
     */
    private trackMemoryUsage;
    /**
     * Record component performance metrics
     */
    private recordComponentMetric;
    /**
     * Update store metrics
     */
    private updateStoreMetric;
    /**
     * Get component name from component instance
     */
    private getComponentName;
    /**
     * Generate unique store name
     */
    private generateStoreName;
    /**
     * Track DOM elements created by Svelte
     */
    private trackDOMElement;
    /**
     * Calculate the approximate size of a value in bytes
     */
    private calculateValueSize;
    /**
     * Get current component metrics
     */
    getComponentMetrics(): Map<string, SvelteComponentMetrics>;
    /**
     * Get current store metrics
     */
    getStoreMetrics(): Map<string, SvelteStoreMetrics>;
    /**
     * Get performance summary
     */
    getPerformanceSummary(): any;
    /**
     * Stop monitoring and cleanup
     */
    stop(): Promise<void>;
    /** TEST COMPATIBILITY WRAPPERS */
    startProfiling(): Promise<void>;
    stopProfiling(): Promise<void>;
}
export declare const svelteAgent: SvelteAgent;
//# sourceMappingURL=index.d.ts.map