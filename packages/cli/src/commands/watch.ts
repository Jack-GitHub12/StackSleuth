import ora from 'ora';
import { TraceCollector } from '@stacksleuth/core';
import { DashboardServer } from '../dashboard/server';

interface WatchOptions {
  port: string;
  sampling: string;
  dashboard: boolean;
  timeout?: string;
}

// Dynamic import for chalk to handle ESM compatibility
let chalk: any;

async function initChalk() {
  if (!chalk) {
    chalk = (await import('chalk')).default;
  }
  return chalk;
}

export class WatchCommand {
  private collector: TraceCollector;
  private dashboardServer?: DashboardServer;

  constructor(collector: TraceCollector) {
    this.collector = collector;
  }

  async execute(options: WatchOptions): Promise<void> {
    const c = await initChalk();
    const spinner = ora('Starting StackSleuth in watch mode...').start();

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
      this.collector = new TraceCollector({
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
        this.dashboardServer = new DashboardServer(this.collector, port);
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

      // Keep the process alive or auto-stop for tests/CI
      if (options.timeout) {
        const seconds = parseInt(options.timeout, 10);
        if (!isNaN(seconds) && seconds > 0) {
          setTimeout(async () => {
            spinner.info(`Auto-stopping after ${seconds}s (timeout)`);
            await this.shutdown();
            process.exit(0);
          }, seconds * 1000);
        }
      }

      await this.waitForExit();

    } catch (error: any) {
      spinner.fail(`Failed to start watch mode: ${error.message}`);
      process.exit(1);
    }
  }

  private setupEventListeners(): void {
    // Real-time trace logging
    this.collector.on('trace:completed', async (trace) => {
      const c = await initChalk();
      const duration = trace.timing.duration || 0;
      const status = trace.status;
      
      let statusColor = c.green;
      if (status === 'error') statusColor = c.red;
      else if (duration > 1000) statusColor = c.yellow;

      console.log(
        `${c.gray('[')}${new Date().toISOString()}${c.gray(']')} ` +
        `${statusColor(trace.name)} ` +
        `${c.gray('(')}${duration.toFixed(2)}ms${c.gray(')')} ` +
        `${c.gray('spans:')} ${trace.spans.length}`
      );
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

      console.log(
        `\n${icon} ${severityColor.bold(issue.severity.toUpperCase())} ` +
        `${c.white(issue.message)}`
      );
      
      if (issue.suggestion) {
        console.log(`   ${c.gray('💡 Suggestion:')} ${issue.suggestion}\n`);
      }
    });

    // Span performance logging for very slow operations
    this.collector.on('span:completed', async (span) => {
      const c = await initChalk();
      const duration = span.timing.duration || 0;
      
      if (duration > 500) { // Log spans slower than 500ms
        console.log(
          `   ${c.red('🐌 Slow span:')} ${span.name} ` +
          `${c.gray('(')}${duration.toFixed(2)}ms${c.gray(')')}`
        );
      }
    });
  }

  private async waitForExit(): Promise<void> {
    return new Promise((resolve) => {
      process.on('SIGINT', async () => {
        const c = await initChalk();
        console.log(c.yellow('\n🛑 Shutting down StackSleuth...'));
        await this.shutdown();
        resolve();
      });
    });
  }

  private async shutdown(): Promise<void> {
    const c = await initChalk();
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
  }
} 