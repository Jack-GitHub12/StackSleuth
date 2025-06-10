# @stacksleuth/django-agent

<div align="center">

![StackSleuth Django Agent](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=Django%20Agent)

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
npm install @stacksleuth/django-agent
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