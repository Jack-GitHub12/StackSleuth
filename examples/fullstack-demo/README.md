# StackSleuth Full-Stack Demo

This demo showcases **StackSleuth** performance monitoring in a real-world full-stack application using:

- **Frontend**: React app + StackSleuth Frontend Agent
- **Backend**: Express.js + StackSleuth Backend Agent  
- **Databases**: PostgreSQL + MongoDB + Redis with StackSleuth Agents
- **Monitoring**: Real-time performance dashboard with flamegraphs

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+

### Installation

1. **Clone and install dependencies**:
```bash
cd examples/fullstack-demo
npm run setup
```

2. **Set up databases**:
```bash
# PostgreSQL (create database and tables)
npm run db:setup

# MongoDB (will auto-create collections)
# Redis (no setup needed)
```

3. **Start the demo**:
```bash
npm run dev
```

This will start:
- API Server: http://localhost:3001
- StackSleuth Dashboard: http://localhost:3001

## 📊 What This Demo Shows

### 🧠 Backend Performance Monitoring

The Express API demonstrates:

```javascript
// Automatic HTTP request tracing
sleuthAgent.instrument(app);

// Manual trace wrapping
await sleuthAgent.trace('Get Users', async () => {
  await instrumentedPool.query('SELECT * FROM users');
});
```

**Monitored Operations**:
- ✅ HTTP requests (automatic)
- ✅ PostgreSQL queries (automatic)
- ✅ MongoDB operations (automatic) 
- ✅ Redis cache hits/misses
- ✅ Database transactions
- ✅ N+1 query detection
- ✅ Slow operation identification

### 🗄️ Multi-Database Monitoring

**PostgreSQL** (Users, Orders):
```javascript
import { DatabaseAgent } from '@stacksleuth/db-agent';

const pgAgent = new DatabaseAgent();
const instrumentedPool = pgAgent.instrumentPool(pgPool);

// Automatically traces all queries
const users = await instrumentedPool.query('SELECT * FROM users');
```

**MongoDB** (Products):
```javascript
const mongoAgent = new MongoDBAgent();
const instrumentedMongo = mongoAgent.instrumentClient(mongoClient);

// Automatically traces find, insert, update, aggregate operations
const products = await db.collection('products').find({}).toArray();
```

**Redis** (Caching):
```javascript
// Cache-aside pattern with automatic tracing
const cached = await redisClient.get(`user:${id}`);
if (!cached) {
  const user = await database.getUser(id);
  await redisClient.setEx(`user:${id}`, 600, JSON.stringify(user));
}
```

### 🎯 Frontend Performance Tracking

The React frontend shows:

```javascript
// Automatic component render tracking
import { StackSleuthProvider, useTrace } from '@stacksleuth/frontend-agent';

function App() {
  return (
    <StackSleuthProvider>
      <Dashboard /> {/* Automatically tracked */}
    </StackSleuthProvider>
  );
}

// Manual operation tracing
const { trace } = useTrace();

const handleSubmit = async () => {
  await trace('Submit Order', async () => {
    const response = await fetch('/api/orders', { /* ... */ });
    return response.json();
  });
};
```

**Tracked Metrics**:
- ✅ Component render times
- ✅ Web Vitals (LCP, FID, CLS, TTFB, FCP)
- ✅ API call performance
- ✅ Resource loading times
- ✅ User interactions

### 🔥 Advanced Features

#### **Flamegraph Visualization**
```javascript
import { FlamegraphGenerator } from '@stacksleuth/core';

// Generate flamegraph from trace data
const flamegraph = FlamegraphGenerator.generateFromTrace(trace);

// Convert to SVG for display
const svg = FlamegraphGenerator.toSVG(flamegraph, 1200, 600);
```

#### **Adaptive Sampling**
```javascript
import { AdaptiveSampler } from '@stacksleuth/core';

const sampler = new AdaptiveSampler(collector, {
  targetTracesPerSecond: 100,
  maxMemoryUsageMB: 500,
  minSamplingRate: 0.01,
  maxSamplingRate: 1.0
});

// Automatically adjusts sampling based on:
// - Traffic volume
// - Memory usage  
// - Error rates
// - System performance
```

## 🧪 Testing Performance Scenarios

### 1. **Normal Load**
```bash
curl http://localhost:3001/api/users
curl http://localhost:3001/api/products?category=electronics
```

### 2. **Slow Queries (N+1 Problem)**
```bash
curl http://localhost:3001/api/slow-operation
```
Watch the dashboard show:
- Multiple individual database queries
- Long total execution time
- Performance warnings

### 3. **Cache Performance**
```bash
# First request (cache miss)
curl http://localhost:3001/api/users/1

# Second request (cache hit)  
curl http://localhost:3001/api/users/1
```

