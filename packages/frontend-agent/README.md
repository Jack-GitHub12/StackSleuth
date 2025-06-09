# @stacksleuth/frontend-agent

Frontend performance tracking agent for React applications.

## Installation

```bash
npm install @stacksleuth/frontend-agent
```

**Peer Dependencies:**
- React 16.8+ (hooks support required)
- React DOM 16.8+

## Quick Start

### Wrap Your App

```jsx
import React from 'react';
import { StackSleuthProvider } from '@stacksleuth/frontend-agent';
import App from './App';

function Root() {
  return (
    <StackSleuthProvider>
      <App />
    </StackSleuthProvider>
  );
}

export default Root;
```

### Manual Tracing with Hook

```jsx
import { useTrace } from '@stacksleuth/frontend-agent';

function UserProfile({ userId }) {
  const { trace } = useTrace();
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    // Trace API calls
    const userData = await trace('api:fetchUser', async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    });
    
    setUser(userData);
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

### Component Render Tracing

```jsx
import { withTracing } from '@stacksleuth/frontend-agent';

// Automatically trace component renders
const TracedComponent = withTracing(MyComponent, { name: 'MyComponent' });

function App() {
  return (
    <div>
      <TracedComponent />
    </div>
  );
}
```

## Configuration

```jsx
<StackSleuthProvider config={{
  enabled: process.env.NODE_ENV === 'development',
  sampling: { rate: 1.0 }, // 100% sampling in development
  filters: {
    excludeComponents: ['DevTools', 'HotReload'],
    minDuration: 10 // Only track operations >10ms
  },
  output: {
    console: true,
    dashboard: {
      enabled: true,
      port: 3001
    }
  }
}}>
  <App />
</StackSleuthProvider>
```

## Features

### Automatic Web Vitals Tracking

The frontend agent automatically monitors Core Web Vitals:

- **LCP (Largest Contentful Paint)** - Loading performance
- **FID (First Input Delay)** - Interactivity
- **CLS (Cumulative Layout Shift)** - Visual stability
- **TTFB (Time to First Byte)** - Server response time
- **FCP (First Contentful Paint)** - Perceived loading speed

### Component Performance Monitoring

```jsx
// Automatic render tracking with HOC
const OptimizedList = withTracing(UserList, { name: 'UserList' });

// Manual performance tracking
function SearchComponent() {
  const { trace } = useTrace();
  
  const handleSearch = async (query) => {
    await trace('search-operation', async () => {
      // This operation will be tracked
      const results = await searchAPI(query);
      setResults(results);
    });
  };

  return <input onChange={handleSearch} />;
}
```

### Resource Loading Tracking

Automatically tracks:
- **Script loading** - JavaScript bundle performance
- **Image loading** - Image optimization opportunities  
- **CSS loading** - Stylesheet performance
- **API requests** - Network request timing

### Real-time Performance Alerts

The agent detects and reports:
- **Slow components** (>100ms render time)
- **Large resource loads** (>1MB assets)
- **Memory leaks** (growing component tree)
- **Excessive re-renders** (component optimization opportunities)

## API Reference

### StackSleuthProvider

Provider component that enables performance tracking.

**Props:**
- `config?: Partial<StackSleuthConfig>` - Configuration options
- `children: ReactNode` - Your app components

### useTrace()

Hook for manual performance tracing.

**Returns:**
- `trace(name, operation)` - Trace an async operation
- `collector` - Access to the underlying trace collector

### withTracing(Component, options?)

Higher-order component for automatic render tracking.

**Parameters:**
- `Component` - React component to trace
- `options.name?` - Custom name for the component

## Performance Examples

### API Call Tracing

```jsx
function DataFetcher() {
  const { trace } = useTrace();
  const [data, setData] = useState([]);

  useEffect(() => {
    trace('fetch-initial-data', async () => {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    });
  }, []);

  return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>;
}
```

### Form Submission Tracking

```jsx
function ContactForm() {
  const { trace } = useTrace();

  const handleSubmit = async (formData) => {
    await trace('form-submission', async () => {
      await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Component Optimization

```jsx
// Before: Untraced component
function UserList({ users }) {
  return users.map(user => <UserCard key={user.id} user={user} />);
}

// After: Traced for performance monitoring
const TracedUserList = withTracing(UserList, { name: 'UserList' });

// Usage
<TracedUserList users={users} />
```

## Browser Compatibility

- **Modern browsers** with ES2020 support
- **Performance API** required for Web Vitals
- **Graceful degradation** in older browsers

## Performance Impact

- **<1ms** overhead per traced operation
- **Minimal memory footprint** (<100KB)
- **Intelligent sampling** to reduce load
- **Tree-shakeable** - only includes used features

## Links

- [GitHub Repository](https://github.com/Jack-GitHub12/StackSleuth)
- [Documentation](https://github.com/Jack-GitHub12/StackSleuth#readme)
- [Issues](https://github.com/Jack-GitHub12/StackSleuth/issues) 