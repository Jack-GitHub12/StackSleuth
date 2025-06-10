# @stacksleuth/core

<div align="center">

![StackSleuth Logo](../../assets/logo.svg)

**Advanced TypeScript-based Core Profiling Engine for StackSleuth**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fcore.svg)](https://badge.fury.io/js/%40stacksleuth%2Fcore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Core?

StackSleuth Core is the foundational profiling engine that powers the entire StackSleuth performance monitoring ecosystem. It provides real-time performance monitoring with flexible profiler, span tracing, and unified agent architecture. Features comprehensive metrics collection, memory optimization, and production-ready instrumentation.

## ✨ Key Features

- **🔬 Advanced Profiling**: Real-time code profiling with microsecond precision
- **📊 Span Tracing**: Distributed tracing across your entire application stack
- **🎯 Adaptive Sampling**: Intelligent sampling to minimize performance overhead
- **💾 Memory Optimization**: Built-in memory leak detection and optimization
- **🔧 Extensible Architecture**: Foundation for specialized monitoring agents
- **📈 Performance Metrics**: Comprehensive performance data collection
- **🌐 Production Ready**: Battle-tested instrumentation for production environments
- **🔄 Real-time Monitoring**: Live performance insights with minimal latency

## 📦 Installation

```bash
# npm
npm install @stacksleuth/core

# yarn
yarn add @stacksleuth/core

# pnpm
pnpm add @stacksleuth/core
```

```bash
yarn add @stacksleuth/core
```

```bash
pnpm add @stacksleuth/core
```

## 🏁 Quick Start

### Basic Profiling

```typescript
import { ProfilerCore } from '@stacksleuth/core';

// Initialize the profiler
const profiler = new ProfilerCore({
  enabled: true,
  sampleRate: 0.1, // 10% sampling
  bufferSize: 1000
});

// Start profiling
profiler.startProfiling();

// Your application code
async function criticalFunction() {
  const span = profiler.startSpan('critical-operation');
  
  try {
    // Simulate work
    await performDatabaseQuery();
    await processData();
    
    span.setStatus('success');
  } catch (error) {
    span.setStatus('error', error.message);
    throw error;
  } finally {
    span.end();
  }
}

// Get performance metrics
const metrics = profiler.getMetrics();
console.log('Performance Summary:', metrics);
```

### Advanced Configuration

```typescript
import { ProfilerCore, BaseAgent } from '@stacksleuth/core';

// Custom configuration
const profiler = new ProfilerCore({
  enabled: true,
  endpoint: 'https://your-monitoring-endpoint.com',
  apiKey: 'your-api-key',
  sampleRate: 0.05, // 5% sampling for production
  bufferSize: 2000,
  flushInterval: 10000, // 10 seconds
  debug: false,
  adaptiveSampling: true,
  memoryOptimization: true
});

// Create custom agent
class CustomAgent extends BaseAgent {
  public startMonitoring(): void {
    console.log('Starting custom monitoring...');
    // Your custom monitoring logic
  }

  public stopMonitoring(): void {
    console.log('Stopping custom monitoring...');
    // Your cleanup logic
  }
}

const agent = new CustomAgent({
  enabled: true,
  sampleRate: 0.1
});
```

### Memory Profiling

```typescript
import { MemoryProfiler } from '@stacksleuth/core';

const memoryProfiler = new MemoryProfiler();

// Start memory monitoring
memoryProfiler.startMonitoring();

// Take memory snapshot
const snapshot = memoryProfiler.takeSnapshot();
console.log('Memory usage:', snapshot);

// Detect memory leaks
const leaks = memoryProfiler.detectLeaks();
if (leaks.length > 0) {
  console.warn('Memory leaks detected:', leaks);
}
```


## 📖 Comprehensive Examples

### Basic Profiling

```typescript
import { ProfilerCore } from '@stacksleuth/core';

const profiler = new ProfilerCore({
  enabled: true,
  sampleRate: 0.1
});

profiler.startProfiling();

// Profile a function
async function processData() {
  const span = profiler.startSpan('data-processing');
  
  try {
    // Your business logic
    const result = await heavyDataProcessing();
    span.setStatus('success');
    return result;
  } catch (error) {
    span.setStatus('error', error.message);
    throw error;
  } finally {
    span.end();
  }
}

// Get performance insights
const metrics = profiler.getMetrics();
console.log('Performance Summary:', metrics);
```

### Custom Metrics

```typescript
// Track business-specific metrics
profiler.recordMetric('orders.processed', 1, {
  region: 'us-east-1',
  paymentMethod: 'credit-card',
  value: 99.99
});

profiler.recordMetric('users.active', 1, {
  plan: 'premium',
  source: 'mobile-app'
});
```

## 🎯 Real-World Usage

### Production Configuration

```typescript
const agent = new Core({
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


## 🏗️ Architecture

StackSleuth Core follows a modular architecture:

```
┌─────────────────┐
│   Your App      │
└─────────────────┘
         │
┌─────────────────┐
│  StackSleuth    │
│     Agents      │
└─────────────────┘
         │
┌─────────────────┐
│ StackSleuth     │
│     Core        │
└─────────────────┘
         │
┌─────────────────┐
│   Data Layer    │
└─────────────────┘
```

### Core Components

- **ProfilerCore**: Main profiling engine
- **BaseAgent**: Foundation for all monitoring agents
- **SpanTracer**: Distributed tracing implementation
- **MetricsCollector**: Performance data aggregation
- **AdaptiveSampler**: Intelligent sampling strategies
- **MemoryProfiler**: Memory usage optimization

## 📊 API Reference

### ProfilerCore

```typescript
class ProfilerCore {
  constructor(config: ProfilerConfig)
  
  // Core methods
  startProfiling(): void
  stopProfiling(): void
  startSpan(name: string, metadata?: any): Span
  recordMetric(name: string, value: number, metadata?: any): void
  
  // Data access
  getMetrics(): PerformanceMetrics
  getSpans(): Span[]
  exportData(): ExportData
  
  // Configuration
  updateConfig(config: Partial<ProfilerConfig>): void
  getConfig(): ProfilerConfig
}
```

### BaseAgent

```typescript
abstract class BaseAgent {
  constructor(config: AgentConfig)
  
  // Abstract methods (implement in subclasses)
  abstract startMonitoring?(): void
  abstract stopMonitoring?(): void
  
  // Built-in methods
  recordMetric(name: string, value: number, metadata?: any): void
  getConfig(): AgentConfig
  updateConfig(config: Partial<AgentConfig>): void
}
```

## 🎯 Why Choose StackSleuth Core?

### 🚀 **Performance First**
- Ultra-low overhead (< 1% performance impact)
- Adaptive sampling reduces monitoring costs
- Production-optimized memory management

### 🔧 **Developer Experience**
- TypeScript-first with excellent IntelliSense
- Intuitive API design
- Comprehensive documentation and examples

### 🌐 **Enterprise Ready**
- Proven in production environments
- Scalable architecture for large applications
- Industry-standard security practices

### 🔄 **Ecosystem Integration**
- Foundation for 15+ specialized agents
- Seamless integration with popular frameworks
- Extensible plugin architecture

## 🚀 Specialized Agents

StackSleuth Core powers a complete ecosystem of monitoring agents:

- **Frontend**: `@stacksleuth/frontend-agent`, `@stacksleuth/vue-agent`, `@stacksleuth/svelte-agent`
- **Backend**: `@stacksleuth/backend-agent`, `@stacksleuth/fastapi-agent`, `@stacksleuth/django-agent`, `@stacksleuth/laravel-agent`
- **Databases**: `@stacksleuth/db-agent`, `@stacksleuth/redis-agent`, `@stacksleuth/mongodb-agent`, `@stacksleuth/mysql-agent`
- **Browser**: `@stacksleuth/browser-agent`, `@stacksleuth/browser-extension`
- **Tools**: `@stacksleuth/cli`, `@stacksleuth/performance-optimizer`

## 📖 Examples

### Express.js Integration

```typescript
import express from 'express';
import { ProfilerCore } from '@stacksleuth/core';

const app = express();
const profiler = new ProfilerCore({ enabled: true });

// Middleware for automatic request profiling
app.use((req, res, next) => {
  const span = profiler.startSpan(`${req.method} ${req.path}`);
  
  res.on('finish', () => {
    span.setMetadata({
      statusCode: res.statusCode,
      responseTime: Date.now() - span.startTime
    });
    span.end();
  });
  
  next();
});

app.get('/api/users', async (req, res) => {
  const span = profiler.startSpan('fetch-users');
  
  try {
    const users = await fetchUsers();
    res.json(users);
    span.setStatus('success');
  } catch (error) {
    span.setStatus('error', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  } finally {
    span.end();
  }
});
```

### Custom Metrics

```typescript
import { ProfilerCore } from '@stacksleuth/core';

const profiler = new ProfilerCore({ enabled: true });

// Business metrics
function trackBusinessMetric(metricName: string, value: number) {
  profiler.recordMetric(metricName, value, {
    timestamp: Date.now(),
    source: 'business-logic',
    environment: process.env.NODE_ENV
  });
}

// Usage
trackBusinessMetric('orders.processed', 1);
trackBusinessMetric('revenue.generated', 99.99);
trackBusinessMetric('users.active', 1);
```

## ⚙️ Configuration Options

```typescript
interface ProfilerConfig {
  enabled?: boolean;           // Enable/disable profiling
  endpoint?: string;          // Remote endpoint for data export
  apiKey?: string;           // API key for authentication
  sampleRate?: number;       // Sampling rate (0.0 - 1.0)
  bufferSize?: number;       // Internal buffer size
  flushInterval?: number;    // Data flush interval (ms)
  debug?: boolean;           // Enable debug logging
  adaptiveSampling?: boolean; // Enable adaptive sampling
  memoryOptimization?: boolean; // Enable memory optimization
  maxSpans?: number;         // Maximum concurrent spans
  exportFormat?: 'json' | 'protobuf'; // Data export format
}
```

## 🔧 Advanced Usage

### Custom Samplers

```typescript
import { ProfilerCore, CustomSampler } from '@stacksleuth/core';

class LoadBasedSampler extends CustomSampler {
  shouldSample(): boolean {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    
    // Reduce sampling under high load
    if (cpuUsage.user > 80 || memoryUsage.heapUsed > 500 * 1024 * 1024) {
      return Math.random() < 0.01; // 1% sampling
    }
    
    return Math.random() < 0.1; // 10% sampling
  }
}

const profiler = new ProfilerCore({
  enabled: true,
  customSampler: new LoadBasedSampler()
});
```

### Data Export

```typescript
// Export to external monitoring system
const exportData = profiler.exportData();

// Send to your monitoring service
await fetch('https://your-monitoring-service.com/api/metrics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify(exportData)
});
```

## 🧪 Testing

StackSleuth Core includes comprehensive testing utilities:

```typescript
import { ProfilerCore, TestUtils } from '@stacksleuth/core';

describe('Application Performance', () => {
  let profiler: ProfilerCore;
  
  beforeEach(() => {
    profiler = TestUtils.createTestProfiler();
  });
  
  it('should track function performance', async () => {
    const span = profiler.startSpan('test-function');
    
    await someAsyncFunction();
    
    span.end();
    
    const metrics = profiler.getMetrics();
    expect(metrics.spans).toHaveLength(1);
    expect(metrics.spans[0].duration).toBeGreaterThan(0);
  });
});
```

## 📈 Performance Impact

StackSleuth Core is designed for production use with minimal overhead:

- **CPU Overhead**: < 1% in production environments
- **Memory Overhead**: < 10MB base memory usage
- **Network Overhead**: Configurable batching and compression
- **Disk I/O**: Minimal temporary storage with automatic cleanup

## 🔒 Security

- **No sensitive data collection** by default
- **Configurable data sanitization** for PII protection
- **Secure data transmission** with TLS encryption
- **API key authentication** for remote endpoints
- **Local-first architecture** - no mandatory external dependencies

## 🛠️ Troubleshooting

### Common Issues

**High Memory Usage**
```typescript
// Reduce buffer size and enable memory optimization
const profiler = new ProfilerCore({
  bufferSize: 500,
  memoryOptimization: true,
  flushInterval: 5000
});
```

**Performance Impact**
```typescript
// Reduce sampling rate for production
const profiler = new ProfilerCore({
  sampleRate: 0.01, // 1% sampling
  adaptiveSampling: true
});
```

**Debug Logging**
```typescript
// Enable debug mode for troubleshooting
const profiler = new ProfilerCore({
  debug: true,
  enabled: true
});
```

## 📚 Resources

- **[Official Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)**
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/api.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples)**
- **[Performance Best Practices](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/best-practices.md)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/Jack-GitHub12/StackSleuth.git
cd StackSleuth
npm install
npm run build
npm test
```

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/Jack-GitHub12/StackSleuth/issues) on GitHub.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ by the StackSleuth team and our amazing [contributors](https://github.com/Jack-GitHub12/StackSleuth/graphs/contributors).

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/core)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div> 