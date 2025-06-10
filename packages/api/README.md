# @stacksleuth/api

<div align="center">

![StackSleuth API](../../assets/logo.svg)

**Complete StackSleuth API Service**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fapi.svg)](https://badge.fury.io/js/%40stacksleuth%2Fapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

RESTful API for performance monitoring data collection, analysis, real-time dashboards, alerting, and comprehensive observability platform with multi-tenant support.

## 🚀 What is StackSleuth API?

The StackSleuth API is a comprehensive RESTful API service that powers the entire StackSleuth performance monitoring platform. It provides data collection, analysis, real-time dashboards, alerting, and multi-tenant support.

## ✨ Key Features

- 🔌 **RESTful API**: Complete REST API for performance monitoring data
- 📊 **Real-time Analytics**: Live performance data processing and analysis
- 🚨 **Smart Alerting**: Configurable alerts with multiple notification channels
- 📈 **Interactive Dashboards**: Real-time performance visualization
- 🔐 **Multi-tenant Security**: Enterprise-grade authentication and authorization
- 🔄 **WebSocket Integration**: Real-time data streaming and updates
- 📁 **Data Management**: Efficient storage and retrieval of performance metrics
- 🌐 **Scalable Architecture**: Designed for high-throughput production environments

## 📦 Installation

```bash
# npm
npm install @stacksleuth/api

# yarn
yarn add @stacksleuth/api

# pnpm
pnpm add @stacksleuth/api
```

```bash
yarn add @stacksleuth/api
```

```bash
pnpm add @stacksleuth/api
```

## 🏁 Quick Start

### Basic Setup

```typescript
import { StackSleuthAPI } from '@stacksleuth/api';

// Create and start the API server
const api = new StackSleuthAPI();
api.start(3000);

console.log('StackSleuth API running on http://localhost:3000');
console.log('API Documentation: http://localhost:3000/api-docs');
```

### Environment Configuration

```bash
# .env
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/stacksleuth
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key
API_KEY_SALT=your-api-key-salt

# CORS
CORS_ORIGIN=http://localhost:3001

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  stacksleuth-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/stacksleuth
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    volumes:
      - ./logs:/app/logs

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  mongo_data:
  redis_data:
```

## 📊 API Endpoints

### Authentication

```bash
# Register new user
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Get API key
GET /api/auth/api-key
Authorization: Bearer <jwt-token>
```

### Projects Management

```bash
# Create project
POST /api/projects
{
  "name": "My Application",
  "description": "Production web application",
  "environment": "production"
}

# Get projects
GET /api/projects

# Get project details
GET /api/projects/:projectId

# Update project
PUT /api/projects/:projectId
{
  "name": "Updated Name",
  "settings": {
    "retentionDays": 30,
    "alertingEnabled": true
  }
}
```

### Metrics Collection

```bash
# Submit performance metrics
POST /api/metrics
{
  "projectId": "project-123",
  "timestamp": "2024-01-20T10:30:00Z",
  "metrics": [
    {
      "name": "http.response_time",
      "value": 245,
      "tags": {
        "method": "GET",
        "endpoint": "/api/users"
      }
    }
  ]
}

# Get metrics data
GET /api/metrics?projectId=project-123&from=2024-01-20&to=2024-01-21

# Get real-time metrics
GET /api/metrics/realtime/:projectId
```

### Trace Management

```bash
# Submit trace data
POST /api/traces
{
  "projectId": "project-123",
  "traceId": "trace-456",
  "spans": [
    {
      "spanId": "span-789",
      "name": "database.query",
      "startTime": "2024-01-20T10:30:00Z",
      "endTime": "2024-01-20T10:30:00.150Z",
      "metadata": {
        "query": "SELECT * FROM users",
        "rows": 10
      }
    }
  ]
}

# Get trace details
GET /api/traces/:traceId

# Search traces
GET /api/traces/search?projectId=project-123&query=database
```

### Alerting System

```bash
# Create alert rule
POST /api/alerts
{
  "projectId": "project-123",
  "name": "High Response Time",
  "condition": {
    "metric": "http.response_time",
    "operator": "gt",
    "threshold": 1000
  },
  "notifications": [
    {
      "type": "email",
      "recipients": ["admin@example.com"]
    },
    {
      "type": "slack",
      "webhook": "https://hooks.slack.com/..."
    }
  ]
}

# Get alert rules
GET /api/alerts?projectId=project-123

# Update alert rule
PUT /api/alerts/:alertId

# Get alert history
GET /api/alerts/:alertId/history
```

### Dashboard Data

```bash
# Get dashboard data
GET /api/dashboard/:projectId

# Get dashboard widgets
GET /api/dashboard/:projectId/widgets

# Create custom dashboard
POST /api/dashboard
{
  "projectId": "project-123",
  "name": "Production Dashboard",
  "widgets": [
    {
      "type": "chart",
      "title": "Response Time",
      "metric": "http.response_time",
      "aggregation": "avg"
    }
  ]
}
```

## 🔄 Real-time Integration

### WebSocket Connection

```javascript
// Client-side WebSocket integration
const socket = io('http://localhost:3000');

// Join project room for real-time updates
socket.emit('join-project', 'project-123');

// Listen for real-time metrics
socket.on('metrics-update', (data) => {
  console.log('New metrics:', data);
  updateDashboard(data);
});

// Listen for alerts
socket.on('alert', (alert) => {
  console.log('Alert triggered:', alert);
  showNotification(alert);
});
```

### Server-Sent Events

```javascript
// Alternative: Server-Sent Events
const eventSource = new EventSource('/api/stream/metrics/project-123');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  updateRealTimeChart(data);
};
```

## 🔧 Client Integration Examples

### Node.js Agent Integration

```typescript
// Agent automatically sends data to API
import { BackendAgent } from '@stacksleuth/backend-agent';

const agent = new BackendAgent({
  enabled: true,
  projectId: 'project-123',
  apiKey: 'your-api-key',
  endpoint: 'http://localhost:3000/api'
});

agent.startMonitoring();
```

### Custom Data Submission

```typescript
// Custom metrics submission
import axios from 'axios';

const submitMetrics = async (metrics: any[]) => {
  try {
    await axios.post('http://localhost:3000/api/metrics', {
      projectId: 'project-123',
      timestamp: new Date().toISOString(),
      metrics
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Failed to submit metrics:', error);
  }
};

// Submit custom business metrics
submitMetrics([
  {
    name: 'orders.processed',
    value: 1,
    tags: {
      region: 'us-east-1',
      payment_method: 'credit_card'
    }
  }
]);
```

### React Dashboard Integration

```typescript
// React component for real-time dashboard
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const RealTimeDashboard = ({ projectId }) => {
  const [metrics, setMetrics] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.emit('join-project', projectId);
    
    newSocket.on('metrics-update', (data) => {
      setMetrics(prev => [...prev.slice(-99), data]); // Keep last 100 points
    });

    return () => newSocket.close();
  }, [projectId]);

  return (
    <div className="dashboard">
      <h1>Real-time Performance</h1>
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <h3>{metric.name}</h3>
            <span className="value">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🔐 Security Features

### API Key Authentication

```typescript
// Generate API key for project
const apiKey = await generateAPIKey(projectId, {
  permissions: ['metrics:write', 'traces:write'],
  expiresIn: '1y'
});

// Use API key in requests
const response = await fetch('/api/metrics', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(metricsData)
});
```

### Rate Limiting

```typescript
// Built-in rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests, please try again later.'
}));
```

### Data Validation

```typescript
// Input validation with Joi
const metricsSchema = Joi.object({
  projectId: Joi.string().required(),
  timestamp: Joi.date().iso().required(),
  metrics: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      value: Joi.number().required(),
      tags: Joi.object().optional()
    })
  ).required()
});
```

## 📈 Analytics & Reporting

### Performance Analytics

```bash
# Get performance summary
GET /api/analytics/performance/:projectId?period=7d

