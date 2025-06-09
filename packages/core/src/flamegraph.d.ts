import { Trace } from './types';
export interface FlamegraphNode {
    id: string;
    name: string;
    value: number;
    children: FlamegraphNode[];
    depth: number;
    start: number;
    end: number;
    percentage: number;
    color?: string;
    metadata?: Record<string, any>;
}
export interface FlamegraphData {
    root: FlamegraphNode;
    totalDuration: number;
    maxDepth: number;
    nodeCount: number;
}
/**
 * Utility class for generating flamegraph data from traces
 */
export declare class FlamegraphGenerator {
    /**
     * Convert a trace to flamegraph data
     */
    static generateFromTrace(trace: Trace): FlamegraphData;
    /**
     * Generate flamegraph from multiple traces for comparison
     */
    static generateComparison(traces: Trace[]): FlamegraphData[];
    /**
     * Merge multiple flamegraphs for aggregated view
     */
    static mergeFlamegrahs(flamegraphs: FlamegraphData[]): FlamegraphData;
    /**
     * Build flamegraph node from span
     */
    private static buildNode;
    /**
     * Merge children from multiple nodes
     */
    private static mergeNodeChildren;
    /**
     * Calculate statistics for a flamegraph
     */
    private static calculateStats;
    /**
     * Get color for span type
     */
    private static getColorForSpanType;
    /**
     * Filter flamegraph by minimum duration
     */
    static filterByDuration(flamegraph: FlamegraphData, minDuration: number): FlamegraphData;
    /**
     * Convert flamegraph to SVG format
     */
    static toSVG(flamegraph: FlamegraphData, width?: number, height?: number): string;
}
//# sourceMappingURL=flamegraph.d.ts.map