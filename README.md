# StackSleuth

**Open-source, real-time performance profiling tool for full-stack applications**

StackSleuth provides unified profiling across frontend, backend, and database layers with minimal overhead and a developer-first experience.

## 🚀 Features

- **🔄 Real-time Tracing** - Live performance monitoring across your entire stack
- **📊 Visual Dashboard** - Beautiful web-based interface with waterfall charts and flamegraphs
- **🎯 Smart Alerts** - Automatic detection of N+1 queries, memory leaks, and slow operations
- **⚡ Lightweight** - <5% performance overhead with intelligent sampling
- **🔧 Developer-Friendly** - Drop-in integration with minimal configuration
- **🏗️ Multi-Framework** - Support for React, Express, Next.js, and more
- **📈 Performance Insights** - Detailed statistics and optimization recommendations

## 📦 Quick Start

### Installation

```bash
npm install -g @stacksleuth/cli
```

### Initialize in your project

```bash
cd your-project
sleuth init
```

### Start profiling

```bash
sleuth watch
```

Visit `http://localhost:3001` to view your performance dashboard.

## 🏗️ Architecture

StackSleuth consists of several packages:

- **`@stacksleuth/core`** - Core types, utilities, and trace collection
- **`@stacksleuth/cli`** - Command-line interface and dashboard
- **`@stacksleuth/backend-agent`** - Node.js/Express instrumentation
- **`@stacksleuth/frontend-agent`** - React performance tracking
- **`@stacksleuth/db-agent`** - Database query instrumentation

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
git clone https://github.com/yourusername/stacksleuth.git
cd stacksleuth
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
├── db-agent/       # Database instrumentation
└── dashboard/      # Web dashboard (future)
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

### Areas where we need help:

- Additional framework support (Vue, Svelte, FastAPI, Django)
- Database integrations (MongoDB, Redis, MySQL)
- Advanced visualization features
- Performance optimizations
- Documentation and examples

## 📋 Roadmap

### Current (MVP)
- ✅ Core tracing infrastructure
- ✅ CLI and dashboard
- ✅ Express.js backend agent
- ✅ React frontend agent
- ✅ PostgreSQL instrumentation

### Next (v0.2)
- 🔄 Browser extension for live inspection
- 🔄 Session replay integration
- 🔄 Advanced flamegraph visualization
- 🔄 CI/CD integration (GitHub Actions)

### Future (v1.0)
- 🔄 Hosted SaaS dashboard
- 🔄 Team collaboration features
- 🔄 Advanced ML-powered recommendations
- 🔄 Multi-language support (Python, Go)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by tools like DataDog, New Relic, and Chrome DevTools
- Built with modern web technologies: TypeScript, React, WebSockets
- Thanks to the open-source community for libraries and inspiration

---

**Made with ❤️ for developers who care about performance** # StackSleuth
