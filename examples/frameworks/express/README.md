# Express.js StackSleuth Integration

Complete implementation guide for monitoring Express.js applications with StackSleuth.

## Quick Start

```typescript
import express from 'express';
import { BackendAgent } from '@stacksleuth/backend-agent';

const app = express();
const agent = new BackendAgent({
  enabled: true,
  projectId: 'your-project-id'
});

agent.startMonitoring();
app.use(agent.middleware());

app.get('/api/users', async (req, res) => {
  const users = await getUsersFromDatabase();
  res.json(users);
});

app.listen(3000);
```

## Complete Implementation

### 1. Project Setup

```bash
npm install express @stacksleuth/backend-agent @stacksleuth/db-agent
```

### 2. Environment Configuration

```bash
# .env
STACKSLEUTH_ENABLED=true
STACKSLEUTH_PROJECT_ID=your-project-id
STACKSLEUTH_API_KEY=your-api-key
```

### 3. Full Application Example

```typescript
// app.ts
import express from 'express';
import { BackendAgent } from '@stacksleuth/backend-agent';
import { ProfilerCore } from '@stacksleuth/core';

class ExpressApp {
  private app: express.Application;
  private agent: BackendAgent;
  private profiler: ProfilerCore;

  constructor() {
    this.app = express();
    this.setupMonitoring();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMonitoring(): void {
    this.agent = new BackendAgent({
      enabled: process.env.STACKSLEUTH_ENABLED === 'true',
      projectId: process.env.STACKSLEUTH_PROJECT_ID,
      apiKey: process.env.STACKSLEUTH_API_KEY,
      sampleRate: 0.1,
      excludePaths: ['/health', '/metrics']
    });

    this.profiler = new ProfilerCore({
      enabled: true,
      sampleRate: 0.1
    });

    this.agent.startMonitoring();
  }

  private setupMiddleware(): void {
    // StackSleuth middleware (must be first)
    this.app.use(this.agent.middleware());
    
    this.app.use(express.json());
    
    // Custom metrics middleware
    this.app.use((req, res, next) => {
      const span = this.profiler.startSpan(`${req.method} ${req.path}`);
      
      res.on('finish', () => {
        this.profiler.recordMetric('http.requests', 1, {
          method: req.method,
          statusCode: res.statusCode,
          path: req.path
        });
        span.end();
      });
      
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // API routes with monitoring
    this.app.get('/api/users', this.getUsers.bind(this));
    this.app.post('/api/users', this.createUser.bind(this));
    this.app.get('/api/orders', this.getOrders.bind(this));
  }

  private async getUsers(req: express.Request, res: express.Response): Promise<void> {
    const span = this.profiler.startSpan('users.fetch');
    
    try {
      // Simulate database query
      const users = await this.fetchUsersFromDatabase();
      
      // Track business metrics
      this.profiler.recordMetric('users.fetched', users.length);
      
      span.setMetadata({
        userCount: users.length,
        cached: false
      });
      
      res.json({ users });
    } catch (error) {
      span.recordError(error);
      this.profiler.recordMetric('users.fetch.errors', 1);
      res.status(500).json({ error: 'Failed to fetch users' });
    } finally {
      span.end();
    }
  }

  private async createUser(req: express.Request, res: express.Response): Promise<void> {
    const span = this.profiler.startSpan('users.create');
    
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        this.profiler.recordMetric('users.validation.errors', 1);
        return res.status(400).json({ error: 'Name and email required' });
      }

      const user = await this.createUserInDatabase({ name, email });
      
      // Track business metrics
      this.profiler.recordMetric('users.created', 1, {
        source: 'api',
        emailDomain: email.split('@')[1]
      });

      span.setMetadata({
        userId: user.id,
        email: email.split('@')[1]
      });

      res.status(201).json({ user });
    } catch (error) {
      span.recordError(error);
      this.profiler.recordMetric('users.create.errors', 1);
      res.status(500).json({ error: 'Failed to create user' });
    } finally {
      span.end();
    }
  }

  private async getOrders(req: express.Request, res: express.Response): Promise<void> {
    const span = this.profiler.startSpan('orders.fetch');
    
    try {
      const { userId, status } = req.query;
      
      // Build filters
      const filters: any = {};
      if (userId) filters.userId = userId;
      if (status) filters.status = status;

      const orders = await this.fetchOrdersFromDatabase(filters);
      
      // Track metrics
      this.profiler.recordMetric('orders.fetched', orders.length, {
        hasFilters: Object.keys(filters).length > 0,
        filterCount: Object.keys(filters).length
      });

      span.setMetadata({
        orderCount: orders.length,
        filters: Object.keys(filters)
      });

      res.json({ orders });
    } catch (error) {
      span.recordError(error);
      this.profiler.recordMetric('orders.fetch.errors', 1);
      res.status(500).json({ error: 'Failed to fetch orders' });
    } finally {
      span.end();
    }
  }

  // Mock database methods
  private async fetchUsersFromDatabase(): Promise<any[]> {
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
  }

  private async createUserInDatabase(userData: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return { id: Date.now(), ...userData, createdAt: new Date() };
  }

  private async fetchOrdersFromDatabase(filters: any): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 75));
    return [
      { id: 1, userId: 1, total: 99.99, status: 'completed' },
      { id: 2, userId: 2, total: 149.99, status: 'pending' }
    ];
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 StackSleuth monitoring enabled`);
    });
  }
}

