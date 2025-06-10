#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Enhanced package configurations with comprehensive examples
const packageExamples = {
  'core': {
    examples: [
      {
        title: 'Basic Profiling',
        code: `import { ProfilerCore } from '@stacksleuth/core';

const profiler = new ProfilerCore({
  enabled: true,
  sampleRate: 0.1
});

profiler.startProfiling();

// Profile a function
async function processData() {
  const span = profiler.startSpan('data-processing');
  
  try {
    // Your business logic
    const result = await heavyDataProcessing();
    span.setStatus('success');
    return result;
  } catch (error) {
    span.setStatus('error', error.message);
    throw error;
  } finally {
    span.end();
  }
}

// Get performance insights
const metrics = profiler.getMetrics();
console.log('Performance Summary:', metrics);`
      },
      {
        title: 'Custom Metrics',
        code: `// Track business-specific metrics
profiler.recordMetric('orders.processed', 1, {
  region: 'us-east-1',
  paymentMethod: 'credit-card',
  value: 99.99
});

profiler.recordMetric('users.active', 1, {
  plan: 'premium',
  source: 'mobile-app'
});`
      }
    ]
  },

  'backend-agent': {
    examples: [
      {
        title: 'Express.js Integration',
        code: `import express from 'express';
import { BackendAgent } from '@stacksleuth/backend-agent';

const app = express();
const agent = new BackendAgent({
  enabled: true,
  projectId: 'your-project-id',
  sampleRate: 0.1
});

// Start monitoring
agent.startMonitoring();

// Add middleware (must be first)
app.use(agent.middleware());

app.get('/api/users', async (req, res) => {
  const users = await getUsersFromDatabase();
  res.json(users);
});

app.listen(3000, () => {
  console.log('Server running with StackSleuth monitoring');
});`
      },
      {
        title: 'Custom Error Tracking',
        code: `// Track custom errors
app.use((error, req, res, next) => {
  agent.recordError(error, {
    userId: req.user?.id,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ error: 'Internal server error' });
});`
      }
    ]
  },

  'vue-agent': {
    examples: [
      {
        title: 'Vue 3 Setup',
        code: `import { createApp } from 'vue';
import { VueAgent } from '@stacksleuth/vue-agent';
import App from './App.vue';

const app = createApp(App);

// Initialize Vue agent
const agent = new VueAgent({
  enabled: true,
  trackComponents: true,
  trackVuex: true,
  trackRouter: true
});

// Install as Vue plugin
app.use(agent);

// Start monitoring
agent.startMonitoring();

app.mount('#app');`
      },
      {
        title: 'Component Performance Tracking',
        code: `// In your Vue component
export default {
  name: 'UserDashboard',
  async mounted() {
    const span = this.$stacksleuth.startSpan('user-dashboard-load');
    
    try {
      await this.loadUserData();
      await this.loadDashboardMetrics();
      span.setStatus('success');
    } catch (error) {
      span.setStatus('error', error.message);
    } finally {
      span.end();
    }
  },
  methods: {
    async loadUserData() {
      // Track specific operations
      this.$stacksleuth.recordMetric('dashboard.user_data_loaded', 1);
    }
  }
}`
      }
    ]
  },

  'django-agent': {
    examples: [
      {
        title: 'Django Settings',
        code: `# settings.py
INSTALLED_APPS = [
    # ... your apps
    'stacksleuth.django',
]

MIDDLEWARE = [
    'stacksleuth.django.middleware.StackSleuthMiddleware',
    # ... your middleware
]

STACKSLEUTH = {
    'ENABLED': True,
    'PROJECT_ID': 'your-project-id',
    'API_KEY': 'your-api-key',
    'SAMPLE_RATE': 0.1,
    'MONITOR_DATABASE': True,
    'MONITOR_TEMPLATES': True,
}`
      },
      {
        title: 'View Performance Tracking',
        code: `# views.py
from stacksleuth.django import track_performance
from django.http import JsonResponse

@track_performance('user-list-view')
def user_list(request):
    users = User.objects.select_related('profile').all()
    
    # Track business metrics
    track_metric('users.listed', len(users), {
        'request_method': request.method,
        'user_authenticated': request.user.is_authenticated
    })
    
    return JsonResponse({'users': list(users.values())})`
      }
    ]
  },

  'redis-agent': {
    examples: [
      {
        title: 'Redis Monitoring Setup',
        code: `import Redis from 'ioredis';
import { RedisAgent } from '@stacksleuth/redis-agent';

// Initialize Redis client
const redis = new Redis({
  host: 'localhost',
  port: 6379
});

// Initialize Redis agent
const agent = new RedisAgent({
  enabled: true,
  monitorCommands: true,
  trackMemory: true,
  slowQueryThreshold: 100
});

// Start monitoring
agent.startMonitoring();

// Instrument Redis client
agent.instrumentClient(redis);

// Your Redis operations are now monitored
await redis.set('user:123', JSON.stringify(userData));
const user = await redis.get('user:123');`
      },
      {
        title: 'Cache Performance Tracking',
        code: `// Track cache hit/miss rates
class CacheService {
  async get(key) {
    const value = await redis.get(key);
    
    // Track cache metrics
    agent.recordMetric(value ? 'cache.hit' : 'cache.miss', 1, {
      keyPattern: key.split(':')[0]
    });
    
    return value;
  }
  
  async set(key, value, ttl = 3600) {
    await redis.setex(key, ttl, value);
    
    agent.recordMetric('cache.set', 1, {
      ttl,
      keyPattern: key.split(':')[0]
    });
  }
}`
      }
    ]
  }
};

