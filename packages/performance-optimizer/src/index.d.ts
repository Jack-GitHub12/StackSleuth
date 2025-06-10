export interface PerformanceMetric {
    component: string;
    metric: string;
    value: number;
    unit: string;
    timestamp: number;
    threshold?: number;
    target?: number;
}
export interface OptimizationRecommendation {
    id: string;
    priority: 'high' | 'medium' | 'low';
    category: 'database' | 'frontend' | 'backend' | 'network' | 'memory' | 'caching';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    estimatedImprovement: string;
    actionItems: string[];
    codeExamples?: string[];
    relatedMetrics: string[];
    created: number;
    applied?: boolean;
}
export interface PerformanceIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    component: string;
    metric: string;
    currentValue: number;
    expectedValue: number;
    impact: string;
    firstDetected: number;
    lastDetected: number;
    frequency: number;
    trend: 'improving' | 'stable' | 'degrading';
}
export interface PerformanceBaseline {
    component: string;
    metric: string;
    baseline: number;
    target: number;
    threshold: number;
    samples: number;
    created: number;
    updated: number;
}
export interface OptimizationReport {
    id: string;
    generated: number;
    timeRange: {
        start: number;
        end: number;
    };
    summary: {
        totalIssues: number;
        criticalIssues: number;
        recommendations: number;
        potentialImprovement: string;
    };
    issues: PerformanceIssue[];
    recommendations: OptimizationRecommendation[];
    baselines: PerformanceBaseline[];
    trends: {
        [metric: string]: 'improving' | 'stable' | 'degrading';
    };
}
export declare class PerformanceOptimizerAgent {
    private profiler;
    private isActive;
    private metrics;
    private baselines;
    private issues;
    private recommendations;
    private analysisInterval?;
    private config;
    constructor(config?: {
        endpoint?: string;
        apiKey?: string;
        analysisInterval?: number;
        maxMetricHistory?: number;
        baselineSamples?: number;
        enableAutoOptimization?: boolean;
        customThresholds?: {
            [key: string]: number;
        };
    });
    /**
     * Initialize the performance optimizer
     */
    init(): Promise<void>;
    /**
     * Record a performance metric
     */
    recordMetric(metric: PerformanceMetric): void;
    /**
     * Update performance baseline
     */
    private updateBaseline;
    /**
     * Run comprehensive performance analysis
     */
    private runAnalysis;
    /**
     * Detect performance issues
     */
    private detectIssues;
    /**
     * Generate optimization recommendations
     */
    private generateRecommendations;
    /**
     * Create optimization recommendation based on issue
     */
    private createRecommendation;
    /**
     * Get recommendation templates
     */
    private getRecommendationTemplates;
    /**
     * Update performance trends
     */
    private updateTrends;
    /**
     * Apply automatic optimizations
     */
    private applyAutoOptimizations;
    /**
     * Apply a specific recommendation
     */
    applyRecommendation(recommendationId: string): boolean;
    /**
     * Generate comprehensive performance report
     */
    generateReport(timeRange?: {
        start: number;
        end: number;
    }): OptimizationReport;
    /**
     * Get current metrics summary
     */
    getMetricsSummary(): any;
    /**
     * Get active issues
     */
    getActiveIssues(): PerformanceIssue[];
    /**
     * Get pending recommendations
     */
    getPendingRecommendations(): OptimizationRecommendation[];
    /**
     * Helper methods
     */
    private calculateSeverity;
    private calculateImpact;
    private calculateTrend;
    private getCategoryFromComponent;
    private calculatePotentialImprovement;
    private getCurrentTrends;
    /**
     * Export optimization data
     */
    exportData(): any;
    /**
     * Stop the performance optimizer
     */
    stop(): Promise<void>;
}
export declare const performanceOptimizerAgent: PerformanceOptimizerAgent;
//# sourceMappingURL=index.d.ts.map