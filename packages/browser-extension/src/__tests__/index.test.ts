import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserExtension } from '../index';

describe('BrowserExtension', () => {
  let extension: BrowserExtension;

  beforeEach(() => {
    vi.clearAllMocks();
    extension = new BrowserExtension({
      enableContentScript: true,
      enableDevTools: true,
      enablePopup: true,
      autoInject: true
    });
  });

  it('should initialize correctly', () => {
    expect(extension).toBeDefined();
  });

  it('should initialize in extension environment', async () => {
    expect(() => extension.initialize()).not.toThrow();
  });

  it('should detect extension environment', () => {
    // Extension environment is mocked in setup.ts
    expect(chrome).toBeDefined();
    expect(chrome.runtime).toBeDefined();
    expect(chrome.runtime.id).toBe('test-extension-id');
  });

  it('should get empty metrics initially', () => {
    const metrics = extension.getMetrics();
    expect(metrics).toEqual([]);
  });

  it('should get empty tab data initially', () => {
    const tabData = extension.getTabData();
    expect(Array.isArray(tabData)).toBe(true);
    expect(tabData).toHaveLength(0);
  });

  it('should get performance summary', () => {
    const summary = extension.getPerformanceSummary();
    expect(summary).toBeDefined();
    expect(summary.totalTabs).toBe(0);
    expect(summary.averageLoadTime).toBe(0);
    expect(summary.totalResources).toBe(0);
    expect(summary.totalInteractions).toBe(0);
    expect(summary.totalErrors).toBe(0);
    expect(Array.isArray(summary.slowestTabs)).toBe(true);
  });

  it('should inject content script', async () => {
    const tabId = 123;
    
    await extension.injectContentScript(tabId);
    
    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId },
      files: ['content-script.js']
    });
  });

  it('should clear metrics', () => {
    extension.clearMetrics();
    expect(extension.getMetrics()).toHaveLength(0);
    expect(extension.getTabData()).toHaveLength(0);
  });

  it('should destroy properly', () => {
    extension.destroy();
    expect(extension.getMetrics()).toHaveLength(0);
    expect(extension.getTabData()).toHaveLength(0);
  });

  it('should handle tab data retrieval for specific tab', () => {
    const tabId = 123;
    const tabData = extension.getTabData(tabId);
    
    expect(tabData).toBeDefined();
    expect(typeof tabData).toBe('object');
    expect((tabData as any).tabId).toBe(tabId);
    expect((tabData as any).url).toBe('');
    expect((tabData as any).loadTime).toBe(0);
  });
}); 