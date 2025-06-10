#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageConfigs = {
  'backend-agent': {
    title: 'StackSleuth Backend Agent',
    description: 'Comprehensive backend performance monitoring agent for Node.js applications - HTTP request tracing, database query optimization, memory profiling, and real-time metrics collection with WebSocket integration.',
    features: [
      '🚀 **HTTP Request Monitoring**: Automatic request/response tracking',
      '📊 **Database Query Optimization**: Real-time query performance analysis',
      '💾 **Memory Profiling**: Advanced memory leak detection and optimization',
      '🔄 **Real-time Metrics**: Live performance data with WebSocket integration',
      '🎯 **Custom Middleware**: Easy integration with existing applications',
      '📈 **Performance Analytics**: Comprehensive performance data collection',
      '🔧 **Framework Agnostic**: Works with Express, Koa, Fastify, and more',
      '⚡ **Production Ready**: Minimal overhead, battle-tested implementation'
    ],
    quickStart: `import express from 'express';
import { BackendAgent } from '@stacksleuth/backend-agent';

const app = express();
const agent = new BackendAgent({
  enabled: true,
  sampleRate: 0.1
});

// Start monitoring
agent.startMonitoring();

// Middleware integration
app.use(agent.middleware());

app.get('/api/users', async (req, res) => {
  // Your route logic
  const users = await User.find();
  res.json(users);
});

app.listen(3000, () => {
  console.log('Server running with StackSleuth monitoring');
});`,
    category: 'backend'
  },

  'frontend-agent': {
    title: 'StackSleuth Frontend Agent',
    description: 'Advanced frontend performance monitoring for web applications - DOM event tracking, component lifecycle profiling, bundle analysis, memory leak detection, and real-time user interaction monitoring.',
    features: [
      '🌐 **DOM Event Tracking**: Comprehensive user interaction monitoring',
      '⚛️ **Component Lifecycle**: Framework-agnostic component profiling',
      '📦 **Bundle Analysis**: JavaScript bundle performance optimization',
      '💾 **Memory Leak Detection**: Client-side memory usage monitoring',
      '📊 **Core Web Vitals**: LCP, FID, CLS, and other performance metrics',
      '🔄 **Real-time Monitoring**: Live performance insights',
      '📱 **Mobile Optimization**: Mobile-specific performance tracking',
      '🎯 **User Journey Analysis**: Complete user interaction flow tracking'
    ],
    quickStart: `import { FrontendAgent } from '@stacksleuth/frontend-agent';

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
});`,
    category: 'frontend'
  },

  'vue-agent': {
    title: 'StackSleuth Vue.js Agent',
    description: 'Specialized Vue.js performance monitoring agent - Component lifecycle tracking, Vuex state management profiling, route performance analysis, and reactive data monitoring with Vue DevTools integration.',
    features: [
      '⚛️ **Vue Component Tracking**: Lifecycle and render performance monitoring',
      '🗄️ **Vuex Integration**: State management performance analysis',
      '🛣️ **Vue Router Profiling**: Route transition and navigation tracking',
      '🔄 **Reactive Data Monitoring**: Vue reactivity system performance',
      '🔧 **Vue DevTools Integration**: Enhanced debugging capabilities',
      '📊 **Component Tree Analysis**: Component hierarchy performance insights',
      '⚡ **Composition API Support**: Vue 3 Composition API monitoring',
      '🎯 **Custom Directives**: Track custom directive performance'
    ],
    quickStart: `import { createApp } from 'vue';
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

app.mount('#app');`,
    category: 'frontend'
  },

  'svelte-agent': {
    title: 'StackSleuth Svelte Agent',
    description: 'Specialized Svelte performance monitoring agent - Component lifecycle tracking, store subscription monitoring, reactive state analysis, DOM mutation observation, and real-time memory profiling.',
    features: [
      '🔥 **Svelte Component Tracking**: Component lifecycle and performance monitoring',
      '🗄️ **Store Monitoring**: Svelte store subscription and state tracking',
      '🔄 **Reactive State Analysis**: Svelte reactivity system performance',
      '🌐 **DOM Mutation Tracking**: Efficient DOM change monitoring',
      '💾 **Memory Profiling**: Component memory usage optimization',
      '⚡ **SvelteKit Integration**: Full-stack Svelte application monitoring',
      '📊 **Transition Analysis**: Svelte transition and animation performance',
      '🎯 **Action Tracking**: Custom action performance monitoring'
    ],
    quickStart: `import { SvelteAgent } from '@stacksleuth/svelte-agent';
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

export default app;`,
    category: 'frontend'
  },

  'django-agent': {
    title: 'StackSleuth Django Agent',
    description: 'Advanced Django performance monitoring agent - Middleware tracking, database query optimization, template rendering analysis, session monitoring, and comprehensive view-level performance metrics.',
    features: [
      '🐍 **Django Middleware Tracking**: Request/response middleware performance',
      '🗄️ **ORM Query Optimization**: Django ORM query performance analysis',
      '🎨 **Template Rendering**: Django template performance monitoring',
      '👤 **Session Monitoring**: User session performance tracking',
      '🔍 **View-level Metrics**: Detailed view function performance data',
      '🔄 **Real-time Updates**: WebSocket integration for live monitoring',
      '📊 **Admin Integration**: Django admin performance insights',
      '⚡ **Production Ready**: Minimal overhead Django integration'
    ],
    quickStart: `# settings.py
INSTALLED_APPS = [
    # ... your apps
    'stacksleuth.django',
]

MIDDLEWARE = [
    'stacksleuth.django.middleware.StackSleuthMiddleware',
    # ... your middleware
]

STACKSLEUTH = {
    'ENABLED': True,
    'SAMPLE_RATE': 0.1,
    'MONITOR_DATABASE': True,
    'MONITOR_TEMPLATES': True,
}

# views.py
from stacksleuth.django import track_performance

@track_performance('user-list-view')
def user_list(request):
    users = User.objects.all()
    return JsonResponse({'users': list(users.values())})`,
    category: 'backend'
  },

  'redis-agent': {
    title: 'StackSleuth Redis Agent',
    description: 'Advanced Redis performance monitoring agent - Command-level tracking, memory usage analysis, connection pooling optimization, slow query detection, and real-time cache performance metrics.',
    features: [
      '🔴 **Command-level Tracking**: Individual Redis command performance',
      '💾 **Memory Usage Analysis**: Redis memory optimization insights',
      '🔗 **Connection Pool Monitoring**: Connection efficiency tracking',
      '🐌 **Slow Query Detection**: Automatic slow command identification',
      '📊 **Cache Hit/Miss Metrics**: Cache performance optimization',
      '🔄 **Real-time Monitoring**: Live Redis performance insights',
      '⚡ **Multiple Client Support**: Redis, ioredis, node_redis support',
      '🎯 **Custom Metrics**: Application-specific Redis monitoring'
    ],
    quickStart: `import Redis from 'ioredis';
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
const value = await redis.get('key');`,
    category: 'database'
  },

  'mysql-agent': {
    title: 'StackSleuth MySQL Agent',
    description: 'Advanced MySQL performance monitoring agent - Query optimization, index analysis, connection pool monitoring, slow query detection, and real-time database performance insights.',
    features: [
      '🐬 **Query Performance Monitoring**: MySQL query optimization analysis',
      '📊 **Index Analysis**: Index usage and optimization recommendations',
      '🔗 **Connection Pool Tracking**: Database connection efficiency',
      '🐌 **Slow Query Detection**: Automatic slow query identification',
      '💾 **Memory Usage Monitoring**: MySQL memory usage optimization',
      '🔄 **Real-time Metrics**: Live database performance insights',
      '⚡ **Multiple Driver Support**: mysql2, mysql, and TypeORM support',
      '📈 **Table-level Statistics**: Per-table performance analytics'
    ],
    installation: ['mysql2', 'mysql'],
    quickStart: `import mysql from 'mysql2/promise';
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
);`,
    category: 'database'
  },

  'browser-agent': {
    title: 'StackSleuth Browser Agent',
    description: 'Advanced browser automation and performance monitoring agent - Playwright/Puppeteer integration, website crawling, user interaction simulation, screenshot capture, and real-time debugging capabilities.',
    features: [
      '🌐 **Browser Automation**: Playwright and Puppeteer integration',
      '🕷️ **Website Crawling**: Automated website performance analysis',
      '👤 **User Interaction Simulation**: Realistic user behavior testing',
      '📷 **Screenshot Capture**: Visual regression and performance testing',
      '🔍 **Real-time Debugging**: Live browser debugging capabilities',
      '📊 **Performance Metrics**: Core Web Vitals and custom metrics',
      '🎯 **Load Testing**: Automated performance testing workflows',
      '⚡ **Headless & GUI Mode**: Flexible testing environments'
    ],
    installation: ['playwright', 'puppeteer'],
    quickStart: `import { BrowserAgent } from '@stacksleuth/browser-agent';

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
await session.screenshot('login-page.png');`,
    category: 'browser'
  },

  'browser-extension': {
    title: 'StackSleuth Browser Extension',
    description: 'Comprehensive browser extension for real-time performance monitoring - DevTools integration, content script injection, tab performance tracking, and interactive performance visualization.',
    features: [
      '🔧 **DevTools Integration**: Enhanced browser developer tools',
      '📱 **Content Script Injection**: Automatic webpage monitoring',
      '📊 **Tab Performance Tracking**: Per-tab performance analysis',
      '🎨 **Interactive Visualization**: Real-time performance charts',
      '⚡ **Live Monitoring**: Instant performance feedback',
      '🔍 **Performance Inspector**: Detailed performance breakdowns',
      '📈 **Historical Data**: Performance trend analysis',
      '🎯 **Custom Alerts**: Performance threshold notifications'
    ],
    installation: ['browser-extension'],
    quickStart: `// manifest.json
{
  "manifest_version": 3,
  "name": "StackSleuth Performance Monitor",
  "version": "1.0.0",
  "permissions": ["activeTab", "storage", "webRequest"],
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["stacksleuth-content.js"]
  }],
  "devtools_page": "devtools.html"
}

// background.js
import { BrowserExtension } from '@stacksleuth/browser-extension';

const extension = new BrowserExtension({
  enabled: true,
  enableDevTools: true,
  trackingDomains: ['*']
});

extension.initialize();

// content-script.js
import { BrowserExtension } from '@stacksleuth/browser-extension';

// Automatically monitor page performance
const extension = new BrowserExtension();
extension.collectPageMetrics();`,
    category: 'browser'
  },

  'performance-optimizer': {
    title: 'StackSleuth Performance Optimizer',
    description: 'Intelligent performance optimization engine - Automated bottleneck detection, code optimization suggestions, resource optimization, and performance enhancement recommendations.',
    features: [
      '🎯 **Automated Bottleneck Detection**: AI-powered performance issue identification',
      '💡 **Code Optimization Suggestions**: Smart refactoring recommendations',
      '📦 **Resource Optimization**: Bundle size and asset optimization',
      '⚡ **Performance Enhancement**: Automated performance improvements',
      '📊 **Impact Analysis**: Performance improvement impact assessment',
      '🔍 **Root Cause Analysis**: Deep performance issue investigation',
      '🤖 **Machine Learning**: ML-powered optimization recommendations',
      '📈 **Continuous Optimization**: Ongoing performance enhancement'
    ],
    installation: ['performance-optimizer'],
    quickStart: `import { PerformanceOptimizer } from '@stacksleuth/performance-optimizer';

// Initialize optimizer
const optimizer = new PerformanceOptimizer({
  enabled: true,
  autoOptimize: false, // Manual review first
  categories: ['database', 'memory', 'network']
});

// Analyze current performance
const analysis = await optimizer.analyzePerformance({
  timeRange: '24h',
  includeRecommendations: true
});

console.log('Performance Analysis:', analysis);

// Get optimization recommendations
const recommendations = await optimizer.getRecommendations();

recommendations.forEach(rec => {
  console.log(\`Recommendation: \${rec.title}\`);
  console.log(\`Impact: \${rec.impact}\`);
  console.log(\`Effort: \${rec.effort}\`);
});

// Apply safe optimizations
await optimizer.applySafeOptimizations();`,
    category: 'optimization'
  }
};

