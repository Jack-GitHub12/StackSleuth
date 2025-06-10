# @stacksleuth/vue-agent

<div align="center">

![StackSleuth Vue.js Agent](../../assets/logo.svg)

**StackSleuth Vue.js Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fvue-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Fvue-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Vue.js Agent?

Specialized Vue.js performance monitoring agent - Component lifecycle tracking, Vuex state management profiling, route performance analysis, and reactive data monitoring with Vue DevTools integration.

## ✨ Key Features

- ⚛️ **Vue Component Tracking**: Lifecycle and render performance monitoring
- 🗄️ **Vuex Integration**: State management performance analysis
- 🛣️ **Vue Router Profiling**: Route transition and navigation tracking
- 🔄 **Reactive Data Monitoring**: Vue reactivity system performance
- 🔧 **Vue DevTools Integration**: Enhanced debugging capabilities
- 📊 **Component Tree Analysis**: Component hierarchy performance insights
- ⚡ **Composition API Support**: Vue 3 Composition API monitoring
- 🎯 **Custom Directives**: Track custom directive performance

## 📦 Installation

```bash
# npm
npm install @stacksleuth/vue-agent

# yarn
yarn add @stacksleuth/vue-agent

# pnpm
pnpm add @stacksleuth/vue-agent
```

```bash
yarn add @stacksleuth/vue-agent
```

```bash
pnpm add @stacksleuth/vue-agent
```

## 🏁 Quick Start

```python
import { createApp } from 'vue';
import { VueAgent } from '@stacksleuth/vue-agent';
import App from './App.vue';

const app = createApp(App);

// Initialize Vue agent
const agent = new VueAgent({
  enabled: true,
  trackComponents: true,
  trackVuex: true,
  trackRouter: true
});

// Install as Vue plugin
app.use(agent);

// Start monitoring
agent.startMonitoring();

app.mount('#app');
```


## 📖 Comprehensive Examples

### Vue 3 Setup

```typescript
import { createApp } from 'vue';
import { VueAgent } from '@stacksleuth/vue-agent';
import App from './App.vue';

const app = createApp(App);

// Initialize Vue agent
const agent = new VueAgent({
  enabled: true,
  trackComponents: true,
  trackVuex: true,
  trackRouter: true
});

// Install as Vue plugin
app.use(agent);

// Start monitoring
agent.startMonitoring();

app.mount('#app');
```

### Component Performance Tracking

```typescript
// In your Vue component
export default {
  name: 'UserDashboard',
  async mounted() {
    const span = this.$stacksleuth.startSpan('user-dashboard-load');
    
    try {
      await this.loadUserData();
      await this.loadDashboardMetrics();
      span.setStatus('success');
    } catch (error) {
      span.setStatus('error', error.message);
    } finally {
      span.end();
    }
  },
  methods: {
    async loadUserData() {
      // Track specific operations
      this.$stacksleuth.recordMetric('dashboard.user_data_loaded', 1);
    }
  }
}
```

## 🎯 Real-World Usage

### Production Configuration

```typescript
const agent = new VueAgent({
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
const agent = new VueAgent({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new VueAgent({
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
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/vue-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/vue-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/vue-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>