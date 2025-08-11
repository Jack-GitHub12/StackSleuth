# @stacksleuth/vue-agent

Vue 3 performance tracking agent for StackSleuth.

## Installation

```bash
npm install @stacksleuth/vue-agent
```

## Quick Start

### Register the Plugin

```ts
import { createApp } from 'vue';
import { StackSleuthPlugin } from '@stacksleuth/vue-agent';
import App from './App.vue';

const app = createApp(App);

app.use(StackSleuthPlugin, {
  enabled: true,
  sampling: { rate: 1.0 },
  output: { console: true }
});

app.mount('#app');
```

### Use in Components

```ts
import { useStackSleuth } from '@stacksleuth/vue-agent';

export default {
  setup() {
    const { trace, tracedRef } = useStackSleuth();

    const count = tracedRef(0, 'counter');

    const fetchData = async () => {
      await trace('API Call', async () => {
        const res = await fetch('/api/data');
        return res.json();
      });
    };

    return { count, fetchData };
  }
};
```

## Features

- Automatic component render tracing
- Core Web Vitals (LCP, FID, CLS, TTFB, FCP)
- Resource loading tracking
- Traced refs and lifecycle helpers

## Links

- GitHub Repository: https://github.com/Jack-GitHub12/StackSleuth
- Documentation: https://github.com/Jack-GitHub12/StackSleuth#readme
- Issues: https://github.com/Jack-GitHub12/StackSleuth/issues


