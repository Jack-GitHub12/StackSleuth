# @stacksleuth/mysql-agent

<div align="center">

![StackSleuth MySQL Agent](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=MySQL%20Agent)

**StackSleuth MySQL Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fmysql-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Fmysql-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth MySQL Agent?

Advanced MySQL performance monitoring agent - Query optimization, index analysis, connection pool monitoring, slow query detection, and real-time database performance insights.

## ✨ Key Features

- 🐬 **Query Performance Monitoring**: MySQL query optimization analysis
- 📊 **Index Analysis**: Index usage and optimization recommendations
- 🔗 **Connection Pool Tracking**: Database connection efficiency
- 🐌 **Slow Query Detection**: Automatic slow query identification
- 💾 **Memory Usage Monitoring**: MySQL memory usage optimization
- 🔄 **Real-time Metrics**: Live database performance insights
- ⚡ **Multiple Driver Support**: mysql2, mysql, and TypeORM support
- 📈 **Table-level Statistics**: Per-table performance analytics

## 📦 Installation

```bash
npm install @stacksleuth/mysql-agent
```

```bash
yarn add @stacksleuth/mysql-agent
```

```bash
pnpm add @stacksleuth/mysql-agent
```

## 🏁 Quick Start

```typescript
import mysql from 'mysql2/promise';
import { MySQLAgent } from '@stacksleuth/mysql-agent';

// Initialize MySQL agent
const agent = new MySQLAgent({
  enabled: true,
  monitorQueries: true,
  trackSlowQueries: true,
  slowQueryThreshold: 1000 // ms
});

// Create MySQL connection
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'myapp'
});

// Instrument MySQL connection
agent.instrumentConnection(connection);

// Start monitoring
agent.startMonitoring();

// Your MySQL queries are now monitored
const [rows] = await connection.execute(
  'SELECT * FROM users WHERE active = ?',
  [true]
);
```

## 📚 Resources

- **[Official Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)**
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/mysql-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/mysql-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/mysql-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>