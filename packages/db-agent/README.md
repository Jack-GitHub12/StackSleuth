# @stacksleuth/db-agent

Database instrumentation agent for PostgreSQL query performance monitoring.

## Installation

```bash
npm install @stacksleuth/db-agent
```

**Peer Dependencies:**
- `pg` (node-postgres) 8.0+

## Quick Start

### Instrument a Connection Pool

```javascript
import { Pool } from 'pg';
import { instrumentPg } from '@stacksleuth/db-agent';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password'
});

// Instrument the pool for automatic query tracing
const instrumentedPool = instrumentPg(pool, {
  enableQueryLogging: true,
  slowQueryThreshold: 100, // Log queries slower than 100ms
  logValues: false // Don't log parameter values for security
});

// All queries through this pool are now traced
const result = await instrumentedPool.query('SELECT * FROM users WHERE id = $1', [123]);
```

### Instrument a Client

```javascript
import { Client } from 'pg';
import { instrumentPgClient } from '@stacksleuth/db-agent';

const client = new Client(config);
await client.connect();

// Instrument individual client
instrumentPgClient(client, {
  slowQueryThreshold: 50
});

// Queries are now traced
const users = await client.query('SELECT * FROM users');
```

### Using with Backend Agent

```javascript
import express from 'express';
import { createBackendAgent } from '@stacksleuth/backend-agent';
import { instrumentPg } from '@stacksleuth/db-agent';

const app = express();
const backendAgent = createBackendAgent();
const pool = instrumentPg(new Pool(dbConfig));

// Both HTTP requests and database queries are traced
backendAgent.instrument(app);

app.get('/users', async (req, res) => {
  // This will show the full trace: HTTP request -> DB query
  const users = await pool.query('SELECT * FROM users');
  res.json(users.rows);
});
```

## Configuration Options

```javascript
const options = {
  enableQueryLogging: true,    // Enable/disable query logging
  slowQueryThreshold: 100,     // Threshold for slow query warnings (ms)
  logValues: false,            // Whether to log parameter values
};

instrumentPg(pool, options);
```

## Features

### Automatic Query Tracing

- **Query Performance** - Track execution time for all queries
- **Query Type Detection** - Automatically categorize SELECT, INSERT, UPDATE, DELETE
- **Table Extraction** - Identify which tables are being queried
- **Parameter Tracking** - Count and optionally log query parameters

### Performance Monitoring

```javascript
// Slow queries are automatically logged
await pool.query('SELECT * FROM large_table WHERE expensive_operation()');
// Console: 🐌 Slow query detected (1234ms): SELECT * FROM large_table WHERE expensive_operation()

// Query statistics are tracked
const collector = dbAgent.getCollector();
collector.on('trace:completed', (trace) => {
  console.log(`Query: ${trace.name} (${trace.timing.duration}ms)`);
});
```

### N+1 Query Detection

The agent automatically detects potential N+1 query patterns:

```javascript
// This will trigger an N+1 warning
for (const user of users) {
  await pool.query('SELECT * FROM posts WHERE user_id = $1', [user.id]);
}
// Console: ⚠️ Potential N+1 query pattern detected (15 database queries)
```

### Error Tracking

```javascript
try {
  await pool.query('INVALID SQL QUERY');
} catch (error) {
  // Error is automatically captured in the trace
  // Available in dashboard and reports
}
```

## Advanced Usage

### Custom Agent Configuration

```javascript
import { createDatabaseAgent } from '@stacksleuth/db-agent';

const dbAgent = createDatabaseAgent({
  enabled: true,
  sampling: { rate: 0.5 }, // Sample 50% of queries
  filters: {
    minDuration: 10 // Only track queries longer than 10ms
  }
}, {
  enableQueryLogging: true,
  slowQueryThreshold: 200,
  logValues: process.env.NODE_ENV === 'development'
});

const pool = dbAgent.instrumentPool(new Pool(config));
```

### Query Analysis

```javascript
// Access trace data for analysis
collector.on('span:completed', (span) => {
  if (span.type === 'db_query') {
    console.log({
      query: span.metadata.query,
      duration: span.timing.duration,
      table: span.metadata.table,
      rowCount: span.metadata.rowCount
    });
  }
});
```

## Security Considerations

### Parameter Logging

By default, parameter values are **not logged** for security:

```javascript
// Safe: Parameters are not logged
await pool.query('SELECT * FROM users WHERE email = $1', ['user@example.com']);
// Logged as: SELECT * FROM users WHERE email = $?

// Enable parameter logging only in development
instrumentPg(pool, {
  logValues: process.env.NODE_ENV === 'development'
});
```

### Query Sanitization

Queries are automatically sanitized in traces:
- Parameter placeholders (`$1`, `$2`) become `$?`
- String literals are replaced with `'?'`
- Sensitive patterns are masked

## Performance Impact

- **<1ms** overhead per query
- **Minimal memory usage** for trace storage
- **Intelligent sampling** to reduce production load
- **Non-blocking** - doesn't affect query execution

## Integration Examples

### With ORM (Prisma)

```javascript
// Instrument the underlying connection
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// Note: Direct Prisma instrumentation coming in future version
// For now, instrument the underlying pg connection if using PostgreSQL
```

### With Connection Pools

```javascript
import { Pool } from 'pg';

// Multiple pools can be instrumented
const readPool = instrumentPg(new Pool(readConfig), {
  logValues: false,
  slowQueryThreshold: 100
});

const writePool = instrumentPg(new Pool(writeConfig), {
  logValues: false,
  slowQueryThreshold: 50 // More strict for write operations
});
```

## Troubleshooting

### Common Issues

1. **Queries not appearing in traces**
   - Ensure the pool/client is instrumented before use
   - Check that sampling rate allows the queries through
   - Verify minimum duration filters

2. **Performance overhead**
   - Reduce sampling rate in production
   - Increase minimum duration threshold
   - Disable parameter logging

3. **Missing query details**
   - Enable query logging in configuration
   - Check that PostgreSQL logging is properly configured

## API Reference

### instrumentPg(pool, options?)

Instrument a PostgreSQL connection pool.

### instrumentPgClient(client, options?)

Instrument a PostgreSQL client connection.

### createDatabaseAgent(config?, options?)

Create a custom database agent with specific configuration.

## Links

- [GitHub Repository](https://github.com/Jack-GitHub12/StackSleuth)
- [Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)
- [Issues](https://github.com/Jack-GitHub12/StackSleuth/issues) 