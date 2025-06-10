"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitCommand = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
// Dynamic import for chalk to handle ESM compatibility
let chalk;
async function initChalk() {
    if (!chalk) {
        chalk = (await Promise.resolve().then(() => __importStar(require('chalk')))).default;
    }
    return chalk;
}
class InitCommand {
    async execute(options) {
        try {
            const c = await initChalk();
            console.log(c.blue('🚀 Initializing StackSleuth in your project...'));
            // Interactive setup if no options provided
            const config = await this.gatherConfig(options);
            // Create configuration files
            await this.createConfigFiles(config);
            // Create example integration code
            await this.createExampleCode(config);
            // Show setup instructions
            await this.showSetupInstructions(config);
        }
        catch (error) {
            const c = await initChalk();
            console.error(c.red('❌ Error during initialization:'), error.message);
            process.exit(1);
        }
    }
    async gatherConfig(options) {
        const questions = [];
        // Ask for framework if not provided
        if (!options.framework) {
            questions.push({
                type: 'list',
                name: 'framework',
                message: 'Which framework are you using?',
                choices: [
                    { name: 'Express.js (Backend)', value: 'express' },
                    { name: 'React (Frontend)', value: 'react' },
                    { name: 'Next.js (Full-stack)', value: 'nextjs' }
                ]
            });
        }
        // Ask for TypeScript if not specified
        if (options.typescript === undefined) {
            questions.push({
                type: 'confirm',
                name: 'typescript',
                message: 'Are you using TypeScript?',
                default: true
            });
        }
        const answers = await inquirer_1.default.prompt(questions);
        return {
            framework: options.framework || answers.framework,
            typescript: options.typescript !== undefined ? options.typescript : answers.typescript
        };
    }
    async createConfigFiles(config) {
        const c = await initChalk();
        // Create stacksleuth.config file
        const configContent = this.generateConfigFile(config);
        const configPath = config.typescript ? 'stacksleuth.config.ts' : 'stacksleuth.config.js';
        fs_1.default.writeFileSync(configPath, configContent);
        console.log(c.green(`✅ Created ${configPath}`));
        // Create .stacksleuthrc for CLI settings
        const cliConfig = {
            framework: config.framework,
            typescript: config.typescript,
            dashboard: {
                port: 3001,
                autoOpen: true
            },
            sampling: {
                rate: 1.0
            }
        };
        fs_1.default.writeFileSync('.stacksleuthrc', JSON.stringify(cliConfig, null, 2));
        console.log(c.green('✅ Created .stacksleuthrc'));
    }
    generateConfigFile(config) {
        const isTS = config.typescript;
        const importSyntax = isTS ?
            "import { StackSleuthConfig } from '@stacksleuth/core';" :
            "const { StackSleuthConfig } = require('@stacksleuth/core');";
        const exportSyntax = isTS ? 'export default' : 'module.exports =';
        const configType = isTS ? ': StackSleuthConfig' : '';
        return `${importSyntax}

${exportSyntax} {
  enabled: process.env.NODE_ENV !== 'production',
  sampling: {
    rate: ${config.framework === 'express' ? '0.1' : '1.0'}, // Lower sampling for backend
    maxTracesPerSecond: 100
  },
  filters: {
    excludeUrls: [
      /\\/health$/,
      /\\/metrics$/,
      /\\.(js|css|png|jpg|jpeg|gif|ico|svg)$/
    ],
    excludeComponents: [
      'DevTools',
      'HotReload'
    ],
    minDuration: 10 // Only track spans longer than 10ms
  },
  output: {
    console: true,
    dashboard: {
      enabled: true,
      port: 3001,
      host: 'localhost'
    }
  }
}${configType};
`;
    }
    async createExampleCode(config) {
        const exampleDir = 'examples/stacksleuth';
        // Create examples directory
        if (!fs_1.default.existsSync(exampleDir)) {
            fs_1.default.mkdirSync(exampleDir, { recursive: true });
        }
        // Generate framework-specific examples
        switch (config.framework) {
            case 'express':
                await this.createExpressExample(exampleDir, config.typescript);
                break;
            case 'react':
                await this.createReactExample(exampleDir, config.typescript);
                break;
            case 'nextjs':
                await this.createNextExample(exampleDir, config.typescript);
                break;
        }
    }
    async createExpressExample(dir, isTS) {
        const c = await initChalk();
        const ext = isTS ? 'ts' : 'js';
        const content = `${isTS ? "import express from 'express';" : "const express = require('express');"}
${isTS ? "import { createBackendAgent } from '@stacksleuth/backend-agent';" : "const { createBackendAgent } = require('@stacksleuth/backend-agent');"}
${isTS ? "import config from '../stacksleuth.config';" : "const config = require('../stacksleuth.config');"}

const app = express();

// Initialize StackSleuth backend agent
const agent = createBackendAgent(config);
agent.instrument(app);

// Example routes
app.get('/api/users', async (req, res) => {
  // Simulate database query
  const users = await agent.trace('db:getUsers', async () => {
    // Your database logic here
    await new Promise(resolve => setTimeout(resolve, 100));
    return [{ id: 1, name: 'John Doe' }];
  });
  
  res.json(users);
});

app.get('/api/slow-endpoint', async (req, res) => {
  // This will be flagged as a slow operation
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({ message: 'This was slow!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📊 StackSleuth dashboard: http://localhost:3001\`);
});
`;
        fs_1.default.writeFileSync(path_1.default.join(dir, `express-example.${ext}`), content);
        console.log(c.green(`✅ Created ${dir}/express-example.${ext}`));
    }
    async createReactExample(dir, isTS) {
        const c = await initChalk();
        const ext = isTS ? 'tsx' : 'jsx';
        const content = `${isTS ? "import React, { useEffect, useState } from 'react';" : "import React, { useEffect, useState } from 'react';"}
${isTS ? "import { StackSleuthProvider, useTrace } from '@stacksleuth/frontend-agent';" : "import { StackSleuthProvider, useTrace } from '@stacksleuth/frontend-agent';"}

// Wrap your app with StackSleuthProvider
function App() {
  return (
    <StackSleuthProvider>
      <UserList />
    </StackSleuthProvider>
  );
}

// Example component with performance tracking
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { trace } = useTrace();

  const fetchUsers = async () => {
    setLoading(true);
    
    // Trace API calls
    const userData = await trace('api:fetchUsers', async () => {
      const response = await fetch('/api/users');
      return response.json();
    });
    
    setUsers(userData);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // This component will be automatically tracked for render performance
  return (
    <div>
      <h1>Users</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
      <button onClick={fetchUsers}>Refresh</button>
    </div>
  );
}

export default App;
`;
        fs_1.default.writeFileSync(path_1.default.join(dir, `react-example.${ext}`), content);
        console.log(c.green(`✅ Created ${dir}/react-example.${ext}`));
    }
    async createNextExample(dir, isTS) {
        const c = await initChalk();
        const ext = isTS ? 'ts' : 'js';
        // API route example
        const apiContent = `${isTS ? "import type { NextApiRequest, NextApiResponse } from 'next';" : ""}
${isTS ? "import { createBackendAgent } from '@stacksleuth/backend-agent';" : "const { createBackendAgent } = require('@stacksleuth/backend-agent');"}

const agent = createBackendAgent();

export default async function handler(
  req${isTS ? ': NextApiRequest' : ''},
  res${isTS ? ': NextApiResponse' : ''}
) {
  // Auto-trace API routes
  return agent.traceHandler(async () => {
    if (req.method === 'GET') {
      // Simulate slow database query
      const data = await agent.trace('db:getData', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { message: 'Hello from Next.js API!' };
      });
      
      res.status(200).json(data);
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(\`Method \${req.method} Not Allowed\`);
    }
  })(req, res);
}
`;
        // Page component example
        const pageContent = `${isTS ? "import type { GetServerSideProps } from 'next';" : ""}
${isTS ? "import { StackSleuthProvider } from '@stacksleuth/frontend-agent';" : "import { StackSleuthProvider } from '@stacksleuth/frontend-agent';"}

${isTS ? 'interface Props { data: any; }' : ''}

export default function Home({ data }${isTS ? ': Props' : ''}) {
  return (
    <StackSleuthProvider>
      <main>
        <h1>Next.js with StackSleuth</h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </main>
    </StackSleuthProvider>
  );
}

export const getServerSideProps${isTS ? ': GetServerSideProps' : ''} = async () => {
  // This will be automatically traced
  const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/hello\`);
  const data = await res.json();

  return { props: { data } };
};
`;
        fs_1.default.writeFileSync(path_1.default.join(dir, `api-route.${ext}`), apiContent);
        fs_1.default.writeFileSync(path_1.default.join(dir, `page-example.${ext}`), pageContent);
        console.log(c.green(`✅ Created ${dir}/api-route.${ext}`));
        console.log(c.green(`✅ Created ${dir}/page-example.${ext}`));
    }
    async showSetupInstructions(config) {
        const c = await initChalk();
        console.log(c.bold('\n🎉 StackSleuth initialization complete!'));
        console.log(c.gray('─'.repeat(50)));
        console.log(c.cyan('\n📋 Next steps:'));
        console.log('1. Install the required packages:');
        const packages = ['@stacksleuth/core'];
        switch (config.framework) {
            case 'express':
                packages.push('@stacksleuth/backend-agent');
                break;
            case 'react':
                packages.push('@stacksleuth/frontend-agent');
                break;
            case 'nextjs':
                packages.push('@stacksleuth/backend-agent', '@stacksleuth/frontend-agent');
                break;
        }
        console.log(c.gray(`   npm install ${packages.join(' ')}`));
        console.log('\n2. Check the example code in:');
        console.log(c.gray('   examples/stacksleuth/'));
        console.log('\n3. Start profiling your application:');
        console.log(c.gray('   sleuth watch'));
        console.log('\n4. View the dashboard at:');
        console.log(c.gray('   http://localhost:3001'));
        console.log(c.yellow('\n💡 Tips:'));
        console.log('• Adjust sampling rates in stacksleuth.config for production');
        console.log('• Use filters to exclude noise from your traces');
        console.log('• Check the dashboard for real-time performance insights');
        console.log(c.green('\n✨ Happy profiling!'));
    }
}
exports.InitCommand = InitCommand;
//# sourceMappingURL=init.js.map