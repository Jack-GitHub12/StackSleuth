"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock Chrome APIs for testing
const mockChrome = {
    runtime: {
        id: 'test-extension-id',
        onMessage: {
            addListener: vitest_1.vi.fn()
        },
        sendMessage: vitest_1.vi.fn()
    },
    tabs: {
        onUpdated: {
            addListener: vitest_1.vi.fn()
        },
        onRemoved: {
            addListener: vitest_1.vi.fn()
        },
        query: vitest_1.vi.fn()
    },
    scripting: {
        executeScript: vitest_1.vi.fn()
    },
    devtools: {
        panels: {
            create: vitest_1.vi.fn()
        }
    }
};
// @ts-ignore
global.chrome = mockChrome;
//# sourceMappingURL=setup.js.map