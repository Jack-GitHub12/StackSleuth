const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

// Import after setting up environment
const { PerformanceOptimizerAgent } = require('../dist/index.js');

console.log('🔥 Starting Performance Optimizer Agent Benchmarks');

// Benchmark: Agent Initialization
suite.add('Agent Initialization', {
  defer: true,
  fn: async function(deferred) {
    const agent = new PerformanceOptimizerAgent();
    await agent.init();
    await agent.stop();
    deferred.resolve();
  }
});

// Benchmark: Metric Recording
suite.add('Metric Recording', {
  defer: true,
  setup: async function() {
    this.agent = new PerformanceOptimizerAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    // Record various metrics
    for (let i = 0; i < 100; i++) {
      this.agent.recordMetric({
        component: `component_${i % 10}`,
        metric: 'response_time',
        value: Math.random() * 1000,
        unit: 'ms',
        timestamp: Date.now(),
        threshold: 500,
        target: 200
      });
    }
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Performance Analysis
suite.add('Performance Analysis', {
  defer: true,
  setup: async function() {
    this.agent = new PerformanceOptimizerAgent();
    await this.agent.init();
    
    // Pre-populate with test data
    for (let i = 0; i < 500; i++) {
      this.agent.recordMetric({
        component: `component_${i % 20}`,
        metric: ['response_time', 'memory_usage', 'cpu_usage'][i % 3],
        value: Math.random() * 1000,
        unit: ['ms', '%', '%'][i % 3],
        timestamp: Date.now() - Math.random() * 86400000, // Last 24 hours
        threshold: [500, 80, 70][i % 3]
      });
    }
  },
  fn: function(deferred) {
    // Run analysis multiple times
    for (let i = 0; i < 10; i++) {
      this.agent.runAnalysis();
    }
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Recommendation Generation
suite.add('Recommendation Generation', {
  defer: true,
  setup: async function() {
    this.agent = new PerformanceOptimizerAgent();
    await this.agent.init();
    
    // Create performance issues
    for (let i = 0; i < 100; i++) {
      this.agent.recordMetric({
        component: 'database',
        metric: 'query_time',
        value: 800 + Math.random() * 500, // Slow queries
        unit: 'ms',
        timestamp: Date.now(),
        threshold: 500
      });
    }
  },
  fn: function(deferred) {
    // Generate recommendations
    for (let i = 0; i < 5; i++) {
      this.agent.generateReport();
    }
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Large-Scale Metrics Processing
suite.add('Large-Scale Metrics Processing', {
  defer: true,
  setup: async function() {
    this.agent = new PerformanceOptimizerAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    // Simulate high-volume metrics
    for (let i = 0; i < 5000; i++) {
      this.agent.recordMetric({
        component: `component_${i % 100}`,
        metric: ['response_time', 'memory_usage', 'cpu_usage', 'disk_usage', 'network_latency'][i % 5],
        value: Math.random() * 1000,
        unit: ['ms', '%', '%', '%', 'ms'][i % 5],
        timestamp: Date.now(),
        threshold: [500, 80, 70, 85, 200][i % 5]
      });
    }
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Run benchmarks
suite
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('\n📊 Performance Optimizer Benchmark Results:');
    console.log('Fastest: ' + this.filter('fastest').map('name'));
    console.log('Slowest: ' + this.filter('slowest').map('name'));
    
    // Performance analysis
    const results = this.map(test => ({
      name: test.name,
      hz: test.hz,
      rme: test.stats.rme,
      mean: test.stats.mean,
      samples: test.stats.sample.length
    }));
    
    console.log('\n📈 Detailed Results:');
    results.forEach(result => {
      console.log(`${result.name}:`);
      console.log(`  Operations/sec: ${result.hz.toLocaleString()} (±${result.rme.toFixed(2)}%)`);
      console.log(`  Mean time: ${(result.mean * 1000).toFixed(2)}ms`);
      console.log(`  Samples: ${result.samples}`);
    });
    
    console.log('\n✅ Performance Optimizer benchmarks completed!');
    process.exit(0);
  })
  .run({ async: true }); 