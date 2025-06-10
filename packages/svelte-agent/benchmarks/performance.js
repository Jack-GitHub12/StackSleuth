const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

// Mock Svelte environment
global.window = {
  MutationObserver: class MockMutationObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
  },
  svelte: {
    internal: {
      create_component: () => ({ constructor: { name: 'TestComponent' } }),
      mount_component: () => {},
      update: () => {},
      destroy_component: () => {}
    },
    store: {
      writable: (value) => ({
        subscribe: (callback) => callback(value),
        set: (newValue) => value = newValue
      }),
      readable: (value) => ({
        subscribe: (callback) => callback(value)
      })
    }
  },
  performance: {
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    },
    now: () => Date.now()
  }
};

global.document = {
  body: {
    attributes: { length: 5 }
  }
};

global.Node = {
  ELEMENT_NODE: 1
};

// Mock MutationObserver for Node.js environment
global.MutationObserver = class MockMutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
};

// Import after setting up globals
const { SvelteAgent } = require('../dist/index.js');

console.log('🔥 Starting Svelte Agent Performance Benchmarks');

// Benchmark: Agent Initialization
suite.add('Agent Initialization', {
  defer: true,
  fn: async function(deferred) {
    const agent = new SvelteAgent();
    await agent.init();
    await agent.stop();
    deferred.resolve();
  }
});

// Benchmark: Component Metrics Recording
suite.add('Component Metrics Recording', {
  defer: true,
  setup: async function() {
    this.agent = new SvelteAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    // Simulate component operations
    const component = { constructor: { name: 'BenchmarkComponent' } };
    
    for (let i = 0; i < 100; i++) {
      this.agent.recordComponentMetric(component, 'create', Math.random() * 50, {});
      this.agent.recordComponentMetric(component, 'mount', Math.random() * 30);
      this.agent.recordComponentMetric(component, 'update', Math.random() * 20);
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Store Metrics Recording
suite.add('Store Metrics Recording', {
  defer: true,
  setup: async function() {
    this.agent = new SvelteAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    const storeName = 'benchmarkStore';
    
    for (let i = 0; i < 100; i++) {
      this.agent.updateStoreMetric(storeName, 'subscribe');
      this.agent.updateStoreMetric(storeName, 'update', Math.random() * 10, { value: i });
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Memory Usage Tracking
suite.add('Memory Usage Tracking', {
  defer: true,
  setup: async function() {
    this.agent = new SvelteAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    // Simulate memory tracking
    for (let i = 0; i < 50; i++) {
      this.agent.trackMemoryUsage();
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Performance Summary Generation
suite.add('Performance Summary Generation', {
  defer: true,
  setup: async function() {
    this.agent = new SvelteAgent();
    await this.agent.init();
    
    // Pre-populate with test data
    for (let i = 0; i < 100; i++) {
      const component = { constructor: { name: `Component${i}` } };
      this.agent.recordComponentMetric(component, 'create', Math.random() * 100);
      this.agent.updateStoreMetric(`store${i}`, 'subscribe');
    }
  },
  fn: function(deferred) {
    for (let i = 0; i < 10; i++) {
      this.agent.getPerformanceSummary();
    }
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Large Dataset Processing
suite.add('Large Dataset Processing', {
  defer: true,
  setup: async function() {
    this.agent = new SvelteAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    // Simulate processing large amounts of component data
    for (let i = 0; i < 1000; i++) {
      const component = { constructor: { name: `LargeComponent${i}` } };
      this.agent.recordComponentMetric(component, 'create', Math.random() * 200);
      this.agent.recordComponentMetric(component, 'mount', Math.random() * 150);
      this.agent.recordComponentMetric(component, 'update', Math.random() * 100);
      
      if (i % 10 === 0) {
        this.agent.updateStoreMetric(`largeStore${i}`, 'update', Math.random() * 50, { data: new Array(100).fill(i) });
      }
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Concurrent Operations
suite.add('Concurrent Operations', {
  defer: true,
  setup: async function() {
    this.agent = new SvelteAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    const promises = [];
    
    for (let i = 0; i < 20; i++) {
      promises.push(new Promise(resolve => {
        setTimeout(() => {
          for (let j = 0; j < 50; j++) {
            const component = { constructor: { name: `ConcurrentComponent${i}_${j}` } };
            this.agent.recordComponentMetric(component, 'create', Math.random() * 100);
          }
          resolve();
        }, Math.random() * 10);
      }));
    }
    
    Promise.all(promises).then(() => deferred.resolve());
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
    console.log('\n📊 Svelte Agent Benchmark Results:');
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
    
    // Memory and performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    const initResult = results.find(r => r.name === 'Agent Initialization');
    if (initResult && initResult.mean > 0.01) { // 10ms
      console.log('⚠️  Agent initialization is slow - consider lazy loading');
    }
    
    const largeDatasetResult = results.find(r => r.name === 'Large Dataset Processing');
    if (largeDatasetResult && largeDatasetResult.hz < 10) {
      console.log('⚠️  Large dataset processing needs optimization - consider batching');
    }
    
    const concurrentResult = results.find(r => r.name === 'Concurrent Operations');
    if (concurrentResult && concurrentResult.hz < 50) {
      console.log('⚠️  Concurrent operations performance could be improved');
    }
    
    console.log('\n✅ Svelte Agent benchmarks completed!');
    process.exit(0);
  })
  .run({ async: true }); 