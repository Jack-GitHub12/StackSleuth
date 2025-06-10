# @stacksleuth/redis-agent

<div align="center">

![StackSleuth Redis Agent](../../assets/logo.svg)

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
# npm
npm install @stacksleuth/redis-agent

# yarn
yarn add @stacksleuth/redis-agent

# pnpm
pnpm add @stacksleuth/redis-agent
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


## 📖 Comprehensive Examples

### Redis Monitoring Setup

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
  slowQueryThreshold: 100
});

// Start monitoring
agent.startMonitoring();

// Instrument Redis client
agent.instrumentClient(redis);

// Your Redis operations are now monitored
await redis.set('user:123', JSON.stringify(userData));
const user = await redis.get('user:123');
```

### Cache Performance Tracking

```typescript
// Track cache hit/miss rates
class CacheService {
  async get(key) {
    const value = await redis.get(key);
    
    // Track cache metrics
    agent.recordMetric(value ? 'cache.hit' : 'cache.miss', 1, {
      keyPattern: key.split(':')[0]
    });
    
    return value;
  }
  
  async set(key, value, ttl = 3600) {
    await redis.setex(key, ttl, value);
    
    agent.recordMetric('cache.set', 1, {
      ttl,
      keyPattern: key.split(':')[0]
    });
  }
}
```

## 🎯 Real-World Usage

### Production Configuration

```typescript
const agent = new RedisAgent({
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
const agent = new RedisAgent({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new RedisAgent({
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