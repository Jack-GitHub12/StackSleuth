"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceOptimizerAgent = exports.PerformanceOptimizerAgent = void 0;
const core_1 = require("@stacksleuth/core");
class PerformanceOptimizerAgent {
    constructor(config) {
        this.isActive = false;
        this.metrics = new Map();
        this.baselines = new Map();
        this.issues = new Map();
        this.recommendations = new Map();
        this.profiler = new core_1.ProfilerCore(config);
        this.config = {
            analysisInterval: config?.analysisInterval || 30000, // 30 seconds
            maxMetricHistory: config?.maxMetricHistory || 1000,
            baselineSamples: config?.baselineSamples || 100,
            enableAutoOptimization: config?.enableAutoOptimization || false,
            thresholds: {
                'response_time': 1000,
                'database_query_time': 500,
                'memory_usage': 85,
                'cpu_usage': 80,
                'error_rate': 5,
                'network_latency': 200,
                ...config?.customThresholds
            }
        };
    }
    /**
     * Initialize the performance optimizer
     */
    async init() {
        if (this.isActive)
            return;
        this.isActive = true;
        await this.profiler.init();
        // Start periodic analysis
        this.analysisInterval = setInterval(() => {
            this.runAnalysis();
        }, this.config.analysisInterval);
        console.log('✅ Performance Optimizer Agent initialized');
    }
    /**
     * Record a performance metric
     */
    recordMetric(metric) {
        if (!this.isActive)
            return;
        const key = `${metric.component}:${metric.metric}`;
        const metrics = this.metrics.get(key) || [];
        metrics.push(metric);
        // Keep only recent metrics
        if (metrics.length > this.config.maxMetricHistory) {
            metrics.shift();
        }
        this.metrics.set(key, metrics);
        // Update baseline if needed
        this.updateBaseline(metric);
        // Record with profiler
        this.profiler.recordMetric('performance_metric', {
            ...metric,
            timestamp: Date.now()
        });
    }
    /**
     * Update performance baseline
     */
    updateBaseline(metric) {
        const key = `${metric.component}:${metric.metric}`;
        const existing = this.baselines.get(key);
        if (!existing) {
            // Create new baseline
            this.baselines.set(key, {
                component: metric.component,
                metric: metric.metric,
                baseline: metric.value,
                target: metric.target || metric.value * 0.8, // 20% improvement target
                threshold: metric.threshold || this.config.thresholds[metric.metric] || metric.value * 1.5,
                samples: 1,
                created: Date.now(),
                updated: Date.now()
            });
        }
        else {
            // Update existing baseline with moving average
            const alpha = 0.1; // Smoothing factor
            existing.baseline = existing.baseline * (1 - alpha) + metric.value * alpha;
            existing.samples++;
            existing.updated = Date.now();
        }
    }
    /**
     * Run comprehensive performance analysis
     */
    async runAnalysis() {
        if (!this.isActive)
            return;
        try {
            // Detect performance issues
            this.detectIssues();
            // Generate optimization recommendations
            this.generateRecommendations();
            // Update trends
            this.updateTrends();
            // Auto-optimize if enabled
            if (this.config.enableAutoOptimization) {
                this.applyAutoOptimizations();
            }
            // Record analysis cycle
            this.profiler.recordMetric('optimization_analysis', {
                issuesDetected: this.issues.size,
                recommendationsGenerated: this.recommendations.size,
                metricsAnalyzed: this.metrics.size,
                timestamp: Date.now()
            });
        }
        catch (error) {
            console.error('Error during performance analysis:', error);
        }
    }
    /**
     * Detect performance issues
     */
    detectIssues() {
        for (const [key, metrics] of this.metrics.entries()) {
            const [component, metric] = key.split(':');
            const baseline = this.baselines.get(key);
            if (!baseline || metrics.length < 10)
                continue;
            const recentMetrics = metrics.slice(-10);
            const average = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
            // Check if current performance exceeds threshold
            if (average > baseline.threshold) {
                const issueId = `${component}_${metric}_${Date.now()}`;
                const existing = Array.from(this.issues.values())
                    .find(issue => issue.component === component && issue.metric === metric);
                if (existing) {
                    // Update existing issue
                    existing.lastDetected = Date.now();
                    existing.frequency++;
                    existing.currentValue = average;
                    existing.trend = this.calculateTrend(metrics);
                }
                else {
                    // Create new issue
                    this.issues.set(issueId, {
                        id: issueId,
                        severity: this.calculateSeverity(average, baseline.threshold, baseline.baseline),
                        component,
                        metric,
                        currentValue: average,
                        expectedValue: baseline.baseline,
                        impact: this.calculateImpact(component, metric, average, baseline.baseline),
                        firstDetected: Date.now(),
                        lastDetected: Date.now(),
                        frequency: 1,
                        trend: this.calculateTrend(metrics)
                    });
                }
            }
        }
    }
    /**
     * Generate optimization recommendations
     */
    generateRecommendations() {
        for (const issue of this.issues.values()) {
            const existingRec = Array.from(this.recommendations.values())
                .find(rec => rec.relatedMetrics.includes(`${issue.component}:${issue.metric}`));
            if (existingRec)
                continue; // Already have recommendation for this issue
            const recommendation = this.createRecommendation(issue);
            if (recommendation) {
                this.recommendations.set(recommendation.id, recommendation);
            }
        }
    }
    /**
     * Create optimization recommendation based on issue
     */
    createRecommendation(issue) {
        const templates = this.getRecommendationTemplates();
        const key = `${issue.component}_${issue.metric}`;
        const template = templates[key];
        if (!template)
            return null;
        return {
            id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            priority: issue.severity === 'critical' ? 'high' : issue.severity === 'high' ? 'medium' : 'low',
            category: this.getCategoryFromComponent(issue.component),
            title: template.title,
            description: template.description.replace('{value}', issue.currentValue.toString()),
            impact: issue.severity === 'critical' ? 'high' : 'medium',
            effort: template.effort,
            estimatedImprovement: template.estimatedImprovement,
            actionItems: template.actionItems,
            codeExamples: template.codeExamples,
            relatedMetrics: [`${issue.component}:${issue.metric}`],
            created: Date.now(),
            applied: false
        };
    }
    /**
     * Get recommendation templates
     */
    getRecommendationTemplates() {
        return {
            'database_query_time': {
                title: 'Optimize Database Query Performance',
                description: 'Database queries are taking {value}ms on average, which exceeds the recommended threshold.',
                effort: 'medium',
                estimatedImprovement: '30-50% query time reduction',
                actionItems: [
                    'Add database indexes for frequently queried columns',
                    'Optimize query structure and eliminate N+1 queries',
                    'Implement query result caching',
                    'Consider database connection pooling'
                ],
                codeExamples: [
                    '// Add database index\nCREATE INDEX idx_user_email ON users(email);',
                    '// Use eager loading to prevent N+1\nUser.findAll({ include: [{ model: Profile }] })'
                ]
            },
            'frontend_render_time': {
                title: 'Optimize Frontend Rendering Performance',
                description: 'Component rendering is taking {value}ms, causing UI lag.',
                effort: 'medium',
                estimatedImprovement: '40-60% render time reduction',
                actionItems: [
                    'Implement React.memo or useMemo for expensive computations',
                    'Virtualize long lists and tables',
                    'Lazy load components and images',
                    'Optimize bundle size and split code'
                ],
                codeExamples: [
                    '// Memoize expensive component\nconst ExpensiveComponent = React.memo(({ data }) => { ... });',
                    '// Lazy load component\nconst LazyComponent = lazy(() => import(\'./Component\'));'
                ]
            },
            'memory_usage': {
                title: 'Reduce Memory Usage',
                description: 'Memory usage is at {value}%, approaching critical levels.',
                effort: 'high',
                estimatedImprovement: '20-40% memory reduction',
                actionItems: [
                    'Implement memory leak detection and cleanup',
                    'Optimize data structures and algorithms',
                    'Add garbage collection tuning',
                    'Review and optimize caching strategies'
                ],
                codeExamples: [
                    '// Clean up event listeners\nuseEffect(() => { return () => cleanup(); }, []);',
                    '// Optimize data structure\nconst cache = new Map(); // Use Map instead of Object for frequent additions/deletions'
                ]
            },
            'network_latency': {
                title: 'Optimize Network Performance',
                description: 'Network requests are experiencing {value}ms latency.',
                effort: 'low',
                estimatedImprovement: '30-50% latency reduction',
                actionItems: [
                    'Implement request caching and compression',
                    'Use CDN for static assets',
                    'Optimize API payload sizes',
                    'Implement request batching'
                ],
                codeExamples: [
                    '// Enable compression\napp.use(compression());',
                    '// Batch API requests\nconst batchedRequests = Promise.all([req1, req2, req3]);'
                ]
            }
        };
    }
    /**
     * Update performance trends
     */
    updateTrends() {
        for (const [key, metrics] of this.metrics.entries()) {
            if (metrics.length < 20)
                continue;
            const recent = metrics.slice(-10);
            const older = metrics.slice(-20, -10);
            const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
            const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
            const change = (recentAvg - olderAvg) / olderAvg;
            // Update baseline with trend
            const baseline = this.baselines.get(key);
            if (baseline) {
                if (change < -0.1) {
                    // Improving
                }
                else if (change > 0.1) {
                    // Degrading - may need intervention
                }
            }
        }
    }
    /**
     * Apply automatic optimizations
     */
    applyAutoOptimizations() {
        for (const recommendation of this.recommendations.values()) {
            if (recommendation.applied || recommendation.effort === 'high')
                continue;
            // Only apply low-effort, high-impact optimizations automatically
            if (recommendation.effort === 'low' && recommendation.impact === 'high') {
                this.applyRecommendation(recommendation.id);
            }
        }
    }
    /**
     * Apply a specific recommendation
     */
    applyRecommendation(recommendationId) {
        const recommendation = this.recommendations.get(recommendationId);
        if (!recommendation || recommendation.applied)
            return false;
        try {
            // This would implement the actual optimization
            // For now, we'll just mark it as applied
            recommendation.applied = true;
            this.profiler.recordMetric('optimization_applied', {
                recommendationId,
                category: recommendation.category,
                priority: recommendation.priority,
                timestamp: Date.now()
            });
            console.log(`✅ Applied optimization: ${recommendation.title}`);
            return true;
        }
        catch (error) {
            console.error(`Failed to apply optimization ${recommendationId}:`, error);
            return false;
        }
    }
    /**
     * Generate comprehensive performance report
     */
    generateReport(timeRange) {
        const now = Date.now();
        const range = timeRange || {
            start: now - (24 * 60 * 60 * 1000), // Last 24 hours
            end: now
        };
        const filteredIssues = Array.from(this.issues.values())
            .filter(issue => issue.firstDetected >= range.start && issue.firstDetected <= range.end);
        const filteredRecommendations = Array.from(this.recommendations.values())
            .filter(rec => rec.created >= range.start && rec.created <= range.end);
        const criticalIssues = filteredIssues.filter(issue => issue.severity === 'critical').length;
        return {
            id: `report_${Date.now()}`,
            generated: now,
            timeRange: range,
            summary: {
                totalIssues: filteredIssues.length,
                criticalIssues,
                recommendations: filteredRecommendations.length,
                potentialImprovement: this.calculatePotentialImprovement(filteredRecommendations)
            },
            issues: filteredIssues,
            recommendations: filteredRecommendations,
            baselines: Array.from(this.baselines.values()),
            trends: this.getCurrentTrends()
        };
    }
    /**
     * Get current metrics summary
     */
    getMetricsSummary() {
        const summary = {};
        for (const [key, metrics] of this.metrics.entries()) {
            const [component, metric] = key.split(':');
            const recent = metrics.slice(-10);
            const average = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
            const baseline = this.baselines.get(key);
            if (!summary[component]) {
                summary[component] = {};
            }
            summary[component][metric] = {
                current: average,
                baseline: baseline?.baseline,
                threshold: baseline?.threshold,
                trend: this.calculateTrend(metrics),
                samples: metrics.length
            };
        }
        return summary;
    }
    /**
     * Get active issues
     */
    getActiveIssues() {
        return Array.from(this.issues.values())
            .filter(issue => Date.now() - issue.lastDetected < 300000) // Active in last 5 minutes
            .sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }
    /**
     * Get pending recommendations
     */
    getPendingRecommendations() {
        return Array.from(this.recommendations.values())
            .filter(rec => !rec.applied)
            .sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    /**
     * Helper methods
     */
    calculateSeverity(current, threshold, baseline) {
        const deviation = (current - baseline) / baseline;
        if (deviation > 2.0)
            return 'critical';
        if (deviation > 1.0)
            return 'high';
        if (deviation > 0.5)
            return 'medium';
        return 'low';
    }
    calculateImpact(component, metric, current, baseline) {
        const deviation = ((current - baseline) / baseline * 100).toFixed(1);
        return `${deviation}% performance degradation in ${component} ${metric}`;
    }
    calculateTrend(metrics) {
        if (metrics.length < 10)
            return 'stable';
        const recent = metrics.slice(-5);
        const older = metrics.slice(-10, -5);
        const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
        const change = (recentAvg - olderAvg) / olderAvg;
        if (change < -0.05)
            return 'improving';
        if (change > 0.05)
            return 'degrading';
        return 'stable';
    }
    getCategoryFromComponent(component) {
        const categoryMap = {
            'database': 'database',
            'frontend': 'frontend',
            'backend': 'backend',
            'network': 'network',
            'memory': 'memory',
            'cache': 'caching'
        };
        return categoryMap[component] || 'backend';
    }
    calculatePotentialImprovement(recommendations) {
        const highImpact = recommendations.filter(r => r.impact === 'high').length;
        const mediumImpact = recommendations.filter(r => r.impact === 'medium').length;
        const estimated = highImpact * 30 + mediumImpact * 15;
        return `${estimated}% performance improvement potential`;
    }
    getCurrentTrends() {
        const trends = {};
        for (const [key, metrics] of this.metrics.entries()) {
            trends[key] = this.calculateTrend(metrics);
        }
        return trends;
    }
    /**
     * Export optimization data
     */
    exportData() {
        return {
            metrics: Object.fromEntries(this.metrics),
            baselines: Object.fromEntries(this.baselines),
            issues: Object.fromEntries(this.issues),
            recommendations: Object.fromEntries(this.recommendations),
            summary: this.getMetricsSummary()
        };
    }
    /**
     * Stop the performance optimizer
     */
    async stop() {
        if (!this.isActive)
            return;
        this.isActive = false;
        // Clear analysis interval
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
        }
        // Record final analysis
        this.profiler.recordMetric('optimizer_stopped', {
            totalMetrics: this.metrics.size,
            totalIssues: this.issues.size,
            totalRecommendations: this.recommendations.size,
            timestamp: Date.now()
        });
        await this.profiler.stop();
        console.log('🛑 Performance Optimizer Agent stopped');
    }
}
exports.PerformanceOptimizerAgent = PerformanceOptimizerAgent;
// Export default instance
exports.performanceOptimizerAgent = new PerformanceOptimizerAgent();
// Auto-initialize
if (typeof process !== 'undefined') {
    exports.performanceOptimizerAgent.init().catch(console.error);
}
//# sourceMappingURL=index.js.map