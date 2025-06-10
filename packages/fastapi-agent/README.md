# @stacksleuth/fastapi-agent

<div align="center">

![StackSleuth FastAPI Agent](../../assets/logo.svg)

**StackSleuth FastAPI Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Ffastapi-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Ffastapi-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth FastAPI Agent?

Python FastAPI performance monitoring agent - Route-level tracing, WebSocket integration, request/response profiling, middleware performance analysis, and real-time API metrics collection.

## ✨ Key Features

- 🚀 **FastAPI Route Tracing**: Automatic endpoint performance monitoring
- 🔄 **WebSocket Support**: Real-time monitoring with WebSocket integration
- 📊 **Request/Response Profiling**: Detailed HTTP transaction analysis
- 🔧 **Middleware Integration**: FastAPI middleware performance tracking
- 🐍 **Async Support**: Full async/await performance monitoring
- 📈 **API Metrics**: RESTful API performance analytics
- 🛡️ **Dependency Tracking**: FastAPI dependency injection monitoring
- ⚡ **Production Ready**: High-performance Python integration

## 📦 Installation

```bash
# npm
npm install @stacksleuth/fastapi-agent

# yarn
yarn add @stacksleuth/fastapi-agent

# pnpm
pnpm add @stacksleuth/fastapi-agent
```

```bash
yarn add @stacksleuth/fastapi-agent
```

```bash
pnpm add @stacksleuth/fastapi-agent
```

## 🏁 Quick Start

```python
from fastapi import FastAPI
from stacksleuth.fastapi import StackSleuthMiddleware, StackSleuth

app = FastAPI()

# Add StackSleuth middleware
app.add_middleware(StackSleuthMiddleware, 
                  enabled=True, 
                  sample_rate=0.1)

# Initialize StackSleuth
stacksleuth = StackSleuth()

@app.get("/users")
async def get_users():
    with stacksleuth.span("fetch-users"):
        # Your business logic
        users = await User.find_all()
        return {"users": users}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # WebSocket monitoring automatically included
```


## 🛠️ Troubleshooting

### Common Issues

**Agent Not Starting**
```typescript
// Enable debug mode
const agent = new FastapiAgent({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new FastapiAgent({
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
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/fastapi-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/fastapi-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/fastapi-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div> 