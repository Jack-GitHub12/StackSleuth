"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const pg_1 = require("pg");
const mongodb_1 = require("mongodb");
const redis_1 = require("redis");
// StackSleuth imports
const backend_agent_1 = require("@stacksleuth/backend-agent");
const db_agent_1 = require("@stacksleuth/db-agent");
const mongodb_agent_1 = require("@stacksleuth/mongodb-agent");
// Initialize StackSleuth
const sleuthAgent = new backend_agent_1.StackSleuthAgent({
    enabled: true,
    sampling: { rate: 1.0 }, // 100% sampling for demo
    output: { console: true }
});
// Database connections
const pgPool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'stacksleuth_demo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
});
const mongoClient = new mongodb_1.MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017/stacksleuth_demo');
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
// Instrument databases
const pgAgent = new db_agent_1.PostgreSQLAgent();
const instrumentedPool = pgAgent.instrumentPool(pgPool);
const mongoAgent = new mongodb_agent_1.MongoDBAgent();
const instrumentedMongo = mongoAgent.instrumentClient(mongoClient);
// Initialize Express app
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
// Apply StackSleuth middleware
app.use(sleuthAgent.middleware());
// Routes
/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});
/**
 * Get all users (with PostgreSQL)
 */
app.get('/api/users', async (req, res) => {
    const trace = sleuthAgent.startTrace('Get Users');
    try {
        // Simulate some processing time
        await sleuthAgent.trace('Processing request', async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        });
        const result = await instrumentedPool.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 50');
        // Cache in Redis
        await redisClient.setEx('users:recent', 300, JSON.stringify(result.rows));
        sleuthAgent.completeTrace(trace.id, 'success');
        res.json(result.rows);
    }
    catch (error) {
        sleuthAgent.addTraceError(trace.id, error);
        sleuthAgent.completeTrace(trace.id, 'error');
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
/**
 * Get user by ID (with caching)
 */
app.get('/api/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    const trace = sleuthAgent.startTrace(`Get User ${userId}`);
    try {
        // Check cache first
        const cached = await redisClient.get(`user:${userId}`);
        if (cached) {
            sleuthAgent.addTraceMetadata(trace.id, { cacheHit: true });
            sleuthAgent.completeTrace(trace.id, 'success');
            return res.json(JSON.parse(cached));
        }
        // Query database
        const result = await instrumentedPool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            sleuthAgent.completeTrace(trace.id, 'error');
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        // Cache the result
        await redisClient.setEx(`user:${userId}`, 600, JSON.stringify(user));
        sleuthAgent.addTraceMetadata(trace.id, { cacheHit: false });
        sleuthAgent.completeTrace(trace.id, 'success');
        res.json(user);
    }
    catch (error) {
        sleuthAgent.addTraceError(trace.id, error);
        sleuthAgent.completeTrace(trace.id, 'error');
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
/**
 * Create new user
 */
app.post('/api/users', async (req, res) => {
    const { name, email } = req.body;
    const trace = sleuthAgent.startTrace('Create User');
    try {
        // Validate input
        if (!name || !email) {
            sleuthAgent.completeTrace(trace.id, 'error');
            return res.status(400).json({ error: 'Name and email are required' });
        }
        // Check if user exists
        const existingUser = await instrumentedPool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            sleuthAgent.completeTrace(trace.id, 'error');
            return res.status(409).json({ error: 'User already exists' });
        }
        // Create user
        const result = await instrumentedPool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
        const user = result.rows[0];
        // Invalidate cache
        await redisClient.del('users:recent');
        sleuthAgent.completeTrace(trace.id, 'success');
        res.status(201).json(user);
    }
    catch (error) {
        sleuthAgent.addTraceError(trace.id, error);
        sleuthAgent.completeTrace(trace.id, 'error');
        res.status(500).json({ error: 'Failed to create user' });
    }
});
/**
 * Get products (with MongoDB)
 */
app.get('/api/products', async (req, res) => {
    const { category, limit = 20 } = req.query;
    const trace = sleuthAgent.startTrace('Get Products');
    try {
        const db = instrumentedMongo.db('stacksleuth_demo');
        const collection = db.collection('products');
        let query = {};
        if (category) {
            query = { category };
        }
        const products = await collection
            .find(query)
            .limit(parseInt(limit))
            .sort({ created_at: -1 })
            .toArray();
        // Simulate some complex processing
        await sleuthAgent.trace('Process product data', async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        });
        sleuthAgent.addTraceMetadata(trace.id, {
            productCount: products.length,
            category: category || 'all'
        });
        sleuthAgent.completeTrace(trace.id, 'success');
        res.json(products);
    }
    catch (error) {
        sleuthAgent.addTraceError(trace.id, error);
        sleuthAgent.completeTrace(trace.id, 'error');
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
/**
 * Search products (demonstrating complex query)
 */
app.get('/api/products/search', async (req, res) => {
    const { q, category } = req.query;
    const trace = sleuthAgent.startTrace('Search Products');
    try {
        if (!q) {
            sleuthAgent.completeTrace(trace.id, 'error');
            return res.status(400).json({ error: 'Search query is required' });
        }
        const db = instrumentedMongo.db('stacksleuth_demo');
        const collection = db.collection('products');
        // Build search query
        let searchQuery = {
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        };
        if (category) {
            searchQuery.category = category;
        }
        // Perform search with aggregation
        const results = await collection.aggregate([
            { $match: searchQuery },
            { $addFields: {
                    relevanceScore: {
                        $add: [
                            { $cond: [{ $regexMatch: { input: '$name', regex: new RegExp(q, 'i') } }, 2, 0] },
                            { $cond: [{ $regexMatch: { input: '$description', regex: new RegExp(q, 'i') } }, 1, 0] }
                        ]
                    }
                } },
            { $sort: { relevanceScore: -1, created_at: -1 } },
            { $limit: 20 }
        ]).toArray();
        sleuthAgent.addTraceMetadata(trace.id, {
            searchQuery: q,
            resultCount: results.length,
            category: category || 'all'
        });
        sleuthAgent.completeTrace(trace.id, 'success');
        res.json(results);
    }
    catch (error) {
        sleuthAgent.addTraceError(trace.id, error);
        sleuthAgent.completeTrace(trace.id, 'error');
        res.status(500).json({ error: 'Search failed' });
    }
});
/**
 * Get orders with user data (demonstrating JOIN)
 */
app.get('/api/orders', async (req, res) => {
    const { user_id, status } = req.query;
    const trace = sleuthAgent.startTrace('Get Orders');
    try {
        let query = `
      SELECT o.id, o.user_id, o.total, o.status, o.created_at,
             u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
        const params = [];
        if (user_id || status) {
            query += ' WHERE ';
            const conditions = [];
            if (user_id) {
                params.push(user_id);
                conditions.push(`o.user_id = $${params.length}`);
            }
            if (status) {
                params.push(status);
                conditions.push(`o.status = $${params.length}`);
            }
            query += conditions.join(' AND ');
        }
        query += ' ORDER BY o.created_at DESC LIMIT 50';
        const result = await instrumentedPool.query(query, params);
        // Simulate some business logic
        const ordersWithAnalytics = await sleuthAgent.trace('Calculate analytics', async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return result.rows.map(order => ({
                ...order,
                totalFormatted: `$${order.total.toFixed(2)}`,
                daysAgo: Math.floor((Date.now() - order.created_at.getTime()) / (1000 * 60 * 60 * 24))
            }));
        });
        sleuthAgent.addTraceMetadata(trace.id, {
            orderCount: result.rows.length,
            filters: { user_id, status }
        });
        sleuthAgent.completeTrace(trace.id, 'success');
        res.json(ordersWithAnalytics);
    }
    catch (error) {
        sleuthAgent.addTraceError(trace.id, error);
        sleuthAgent.completeTrace(trace.id, 'error');
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
/**
 * Create new order (demonstrating transaction)
 */
app.post('/api/orders', async (req, res) => {
    const { user_id, items } = req.body;
    const trace = sleuthAgent.startTrace('Create Order');
    const client = await instrumentedPool.connect();
    try {
        await client.query('BEGIN');
        // Validate user exists
        const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [user_id]);
        if (userCheck.rows.length === 0) {
            throw new Error('User not found');
        }
        // Calculate total
        const total = await sleuthAgent.trace('Calculate order total', async () => {
            await new Promise(resolve => setTimeout(resolve, 30));
            return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        });
        // Create order
        const orderResult = await client.query('INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING *', [user_id, total, 'pending']);
        const order = orderResult.rows[0];
        // Create order items (if we had an order_items table)
        // This would be where we'd insert the individual items
        await client.query('COMMIT');
        client.release();
        // Invalidate related caches
        await redisClient.del(`user:${user_id}`);
        sleuthAgent.addTraceMetadata(trace.id, {
            orderId: order.id,
            total,
            itemCount: items.length
        });
        sleuthAgent.completeTrace(trace.id, 'success');
        res.status(201).json(order);
    }
    catch (error) {
        await client.query('ROLLBACK');
        client.release();
        sleuthAgent.addTraceError(trace.id, error);
        sleuthAgent.completeTrace(trace.id, 'error');
        res.status(500).json({ error: 'Failed to create order' });
    }
});
/**
 * Slow endpoint to demonstrate performance issues
 */
app.get('/api/slow-operation', async (req, res) => {
    const trace = sleuthAgent.startTrace('Slow Operation');
    try {
        // Simulate N+1 query problem
        const users = await instrumentedPool.query('SELECT id FROM users LIMIT 10');
        const userDetails = [];
        for (const user of users.rows) {
            // This creates N+1 queries - one for each user
            const details = await instrumentedPool.query('SELECT * FROM users WHERE id = $1', [user.id]);
            userDetails.push(details.rows[0]);
        }
        // Simulate slow computation
        await sleuthAgent.trace('Heavy computation', async () => {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        });
        sleuthAgent.addTraceMetadata(trace.id, {
            artificialDelay: true,
            nPlusOneQueries: users.rows.length
        });
        sleuthAgent.completeTrace(trace.id, 'success');
        res.json({ message: 'Slow operation completed', userCount: userDetails.length });
    }
    catch (error) {
        sleuthAgent.addTraceError(trace.id, error);
        sleuthAgent.completeTrace(trace.id, 'error');
        res.status(500).json({ error: 'Slow operation failed' });
    }
});
/**
 * Analytics endpoint
 */
app.get('/api/analytics', async (req, res) => {
    const trace = sleuthAgent.startTrace('Get Analytics');
    try {
        // Get analytics data from both PostgreSQL and MongoDB
        const [userCount, orderStats, productCategories] = await Promise.all([
            instrumentedPool.query('SELECT COUNT(*) as count FROM users'),
            instrumentedPool.query(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(total) as total_revenue,
          AVG(total) as avg_order_value,
          status,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as recent_orders
        FROM orders 
        GROUP BY status
      `),
            (async () => {
                const db = instrumentedMongo.db('stacksleuth_demo');
                return await db.collection('products').aggregate([
                    { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
                    { $sort: { count: -1 } }
                ]).toArray();
            })()
        ]);
        sleuthAgent.completeTrace(trace.id, 'success');
        res.json({
            users: userCount.rows[0],
            orders: orderStats.rows,
            productCategories
        });
    }
    catch (error) {
        sleuthAgent.addTraceError(trace.id, error);
        sleuthAgent.completeTrace(trace.id, 'error');
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    // Add error to current trace if available
    const currentTrace = sleuthAgent.getCurrentTrace();
    if (currentTrace) {
        sleuthAgent.addTraceError(currentTrace.id, error);
        sleuthAgent.completeTrace(currentTrace.id, 'error');
    }
    res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Initialize connections and start server
async function startServer() {
    try {
        // Connect to MongoDB
        await mongoClient.connect();
        console.log('✅ Connected to MongoDB');
        // Connect to Redis
        await redisClient.connect();
        console.log('✅ Connected to Redis');
        // Test PostgreSQL connection
        await pgPool.query('SELECT NOW()');
        console.log('✅ Connected to PostgreSQL');
        // Start server
        app.listen(port, () => {
            console.log(`🚀 StackSleuth Demo API running on http://localhost:${port}`);
            console.log(`📊 StackSleuth Dashboard: http://localhost:3001`);
            console.log('\nAvailable endpoints:');
            console.log('  GET  /health                 - Health check');
            console.log('  GET  /api/users              - List users');
            console.log('  GET  /api/users/:id          - Get user by ID');
            console.log('  POST /api/users              - Create user');
            console.log('  GET  /api/products           - List products');
            console.log('  GET  /api/products/search    - Search products');
            console.log('  GET  /api/orders             - List orders');
            console.log('  POST /api/orders             - Create order');
            console.log('  GET  /api/analytics          - Get analytics');
            console.log('  GET  /api/slow-operation     - Demonstrate slow queries');
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Gracefully shutting down...');
    try {
        await mongoClient.close();
        await pgPool.end();
        await redisClient.quit();
        console.log('✅ All connections closed');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});
startServer();
//# sourceMappingURL=index.js.map