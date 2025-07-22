// src/analysis/ImpactAnalyzer.ts

import { MetricsSnapshot } from "../types/metrics";
import {
    ConfigChangeEvent,
    PerformanceBaseline,
    ImpactAnalysis,
    AnalysisConfig,
} from "../types/analysis";
import { createHash } from "crypto";

export class ImpactAnalyzer {
    private config: AnalysisConfig;
    private baselines: Map<string, PerformanceBaseline> = new Map();
    private changeHistory: ConfigChangeEvent[] = [];
    private analysisResults: ImpactAnalysis[] = [];

    constructor(config: Partial<AnalysisConfig> = {}) {
        this.config = {
            minSampleSize: 5,
            stabilityThreshold: 0.15, // 15% variation considered stable
            significanceThreshold: 0.05, // 5% change considered significant
            analysisWindow: 5 * 60 * 1000, // 5 minutes
            ...config,
        };

        console.log("🧠 ImpactAnalyzer initialized");
        console.log(`   Analysis window: ${this.config.analysisWindow / 1000}s`);
        console.log(`   Min samples: ${this.config.minSampleSize}`);
    }

    recordConfigChange(
        configFile: string,
        changeType: "added" | "modified" | "removed",
    ): void {
        const changeEvent: ConfigChangeEvent = {
            id: this.generateChangeId(),
            timestamp: new Date(),
            configFile,
            changeType,
            configHash: this.generateConfigHash(configFile, Date.now()),
        };

        this.changeHistory.push(changeEvent);
        console.log(`📝 Recorded config change: ${changeType} in ${configFile}`);

        // Keep only recent changes
        this.cleanupOldChanges();
    }

    async analyzeMetrics(metricsHistory: MetricsSnapshot[]): Promise<void> {
        if (metricsHistory.length < this.config.minSampleSize) {
            console.log("📊 Not enough metrics for analysis yet");
            return;
        }

        console.log(`🔍 Analyzing ${metricsHistory.length} metric snapshots...`);

        // Update baselines for current configuration
        await this.updateBaselines(metricsHistory);

        // Analyze impact of recent changes
        await this.analyzeRecentChanges(metricsHistory);

        console.log(
            `✅ Analysis complete. ${this.analysisResults.length} impact analyses recorded.`,
        );
    }

    private async updateBaselines(
        metricsHistory: MetricsSnapshot[],
    ): Promise<void> {
        // Group metrics by configuration hash
        const configGroups = new Map<string, MetricsSnapshot[]>();

        metricsHistory.forEach((snapshot) => {
            if (!configGroups.has(snapshot.configHash)) {
                configGroups.set(snapshot.configHash, []);
            }
            configGroups.get(snapshot.configHash)!.push(snapshot);
        });

        // Create or update baselines for each configuration
        for (const [configHash, snapshots] of configGroups) {
            if (snapshots.length >= this.config.minSampleSize) {
                const baseline = this.calculateBaseline(configHash, snapshots);
                this.baselines.set(configHash, baseline);
            }
        }

        console.log(`📊 Updated ${this.baselines.size} performance baselines`);
    }

    private calculateBaseline(
        configHash: string,
        snapshots: MetricsSnapshot[],
    ): PerformanceBaseline {
        const cpuValues = snapshots.map((s) => s.system.cpu.usage);
        const memoryValues = snapshots.map((s) => s.system.memory.percentage);

        const avgCpu = this.average(cpuValues);
        const avgMemory = this.average(memoryValues);
        const maxCpu = Math.max(...cpuValues);
        const maxMemory = Math.max(...memoryValues);

        // Calculate stability (lower coefficient of variation = more stable)
        const cpuStability = this.calculateStability(cpuValues);
        const memoryStability = this.calculateStability(memoryValues);
        const overallStability = (cpuStability + memoryStability) / 2;

        return {
            configHash,
            timestamp: new Date(),
            metrics: {
                avgCpu,
                avgMemory,
                maxCpu,
                maxMemory,
                sampleCount: snapshots.length,
            },
            stability: overallStability,
        };
    }

