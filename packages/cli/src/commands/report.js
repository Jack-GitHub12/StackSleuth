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
exports.ReportCommand = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const core_1 = require("@stacksleuth/core");
// Dynamic import for chalk to handle ESM compatibility
let chalk;
async function initChalk() {
    if (!chalk) {
        chalk = (await Promise.resolve().then(() => __importStar(require('chalk')))).default;
    }
    return chalk;
}
class ReportCommand {
    constructor(collector) {
        this.collector = collector;
    }
    async execute(options) {
        try {
            const c = await initChalk();
            console.log(c.blue('📊 Generating performance report...'));
            // Get traces based on time filter
            let traces = this.collector.getAllTraces();
            if (options.last) {
                const timeRange = this.parseTimeRange(options.last);
                const cutoff = Date.now() - timeRange;
                traces = this.collector.getTracesByTimeRange(cutoff, Date.now());
            }
            if (traces.length === 0) {
                console.log(c.yellow('⚠️  No traces found for the specified criteria'));
                return;
            }
            // Generate report
            const report = this.generateReport(traces, options.format);
            // Output to file or console
            if (options.output) {
                const outputPath = path_1.default.resolve(options.output);
                fs_1.default.writeFileSync(outputPath, report);
                console.log(c.green(`✅ Report saved to: ${outputPath}`));
            }
            else {
                console.log('\n' + report);
            }
            // Show summary statistics
            await this.showSummary(traces);
        }
        catch (error) {
            const c = await initChalk();
            console.error(c.red('❌ Error generating report:'), error.message);
            process.exit(1);
        }
    }
    parseTimeRange(timeStr) {
        const match = timeStr.match(/^(\d+)([mhd])$/);
        if (!match) {
            throw new Error('Invalid time format. Use format like "5m", "2h", "1d"');
        }
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 'm': return value * 60 * 1000; // minutes to ms
            case 'h': return value * 60 * 60 * 1000; // hours to ms
            case 'd': return value * 24 * 60 * 60 * 1000; // days to ms
            default: throw new Error('Invalid time unit');
        }
    }
    generateReport(traces, format) {
        if (format === 'json') {
            return JSON.stringify({
                metadata: {
                    generatedAt: new Date().toISOString(),
                    traceCount: traces.length,
                    timeRange: {
                        start: Math.min(...traces.map(t => t.timing.start.millis)),
                        end: Math.max(...traces.map(t => t.timing.start.millis))
                    }
                },
                traces,
                summary: this.generateSummary(traces)
            }, null, 2);
        }
        // CSV format
        const headers = [
            'Trace ID', 'Name', 'Duration (ms)', 'Status', 'Span Count',
            'Start Time', 'Has Errors', 'Slowest Span'
        ];
        const rows = traces.map(trace => {
            const slowestSpan = trace.spans.reduce((prev, curr) => (curr.timing.duration || 0) > (prev.timing.duration || 0) ? curr : prev, { timing: { duration: 0 }, name: 'N/A' });
            return [
                trace.id,
                trace.name,
                trace.timing.duration || 0,
                trace.status,
                trace.spans.length,
                new Date(trace.timing.start.millis).toISOString(),
                trace.spans.some((s) => s.errors?.length > 0) ? 'Yes' : 'No',
                slowestSpan.name
            ];
        });
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    generateSummary(traces) {
        const durations = traces
            .filter(t => t.timing.duration !== undefined)
            .map(t => t.timing.duration);
        const spanCounts = traces.map(t => t.spans.length);
        const errorCount = traces.filter(t => t.status === 'error').length;
        const slowTraces = traces.filter(t => (t.timing.duration || 0) > 1000).length;
        return {
            performance: core_1.PerformanceUtils.calculateStats(durations),
            spans: {
                total: spanCounts.reduce((a, b) => a + b, 0),
                avg: spanCounts.length > 0 ? spanCounts.reduce((a, b) => a + b, 0) / spanCounts.length : 0,
                max: Math.max(...spanCounts, 0)
            },
            errors: {
                count: errorCount,
                percentage: traces.length > 0 ? (errorCount / traces.length) * 100 : 0
            },
            slowTraces: {
                count: slowTraces,
                percentage: traces.length > 0 ? (slowTraces / traces.length) * 100 : 0
            }
        };
    }
    async showSummary(traces) {
        const c = await initChalk();
        const summary = this.generateSummary(traces);
        console.log(c.bold('\n📈 Report Summary'));
        console.log(c.gray('─'.repeat(50)));
        console.log(`${c.cyan('Traces Analyzed:')} ${traces.length}`);
        console.log(`${c.cyan('Time Range:')} ${core_1.PerformanceUtils.formatDuration(summary.performance.min)} - ${core_1.PerformanceUtils.formatDuration(summary.performance.max)}`);
        console.log(`${c.cyan('Average Duration:')} ${core_1.PerformanceUtils.formatDuration(summary.performance.avg)}`);
        console.log(`${c.cyan('P95 Duration:')} ${core_1.PerformanceUtils.formatDuration(summary.performance.p95)}`);
        console.log(`${c.cyan('P99 Duration:')} ${core_1.PerformanceUtils.formatDuration(summary.performance.p99)}`);
        if (summary.errors.count > 0) {
            console.log(`${c.red('Errors:')} ${summary.errors.count} (${summary.errors.percentage.toFixed(1)}%)`);
        }
        if (summary.slowTraces.count > 0) {
            console.log(`${c.yellow('Slow Traces (>1s):')} ${summary.slowTraces.count} (${summary.slowTraces.percentage.toFixed(1)}%)`);
        }
        console.log(`${c.cyan('Total Spans:')} ${summary.spans.total}`);
        console.log(`${c.cyan('Average Spans per Trace:')} ${summary.spans.avg.toFixed(1)}`);
        console.log('');
    }
}
exports.ReportCommand = ReportCommand;
//# sourceMappingURL=report.js.map