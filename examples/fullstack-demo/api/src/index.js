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
const sleuthAgent = new backend_agent_1.BackendAgent({
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
const pgAgent = new db_agent_1.DatabaseAgent();
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
// Apply StackSleuth instrumentation
sleuthAgent.instrument(app);
// Get the collector for manual tracing
const collector = sleuthAgent.getCollector();
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
 * Get all users (PostgreSQL example)
 */
app.get('/api/users', async (req, res) => {
    try {
        // Manual tracing example
        await sleuthAgent.trace('Processing user request', async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        });
        const result = await instrumentedPool.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 20');
        // Cache in Redis
        try {
            await redisClient.setEx('users:recent', 300, JSON.stringify(result.rows));
        }
        catch (redisError) {
            console.warn('Redis cache failed:', redisError);
        }
        res.json(result.rows);
    }
    catch (error) {
        console.error('Users endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
/**
 * Get user by ID (with caching demonstration)
 */
app.get('/api/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        // Check cache first
        let cached;
        try {
            cached = await redisClient.get(`user:${userId}`);
        }
        catch (redisError) {
            console.warn('Redis get failed:', redisError);
        }
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        // Query database
        const result = await instrumentedPool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        // Cache the result
        try {
            await redisClient.setEx(`user:${userId}`, 600, JSON.stringify(user));
        }
        catch (redisError) {
            console.warn('Redis set failed:', redisError);
        }
        res.json(user);
    }
    catch (error) {
        console.error('User by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
/**
 * Create new user
 */
app.post('/api/users', async (req, res) => {
    const { name, email } = req.body;
    try {
        // Validate input
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        // Check if user exists
        const existingUser = await instrumentedPool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }
        // Create user
        const result = await instrumentedPool.query('INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW()) RETURNING *', [name, email]);
        const user = result.rows[0];
        // Invalidate cache
        try {
            await redisClient.del('users:recent');
        }
        catch (redisError) {
            console.warn('Redis cache invalidation failed:', redisError);
        }
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
/**
 * Get products (MongoDB example)
 */
app.get('/api/products', async (req, res) => {
    const { category, limit = 20 } = req.query;
    try {
        const db = instrumentedMongo.db('stacksleuth_demo');
        const collection = db.collection('products');
        let query = {};
        if (category) {
            query = { category: category };
        }
        const products = await collection
            .find(query)
            .limit(parseInt(limit))
            .sort({ created_at: -1 })
            .toArray();
        // Simulate some processing
        await sleuthAgent.trace('Process product data', async () => {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        });
        res.json(products);
    }
    catch (error) {
        console.error('Products endpoint error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
/**
 * Search products (complex MongoDB query)
 */
app.get('/api/products/search', async (req, res) => {
    const { q } = req.query;
    try {
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const db = instrumentedMongo.db('stacksleuth_demo');
        const collection = db.collection('products');
        // Perform search with aggregation
        const results = await collection.aggregate([
            {
                $match: {
                    $or: [
                        { name: { $regex: q, $options: 'i' } },
                        { description: { $regex: q, $options: 'i' } }
                    ]
                }
            },
            { $sort: { created_at: -1 } },
            { $limit: 20 }
        ]).toArray();
        res.json(results);
    }
    catch (error) {
        console.error('Product search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});
/**
 * Demonstrate N+1 query problem (performance anti-pattern)
 */
app.get('/api/slow-operation', async (req, res) => {
    try {
        // This creates an N+1 query problem for demonstration
        const users = await instrumentedPool.query('SELECT id, name FROM users LIMIT 5');
        const userDetails = [];
        for (const user of users.rows) {
            // Each iteration makes a separate database query (N+1 problem)
            const details = await instrumentedPool.query('SELECT * FROM users WHERE id = $1', [user.id]);
            userDetails.push(details.rows[0]);
        }
        // Simulate additional slow processing
        await sleuthAgent.trace('Heavy computation', async () => {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        });
        res.json({
            message: 'Slow operation completed',
            userCount: userDetails.length,
            note: 'This endpoint demonstrates N+1 queries and slow processing'
        });
    }
    catch (error) {
        console.error('Slow operation error:', error);
        res.status(500).json({ error: 'Slow operation failed' });
    }
});
/**
 * Get analytics (multi-database example)
 */
app.get('/api/analytics', async (req, res) => {
    try {
        // Get data from PostgreSQL and MongoDB in parallel
        const [userCount, productCategories] = await Promise.all([
            instrumentedPool.query('SELECT COUNT(*) as count FROM users'),
            (async () => {
                try {
                    const db = instrumentedMongo.db('stacksleuth_demo');
                    return await db.collection('products').aggregate([
                        { $group: { _id: '$category', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ]).toArray();
                }
                catch (mongoError) {
                    console.warn('MongoDB analytics failed:', mongoError);
                    return [];
                }
            })()
        ]);
        res.json({
            users: userCount.rows[0],
            productCategories
        });
    }
    catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Initialize connections and start server
async function startServer() {
    try {
        // Test PostgreSQL connection
        await pgPool.query('SELECT NOW()');
        console.log('✅ Connected to PostgreSQL');
        // Connect to MongoDB (optional)
        try {
            await mongoClient.connect();
            console.log('✅ Connected to MongoDB');
        }
        catch (mongoError) {
            console.warn('⚠️  MongoDB connection failed (demo will work with PostgreSQL only):', mongoError);
        }
        // Connect to Redis (optional)
        try {
            await redisClient.connect();
            console.log('✅ Connected to Redis');
        }
        catch (redisError) {
            console.warn('⚠️  Redis connection failed (caching disabled):', redisError);
        }
        // Start server
        app.listen(port, () => {
            console.log(`🚀 StackSleuth Demo API running on http://localhost:${port}`);
            console.log(`📊 StackSleuth Dashboard: http://localhost:3001`);
            console.log('\nAvailable endpoints:');
            console.log('  GET  /health                 - Health check');
            console.log('  GET  /api/users              - List users (PostgreSQL + Redis cache)');
            console.log('  GET  /api/users/:id          - Get user by ID (with caching)');
            console.log('  POST /api/users              - Create user');
            console.log('  GET  /api/products           - List products (MongoDB)');
            console.log('  GET  /api/products/search    - Search products (MongoDB aggregation)');
            console.log('  GET  /api/analytics          - Multi-database analytics');
            console.log('  GET  /api/slow-operation     - Demonstrate N+1 queries & slow processing');
            console.log('\nTry these commands to test:');
            console.log(`  curl http://localhost:${port}/api/users`);
            console.log(`  curl http://localhost:${port}/api/slow-operation`);
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
        if (redisClient.isOpen) {
            await redisClient.quit();
        }
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