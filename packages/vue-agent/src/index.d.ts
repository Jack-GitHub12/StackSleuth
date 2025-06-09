import { Plugin } from 'vue';
import { TraceCollector } from '@stacksleuth/core';
/**
 * Vue 3 plugin for StackSleuth
 */
export declare const StackSleuthPlugin: Plugin;
/**
 * Composable for using StackSleuth in Vue components
 */
export declare function useStackSleuth(): {
    collector: any;
    trace: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
    tracedRef: <T>(initialValue: T, name?: string) => any;
    traceLifecycle: (eventName: string) => void;
};
/**
 * Get the global collector instance
 */
export declare function getCollector(): TraceCollector | null;
export default StackSleuthPlugin;
//# sourceMappingURL=index.d.ts.map