# @stacksleuth/browser-agent

<div align="center">

![StackSleuth Browser Agent](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=Browser%20Agent)

**StackSleuth Browser Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fbrowser-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Fbrowser-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Browser Agent?

Advanced browser automation and performance monitoring agent - Playwright/Puppeteer integration, website crawling, user interaction simulation, screenshot capture, and real-time debugging capabilities.

## ✨ Key Features

- 🌐 **Browser Automation**: Playwright and Puppeteer integration
- 🕷️ **Website Crawling**: Automated website performance analysis
- 👤 **User Interaction Simulation**: Realistic user behavior testing
- 📷 **Screenshot Capture**: Visual regression and performance testing
- 🔍 **Real-time Debugging**: Live browser debugging capabilities
- 📊 **Performance Metrics**: Core Web Vitals and custom metrics
- 🎯 **Load Testing**: Automated performance testing workflows
- ⚡ **Headless & GUI Mode**: Flexible testing environments

## 📦 Installation

```bash
npm install @stacksleuth/browser-agent
```

```bash
yarn add @stacksleuth/browser-agent
```

```bash
pnpm add @stacksleuth/browser-agent
```

## 🏁 Quick Start

```python
import { BrowserAgent } from '@stacksleuth/browser-agent';

// Initialize browser agent
const agent = new BrowserAgent({
  enabled: true,
  browser: 'chromium', // or 'firefox', 'webkit'
  headless: true
});

// Start monitoring
await agent.startMonitoring();

// Create a new session
const session = await agent.createSession({
  url: 'https://example.com',
  waitUntil: 'networkidle'
});

// Simulate user interactions
await session.click('button#login');
await session.type('input[name="username"]', 'testuser');
await session.type('input[name="password"]', 'password');
await session.click('button[type="submit"]');

// Capture performance metrics
const metrics = await session.getPerformanceMetrics();
console.log('Performance:', metrics);

// Take screenshot
await session.screenshot('login-page.png');
```

## 📚 Resources

- **[Official Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)**
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/browser-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/browser-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/browser-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>