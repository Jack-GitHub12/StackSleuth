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
    collector: TraceCollector;
    trace: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
    tracedRef: <T>(initialValue: T, name?: string) => [T] extends [import("vue").Ref<any, any>] ? import("@vue/shared").IfAny<T, import("vue").Ref<T, T>, T> : import("vue").Ref<import("vue").UnwrapRef<T>, T | import("vue").UnwrapRef<T>>;
    traceLifecycle: (eventName: string) => void;
};
/**
 * Get the global collector instance
 */
export declare function getCollector(): TraceCollector | null;
export default StackSleuthPlugin;
//# sourceMappingURL=index.d.ts.map