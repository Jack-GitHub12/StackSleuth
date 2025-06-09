#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { TraceCollector } from '@stacksleuth/core';
import { WatchCommand } from './commands/watch';
import { ReportCommand } from './commands/report';
import { InitCommand } from './commands/init';

const program = new Command();

program
  .name('sleuth')
  .description('StackSleuth - Full-stack performance profiling tool')
  .version('0.1.0');

// ASCII Art Banner
const banner = `
${chalk.cyan('┌─────────────────────────────────────┐')}
${chalk.cyan('│')}  ${chalk.bold.white('StackSleuth')} - Performance Profiler ${chalk.cyan('│')}
${chalk.cyan('└─────────────────────────────────────┘')}
`;

program.addHelpText('beforeAll', banner);

// Global collector instance
const collector = new TraceCollector();

// Watch command - starts profiling in dev mode
program
  .command('watch')
  .description('Start profiling your application in development mode')
  .option('-p, --port <port>', 'Dashboard port', '3001')
  .option('-s, --sampling <rate>', 'Sampling rate (0.0-1.0)', '1.0')
  .option('--no-dashboard', 'Disable dashboard UI')
  .action(async (options) => {
    const watchCmd = new WatchCommand(collector);
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
    const reportCmd = new ReportCommand(collector);
    await reportCmd.execute(options);
  });

// Init command - setup StackSleuth in a project
program
  .command('init')
  .description('Initialize StackSleuth in your project')
  .option('--framework <framework>', 'Framework (react|express|nextjs)', 'express')
  .option('--typescript', 'Use TypeScript configuration')
  .action(async (options) => {
    const initCmd = new InitCommand();
    await initCmd.execute(options);
  });

// Stats command - show current performance statistics
program
  .command('stats')
  .description('Show current performance statistics')
  .action(() => {
    const stats = collector.getStats();
    
    console.log(chalk.bold('\n📊 Performance Statistics'));
    console.log(chalk.gray('─'.repeat(40)));
    
    console.log(`${chalk.cyan('Traces:')} ${stats.traces.total}`);
    console.log(`  ${chalk.gray('Average:')} ${chalk.white(stats.traces.avg.toFixed(2))}ms`);
    console.log(`  ${chalk.gray('P95:')} ${chalk.white(stats.traces.p95.toFixed(2))}ms`);
    console.log(`  ${chalk.gray('P99:')} ${chalk.white(stats.traces.p99.toFixed(2))}ms`);
    
    console.log(`${chalk.cyan('Spans:')} ${stats.spans.total}`);
    console.log(`  ${chalk.gray('Average:')} ${chalk.white(stats.spans.avg.toFixed(2))}ms`);
    console.log(`  ${chalk.gray('P95:')} ${chalk.white(stats.spans.p95.toFixed(2))}ms`);
    console.log(`  ${chalk.gray('P99:')} ${chalk.white(stats.spans.p99.toFixed(2))}ms\n`);
  });

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (err: any) {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red('❌ Error:'), err.message);
  process.exit(1);
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 