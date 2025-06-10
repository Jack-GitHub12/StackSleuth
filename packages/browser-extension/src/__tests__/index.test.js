"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
(0, vitest_1.describe)('BrowserExtension', () => {
    let extension;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        extension = new index_1.BrowserExtension({
            enableContentScript: true,
            enableDevTools: true,
            enablePopup: true,
            autoInject: true
        });
    });
    (0, vitest_1.it)('should initialize correctly', () => {
        (0, vitest_1.expect)(extension).toBeDefined();
    });
    (0, vitest_1.it)('should initialize in extension environment', async () => {
        (0, vitest_1.expect)(() => extension.initialize()).not.toThrow();
    });
    (0, vitest_1.it)('should detect extension environment', () => {
        // Extension environment is mocked in setup.ts
        (0, vitest_1.expect)(chrome).toBeDefined();
        (0, vitest_1.expect)(chrome.runtime).toBeDefined();
        (0, vitest_1.expect)(chrome.runtime.id).toBe('test-extension-id');
    });
    (0, vitest_1.it)('should get empty metrics initially', () => {
        const metrics = extension.getMetrics();
        (0, vitest_1.expect)(metrics).toEqual([]);
    });
    (0, vitest_1.it)('should get empty tab data initially', () => {
        const tabData = extension.getTabData();
        (0, vitest_1.expect)(Array.isArray(tabData)).toBe(true);
        (0, vitest_1.expect)(tabData).toHaveLength(0);
    });
    (0, vitest_1.it)('should get performance summary', () => {
        const summary = extension.getPerformanceSummary();
        (0, vitest_1.expect)(summary).toBeDefined();
        (0, vitest_1.expect)(summary.totalTabs).toBe(0);
        (0, vitest_1.expect)(summary.averageLoadTime).toBe(0);
        (0, vitest_1.expect)(summary.totalResources).toBe(0);
        (0, vitest_1.expect)(summary.totalInteractions).toBe(0);
        (0, vitest_1.expect)(summary.totalErrors).toBe(0);
        (0, vitest_1.expect)(Array.isArray(summary.slowestTabs)).toBe(true);
    });
    (0, vitest_1.it)('should inject content script', async () => {
        const tabId = 123;
        await extension.injectContentScript(tabId);
        (0, vitest_1.expect)(chrome.scripting.executeScript).toHaveBeenCalledWith({
            target: { tabId },
            files: ['content-script.js']
        });
    });
    (0, vitest_1.it)('should clear metrics', () => {
        extension.clearMetrics();
        (0, vitest_1.expect)(extension.getMetrics()).toHaveLength(0);
        (0, vitest_1.expect)(extension.getTabData()).toHaveLength(0);
    });
    (0, vitest_1.it)('should destroy properly', () => {
        extension.destroy();
        (0, vitest_1.expect)(extension.getMetrics()).toHaveLength(0);
        (0, vitest_1.expect)(extension.getTabData()).toHaveLength(0);
    });
    (0, vitest_1.it)('should handle tab data retrieval for specific tab', () => {
        const tabId = 123;
        const tabData = extension.getTabData(tabId);
        (0, vitest_1.expect)(tabData).toBeDefined();
        (0, vitest_1.expect)(typeof tabData).toBe('object');
        (0, vitest_1.expect)(tabData.tabId).toBe(tabId);
        (0, vitest_1.expect)(tabData.url).toBe('');
        (0, vitest_1.expect)(tabData.loadTime).toBe(0);
    });
});
//# sourceMappingURL=index.test.js.map