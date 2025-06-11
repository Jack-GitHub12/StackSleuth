import { ProfilerCore } from '@stacksleuth/core';
import axios from 'axios';
import WebSocket from 'ws';

export interface FastAPIRouteMetrics {
  path: string;
  method: string;
  duration: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  timestamp: number;
  userId?: string;
  errors: string[];
  dbQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface FastAPIServerMetrics {
  serverId: string;
  host: string;
  port: number;
  startTime: number;
  totalRequests: number;
  activeConnections: number;
  avgResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
}

export interface FastAPIPerformanceStats {
  totalRequests: number;
  avgResponseTime: number;
  slowEndpoints: FastAPIRouteMetrics[];
  errorRate: number;
  topEndpoints: Array<{ path: string; method: string; count: number; avgDuration: number }>;
  serverMetrics: FastAPIServerMetrics[];
  databaseStats: {
    totalQueries: number;
    avgQueryTime: number;
    slowQueries: number;
  };
  cacheStats: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  };
}

export class FastAPIAgent {
  private profiler: ProfilerCore;
  private routeMetrics: FastAPIRouteMetrics[] = [];
  private serverMetrics: Map<string, FastAPIServerMetrics> = new Map();
  private isActive: boolean = false;
  private slowQueryThreshold: number = 1000; // ms
  private maxMetricsHistory: number = 10000;
  private wsConnection?: WebSocket;
  private pythonServerUrl: string;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config?: { 
    endpoint?: string; 
    apiKey?: string; 
    slowQueryThreshold?: number;
    maxMetricsHistory?: number;
    pythonServerUrl?: string;
    autoInit?: boolean;
  }) {
    this.profiler = new ProfilerCore(config);
    this.slowQueryThreshold = config?.slowQueryThreshold || 1000;
    this.maxMetricsHistory = config?.maxMetricsHistory || 10000;
    this.pythonServerUrl = config?.pythonServerUrl || 'http://localhost:8000';
    
    // Don't auto-initialize to prevent hanging in tests
    if (config?.autoInit !== false && process.env.NODE_ENV !== 'test') {
      // Only auto-init in non-test environments
      setTimeout(() => this.init().catch(console.error), 0);
    }
  }

  /**
   * Initialize the FastAPI agent
   */
  public async init(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    
    try {
      await this.profiler.init();
    } catch (error) {
      // Don't fail if profiler can't initialize (e.g., in tests)
      console.warn('⚠️  ProfilerCore initialization failed:', error);
    }
    
    // Start monitoring FastAPI server
    this.startServerMonitoring();
    this.connectToFastAPIServer();
    
    console.log('🔄 FastAPI Agent initialized');
  }

  /**
   * Connect to FastAPI server for real-time monitoring
   */
  private connectToFastAPIServer(): void {
    try {
      // Setup WebSocket connection to FastAPI server for real-time metrics
      const wsUrl = this.pythonServerUrl.replace('http', 'ws') + '/ws/stacksleuth';
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.on('open', () => {
        console.log('✅ Connected to FastAPI server for monitoring');
        this.requestServerInfo();
      });

      this.wsConnection.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleServerMessage(message);
        } catch (error) {
          console.warn('Failed to parse server message:', error);
        }
      });

      this.wsConnection.on('error', (error) => {
        console.warn('WebSocket connection error:', error);
      });

      this.wsConnection.on('close', () => {
        if (this.isActive) {
          console.log('FastAPI server connection closed, attempting to reconnect...');
          setTimeout(() => this.connectToFastAPIServer(), 5000);
        }
      });
    } catch (error) {
      console.warn('Failed to connect to FastAPI server:', error);
    }
  }

  /**
   * Handle messages from FastAPI server
   */
  private handleServerMessage(message: any): void {
    switch (message.type) {
      case 'route_metrics':
        this.recordRouteMetrics(message.data);
        break;
      case 'server_metrics':
        this.updateServerMetrics(message.data);
        break;
      case 'error_event':
        this.recordErrorEvent(message.data);
        break;
      case 'database_query':
        this.recordDatabaseQuery(message.data);
        break;
      case 'cache_event':
        this.recordCacheEvent(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Request server information
   */
  private requestServerInfo(): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'get_server_info',
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Record route performance metrics (made public for testing)
   */
  public recordRouteMetrics(data: any): void {
    const metrics: FastAPIRouteMetrics = {
      path: data.path,
      method: data.method,
      duration: data.duration,
      statusCode: data.status_code,
      requestSize: data.request_size || 0,
      responseSize: data.response_size || 0,
      timestamp: data.timestamp || Date.now(),
      userId: data.user_id,
      errors: data.errors || [],
      dbQueries: data.db_queries || 0,
      cacheHits: data.cache_hits || 0,
      cacheMisses: data.cache_misses || 0
    };

    this.routeMetrics.push(metrics);
    
    // Maintain history limit
    if (this.routeMetrics.length > this.maxMetricsHistory) {
      this.routeMetrics.splice(0, this.routeMetrics.length - this.maxMetricsHistory);
    }

    try {
      // Record with profiler (only if active)
      if (this.isActive) {
        this.profiler.recordMetric('fastapi_route', metrics);

        // Record slow queries
        if (metrics.duration > this.slowQueryThreshold) {
          this.profiler.recordMetric('fastapi_slow_route', metrics);
        }
      }
    } catch (error) {
      // Don't fail on profiler errors
      console.warn('⚠️  Failed to record metrics:', error);
    }
  }

  /**
   * Update server metrics
   */
  private updateServerMetrics(data: any): void {
    const serverId = data.server_id || 'default';
    
    const metrics: FastAPIServerMetrics = {
      serverId,
      host: data.host || 'localhost',
      port: data.port || 8000,
      startTime: data.start_time || Date.now(),
      totalRequests: data.total_requests || 0,
      activeConnections: data.active_connections || 0,
      avgResponseTime: data.avg_response_time || 0,
      errorRate: data.error_rate || 0,
      memoryUsage: data.memory_usage || 0,
      cpuUsage: data.cpu_usage || 0,
      diskUsage: data.disk_usage || 0
    };

    this.serverMetrics.set(serverId, metrics);
    
    // Add timestamp when recording with profiler
    this.profiler.recordMetric('fastapi_server_metrics', {
      ...metrics,
      timestamp: Date.now()
    });
  }

  /**
   * Record error events
   */
  private recordErrorEvent(data: any): void {
    this.profiler.recordMetric('fastapi_error', {
      path: data.path,
      method: data.method,
      error_type: data.error_type,
      error_message: data.error_message,
      stack_trace: data.stack_trace,
      timestamp: data.timestamp || Date.now()
    });
  }

  /**
   * Record database query metrics
   */
  private recordDatabaseQuery(data: any): void {
    this.profiler.recordMetric('fastapi_database_query', {
      query: data.query,
      duration: data.duration,
      table: data.table,
      operation: data.operation,
      rows_affected: data.rows_affected,
      timestamp: data.timestamp || Date.now()
    });
  }

  /**
   * Record cache events
   */
  private recordCacheEvent(data: any): void {
    this.profiler.recordMetric('fastapi_cache_event', {
      key: data.key,
      operation: data.operation, // hit, miss, set, delete
      duration: data.duration,
      size: data.size,
      timestamp: data.timestamp || Date.now()
    });
  }

  /**
   * Start periodic server monitoring via HTTP
   */
  private startServerMonitoring(): void {
    // Clear any existing interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectServerMetrics();
      } catch (error) {
        console.warn('Failed to collect server metrics:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Collect server metrics via HTTP API
   */
  private async collectServerMetrics(): Promise<void> {
    try {
      const response = await axios.get(`${this.pythonServerUrl}/stacksleuth/metrics`, {
        timeout: 5000
      });

      if (response.data) {
        this.updateServerMetrics(response.data);
      }
    } catch (error) {
      // Server might not have StackSleuth middleware, ignore
    }
  }

  /**
   * Install FastAPI middleware (via HTTP request to server)
   */
  public async installMiddleware(middlewareConfig?: {
    enableRouteMetrics?: boolean;
    enableDatabaseMetrics?: boolean;
    enableCacheMetrics?: boolean;
    slowQueryThreshold?: number;
  }): Promise<void> {
    try {
      await axios.post(`${this.pythonServerUrl}/stacksleuth/install-middleware`, {
        config: {
          enable_route_metrics: middlewareConfig?.enableRouteMetrics ?? true,
          enable_database_metrics: middlewareConfig?.enableDatabaseMetrics ?? true,
          enable_cache_metrics: middlewareConfig?.enableCacheMetrics ?? true,
          slow_query_threshold: middlewareConfig?.slowQueryThreshold ?? this.slowQueryThreshold,
          websocket_url: 'ws://localhost:9999/fastapi-agent' // Where this agent listens
        }
      }, {
        timeout: 10000
      });

      console.log('✅ FastAPI middleware installed successfully');
    } catch (error) {
      console.warn('Failed to install FastAPI middleware:', error);
      throw new Error('Could not install FastAPI middleware. Make sure the FastAPI server is running and has StackSleuth integration.');
    }
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): FastAPIPerformanceStats {
    const totalRequests = this.routeMetrics.length;
    const avgResponseTime = totalRequests > 0 
      ? this.routeMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;
    
    const slowEndpoints = this.routeMetrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    const errorCount = this.routeMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
    
    // Calculate top endpoints
    const endpointStats = new Map<string, { count: number; totalDuration: number }>();
    this.routeMetrics.forEach(m => {
      const key = `${m.method} ${m.path}`;
      const existing = endpointStats.get(key) || { count: 0, totalDuration: 0 };
      existing.count++;
      existing.totalDuration += m.duration;
      endpointStats.set(key, existing);
    });
    
    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => {
        const [method, path] = endpoint.split(' ', 2);
        return {
          path,
          method,
          count: stats.count,
          avgDuration: stats.totalDuration / stats.count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Database stats
    const totalDbQueries = this.routeMetrics.reduce((sum, m) => sum + m.dbQueries, 0);
    const avgQueryTime = 0; // Would be calculated from database query metrics
    const slowQueries = 0; // Would be calculated from database query metrics

    // Cache stats
    const totalCacheHits = this.routeMetrics.reduce((sum, m) => sum + m.cacheHits, 0);
    const totalCacheMisses = this.routeMetrics.reduce((sum, m) => sum + m.cacheMisses, 0);
    const hitRate = (totalCacheHits + totalCacheMisses) > 0 
      ? totalCacheHits / (totalCacheHits + totalCacheMisses) 
      : 0;
    
    return {
      totalRequests,
      avgResponseTime,
      slowEndpoints,
      errorRate,
      topEndpoints,
      serverMetrics: Array.from(this.serverMetrics.values()),
      databaseStats: {
        totalQueries: totalDbQueries,
        avgQueryTime,
        slowQueries
      },
      cacheStats: {
        hitRate,
        totalHits: totalCacheHits,
        totalMisses: totalCacheMisses
      }
    };
  }

  /**
   * Get recent route metrics
   */
  public getRecentRoutes(limit: number = 100): FastAPIRouteMetrics[] {
    return this.routeMetrics
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get server metrics
   */
  public getServerMetrics(): FastAPIServerMetrics[] {
    return Array.from(this.serverMetrics.values());
  }

  /**
   * Generate Python middleware code
   */
  public generateMiddlewareCode(): string {
    return `
# StackSleuth FastAPI Middleware
# Add this to your FastAPI application

import time
import json
import asyncio
import websockets
from typing import Optional
from fastapi import FastAPI, Request, Response, WebSocket
from fastapi.middleware.base import BaseHTTPMiddleware
import psutil
import threading

class StackSleuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, websocket_url: str = None):
        super().__init__(app)
        self.websocket_url = websocket_url
        self.websocket = None
        self.server_id = "fastapi-server"
        self.start_time = time.time()
        self.total_requests = 0
        self.response_times = []
        
        if websocket_url:
            asyncio.create_task(self.connect_websocket())

    async def connect_websocket(self):
        try:
            self.websocket = await websockets.connect(self.websocket_url)
            print("Connected to StackSleuth agent")
        except Exception as e:
            print(f"Failed to connect to StackSleuth agent: {e}")

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Get request size
        request_size = 0
        if hasattr(request, 'body'):
            try:
                body = await request.body()
                request_size = len(body)
            except:
                pass

        response = await call_next(request)
        
        # Calculate metrics
        duration = (time.time() - start_time) * 1000  # Convert to milliseconds
        self.total_requests += 1
        self.response_times.append(duration)
        
        # Keep only last 1000 response times
        if len(self.response_times) > 1000:
            self.response_times = self.response_times[-1000:]

        # Get response size
        response_size = 0
        if hasattr(response, 'body'):
            try:
                response_size = len(response.body)
            except:
                pass

        # Send metrics to agent
        if self.websocket:
            try:
                metrics = {
                    "type": "route_metrics",
                    "data": {
                        "path": request.url.path,
                        "method": request.method,
                        "duration": duration,
                        "status_code": response.status_code,
                        "request_size": request_size,
                        "response_size": response_size,
                        "timestamp": int(time.time() * 1000),
                        "errors": [] if response.status_code < 400 else [f"HTTP {response.status_code}"],
                        "db_queries": 0,  # Would be tracked separately
                        "cache_hits": 0,  # Would be tracked separately
                        "cache_misses": 0  # Would be tracked separately
                    }
                }
                await self.websocket.send(json.dumps(metrics))
            except Exception as e:
                print(f"Failed to send metrics: {e}")

        return response

# Usage:
# app = FastAPI()
# app.add_middleware(StackSleuthMiddleware, websocket_url="ws://localhost:9999/fastapi-agent")

# Add metrics endpoint
@app.get("/stacksleuth/metrics")
async def get_metrics():
    process = psutil.Process()
    memory_info = process.memory_info()
    
    return {
        "server_id": "fastapi-server",
        "host": "localhost",
        "port": 8000,
        "start_time": int(time.time() * 1000),
        "total_requests": middleware.total_requests,
        "active_connections": 0,  # Would need connection tracking
        "avg_response_time": sum(middleware.response_times) / len(middleware.response_times) if middleware.response_times else 0,
        "error_rate": 0,  # Would need error tracking
        "memory_usage": memory_info.rss,
        "cpu_usage": process.cpu_percent(),
        "disk_usage": psutil.disk_usage('/').used
    }

@app.websocket("/ws/stacksleuth")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "get_server_info":
                # Send server info
                await websocket.send_text(json.dumps({
                    "type": "server_info",
                    "data": {
                        "server_id": "fastapi-server",
                        "version": "1.0.0",
                        "status": "running"
                    }
                }))
    except Exception as e:
        print(f"WebSocket error: {e}")
`;
  }

  /**
   * Stop the FastAPI agent and cleanup resources
   */
  public async stop(): Promise<void> {
    this.isActive = false;
    
    // Clear monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = undefined;
    }
    
    // Clear metrics
    this.routeMetrics = [];
    this.serverMetrics.clear();
    
    try {
      await this.profiler.stop();
    } catch (error) {
      // Ignore errors during stop
    }
    
    console.log('🛑 FastAPI Agent stopped');
  }
}

// Export default instance
export const fastapiAgent = new FastAPIAgent({ autoInit: false });

// Note: Auto-initialization removed to prevent hanging in tests
// Call fastapiAgent.init() manually when needed 