    private async analyzeRecentChanges(
        metricsHistory: MetricsSnapshot[],
    ): Promise<void> {
        const recentChanges = this.getRecentChanges();

        for (const change of recentChanges) {
            const analysis = await this.analyzeChangeImpact(change, metricsHistory);
            if (analysis) {
                this.analysisResults.push(analysis);
                this.logImpactAnalysis(analysis);
            }
        }
    }

    private async analyzeChangeImpact(
        change: ConfigChangeEvent,
        metricsHistory: MetricsSnapshot[],
    ): Promise<ImpactAnalysis | null> {
        // Get metrics before and after the change
        const beforeMetrics = metricsHistory.filter(
            (m) =>
                m.timestamp < change.timestamp &&
                m.timestamp.getTime() >
                change.timestamp.getTime() - this.config.analysisWindow,
        );

        const afterMetrics = metricsHistory.filter(
            (m) =>
                m.timestamp > change.timestamp &&
                m.timestamp.getTime() <
                change.timestamp.getTime() + this.config.analysisWindow,
        );

        if (beforeMetrics.length < 3 || afterMetrics.length < 3) {
            return null; // Not enough data
        }

        // Calculate performance deltas
        const beforeAvgCpu = this.average(
            beforeMetrics.map((m) => m.system.cpu.usage),
        );
        const afterAvgCpu = this.average(
            afterMetrics.map((m) => m.system.cpu.usage),
        );
        const cpuDelta = afterAvgCpu - beforeAvgCpu;

        const beforeAvgMemory = this.average(
            beforeMetrics.map((m) => m.system.memory.percentage),
        );
        const afterAvgMemory = this.average(
            afterMetrics.map((m) => m.system.memory.percentage),
        );
        const memoryDelta = afterAvgMemory - beforeAvgMemory;

        const beforeStability = this.calculateStability(
            beforeMetrics.map((m) => m.system.cpu.usage),
        );
        const afterStability = this.calculateStability(
            afterMetrics.map((m) => m.system.cpu.usage),
        );
        const stabilityDelta = afterStability - beforeStability;

        // Calculate impact score and confidence
        const impactScore = this.calculateImpactScore(
            cpuDelta,
            memoryDelta,
            stabilityDelta,
        );
        const confidence = this.calculateConfidence(
            beforeMetrics.length,
            afterMetrics.length,
            Math.abs(impactScore),
        );

        // Generate evidence and recommendation
        const evidence = this.generateEvidence(
            cpuDelta,
            memoryDelta,
            stabilityDelta,
        );
        const recommendation = this.generateRecommendation(
            impactScore,
            change.configFile,
        );

        return {
            changeId: change.id,
            configFile: change.configFile,
            parameter: change.parameter,
            impactScore,
            confidence,
            metrics: {
                cpuDelta,
                memoryDelta,
                stabilityDelta,
            },
            recommendation,
            evidence,
        };
    }

    private calculateImpactScore(
        cpuDelta: number,
        memoryDelta: number,
        stabilityDelta: number,
    ): number {
        // Negative values are bad (increased resource usage, decreased stability)
        // Positive values are good (decreased resource usage, increased stability)

        let score = 0;

        // CPU impact (weight: 0.4)
        score -= (cpuDelta / 100) * 0.4;

        // Memory impact (weight: 0.3)
        score -= (memoryDelta / 100) * 0.3;

        // Stability impact (weight: 0.3)
        score += stabilityDelta * 0.3;

        // Clamp to [-1, 1]
        return Math.max(-1, Math.min(1, score));
    }

