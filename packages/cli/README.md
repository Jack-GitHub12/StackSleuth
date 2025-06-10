# @stacksleuth/cli

<div align="center">

![StackSleuth CLI](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=StackSleuth+CLI)

**Comprehensive Command-Line Interface for StackSleuth**

[![npm version](https://badge.fury.io/js/%40stacksleuth%2Fcli.svg)](https://badge.fury.io/js/%40stacksleuth%2Fcli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

</div>

## 🚀 What is StackSleuth CLI?

StackSleuth CLI is a powerful command-line interface that provides interactive dashboard, real-time monitoring, performance reports, CI/CD integration, and automated performance optimization recommendations. It's your one-stop tool for managing and monitoring application performance from the terminal.

## ✨ Key Features

- **📊 Interactive Dashboard**: Beautiful terminal-based performance dashboard
- **🔄 Real-time Monitoring**: Live performance metrics with auto-refresh
- **📈 Performance Reports**: Comprehensive performance analysis and reporting
- **🔧 CI/CD Integration**: Seamless integration with CI/CD pipelines
- **⚡ Performance Optimization**: Automated optimization recommendations
- **🎯 Custom Alerts**: Configurable performance alerts and notifications
- **📱 Multi-project Support**: Manage multiple projects from a single interface
- **🔍 Deep Analysis**: Detailed performance bottleneck analysis

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @stacksleuth/cli
```

```bash
yarn global add @stacksleuth/cli
```

```bash
pnpm add -g @stacksleuth/cli
```

### Local Installation

```bash
npm install @stacksleuth/cli
```

```bash
yarn add @stacksleuth/cli
```

## 🏁 Quick Start

### Initialize a New Project

```bash
# Initialize StackSleuth in your project
stacksleuth init

# Initialize with specific configuration
stacksleuth init --type=express --database=mongodb
```

### Start Real-time Monitoring

```bash
# Start the interactive dashboard
stacksleuth watch

# Watch specific metrics
stacksleuth watch --metrics=cpu,memory,response-time

# Watch with custom refresh interval
stacksleuth watch --interval=1000
```

### Generate Performance Reports

```bash
# Generate a comprehensive performance report
stacksleuth report

# Generate report for specific time range
stacksleuth report --from="2024-01-01" --to="2024-01-31"

# Export report to file
stacksleuth report --output=performance-report.html --format=html
```

### CI/CD Integration

```bash
# Run performance tests in CI/CD
stacksleuth test --threshold=95 --max-response-time=500ms

# Performance budget enforcement
stacksleuth budget --check --config=.stacksleuth/budget.json
```

## 📋 Available Commands

### `stacksleuth init`

Initialize StackSleuth monitoring in your project.

```bash
stacksleuth init [options]

Options:
  --type <type>           Project type (express, react, vue, django, etc.)
  --database <db>         Primary database (mongodb, redis, mysql, postgres)
  --config <path>         Custom configuration file path
  --template <template>   Use predefined template
  --interactive           Interactive setup wizard
```

### `stacksleuth watch`

Start real-time performance monitoring dashboard.

```bash
stacksleuth watch [options]

Options:
  --port <port>           Dashboard port (default: 3001)
  --host <host>           Dashboard host (default: localhost)
  --interval <ms>         Refresh interval in milliseconds (default: 2000)
  --metrics <list>        Comma-separated list of metrics to display
  --threshold <value>     Alert threshold for performance issues
  --silent               Run in background without UI
```

### `stacksleuth report`

Generate comprehensive performance reports.

```bash
stacksleuth report [options]

Options:
  --output <file>         Output file path
  --format <format>       Report format (html, json, pdf, markdown)
  --from <date>           Start date (YYYY-MM-DD)
  --to <date>             End date (YYYY-MM-DD)
  --metrics <list>        Specific metrics to include
  --template <template>   Custom report template
  --open                  Open report after generation
```

### `stacksleuth test`

Run performance tests and validations.

```bash
stacksleuth test [options]

Options:
  --threshold <value>     Performance score threshold (0-100)
  --max-response-time <ms> Maximum acceptable response time
  --max-memory <mb>       Maximum memory usage threshold
  --config <path>         Test configuration file
  --output <format>       Test result format (json, junit)
  --fail-fast            Stop on first test failure
```

### `stacksleuth optimize`

Get automated performance optimization recommendations.

```bash
stacksleuth optimize [options]

Options:
  --auto-apply           Automatically apply safe optimizations
  --category <category>  Focus on specific optimization category
  --output <file>        Save recommendations to file
  --format <format>      Output format (json, markdown)
  --interactive          Interactive optimization wizard
```

## 📊 Interactive Dashboard

The StackSleuth CLI provides a beautiful, real-time dashboard accessible via your browser:

```bash
stacksleuth watch --port=3001
```

Dashboard features:
- **Real-time Metrics**: Live CPU, memory, and response time graphs
- **Request Tracing**: Visual request flow and bottleneck identification
- **Performance Alerts**: Instant notifications for performance issues
- **Historical Data**: Performance trends and comparisons
- **Custom Widgets**: Configurable dashboard layout

## 🔧 Configuration

### Project Configuration (`.stacksleuthrc.json`)

```json
{
  "project": {
    "name": "My Application",
    "type": "express",
    "version": "1.0.0"
  },
  "monitoring": {
    "enabled": true,
    "sampleRate": 0.1,
    "realTime": true
  },
  "agents": {
    "backend": true,
    "frontend": false,
    "database": ["mongodb", "redis"]
  },
  "alerts": {
    "responseTime": "500ms",
    "memoryUsage": "80%",
    "errorRate": "5%"
  },
  "dashboard": {
    "port": 3001,
    "refreshInterval": 2000,
    "theme": "dark"
  },
  "reports": {
    "outputDir": "./reports",
    "format": "html",
    "includeMetrics": ["performance", "errors", "usage"]
  }
}
```

### Environment Variables

```bash
# StackSleuth configuration
export STACKSLEUTH_API_KEY="your-api-key"
export STACKSLEUTH_ENDPOINT="https://your-monitoring-endpoint.com"
export STACKSLEUTH_PROJECT_ID="project-123"
export STACKSLEUTH_ENV="production"

# Dashboard configuration
export STACKSLEUTH_DASHBOARD_PORT=3001
export STACKSLEUTH_DASHBOARD_HOST="0.0.0.0"
export STACKSLEUTH_DASHBOARD_THEME="dark"
```

## 📈 Performance Reports

### HTML Report Example

```bash
stacksleuth report --format=html --output=performance-report.html
```

Generated report includes:
- **Executive Summary**: High-level performance overview
- **Performance Metrics**: Detailed statistics and trends
- **Bottleneck Analysis**: Identified performance issues
- **Optimization Recommendations**: Actionable improvement suggestions
- **Comparative Analysis**: Period-over-period comparisons

### JSON Report for API Integration

```bash
stacksleuth report --format=json --output=performance-data.json
```

```json
{
  "summary": {
    "performanceScore": 87,
    "totalRequests": 10524,
    "averageResponseTime": 245,
    "errorRate": 0.03
  },
  "metrics": {
    "cpu": { "avg": 45.2, "peak": 89.1 },
    "memory": { "avg": 512, "peak": 1024 },
    "responseTime": { "p50": 180, "p95": 850, "p99": 1200 }
  },
  "bottlenecks": [
    {
      "type": "database",
      "description": "Slow MongoDB queries detected",
      "impact": "high",
      "recommendation": "Add index on user_id field"
    }
  ]
}
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Performance Testing
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install StackSleuth CLI
        run: npm install -g @stacksleuth/cli
      
      - name: Run Performance Tests
        run: |
          stacksleuth test \
            --threshold=90 \
            --max-response-time=500ms \
            --output=junit \
            --config=.stacksleuth/ci-config.json
      
      - name: Generate Performance Report
        run: |
          stacksleuth report \
            --format=html \
            --output=performance-report.html
      
      - name: Upload Performance Report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: performance-report.html
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Performance Testing') {
            steps {
                sh 'npm install -g @stacksleuth/cli'
                sh '''
                    stacksleuth test \
                        --threshold=85 \
                        --max-response-time=1000ms \
                        --fail-fast
                '''
            }
        }
        
        stage('Performance Report') {
            steps {
                sh '''
                    stacksleuth report \
                        --format=html \
                        --output=performance-report.html
                '''
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: '.',
                    reportFiles: 'performance-report.html',
                    reportName: 'Performance Report'
                ])
            }
        }
    }
}
```

## 🎯 Performance Optimization

### Automated Optimization

```bash
# Get optimization recommendations
stacksleuth optimize

