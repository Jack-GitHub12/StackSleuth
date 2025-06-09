import { TraceCollector } from '@stacksleuth/core';
export declare class DashboardServer {
    private server?;
    private wsServer?;
    private collector;
    private port;
    constructor(collector: TraceCollector, port: number);
    start(): Promise<void>;
    stop(): Promise<void>;
    private setupWebSocket;
    private serveDashboard;
    private serveTraces;
    private serveStats;
}
//# sourceMappingURL=server.d.ts.map