function generateReadme(packageName, config) {
  const { title, description, features, quickStart, category } = config;
  
  const npmBadge = `[![npm version](https://badge.fury.io/js/%40stacksleuth%2F${packageName}.svg)](https://badge.fury.io/js/%40stacksleuth%2F${packageName})`;
  const featuresList = features.map(feature => `- ${feature}`).join('\n');
  
  return `# @stacksleuth/${packageName}

<div align="center">

![${title}](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=${encodeURIComponent(title.replace('StackSleuth ', ''))})

**${title}**

${npmBadge}
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is ${title}?

${description}

## ✨ Key Features

${featuresList}

## 📦 Installation

\`\`\`bash
npm install @stacksleuth/${packageName}
\`\`\`

\`\`\`bash
yarn add @stacksleuth/${packageName}
\`\`\`

\`\`\`bash
pnpm add @stacksleuth/${packageName}
\`\`\`

## 🏁 Quick Start

\`\`\`${quickStart.includes('<?php') ? 'php' : quickStart.includes('python') ? 'python' : quickStart.includes('#') ? 'python' : 'typescript'}
${quickStart}
\`\`\`

## 📚 Resources

- **[Official Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)**
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/${packageName}.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/${packageName})**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/${packageName})** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>`;
}

async function generateAllReadmes() {
  console.log('🚀 Generating comprehensive README files for all packages...\n');

  for (const [packageName, config] of Object.entries(packageConfigs)) {
    const packageDir = path.join(__dirname, '..', 'packages', packageName);
    
    if (!fs.existsSync(packageDir)) {
      console.log(`⚠️  Package directory not found: ${packageName}`);
      continue;
    }

    const readmePath = path.join(packageDir, 'README.md');
    const readmeContent = generateReadme(packageName, config);

    try {
      fs.writeFileSync(readmePath, readmeContent);
      console.log(`✅ Generated README for @stacksleuth/${packageName}`);
    } catch (error) {
      console.error(`❌ Failed to generate README for ${packageName}:`, error.message);
    }
  }

  console.log('\n✨ All README files generated successfully!');
}

if (require.main === module) {
  generateAllReadmes().catch(console.error);
}

module.exports = { generateAllReadmes, generateReadme }; 