# Apply safe optimizations automatically
stacksleuth optimize --auto-apply

# Focus on specific areas
stacksleuth optimize --category=database
stacksleuth optimize --category=memory
stacksleuth optimize --category=network
```

### Optimization Categories

- **Database Optimization**: Query optimization, indexing suggestions
- **Memory Management**: Memory leak detection, garbage collection tuning
- **Network Performance**: Request optimization, caching strategies
- **Code Performance**: Hot path optimization, algorithmic improvements
- **Infrastructure**: Resource allocation, scaling recommendations

## 📱 Multi-Project Management

```bash
# List all monitored projects
stacksleuth projects list

# Switch between projects
stacksleuth projects switch my-api

# Add new project
stacksleuth projects add my-frontend --type=react

# Compare projects
stacksleuth projects compare my-api my-frontend
```

## 🔍 Advanced Features

### Custom Dashboards

```bash
# Create custom dashboard
stacksleuth dashboard create --template=custom-api.json

# Share dashboard configuration
stacksleuth dashboard export --output=my-dashboard.json
stacksleuth dashboard import --config=my-dashboard.json
```

### Performance Budgets

```json
{
  "budgets": {
    "performance": {
      "responseTime": "< 500ms",
      "throughput": "> 1000 req/s",
      "errorRate": "< 1%"
    },
    "resources": {
      "cpu": "< 70%",
      "memory": "< 2GB",
      "diskIO": "< 100MB/s"
    }
  }
}
```

```bash
# Check performance budget
stacksleuth budget check
stacksleuth budget check --config=custom-budget.json
```

## 🛠️ Troubleshooting

### Common Issues

**CLI Not Found After Installation**
```bash
# Verify installation
npm list -g @stacksleuth/cli

