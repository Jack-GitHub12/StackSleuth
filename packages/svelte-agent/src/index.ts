import { ProfilerCore, PerformanceMetrics } from '@stacksleuth/core';

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

export class SvelteAgent {
  private profiler: ProfilerCore;
  private componentMetrics: Map<string, SvelteComponentMetrics> = new Map();
  private storeMetrics: Map<string, SvelteStoreMetrics> = new Map();
  private isActive: boolean = false;
  private observerConfig = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true
  };

  constructor(config?: { endpoint?: string; apiKey?: string; sampleRate?: number }) {
    this.profiler = new ProfilerCore(config);
  }

  /**
   * Initialize the Svelte agent and start monitoring
   */
  public async init(): Promise<void> {
    if (this.isActive) return;
    
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
  private instrumentSvelteComponents(): void {
    // Hook into Svelte's component lifecycle
    const originalCreate = (window as any).svelte?.internal?.create_component;
    const originalMount = (window as any).svelte?.internal?.mount_component;
    const originalUpdate = (window as any).svelte?.internal?.update;
    const originalDestroy = (window as any).svelte?.internal?.destroy_component;

    if (originalCreate) {
      (window as any).svelte.internal.create_component = (block: any, parent_component: any, props: any) => {
        const startTime = performance.now();
        const component = originalCreate.call(this, block, parent_component, props);
        const endTime = performance.now();
        
        this.recordComponentMetric(component, 'create', endTime - startTime, props);
        return component;
      };
    }

    if (originalMount) {
      (window as any).svelte.internal.mount_component = (component: any, target: any, anchor: any) => {
        const startTime = performance.now();
        const result = originalMount.call(this, component, target, anchor);
        const endTime = performance.now();
        
        this.recordComponentMetric(component, 'mount', endTime - startTime);
        return result;
      };
    }

    if (originalUpdate) {
      (window as any).svelte.internal.update = (component: any, changed: any) => {
        const startTime = performance.now();
        const result = originalUpdate.call(this, component, changed);
        const endTime = performance.now();
        
        this.recordComponentMetric(component, 'update', endTime - startTime);
        return result;
      };
    }

    if (originalDestroy) {
      (window as any).svelte.internal.destroy_component = (component: any, detaching: boolean) => {
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
  private instrumentSvelteStores(): void {
    // Monitor writable stores
    const originalWritable = (window as any).svelte?.store?.writable;
    if (originalWritable) {
      (window as any).svelte.store.writable = (value: any, start?: any) => {
        const store = originalWritable(value, start);
        const storeName = this.generateStoreName();
        
        // Wrap subscribe method
        const originalSubscribe = store.subscribe;
        store.subscribe = (run: any, invalidate?: any) => {
          this.updateStoreMetric(storeName, 'subscribe');
          return originalSubscribe.call(store, run, invalidate);
        };

        // Wrap set method
        const originalSet = store.set;
        store.set = (value: any) => {
          const startTime = performance.now();
          const result = originalSet.call(store, value);
          this.updateStoreMetric(storeName, 'update', performance.now() - startTime, value);
          return result;
        };

        return store;
      };
    }

    // Monitor readable stores
    const originalReadable = (window as any).svelte?.store?.readable;
    if (originalReadable) {
      (window as any).svelte.store.readable = (value: any, start?: any) => {
        const store = originalReadable(value, start);
        const storeName = this.generateStoreName();
        
        const originalSubscribe = store.subscribe;
        store.subscribe = (run: any, invalidate?: any) => {
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
  private setupMutationObserver(): void {
    if (typeof window === 'undefined' || !window.MutationObserver) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.trackDOMElement(node as Element);
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
  private trackMemoryUsage(): void {
    setInterval(() => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
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
  private recordComponentMetric(component: any, operation: string, duration: number, props?: any): void {
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
  private updateStoreMetric(storeName: string, operation: string, duration?: number, value?: any): void {
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
  private getComponentName(component: any): string {
    if (component && component.constructor) {
      return component.constructor.name || 'SvelteComponent';
    }
    return `Component_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique store name
   */
  private generateStoreName(): string {
    return `Store_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track DOM elements created by Svelte
   */
  private trackDOMElement(element: Element): void {
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
  private calculateValueSize(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return value.length * 2;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 0;
  }

  /**
   * Get current component metrics
   */
  public getComponentMetrics(): Map<string, SvelteComponentMetrics> {
    return new Map(this.componentMetrics);
  }

  /**
   * Get current store metrics
   */
  public getStoreMetrics(): Map<string, SvelteStoreMetrics> {
    return new Map(this.storeMetrics);
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): any {
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
  public async stop(): Promise<void> {
    if (!this.isActive) return;
    
    this.isActive = false;
    await this.profiler.stop();
    this.componentMetrics.clear();
    this.storeMetrics.clear();
    
    console.log('🛑 Svelte Agent stopped');
  }

  /** TEST COMPATIBILITY WRAPPERS */
  public startProfiling(): Promise<void> {
    return this.init();
  }

  public async stopProfiling(): Promise<void> {
    await this.stop();
  }
}

// Export default instance
export const svelteAgent = new SvelteAgent();

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  svelteAgent.init().catch(console.error);
} 