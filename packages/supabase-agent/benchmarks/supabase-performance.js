const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

// Mock Supabase environment
global.createClient = () => ({
  from: (table) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null }),
    upsert: () => Promise.resolve({ data: [], error: null })
  }),
  rpc: () => Promise.resolve({ data: [], error: null }),
  channel: (name) => ({
    on: () => ({ unsubscribe: () => {} }),
    onError: () => {},
    onClose: () => {},
    state: 'joined'
  }),
  storage: {
    from: (bucket) => ({
      upload: () => Promise.resolve({ data: {}, error: null }),
      download: () => Promise.resolve({ data: {}, error: null }),
      remove: () => Promise.resolve({ data: {}, error: null }),
      list: () => Promise.resolve({ data: [], error: null })
    })
  },
  auth: {
    signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
    signUp: () => Promise.resolve({ data: {}, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: {}, error: null }),
    refreshToken: () => Promise.resolve({ data: {}, error: null })
  }
});

// Import after setting up globals
const { SupabaseAgent } = require('../dist/index.js');

console.log('🔥 Starting Supabase Agent Performance Benchmarks');

// Benchmark: Agent Initialization
suite.add('Agent Initialization', {
  defer: true,
  fn: async function(deferred) {
    const agent = new SupabaseAgent();
    await agent.init('https://test.supabase.co', 'test-key');
    await agent.stop();
    deferred.resolve();
  }
});

