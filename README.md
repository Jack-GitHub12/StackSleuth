# StackSleuth

**Open-source, real-time performance profiling tool for full-stack applications**

StackSleuth provides unified profiling across frontend, backend, and database layers with minimal overhead and a developer-first experience.

📚 **[Documentation](https://jack-github12.github.io/StackSleuth/)** | 🎯 **[Dashboard Demo](https://jack-github12.github.io/StackSleuth/dashboard.html)** | 📦 **[NPM Packages](https://jack-github12.github.io/StackSleuth/packages.html)** | 🚀 **[Quick Start](https://jack-github12.github.io/StackSleuth/getting-started.html)**

## 🚀 Features

- **🔄 Real-time Tracing** - Live performance monitoring across your entire stack
- **📊 Visual Dashboard** - Beautiful web-based interface with waterfall charts and flamegraphs
- **🎯 Smart Alerts** - Automatic detection of N+1 queries, memory leaks, and slow operations
- **⚡ Lightweight** - <5% performance overhead with intelligent sampling
- **🔧 Developer-Friendly** - Drop-in integration with minimal configuration
- **🏗️ Multi-Framework** - Support for React, Express, Next.js, and more
- **📈 Performance Insights** - Detailed statistics and optimization recommendations

## ✨ Latest Enhancements

### 🧱 Extended Framework Support
- ✅ **Vue.js Agent** (`@stacksleuth/vue-agent`) - Complete Vue 3 Composition API integration
- ✅ **MongoDB Agent** (`@stacksleuth/mongodb-agent`) - Full NoSQL operation monitoring

### 📊 Advanced Visualization
- ✅ **Interactive Flamegraphs** - Hierarchical execution visualization with drill-down
- ✅ **Trace Comparison View** - Side-by-side performance analysis
- ✅ **Web Vitals Monitoring** - Real-time LCP, FID, CLS tracking

### 🚀 Performance Intelligence
- ✅ **Adaptive Sampling** - Automatic load-based sampling adjustment
- ✅ **Smart Memory Management** - Prevents overhead under pressure
- ✅ **N+1 Query Detection** - Automatic anti-pattern identification

### 📚 Production-Ready Demo
- ✅ **Full-Stack Example** - Complete Next.js + Express + PostgreSQL + MongoDB
- ✅ **Real Performance Scenarios** - Caching, transactions, complex queries
- ✅ **Interactive Documentation** - Live examples in `examples/fullstack-demo/`

## 📦 Quick Start

### Installation

```bash
# Install the CLI globally
npm install -g @stacksleuth/cli

# Or run directly with npx
npx @stacksleuth/cli init
```

### Initialize in your project

```bash
cd your-project
sleuth init
```

This will:
- Generate configuration files (`stacksleuth.config.js`)
- Create framework-specific example code
- Set up the appropriate agent packages

### Start profiling

```bash
sleuth watch
```

Visit `http://localhost:3001` to view your performance dashboard.

> **Note**: Packages are ready for npm publishing. See [PUBLISHING.md](PUBLISHING.md) for publication instructions.

## 🏗️ Architecture

StackSleuth consists of several packages:

- **`@stacksleuth/core`** - Core types, utilities, and trace collection
- **`@stacksleuth/cli`** - Command-line interface and dashboard
- **`@stacksleuth/backend-agent`** - Node.js/Express instrumentation
- **`@stacksleuth/frontend-agent`** - React performance tracking
- **`@stacksleuth/vue-agent`** - Vue.js performance tracking (NEW)
- **`@stacksleuth/db-agent`** - PostgreSQL query instrumentation
- **`@stacksleuth/mongodb-agent`** - MongoDB operation monitoring (NEW)

## 🛠️ Usage

### Backend (Express.js)

```javascript
import express from 'express';
import { createBackendAgent } from '@stacksleuth/backend-agent';

const app = express();
const agent = createBackendAgent();

// Automatically instrument all routes
agent.instrument(app);

app.get('/api/users', async (req, res) => {
  // Manual tracing for specific operations
  const users = await agent.trace('db:getUsers', async () => {
    return await db.users.findMany();
  });
  
  res.json(users);
});
```

### Frontend (React)

```jsx
import { StackSleuthProvider, useTrace } from '@stacksleuth/frontend-agent';

function App() {
  return (
    <StackSleuthProvider>
      <UserList />
    </StackSleuthProvider>
  );
}

function UserList() {
  const { trace } = useTrace();
  
  const fetchUsers = async () => {
    // Trace API calls
    const users = await trace('api:fetchUsers', async () => {
      const response = await fetch('/api/users');
      return response.json();
    });
    
    setUsers(users);
  };
  
  // Component renders are automatically tracked
  return <div>{/* Your component */}</div>;
}
```

### Database (PostgreSQL)

```javascript
import { instrumentPg } from '@stacksleuth/db-agent';
import { Pool } from 'pg';

const pool = new Pool(config);

// Instrument the database connection
instrumentPg(pool, {
  enableQueryLogging: true,
  slowQueryThreshold: 100 // ms
});
```

### Frontend (Vue.js)

```javascript
import { createApp } from 'vue';
import { StackSleuthPlugin, useStackSleuth } from '@stacksleuth/vue-agent';

const app = createApp(App);

// Install StackSleuth plugin
app.use(StackSleuthPlugin, {
  enabled: true,
  sampling: { rate: 1.0 }
});

// In components
export default {
  setup() {
    const { trace, tracedRef } = useStackSleuth();
    
    // Trace async operations
    const fetchData = async () => {
      await trace('API Call', async () => {
        const response = await fetch('/api/data');
        return response.json();
      });
    };
    
    // Track reactive data changes
    const count = tracedRef(0, 'counter');
    
    return { fetchData, count };
  }
};
```

### Database (MongoDB)

```javascript
import { MongoClient } from 'mongodb';
import { instrumentMongoDB } from '@stacksleuth/mongodb-agent';

const client = new MongoClient(uri);

// Instrument MongoDB operations
const instrumentedClient = instrumentMongoDB(client, {
  enableQueryLogging: true,
  slowQueryThreshold: 100,
  logDocuments: false // Security: don't log document contents
});

const db = instrumentedClient.db('myapp');
const collection = db.collection('users');

// All operations are automatically traced
const users = await collection.find({ active: true }).toArray();
const result = await collection.insertOne({ name: 'John', email: 'john@example.com' });
```

### Advanced Features

```javascript
import { FlamegraphGenerator, AdaptiveSampler } from '@stacksleuth/core';

// Generate flamegraphs from trace data
const flamegraph = FlamegraphGenerator.generateFromTrace(trace);
const svg = FlamegraphGenerator.toSVG(flamegraph, 1200, 600);

// Use adaptive sampling for production
const sampler = new AdaptiveSampler(collector, {
  targetTracesPerSecond: 100,
  maxMemoryUsageMB: 500,
  minSamplingRate: 0.01,
  maxSamplingRate: 1.0
});

// Automatically adjusts based on system load
const decision = sampler.shouldSample();
if (decision.shouldSample) {
  // Start tracing...
}
```

## 📊 Dashboard Features

The StackSleuth dashboard provides:

- **Real-time trace visualization** with waterfall charts
- **Performance statistics** (P50, P95, P99 latencies)
- **Error tracking** and stack traces
- **Performance issue detection** with suggestions
- **Historical data** and trend analysis

## ⚙️ Configuration

Create a `stacksleuth.config.js` file:

```javascript
export default {
  enabled: process.env.NODE_ENV !== 'production',
  sampling: {
    rate: 0.1, // Sample 10% of requests
    maxTracesPerSecond: 100
  },
  filters: {
    excludeUrls: [/\/health$/, /\.(js|css|png|jpg)$/],
    excludeComponents: ['DevTools'],
    minDuration: 10 // Only track spans >10ms
  },
  output: {
    console: true,
    dashboard: {
      enabled: true,
      port: 3001,
      host: 'localhost'
    }
  }
};
```

## 🚀 CLI Commands

### `sleuth watch`
Start real-time profiling in development mode
```bash
sleuth watch --port 3001 --sampling 1.0
```

### `sleuth report`
Generate performance reports
```bash
sleuth report --format json --output report.json --last 1h
```

### `sleuth init`
Initialize StackSleuth in your project
```bash
sleuth init --framework express --typescript
```

### `sleuth stats`
Show current performance statistics
```bash
sleuth stats
```

## 🎯 Performance Issues Detection

StackSleuth automatically detects:

- **Slow operations** (>1s response times)
- **N+1 query patterns** (multiple similar database queries)
- **Memory leaks** (growing memory usage)
- **Over-rendering** (excessive React re-renders)
- **Large bundle sizes** (frontend asset optimization)

## 🔧 Development

### Setup

```bash
git clone https://github.com/Jack-GitHub12/StackSleuth.git
cd StackSleuth
npm install
npm run build
```

### Package Structure

```
packages/
├── core/           # Core types and utilities
├── cli/            # Command-line interface
├── backend-agent/  # Node.js instrumentation
├── frontend-agent/ # React performance tracking
├── vue-agent/      # Vue.js performance tracking (NEW)
├── db-agent/       # PostgreSQL instrumentation
└── mongodb-agent/  # MongoDB instrumentation (NEW)
```

### Building

```bash
npm run build        # Build all packages
npm run dev          # Watch mode for development
npm run test         # Run tests
npm run lint         # Lint code
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Priority areas where we need help:

- **Database integrations** - Redis, MySQL, Supabase connectors
- **Additional frameworks** - Svelte, FastAPI, Django, Laravel
- **Performance optimizations** - Memory usage, CPU overhead reduction
- **Advanced visualizations** - Custom charts, real-time overlays
- **Testing & CI/CD** - Automated testing, performance benchmarks
- **Documentation** - Tutorials, best practices, case studies

### Recently completed ✅:
- Vue.js frontend agent with Composition API
- MongoDB NoSQL instrumentation
- Interactive flamegraph generation
- Adaptive sampling intelligence
- Production-ready demo project

## 📋 Roadmap

### Current (v0.1) - ✅ COMPLETED
- ✅ Core tracing infrastructure
- ✅ CLI and dashboard
- ✅ Express.js backend agent
- ✅ React frontend agent
- ✅ PostgreSQL instrumentation
- ✅ Vue.js agent with Composition API
- ✅ MongoDB instrumentation
- ✅ Interactive flamegraph visualization
- ✅ Adaptive sampling system
- ✅ Full-stack demo project

### Next (v0.2) - 🔄 IN PROGRESS
- 🔄 Svelte frontend agent
- 🔄 Redis operation profiling
- 🔄 MySQL query instrumentation
- 🔄 FastAPI backend instrumentation
- 🔄 Django backend instrumentation
- 🔄 Browser extension for live inspection
- 🔄 Session replay integration
- 🔄 CI/CD integration (GitHub Actions)

### Future (v1.0)
- 🔄 Hosted SaaS dashboard
- 🔄 Team collaboration features
- 🔄 Advanced ML-powered recommendations
- 🔄 Multi-language support (Python, Go, Rust)
- 🔄 Distributed tracing across microservices
- 🔄 Custom metric definitions
- 🔄 Alerting integrations (PagerDuty, Slack)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by tools like DataDog, New Relic, and Chrome DevTools
- Built with modern web technologies: TypeScript, React, WebSockets
- Thanks to the open-source community for libraries and inspiration

---

**Made with ❤️ for developers who care about performance** # StackSleuth
