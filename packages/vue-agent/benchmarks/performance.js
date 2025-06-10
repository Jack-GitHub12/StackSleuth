const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

// Mock Vue environment
global.window = {
  MutationObserver: class MockMutationObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
  },
  Vue: {
    version: '3.0.0',
    config: {
      globalProperties: {}
    },
    mixin: () => {},
    directive: () => {},
    component: () => {},
    createApp: () => ({
      mixin: () => {},
      config: { globalProperties: {} }
    })
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

// Mock Vue devtools
global.__VUE_DEVTOOLS_GLOBAL_HOOK__ = {
  emit: () => {},
  on: () => {},
  Vue: global.window.Vue
};

// Import after setting up globals
const { VueAgent } = require('../dist/index.js');

console.log('🔥 Starting Vue Agent Performance Benchmarks');

// Benchmark: Agent Initialization
suite.add('Agent Initialization', {
  defer: true,
  fn: async function(deferred) {
    const agent = new VueAgent();
    await agent.init();
    await agent.stop();
    deferred.resolve();
  }
});

// Benchmark: Component Lifecycle Tracking
suite.add('Component Lifecycle Tracking', {
  defer: true,
  setup: async function() {
    this.agent = new VueAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    // Simulate Vue component lifecycle events
    for (let i = 0; i < 100; i++) {
      const component = {
        $options: { name: `BenchmarkComponent${i}` },
        $el: { tagName: 'DIV' },
        $data: { count: i },
        $computed: {},
        $watch: {}
      };
      
      this.agent.recordComponentMetric(component, 'beforeCreate', Math.random() * 10);
      this.agent.recordComponentMetric(component, 'created', Math.random() * 15);
      this.agent.recordComponentMetric(component, 'beforeMount', Math.random() * 20);
      this.agent.recordComponentMetric(component, 'mounted', Math.random() * 25);
      this.agent.recordComponentMetric(component, 'beforeUpdate', Math.random() * 12);
      this.agent.recordComponentMetric(component, 'updated', Math.random() * 18);
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Reactive Data Tracking
suite.add('Reactive Data Tracking', {
  defer: true,
  setup: async function() {
    this.agent = new VueAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    // Simulate reactive data changes
    for (let i = 0; i < 200; i++) {
      const component = {
        $options: { name: 'ReactiveComponent' },
        $data: { value: i, nested: { prop: i * 2 } }
      };
      
      this.agent.trackReactiveData(component, 'value', i - 1, i);
      this.agent.trackReactiveData(component, 'nested.prop', (i - 1) * 2, i * 2);
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Performance Optimization Detection
suite.add('Performance Optimization Detection', {
  defer: true,
  setup: async function() {
    this.agent = new VueAgent();
    await this.agent.init();
    
    // Setup components with performance issues
    for (let i = 0; i < 50; i++) {
      const component = {
        $options: { name: `SlowComponent${i}` },
        $el: { tagName: 'DIV' }
      };
      
      // Simulate slow operations
      this.agent.recordComponentMetric(component, 'updated', 150 + Math.random() * 100); // Slow updates
    }
  },
  fn: function(deferred) {
    for (let i = 0; i < 10; i++) {
      this.agent.detectPerformanceIssues();
    }
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Memory Usage Analysis
suite.add('Memory Usage Analysis', {
  defer: true,
  setup: async function() {
    this.agent = new VueAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    // Simulate memory tracking for multiple components
    for (let i = 0; i < 100; i++) {
      const component = {
        $options: { name: `MemoryComponent${i}` },
        $data: new Array(1000).fill(i), // Large data object
        $computed: Object.fromEntries(Array(50).fill().map((_, j) => [`computed${j}`, () => i * j]))
      };
      
      this.agent.analyzeMemoryUsage(component);
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Vuex State Management Tracking
suite.add('Vuex State Management Tracking', {
  defer: true,
  setup: async function() {
    this.agent = new VueAgent();
    await this.agent.init();
    
    // Mock Vuex store
    this.store = {
      state: { counter: 0, users: [] },
      getters: {},
      mutations: {},
      actions: {}
    };
  },
  fn: function(deferred) {
    // Simulate Vuex mutations and actions
    for (let i = 0; i < 150; i++) {
      this.agent.trackVuexMutation(this.store, 'INCREMENT', { amount: 1 }, Math.random() * 5);
      this.agent.trackVuexAction(this.store, 'fetchUsers', { page: i }, Math.random() * 50);
      
      if (i % 10 === 0) {
        this.agent.trackVuexStateChange(this.store, 'counter', i - 1, i);
      }
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
    this.agent = new VueAgent();
    await this.agent.init();
    
    // Pre-populate with comprehensive test data
    for (let i = 0; i < 200; i++) {
      const component = {
        $options: { name: `SummaryComponent${i}` },
        $el: { tagName: 'DIV' },
        $data: { prop: i }
      };
      
      this.agent.recordComponentMetric(component, 'created', Math.random() * 20);
      this.agent.recordComponentMetric(component, 'mounted', Math.random() * 30);
      this.agent.recordComponentMetric(component, 'updated', Math.random() * 25);
      
      if (i % 5 === 0) {
        this.agent.trackReactiveData(component, 'prop', i - 1, i);
      }
    }
  },
  fn: function(deferred) {
    for (let i = 0; i < 15; i++) {
      this.agent.getPerformanceSummary();
    }
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Large-Scale Component Tree Analysis
suite.add('Large-Scale Component Tree Analysis', {
  defer: true,
  setup: async function() {
    this.agent = new VueAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    // Simulate large component tree with nested components
    const createComponentTree = (depth, breadth, parentId = null) => {
      for (let i = 0; i < breadth; i++) {
        const componentId = `${parentId || 'root'}_${depth}_${i}`;
        const component = {
          $options: { name: componentId },
          $parent: parentId ? { $options: { name: parentId } } : null,
          $children: [],
          $el: { tagName: 'DIV' },
          $data: { id: componentId, depth, index: i }
        };
        
        this.agent.recordComponentMetric(component, 'created', Math.random() * 30);
        this.agent.recordComponentMetric(component, 'mounted', Math.random() * 40);
        
        // Recursively create children
        if (depth > 0) {
          createComponentTree(depth - 1, Math.max(1, breadth - 1), componentId);
        }
      }
    };
    
    // Create component tree: depth 4, breadth 5 = ~781 components
    createComponentTree(4, 5);
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Concurrent Performance Tracking
suite.add('Concurrent Performance Tracking', {
  defer: true,
  setup: async function() {
    this.agent = new VueAgent();
    await this.agent.init();
  },
  fn: function(deferred) {
    const promises = [];
    
    // Simulate concurrent component operations
    for (let i = 0; i < 25; i++) {
      promises.push(new Promise(resolve => {
        setTimeout(() => {
          for (let j = 0; j < 40; j++) {
            const component = {
              $options: { name: `ConcurrentComponent${i}_${j}` },
              $el: { tagName: 'DIV' },
              $data: { thread: i, index: j }
            };
            
            this.agent.recordComponentMetric(component, 'beforeCreate', Math.random() * 10);
            this.agent.recordComponentMetric(component, 'created', Math.random() * 15);
            this.agent.recordComponentMetric(component, 'mounted', Math.random() * 20);
            
            if (j % 5 === 0) {
              this.agent.trackReactiveData(component, 'index', j - 1, j);
            }
          }
          resolve();
        }, Math.random() * 20);
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
    console.log('\n📊 Vue Agent Benchmark Results:');
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
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    const initResult = results.find(r => r.name === 'Agent Initialization');
    if (initResult && initResult.mean > 0.01) {
      console.log('⚠️  Agent initialization is slow - consider optimizing Vue hooks setup');
    }
    
    const lifecycleResult = results.find(r => r.name === 'Component Lifecycle Tracking');
    if (lifecycleResult && lifecycleResult.hz < 100) {
      console.log('⚠️  Component lifecycle tracking needs optimization - consider event batching');
    }
    
    const reactiveResult = results.find(r => r.name === 'Reactive Data Tracking');
    if (reactiveResult && reactiveResult.hz < 200) {
      console.log('⚠️  Reactive data tracking could be optimized - consider debouncing');
    }
    
    const largeScaleResult = results.find(r => r.name === 'Large-Scale Component Tree Analysis');
    if (largeScaleResult && largeScaleResult.hz < 5) {
      console.log('⚠️  Large-scale analysis is slow - consider tree traversal optimization');
    }
    
    const concurrentResult = results.find(r => r.name === 'Concurrent Performance Tracking');
    if (concurrentResult && concurrentResult.hz < 30) {
      console.log('⚠️  Concurrent operations need improvement - consider worker threads');
    }
    
    // Vue-specific recommendations
    console.log('\n🔧 Vue-Specific Optimizations:');
    
    const vuexResult = results.find(r => r.name === 'Vuex State Management Tracking');
    if (vuexResult && vuexResult.hz < 150) {
      console.log('📦 Vuex tracking performance could be improved with state normalization');
    }
    
    const memoryResult = results.find(r => r.name === 'Memory Usage Analysis');
    if (memoryResult && memoryResult.hz < 100) {
      console.log('🧠 Memory analysis needs optimization - consider object pooling');
    }
    
    console.log('\n✅ Vue Agent benchmarks completed!');
    process.exit(0);
  })
  .run({ async: true }); 