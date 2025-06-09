"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const core_1 = require("@stacksleuth/core");
const server_1 = require("../dashboard/server");
class WatchCommand {
    constructor(collector) {
        this.collector = collector;
    }
    async execute(options) {
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
            console.log(chalk_1.default.gray('\n📋 Configuration:'));
            console.log(`  ${chalk_1.default.cyan('Sampling Rate:')} ${samplingRate * 100}%`);
            console.log(`  ${chalk_1.default.cyan('Dashboard:')} ${options.dashboard ?
                chalk_1.default.green(`Enabled at http://localhost:${port}`) :
                chalk_1.default.yellow('Disabled')}`);
            // Show instructions
            console.log(chalk_1.default.gray('\n💡 Instructions:'));
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
        this.collector.on('trace:completed', (trace) => {
            const duration = trace.timing.duration || 0;
            const status = trace.status;
            let statusColor = chalk_1.default.green;
            if (status === 'error')
                statusColor = chalk_1.default.red;
            else if (duration > 1000)
                statusColor = chalk_1.default.yellow;
            console.log(`${chalk_1.default.gray('[')}${new Date().toISOString()}${chalk_1.default.gray(']')} ` +
                `${statusColor(trace.name)} ` +
                `${chalk_1.default.gray('(')}${duration.toFixed(2)}ms${chalk_1.default.gray(')')} ` +
                `${chalk_1.default.gray('spans:')} ${trace.spans.length}`);
        });
        // Performance issue alerts
        this.collector.on('performance:issue', (issue) => {
            let severityColor = chalk_1.default.yellow;
            let icon = '⚠️';
            switch (issue.severity) {
                case 'critical':
                    severityColor = chalk_1.default.red;
                    icon = '🚨';
                    break;
                case 'high':
                    severityColor = chalk_1.default.red;
                    icon = '❗';
                    break;
                case 'medium':
                    severityColor = chalk_1.default.yellow;
                    icon = '⚠️';
                    break;
                case 'low':
                    severityColor = chalk_1.default.gray;
                    icon = 'ℹ️';
                    break;
            }
            console.log(`\n${icon} ${severityColor.bold(issue.severity.toUpperCase())} ` +
                `${chalk_1.default.white(issue.message)}`);
            if (issue.suggestion) {
                console.log(`   ${chalk_1.default.gray('💡 Suggestion:')} ${issue.suggestion}\n`);
            }
        });
        // Span performance logging for very slow operations
        this.collector.on('span:completed', (span) => {
            const duration = span.timing.duration || 0;
            if (duration > 500) { // Log spans slower than 500ms
                console.log(`   ${chalk_1.default.red('🐌 Slow span:')} ${span.name} ` +
                    `${chalk_1.default.gray('(')}${duration.toFixed(2)}ms${chalk_1.default.gray(')')}`);
            }
        });
    }
    async waitForExit() {
        return new Promise((resolve) => {
            process.on('SIGINT', async () => {
                console.log(chalk_1.default.yellow('\n🛑 Shutting down StackSleuth...'));
                // Stop dashboard server
                if (this.dashboardServer) {
                    await this.dashboardServer.stop();
                }
                // Show final statistics
                const stats = this.collector.getStats();
                console.log(chalk_1.default.gray('\n📊 Final Statistics:'));
                console.log(`  ${chalk_1.default.cyan('Total Traces:')} ${stats.traces.total}`);
                console.log(`  ${chalk_1.default.cyan('Total Spans:')} ${stats.spans.total}`);
                console.log(`  ${chalk_1.default.cyan('Average Trace Duration:')} ${stats.traces.avg.toFixed(2)}ms`);
                console.log(chalk_1.default.green('\n✅ StackSleuth stopped successfully'));
                resolve();
            });
        });
    }
}
exports.WatchCommand = WatchCommand;
//# sourceMappingURL=watch.js.map