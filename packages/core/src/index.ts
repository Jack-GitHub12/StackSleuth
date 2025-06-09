// Types
export * from './types';

// Utilities
export * from './utils';

// Core collector
export * from './collector';

// Flamegraph utilities
export * from './flamegraph';

// Adaptive sampling
export * from './adaptive-sampling';

// Default configuration
export const defaultConfig = {
  enabled: true,
  sampling: { rate: 1.0 },
  filters: {},
  output: { 
    console: true,
    dashboard: {
      enabled: false,
      port: 3001,
      host: 'localhost'
    }
  }
}; 