# @stacksleuth/redis-agent

<div align="center">

![StackSleuth Redis Agent](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=Redis%20Agent)

**StackSleuth Redis Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fredis-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Fredis-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Redis Agent?

Advanced Redis performance monitoring agent - Command-level tracking, memory usage analysis, connection pooling optimization, slow query detection, and real-time cache performance metrics.

## ✨ Key Features

- 🔴 **Command-level Tracking**: Individual Redis command performance
- 💾 **Memory Usage Analysis**: Redis memory optimization insights
- 🔗 **Connection Pool Monitoring**: Connection efficiency tracking
- 🐌 **Slow Query Detection**: Automatic slow command identification
- 📊 **Cache Hit/Miss Metrics**: Cache performance optimization
- 🔄 **Real-time Monitoring**: Live Redis performance insights
- ⚡ **Multiple Client Support**: Redis, ioredis, node_redis support
- 🎯 **Custom Metrics**: Application-specific Redis monitoring

## 📦 Installation

```bash
npm install @stacksleuth/redis-agent
```

```bash
yarn add @stacksleuth/redis-agent
```

```bash
pnpm add @stacksleuth/redis-agent
```

## 🏁 Quick Start

```typescript
import Redis from 'ioredis';
import { RedisAgent } from '@stacksleuth/redis-agent';

// Initialize Redis client
const redis = new Redis({
  host: 'localhost',
  port: 6379
});

// Initialize Redis agent
const agent = new RedisAgent({
  enabled: true,
  monitorCommands: true,
  trackMemory: true,
  slowQueryThreshold: 100 // ms
});

// Start monitoring
agent.startMonitoring();

// Instrument Redis client
agent.instrumentClient(redis);

// Your Redis operations are now monitored
await redis.set('key', 'value');
const value = await redis.get('key');
```

## 📚 Resources

- **[Official Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)**
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/redis-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/redis-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/redis-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>