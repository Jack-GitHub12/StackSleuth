export * from './types';
export * from './utils';
export * from './collector';
export * from './flamegraph';
export * from './adaptive-sampling';
export declare const defaultConfig: {
    enabled: boolean;
    sampling: {
        rate: number;
    };
    filters: {};
    output: {
        console: boolean;
        dashboard: {
            enabled: boolean;
            port: number;
            host: string;
        };
    };
};
//# sourceMappingURL=index.d.ts.map