function updateReadmeWithExamples(packagePath, packageName) {
  const readmePath = path.join(packagePath, 'README.md');
  
  if (!fs.existsSync(readmePath)) {
    console.log(`⚠️  README not found: ${packageName}`);
    return;
  }

  try {
    let content = fs.readFileSync(readmePath, 'utf8');
    
    // Replace placeholder logo with real logo
    content = content.replace(
      /https:\/\/via\.placeholder\.com\/200x80\/4A90E2\/FFFFFF\?text=[^)]+/g,
      '../../assets/logo.svg'
    );

    // Add comprehensive examples if we have them for this package
    if (packageExamples[packageName]) {
      const examples = packageExamples[packageName].examples;
      
      // Find the Quick Start section and enhance it
      if (content.includes('## 🏁 Quick Start')) {
        let examplesSection = '\n\n## 📖 Comprehensive Examples\n\n';
        
        examples.forEach((example, index) => {
          examplesSection += `### ${example.title}\n\n`;
          examplesSection += '```typescript\n';
          examplesSection += example.code;
          examplesSection += '\n```\n\n';
        });

        // Add real-world usage section
        examplesSection += `## 🎯 Real-World Usage\n\n`;
        examplesSection += `### Production Configuration\n\n`;
        examplesSection += '```typescript\n';
        examplesSection += `const agent = new ${toPascalCase(packageName.replace('-agent', 'Agent'))}({\n`;
        examplesSection += `  enabled: process.env.NODE_ENV === 'production',\n`;
        examplesSection += `  projectId: process.env.STACKSLEUTH_PROJECT_ID,\n`;
        examplesSection += `  apiKey: process.env.STACKSLEUTH_API_KEY,\n`;
        examplesSection += `  sampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,\n`;
        examplesSection += `  bufferSize: 1000,\n`;
        examplesSection += `  flushInterval: 10000\n`;
        examplesSection += `});\n`;
        examplesSection += '```\n\n';

        // Add monitoring best practices
        examplesSection += `### Monitoring Best Practices\n\n`;
        examplesSection += `- **Sampling Rate**: Use lower sampling rates (1-5%) in production\n`;
        examplesSection += `- **Buffer Management**: Configure appropriate buffer sizes for your traffic\n`;
        examplesSection += `- **Error Handling**: Always include error context in your monitoring\n`;
        examplesSection += `- **Security**: Never log sensitive data like passwords or API keys\n`;
        examplesSection += `- **Performance**: Monitor the monitoring - track agent overhead\n\n`;

        // Insert examples after Quick Start section
        const quickStartEnd = content.indexOf('\n## ', content.indexOf('## 🏁 Quick Start') + 1);
        if (quickStartEnd !== -1) {
          content = content.slice(0, quickStartEnd) + examplesSection + content.slice(quickStartEnd);
        } else {
          content += examplesSection;
        }
      }
    }

    // Enhance the installation section with multiple package managers
    content = content.replace(
      /## 📦 Installation\n\n```bash\nnpm install @stacksleuth\/[^`]+```/,
      `## 📦 Installation\n\n\`\`\`bash\n# npm\nnpm install @stacksleuth/${packageName}\n\n# yarn\nyarn add @stacksleuth/${packageName}\n\n# pnpm\npnpm add @stacksleuth/${packageName}\n\`\`\``
    );

    // Add troubleshooting section if not present
    if (!content.includes('## 🛠️ Troubleshooting')) {
      const troubleshootingSection = `\n## 🛠️ Troubleshooting\n\n### Common Issues\n\n**Agent Not Starting**\n\`\`\`typescript\n// Enable debug mode\nconst agent = new ${toPascalCase(packageName.replace('-agent', 'Agent'))}({\n  enabled: true,\n  debug: true\n});\n\`\`\`\n\n**High Memory Usage**\n\`\`\`typescript\n// Optimize memory usage\nconst agent = new ${toPascalCase(packageName.replace('-agent', 'Agent'))}({\n  bufferSize: 500,\n  flushInterval: 5000,\n  sampleRate: 0.01\n});\n\`\`\`\n\n**Missing Metrics**\n- Check that the agent is enabled\n- Verify your API key and project ID\n- Ensure sampling rate allows data through\n- Check network connectivity to StackSleuth API\n\n### Debug Mode\n\n\`\`\`bash\nDEBUG=stacksleuth:* node your-app.js\n\`\`\`\n\n`;
      
      // Insert before Resources section
      const resourcesIndex = content.lastIndexOf('## 📚 Resources');
      if (resourcesIndex !== -1) {
        content = content.slice(0, resourcesIndex) + troubleshootingSection + content.slice(resourcesIndex);
      }
    }

    fs.writeFileSync(readmePath, content);
    console.log(`✅ Enhanced README for ${packageName} with examples and real logo`);
    
  } catch (error) {
    console.error(`❌ Failed to update ${packageName}:`, error.message);
  }
}

function toPascalCase(str) {
  return str.replace(/(^\w|-\w)/g, (match) => match.replace('-', '').toUpperCase());
}

async function updateAllReadmes() {
  console.log('🚀 Updating all README files with comprehensive examples and real logo...\n');

  const packagesDir = path.join(__dirname, '..', 'packages');
  const packages = fs.readdirSync(packagesDir);

  packages.forEach(packageName => {
    const packagePath = path.join(packagesDir, packageName);
    if (fs.statSync(packagePath).isDirectory()) {
      updateReadmeWithExamples(packagePath, packageName);
    }
  });

  console.log('\n✨ All README files updated with comprehensive examples!');
  console.log('📚 Enhanced with real logo, detailed examples, and best practices');
  console.log('🔗 Ready for professional NPM publication');
}

if (require.main === module) {
  updateAllReadmes().catch(console.error);
}

module.exports = { updateAllReadmes }; 