### 4. **Complex Aggregations**
```bash
curl "http://localhost:3001/api/products/search?q=laptop&category=electronics"
curl http://localhost:3001/api/analytics
```

### 5. **Error Handling**
```bash
curl http://localhost:3001/api/users/99999  # 404 error
curl -X POST http://localhost:3001/api/users # Validation error
```

## 📈 Dashboard Features

Visit http://localhost:3001 to see:

### **Real-time Trace List**
- Live trace updates via WebSocket
- Color-coded status indicators
- Duration and span counts
- Filter by status/duration

### **Flamegraph Visualization** 
- Interactive flame graphs showing execution hierarchy
- Hover for detailed timing information
- Drill-down into individual spans
- Color-coded by operation type

### **Performance Metrics**
- Requests per second
- Average response times
- Error rates
- Database query performance

### **System Health**
- Memory usage
- Active traces
- Sampling rates
- Alert notifications

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Express API   │    │   Databases     │
│  (Port 3000)    │    │  (Port 3001)    │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React Agent   │───▶│ • Backend Agent │───▶│ • PostgreSQL    │
│ • Web Vitals    │    │ • Auto Tracing  │    │ • MongoDB       │
│ • Component     │    │ • Error Capture │    │ • Redis         │
│   Tracking      │    │ • Async Context │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────▶│ StackSleuth     │◀─────────────┘
                        │ Collector       │
                        │ • Trace Storage │
                        │ • Real-time     │
                        │ • Flamegraphs   │
                        │ • Adaptive      │
                        │   Sampling      │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │ Dashboard UI    │
                        │ • WebSocket     │
                        │ • Live Updates  │
                        │ • Flamegraphs   │
                        │ • Metrics       │
                        └─────────────────┘
```

## 📚 Key Learning Points

### **Performance Optimization**

1. **Identify N+1 Queries**: Watch `/api/slow-operation` to see how StackSleuth detects the N+1 pattern

2. **Cache Effectiveness**: Compare cache hit vs miss traces in user lookups

3. **Query Optimization**: MongoDB aggregation vs simple find operations

4. **Error Impact**: How errors affect overall application performance

### **Monitoring Best Practices**

1. **Sampling Strategy**: See adaptive sampling adjust to load
2. **Alert Thresholds**: Configure meaningful performance alerts
3. **Trace Context**: How spans build hierarchical execution views
4. **Cross-Service Tracing**: Following requests across database boundaries

## 🔧 Configuration

### Environment Variables

```bash
# Database connections
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stacksleuth_demo
DB_USER=postgres
DB_PASSWORD=password

MONGO_URL=mongodb://localhost:27017/stacksleuth_demo
REDIS_URL=redis://localhost:6379

# StackSleuth settings
STACKSLEUTH_ENABLED=true
STACKSLEUTH_SAMPLING_RATE=1.0
STACKSLEUTH_DASHBOARD_PORT=3001
```

### Custom Configuration

```javascript
// Custom StackSleuth config
import { BackendAgent } from '@stacksleuth/backend-agent';

const sleuthAgent = new BackendAgent({
  enabled: true,
  sampling: { 
    rate: 0.1,  // 10% sampling in production
    adaptiveEnabled: true
  },
  filters: {
    excludePaths: ['/health', '/metrics'],
    slowQueryThreshold: 100
  },
  output: {
    console: false,
    dashboard: { enabled: true, port: 3001 }
  }
});
```

### Start the Profiler

In a separate terminal, run the dashboard and collector:

```bash
sleuth watch
```

## 🚦 Performance Tips

### **Optimization Opportunities Shown**

1. **Query Bundling**: Replace N+1 with JOIN queries
2. **Caching Strategy**: Implement smart cache invalidation  
3. **Database Indexing**: Identify slow queries needing indexes
4. **Connection Pooling**: Monitor connection usage patterns
5. **Error Handling**: Implement proper error boundaries

### **Production Considerations**

1. **Sampling Rate**: Use adaptive sampling (start with 1-5%)
2. **Data Retention**: Configure trace cleanup policies
3. **Dashboard Access**: Secure dashboard in production
4. **Performance Impact**: Monitor StackSleuth's own overhead
5. **Alert Integration**: Connect to PagerDuty/Slack

## 🔗 Next Steps

1. **Explore the Dashboard**: Try different endpoints and watch real-time updates
2. **Generate Load**: Use `ab` or `wrk` to simulate traffic
3. **Customize Agents**: Add your own tracing to business logic
4. **Performance Tuning**: Use insights to optimize database queries
5. **Production Setup**: Configure for your environment

---

**Need Help?** 
- 📖 [Full Documentation](../../README.md)
- 🐛 [Report Issues](https://github.com/Jack-GitHub12/StackSleuth/issues)
- 💬 [Community Discussions](https://github.com/Jack-GitHub12/StackSleuth/discussions) 