#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Comprehensive StackSleuth Test Suite');
console.log('================================================\n');

// Test configuration
const testConfig = {
  timeout: 120000, // 2 minutes per test
  verbose: true,
  enableBenchmarks: true,
  enableIntegrationTests: true,
  enableE2ETests: true
};

// Track results
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  details: [],
  failures: [],
  performance: {}
};

/**
 * Execute command with timeout and error handling
 */
async function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || testConfig.timeout;
    const cwd = options.cwd || process.cwd();
    
    console.log(`\n🔄 Executing: ${command}`);
    console.log(`📁 Working directory: ${cwd}`);
    
    const startTime = Date.now();
    const child = spawn('sh', ['-c', command], { 
      cwd, 
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (testConfig.verbose) {
        process.stdout.write(data);
      }
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (testConfig.verbose) {
        process.stderr.write(data);
      }
    });
    
    const timeoutHandle = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
    }, timeout);
    
    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        resolve({ 
          success: true, 
          code, 
          stdout, 
          stderr, 
          duration,
          command 
        });
      } else {
        reject(new Error(`Command failed with code ${code}: ${command}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`Failed to execute command: ${command}\nError: ${error.message}`));
    });
  });
}

/**
 * Check if package exists and has proper structure
 */
function validatePackage(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  const srcPath = path.join(packagePath, 'src');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in ${packagePath}`);
  }
  
  if (!fs.existsSync(srcPath)) {
    throw new Error(`src directory not found in ${packagePath}`);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts || !packageJson.scripts.build) {
    throw new Error(`Build script not found in ${packagePath}/package.json`);
  }
  
  return packageJson;
}

/**
 * Run tests for a specific package
 */
async function runPackageTests(packageName, packagePath) {
  console.log(`\n🔬 Testing Package: ${packageName}`);
  console.log(`📂 Path: ${packagePath}`);
  console.log('─'.repeat(50));
  
  const testResult = {
    package: packageName,
    path: packagePath,
    tests: [],
    buildTime: 0,
    totalTime: 0,
    status: 'pending'
  };
  
  const packageStartTime = Date.now();
  
  try {
    // Validate package structure
    console.log('🔍 Validating package structure...');
    const packageJson = validatePackage(packagePath);
    console.log(`✅ Package structure valid (${packageJson.name}@${packageJson.version})`);
    
    // Build the package
    console.log('🔨 Building package...');
    const buildStart = Date.now();
    await executeCommand('npm run build', { cwd: packagePath });
    testResult.buildTime = Date.now() - buildStart;
    console.log(`✅ Build completed in ${testResult.buildTime}ms`);
    
    // Run unit tests if available
    if (packageJson.scripts.test) {
      console.log('🧪 Running unit tests...');
      try {
        const testResult = await executeCommand('npm test', { cwd: packagePath, timeout: 60000 });
        testResult.tests.push({
          type: 'unit',
          status: 'passed',
          duration: testResult.duration,
          output: testResult.stdout
        });
        console.log('✅ Unit tests passed');
      } catch (error) {
        testResult.tests.push({
          type: 'unit',
          status: 'failed',
          duration: 0,
          error: error.message
        });
        console.log('❌ Unit tests failed');
        testResults.failures.push({
          package: packageName,
          test: 'unit',
          error: error.message
        });
      }
    }
    
    // Run benchmarks if available and enabled
    if (testConfig.enableBenchmarks && packageJson.scripts.benchmark) {
      console.log('⚡ Running performance benchmarks...');
      try {
        const benchmarkResult = await executeCommand('npm run benchmark', { 
          cwd: packagePath, 
          timeout: 180000 
        });
        testResult.tests.push({
          type: 'benchmark',
          status: 'passed',
          duration: benchmarkResult.duration,
          output: benchmarkResult.stdout
        });
        
        // Extract performance metrics from output
        const performanceMatch = benchmarkResult.stdout.match(/Operations\/sec: ([\d,]+)/g);
        if (performanceMatch) {
          testResults.performance[packageName] = performanceMatch.map(match => 
            parseInt(match.replace(/[^\d]/g, ''))
          );
        }
        
        console.log('✅ Benchmarks completed');
      } catch (error) {
        testResult.tests.push({
          type: 'benchmark',
          status: 'failed',
          duration: 0,
          error: error.message
        });
        console.log('⚠️  Benchmarks failed (non-critical)');
      }
    }
    
    // Type checking
    console.log('🔤 Running TypeScript type checking...');
    try {
      await executeCommand('npx tsc --noEmit', { cwd: packagePath });
      testResult.tests.push({
        type: 'typecheck',
        status: 'passed',
        duration: 0
      });
      console.log('✅ Type checking passed');
    } catch (error) {
      testResult.tests.push({
        type: 'typecheck',
        status: 'failed',
        duration: 0,
        error: error.message
      });
      console.log('❌ Type checking failed');
      testResults.failures.push({
        package: packageName,
        test: 'typecheck',
        error: error.message
      });
    }
    
    // Linting
    if (packageJson.scripts.lint) {
      console.log('📏 Running linter...');
      try {
        await executeCommand('npm run lint', { cwd: packagePath });
        testResult.tests.push({
          type: 'lint',
          status: 'passed',
          duration: 0
        });
        console.log('✅ Linting passed');
      } catch (error) {
        testResult.tests.push({
          type: 'lint',
          status: 'failed',
          duration: 0,
          error: error.message
        });
        console.log('⚠️  Linting failed (non-critical)');
      }
    }
    
    testResult.totalTime = Date.now() - packageStartTime;
    testResult.status = testResult.tests.some(t => t.status === 'failed') ? 'failed' : 'passed';
    
    if (testResult.status === 'passed') {
      testResults.passed++;
      console.log(`✅ Package ${packageName} tests PASSED (${testResult.totalTime}ms)`);
    } else {
      testResults.failed++;
      console.log(`❌ Package ${packageName} tests FAILED (${testResult.totalTime}ms)`);
    }
    
  } catch (error) {
    testResult.status = 'failed';
    testResult.totalTime = Date.now() - packageStartTime;
    testResult.error = error.message;
    testResults.failed++;
    testResults.failures.push({
      package: packageName,
      test: 'general',
      error: error.message
    });
    console.log(`❌ Package ${packageName} tests FAILED: ${error.message}`);
  }
  
  testResults.total++;
  testResults.details.push(testResult);
}

