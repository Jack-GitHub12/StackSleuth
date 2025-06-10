# @stacksleuth/frontend-agent

<div align="center">

![StackSleuth Frontend Agent](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=Frontend%20Agent)

**StackSleuth Frontend Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Ffrontend-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Ffrontend-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Frontend Agent?

Advanced frontend performance monitoring for web applications - DOM event tracking, component lifecycle profiling, bundle analysis, memory leak detection, and real-time user interaction monitoring.

## ✨ Key Features

- 🌐 **DOM Event Tracking**: Comprehensive user interaction monitoring
- ⚛️ **Component Lifecycle**: Framework-agnostic component profiling
- 📦 **Bundle Analysis**: JavaScript bundle performance optimization
- 💾 **Memory Leak Detection**: Client-side memory usage monitoring
- 📊 **Core Web Vitals**: LCP, FID, CLS, and other performance metrics
- 🔄 **Real-time Monitoring**: Live performance insights
- 📱 **Mobile Optimization**: Mobile-specific performance tracking
- 🎯 **User Journey Analysis**: Complete user interaction flow tracking

## 📦 Installation

```bash
npm install @stacksleuth/frontend-agent
```

```bash
yarn add @stacksleuth/frontend-agent
```

```bash
pnpm add @stacksleuth/frontend-agent
```

## 🏁 Quick Start

```typescript
import { FrontendAgent } from '@stacksleuth/frontend-agent';

// Initialize the agent
const agent = new FrontendAgent({
  enabled: true,
  trackUserInteractions: true,
  monitorWebVitals: true
});

// Start monitoring
agent.startMonitoring();

// Track custom events
agent.trackEvent('user-action', {
  action: 'button-click',
  component: 'LoginForm'
});

// Track page navigation
agent.trackPageView('/dashboard', {
  userId: '12345',
  referrer: document.referrer
});
```

## 📚 Resources

- **[Official Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)**
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/frontend-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/frontend-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/frontend-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>