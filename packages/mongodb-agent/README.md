# @stacksleuth/mongodb-agent

MongoDB instrumentation agent for StackSleuth. Provides automatic tracing for common MongoDB operations.

## Installation

```bash
npm install @stacksleuth/mongodb-agent mongodb
```

## Quick Start

### Instrument a MongoDB Client

```ts
import { MongoClient } from 'mongodb';
import { instrumentMongoDB } from '@stacksleuth/mongodb-agent';

const client = new MongoClient('mongodb://localhost:27017/stacksleuth_demo');

// Instrument MongoDB operations
const instrumentedClient = instrumentMongoDB(client, {
  enableQueryLogging: true,
  slowQueryThreshold: 100,
  logDocuments: false // Don't log document contents in production
});

const db = instrumentedClient.db('stacksleuth_demo');
const collection = db.collection('users');

// All operations are automatically traced
const users = await collection.find({ active: true }).toArray();
```

### Options

```ts
{
  enableQueryLogging?: boolean;   // Log slow operations (default: true)
  slowQueryThreshold?: number;    // ms threshold for slow ops (default: 100)
  logDocuments?: boolean;         // Include document contents in logs (default: false)
  maxDocumentSize?: number;       // Max bytes when logging docs (default: 1024)
}
```

## Features

- Automatic tracing for `find`, `insert`, `update`, `delete`, `aggregate`, `count`, and index operations
- Slow operation warnings with thresholds
- Sensitive field masking and size-limited logging
- Minimal overhead and production-safe defaults

## Links

- GitHub Repository: https://github.com/Jack-GitHub12/StackSleuth
- Documentation: https://github.com/Jack-GitHub12/StackSleuth#readme
- Issues: https://github.com/Jack-GitHub12/StackSleuth/issues


