// src/optimization/OptimizationEngine.ts

import { ImpactAnalysis, PerformanceBaseline } from "../types/analysis";
import { MetricsSnapshot } from "../types/metrics";
import {
    OptimizationSuggestion,
    OptimizationPriority,
    OptimizationCategory,
    OptimizationRule,
} from "../types/optimization";
import { ConfigFile } from "../types/config";

export class OptimizationEngine {
    private suggestions: OptimizationSuggestion[] = [];
    private appliedSuggestions: Map<string, OptimizationSuggestion> = new Map();
    private optimizationRules: OptimizationRule[] = [];

    constructor() {
        console.log("🤖 OptimizationEngine initialized");
        this.initializeBuiltInRules();
    }

    private initializeBuiltInRules(): void {
        // Built-in optimization rules (no AI/ML - pure algorithmic)
        this.optimizationRules = [
            {
                id: "nodejs_memory_limit",
                name: "Node.js Memory Optimization",
                description: "Optimize Node.js max memory based on system capacity",
                configPattern: "package.json",
                parameterPattern: "scripts.*",
                condition: (value: any, metrics: any) => {
                    return (
                        typeof value === "string" &&
                        value.includes("node") &&
                        metrics.memoryUsage > 80
                    );
                },
                suggestion: (currentValue: any, metrics: any) =>
                    this.generateMemoryOptimization(currentValue, metrics),
                priority: OptimizationPriority.HIGH,
                category: OptimizationCategory.MEMORY,
            },
            {
                id: "connection_pool_size",
                name: "Connection Pool Optimization",
                description: "Optimize database connection pool size",
                configPattern: "*.{json,js,ts}",
                parameterPattern: "*pool*",
                condition: (value: any, metrics: any) => {
                    return (
                        typeof value === "number" &&
                        (value > 50 || value < 5) &&
                        metrics.cpuUsage > 10
                    );
                },
                suggestion: (currentValue: any, metrics: any) =>
                    this.generatePoolOptimization(currentValue, metrics),
                priority: OptimizationPriority.MEDIUM,
                category: OptimizationCategory.PERFORMANCE,
            },
            {
                id: "timeout_optimization",
                name: "Timeout Configuration Optimization",
                description: "Optimize timeout values for better stability",
                configPattern: "*.{json,yaml,yml}",
                parameterPattern: "*timeout*",
                condition: (value: any, metrics: any) => {
                    return (
                        typeof value === "number" &&
                        (value > 30000 || value < 1000) &&
                        metrics.stabilityScore < 0.8
                    );
                },
                suggestion: (currentValue: any, metrics: any) =>
                    this.generateTimeoutOptimization(currentValue, metrics),
                priority: OptimizationPriority.MEDIUM,
                category: OptimizationCategory.STABILITY,
            },
        ];

        console.log(
            `📋 Loaded ${this.optimizationRules.length} built-in optimization rules`,
        );
    }

    async generateSuggestions(
        analyses: ImpactAnalysis[],
        baselines: PerformanceBaseline[],
        configFiles: ConfigFile[],
        metricsHistory: MetricsSnapshot[],
    ): Promise<OptimizationSuggestion[]> {
        console.log("🔍 Generating optimization suggestions...");

        const newSuggestions: OptimizationSuggestion[] = [];
        const latestMetrics = this.calculateLatestMetrics(metricsHistory);

        // 1. Analyze poor-performing configurations
        newSuggestions.push(
            ...(await this.analyzePoorPerformance(analyses, baselines)),
        );

        // 2. Identify resource optimization opportunities
        newSuggestions.push(
            ...(await this.identifyResourceOptimizations(latestMetrics, configFiles)),
        );

        // 3. Detect stability issues
        newSuggestions.push(
            ...(await this.detectStabilityIssues(baselines, metricsHistory)),
        );

        // 4. Apply algorithmic optimizations
        newSuggestions.push(
            ...(await this.applyAlgorithmicOptimizations(configFiles, latestMetrics)),
        );

        // Filter and prioritize suggestions
        const filteredSuggestions =
            this.filterAndPrioritizeSuggestions(newSuggestions);

        this.suggestions.push(...filteredSuggestions);

        console.log(
            `✅ Generated ${filteredSuggestions.length} optimization suggestions`,
        );
        this.logSuggestionsSummary(filteredSuggestions);

        return filteredSuggestions;
    }

