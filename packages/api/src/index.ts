import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import promApiMetrics from 'prometheus-api-metrics';
import mongoose from 'mongoose';
import Redis from 'redis';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import metricsRoutes from './routes/metrics';
import tracesRoutes from './routes/traces';
import projectsRoutes from './routes/projects';
import alertsRoutes from './routes/alerts';
import dashboardRoutes from './routes/dashboard';
import webhooksRoutes from './routes/webhooks';
import analyticsRoutes from './routes/analytics';
import reportsRoutes from './routes/reports';
import systemRoutes from './routes/system';

// Load environment variables
dotenv.config();

export class StackSleuthAPI {
  private app: express.Application;
  private server: any;
  private io: Server;
  private redis: any;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
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

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true
    }));

    // Performance middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Prometheus metrics
    this.app.use(promApiMetrics());

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
  }

  private async setupDatabase(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stacksleuth';
      await mongoose.connect(mongoUri);
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }

  private async setupRedis(): Promise<void> {
    try {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await this.redis.connect();
      logger.info('Connected to Redis');
    } catch (error) {
      logger.error('Redis connection error:', error);
      // Continue without Redis if not available
    }
  }

  private setupRoutes(): void {
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
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/metrics', authMiddleware, metricsRoutes);
    this.app.use('/api/traces', authMiddleware, tracesRoutes);
    this.app.use('/api/projects', authMiddleware, projectsRoutes);
    this.app.use('/api/alerts', authMiddleware, alertsRoutes);
    this.app.use('/api/dashboard', authMiddleware, dashboardRoutes);
    this.app.use('/api/webhooks', webhooksRoutes);
    this.app.use('/api/analytics', authMiddleware, analyticsRoutes);
    this.app.use('/api/reports', authMiddleware, reportsRoutes);
    this.app.use('/api/system', authMiddleware, systemRoutes);

    // Static assets
    this.app.use('/assets', express.static('assets'));
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Join project rooms for real-time updates
      socket.on('join-project', (projectId: string) => {
        socket.join(`project-${projectId}`);
        logger.info(`Client ${socket.id} joined project ${projectId}`);
      });

      // Handle real-time metric updates
      socket.on('metrics-update', (data) => {
        this.broadcastMetrics(data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private setupSwagger(): void {
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

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'StackSleuth API Documentation'
    }));
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public broadcastMetrics(data: any): void {
    if (data.projectId) {
      this.io.to(`project-${data.projectId}`).emit('metrics-update', data);
    }
  }

  public broadcastAlert(alert: any): void {
    if (alert.projectId) {
      this.io.to(`project-${alert.projectId}`).emit('alert', alert);
    }
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      this.server.listen(port, () => {
        logger.info(`StackSleuth API server running on port ${port}`);
        logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
        logger.info(`Health check available at http://localhost:${port}/health`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          logger.info('Server stopped');
          resolve();
        });
      });

      await mongoose.disconnect();
      logger.info('Database disconnected');

      if (this.redis) {
        await this.redis.quit();
        logger.info('Redis disconnected');
      }
    } catch (error) {
      logger.error('Error stopping server:', error);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getIO(): Server {
    return this.io;
  }
}

// Create and start the API server
const api = new StackSleuthAPI();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await api.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await api.stop();
  process.exit(0);
});

// Start the server
const port = parseInt(process.env.PORT || '3000', 10);
api.start(port);

export default api; 