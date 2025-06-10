"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackSleuthAPI = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const prometheus_api_metrics_1 = __importDefault(require("prometheus-api-metrics"));
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = __importDefault(require("redis"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
// Import routes
const auth_2 = __importDefault(require("./routes/auth"));
const metrics_1 = __importDefault(require("./routes/metrics"));
const traces_1 = __importDefault(require("./routes/traces"));
const projects_1 = __importDefault(require("./routes/projects"));
const alerts_1 = __importDefault(require("./routes/alerts"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const reports_1 = __importDefault(require("./routes/reports"));
const system_1 = __importDefault(require("./routes/system"));
// Load environment variables
dotenv_1.default.config();
class StackSleuthAPI {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: process.env.CORS_ORIGIN || "*",
                methods: ["GET", "POST", "PUT", "DELETE"]
            }
        });
        this.setupMiddleware();
        this.setupDatabase();
        this.setupRedis();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupSwagger();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: process.env.CORS_ORIGIN || "*",
            credentials: true
        }));
        // Performance middleware
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: 'Too many requests from this IP, please try again later.'
        });
        this.app.use('/api/', limiter);
        // Prometheus metrics
        this.app.use((0, prometheus_api_metrics_1.default)());
        // Request logging
        this.app.use((req, res, next) => {
            logger_1.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            next();
        });
    }
    async setupDatabase() {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stacksleuth';
            await mongoose_1.default.connect(mongoUri);
            logger_1.logger.info('Connected to MongoDB');
        }
        catch (error) {
            logger_1.logger.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }
    async setupRedis() {
        try {
            this.redis = redis_1.default.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });
            await this.redis.connect();
            logger_1.logger.info('Connected to Redis');
        }
        catch (error) {
            logger_1.logger.error('Redis connection error:', error);
            // Continue without Redis if not available
        }
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '0.2.3',
                uptime: process.uptime()
            });
        });
        // API routes
        this.app.use('/api/auth', auth_2.default);
        this.app.use('/api/metrics', auth_1.authMiddleware, metrics_1.default);
        this.app.use('/api/traces', auth_1.authMiddleware, traces_1.default);
        this.app.use('/api/projects', auth_1.authMiddleware, projects_1.default);
        this.app.use('/api/alerts', auth_1.authMiddleware, alerts_1.default);
        this.app.use('/api/dashboard', auth_1.authMiddleware, dashboard_1.default);
        this.app.use('/api/webhooks', webhooks_1.default);
        this.app.use('/api/analytics', auth_1.authMiddleware, analytics_1.default);
        this.app.use('/api/reports', auth_1.authMiddleware, reports_1.default);
        this.app.use('/api/system', auth_1.authMiddleware, system_1.default);
        // Static assets
        this.app.use('/assets', express_1.default.static('assets'));
    }
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            logger_1.logger.info(`Client connected: ${socket.id}`);
            // Join project rooms for real-time updates
            socket.on('join-project', (projectId) => {
                socket.join(`project-${projectId}`);
                logger_1.logger.info(`Client ${socket.id} joined project ${projectId}`);
            });
            // Handle real-time metric updates
            socket.on('metrics-update', (data) => {
                this.broadcastMetrics(data);
            });
            // Handle disconnection
            socket.on('disconnect', () => {
                logger_1.logger.info(`Client disconnected: ${socket.id}`);
            });
        });
    }
    setupSwagger() {
        const options = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'StackSleuth API',
                    version: '0.2.3',
                    description: 'Comprehensive performance monitoring API for StackSleuth platform',
                    contact: {
                        name: 'StackSleuth Team',
                        email: 'team@stacksleuth.com',
                        url: 'https://github.com/Jack-GitHub12/StackSleuth'
                    },
                    license: {
                        name: 'MIT',
                        url: 'https://opensource.org/licenses/MIT'
                    }
                },
                servers: [
                    {
                        url: process.env.API_BASE_URL || 'http://localhost:3000',
                        description: 'Development server'
                    }
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT'
                        }
                    }
                },
                security: [
                    {
                        bearerAuth: []
                    }
                ]
            },
            apis: ['./src/routes/*.ts', './src/models/*.ts']
        };
        const specs = (0, swagger_jsdoc_1.default)(options);
        this.app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'StackSleuth API Documentation'
        }));
    }
    setupErrorHandling() {
        this.app.use(errorHandler_1.notFoundHandler);
        this.app.use(errorHandler_1.errorHandler);
    }
    broadcastMetrics(data) {
        if (data.projectId) {
            this.io.to(`project-${data.projectId}`).emit('metrics-update', data);
        }
    }
    broadcastAlert(alert) {
        if (alert.projectId) {
            this.io.to(`project-${alert.projectId}`).emit('alert', alert);
        }
    }
    async start(port = 3000) {
        try {
            this.server.listen(port, () => {
                logger_1.logger.info(`StackSleuth API server running on port ${port}`);
                logger_1.logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
                logger_1.logger.info(`Health check available at http://localhost:${port}/health`);
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    async stop() {
        try {
            await new Promise((resolve) => {
                this.server.close(() => {
                    logger_1.logger.info('Server stopped');
                    resolve();
                });
            });
            await mongoose_1.default.disconnect();
            logger_1.logger.info('Database disconnected');
            if (this.redis) {
                await this.redis.quit();
                logger_1.logger.info('Redis disconnected');
            }
        }
        catch (error) {
            logger_1.logger.error('Error stopping server:', error);
        }
    }
    getApp() {
        return this.app;
    }
    getIO() {
        return this.io;
    }
}
exports.StackSleuthAPI = StackSleuthAPI;
// Create and start the API server
const api = new StackSleuthAPI();
// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    await api.stop();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    await api.stop();
    process.exit(0);
});
// Start the server
const port = parseInt(process.env.PORT || '3000', 10);
api.start(port);
exports.default = api;
//# sourceMappingURL=index.js.map