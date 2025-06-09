import chalk from 'chalk';
import ora from 'ora';
import { TraceCollector } from '@stacksleuth/core';
import { DashboardServer } from '../dashboard/server';

interface WatchOptions {
  port: string;
  sampling: string;
  dashboard: boolean;
}

export class WatchCommand {
  private collector: TraceCollector;
  private dashboardServer?: DashboardServer;

  constructor(collector: TraceCollector) {
    this.collector = collector;
  }

  async execute(options: WatchOptions): Promise<void> {
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
      console.log(chalk.gray('\n📋 Configuration:'));
      console.log(`  ${chalk.cyan('Sampling Rate:')} ${samplingRate * 100}%`);
      console.log(`  ${chalk.cyan('Dashboard:')} ${options.dashboard ? 
        chalk.green(`Enabled at http://localhost:${port}`) : 
        chalk.yellow('Disabled')}`);

      // Show instructions
      console.log(chalk.gray('\n💡 Instructions:'));
      console.log('  • Make requests to your application to see traces');
      console.log('  • Performance issues will be highlighted in real-time');
      console.log('  • Press Ctrl+C to stop profiling\n');

      // Keep the process alive
      await this.waitForExit();

    } catch (error: any) {
      spinner.fail(`Failed to start watch mode: ${error.message}`);
      process.exit(1);
    }
  }

  private setupEventListeners(): void {
    // Real-time trace logging
    this.collector.on('trace:completed', (trace) => {
      const duration = trace.timing.duration || 0;
      const status = trace.status;
      
      let statusColor = chalk.green;
      if (status === 'error') statusColor = chalk.red;
      else if (duration > 1000) statusColor = chalk.yellow;

      console.log(
        `${chalk.gray('[')}${new Date().toISOString()}${chalk.gray(']')} ` +
        `${statusColor(trace.name)} ` +
        `${chalk.gray('(')}${duration.toFixed(2)}ms${chalk.gray(')')} ` +
        `${chalk.gray('spans:')} ${trace.spans.length}`
      );
    });

    // Performance issue alerts
    this.collector.on('performance:issue', (issue) => {
      let severityColor = chalk.yellow;
      let icon = '⚠️';

      switch (issue.severity) {
        case 'critical':
          severityColor = chalk.red;
          icon = '🚨';
          break;
        case 'high':
          severityColor = chalk.red;
          icon = '❗';
          break;
        case 'medium':
          severityColor = chalk.yellow;
          icon = '⚠️';
          break;
        case 'low':
          severityColor = chalk.gray;
          icon = 'ℹ️';
          break;
      }

      console.log(
        `\n${icon} ${severityColor.bold(issue.severity.toUpperCase())} ` +
        `${chalk.white(issue.message)}`
      );
      
      if (issue.suggestion) {
        console.log(`   ${chalk.gray('💡 Suggestion:')} ${issue.suggestion}\n`);
      }
    });

    // Span performance logging for very slow operations
    this.collector.on('span:completed', (span) => {
      const duration = span.timing.duration || 0;
      
      if (duration > 500) { // Log spans slower than 500ms
        console.log(
          `   ${chalk.red('🐌 Slow span:')} ${span.name} ` +
          `${chalk.gray('(')}${duration.toFixed(2)}ms${chalk.gray(')')}`
        );
      }
    });
  }

  private async waitForExit(): Promise<void> {
    return new Promise((resolve) => {
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🛑 Shutting down StackSleuth...'));

        // Stop dashboard server
        if (this.dashboardServer) {
          await this.dashboardServer.stop();
        }

        // Show final statistics
        const stats = this.collector.getStats();
        console.log(chalk.gray('\n📊 Final Statistics:'));
        console.log(`  ${chalk.cyan('Total Traces:')} ${stats.traces.total}`);
        console.log(`  ${chalk.cyan('Total Spans:')} ${stats.spans.total}`);
        console.log(`  ${chalk.cyan('Average Trace Duration:')} ${stats.traces.avg.toFixed(2)}ms`);

        console.log(chalk.green('\n✅ StackSleuth stopped successfully'));
        resolve();
      });
    });
  }
} 