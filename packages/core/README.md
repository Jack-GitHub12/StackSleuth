# @stacksleuth/core

Core types, utilities, and trace collection engine for StackSleuth.

## Installation

```bash
npm install @stacksleuth/core
```

## Usage

### Basic Trace Collection

```javascript
import { TraceCollector } from '@stacksleuth/core';

const collector = new TraceCollector({
  enabled: true,
  sampling: { rate: 1.0 },
  output: { console: true }
});

// Start a trace
const trace = collector.startTrace('My Operation');
if (trace) {
  const span = collector.startSpan(trace.id, 'Sub Operation', 'function_call');
  
  // Do work...
  
  collector.completeSpan(span.id);
  collector.completeTrace(trace.id);
}
```

### Configuration

```javascript
import { StackSleuthConfig } from '@stacksleuth/core';

const config: StackSleuthConfig = {
  enabled: true,
  sampling: {
    rate: 0.1, // Sample 10% of requests
    maxTracesPerSecond: 100
  },
  filters: {
    excludeUrls: [/\/health$/],
    minDuration: 10 // Only track spans >10ms
  },
  output: {
    console: true,
    dashboard: {
      enabled: true,
      port: 3001,
      host: 'localhost'
    }
  }
};
```

### Performance Utilities

```javascript
import { PerformanceUtils, Timer } from '@stacksleuth/core';

// High-resolution timing
const start = Timer.now();
// ... do work
const duration = Timer.since(start);

// Performance statistics
const durations = [100, 200, 150, 300, 120];
const stats = PerformanceUtils.calculateStats(durations);
console.log(stats); // { min, max, avg, p50, p95, p99, count }

// Format durations
console.log(PerformanceUtils.formatDuration(1234)); // "1.23s"
```

### Event Listening

```javascript
collector.on('trace:completed', (trace) => {
  console.log(`Trace completed: ${trace.name} (${trace.timing.duration}ms)`);
});

collector.on('performance:issue', (issue) => {
  console.log(`Performance issue: ${issue.message}`);
});
```

## API Reference

### TraceCollector

Main class for collecting and managing traces.

#### Methods

- `startTrace(name, metadata?)` - Start a new trace
- `completeTrace(traceId, status?)` - Complete a trace
- `startSpan(traceId, name, type, parentId?, metadata?)` - Start a span
- `completeSpan(spanId, status?, metadata?)` - Complete a span
- `addSpanError(spanId, error)` - Add an error to a span
- `getTrace(traceId)` - Get a trace by ID
- `getAllTraces()` - Get all traces
- `getStats()` - Get performance statistics

### Types

- `Trace` - Represents a complete request trace
- `Span` - Represents a unit of work within a trace
- `SpanType` - Enum of span types (HTTP_REQUEST, DB_QUERY, etc.)
- `TraceStatus` - Enum of trace statuses (PENDING, SUCCESS, ERROR)
- `StackSleuthConfig` - Configuration interface

### Utilities

- `Timer` - High-resolution timing utilities
- `IdGenerator` - Generate unique trace and span IDs
- `PerformanceUtils` - Performance calculation utilities
- `SamplingUtils` - Sampling and throttling utilities

## Links

- [GitHub Repository](https://github.com/Jack-GitHub12/StackSleuth)
- [Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)
- [Issues](https://github.com/Jack-GitHub12/StackSleuth/issues) 