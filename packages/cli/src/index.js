#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const core_1 = require("@stacksleuth/core");
const watch_1 = require("./commands/watch");
const report_1 = require("./commands/report");
const init_1 = require("./commands/init");
const program = new commander_1.Command();
program
    .name('sleuth')
    .description('StackSleuth - Full-stack performance profiling tool')
    .version('0.1.0');
// ASCII Art Banner
const banner = `
${chalk_1.default.cyan('┌─────────────────────────────────────┐')}
${chalk_1.default.cyan('│')}  ${chalk_1.default.bold.white('StackSleuth')} - Performance Profiler ${chalk_1.default.cyan('│')}
${chalk_1.default.cyan('└─────────────────────────────────────┘')}
`;
program.addHelpText('beforeAll', banner);
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
    .action(() => {
    const stats = collector.getStats();
    console.log(chalk_1.default.bold('\n📊 Performance Statistics'));
    console.log(chalk_1.default.gray('─'.repeat(40)));
    console.log(`${chalk_1.default.cyan('Traces:')} ${stats.traces.total}`);
    console.log(`  ${chalk_1.default.gray('Average:')} ${chalk_1.default.white(stats.traces.avg.toFixed(2))}ms`);
    console.log(`  ${chalk_1.default.gray('P95:')} ${chalk_1.default.white(stats.traces.p95.toFixed(2))}ms`);
    console.log(`  ${chalk_1.default.gray('P99:')} ${chalk_1.default.white(stats.traces.p99.toFixed(2))}ms`);
    console.log(`${chalk_1.default.cyan('Spans:')} ${stats.spans.total}`);
    console.log(`  ${chalk_1.default.gray('Average:')} ${chalk_1.default.white(stats.spans.avg.toFixed(2))}ms`);
    console.log(`  ${chalk_1.default.gray('P95:')} ${chalk_1.default.white(stats.spans.p95.toFixed(2))}ms`);
    console.log(`  ${chalk_1.default.gray('P99:')} ${chalk_1.default.white(stats.spans.p99.toFixed(2))}ms\n`);
});
// Error handling
program.exitOverride();
try {
    program.parse(process.argv);
}
catch (err) {
    if (err.code === 'commander.help') {
        process.exit(0);
    }
    console.error(chalk_1.default.red('❌ Error:'), err.message);
    process.exit(1);
}
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map