    private async analyzePoorPerformance(
        analyses: ImpactAnalysis[],
        baselines: PerformanceBaseline[],
    ): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];

        // Find configurations with negative impact
        const poorPerformers = analyses.filter((a) => a.impactScore < -0.3);

        for (const analysis of poorPerformers) {
            const suggestion: OptimizationSuggestion = {
                id: this.generateSuggestionId(),
                timestamp: new Date(),
                priority: OptimizationPriority.HIGH,
                category: OptimizationCategory.PERFORMANCE,
                configFile: analysis.configFile,
                parameter: analysis.parameter || "unknown",
                currentValue: "current_config",
                suggestedValue: "optimized_config",
                expectedImpact: `Improve performance by ${Math.abs(analysis.impactScore * 100).toFixed(1)}%`,
                reasoning: [
                    `Configuration change caused ${Math.abs(analysis.impactScore * 100).toFixed(1)}% performance degradation`,
                    `CPU impact: ${analysis.metrics.cpuDelta.toFixed(2)}%`,
                    `Memory impact: ${analysis.metrics.memoryDelta.toFixed(2)}%`,
                    "Consider reverting or adjusting this configuration",
                ],
                confidence: analysis.confidence,
                estimatedGain: {
                    cpu: Math.abs(analysis.metrics.cpuDelta),
                    memory: Math.abs(analysis.metrics.memoryDelta),
                    stability: Math.abs(analysis.metrics.stabilityDelta),
                },
                riskLevel: "low",
                rollbackPlan: `Revert changes to ${analysis.configFile}`,
            };

            suggestions.push(suggestion);
        }

        return suggestions;
    }

    private async identifyResourceOptimizations(
        latestMetrics: any,
        configFiles: ConfigFile[],
    ): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];

        // High memory usage optimization
        if (latestMetrics.memoryUsage > 85) {
            suggestions.push({
                id: this.generateSuggestionId(),
                timestamp: new Date(),
                priority: OptimizationPriority.HIGH,
                category: OptimizationCategory.MEMORY,
                configFile: "system",
                parameter: "memory_management",
                currentValue: `${latestMetrics.memoryUsage.toFixed(1)}%`,
                suggestedValue: "optimized_memory_settings",
                expectedImpact: "Reduce memory usage by 10-20%",
                reasoning: [
                    `Current memory usage is ${latestMetrics.memoryUsage.toFixed(1)}% (high)`,
                    "Consider optimizing cache sizes, connection pools, or buffer limits",
                    "Review memory-intensive configuration parameters",
                ],
                confidence: 0.8,
                estimatedGain: {
                    memory: 15,
                },
                riskLevel: "medium",
                rollbackPlan: "Increase limits if performance degrades",
            });
        }

        // CPU optimization suggestions
        if (latestMetrics.cpuUsage > 70) {
            suggestions.push({
                id: this.generateSuggestionId(),
                timestamp: new Date(),
                priority: OptimizationPriority.MEDIUM,
                category: OptimizationCategory.PERFORMANCE,
                configFile: "system",
                parameter: "cpu_optimization",
                currentValue: `${latestMetrics.cpuUsage.toFixed(1)}%`,
                suggestedValue: "optimized_cpu_settings",
                expectedImpact: "Reduce CPU usage by 5-15%",
                reasoning: [
                    `Current CPU usage is ${latestMetrics.cpuUsage.toFixed(1)}% (high)`,
                    "Consider optimizing worker processes, threading, or async operations",
                    "Review CPU-intensive configuration parameters",
                ],
                confidence: 0.7,
                estimatedGain: {
                    cpu: 10,
                },
                riskLevel: "medium",
                rollbackPlan: "Revert to previous CPU settings",
            });
        }

        return suggestions;
    }

    private async detectStabilityIssues(
        baselines: PerformanceBaseline[],
        metricsHistory: MetricsSnapshot[],
    ): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];

        // Find baselines with low stability
        const unstableBaselines = baselines.filter((b) => b.stability < 0.7);

        for (const baseline of unstableBaselines) {
            suggestions.push({
                id: this.generateSuggestionId(),
                timestamp: new Date(),
                priority: OptimizationPriority.MEDIUM,
                category: OptimizationCategory.STABILITY,
                configFile: "configuration",
                parameter: "stability_optimization",
                currentValue: `${(baseline.stability * 100).toFixed(1)}%`,
                suggestedValue: "stabilized_configuration",
                expectedImpact: `Improve stability by ${((0.9 - baseline.stability) * 100).toFixed(1)}%`,
                reasoning: [
                    `Current stability score is ${(baseline.stability * 100).toFixed(1)}% (low)`,
                    "Consider adjusting timeout values, retry policies, or resource limits",
                    "Increase buffer sizes or connection pool stability",
                ],
                confidence: 0.6,
                estimatedGain: {
                    stability: 0.9 - baseline.stability,
                },
                riskLevel: "low",
                rollbackPlan: "Revert stability adjustments if issues occur",
            });
        }

        return suggestions;
    }

    private async applyAlgorithmicOptimizations(
        configFiles: ConfigFile[],
        latestMetrics: any,
    ): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];

        // Mathematical optimization based on current metrics
        // Golden ratio optimization for buffer sizes
        const goldenRatio = 1.618;
        const optimalMemoryRatio = 0.8; // 80% memory usage target

        if (latestMetrics.memoryUsage > optimalMemoryRatio * 100) {
            const reductionNeeded =
                latestMetrics.memoryUsage - optimalMemoryRatio * 100;
            const suggestedReduction = Math.ceil(reductionNeeded / goldenRatio);

            suggestions.push({
                id: this.generateSuggestionId(),
                timestamp: new Date(),
                priority: OptimizationPriority.MEDIUM,
                category: OptimizationCategory.RESOURCE,
                configFile: "algorithmic_optimization",
                parameter: "memory_ratio_optimization",
                currentValue: `${latestMetrics.memoryUsage.toFixed(1)}%`,
                suggestedValue: `${(latestMetrics.memoryUsage - suggestedReduction).toFixed(1)}%`,
                expectedImpact: `Reduce memory usage by ${suggestedReduction.toFixed(1)}% using golden ratio optimization`,
                reasoning: [
                    "Applied golden ratio mathematical optimization",
                    `Target optimal memory usage: ${(optimalMemoryRatio * 100).toFixed(1)}%`,
                    "Calculated reduction using mathematical algorithms",
                ],
                confidence: 0.75,
                estimatedGain: {
                    memory: suggestedReduction,
                },
                riskLevel: "low",
                rollbackPlan: "Mathematical rollback using inverse golden ratio",
            });
        }

        return suggestions;
    }

    private filterAndPrioritizeSuggestions(
        suggestions: OptimizationSuggestion[],
    ): OptimizationSuggestion[] {
        // Remove duplicates
        const uniqueSuggestions = suggestions.filter(
            (suggestion, index, self) =>
                index ===
                self.findIndex(
                    (s) =>
                        s.configFile === suggestion.configFile &&
                        s.parameter === suggestion.parameter,
                ),
        );

        // Sort by priority and confidence
        return uniqueSuggestions.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];

            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }

            return b.confidence - a.confidence; // Higher confidence first
        });
    }

    private calculateLatestMetrics(metricsHistory: MetricsSnapshot[]): any {
        if (metricsHistory.length === 0) {
            return { cpuUsage: 0, memoryUsage: 0, stabilityScore: 1 };
        }

        const recent = metricsHistory.slice(-5); // Last 5 snapshots
        const avgCpu =
            recent.reduce((sum, m) => sum + m.system.cpu.usage, 0) / recent.length;
        const avgMemory =
            recent.reduce((sum, m) => sum + m.system.memory.percentage, 0) /
            recent.length;

        return {
            cpuUsage: avgCpu,
            memoryUsage: avgMemory,
            stabilityScore: this.calculateStabilityScore(recent),
        };
    }

    private calculateStabilityScore(snapshots: MetricsSnapshot[]): number {
        if (snapshots.length < 2) return 1;

        const cpuValues = snapshots.map((s) => s.system.cpu.usage);
        const memoryValues = snapshots.map((s) => s.system.memory.percentage);

        const cpuVariation = this.calculateVariation(cpuValues);
        const memoryVariation = this.calculateVariation(memoryValues);

        return Math.max(0, 1 - (cpuVariation + memoryVariation) / 2);
    }

    private calculateVariation(values: number[]): number {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
            values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
            values.length;
        return Math.sqrt(variance) / mean || 0;
    }

    private logSuggestionsSummary(suggestions: OptimizationSuggestion[]): void {
        if (suggestions.length === 0) {
            console.log("📋 No new optimization suggestions generated");
            return;
        }

        console.log(`📋 Optimization Suggestions Summary:`);
        const byCategory = suggestions.reduce(
            (acc, s) => {
                acc[s.category] = (acc[s.category] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>,
        );

        Object.entries(byCategory).forEach(([category, count]) => {
            console.log(`   ${category}: ${count} suggestions`);
        });

        // Show top suggestion
        const topSuggestion = suggestions[0];
        console.log(
            `🏆 Top Suggestion: ${topSuggestion.expectedImpact} (${(topSuggestion.confidence * 100).toFixed(1)}% confidence)`,
        );
    }

    // Helper methods for generating specific optimizations
    private generateMemoryOptimization(
        currentValue: any,
        metrics: any,
    ): OptimizationSuggestion {
        return {
            id: this.generateSuggestionId(),
            timestamp: new Date(),
            priority: OptimizationPriority.HIGH,
            category: OptimizationCategory.MEMORY,
            configFile: "package.json",
            parameter: "memory_limit",
            currentValue,
            suggestedValue: "node --max-old-space-size=4096",
            expectedImpact: "Optimize memory allocation for better performance",
            reasoning: [
                "High memory usage detected",
                "Optimize Node.js memory allocation",
            ],
            confidence: 0.8,
            estimatedGain: { memory: 20 },
            riskLevel: "low",
            rollbackPlan: "Remove memory limit flag",
        };
    }

    private generatePoolOptimization(
        currentValue: any,
        metrics: any,
    ): OptimizationSuggestion {
        const optimal =
            metrics.cpuUsage > 50
                ? Math.max(5, currentValue * 0.7)
                : Math.min(20, currentValue * 1.2);

        return {
            id: this.generateSuggestionId(),
            timestamp: new Date(),
            priority: OptimizationPriority.MEDIUM,
            category: OptimizationCategory.PERFORMANCE,
            configFile: "config",
            parameter: "pool_size",
            currentValue,
            suggestedValue: Math.round(optimal),
            expectedImpact:
                "Optimize connection pool for better resource utilization",
            reasoning: [
                "Suboptimal pool size detected",
                "Adjust based on CPU usage patterns",
            ],
            confidence: 0.7,
            estimatedGain: { cpu: 10, memory: 5 },
            riskLevel: "medium",
            rollbackPlan: `Revert to ${currentValue}`,
        };
    }

    private generateTimeoutOptimization(
        currentValue: any,
        metrics: any,
    ): OptimizationSuggestion {
        const optimal =
            metrics.stabilityScore < 0.5
                ? currentValue * 1.5
                : Math.max(5000, currentValue * 0.8);

        return {
            id: this.generateSuggestionId(),
            timestamp: new Date(),
            priority: OptimizationPriority.MEDIUM,
            category: OptimizationCategory.STABILITY,
            configFile: "config",
            parameter: "timeout",
            currentValue,
            suggestedValue: Math.round(optimal),
            expectedImpact: "Optimize timeout for better stability",
            reasoning: [
                "Suboptimal timeout detected",
                "Adjust based on stability patterns",
            ],
            confidence: 0.6,
            estimatedGain: { stability: 0.2 },
            riskLevel: "low",
            rollbackPlan: `Revert to ${currentValue}ms`,
        };
    }

    private generateSuggestionId(): string {
        return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public methods
    getAllSuggestions(): OptimizationSuggestion[] {
        return [...this.suggestions];
    }

    getSuggestionsByPriority(
        priority: OptimizationPriority,
    ): OptimizationSuggestion[] {
        return this.suggestions.filter((s) => s.priority === priority);
    }

    getSuggestionsByCategory(
        category: OptimizationCategory,
    ): OptimizationSuggestion[] {
        return this.suggestions.filter((s) => s.category === category);
    }

    getSuggestionsCount(): number {
        return this.suggestions.length;
    }
}
