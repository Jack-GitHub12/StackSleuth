export interface MySQLConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  database: string;
  slowQueryThreshold?: number;
  metricsInterval?: number;
  enablePerformanceSchema?: boolean;
  performanceSchemaInterval?: number;
}

export interface QueryMetrics {
  query: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  errors: number;
}

export interface ConnectionPoolMetrics {
  active: number;
  idle: number;
  waiting: number;
  total: number;
}