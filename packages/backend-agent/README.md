# @stacksleuth/backend-agent

Backend instrumentation agent for Node.js and Express.js applications.

## Installation

```bash
npm install @stacksleuth/backend-agent
```

## Quick Start

### Express.js Auto-Instrumentation

```javascript
import express from 'express';
import { createBackendAgent } from '@stacksleuth/backend-agent';

const app = express();
const agent = createBackendAgent();

// Automatically instrument all routes
agent.instrument(app);

app.get('/api/users', async (req, res) => {
  // All requests are automatically traced
  res.json({ users: [] });
});

app.listen(3000);
```

### Manual Tracing

```javascript
app.get('/api/data', async (req, res) => {
  // Manual tracing for specific operations
  const data = await agent.trace('fetch-external-data', async () => {
    const response = await fetch('https://api.example.com/data');
    return response.json();
  });
  
  res.json(data);
});
```

### Trace Handler Wrapper

```javascript
const tracedHandler = agent.traceHandler(async (req, res) => {
  // This handler is automatically traced
  const result = await someAsyncOperation();
  res.json(result);
});

app.get('/api/traced', tracedHandler);
```

## Configuration

```javascript
import { createBackendAgent } from '@stacksleuth/backend-agent';

const agent = createBackendAgent({
  enabled: process.env.NODE_ENV !== 'production',
  sampling: {
    rate: 0.1, // Sample 10% of requests in production
    maxTracesPerSecond: 100
  },
  filters: {
    excludeUrls: [
      /\/health$/,
      /\/metrics$/,
      /\.(js|css|png|jpg|jpeg|gif|ico|svg)$/
    ],
    minDuration: 10 // Only track spans >10ms
  },
  output: {
    console: true,
    dashboard: {
      enabled: true,
      port: 3001
    }
  }
});
```

## Features

### Automatic HTTP Tracing

- **Request/Response Tracking** - Automatic instrumentation of all Express routes
- **Status Code Monitoring** - Track success/error responses
- **Request Metadata** - Capture method, URL, user agent, content length
- **Error Handling** - Automatic error capture and stack traces

### Performance Detection

- **Slow Requests** - Automatically flag requests taking >1s
- **Memory Usage** - Track memory consumption per request
- **Response Size** - Monitor response payload sizes

### Manual Instrumentation

```javascript
// Trace any async operation
const result = await agent.trace('database-query', async () => {
  return await db.users.findMany();
});

// Access the trace collector directly
const collector = agent.getCollector();
collector.on('trace:completed', (trace) => {
  console.log(`Request completed: ${trace.timing.duration}ms`);
});
```

## Integration Examples

### With Database

```javascript
import { Pool } from 'pg';
import { instrumentPg } from '@stacksleuth/db-agent';

const pool = instrumentPg(new Pool(config));

app.get('/users', async (req, res) => {
  // Database queries are automatically traced
  const users = await pool.query('SELECT * FROM users');
  res.json(users.rows);
});
```

### With External APIs

```javascript
app.get('/api/external', async (req, res) => {
  const data = await agent.trace('external-api-call', async () => {
    const response = await fetch('https://api.external.com/data', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  });
  
  res.json(data);
});
```

## API Reference

### createBackendAgent(config?)

Creates a new backend agent instance.

### BackendAgent

#### Methods

- `instrument(app)` - Instrument an Express application
- `trace(name, operation)` - Manually trace an async operation
- `traceHandler(handler)` - Wrap a route handler with tracing
- `getCollector()` - Get the underlying trace collector

## Performance Impact

The backend agent is designed for minimal overhead:

- **<2ms** additional latency per request
- **<5%** memory overhead
- **Intelligent sampling** to reduce load in production
- **Zero dependencies** beyond Express peer dependency

## Links

- [GitHub Repository](https://github.com/Jack-GitHub12/StackSleuth)
- [Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)
- [Issues](https://github.com/Jack-GitHub12/StackSleuth/issues) 