// Benchmark: Database Operations Tracking
suite.add('Database Operations Tracking', {
  defer: true,
  setup: async function() {
    this.agent = new SupabaseAgent();
    await this.agent.init('https://test.supabase.co', 'test-key');
  },
  fn: function(deferred) {
    const promises = [];
    
    // Simulate various database operations
    for (let i = 0; i < 100; i++) {
      promises.push(
        this.agent.recordOperation({
          operation: 'select',
          table: `table_${i % 10}`,
          duration: Math.random() * 100,
          rowCount: Math.floor(Math.random() * 50),
          querySize: Math.floor(Math.random() * 1000),
          cacheHit: Math.random() > 0.7,
          timestamp: Date.now()
        })
      );
      
      if (i % 5 === 0) {
        promises.push(
          this.agent.recordOperation({
            operation: 'insert',
            table: `table_${i % 10}`,
            duration: Math.random() * 150,
            rowCount: 1,
            querySize: Math.floor(Math.random() * 500),
            cacheHit: false,
            timestamp: Date.now()
          })
        );
      }
    }
    
    Promise.all(promises).then(() => deferred.resolve());
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Realtime Events Processing
suite.add('Realtime Events Processing', {
  defer: true,
  setup: async function() {
    this.agent = new SupabaseAgent();
    await this.agent.init('https://test.supabase.co', 'test-key');
  },
  fn: function(deferred) {
    // Simulate realtime events
    for (let i = 0; i < 200; i++) {
      this.agent.recordRealtimeEvent({
        channel: `channel_${i % 5}`,
        event: ['INSERT', 'UPDATE', 'DELETE'][i % 3],
        subscriptionCount: Math.floor(Math.random() * 10) + 1,
        messageSize: Math.floor(Math.random() * 2000),
        latency: Math.random() * 50,
        connectionStatus: 'connected',
        timestamp: Date.now()
      });
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Storage Operations Tracking
suite.add('Storage Operations Tracking', {
  defer: true,
  setup: async function() {
    this.agent = new SupabaseAgent();
    await this.agent.init('https://test.supabase.co', 'test-key');
  },
  fn: function(deferred) {
    // Simulate storage operations
    for (let i = 0; i < 50; i++) {
      this.agent.recordStorageOperation({
        bucket: `bucket_${i % 3}`,
        operation: ['upload', 'download', 'delete', 'list'][i % 4],
        fileSize: Math.floor(Math.random() * 1000000), // Up to 1MB
        duration: Math.random() * 500,
        timestamp: Date.now()
      });
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Auth Operations Tracking
suite.add('Auth Operations Tracking', {
  defer: true,
  setup: async function() {
    this.agent = new SupabaseAgent();
    await this.agent.init('https://test.supabase.co', 'test-key');
  },
  fn: function(deferred) {
    // Simulate auth operations
    for (let i = 0; i < 30; i++) {
      this.agent.recordAuthOperation({
        operation: ['signIn', 'signUp', 'signOut', 'getUser', 'refreshToken'][i % 5],
        provider: i % 3 === 0 ? 'google' : i % 3 === 1 ? 'github' : undefined,
        duration: Math.random() * 1000,
        success: Math.random() > 0.1, // 90% success rate
        timestamp: Date.now()
      });
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
    this.agent = new SupabaseAgent();
    await this.agent.init('https://test.supabase.co', 'test-key');
    
    // Pre-populate with test data
    for (let i = 0; i < 500; i++) {
      this.agent.recordOperation({
        operation: ['select', 'insert', 'update', 'delete'][i % 4],
        table: `table_${i % 20}`,
        duration: Math.random() * 200,
        rowCount: Math.floor(Math.random() * 100),
        querySize: Math.floor(Math.random() * 2000),
        cacheHit: Math.random() > 0.8,
        timestamp: Date.now()
      });
    }
    
    for (let i = 0; i < 100; i++) {
      this.agent.recordRealtimeEvent({
        channel: `channel_${i % 10}`,
        event: 'UPDATE',
        subscriptionCount: Math.floor(Math.random() * 5),
        messageSize: Math.floor(Math.random() * 1000),
        latency: Math.random() * 30,
        connectionStatus: 'connected',
        timestamp: Date.now()
      });
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

// Benchmark: Table Statistics Analysis
suite.add('Table Statistics Analysis', {
  defer: true,
  setup: async function() {
    this.agent = new SupabaseAgent();
    await this.agent.init('https://test.supabase.co', 'test-key');
    
    // Create diverse operation patterns for different tables
    const tables = ['users', 'posts', 'comments', 'likes', 'follows'];
    
    tables.forEach((table, tableIndex) => {
      for (let i = 0; i < 200; i++) {
        this.agent.recordOperation({
          operation: ['select', 'insert', 'update', 'delete'][i % 4],
          table,
          duration: Math.random() * (100 + tableIndex * 50), // Different performance per table
          rowCount: Math.floor(Math.random() * 50),
          querySize: Math.floor(Math.random() * 1500),
          cacheHit: Math.random() > (0.7 + tableIndex * 0.05),
          timestamp: Date.now() - Math.random() * 86400000 // Spread over 24 hours
        });
      }
    });
  },
  fn: function(deferred) {
    const tables = ['users', 'posts', 'comments', 'likes', 'follows'];
    
    for (let i = 0; i < 5; i++) {
      tables.forEach(table => {
        this.agent.getTableStats(table);
      });
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Large-Scale Operations Processing
suite.add('Large-Scale Operations Processing', {
  defer: true,
  setup: async function() {
    this.agent = new SupabaseAgent();
    await this.agent.init('https://test.supabase.co', 'test-key');
  },
  fn: function(deferred) {
    // Simulate high-volume operations
    for (let i = 0; i < 2000; i++) {
      this.agent.recordOperation({
        operation: ['select', 'insert', 'update', 'delete'][i % 4],
        table: `large_table_${i % 50}`,
        duration: Math.random() * 300,
        rowCount: Math.floor(Math.random() * 200),
        querySize: Math.floor(Math.random() * 5000),
        cacheHit: Math.random() > 0.6,
        error: Math.random() > 0.95 ? 'Connection timeout' : undefined,
        timestamp: Date.now()
      });
      
      if (i % 10 === 0) {
        this.agent.recordRealtimeEvent({
          channel: `large_channel_${i % 20}`,
          event: 'INSERT',
          subscriptionCount: Math.floor(Math.random() * 15),
          messageSize: Math.floor(Math.random() * 3000),
          latency: Math.random() * 100,
          connectionStatus: 'connected',
          timestamp: Date.now()
        });
      }
    }
    
    deferred.resolve();
  },
  teardown: async function() {
    await this.agent.stop();
  }
});

// Benchmark: Concurrent Operations Handling
suite.add('Concurrent Operations Handling', {
  defer: true,
  setup: async function() {
    this.agent = new SupabaseAgent();
    await this.agent.init('https://test.supabase.co', 'test-key');
  },
  fn: function(deferred) {
    const promises = [];
    
    // Simulate concurrent database operations
    for (let i = 0; i < 50; i++) {
      promises.push(new Promise(resolve => {
        setTimeout(() => {
          for (let j = 0; j < 20; j++) {
            this.agent.recordOperation({
              operation: 'select',
              table: `concurrent_table_${i}`,
              duration: Math.random() * 150,
              rowCount: Math.floor(Math.random() * 30),
              querySize: Math.floor(Math.random() * 1200),
              cacheHit: Math.random() > 0.75,
              timestamp: Date.now()
            });
          }
          resolve();
        }, Math.random() * 50);
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
    console.log('\n📊 Supabase Agent Benchmark Results:');
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
    
    // Supabase-specific performance analysis
    console.log('\n💡 Supabase Performance Recommendations:');
    
    const dbOpsResult = results.find(r => r.name === 'Database Operations Tracking');
    if (dbOpsResult && dbOpsResult.hz < 100) {
      console.log('🗄️  Database operations tracking needs optimization - consider operation batching');
    }
    
    const realtimeResult = results.find(r => r.name === 'Realtime Events Processing');
    if (realtimeResult && realtimeResult.hz < 200) {
      console.log('⚡ Realtime events processing could be improved - consider event queuing');
    }
    
    const storageResult = results.find(r => r.name === 'Storage Operations Tracking');
    if (storageResult && storageResult.hz < 50) {
      console.log('📁 Storage operations tracking is slow - consider async processing');
    }
    
    const largeScaleResult = results.find(r => r.name === 'Large-Scale Operations Processing');
    if (largeScaleResult && largeScaleResult.hz < 5) {
      console.log('📊 Large-scale operations need optimization - consider data partitioning');
    }
    
    const concurrentResult = results.find(r => r.name === 'Concurrent Operations Handling');
    if (concurrentResult && concurrentResult.hz < 30) {
      console.log('🔄 Concurrent operations handling needs improvement - consider worker pools');
    }
    
    console.log('\n🔧 Supabase-Specific Optimizations:');
    
    const authResult = results.find(r => r.name === 'Auth Operations Tracking');
    if (authResult && authResult.hz < 30) {
      console.log('🔐 Auth operations tracking could be optimized');
    }
    
    const summaryResult = results.find(r => r.name === 'Performance Summary Generation');
    if (summaryResult && summaryResult.hz < 10) {
      console.log('📋 Summary generation is slow - consider caching computed metrics');
    }
    
    console.log('\n✅ Supabase Agent benchmarks completed!');
    process.exit(0);
  })
  .run({ async: true }); 