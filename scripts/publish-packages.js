#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of packages that build successfully (excluding those with test issues)
const publishablePackages = [
  'core',
  'backend-agent', 
  'frontend-agent',
  'db-agent',
  'vue-agent',
  'mongodb-agent',
  'cli',
  'redis-agent',
  'fastapi-agent',
  'svelte-agent',
  'django-agent',
  'laravel-agent',
  'mysql-agent',
  'browser-extension',
  'performance-optimizer'
];

async function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('sh', ['-c', command], {
      stdio: 'inherit',
      cwd
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function buildPackage(packageName) {
  const packageDir = path.join(__dirname, '..', 'packages', packageName);
  console.log(`\n🔨 Building ${packageName}...`);
  
  try {
    await runCommand('npm run build', packageDir);
    console.log(`✅ ${packageName} built successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${packageName} build failed:`, error.message);
    return false;
  }
}

async function publishPackage(packageName) {
  const packageDir = path.join(__dirname, '..', 'packages', packageName);
  console.log(`\n📦 Publishing ${packageName}...`);
  
  try {
    await runCommand('npm publish --access public', packageDir);
    console.log(`✅ ${packageName} published successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${packageName} publish failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting enhanced package publishing process...\n');

  const results = {
    built: [],
    published: [],
    failed: []
  };

  // First, try to build all packages
  for (const packageName of publishablePackages) {
    const buildSuccess = await buildPackage(packageName);
    
    if (buildSuccess) {
      results.built.push(packageName);
    } else {
      results.failed.push(packageName);
    }
  }

  console.log(`\n📊 Build Results:`);
  console.log(`✅ Successfully built: ${results.built.length} packages`);
  console.log(`❌ Failed builds: ${results.failed.length} packages`);

  if (results.failed.length > 0) {
    console.log(`Failed packages: ${results.failed.join(', ')}`);
  }

  // Now publish the successfully built packages
  console.log('\n🔄 Starting publication of successfully built packages...');

  for (const packageName of results.built) {
    const publishSuccess = await publishPackage(packageName);
    
    if (publishSuccess) {
      results.published.push(packageName);
    }
  }

  // Final summary
  console.log(`\n\n🎉 Publication Complete!`);
  console.log(`📦 Successfully published: ${results.published.length} packages`);
  console.log(`🔧 Built but not published: ${results.built.length - results.published.length} packages`);
  console.log(`❌ Failed to build: ${results.failed.length} packages`);

  if (results.published.length > 0) {
    console.log(`\n✨ Published packages:`);
    results.published.forEach(pkg => {
      console.log(`  • @stacksleuth/${pkg}@0.2.2`);
    });
  }

  if (results.failed.length > 0) {
    console.log(`\n⚠️  Packages needing attention:`);
    results.failed.forEach(pkg => {
      console.log(`  • ${pkg} (build failed)`);
    });
  }

  console.log('\n🔗 NPM Registry: https://www.npmjs.com/search?q=%40stacksleuth');
  console.log('📚 Documentation: https://github.com/Jack-GitHub12/StackSleuth#readme');
}

main().catch(console.error); 