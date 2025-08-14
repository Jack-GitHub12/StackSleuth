# StackSleuth API Reference

## Table of Contents

- [Core API](#core-api)
- [Backend Agent API](#backend-agent-api)
- [Frontend Agent API](#frontend-agent-api)
- [Database Agents API](#database-agents-api)
- [CLI API](#cli-api)
- [Dashboard API](#dashboard-api)

---

## Core API

### `ProfilerCore`

The main profiling engine that collects and processes performance data.

```typescript
import { ProfilerCore } from '@stacksleuth/core';

const profiler = new ProfilerCore(config: ProfilerConfig);
```

#### Methods

##### `init(config?: Partial<ProfilerConfig>): void`
Initialize the profiler with optional configuration overrides.

##### `startTrace(name: string, metadata?: Record<string, any>): Trace`
Start a new trace with the given name and optional metadata.

##### `endTrace(traceId: string, status?: TraceStatus): void`
Complete a trace with the given ID and optional status.

##### `createSpan(name: string, type: SpanType, parentId?: string): Span`
Create a new span within the current trace context.

##### `recordMetric(name: string, value: number, tags?: Record<string, string>): void`
Record a custom metric with optional tags.

##### `flush(): Promise<void>`
Force flush all pending traces and metrics.

##### `stop(): void`
Gracefully shutdown the profiler.

#### Configuration

```typescript
interface ProfilerConfig {
  enabled: boolean;
  serviceName?: string;
  environment?: string;
  version?: string;
  sampling: {
    rate: number;           // 0.0 to 1.0
    adaptive?: boolean;     // Auto-adjust based on load
    maxTracesPerSecond?: number;
  };
  buffer: {
    maxSize: number;        // Max traces in buffer
    flushInterval: number;  // ms
  };
  output: {
    console?: boolean;
    endpoint?: string;
    headers?: Record<string, string>;
  };
}
```

---

## Backend Agent API

### `BackendAgent`

Express.js and Node.js instrumentation agent.

```typescript
import { BackendAgent } from '@stacksleuth/backend-agent';

const agent = new BackendAgent(config?: AgentConfig);
```

#### Methods

##### `instrument(app: Express.Application): void`
Automatically instrument all Express routes and middleware.

##### `middleware(): Express.Middleware`
Returns Express middleware for manual integration.

##### `trace<T>(name: string, fn: () => Promise<T>): Promise<T>`
Manually trace an async operation.

##### `traceSync<T>(name: string, fn: () => T): T`
Manually trace a synchronous operation.

##### `recordError(error: Error, context?: Record<string, any>): void`
Record an error with optional context.

##### `startMonitoring(): void`
Start the monitoring agent.

##### `stopMonitoring(): void`
Stop the monitoring agent.

#### Express Integration

```typescript
// Automatic instrumentation
agent.instrument(app);

// Manual middleware
app.use(agent.middleware());

// Custom route tracing
app.get('/api/users/:id', async (req, res) => {
  const user = await agent.trace('db.findUser', async () => {
    return await db.users.findById(req.params.id);
  });
  res.json(user);
});
```

---

## Frontend Agent API

### React Integration

#### `StackSleuthProvider`

React context provider for StackSleuth.

```tsx
import { StackSleuthProvider } from '@stacksleuth/frontend-agent';

<StackSleuthProvider config={config}>
  <App />
</StackSleuthProvider>
```

#### `usePerformance` Hook

```tsx
const { trace, measureRender, recordMetric } = usePerformance();

// Trace async operations
const data = await trace('api.fetch', async () => {
  return await fetch('/api/data').then(r => r.json());
});

// Measure component renders
measureRender('ComponentName');

// Record custom metrics
recordMetric('button.click', 1, { button: 'submit' });
```

#### `withPerformance` HOC

```tsx
import { withPerformance } from '@stacksleuth/frontend-agent';

export default withPerformance(MyComponent, {
  trackRenders: true,
  trackProps: ['userId', 'filter']
});
```

### Vue Integration

#### Plugin Installation

```typescript
import { createApp } from 'vue';
import { StackSleuthPlugin } from '@stacksleuth/vue-agent';

app.use(StackSleuthPlugin, config);
```

#### Composition API

```typescript
import { useStackSleuth } from '@stacksleuth/vue-agent';

const { trace, tracedRef, tracedComputed } = useStackSleuth();

// Traced reactive ref
const count = tracedRef(0, 'counter');

// Traced computed
const doubled = tracedComputed(
  () => count.value * 2,
  'doubled-counter'
);

// Trace operations
await trace('fetchData', async () => {
  // async operation
});
```

---

## Database Agents API

### PostgreSQL Agent

```typescript
import { instrumentPg } from '@stacksleuth/db-agent';
import { Pool } from 'pg';

const pool = instrumentPg(new Pool(config), {
  slowQueryThreshold: 100,    // ms
  logQueryParameters: false,
  trackConnectionPool: true
});
```

### MongoDB Agent

```typescript
import { instrumentMongoDB } from '@stacksleuth/mongodb-agent';
import { MongoClient } from 'mongodb';

const client = instrumentMongoDB(new MongoClient(uri), {
  trackAggregations: true,
  slowOpThreshold: 50,        // ms
  logDocuments: false
});
```

### MySQL Agent

```typescript
import { MySQLAgent } from '@stacksleuth/mysql-agent';

const agent = new MySQLAgent({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'myapp',
  slowQueryThreshold: 100,
  enablePerformanceSchema: true
});

await agent.startMonitoring();
```

### Redis Agent

```typescript
import { instrumentRedis } from '@stacksleuth/redis-agent';
import Redis from 'ioredis';

const redis = instrumentRedis(new Redis(options), {
  trackPipelines: true,
  slowCommandThreshold: 10    // ms
});
```

---

## CLI API

### Commands

#### `sleuth init`

Initialize StackSleuth in your project.

```bash
sleuth init [options]

Options:
  --framework <type>    Framework type (express, react, vue, etc.)
  --typescript         Use TypeScript configuration
  --yes               Use default configuration
  --non-interactive   Skip all prompts
```

#### `sleuth watch`

Start the performance monitoring dashboard.

```bash
sleuth watch [options]

Options:
  --port <port>       Dashboard port (default: 3001)
  --host <host>       Dashboard host (default: localhost)
  --timeout <sec>     Auto-stop after N seconds
  --open             Open dashboard in browser
```

#### `sleuth analyze`

Analyze performance data and generate reports.

```bash
sleuth analyze [options]

Options:
  --from <date>      Start date for analysis
  --to <date>        End date for analysis
  --format <type>    Output format (json, html, pdf)
  --output <file>    Output file path
```

#### `sleuth report`

Generate performance reports.

```bash
sleuth report [options]

Options:
  --type <type>      Report type (summary, detailed, trends)
  --period <period>  Time period (day, week, month)
  --export <format>  Export format (json, csv, html)
```

---

## Dashboard API

### REST Endpoints

#### `GET /api/traces`
Get list of traces.

Query Parameters:
- `limit` - Number of traces (default: 100)
- `offset` - Pagination offset
- `from` - Start timestamp
- `to` - End timestamp
- `service` - Filter by service name
- `status` - Filter by status (success, error)

#### `GET /api/traces/:id`
Get detailed trace information.

#### `GET /api/metrics`
Get aggregated metrics.

Query Parameters:
- `metric` - Metric name
- `from` - Start timestamp
- `to` - End timestamp
- `interval` - Aggregation interval (1m, 5m, 1h, 1d)
- `groupBy` - Group by tags

#### `GET /api/services`
Get list of monitored services.

#### `GET /api/errors`
Get error logs and statistics.

### WebSocket API

Connect to real-time data stream:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  switch(event.type) {
    case 'trace':
      // New trace data
      break;
    case 'metric':
      // New metric data
      break;
    case 'error':
      // Error event
      break;
  }
});

// Subscribe to specific events
ws.send(JSON.stringify({
  action: 'subscribe',
  events: ['traces', 'metrics']
}));
```

---

## Data Types

### Common Types

```typescript
interface Trace {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  spans: Span[];
  metadata: Record<string, any>;
}

interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  type: SpanType;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  metadata: Record<string, any>;
}

enum SpanType {
  HTTP_REQUEST = 'http_request',
  DB_QUERY = 'db_query',
  CACHE_OPERATION = 'cache_operation',
  FUNCTION_CALL = 'function_call',
  RENDER = 'render',
  CUSTOM = 'custom'
}

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  unit?: string;
}

interface WebVital {
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}
```

---

## Error Handling

All agents implement consistent error handling:

```typescript
agent.on('error', (error) => {
  console.error('Agent error:', error);
});

// Global error handler
ProfilerCore.setErrorHandler((error) => {
  // Custom error handling
  logger.error(error);
});
```

## Performance Considerations

- Use sampling in production (1-10% recommended)
- Enable adaptive sampling for automatic adjustment
- Set appropriate buffer sizes based on traffic
- Use batch exports to reduce network overhead
- Implement circuit breakers for agent failures

---

## Support

- GitHub Issues: https://github.com/Jack-GitHub12/StackSleuth/issues
- Documentation: https://jack-github12.github.io/StackSleuth/
- Discord: Coming soon
- Email: support@stacksleuth.dev