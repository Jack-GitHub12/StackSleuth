"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("../index");
// Mock DOM elements for testing
Object.defineProperty(global, 'document', {
    value: {
        addEventListener: vitest_1.vi.fn(),
        removeEventListener: vitest_1.vi.fn(),
        querySelectorAll: vitest_1.vi.fn(() => []),
        body: { appendChild: vitest_1.vi.fn() }
    }
});
Object.defineProperty(global, 'window', {
    value: {
        addEventListener: vitest_1.vi.fn(),
        removeEventListener: vitest_1.vi.fn(),
        performance: {
            now: vitest_1.vi.fn(() => Date.now()),
            getEntriesByType: vitest_1.vi.fn(() => [])
        }
    }
});
(0, vitest_1.describe)('SessionReplayAgent', () => {
    let agent;
    (0, vitest_1.beforeEach)(() => {
        agent = new index_1.SessionReplayAgent({
            bufferSize: 100,
            flushInterval: 1000,
            enablePrivacyMode: true
        });
    });
    (0, vitest_1.it)('should initialize correctly', () => {
        (0, vitest_1.expect)(agent).toBeDefined();
    });
    (0, vitest_1.it)('should start recording', () => {
        (0, vitest_1.expect)(() => agent.startRecording()).not.toThrow();
    });
    (0, vitest_1.it)('should stop recording', () => {
        agent.startRecording();
        (0, vitest_1.expect)(() => agent.stopRecording()).not.toThrow();
    });
    (0, vitest_1.it)('should export session data', () => {
        agent.startRecording();
        const sessionData = agent.exportSession();
        (0, vitest_1.expect)(sessionData).toBeDefined();
        (0, vitest_1.expect)(sessionData.sessionId).toBeDefined();
        (0, vitest_1.expect)(Array.isArray(sessionData.events)).toBe(true);
    });
    (0, vitest_1.it)('should clear session data', () => {
        agent.startRecording();
        agent.clearSession();
        const sessionData = agent.exportSession();
        (0, vitest_1.expect)(sessionData.events).toHaveLength(0);
    });
    (0, vitest_1.it)('should record custom events', () => {
        agent.startRecording();
        agent.recordCustomEvent('test-event', { data: 'test' });
        const sessionData = agent.exportSession();
        const customEvents = sessionData.events.filter(e => e.type === 'custom');
        (0, vitest_1.expect)(customEvents.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=index.test.js.map