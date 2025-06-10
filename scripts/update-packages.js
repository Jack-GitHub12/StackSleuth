#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const newVersion = '0.2.2';

const packageDescriptions = {
  'core': 'Advanced TypeScript-based core profiling engine for StackSleuth - Real-time performance monitoring with flexible profiler, span tracing, and unified agent architecture. Features comprehensive metrics collection, memory optimization, and production-ready instrumentation.',
  'backend-agent': 'Comprehensive backend performance monitoring agent for Node.js applications - HTTP request tracing, database query optimization, memory profiling, and real-time metrics collection with WebSocket integration.',
  'frontend-agent': 'Advanced frontend performance monitoring for web applications - DOM event tracking, component lifecycle profiling, bundle analysis, memory leak detection, and real-time user interaction monitoring.',
  'db-agent': 'Universal database performance monitoring agent - Query optimization, connection pooling analysis, transaction tracking, and database-agnostic performance metrics for SQL and NoSQL databases.',
  'vue-agent': 'Specialized Vue.js performance monitoring agent - Component lifecycle tracking, Vuex state management profiling, route performance analysis, and reactive data monitoring with Vue DevTools integration.',
  'mongodb-agent': 'Advanced MongoDB performance monitoring agent - Query optimization, aggregation pipeline analysis, index usage tracking, connection pool monitoring, and real-time database performance metrics.',
  'cli': 'Comprehensive command-line interface for StackSleuth - Interactive dashboard, real-time monitoring, performance reports, CI/CD integration, and automated performance optimization recommendations.',
  'redis-agent': 'Advanced Redis performance monitoring agent - Command-level tracking, memory usage analysis, connection pooling optimization, slow query detection, and real-time cache performance metrics.',
  'fastapi-agent': 'Python FastAPI performance monitoring agent - Route-level tracing, WebSocket integration, request/response profiling, middleware performance analysis, and real-time API metrics collection.',
  'svelte-agent': 'Specialized Svelte performance monitoring agent - Component lifecycle tracking, store subscription monitoring, reactive state analysis, DOM mutation observation, and real-time memory profiling.',
  'django-agent': 'Advanced Django performance monitoring agent - Middleware tracking, database query optimization, template rendering analysis, session monitoring, and comprehensive view-level performance metrics.',
  'laravel-agent': 'Comprehensive Laravel performance monitoring agent - Eloquent ORM optimization, route performance analysis, middleware tracking, job queue monitoring, and advanced cache performance metrics.',
  'mysql-agent': 'Advanced MySQL performance monitoring agent - Query optimization, index analysis, connection pool monitoring, slow query detection, and real-time database performance insights.',
  'browser-agent': 'Advanced browser automation and performance monitoring agent - Playwright/Puppeteer integration, website crawling, user interaction simulation, screenshot capture, and real-time debugging capabilities.',
  'browser-extension': 'Comprehensive browser extension for real-time performance monitoring - DevTools integration, content script injection, tab performance tracking, and interactive performance visualization.',
  'session-replay': 'Advanced session replay and user interaction recording agent - DOM event capture, user journey tracking, performance correlation, and comprehensive session analytics.',
  'performance-optimizer': 'Intelligent performance optimization engine - Automated bottleneck detection, code optimization suggestions, resource optimization, and performance enhancement recommendations.',
  'visualizations': 'Advanced data visualization components for StackSleuth - Real-time charts, performance dashboards, interactive metrics displays, and comprehensive analytics visualizations.',
  'supabase-agent': 'Specialized Supabase performance monitoring agent - Real-time database tracking, auth performance analysis, edge function monitoring, and comprehensive cloud database optimization.',
  'dashboard': 'Interactive web dashboard for StackSleuth - Real-time performance visualization, comprehensive analytics, team collaboration features, and advanced monitoring capabilities.'
};

function updatePackage(packageDir) {
  const packageJsonPath = path.join(packageDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`Skipping ${packageDir} - no package.json found`);
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageName = packageJson.name.split('/')[1]; // Get the package name after @stacksleuth/
    
    // Update version
    packageJson.version = newVersion;
    
    // Update description if we have one
    if (packageDescriptions[packageName]) {
      packageJson.description = packageDescriptions[packageName];
    }
    
    // Enhanced keywords
    packageJson.keywords = [
      ...new Set([
        ...(packageJson.keywords || []),
        'performance',
        'monitoring',
        'profiling',
        'observability',
        'apm',
        'stacksleuth',
        'real-time',
        'analytics',
        'optimization',
        'instrumentation'
      ])
    ];
    
    // Enhanced repository info
    if (!packageJson.repository) {
      packageJson.repository = {
        type: 'git',
        url: 'https://github.com/Jack-GitHub12/StackSleuth.git',
        directory: `packages/${packageName}`
      };
    }
    
    // Enhanced author info
    if (!packageJson.author) {
      packageJson.author = {
        name: 'Jack',
        url: 'https://github.com/Jack-GitHub12'
      };
    }
    
    // Enhanced homepage and bugs
    packageJson.homepage = 'https://github.com/Jack-GitHub12/StackSleuth#readme';
    packageJson.bugs = {
      url: 'https://github.com/Jack-GitHub12/StackSleuth/issues'
    };
    
    // Ensure license
    if (!packageJson.license) {
      packageJson.license = 'MIT';
    }
    
    // Enhanced engines
    if (!packageJson.engines) {
      packageJson.engines = {
        node: '>=18.0.0'
      };
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated ${packageJson.name} to version ${newVersion}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${packageDir}:`, error.message);
  }
}

// Get all package directories
const packagesDir = path.join(__dirname, '..', 'packages');
const packageDirs = fs.readdirSync(packagesDir)
  .map(dir => path.join(packagesDir, dir))
  .filter(dir => fs.statSync(dir).isDirectory());

console.log('🚀 Updating package versions and documentation...\n');

// Update each package
packageDirs.forEach(updatePackage);

console.log(`\n✨ All packages updated to version ${newVersion}!`);
console.log('📦 Enhanced with comprehensive documentation and metadata'); 