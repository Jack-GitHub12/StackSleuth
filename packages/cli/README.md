# @stacksleuth/cli

Command-line interface for StackSleuth performance profiling tool.

## Installation

```bash
npm install -g @stacksleuth/cli
```

## Usage

### Initialize StackSleuth in your project

```bash
sleuth init
```

Interactive setup wizard that will:
- Generate configuration files
- Create example integration code
- Set up framework-specific templates

### Start real-time profiling

```bash
sleuth watch
```

Options:
- `--port <port>` - Dashboard port (default: 3001)
- `--sampling <rate>` - Sampling rate 0.0-1.0 (default: 1.0)
- `--no-dashboard` - Disable dashboard UI

### Generate performance reports

```bash
sleuth report --format json --output report.json
```

Options:
- `--format <format>` - Output format: json or csv (default: json)
- `--output <file>` - Output file path
- `--last <duration>` - Include traces from last duration (e.g., "5m", "1h")

### Show statistics

```bash
sleuth stats
```

## Dashboard Features

When you run `sleuth watch`, a real-time dashboard will be available at `http://localhost:3001` featuring:

- Live trace visualization
- Performance metrics (P50, P95, P99)
- Error tracking
- Performance issue detection with suggestions
- WebSocket real-time updates

## Configuration

The CLI reads configuration from:
- `stacksleuth.config.js` or `stacksleuth.config.ts`
- `.stacksleuthrc` (JSON format)

Example configuration:

```javascript
export default {
  enabled: process.env.NODE_ENV !== 'production',
  sampling: { rate: 0.1 },
  filters: {
    excludeUrls: [/\/health$/, /\.(js|css|png|jpg)$/],
    minDuration: 10
  },
  output: {
    console: true,
    dashboard: { enabled: true, port: 3001 }
  }
};
```

## Links

- [GitHub Repository](https://github.com/Jack-GitHub12/StackSleuth)
- [Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)
- [Issues](https://github.com/Jack-GitHub12/StackSleuth/issues) 