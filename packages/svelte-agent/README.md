# @stacksleuth/svelte-agent

<div align="center">

![StackSleuth Svelte Agent](../../assets/logo.svg)

**StackSleuth Svelte Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fsvelte-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Fsvelte-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Svelte Agent?

Specialized Svelte performance monitoring agent - Component lifecycle tracking, store subscription monitoring, reactive state analysis, DOM mutation observation, and real-time memory profiling.

## ✨ Key Features

- 🔥 **Svelte Component Tracking**: Component lifecycle and performance monitoring
- 🗄️ **Store Monitoring**: Svelte store subscription and state tracking
- 🔄 **Reactive State Analysis**: Svelte reactivity system performance
- 🌐 **DOM Mutation Tracking**: Efficient DOM change monitoring
- 💾 **Memory Profiling**: Component memory usage optimization
- ⚡ **SvelteKit Integration**: Full-stack Svelte application monitoring
- 📊 **Transition Analysis**: Svelte transition and animation performance
- 🎯 **Action Tracking**: Custom action performance monitoring

## 📦 Installation

```bash
# npm
npm install @stacksleuth/svelte-agent

# yarn
yarn add @stacksleuth/svelte-agent

# pnpm
pnpm add @stacksleuth/svelte-agent
```

```bash
yarn add @stacksleuth/svelte-agent
```

```bash
pnpm add @stacksleuth/svelte-agent
```

## 🏁 Quick Start

```typescript
import { SvelteAgent } from '@stacksleuth/svelte-agent';
import App from './App.svelte';

// Initialize Svelte agent
const agent = new SvelteAgent({
  enabled: true,
  trackComponents: true,
  trackStores: true,
  monitorDOM: true
});

// Start monitoring
agent.startMonitoring();

// Initialize your Svelte app
const app = new App({
  target: document.getElementById('app'),
  props: {
    name: 'world'
  }
});

export default app;
```


## 🛠️ Troubleshooting

### Common Issues

**Agent Not Starting**
```typescript
// Enable debug mode
const agent = new SvelteAgent({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new SvelteAgent({
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
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/svelte-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/svelte-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/svelte-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>