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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchCommand = void 0;
const ora_1 = __importDefault(require("ora"));
const core_1 = require("@stacksleuth/core");
const server_1 = require("../dashboard/server");
// Dynamic import for chalk to handle ESM compatibility
let chalk;
async function initChalk() {
    if (!chalk) {
        chalk = (await Promise.resolve().then(() => __importStar(require('chalk')))).default;
    }
    return chalk;
}
class WatchCommand {
    constructor(collector) {
        this.collector = collector;
    }
    async execute(options) {
        const c = await initChalk();
        const spinner = (0, ora_1.default)('Starting StackSleuth in watch mode...').start();
        try {
            const port = parseInt(options.port);
            const samplingRate = parseFloat(options.sampling);
            // Validate options
            if (isNaN(port) || port < 1 || port > 65535) {
                throw new Error('Invalid port number');
            }
            if (isNaN(samplingRate) || samplingRate < 0 || samplingRate > 1) {
                throw new Error('Sampling rate must be between 0.0 and 1.0');
            }
            // Configure collector for watch mode
            this.collector = new core_1.TraceCollector({
                enabled: true,
                sampling: { rate: samplingRate },
                output: {
                    console: true,
                    dashboard: {
                        enabled: options.dashboard,
                        port,
                        host: 'localhost'
                    }
                }
            });
            // Set up event listeners for real-time feedback
            this.setupEventListeners();
            // Start dashboard if enabled
            if (options.dashboard) {
                this.dashboardServer = new server_1.DashboardServer(this.collector, port);
                await this.dashboardServer.start();
            }
            spinner.succeed('StackSleuth is now watching your application');
            // Display configuration
            console.log(c.gray('\n📋 Configuration:'));
            console.log(`  ${c.cyan('Sampling Rate:')} ${samplingRate * 100}%`);
            console.log(`  ${c.cyan('Dashboard:')} ${options.dashboard ?
                c.green(`Enabled at http://localhost:${port}`) :
                c.yellow('Disabled')}`);
            // Show instructions
            console.log(c.gray('\n💡 Instructions:'));
            console.log('  • Make requests to your application to see traces');
            console.log('  • Performance issues will be highlighted in real-time');
            console.log('  • Press Ctrl+C to stop profiling\n');
            // Keep the process alive
            await this.waitForExit();
        }
        catch (error) {
            spinner.fail(`Failed to start watch mode: ${error.message}`);
            process.exit(1);
        }
    }
    setupEventListeners() {
        // Real-time trace logging
        this.collector.on('trace:completed', async (trace) => {
            const c = await initChalk();
            const duration = trace.timing.duration || 0;
            const status = trace.status;
            let statusColor = c.green;
            if (status === 'error')
                statusColor = c.red;
            else if (duration > 1000)
                statusColor = c.yellow;
            console.log(`${c.gray('[')}${new Date().toISOString()}${c.gray(']')} ` +
                `${statusColor(trace.name)} ` +
                `${c.gray('(')}${duration.toFixed(2)}ms${c.gray(')')} ` +
                `${c.gray('spans:')} ${trace.spans.length}`);
        });
        // Performance issue alerts
        this.collector.on('performance:issue', async (issue) => {
            const c = await initChalk();
            let severityColor = c.yellow;
            let icon = '⚠️';
            switch (issue.severity) {
                case 'critical':
                    severityColor = c.red;
                    icon = '🚨';
                    break;
                case 'high':
                    severityColor = c.red;
                    icon = '❗';
                    break;
                case 'medium':
                    severityColor = c.yellow;
                    icon = '⚠️';
                    break;
                case 'low':
                    severityColor = c.gray;
                    icon = 'ℹ️';
                    break;
            }
            console.log(`\n${icon} ${severityColor.bold(issue.severity.toUpperCase())} ` +
                `${c.white(issue.message)}`);
            if (issue.suggestion) {
                console.log(`   ${c.gray('💡 Suggestion:')} ${issue.suggestion}\n`);
            }
        });
        // Span performance logging for very slow operations
        this.collector.on('span:completed', async (span) => {
            const c = await initChalk();
            const duration = span.timing.duration || 0;
            if (duration > 500) { // Log spans slower than 500ms
                console.log(`   ${c.red('🐌 Slow span:')} ${span.name} ` +
                    `${c.gray('(')}${duration.toFixed(2)}ms${c.gray(')')}`);
            }
        });
    }
    async waitForExit() {
        return new Promise((resolve) => {
            process.on('SIGINT', async () => {
                const c = await initChalk();
                console.log(c.yellow('\n🛑 Shutting down StackSleuth...'));
                // Stop dashboard server
                if (this.dashboardServer) {
                    await this.dashboardServer.stop();
                }
                // Show final statistics
                const stats = this.collector.getStats();
                console.log(c.gray('\n📊 Final Statistics:'));
                console.log(`  ${c.cyan('Total Traces:')} ${stats.traces.total}`);
                console.log(`  ${c.cyan('Total Spans:')} ${stats.spans.total}`);
                console.log(`  ${c.cyan('Average Trace Duration:')} ${stats.traces.avg.toFixed(2)}ms`);
                console.log(c.green('\n✅ StackSleuth stopped successfully'));
                resolve();
            });
        });
    }
}
exports.WatchCommand = WatchCommand;
//# sourceMappingURL=watch.js.map