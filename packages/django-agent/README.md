# @stacksleuth/django-agent

<div align="center">

![StackSleuth Django Agent](../../assets/logo.svg)

**StackSleuth Django Agent**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fdjango-agent.svg)](https://badge.fury.io/js/%40stacksleuth%2Fdjango-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth Django Agent?

Advanced Django performance monitoring agent - Middleware tracking, database query optimization, template rendering analysis, session monitoring, and comprehensive view-level performance metrics.

## ✨ Key Features

- 🐍 **Django Middleware Tracking**: Request/response middleware performance
- 🗄️ **ORM Query Optimization**: Django ORM query performance analysis
- 🎨 **Template Rendering**: Django template performance monitoring
- 👤 **Session Monitoring**: User session performance tracking
- 🔍 **View-level Metrics**: Detailed view function performance data
- 🔄 **Real-time Updates**: WebSocket integration for live monitoring
- 📊 **Admin Integration**: Django admin performance insights
- ⚡ **Production Ready**: Minimal overhead Django integration

## 📦 Installation

```bash
# npm
npm install @stacksleuth/django-agent

# yarn
yarn add @stacksleuth/django-agent

# pnpm
pnpm add @stacksleuth/django-agent
```

```bash
yarn add @stacksleuth/django-agent
```

```bash
pnpm add @stacksleuth/django-agent
```

## 🏁 Quick Start

```python
# settings.py
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
    return JsonResponse({'users': list(users.values())})
```


## 📖 Comprehensive Examples

### Django Settings

```typescript
# settings.py
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
    'PROJECT_ID': 'your-project-id',
    'API_KEY': 'your-api-key',
    'SAMPLE_RATE': 0.1,
    'MONITOR_DATABASE': True,
    'MONITOR_TEMPLATES': True,
}
```

### View Performance Tracking

```typescript
# views.py
from stacksleuth.django import track_performance
from django.http import JsonResponse

@track_performance('user-list-view')
def user_list(request):
    users = User.objects.select_related('profile').all()
    
    # Track business metrics
    track_metric('users.listed', len(users), {
        'request_method': request.method,
        'user_authenticated': request.user.is_authenticated
    })
    
    return JsonResponse({'users': list(users.values())})
```

## 🎯 Real-World Usage

### Production Configuration

```typescript
const agent = new DjangoAgent({
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
const agent = new DjangoAgent({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new DjangoAgent({
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
- **[API Reference](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/django-agent.md)**
- **[Examples Repository](https://github.com/Jack-GitHub12/StackSleuth/tree/main/examples/django-agent)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/django-agent)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div>