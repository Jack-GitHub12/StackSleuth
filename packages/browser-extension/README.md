# @stacksleuth/browser-extension

<div align="center">

![StackSleuth Browser Extension](../../assets/logo.svg)

**StackSleuth Browser Extension**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fbrowser-extension.svg)](https://badge.fury.io/js/%40stacksleuth%2Fbrowser-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Browser Extension?

Comprehensive browser extension for real-time performance monitoring - DevTools integration, content script injection, tab performance tracking, and interactive performance visualization.

## ✨ Key Features

- 🔧 **DevTools Integration**: Enhanced browser developer tools
- 📱 **Content Script Injection**: Automatic webpage monitoring
- 📊 **Tab Performance Tracking**: Per-tab performance analysis
- 🎨 **Interactive Visualization**: Real-time performance charts
- ⚡ **Live Monitoring**: Instant performance feedback
- 🔍 **Performance Inspector**: Detailed performance breakdowns
- 📈 **Historical Data**: Performance trend analysis
- 🎯 **Custom Alerts**: Performance threshold notifications

## 📦 Installation

```bash
# npm
npm install @stacksleuth/browser-extension

# yarn
yarn add @stacksleuth/browser-extension

# pnpm
pnpm add @stacksleuth/browser-extension
```

```bash
yarn add @stacksleuth/browser-extension
```

```bash
pnpm add @stacksleuth/browser-extension
```

## 🏁 Quick Start

```typescript
// manifest.json
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
extension.collectPageMetrics();
```


## 🛠️ Troubleshooting

### Common Issues

**Agent Not Starting**
```typescript
// Enable debug mode
const agent = new BrowserExtension({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new BrowserExtension({
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
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/browser-extension.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/browser-extension)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/browser-extension)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>