    private calculateConfidence(
        beforeSamples: number,
        afterSamples: number,
        impactMagnitude: number,
    ): number {
        const minSamples = Math.min(beforeSamples, afterSamples);
        const sampleConfidence = Math.min(1, minSamples / 10); // More samples = higher confidence
        const magnitudeConfidence = Math.min(1, impactMagnitude * 10); // Larger impact = higher confidence

        return (sampleConfidence + magnitudeConfidence) / 2;
    }

    private generateEvidence(
        cpuDelta: number,
        memoryDelta: number,
        stabilityDelta: number,
    ): string[] {
        const evidence: string[] = [];

        if (Math.abs(cpuDelta) > this.config.significanceThreshold * 100) {
            evidence.push(
                `CPU usage ${cpuDelta > 0 ? "increased" : "decreased"} by ${Math.abs(cpuDelta).toFixed(2)}%`,
            );
        }

        if (Math.abs(memoryDelta) > this.config.significanceThreshold * 100) {
            evidence.push(
                `Memory usage ${memoryDelta > 0 ? "increased" : "decreased"} by ${Math.abs(memoryDelta).toFixed(2)}%`,
            );
        }

        if (Math.abs(stabilityDelta) > this.config.significanceThreshold) {
            evidence.push(
                `System stability ${stabilityDelta > 0 ? "improved" : "degraded"} by ${Math.abs(stabilityDelta * 100).toFixed(1)}%`,
            );
        }

        if (evidence.length === 0) {
            evidence.push("No significant performance impact detected");
        }

        return evidence;
    }

    private generateRecommendation(
        impactScore: number,
        configFile: string,
    ): string {
        if (impactScore > 0.3) {
            return `✅ Positive impact detected. Consider keeping this configuration change in ${configFile}.`;
        } else if (impactScore < -0.3) {
            return `⚠️ Negative impact detected. Consider reverting changes to ${configFile}.`;
        } else if (Math.abs(impactScore) < 0.1) {
            return `ℹ️ Minimal impact detected. Configuration change in ${configFile} appears neutral.`;
        } else {
            return `📊 Minor impact detected. Monitor ${configFile} for additional changes.`;
        }
    }

    private logImpactAnalysis(analysis: ImpactAnalysis): void {
        const icon =
            analysis.impactScore > 0
                ? "📈"
                : analysis.impactScore < -0.2
                    ? "📉"
                    : "📊";
        console.log(`${icon} Impact Analysis: ${analysis.configFile}`);
        console.log(
            `   Score: ${analysis.impactScore.toFixed(3)} (confidence: ${(analysis.confidence * 100).toFixed(1)}%)`,
        );
        console.log(`   ${analysis.recommendation}`);
        if (analysis.evidence.length > 0) {
            console.log(`   Evidence: ${analysis.evidence[0]}`);
        }
    }

    // Utility methods
    private average(numbers: number[]): number {
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    private calculateStability(values: number[]): number {
        if (values.length < 2) return 1;

        const mean = this.average(values);
        const variance =
            values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
            values.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

        // Convert to stability score (lower variation = higher stability)
        return Math.max(0, 1 - coefficientOfVariation);
    }

    private getRecentChanges(): ConfigChangeEvent[] {
        const cutoff = Date.now() - this.config.analysisWindow;
        return this.changeHistory.filter(
            (change) => change.timestamp.getTime() > cutoff,
        );
    }

    private cleanupOldChanges(): void {
        const cutoff = Date.now() - this.config.analysisWindow * 2;
        this.changeHistory = this.changeHistory.filter(
            (change) => change.timestamp.getTime() > cutoff,
        );
    }

    private generateChangeId(): string {
        return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateConfigHash(configFile: string, timestamp: number): string {
        return createHash("md5").update(`${configFile}_${timestamp}`).digest("hex");
    }

    // Public getters
    getAnalysisResults(): ImpactAnalysis[] {
        return [...this.analysisResults];
    }

    getBaselines(): PerformanceBaseline[] {
        return Array.from(this.baselines.values());
    }

    getChangeHistory(): ConfigChangeEvent[] {
        return [...this.changeHistory];
    }
}
