import React, { ReactNode } from 'react';
import { TraceCollector, StackSleuthConfig } from '@stacksleuth/core';
interface StackSleuthProviderProps {
    children: ReactNode;
    config?: Partial<StackSleuthConfig>;
}
/**
 * Provider component that wraps your React app
 */
export declare function StackSleuthProvider({ children, config }: StackSleuthProviderProps): React.FunctionComponentElement<React.ProviderProps<TraceCollector | null>>;
/**
 * Hook to access the trace collector
 */
export declare function useTrace(): {
    /**
     * Manually trace an operation
     */
    trace: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
    /**
     * Get the collector instance
     */
    collector: TraceCollector;
};
/**
 * Higher-order component to automatically trace component renders
 */
export declare function withTracing<P extends object>(Component: React.ComponentType<P>, options?: {
    name?: string;
}): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<any>>;
/**
 * Get the global collector instance
 */
export declare function getCollector(): TraceCollector | null;
export default StackSleuthProvider;
//# sourceMappingURL=index.d.ts.map