# Reinstall if necessary
npm uninstall -g @stacksleuth/cli
npm install -g @stacksleuth/cli
```

**Dashboard Not Loading**
```bash
# Check if port is available
stacksleuth watch --port=3002

# Check firewall settings
stacksleuth watch --host=0.0.0.0
```

**Performance Data Missing**
```bash
# Verify agent configuration
stacksleuth init --interactive

# Check agent status
stacksleuth status
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=stacksleuth:* stacksleuth watch

# Verbose output
stacksleuth watch --verbose

# Log to file
stacksleuth watch --log-file=debug.log
```

## 📖 Examples

### Basic Express.js Setup

```bash
# Initialize in Express.js project
cd my-express-app
stacksleuth init --type=express

# Start monitoring
stacksleuth watch

# Generate daily report
stacksleuth report --from=yesterday --format=html
```

### Microservices Monitoring

```bash
# Monitor multiple services
stacksleuth projects add user-service --type=express --port=3001
stacksleuth projects add order-service --type=fastapi --port=3002
stacksleuth projects add notification-service --type=django --port=3003

# Combined dashboard
stacksleuth watch --projects=all
```

### Performance Testing Pipeline

```bash
# Run comprehensive performance test
stacksleuth test \
  --threshold=90 \
  --max-response-time=500ms \
  --max-memory=1GB \
  --config=.stacksleuth/perf-test.json

# Generate test report
stacksleuth report \
  --format=json \
  --output=test-results.json \
  --metrics=performance,errors
```

## 📚 Resources

- **[CLI Documentation](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/cli.md)**
- **[Configuration Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/configuration.md)**
- **[CI/CD Integration](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/cicd.md)**
- **[Performance Budgets](https://github.com/Jack-GitHub12/StackSleuth/blob/main/docs/budgets.md)**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Jack-GitHub12/StackSleuth/blob/main/CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/Jack-GitHub12/StackSleuth.git
cd StackSleuth
npm install
npm run build
```

### Testing CLI Changes

```bash
# Build and link locally
npm run build
npm link

# Test changes
stacksleuth --version
stacksleuth init --help
```

## 📄 License

MIT License - see the [LICENSE](https://github.com/Jack-GitHub12/StackSleuth/blob/main/LICENSE) file for details.

---

<div align="center">

**[Website](https://github.com/Jack-GitHub12/StackSleuth)** • 
**[Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)** • 
**[NPM Registry](https://www.npmjs.com/package/@stacksleuth/cli)** • 
**[GitHub](https://github.com/Jack-GitHub12/StackSleuth)**

Made with ⚡ by [StackSleuth](https://github.com/Jack-GitHub12/StackSleuth)

</div> 