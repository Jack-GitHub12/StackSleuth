import http from 'http';
import { WebSocketServer } from 'ws';
import { TraceCollector } from '@stacksleuth/core';

// Dynamic import for chalk to handle ESM compatibility
let chalk: any;

async function initChalk() {
  if (!chalk) {
    chalk = (await import('chalk')).default;
  }
  return chalk;
}

export class DashboardServer {
  private server?: http.Server;
  private wsServer?: WebSocketServer;
  private collector: TraceCollector;
  private port: number;

  constructor(collector: TraceCollector, port: number) {
    this.collector = collector;
    this.port = port;
  }

  async start(): Promise<void> {
    const c = await initChalk();
    return new Promise((resolve, reject) => {
      // Create HTTP server with embedded HTML dashboard
      this.server = http.createServer((req, res) => {
        if (req.url === '/') {
          this.serveDashboard(res);
        } else if (req.url === '/api/traces') {
          this.serveTraces(res);
        } else if (req.url === '/api/stats') {
          this.serveStats(res);
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      // Set up WebSocket server for real-time updates
      this.wsServer = new WebSocketServer({ server: this.server });
      this.setupWebSocket();

      this.server.listen(this.port, () => {
        console.log(c.green(`📊 Dashboard available at http://localhost:${this.port}`));
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wsServer) {
        this.wsServer.close();
      }
      
      if (this.server) {
        this.server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private setupWebSocket(): void {
    if (!this.wsServer) return;

    this.wsServer.on('connection', (ws) => {
      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial',
        data: {
          traces: this.collector.getAllTraces(),
          stats: this.collector.getStats()
        }
      }));

      // Forward real-time events
      const traceListener = (trace: any) => {
        ws.send(JSON.stringify({
          type: 'trace:completed',
          data: trace
        }));
      };

      const issueListener = (issue: any) => {
        ws.send(JSON.stringify({
          type: 'performance:issue',
          data: issue
        }));
      };

      this.collector.on('trace:completed', traceListener);
      this.collector.on('performance:issue', issueListener);

      ws.on('close', () => {
        this.collector.off('trace:completed', traceListener);
        this.collector.off('performance:issue', issueListener);
      });
    });
  }

  private serveDashboard(res: http.ServerResponse): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StackSleuth Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { 
            background: #1e293b; 
            padding: 20px 0; 
            border-bottom: 1px solid #334155;
            margin-bottom: 30px;
        }
        h1 { 
            color: #06b6d4; 
            font-size: 2rem; 
            font-weight: 700;
            text-align: center;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .stat-card { 
            background: #1e293b; 
            padding: 20px; 
            border-radius: 8px;
            border: 1px solid #334155;
        }
        .stat-label { color: #94a3b8; font-size: 0.9rem; }
        .stat-value { color: #06b6d4; font-size: 1.8rem; font-weight: 700; }
        .traces-section h2 { 
            color: #e2e8f0; 
            margin-bottom: 20px; 
            font-size: 1.5rem;
        }
        .trace-item { 
            background: #1e293b; 
            padding: 15px; 
            margin-bottom: 10px; 
            border-radius: 6px;
            border-left: 4px solid #06b6d4;
            border: 1px solid #334155;
        }
        .trace-name { color: #e2e8f0; font-weight: 600; }
        .trace-meta { color: #94a3b8; font-size: 0.9rem; margin-top: 5px; }
        .trace-duration { color: #06b6d4; font-weight: 500; }
        .trace-error { border-left-color: #ef4444; }
        .trace-slow { border-left-color: #f59e0b; }
        .status { 
            display: inline-block; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 0.8rem; 
            font-weight: 500;
        }
        .status-success { background: #064e3b; color: #10b981; }
        .status-error { background: #450a0a; color: #ef4444; }
        .status-pending { background: #451a03; color: #f59e0b; }
        .issues-section { margin-top: 30px; }
        .issue-item { 
            background: #1e293b; 
            padding: 15px; 
            margin-bottom: 10px; 
            border-radius: 6px;
            border: 1px solid #334155;
        }
        .issue-critical { border-left: 4px solid #ef4444; }
        .issue-high { border-left: 4px solid #f59e0b; }
        .issue-medium { border-left: 4px solid #eab308; }
        .issue-low { border-left: 4px solid #6b7280; }
        .empty-state { 
            text-align: center; 
            color: #64748b; 
            padding: 40px; 
            font-style: italic;
        }
        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .connected { background: #064e3b; color: #10b981; }
        .disconnected { background: #450a0a; color: #ef4444; }
    </style>
</head>
<body>
    <div class="connection-status" id="connectionStatus">Connecting...</div>
    
    <header>
        <div class="container">
            <h1>StackSleuth Dashboard</h1>
        </div>
    </header>

    <div class="container">
        <div class="stats-grid" id="statsGrid">
            <div class="stat-card">
                <div class="stat-label">Total Traces</div>
                <div class="stat-value" id="totalTraces">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Duration</div>
                <div class="stat-value" id="avgDuration">0ms</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">P95 Duration</div>
                <div class="stat-value" id="p95Duration">0ms</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Spans</div>
                <div class="stat-value" id="totalSpans">0</div>
            </div>
        </div>

        <div class="traces-section">
            <h2>Recent Traces</h2>
            <div id="tracesList"></div>
        </div>

        <div class="issues-section">
            <h2>Performance Issues</h2>
            <div id="issuesList"></div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:${this.port}');
        const statusEl = document.getElementById('connectionStatus');
        const tracesEl = document.getElementById('tracesList');
        const issuesEl = document.getElementById('issuesList');
        
        let traces = [];
        let issues = [];

        ws.onopen = () => {
            statusEl.textContent = 'Connected';
            statusEl.className = 'connection-status connected';
        };

        ws.onclose = () => {
            statusEl.textContent = 'Disconnected';
            statusEl.className = 'connection-status disconnected';
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'initial':
                    traces = message.data.traces;
                    updateStats(message.data.stats);
                    renderTraces();
                    break;
                    
                case 'trace:completed':
                    traces.unshift(message.data);
                    traces = traces.slice(0, 50); // Keep last 50 traces
                    renderTraces();
                    break;
                    
                case 'performance:issue':
                    issues.unshift(message.data);
                    issues = issues.slice(0, 20); // Keep last 20 issues
                    renderIssues();
                    break;
            }
        };

        function updateStats(stats) {
            document.getElementById('totalTraces').textContent = stats.traces.total;
            document.getElementById('avgDuration').textContent = stats.traces.avg.toFixed(2) + 'ms';
            document.getElementById('p95Duration').textContent = stats.traces.p95.toFixed(2) + 'ms';
            document.getElementById('totalSpans').textContent = stats.spans.total;
        }

        function renderTraces() {
            if (traces.length === 0) {
                tracesEl.innerHTML = '<div class="empty-state">No traces yet. Make requests to your application to see data.</div>';
                return;
            }

            tracesEl.innerHTML = traces.map(trace => {
                const duration = trace.timing.duration || 0;
                const isError = trace.status === 'error';
                const isSlow = duration > 1000;
                
                return \`
                    <div class="trace-item \${isError ? 'trace-error' : isSlow ? 'trace-slow' : ''}">
                        <div class="trace-name">\${trace.name}</div>
                        <div class="trace-meta">
                            <span class="trace-duration">\${duration.toFixed(2)}ms</span> • 
                            <span class="status status-\${trace.status}">\${trace.status}</span> • 
                            \${trace.spans.length} spans • 
                            \${new Date(trace.timing.start.millis).toLocaleTimeString()}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function renderIssues() {
            if (issues.length === 0) {
                issuesEl.innerHTML = '<div class="empty-state">No performance issues detected.</div>';
                return;
            }

            issuesEl.innerHTML = issues.map(issue => \`
                <div class="issue-item issue-\${issue.severity}">
                    <strong>\${issue.severity.toUpperCase()}: \${issue.message}</strong>
                    \${issue.suggestion ? \`<div style="margin-top: 8px; color: #94a3b8;">💡 \${issue.suggestion}</div>\` : ''}
                </div>
            \`).join('');
        }
    </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  private serveTraces(res: http.ServerResponse): void {
    const traces = this.collector.getAllTraces();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(traces));
  }

  private serveStats(res: http.ServerResponse): void {
    const stats = this.collector.getStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  }
} 