// Start the application
const app = new ExpressApp();
app.start();
```

## Database Integration

```typescript
// database.ts
import mongoose from 'mongoose';
import { DatabaseAgent } from '@stacksleuth/db-agent';

const dbAgent = new DatabaseAgent({
  enabled: true,
  slowQueryThreshold: 100
});

export const connectDatabase = async () => {
  const connection = await mongoose.connect(process.env.MONGODB_URI!);
  dbAgent.instrumentConnection(connection, 'mongodb');
  return connection;
};

// User model with monitoring
export class UserService {
  async findUsers(filters: any = {}) {
    const span = dbAgent.startSpan('users.find');
    
    try {
      const users = await User.find(filters);
      
      span.setMetadata({
        filterCount: Object.keys(filters).length,
        resultCount: users.length
      });
      
      return users;
    } catch (error) {
      span.recordError(error);
      throw error;
    } finally {
      span.end();
    }
  }
}
```

## Advanced Configuration

### Custom Middleware

```typescript
// Custom performance middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Track response time by route
    profiler.recordMetric('http.response_time', responseTime, {
      method: req.method,
      route: req.route?.path || req.path,
      statusCode: res.statusCode
    });

    // Track slow requests
    if (responseTime > 1000) {
      profiler.recordMetric('http.slow_requests', 1, {
        path: req.path,
        responseTime
      });
    }
  });
  
  next();
};
```

### Error Tracking

```typescript
// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  // Track error in StackSleuth
  agent.recordError(error, {
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    userAgent: req.get('User-Agent')
  });

  profiler.recordMetric('errors.unhandled', 1, {
    errorType: error.constructor.name,
    path: req.path
  });

  res.status(500).json({ error: 'Internal server error' });
});
```

## Performance Optimization

### Memory Monitoring

```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  
  profiler.recordMetric('memory.heap_used', usage.heapUsed);
  profiler.recordMetric('memory.heap_total', usage.heapTotal);
  
  // Alert on high memory usage
  if (usage.heapUsed > 500 * 1024 * 1024) {
    profiler.recordMetric('memory.high_usage_alert', 1);
  }
}, 30000);
```

### Event Loop Monitoring

```typescript
// Monitor event loop lag
const { performance } = require('perf_hooks');

setInterval(() => {
  const start = performance.now();
  setImmediate(() => {
    const lag = performance.now() - start;
    profiler.recordMetric('event_loop.lag', lag);
  });
}, 5000);
```

## Production Configuration

```typescript
const agent = new BackendAgent({
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  bufferSize: 1000,
  flushInterval: 10000,
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  trackHeaders: false, // Don't track headers in production
  trackBody: false     // Don't track request bodies for security
});
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Reduce buffer size and increase flush interval
2. **Performance Impact**: Lower sampling rate for production
3. **Missing Metrics**: Check agent configuration and ensure monitoring is enabled

### Debug Mode

```bash
DEBUG=stacksleuth:* node app.js
```

## Complete Example Files

See the `/examples/frameworks/express/` directory for:
- `complete-app.ts` - Full application example
- `database-integration.ts` - Database monitoring setup
- `middleware-examples.ts` - Custom middleware examples
- `production-config.ts` - Production configuration
- `docker-compose.yml` - Docker setup with monitoring

---

For more advanced examples, see our [Advanced Express.js Guide](./advanced.md). 