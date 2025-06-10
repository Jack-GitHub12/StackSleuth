# Express.js Complete Implementation Guide

This guide provides a comprehensive, production-ready implementation of StackSleuth monitoring for Express.js applications.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Complete Setup](#complete-setup)
3. [Advanced Configuration](#advanced-configuration)
4. [Real-World Examples](#real-world-examples)
5. [Performance Optimization](#performance-optimization)
6. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
npm install express @stacksleuth/backend-agent @stacksleuth/core
```

### Step 2: Basic Integration

```typescript
// app.ts
import express from 'express';
import { BackendAgent } from '@stacksleuth/backend-agent';

const app = express();
const agent = new BackendAgent({
  enabled: true,
  projectId: 'your-project-id',
  apiKey: 'your-api-key'
});

// Start monitoring
agent.startMonitoring();

// Add StackSleuth middleware (must be first)
app.use(agent.middleware());

// Your routes
app.get('/api/users', async (req, res) => {
  // Your business logic
  const users = await getUsersFromDatabase();
  res.json(users);
});

app.listen(3000, () => {
  console.log('Server running on port 3000 with StackSleuth monitoring');
});
```

### Step 3: View Results

Visit your StackSleuth dashboard to see real-time performance metrics!

## 🔧 Complete Setup

### Project Structure

```
my-express-app/
├── src/
│   ├── middleware/
│   │   └── stacksleuth.ts
│   ├── routes/
│   │   ├── users.ts
│   │   ├── products.ts
│   │   └── orders.ts
│   ├── services/
│   │   ├── database.ts
│   │   └── cache.ts
│   ├── config/
│   │   └── monitoring.ts
│   └── app.ts
├── package.json
└── .env
```

### Environment Configuration

```bash
# .env
NODE_ENV=production
STACKSLEUTH_ENABLED=true
STACKSLEUTH_PROJECT_ID=your-project-id
STACKSLEUTH_API_KEY=your-api-key
STACKSLEUTH_ENDPOINT=https://api.stacksleuth.com
STACKSLEUTH_SAMPLE_RATE=0.1
```

### Complete App Setup

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { BackendAgent } from '@stacksleuth/backend-agent';
import { DatabaseAgent } from '@stacksleuth/db-agent';
import { RedisAgent } from '@stacksleuth/redis-agent';
import { setupMonitoring } from './config/monitoring';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';

class ExpressApp {
  private app: express.Application;
  private backendAgent: BackendAgent;
  private dbAgent: DatabaseAgent;
  private cacheAgent: RedisAgent;

  constructor() {
    this.app = express();
    this.setupAgents();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupAgents(): void {
    // Backend monitoring
    this.backendAgent = new BackendAgent({
      enabled: process.env.STACKSLEUTH_ENABLED === 'true',
      projectId: process.env.STACKSLEUTH_PROJECT_ID,
      apiKey: process.env.STACKSLEUTH_API_KEY,
      endpoint: process.env.STACKSLEUTH_ENDPOINT,
      sampleRate: parseFloat(process.env.STACKSLEUTH_SAMPLE_RATE || '0.1'),
      trackHeaders: true,
      trackBody: false, // Don't track request bodies for security
      excludePaths: ['/health', '/metrics', '/favicon.ico']
    });

    // Database monitoring
    this.dbAgent = new DatabaseAgent({
      enabled: true,
      slowQueryThreshold: 100, // Log queries slower than 100ms
      trackQueries: true,
      trackConnections: true
    });

    // Redis monitoring
    this.cacheAgent = new RedisAgent({
      enabled: true,
      trackCommands: true,
      slowCommandThreshold: 50 // Log commands slower than 50ms
    });

    // Start all agents
    this.backendAgent.startMonitoring();
    this.dbAgent.startMonitoring();
    this.cacheAgent.startMonitoring();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors());

    // Performance
    this.app.use(compression());

    // StackSleuth monitoring (must be early in middleware stack)
    this.app.use(this.backendAgent.middleware());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Health check (excluded from monitoring)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
  }

  private setupRoutes(): void {
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/orders', orderRoutes);
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Express error:', error);
      
      // Track error in StackSleuth
      this.backendAgent.recordError(error, {
        path: req.path,
        method: req.method,
        userId: req.user?.id
      });

      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 StackSleuth monitoring enabled`);
      console.log(`🔍 Health check: http://localhost:${port}/health`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default ExpressApp;

// Start the application
const app = new ExpressApp();
app.start();
```

### Custom Middleware for Advanced Tracking

```typescript
// src/middleware/stacksleuth.ts
import { Request, Response, NextFunction } from 'express';
import { ProfilerCore } from '@stacksleuth/core';

const profiler = new ProfilerCore({
  enabled: true,
  sampleRate: 0.1
});

export const customMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const span = profiler.startSpan(`${req.method} ${req.route?.path || req.path}`);

  // Track request metadata
  span.setMetadata({
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    sessionId: req.sessionID
  });

  // Override res.json to track response
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // Record custom metrics
    profiler.recordMetric('http.response_time', responseTime, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode
    });

    if (res.statusCode >= 400) {
      profiler.recordMetric('http.errors', 1, {
        statusCode: res.statusCode,
        path: req.path
      });
    }

    span.setMetadata({
      statusCode: res.statusCode,
      responseTime,
      responseSize: JSON.stringify(body).length
    });

    span.end();
    return originalJson.call(this, body);
  };

  next();
};

// Business metrics middleware
export const businessMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Track API usage
  profiler.recordMetric('api.requests', 1, {
    endpoint: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Track user actions
  if (req.user) {
    profiler.recordMetric('user.activity', 1, {
      userId: req.user.id,
      action: `${req.method} ${req.path}`
    });
  }

  next();
};
```

### Database Integration Examples

```typescript
// src/services/database.ts
import mongoose from 'mongoose';
import { DatabaseAgent } from '@stacksleuth/db-agent';

const dbAgent = new DatabaseAgent({
  enabled: true,
  slowQueryThreshold: 100
});

// MongoDB connection with monitoring
export const connectMongoDB = async () => {
  const connection = await mongoose.connect(process.env.MONGODB_URI!);
  
  // Instrument MongoDB
  dbAgent.instrumentConnection(connection, 'mongodb');
  
  return connection;
};

// User service with performance tracking
export class UserService {
  async getUsers(filters: any = {}) {
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

  async createUser(userData: any) {
    const span = dbAgent.startSpan('users.create');
    
    try {
      const user = new User(userData);
      await user.save();
      
      // Track business metric
      profiler.recordMetric('users.created', 1, {
        source: 'api',
        plan: userData.plan
      });
      
      return user;
    } catch (error) {
      span.recordError(error);
      throw error;
    } finally {
      span.end();
    }
  }
}
```

### Redis Cache Integration

```typescript
// src/services/cache.ts
import Redis from 'ioredis';
import { RedisAgent } from '@stacksleuth/redis-agent';

const redis = new Redis(process.env.REDIS_URL);
const cacheAgent = new RedisAgent({
  enabled: true,
  trackCommands: true
});

// Instrument Redis client
cacheAgent.instrumentClient(redis);

export class CacheService {
  async get(key: string) {
    const span = cacheAgent.startSpan('cache.get');
    
    try {
      const value = await redis.get(key);
      
      // Track cache hit/miss
      profiler.recordMetric(value ? 'cache.hit' : 'cache.miss', 1, {
        key: key.split(':')[0] // First part of key for grouping
      });
      
      return value;
    } finally {
      span.end();
    }
  }

  async set(key: string, value: string, ttl: number = 3600) {
    const span = cacheAgent.startSpan('cache.set');
    
    try {
      await redis.setex(key, ttl, value);
      
      profiler.recordMetric('cache.set', 1, {
        ttl,
        keyType: key.split(':')[0]
      });
    } finally {
      span.end();
    }
  }
}
```

## 🔄 Real-World Route Examples

### User Management Routes

```typescript
// src/routes/users.ts
import { Router } from 'express';
import { ProfilerCore } from '@stacksleuth/core';
import { UserService } from '../services/database';
import { CacheService } from '../services/cache';

const router = Router();
const profiler = new ProfilerCore({ enabled: true });
const userService = new UserService();
const cacheService = new CacheService();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve paginated list of users with caching
 */
router.get('/', async (req, res) => {
  const span = profiler.startSpan('users.list');
  
  try {
    const { page = 1, limit = 10, search } = req.query;
    const cacheKey = `users:${page}:${limit}:${search || 'all'}`;
    
    // Try cache first
    let users = await cacheService.get(cacheKey);
    
    if (!users) {
      // Database query with monitoring
      const filters = search ? { name: new RegExp(search as string, 'i') } : {};
      users = await userService.getUsers(filters);
      
      // Cache results
      await cacheService.set(cacheKey, JSON.stringify(users), 300); // 5 min
      
      // Track cache miss
      profiler.recordMetric('users.cache.miss', 1);
    } else {
      users = JSON.parse(users);
      profiler.recordMetric('users.cache.hit', 1);
    }

    // Track business metrics
    profiler.recordMetric('users.list.requests', 1, {
      page: parseInt(page as string),
      hasSearch: !!search
    });

    span.setMetadata({
      resultCount: users.length,
      cached: !!users,
      page,
      search
    });

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: users.length
      }
    });

  } catch (error) {
    span.recordError(error);
    profiler.recordMetric('users.list.errors', 1);
    res.status(500).json({ error: 'Failed to fetch users' });
  } finally {
    span.end();
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 */
router.post('/', async (req, res) => {
  const span = profiler.startSpan('users.create');
  
  try {
    // Validate input
    const { name, email, plan = 'free' } = req.body;
    
    if (!name || !email) {
      profiler.recordMetric('users.create.validation_errors', 1);
      return res.status(400).json({ error: 'Name and email required' });
    }

    // Create user
    const user = await userService.createUser({ name, email, plan });
    
    // Invalidate cache
    await redis.del('users:*');
    
    // Track successful creation
    profiler.recordMetric('users.created.success', 1, { plan });

    span.setMetadata({
      userId: user._id,
      plan,
      email: email.split('@')[1] // Domain for analytics
    });

    res.status(201).json({ user });

  } catch (error) {
    span.recordError(error);
    profiler.recordMetric('users.create.errors', 1);
    
    if (error.code === 11000) {
      res.status(409).json({ error: 'User already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  } finally {
    span.end();
  }
});

export default router;
```

### Order Processing with Advanced Monitoring

```typescript
// src/routes/orders.ts
import { Router } from 'express';
import { ProfilerCore } from '@stacksleuth/core';

const router = Router();
const profiler = new ProfilerCore({ enabled: true });

router.post('/', async (req, res) => {
  const orderSpan = profiler.startSpan('orders.create');
  
  try {
    const { userId, items, paymentMethod } = req.body;
    
    // Calculate order total
    const calculationSpan = profiler.startSpan('orders.calculate_total');
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    calculationSpan.setMetadata({ itemCount: items.length, total });
    calculationSpan.end();

    // Process payment
    const paymentSpan = profiler.startSpan('orders.process_payment');
    try {
      await processPayment(paymentMethod, total);
      profiler.recordMetric('payments.processed', 1, { 
        method: paymentMethod,
        amount: total 
      });
    } catch (error) {
      profiler.recordMetric('payments.failed', 1, { 
        method: paymentMethod,
        reason: error.message 
      });
      throw error;
    } finally {
      paymentSpan.end();
    }

    // Update inventory
    const inventorySpan = profiler.startSpan('orders.update_inventory');
    for (const item of items) {
      await updateInventory(item.productId, -item.quantity);
    }
    inventorySpan.end();

    // Create order record
    const order = await createOrder({ userId, items, total, paymentMethod });

    // Track business metrics
    profiler.recordMetric('orders.value', total);
    profiler.recordMetric('orders.items', items.length);
    profiler.recordMetric('orders.created', 1, {
      paymentMethod,
      itemCount: items.length,
      valueRange: getValueRange(total)
    });

    orderSpan.setMetadata({
      orderId: order._id,
      total,
      itemCount: items.length,
      paymentMethod
    });

    res.status(201).json({ order });

  } catch (error) {
    orderSpan.recordError(error);
    profiler.recordMetric('orders.creation_failed', 1);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    orderSpan.end();
  }
});

function getValueRange(amount: number): string {
  if (amount < 50) return 'low';
  if (amount < 200) return 'medium';
  if (amount < 500) return 'high';
  return 'premium';
}

export default router;
```

## ⚡ Performance Optimization

### Memory Management

```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  
  profiler.recordMetric('memory.heap_used', usage.heapUsed);
  profiler.recordMetric('memory.heap_total', usage.heapTotal);
  profiler.recordMetric('memory.external', usage.external);
  profiler.recordMetric('memory.rss', usage.rss);
  
  // Alert if memory usage is high
  if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
    profiler.recordMetric('memory.high_usage_alert', 1);
  }
}, 30000); // Every 30 seconds
```

### CPU Monitoring

```typescript
// Monitor event loop lag
const { performance } = require('perf_hooks');

setInterval(() => {
  const start = performance.now();
  setImmediate(() => {
    const lag = performance.now() - start;
    profiler.recordMetric('event_loop.lag', lag);
    
    if (lag > 100) { // High lag warning
      profiler.recordMetric('event_loop.high_lag_alert', 1);
    }
  });
}, 5000);
```

## 🐛 Troubleshooting

### Common Issues & Solutions

1. **High Memory Usage**
   ```typescript
   // Reduce buffer size
   const agent = new BackendAgent({
     bufferSize: 500, // Reduce from default 1000
     flushInterval: 5000 // Flush more frequently
   });
   ```

2. **Performance Impact**
   ```typescript
   // Lower sampling rate for production
   const agent = new BackendAgent({
     sampleRate: 0.01 // Only 1% of requests
   });
   ```

3. **Missing Metrics**
   ```typescript
   // Enable debug mode
   const agent = new BackendAgent({
     debug: true,
     enabled: true
   });
   ```

### Debug Mode

```typescript
// Enable comprehensive debugging
process.env.DEBUG = 'stacksleuth:*';

const agent = new BackendAgent({
  debug: true,
  logLevel: 'debug'
});
```

## 📊 Performance Benchmarks

Expected performance impact:
- **CPU Overhead**: < 1%
- **Memory Overhead**: 5-10MB base
- **Response Time**: < 1ms additional latency
- **Throughput**: No significant impact

## 🚀 Production Checklist

- [ ] Environment variables configured
- [ ] Sampling rate optimized for production
- [ ] Error handling implemented
- [ ] Security headers excluded from tracking
- [ ] Health checks excluded from monitoring
- [ ] Alerts configured for critical metrics
- [ ] Dashboard access configured for team

---

This comprehensive guide provides everything you need to implement StackSleuth monitoring in your Express.js application. For more advanced use cases, check out our [Advanced Configuration Guide](../advanced/README.md). 