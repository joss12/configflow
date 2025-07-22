// src/index.ts

import chalk from "chalk";
import { ConfigScanner } from "./scanner/ConfigScanner";
import { MetricsCollector } from "./metrics/MetricsCollector";
import { ImpactAnalyzer } from "./analysis/ImpactAnalyzer";
import { OptimizationEngine } from "./optimization/OptimizationEngine";
import { AutoTuningEngine } from "./autotuning/AutoTuningEngine";

console.log(chalk.blue("🔧 ConfigFlow - Autonomous Configuration Manager"));
console.log(chalk.cyan("🧠 Intelligent config optimization without AI/ML"));
console.log(chalk.green("📊 Starting initialization..."));

class ConfigFlow {
    private isRunning: boolean = false;
    private scanner?: ConfigScanner;
    private metricsCollector?: MetricsCollector;
    private impactAnalyzer?: ImpactAnalyzer;
    private optimizationEngine?: OptimizationEngine;
    private autoTuningEngine?: AutoTuningEngine;

    constructor() {
        console.log(chalk.green("✅ ConfigFlow instance created"));
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log(chalk.yellow("⚠️  ConfigFlow is already running"));
            return;
        }

        try {
            // Initialize auto-tuning engine
            this.autoTuningEngine = new AutoTuningEngine({
                enabled: true,
                safetyMode: true,
                maxConcurrentChanges: 1,
                riskThreshold: "low",
                testDuration: 90 * 1000, // 90 seconds for demo
                rollbackTimeout: 2 * 60 * 1000, // 2 minutes
            });

            // Initialize optimization engine
            this.optimizationEngine = new OptimizationEngine();

            // Initialize impact analyzer
            this.impactAnalyzer = new ImpactAnalyzer({
                minSampleSize: 3,
                analysisWindow: 2 * 60 * 1000,
            });

            // Initialize metrics collector
            this.metricsCollector = new MetricsCollector({
                interval: 10000,
                enableSystemMetrics: true,
                enableApplicationMetrics: true,
            });

            // Start metrics collection
            await this.metricsCollector.startCollection();

            // Initialize configuration scanner
            this.scanner = new ConfigScanner();

            // Scan for existing configuration files
            const scanResult = await this.scanner.scanConfigurations();

            // Start watching for changes
            this.scanner.startWatching((event, path) => {
                console.log(chalk.magenta(`📝 Config ${event}: ${path}`));

                if (this.impactAnalyzer) {
                    this.impactAnalyzer.recordConfigChange(path, event as any);
                }

                if (this.metricsCollector) {
                    this.metricsCollector.recordRequest(Date.now());
                }
            });

            this.isRunning = true;
            console.log(chalk.blue("🔄 ConfigFlow started successfully"));
            console.log(
                chalk.magenta("📈 Ready to analyze and optimize configurations"),
            );
            console.log(
                chalk.gray(
                    `📊 Monitoring ${scanResult.totalFiles} configuration files`,
                ),
            );
            console.log(
                chalk.gray(
                    `📊 Metrics collection active (${this.metricsCollector.getMetricsCount()} snapshots)`,
                ),
            );
            console.log(chalk.gray(`🧠 Impact analysis engine ready`));
            console.log(chalk.gray(`🤖 Optimization engine ready`));
            console.log(chalk.gray(`⚡ Auto-tuning engine ready`));

            // Start all periodic processes
            this.startPeriodicAnalysis();
            this.startPeriodicOptimization();
            this.startPeriodicAutoTuning();
            this.startStatusReports();
        } catch (error) {
            console.error(chalk.red("❌ Failed to start ConfigFlow:"), error);
            throw error;
        }
    }

    private startPeriodicAnalysis(): void {
        setInterval(async () => {
            if (this.metricsCollector && this.impactAnalyzer && this.isRunning) {
                const metricsHistory = this.metricsCollector.getMetricsHistory();
                await this.impactAnalyzer.analyzeMetrics(metricsHistory);

                const analyses = this.impactAnalyzer.getAnalysisResults();
                const baselines = this.impactAnalyzer.getBaselines();

                if (analyses.length > 0 || baselines.length > 0) {
                    console.log(
                        chalk.blue(
                            `🧠 Analysis Update: ${analyses.length} impact analyses, ${baselines.length} baselines`,
                        ),
                    );
                }
            }
        }, 30000);
    }

    private startPeriodicOptimization(): void {
        setInterval(async () => {
            if (
                this.optimizationEngine &&
                this.impactAnalyzer &&
                this.metricsCollector &&
                this.scanner &&
                this.isRunning
            ) {
                try {
                    const analyses = this.impactAnalyzer.getAnalysisResults();
                    const baselines = this.impactAnalyzer.getBaselines();
                    const configFiles = this.scanner.getConfigFiles();
                    const metricsHistory = this.metricsCollector.getMetricsHistory();

                    const suggestions = await this.optimizationEngine.generateSuggestions(
                        analyses,
                        baselines,
                        configFiles,
                        metricsHistory,
                    );

                    if (suggestions.length > 0) {
                        console.log(
                            chalk.green(
                                `🤖 Generated ${suggestions.length} new optimization suggestions`,
                            ),
                        );
                        this.displayTopSuggestions(suggestions);
                    }
                } catch (error) {
                    console.error(chalk.red("❌ Error during optimization:"), error);
                }
            }
        }, 75000);
    }

    private startPeriodicAutoTuning(): void {
        setInterval(async () => {
            if (
                this.autoTuningEngine &&
                this.optimizationEngine &&
                this.metricsCollector &&
                this.isRunning
            ) {
                try {
                    const suggestions = this.optimizationEngine.getAllSuggestions();
                    const recentMetrics = this.metricsCollector.getMetricsHistory();

                    const newSuggestions = suggestions.filter(
                        (s) => !this.hasBeenProcessed(s.id),
                    );

                    if (newSuggestions.length > 0) {
                        console.log(
                            chalk.cyan(
                                `⚡ Auto-tuning: Processing ${newSuggestions.length} suggestions`,
                            ),
                        );
                        await this.autoTuningEngine.processSuggestions(
                            newSuggestions,
                            recentMetrics,
                        );

                        const stats = this.autoTuningEngine.getTuningStats();
                        if (stats.totalSessions > 0) {
                            console.log(
                                chalk.cyan(
                                    `📈 Auto-tuning stats: ${stats.successful}/${stats.totalSessions} successful (${stats.successRate.toFixed(1)}%)`,
                                ),
                            );

                            if (stats.avgImprovement > 0) {
                                console.log(
                                    chalk.green(
                                        `💡 Average improvement: ${stats.avgImprovement.toFixed(2)}%`,
                                    ),
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.error(chalk.red("❌ Error during auto-tuning:"), error);
                }
            }
        }, 120000);
    }

    private hasBeenProcessed(suggestionId: string): boolean {
        if (!this.autoTuningEngine) return false;

        const allSessions = [
            ...this.autoTuningEngine.getActiveSessions(),
            ...this.autoTuningEngine.getCompletedSessions(),
        ];

        return allSessions.some((session) => session.suggestionId === suggestionId);
    }

    private displayTopSuggestions(suggestions: any[]): void {
        const top3 = suggestions.slice(0, 3);

        console.log(chalk.cyan("🏆 Top Optimization Suggestions:"));
        top3.forEach((suggestion, index) => {
            const priorityIcon = this.getPriorityIcon(suggestion.priority);
            console.log(
                chalk.white(
                    `   ${index + 1}. ${priorityIcon} ${suggestion.expectedImpact}`,
                ),
            );
            console.log(chalk.gray(`      File: ${suggestion.configFile}`));
            console.log(
                chalk.gray(
                    `      Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`,
                ),
            );
            console.log(chalk.gray(`      Risk: ${suggestion.riskLevel}`));
        });
    }

    private getPriorityIcon(priority: string): string {
        switch (priority) {
            case "critical":
                return "🚨";
            case "high":
                return "🔴";
            case "medium":
                return "🟡";
            case "low":
                return "🟢";
            default:
                return "📋";
        }
    }

    private startStatusReports(): void {
        setInterval(() => {
            if (this.metricsCollector && this.isRunning) {
                const latest = this.metricsCollector.getLatestMetrics();
                const optimizationCount =
                    this.optimizationEngine?.getSuggestionsCount() || 0;
                const activeTuning =
                    this.autoTuningEngine?.getActiveSessions().length || 0;
                const tuningStats = this.autoTuningEngine?.getTuningStats();

                if (latest) {
                    let statusMsg = `📊 Status: ${this.metricsCollector.getMetricsCount()} snapshots, CPU: ${latest.system.cpu.usage.toFixed(1)}%, Memory: ${latest.system.memory.percentage.toFixed(1)}%`;
                    statusMsg += `, Suggestions: ${optimizationCount}`;

                    if (activeTuning > 0) {
                        statusMsg += `, Active tuning: ${activeTuning}`;
                    }

                    if (tuningStats && tuningStats.totalSessions > 0) {
                        statusMsg += `, Success rate: ${tuningStats.successRate.toFixed(0)}%`;
                    }

                    console.log(chalk.dim(statusMsg));
                }
            }
        }, 120000);
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            console.log(chalk.yellow("⚠️  ConfigFlow is not running"));
            return;
        }

        try {
            if (this.scanner) {
                this.scanner.stopWatching();
            }

            if (this.metricsCollector) {
                await this.metricsCollector.stopCollection();
            }

            // Final comprehensive report
            if (
                this.optimizationEngine &&
                this.impactAnalyzer &&
                this.autoTuningEngine
            ) {
                const analyses = this.impactAnalyzer.getAnalysisResults();
                const changes = this.impactAnalyzer.getChangeHistory();
                const suggestions = this.optimizationEngine.getAllSuggestions();
                const tuningStats = this.autoTuningEngine.getTuningStats();

                console.log(chalk.cyan(`📋 Final Report:`));
                console.log(
                    chalk.cyan(`   Configuration changes detected: ${changes.length}`),
                );
                console.log(
                    chalk.cyan(`   Impact analyses performed: ${analyses.length}`),
                );
                console.log(
                    chalk.cyan(
                        `   Performance baselines: ${this.impactAnalyzer.getBaselines().length}`,
                    ),
                );
                console.log(
                    chalk.cyan(`   Optimization suggestions: ${suggestions.length}`),
                );
                console.log(
                    chalk.cyan(`   Auto-tuning sessions: ${tuningStats.totalSessions}`),
                );
                console.log(
                    chalk.cyan(`   Successful tunings: ${tuningStats.successful}`),
                );

                if (tuningStats.totalSessions > 0) {
                    console.log(
                        chalk.cyan(
                            `   Success rate: ${tuningStats.successRate.toFixed(1)}%`,
                        ),
                    );
                    if (tuningStats.avgImprovement > 0) {
                        console.log(
                            chalk.green(
                                `   Average improvement: ${tuningStats.avgImprovement.toFixed(2)}%`,
                            ),
                        );
                    }
                }

                // Show category breakdown
                if (suggestions.length > 0) {
                    const byCategory = suggestions.reduce(
                        (acc, s) => {
                            acc[s.category] = (acc[s.category] || 0) + 1;
                            return acc;
                        },
                        {} as Record<string, number>,
                    );

                    console.log(chalk.cyan(`   Suggestions by category:`));
                    Object.entries(byCategory).forEach(([category, count]) => {
                        console.log(chalk.cyan(`     ${category}: ${count}`));
                    });
                }
            }

            this.isRunning = false;
            console.log(chalk.red("🛑 ConfigFlow stopped"));
        } catch (error) {
            console.error(chalk.red("❌ Error stopping ConfigFlow:"), error);
            throw error;
        }
    }

    // Public methods for getting data
    getAnalysisResults() {
        return this.impactAnalyzer?.getAnalysisResults() || [];
    }

    getMetrics() {
        return this.metricsCollector?.getMetricsHistory() || [];
    }

    getBaselines() {
        return this.impactAnalyzer?.getBaselines() || [];
    }

    getOptimizationSuggestions() {
        return this.optimizationEngine?.getAllSuggestions() || [];
    }

    getAutoTuningStats() {
        return (
            this.autoTuningEngine?.getTuningStats() || {
                totalSessions: 0,
                successful: 0,
                rolledBack: 0,
                successRate: 0,
                avgImprovement: 0,
            }
        );
    }

    getActiveTuningSessions() {
        return this.autoTuningEngine?.getActiveSessions() || [];
    }

    getCompletedTuningSessions() {
        return this.autoTuningEngine?.getCompletedSessions() || [];
    }
}

// Initialize and start ConfigFlow
const configFlow = new ConfigFlow();
configFlow.start().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log(chalk.cyan("\n🔄 Shutting down gracefully..."));
    await configFlow.stop();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log(chalk.cyan("\n🔄 Shutting down gracefully..."));
    await configFlow.stop();
    process.exit(0);
});
