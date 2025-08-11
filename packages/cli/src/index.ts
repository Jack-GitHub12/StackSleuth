#!/usr/bin/env node

import { Command } from 'commander';
import { TraceCollector } from '@stacksleuth/core';
import { WatchCommand } from './commands/watch';
import { ReportCommand } from './commands/report';
import { InitCommand } from './commands/init';

const program = new Command();

// Dynamic import for chalk to handle ESM/CJS compatibility without TS rewriting
let chalk: any;

async function initChalk() {
  if (chalk) return chalk;
  try {
    // Use native dynamic import at runtime to support ESM-only chalk@5
    const mod: any = await (Function('return import("chalk")')() as Promise<any>);
    chalk = mod.default ?? mod;
  } catch {
    // Fallback to CJS require for chalk@4
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createRequire } = require('module');
    const req = createRequire(__filename);
    chalk = req('chalk');
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
const collector = new TraceCollector();

// Watch command - starts profiling in dev mode
program
  .command('watch')
  .description('Start profiling your application in development mode')
  .option('-p, --port <port>', 'Dashboard port', '3001')
  .option('-s, --sampling <rate>', 'Sampling rate (0.0-1.0)', '1.0')
  .option('--no-dashboard', 'Disable dashboard UI')
  .option('-t, --timeout <seconds>', 'Auto-stop after N seconds (useful for CI/tests)')
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
  .option('-y, --yes', 'Use defaults and skip interactive prompts')
  .option('--non-interactive', 'Alias for --yes')
  .action(async (options) => {
    const initCmd = new InitCommand();
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
  } catch (err: any) {
    if (err.code === 'commander.help' || err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
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