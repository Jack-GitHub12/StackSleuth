import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

interface InitOptions {
  framework?: 'react' | 'express' | 'nextjs';
  typescript?: boolean;
  yes?: boolean;
  nonInteractive?: boolean;
}

// Dynamic import for chalk to handle ESM compatibility
let chalk: any;

async function initChalk() {
  if (!chalk) {
    chalk = (await import('chalk')).default;
  }
  return chalk;
}

export class InitCommand {
  async execute(options: InitOptions): Promise<void> {
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

    } catch (error: any) {
      const c = await initChalk();
      console.error(c.red('❌ Error during initialization:'), error.message);
      process.exit(1);
    }
  }

  private async gatherConfig(options: InitOptions): Promise<InitOptions> {
    const questions = [];

    // Ask for framework if not provided
    if (!options.framework && !(options.yes || options.nonInteractive)) {
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
    if (options.typescript === undefined && !(options.yes || options.nonInteractive)) {
      questions.push({
        type: 'confirm',
        name: 'typescript',
        message: 'Are you using TypeScript?',
        default: true
      });
    }

    const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};
    
    return {
      framework: options.framework || (answers as any).framework || 'express',
      typescript: options.typescript !== undefined ? options.typescript : ((answers as any).typescript ?? true)
    };
  }

  private async createConfigFiles(config: InitOptions): Promise<void> {
    const c = await initChalk();
    // Create stacksleuth.config file
    const configContent = this.generateConfigFile(config);
    const configPath = config.typescript ? 'stacksleuth.config.ts' : 'stacksleuth.config.js';
    
    fs.writeFileSync(configPath, configContent);
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

    fs.writeFileSync('.stacksleuthrc', JSON.stringify(cliConfig, null, 2));
    console.log(c.green('✅ Created .stacksleuthrc'));
  }

  private generateConfigFile(config: InitOptions): string {
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

  private async createExampleCode(config: InitOptions): Promise<void> {
    const exampleDir = 'examples/stacksleuth';
    
    // Create examples directory
    if (!fs.existsSync(exampleDir)) {
      fs.mkdirSync(exampleDir, { recursive: true });
    }

    // Generate framework-specific examples
    switch (config.framework) {
      case 'express':
        await this.createExpressExample(exampleDir, !!config.typescript);
        break;
      case 'react':
        await this.createReactExample(exampleDir, !!config.typescript);
        break;
      case 'nextjs':
        await this.createNextExample(exampleDir, !!config.typescript);
        break;
    }
  }

  private async createExpressExample(dir: string, isTS: boolean): Promise<void> {
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

    fs.writeFileSync(path.join(dir, `express-example.${ext}`), content);
    console.log(c.green(`✅ Created ${dir}/express-example.${ext}`));
  }

  private async createReactExample(dir: string, isTS: boolean): Promise<void> {
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

    fs.writeFileSync(path.join(dir, `react-example.${ext}`), content);
    console.log(c.green(`✅ Created ${dir}/react-example.${ext}`));
  }

  private async createNextExample(dir: string, isTS: boolean): Promise<void> {
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

    fs.writeFileSync(path.join(dir, `api-route.${ext}`), apiContent);
    fs.writeFileSync(path.join(dir, `page-example.${ext}`), pageContent);
    
    console.log(c.green(`✅ Created ${dir}/api-route.${ext}`));
    console.log(c.green(`✅ Created ${dir}/page-example.${ext}`));
  }

  private async showSetupInstructions(config: InitOptions): Promise<void> {
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