# Get error analysis
GET /api/analytics/errors/:projectId?period=24h

# Get user experience metrics
GET /api/analytics/ux/:projectId
```

### Custom Reports

```bash
# Generate custom report
POST /api/reports
{
  "projectId": "project-123",
  "type": "performance",
  "period": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "metrics": ["response_time", "error_rate", "throughput"],
  "format": "pdf"
}

# Get report status
GET /api/reports/:reportId

# Download report
GET /api/reports/:reportId/download
```

## 🚨 Alerting Configuration

### Alert Rules

```typescript
// Define complex alert conditions
const alertRule = {
  name: "High Error Rate",
  condition: {
    type: "threshold",
    metric: "http.errors",
    aggregation: "rate",
    operator: "gt",
    threshold: 0.05, // 5% error rate
    window: "5m"
  },
  notifications: [
    {
      type: "email",
      recipients: ["team@example.com"],
      template: "error-alert"
    },
    {
      type: "slack",
      webhook: "https://hooks.slack.com/...",
      channel: "#alerts"
    },
    {
      type: "webhook",
      url: "https://my-service.com/webhook",
      method: "POST"
    }
  ],
  escalation: {
    enabled: true,
    delay: "15m",
    notifications: [
      {
        type: "pagerduty",
        integrationKey: "your-pd-key"
      }
    ]
  }
};
```

### Notification Templates

```html
<!-- Email alert template -->
<!DOCTYPE html>
<html>
<head>
  <title>StackSleuth Alert</title>
