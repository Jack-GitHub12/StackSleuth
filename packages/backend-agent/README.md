# @stacksleuth/backend-agent

<div align="center">

![StackSleuth Backend Agent](../../assets/logo.svg)

**StackSleuth Backend Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fbackend-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Fbackend-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Backend Agent?

Comprehensive backend performance monitoring agent for Node.js applications - HTTP request tracing, database query optimization, memory profiling, and real-time metrics collection with WebSocket integration.

## ✨ Key Features

- 🚀 **HTTP Request Monitoring**: Automatic request/response tracking
- 📊 **Database Query Optimization**: Real-time query performance analysis
- 💾 **Memory Profiling**: Advanced memory leak detection and optimization
- 🔄 **Real-time Metrics**: Live performance data with WebSocket integration
- 🎯 **Custom Middleware**: Easy integration with existing applications
- 📈 **Performance Analytics**: Comprehensive performance data collection
- 🔧 **Framework Agnostic**: Works with Express, Koa, Fastify, and more
- ⚡ **Production Ready**: Minimal overhead, battle-tested implementation

## 📦 Installation

```bash
# npm
npm install @stacksleuth/backend-agent

# yarn
yarn add @stacksleuth/backend-agent

# pnpm
pnpm add @stacksleuth/backend-agent
```

```bash
yarn add @stacksleuth/backend-agent
```

```bash
pnpm add @stacksleuth/backend-agent
```

## 🏁 Quick Start

```typescript
import express from 'express';
import { BackendAgent } from '@stacksleuth/backend-agent';

const app = express();
const agent = new BackendAgent({
  enabled: true,
  sampleRate: 0.1
});

// Start monitoring
agent.startMonitoring();

// Middleware integration
app.use(agent.middleware());

app.get('/api/users', async (req, res) => {
  // Your route logic
  const users = await User.find();
  res.json(users);
});

app.listen(3000, () => {
  console.log('Server running with StackSleuth monitoring');
});
```


## 📖 Comprehensive Examples

### Express.js Integration

```typescript
import express from 'express';
import { BackendAgent } from '@stacksleuth/backend-agent';

const app = express();
const agent = new BackendAgent({
  enabled: true,
  projectId: 'your-project-id',
  sampleRate: 0.1
});

// Start monitoring
agent.startMonitoring();

// Add middleware (must be first)
app.use(agent.middleware());

app.get('/api/users', async (req, res) => {
  const users = await getUsersFromDatabase();
  res.json(users);
});

app.listen(3000, () => {
  console.log('Server running with StackSleuth monitoring');
});
```

### Custom Error Tracking

```typescript
// Track custom errors
app.use((error, req, res, next) => {
  agent.recordError(error, {
    userId: req.user?.id,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ error: 'Internal server error' });
});
```

## 🎯 Real-World Usage

### Production Configuration

```typescript
const agent = new BackendAgent({
  enabled: process.env.NODE_ENV === 'production',
  projectId: process.env.STACKSLEUTH_PROJECT_ID,
  apiKey: process.env.STACKSLEUTH_API_KEY,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  bufferSize: 1000,
  flushInterval: 10000
});
```

### Monitoring Best Practices

- **Sampling Rate**: Use lower sampling rates (1-5%) in production
- **Buffer Management**: Configure appropriate buffer sizes for your traffic
- **Error Handling**: Always include error context in your monitoring
- **Security**: Never log sensitive data like passwords or API keys
- **Performance**: Monitor the monitoring - track agent overhead



## 🛠️ Troubleshooting

### Common Issues

**Agent Not Starting**
```typescript
// Enable debug mode
const agent = new BackendAgent({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new BackendAgent({
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
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/backend-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/backend-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/backend-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>