import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { TraceCollector, PerformanceUtils } from '@stacksleuth/core';

interface ReportOptions {
  format: 'json' | 'csv';
  output?: string;
  last?: string;
}

export class ReportCommand {
  private collector: TraceCollector;

  constructor(collector: TraceCollector) {
    this.collector = collector;
  }

  async execute(options: ReportOptions): Promise<void> {
    try {
      console.log(chalk.blue('📊 Generating performance report...'));

      // Get traces based on time filter
      let traces = this.collector.getAllTraces();
      
      if (options.last) {
        const timeRange = this.parseTimeRange(options.last);
        const cutoff = Date.now() - timeRange;
        traces = this.collector.getTracesByTimeRange(cutoff, Date.now());
      }

      if (traces.length === 0) {
        console.log(chalk.yellow('⚠️  No traces found for the specified criteria'));
        return;
      }

      // Generate report
      const report = this.generateReport(traces, options.format);
      
      // Output to file or console
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, report);
        console.log(chalk.green(`✅ Report saved to: ${outputPath}`));
      } else {
        console.log('\n' + report);
      }

      // Show summary statistics
      this.showSummary(traces);

    } catch (error: any) {
      console.error(chalk.red('❌ Error generating report:'), error.message);
      process.exit(1);
    }
  }

  private parseTimeRange(timeStr: string): number {
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

  private generateReport(traces: any[], format: 'json' | 'csv'): string {
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
      const slowestSpan = trace.spans.reduce((prev: any, curr: any) => 
        (curr.timing.duration || 0) > (prev.timing.duration || 0) ? curr : prev, 
        { timing: { duration: 0 }, name: 'N/A' }
      );

      return [
        trace.id,
        trace.name,
        trace.timing.duration || 0,
        trace.status,
        trace.spans.length,
        new Date(trace.timing.start.millis).toISOString(),
        trace.spans.some((s: any) => s.errors?.length > 0) ? 'Yes' : 'No',
        slowestSpan.name
      ];
    });

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }

  private generateSummary(traces: any[]) {
    const durations = traces
      .filter(t => t.timing.duration !== undefined)
      .map(t => t.timing.duration);

    const spanCounts = traces.map(t => t.spans.length);
    const errorCount = traces.filter(t => t.status === 'error').length;
    const slowTraces = traces.filter(t => (t.timing.duration || 0) > 1000).length;

    return {
      performance: PerformanceUtils.calculateStats(durations),
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

  private showSummary(traces: any[]): void {
    const summary = this.generateSummary(traces);

    console.log(chalk.bold('\n📈 Report Summary'));
    console.log(chalk.gray('─'.repeat(50)));
    
    console.log(`${chalk.cyan('Traces Analyzed:')} ${traces.length}`);
    console.log(`${chalk.cyan('Time Range:')} ${PerformanceUtils.formatDuration(summary.performance.min)} - ${PerformanceUtils.formatDuration(summary.performance.max)}`);
    console.log(`${chalk.cyan('Average Duration:')} ${PerformanceUtils.formatDuration(summary.performance.avg)}`);
    console.log(`${chalk.cyan('P95 Duration:')} ${PerformanceUtils.formatDuration(summary.performance.p95)}`);
    console.log(`${chalk.cyan('P99 Duration:')} ${PerformanceUtils.formatDuration(summary.performance.p99)}`);
    
    if (summary.errors.count > 0) {
      console.log(`${chalk.red('Errors:')} ${summary.errors.count} (${summary.errors.percentage.toFixed(1)}%)`);
    }
    
    if (summary.slowTraces.count > 0) {
      console.log(`${chalk.yellow('Slow Traces (>1s):')} ${summary.slowTraces.count} (${summary.slowTraces.percentage.toFixed(1)}%)`);
    }

    console.log(`${chalk.cyan('Total Spans:')} ${summary.spans.total}`);
    console.log(`${chalk.cyan('Average Spans per Trace:')} ${summary.spans.avg.toFixed(1)}`);
    
    console.log('');
  }
} 