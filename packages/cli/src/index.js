#!/usr/bin/env node
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
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const core_1 = require("@stacksleuth/core");
const watch_1 = require("./commands/watch");
const report_1 = require("./commands/report");
const init_1 = require("./commands/init");
const program = new commander_1.Command();
// Dynamic import for chalk to handle ESM compatibility
let chalk;
async function initChalk() {
    if (!chalk) {
        chalk = (await Promise.resolve().then(() => __importStar(require('chalk')))).default;
    }
    return chalk;
}
program
    .name('sleuth')
    .description('StackSleuth - Full-stack performance profiling tool')
    .version('0.1.0');
// ASCII Art Banner function
async function createBanner() {
    const c = await initChalk();
    return `
${c.cyan('┌─────────────────────────────────────┐')}
${c.cyan('│')}  ${c.bold.white('StackSleuth')} - Performance Profiler ${c.cyan('│')}
${c.cyan('└─────────────────────────────────────┘')}
`;
}
// Global collector instance
const collector = new core_1.TraceCollector();
// Watch command - starts profiling in dev mode
program
    .command('watch')
    .description('Start profiling your application in development mode')
    .option('-p, --port <port>', 'Dashboard port', '3001')
    .option('-s, --sampling <rate>', 'Sampling rate (0.0-1.0)', '1.0')
    .option('--no-dashboard', 'Disable dashboard UI')
    .action(async (options) => {
    const watchCmd = new watch_1.WatchCommand(collector);
    await watchCmd.execute(options);
});
// Report command - export trace data
program
    .command('report')
    .description('Export performance traces and generate reports')
    .option('-f, --format <format>', 'Output format (json|csv)', 'json')
    .option('-o, --output <file>', 'Output file path')
    .option('--last <duration>', 'Include traces from last duration (e.g., "5m", "1h")')
    .action(async (options) => {
    const reportCmd = new report_1.ReportCommand(collector);
    await reportCmd.execute(options);
});
// Init command - setup StackSleuth in a project
program
    .command('init')
    .description('Initialize StackSleuth in your project')
    .option('--framework <framework>', 'Framework (react|express|nextjs)', 'express')
    .option('--typescript', 'Use TypeScript configuration')
    .action(async (options) => {
    const initCmd = new init_1.InitCommand();
    await initCmd.execute(options);
});
// Stats command - show current performance statistics
program
    .command('stats')
    .description('Show current performance statistics')
    .action(async () => {
    const c = await initChalk();
    const stats = collector.getStats();
    console.log(c.bold('\n📊 Performance Statistics'));
    console.log(c.gray('─'.repeat(40)));
    console.log(`${c.cyan('Traces:')} ${stats.traces.total}`);
    console.log(`  ${c.gray('Average:')} ${c.white(stats.traces.avg.toFixed(2))}ms`);
    console.log(`  ${c.gray('P95:')} ${c.white(stats.traces.p95.toFixed(2))}ms`);
    console.log(`  ${c.gray('P99:')} ${c.white(stats.traces.p99.toFixed(2))}ms`);
    console.log(`${c.cyan('Spans:')} ${stats.spans.total}`);
    console.log(`  ${c.gray('Average:')} ${c.white(stats.spans.avg.toFixed(2))}ms`);
    console.log(`  ${c.gray('P95:')} ${c.white(stats.spans.p95.toFixed(2))}ms`);
    console.log(`  ${c.gray('P99:')} ${c.white(stats.spans.p99.toFixed(2))}ms\n`);
});
// Error handling
program.exitOverride();
async function main() {
    try {
        // Set banner after chalk is loaded
        const banner = await createBanner();
        program.addHelpText('beforeAll', banner);
        program.parse(process.argv);
    }
    catch (err) {
        if (err.code === 'commander.help') {
            process.exit(0);
        }
        const c = await initChalk();
        console.error(c.red('❌ Error:'), err.message);
        process.exit(1);
    }
    // Show help if no command provided
    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
}
// Run the main function
main().catch(async (err) => {
    const c = await initChalk();
    console.error(c.red('❌ Fatal Error:'), err.message);
    process.exit(1);
});
//# sourceMappingURL=index.js.map