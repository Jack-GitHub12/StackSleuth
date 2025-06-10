#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const newVersion = '0.2.3';

const packageDescriptions = {
  'core': 'Advanced TypeScript-based core profiling engine for StackSleuth - Real-time performance monitoring with flexible profiler, span tracing, and unified agent architecture. Features comprehensive metrics collection, memory optimization, and production-ready instrumentation.',
  'backend-agent': 'Comprehensive backend performance monitoring agent for Node.js applications - HTTP request tracing, database query optimization, memory profiling, and real-time metrics collection with WebSocket integration.',
  'frontend-agent': 'Advanced frontend performance monitoring for web applications - DOM event tracking, component lifecycle profiling, bundle analysis, memory leak detection, and real-time user interaction monitoring.',
  'db-agent': 'Universal database performance monitoring agent - Multi-database support, query optimization, connection pool monitoring, transaction tracking, and comprehensive database performance analytics.',
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
  'performance-optimizer': 'Intelligent performance optimization engine - Automated bottleneck detection, code optimization suggestions, resource optimization, and performance enhancement recommendations.'
};

function updatePackageJson(packagePath, packageName) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  package.json not found: ${packageName}`);
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update version
    packageJson.version = newVersion;
    
    // Update description if available
    if (packageDescriptions[packageName]) {
      packageJson.description = packageDescriptions[packageName];
    }
    
    // Enhanced keywords for better NPM discoverability
    const commonKeywords = [
      'performance',
      'monitoring',
      'profiling',
      'stacksleuth',
      'observability',
      'analytics',
      'optimization',
      'instrumentation',
      'apm',
      'real-time'
    ];
    
    const specificKeywords = {
      'core': ['core', 'engine', 'tracing', 'spans'],
      'backend-agent': ['backend', 'nodejs', 'express', 'api'],
      'frontend-agent': ['frontend', 'browser', 'web-vitals', 'dom'],
      'vue-agent': ['vue', 'vuejs', 'components', 'vuex'],
      'svelte-agent': ['svelte', 'sveltekit', 'components'],
      'django-agent': ['django', 'python', 'orm', 'middleware'],
      'laravel-agent': ['laravel', 'php', 'eloquent', 'artisan'],
      'fastapi-agent': ['fastapi', 'python', 'async', 'websocket'],
      'redis-agent': ['redis', 'cache', 'memory', 'database'],
      'mongodb-agent': ['mongodb', 'nosql', 'aggregation', 'index'],
      'mysql-agent': ['mysql', 'sql', 'database', 'queries'],
      'db-agent': ['database', 'sql', 'orm', 'connections'],
      'browser-agent': ['browser', 'automation', 'playwright', 'puppeteer'],
      'browser-extension': ['extension', 'devtools', 'browser', 'chrome'],
      'cli': ['cli', 'dashboard', 'reports', 'cicd'],
      'performance-optimizer': ['optimization', 'ai', 'recommendations', 'bottlenecks']
    };
    
    packageJson.keywords = [
      ...commonKeywords,
      ...(specificKeywords[packageName] || [])
    ];
    
    // Enhanced repository and homepage info
    packageJson.repository = {
      type: 'git',
      url: 'https://github.com/Jack-GitHub12/StackSleuth.git',
      directory: `packages/${packageName}`
    };
    
    packageJson.homepage = `https://github.com/Jack-GitHub12/StackSleuth/tree/main/packages/${packageName}#readme`;
    packageJson.bugs = {
      url: 'https://github.com/Jack-GitHub12/StackSleuth/issues'
    };
    
    // Author information
    packageJson.author = {
      name: 'StackSleuth Team',
      email: 'team@stacksleuth.com',
      url: 'https://github.com/Jack-GitHub12/StackSleuth'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated ${packageName} to v${newVersion} with enhanced documentation`);
    
  } catch (error) {
    console.error(`❌ Failed to update ${packageName}:`, error.message);
  }
}

async function updateAllPackages() {
  console.log(`🚀 Updating all packages to v${newVersion} with comprehensive documentation...\n`);

  const packagesDir = path.join(__dirname, '..', 'packages');
  const packages = fs.readdirSync(packagesDir);

  packages.forEach(packageName => {
    const packagePath = path.join(packagesDir, packageName);
    if (fs.statSync(packagePath).isDirectory()) {
      updatePackageJson(packagePath, packageName);
    }
  });

  console.log(`\n✨ All packages updated to v${newVersion}!`);
  console.log('📚 Enhanced with comprehensive documentation and improved NPM metadata');
  console.log('🔗 Ready for publication with complete README files and professional branding');
}

if (require.main === module) {
  updateAllPackages().catch(console.error);
}

module.exports = { updateAllPackages }; 