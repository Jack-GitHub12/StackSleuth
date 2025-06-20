"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
// Types
__exportStar(require("./types"), exports);
// Base Agent
__exportStar(require("./base-agent"), exports);
// Utilities
__exportStar(require("./utils"), exports);
// Core collector
__exportStar(require("./collector"), exports);
// Profiler Core (main interface)
__exportStar(require("./profiler"), exports);
// Flamegraph utilities
__exportStar(require("./flamegraph"), exports);
// Adaptive sampling
__exportStar(require("./adaptive-sampling"), exports);
// Default configuration
exports.defaultConfig = {
    enabled: true,
    sampling: { rate: 1.0 },
    filters: {},
    output: {
        console: true,
        dashboard: {
            enabled: false,
            port: 3001,
            host: 'localhost'
        }
    }
};
//# sourceMappingURL=index.js.map