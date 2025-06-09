import { TraceCollector } from '@stacksleuth/core';
interface WatchOptions {
    port: string;
    sampling: string;
    dashboard: boolean;
}
export declare class WatchCommand {
    private collector;
    private dashboardServer?;
    constructor(collector: TraceCollector);
    execute(options: WatchOptions): Promise<void>;
    private setupEventListeners;
    private waitForExit;
}
export {};
//# sourceMappingURL=watch.d.ts.map