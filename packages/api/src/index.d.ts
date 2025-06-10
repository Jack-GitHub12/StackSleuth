import express from 'express';
import { Server } from 'socket.io';
export declare class StackSleuthAPI {
    private app;
    private server;
    private io;
    private redis;
    constructor();
    private setupMiddleware;
    private setupDatabase;
    private setupRedis;
    private setupRoutes;
    private setupWebSocket;
    private setupSwagger;
    private setupErrorHandling;
    broadcastMetrics(data: any): void;
    broadcastAlert(alert: any): void;
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
    getApp(): express.Application;
    getIO(): Server;
}
declare const api: StackSleuthAPI;
export default api;
//# sourceMappingURL=index.d.ts.map