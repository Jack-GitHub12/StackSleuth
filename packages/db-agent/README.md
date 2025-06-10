# @stacksleuth/db-agent

<div align="center">

![StackSleuth Database Agent](../../assets/logo.svg)

**StackSleuth Database Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fdb-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Fdb-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Database Agent?

Universal database performance monitoring agent - Multi-database support, query optimization, connection pool monitoring, transaction tracking, and comprehensive database performance analytics.

## ✨ Key Features

- 🗄️ **Multi-Database Support**: PostgreSQL, MySQL, MongoDB, Redis, and more
- 📊 **Query Performance Analysis**: Slow query detection and optimization
- 🔗 **Connection Pool Monitoring**: Database connection efficiency tracking
- 💾 **Transaction Tracking**: Complete transaction performance monitoring
- 📈 **Real-time Metrics**: Live database performance insights
- 🔍 **Index Analysis**: Index usage and optimization recommendations
- ⚡ **ORM Integration**: Seamless integration with popular ORMs
- 🎯 **Custom Query Tracking**: Application-specific database monitoring

## 📦 Installation

```bash
# npm
npm install @stacksleuth/db-agent

# yarn
yarn add @stacksleuth/db-agent

# pnpm
pnpm add @stacksleuth/db-agent
```

```bash
yarn add @stacksleuth/db-agent
```

```bash
pnpm add @stacksleuth/db-agent
```

## 🏁 Quick Start

```typescript
import { DatabaseAgent } from '@stacksleuth/db-agent';
import { Pool } from 'pg';

// Initialize database agent
const agent = new DatabaseAgent({
  enabled: true,
  databases: ['postgresql', 'redis'],
  slowQueryThreshold: 100, // ms
  trackConnections: true
});

// PostgreSQL example
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password'
});

// Instrument database connection
agent.instrumentConnection(pool, 'postgresql');

// Start monitoring
agent.startMonitoring();

// Your database queries are now monitored
const result = await pool.query('SELECT * FROM users WHERE active = $1', [true]);
```


## 🛠️ Troubleshooting

### Common Issues

**Agent Not Starting**
```typescript
// Enable debug mode
const agent = new DbAgent({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new DbAgent({
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
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/db-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/db-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/db-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>


 