</head>
<body>
  <h1>🚨 Performance Alert</h1>
  <p><strong>Alert:</strong> {{alertName}}</p>
  <p><strong>Project:</strong> {{projectName}}</p>
  <p><strong>Condition:</strong> {{condition}}</p>
  <p><strong>Current Value:</strong> {{currentValue}}</p>
  <p><strong>Threshold:</strong> {{threshold}}</p>
  <p><strong>Time:</strong> {{timestamp}}</p>
  
  <a href="{{dashboardUrl}}">View Dashboard</a>
</body>
</html>
```

## 🔧 Advanced Configuration

### Custom Middleware

```typescript
// Add custom middleware to API
const api = new StackSleuthAPI();

// Custom authentication middleware
api.getApp().use('/api/custom', (req, res, next) => {
  // Custom auth logic
  const apiKey = req.headers['x-custom-key'];
  if (!validateCustomKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});

// Custom metrics endpoint
api.getApp().post('/api/custom/metrics', async (req, res) => {
  // Custom metrics processing
  const processedMetrics = await processCustomMetrics(req.body);
  res.json({ success: true, processed: processedMetrics.length });
});
```

### Data Retention Policies

```typescript
// Configure data retention
const retentionPolicy = {
  metrics: {
    raw: '7d',        // Keep raw metrics for 7 days
    aggregated: '90d', // Keep aggregated metrics for 90 days
    summary: '1y'      // Keep summary data for 1 year
  },
  traces: {
    detailed: '3d',   // Keep detailed traces for 3 days
    summary: '30d'    // Keep trace summaries for 30 days
  },
  logs: {
    debug: '1d',      // Keep debug logs for 1 day
    info: '7d',       // Keep info logs for 7 days
    error: '30d'      // Keep error logs for 30 days
  }
};
```

## 🐛 Troubleshooting

### Common Issues

1. **High Memory Usage**
   ```typescript
   // Optimize memory settings
   const api = new StackSleuthAPI({
     bufferSize: 1000,
     flushInterval: 5000,
     enableCompression: true
   });
   ```

2. **Slow Query Performance**
   ```bash
   # Add database indexes
   db.metrics.createIndex({ "projectId": 1, "timestamp": -1 })
   db.traces.createIndex({ "projectId": 1, "traceId": 1 })
   ```

3. **WebSocket Connection Issues**
   ```typescript
   // Configure WebSocket with retry
   const socket = io('http://localhost:3000', {
     reconnection: true,
     reconnectionDelay: 1000,
     reconnectionAttempts: 5
   });
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=stacksleuth:* npm start

# Or with specific modules
DEBUG=stacksleuth:api,stacksleuth:websocket npm start
```

### Health Monitoring

```bash
# Check API health
curl http://localhost:3000/health

# Check metrics endpoint
curl -H "Authorization: Bearer your-token" \
     http://localhost:3000/api/metrics/health
```


## 🛠️ Troubleshooting

### Common Issues

**Agent Not Starting**
```typescript
// Enable debug mode
const agent = new Api({
  enabled: true,
  debug: true
});
```

**High Memory Usage**
```typescript
// Optimize memory usage
const agent = new Api({
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

- **[API Documentation](http://localhost:3000/api-docs)** - Interactive Swagger documentation
- **[WebSocket Events](./docs/websocket.md)** - Real-time WebSocket API reference
- **[Authentication Guide](./docs/auth.md)** - Complete authentication setup
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/api)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div> 