import { TraceCollector } from '@stacksleuth/core';
interface ReportOptions {
    format: 'json' | 'csv';
    output?: string;
    last?: string;
}
export declare class ReportCommand {
    private collector;
    constructor(collector: TraceCollector);
    execute(options: ReportOptions): Promise<void>;
    private parseTimeRange;
    private generateReport;
    private generateSummary;
    private showSummary;
}
export {};
//# sourceMappingURL=report.d.ts.map