"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.svelteAgent = exports.SvelteAgent = void 0;
const core_1 = require("@stacksleuth/core");
class SvelteAgent {
    constructor(config) {
        this.componentMetrics = new Map();
        this.storeMetrics = new Map();
        this.isActive = false;
        this.observerConfig = {
            childList: true,
            subtree: true,
            attributes: true,
            attributeOldValue: true
        };
        this.profiler = new core_1.ProfilerCore(config);
    }
    /**
     * Initialize the Svelte agent and start monitoring
     */
    async init() {
        if (this.isActive)
            return;
        this.isActive = true;
        await this.profiler.init();
        // Start monitoring Svelte components
        this.instrumentSvelteComponents();
        this.instrumentSvelteStores();
        this.setupMutationObserver();
        this.trackMemoryUsage();
        console.log('🔄 Svelte Agent initialized');
    }
    /**
     * Instrument Svelte components for performance monitoring
     */
    instrumentSvelteComponents() {
        // Hook into Svelte's component lifecycle
        const originalCreate = window.svelte?.internal?.create_component;
        const originalMount = window.svelte?.internal?.mount_component;
        const originalUpdate = window.svelte?.internal?.update;
        const originalDestroy = window.svelte?.internal?.destroy_component;
        if (originalCreate) {
            window.svelte.internal.create_component = (block, parent_component, props) => {
                const startTime = performance.now();
                const component = originalCreate.call(this, block, parent_component, props);
                const endTime = performance.now();
                this.recordComponentMetric(component, 'create', endTime - startTime, props);
                return component;
            };
        }
        if (originalMount) {
            window.svelte.internal.mount_component = (component, target, anchor) => {
                const startTime = performance.now();
                const result = originalMount.call(this, component, target, anchor);
                const endTime = performance.now();
                this.recordComponentMetric(component, 'mount', endTime - startTime);
                return result;
            };
        }
        if (originalUpdate) {
            window.svelte.internal.update = (component, changed) => {
                const startTime = performance.now();
                const result = originalUpdate.call(this, component, changed);
                const endTime = performance.now();
                this.recordComponentMetric(component, 'update', endTime - startTime);
                return result;
            };
        }
        if (originalDestroy) {
            window.svelte.internal.destroy_component = (component, detaching) => {
                const startTime = performance.now();
                const result = originalDestroy.call(this, component, detaching);
                const endTime = performance.now();
                this.recordComponentMetric(component, 'destroy', endTime - startTime);
                return result;
            };
        }
    }
    /**
     * Instrument Svelte stores for monitoring
     */
    instrumentSvelteStores() {
        // Monitor writable stores
        const originalWritable = window.svelte?.store?.writable;
        if (originalWritable) {
            window.svelte.store.writable = (value, start) => {
                const store = originalWritable(value, start);
                const storeName = this.generateStoreName();
                // Wrap subscribe method
                const originalSubscribe = store.subscribe;
                store.subscribe = (run, invalidate) => {
                    this.updateStoreMetric(storeName, 'subscribe');
                    return originalSubscribe.call(store, run, invalidate);
                };
                // Wrap set method
                const originalSet = store.set;
                store.set = (value) => {
                    const startTime = performance.now();
                    const result = originalSet.call(store, value);
                    this.updateStoreMetric(storeName, 'update', performance.now() - startTime, value);
                    return result;
                };
                return store;
            };
        }
        // Monitor readable stores
        const originalReadable = window.svelte?.store?.readable;
        if (originalReadable) {
            window.svelte.store.readable = (value, start) => {
                const store = originalReadable(value, start);
                const storeName = this.generateStoreName();
                const originalSubscribe = store.subscribe;
                store.subscribe = (run, invalidate) => {
                    this.updateStoreMetric(storeName, 'subscribe');
                    return originalSubscribe.call(store, run, invalidate);
                };
                return store;
            };
        }
    }
    /**
     * Setup mutation observer for DOM changes
     */
    setupMutationObserver() {
        if (typeof window === 'undefined' || !window.MutationObserver)
            return;
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.trackDOMElement(node);
                        }
                    });
                }
            });
        });
        observer.observe(document.body, this.observerConfig);
    }
    /**
     * Track memory usage periodically
     */
    trackMemoryUsage() {
        setInterval(() => {
            if (performance.memory) {
                const memory = performance.memory;
                this.profiler.recordMetric('svelte_memory_usage', {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });
            }
        }, 5000);
    }
    /**
     * Record component performance metrics
     */
    recordComponentMetric(component, operation, duration, props) {
        const componentName = this.getComponentName(component);
        const existing = this.componentMetrics.get(componentName) || {
            name: componentName,
            renderTime: 0,
            updateTime: 0,
            mountTime: 0,
            destroyTime: 0,
            propsCount: 0,
            stateCount: 0,
            computedCount: 0,
            memoryUsage: 0
        };
        switch (operation) {
            case 'create':
                existing.renderTime = duration;
                existing.propsCount = props ? Object.keys(props).length : 0;
                break;
            case 'mount':
                existing.mountTime = duration;
                break;
            case 'update':
                existing.updateTime = duration;
                break;
            case 'destroy':
                existing.destroyTime = duration;
                break;
        }
        this.componentMetrics.set(componentName, existing);
        this.profiler.recordMetric(`svelte_component_${operation}`, {
            component: componentName,
            duration,
            timestamp: Date.now(),
            ...existing
        });
    }
    /**
     * Update store metrics
     */
    updateStoreMetric(storeName, operation, duration, value) {
        const existing = this.storeMetrics.get(storeName) || {
            name: storeName,
            subscriptions: 0,
            updateFrequency: 0,
            valueSize: 0,
            lastUpdate: Date.now()
        };
        switch (operation) {
            case 'subscribe':
                existing.subscriptions++;
                break;
            case 'update':
                existing.updateFrequency++;
                existing.lastUpdate = Date.now();
                existing.valueSize = this.calculateValueSize(value);
                break;
        }
        this.storeMetrics.set(storeName, existing);
        this.profiler.recordMetric(`svelte_store_${operation}`, {
            store: storeName,
            duration: duration || 0,
            timestamp: Date.now(),
            ...existing
        });
    }
    /**
     * Get component name from component instance
     */
    getComponentName(component) {
        if (component && component.constructor) {
            return component.constructor.name || 'SvelteComponent';
        }
        return `Component_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique store name
     */
    generateStoreName() {
        return `Store_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Track DOM elements created by Svelte
     */
    trackDOMElement(element) {
        if (element.hasAttribute && element.hasAttribute('svelte-')) {
            this.profiler.recordMetric('svelte_dom_creation', {
                tagName: element.tagName,
                attributes: element.attributes.length,
                timestamp: Date.now()
            });
        }
    }
    /**
     * Calculate the approximate size of a value in bytes
     */
    calculateValueSize(value) {
        if (value === null || value === undefined)
            return 0;
        if (typeof value === 'string')
            return value.length * 2;
        if (typeof value === 'number')
            return 8;
        if (typeof value === 'boolean')
            return 4;
        if (typeof value === 'object') {
            return JSON.stringify(value).length * 2;
        }
        return 0;
    }
    /**
     * Get current component metrics
     */
    getComponentMetrics() {
        return new Map(this.componentMetrics);
    }
    /**
     * Get current store metrics
     */
    getStoreMetrics() {
        return new Map(this.storeMetrics);
    }
    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const components = Array.from(this.componentMetrics.values());
        const stores = Array.from(this.storeMetrics.values());
        return {
            components: {
                total: components.length,
                averageRenderTime: components.reduce((sum, c) => sum + c.renderTime, 0) / components.length || 0,
                averageUpdateTime: components.reduce((sum, c) => sum + c.updateTime, 0) / components.length || 0,
                slowestComponent: components.sort((a, b) => b.renderTime - a.renderTime)[0]
            },
            stores: {
                total: stores.length,
                totalSubscriptions: stores.reduce((sum, s) => sum + s.subscriptions, 0),
                mostActiveStore: stores.sort((a, b) => b.updateFrequency - a.updateFrequency)[0]
            },
            memory: {
                componentsMemory: components.reduce((sum, c) => sum + c.memoryUsage, 0),
                storesMemory: stores.reduce((sum, s) => sum + s.valueSize, 0)
            }
        };
    }
    /**
     * Stop monitoring and cleanup
     */
    async stop() {
        if (!this.isActive)
            return;
        this.isActive = false;
        await this.profiler.stop();
        this.componentMetrics.clear();
        this.storeMetrics.clear();
        console.log('🛑 Svelte Agent stopped');
    }
    /** TEST COMPATIBILITY WRAPPERS */
    startProfiling() {
        return this.init();
    }
    async stopProfiling() {
        await this.stop();
    }
}
exports.SvelteAgent = SvelteAgent;
// Export default instance
exports.svelteAgent = new SvelteAgent();
// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    exports.svelteAgent.init().catch(console.error);
}
//# sourceMappingURL=index.js.map