# @stacksleuth/mongodb-agent

<div align="center">

![StackSleuth MongoDB Agent](../../assets/logo.svg)

**StackSleuth MongoDB Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fmongodb-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Fmongodb-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth MongoDB Agent?

Advanced MongoDB performance monitoring agent - Query optimization, aggregation pipeline analysis, index usage tracking, connection pool monitoring, and real-time database performance metrics.

## ✨ Key Features

- 🍃 **Query Performance Monitoring**: MongoDB query optimization insights
- 🔍 **Aggregation Pipeline Analysis**: Complex aggregation performance
- 📊 **Index Usage Tracking**: Index efficiency and optimization
- 🔗 **Connection Pool Monitoring**: Database connection optimization
- 💾 **Memory Usage Analysis**: MongoDB memory usage tracking
- 🔄 **Real-time Metrics**: Live database performance monitoring
- ⚡ **Multiple Driver Support**: Native MongoDB driver and Mongoose
- 📈 **Collection-level Stats**: Per-collection performance insights

## 📦 Installation

```bash
# npm
npm install @stacksleuth/mongodb-agent

# yarn
yarn add @stacksleuth/mongodb-agent

# pnpm
pnpm add @stacksleuth/mongodb-agent
```

```bash
yarn add @stacksleuth/mongodb-agent
```

```bash
pnpm add @stacksleuth/mongodb-agent
```

## 🏁 Quick Start

```typescript
import { MongoClient } from 'mongodb';
import { MongoDBAgent } from '@stacksleuth/mongodb-agent';

// Initialize MongoDB agent
const agent = new MongoDBAgent({
  enabled: true,
  monitorQueries: true,
  trackIndexUsage: true,
  slowQueryThreshold: 100 // ms
});

// Connect to MongoDB
const client = new MongoClient('mongodb://localhost:27017');
await client.connect();

// Instrument MongoDB client
agent.instrumentClient(client);

// Start monitoring
agent.startMonitoring();

// Your MongoDB operations are now monitored
const db = client.db('myapp');
const users = await db.collection('users').find({ active: true }).toArray();
```


## 🛠️ Troubleshooting

### Common Issues

**Agent Not Starting**
```typescript
// Enable debug mode
const agent = new MongodbAgent({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new MongodbAgent({
  bufferSize: 500,
  flushInterval: 5000,
  sampleRate: 0.01
});
```

**Missing Metrics**
- Check that the agent is enabled
- Verify your API key and project ID
- Ensure sampling rate allows data through
- Check network connectivity to StackSleuth API

### Debug Mode

```bash
DEBUG=stacksleuth:* node your-app.js
```

## 📚 Resources

- **[Official Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)**
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/mongodb-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/mongodb-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/mongodb-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div> 