/**
 * Run integration tests
 */
async function runIntegrationTests() {
  if (!testConfig.enableIntegrationTests) {
    console.log('⏭️  Skipping integration tests (disabled)');
    return;
  }
  
  console.log('\n🔗 Running Integration Tests');
  console.log('─'.repeat(50));
  
  const integrationTests = [
    {
      name: 'Core + Backend Agent Integration',
      command: 'node -e "const {ProfilerCore} = require(\'./packages/core/dist\'); const {BackendAgent} = require(\'./packages/backend-agent/dist\'); console.log(\'✅ Integration test passed\');"'
    },
    {
      name: 'Core + Frontend Agent Integration', 
      command: 'node -e "const {ProfilerCore} = require(\'./packages/core/dist\'); const {FrontendAgent} = require(\'./packages/frontend-agent/dist\'); console.log(\'✅ Integration test passed\');"'
    },
    {
      name: 'Core + Database Agents Integration',
      command: 'node -e "const {ProfilerCore} = require(\'./packages/core/dist\'); const {RedisAgent} = require(\'./packages/redis-agent/dist\'); const {SupabaseAgent} = require(\'./packages/supabase-agent/dist\'); console.log(\'✅ Integration test passed\');"'
    }
  ];
  
  for (const test of integrationTests) {
    console.log(`🔗 Running: ${test.name}`);
    try {
      await executeCommand(test.command, { timeout: 30000 });
      console.log(`✅ ${test.name} passed`);
      testResults.passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed: ${error.message}`);
      testResults.failed++;
      testResults.failures.push({
        package: 'integration',
        test: test.name,
        error: error.message
      });
    }
    testResults.total++;
  }
}

/**
 * Run end-to-end tests
 */
async function runE2ETests() {
  if (!testConfig.enableE2ETests) {
    console.log('⏭️  Skipping E2E tests (disabled)');
    return;
  }
  
  console.log('\n🎯 Running End-to-End Tests');
  console.log('─'.repeat(50));
  
  // Test full CLI workflow
  console.log('🖥️  Testing CLI workflow...');
  try {
    await executeCommand('npm run sleuth -- --version', { timeout: 30000 });
    console.log('✅ CLI workflow test passed');
    testResults.passed++;
  } catch (error) {
    console.log(`❌ CLI workflow test failed: ${error.message}`);
    testResults.failed++;
    testResults.failures.push({
      package: 'e2e',
      test: 'CLI workflow',
      error: error.message
    });
  }
  testResults.total++;
}

/**
 * Generate detailed test report
 */
function generateTestReport() {
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  const totalTime = testResults.details.reduce((sum, pkg) => sum + pkg.totalTime, 0);
  
  console.log(`\n📈 Overall Results:`);
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed} (${successRate}%)`);
  console.log(`   Failed: ${testResults.failed}`);
  console.log(`   Skipped: ${testResults.skipped}`);
  console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  
  // Package-by-package results
  console.log(`\n📦 Package Results:`);
  testResults.details.forEach(pkg => {
    const status = pkg.status === 'passed' ? '✅' : '❌';
    const buildTime = (pkg.buildTime / 1000).toFixed(2);
    const totalTime = (pkg.totalTime / 1000).toFixed(2);
    console.log(`   ${status} ${pkg.package} (build: ${buildTime}s, total: ${totalTime}s)`);
    
    if (pkg.tests.length > 0) {
      pkg.tests.forEach(test => {
        const testStatus = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
        console.log(`      ${testStatus} ${test.type}`);
      });
    }
  });
  
  // Performance results
  if (Object.keys(testResults.performance).length > 0) {
    console.log(`\n⚡ Performance Results:`);
    Object.entries(testResults.performance).forEach(([pkg, metrics]) => {
      const avgOps = metrics.reduce((sum, ops) => sum + ops, 0) / metrics.length;
      console.log(`   📊 ${pkg}: ${avgOps.toLocaleString()} ops/sec average`);
    });
  }
  
  // Failures
  if (testResults.failures.length > 0) {
    console.log(`\n🚨 Failure Details:`);
    testResults.failures.forEach((failure, index) => {
      console.log(`\n   ${index + 1}. ${failure.package} - ${failure.test}`);
      console.log(`      Error: ${failure.error.split('\n')[0]}`);
    });
  }
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  
  if (testResults.failed > 0) {
    console.log(`   🔧 Fix ${testResults.failed} failing tests before publishing`);
  }
  
  const slowPackages = testResults.details.filter(pkg => pkg.buildTime > 10000);
  if (slowPackages.length > 0) {
    console.log(`   ⚡ Optimize build time for: ${slowPackages.map(p => p.package).join(', ')}`);
  }
  
  if (successRate < 90) {
    console.log(`   ⚠️  Success rate (${successRate}%) is below recommended 90%`);
  } else {
    console.log(`   ✅ Excellent success rate (${successRate}%)`);
  }
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

/**
 * Main test runner
 */
async function runAllTests() {
  const startTime = Date.now();
  
  try {
    // Ensure we're in the right directory
    const packageDir = path.join(process.cwd(), 'packages');
    if (!fs.existsSync(packageDir)) {
      throw new Error('packages directory not found. Please run from repository root.');
    }
    
    // Get all packages
    const packages = fs.readdirSync(packageDir)
      .filter(dir => {
        const packagePath = path.join(packageDir, dir);
        return fs.statSync(packagePath).isDirectory() && 
               fs.existsSync(path.join(packagePath, 'package.json'));
      })
      .map(dir => ({
        name: dir,
        path: path.join(packageDir, dir)
      }));
    
    console.log(`Found ${packages.length} packages to test:`);
    packages.forEach(pkg => console.log(`  📦 ${pkg.name}`));
    console.log('');
    
    // Test each package
    for (const pkg of packages) {
      await runPackageTests(pkg.name, pkg.path);
    }
    
    // Run integration tests
    await runIntegrationTests();
    
    // Run E2E tests
    await runE2ETests();
    
  } catch (error) {
    console.error(`❌ Test suite failed: ${error.message}`);
    testResults.failed++;
    testResults.total++;
    testResults.failures.push({
      package: 'test-runner',
      test: 'setup',
      error: error.message
    });
  }
  
  const totalTime = Date.now() - startTime;
  
  // Generate final report
  generateTestReport();
  
  console.log(`\n⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
  
  // Exit with appropriate code
  const exitCode = testResults.failed > 0 ? 1 : 0;
  console.log(`\n${exitCode === 0 ? '🎉' : '💥'} Test suite ${exitCode === 0 ? 'COMPLETED SUCCESSFULLY' : 'FAILED'}`);
  
  process.exit(exitCode);
}

// Run the test suite
runAllTests().catch((error) => {
  console.error('❌ Fatal error in test suite:', error);
  process.exit(1);
}); 