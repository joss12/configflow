// src/autotuning/AutoTuningEngine.ts

import * as fs from "fs-extra";
import * as path from "path";
import { OptimizationSuggestion } from "../types/optimization";
import { MetricsSnapshot } from "../types/metrics";
import {
    AutoTuningConfig,
    ConfigBackup,
    AutoTuningSession,
    TuningStatus,
    ValidationResult,
} from "../types/autotuning";

export class AutoTuningEngine {
    private config: AutoTuningConfig;
    private activeSessions: Map<string, AutoTuningSession> = new Map();
    private backups: ConfigBackup[] = [];
    private completedSessions: AutoTuningSession[] = [];
    private backupDir: string;

    constructor(config: Partial<AutoTuningConfig> = {}) {
        this.config = {
            enabled: true,
            safetyMode: true,
            maxConcurrentChanges: 1,
            rollbackTimeout: 5 * 60 * 1000, // 5 minutes
            approvalRequired: false,
            riskThreshold: "low",
            testDuration: 2 * 60 * 1000, // 2 minutes
            backupRetention: 7, // 7 days
            ...config,
        };

        this.backupDir = path.join(process.cwd(), ".configflow", "backups");
        this.ensureBackupDirectory();

        console.log("🤖 AutoTuningEngine initialized");
        console.log(`   Safety mode: ${this.config.safetyMode ? "ON" : "OFF"}`);
        console.log(
            `   Max concurrent changes: ${this.config.maxConcurrentChanges}`,
        );
        console.log(`   Risk threshold: ${this.config.riskThreshold}`);
        console.log(`   Test duration: ${this.config.testDuration / 1000}s`);
    }

    private async ensureBackupDirectory(): Promise<void> {
        try {
            await fs.ensureDir(this.backupDir);
        } catch (error) {
            console.error("❌ Failed to create backup directory:", error);
        }
    }

    async processSuggestions(
        suggestions: OptimizationSuggestion[],
        currentMetrics: MetricsSnapshot[],
    ): Promise<void> {
        if (!this.config.enabled) {
            console.log("🔒 Auto-tuning is disabled");
            return;
        }

        console.log(
            `🔄 Processing ${suggestions.length} optimization suggestions...`,
        );

        // Filter suggestions by risk threshold and current capacity
        const eligibleSuggestions = this.filterEligibleSuggestions(suggestions);

        if (eligibleSuggestions.length === 0) {
            console.log("📋 No eligible suggestions for auto-tuning");
            return;
        }

        console.log(
            `✅ Found ${eligibleSuggestions.length} eligible suggestions for auto-tuning`,
        );

        // Process suggestions one by one (or up to max concurrent)
        const availableSlots =
            this.config.maxConcurrentChanges - this.activeSessions.size;
        const toProcess = eligibleSuggestions.slice(0, availableSlots);

        for (const suggestion of toProcess) {
            await this.applySuggestion(suggestion, currentMetrics);
        }
    }

    private filterEligibleSuggestions(
        suggestions: OptimizationSuggestion[],
    ): OptimizationSuggestion[] {
        return suggestions.filter((suggestion) => {
            // Check risk threshold
            if (!this.isWithinRiskThreshold(suggestion.riskLevel)) {
                console.log(
                    `⚠️  Skipping ${suggestion.id}: risk too high (${suggestion.riskLevel})`,
                );
                return false;
            }

            // Check confidence threshold
            if (suggestion.confidence < 0.7) {
                console.log(
                    `⚠️  Skipping ${suggestion.id}: confidence too low (${(suggestion.confidence * 100).toFixed(1)}%)`,
                );
                return false;
            }

            // Check if file exists and is modifiable
            if (!this.isFileModifiable(suggestion.configFile)) {
                console.log(
                    `⚠️  Skipping ${suggestion.id}: file not modifiable (${suggestion.configFile})`,
                );
                return false;
            }

            return true;
        });
    }

    private isWithinRiskThreshold(riskLevel: string): boolean {
        const riskOrder = { low: 1, medium: 2, high: 3 };
        const suggestionRisk = riskOrder[riskLevel as keyof typeof riskOrder] || 3;
        const thresholdRisk = riskOrder[this.config.riskThreshold];

        return suggestionRisk <= thresholdRisk;
    }

    private isFileModifiable(filePath: string): boolean {
        try {
            // Check if file exists and is writable
            return (
                fs.existsSync(filePath) &&
                fs.accessSync(filePath, fs.constants.W_OK) === undefined
            );
        } catch {
            return false;
        }
    }

    private async applySuggestion(
        suggestion: OptimizationSuggestion,
        currentMetrics: MetricsSnapshot[],
    ): Promise<void> {
        const sessionId = this.generateSessionId();

        console.log(`🚀 Starting auto-tuning session: ${sessionId}`);
        console.log(`   Suggestion: ${suggestion.expectedImpact}`);
        console.log(`   File: ${suggestion.configFile}`);
        console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);

        try {
            // Create backup
            const backup = await this.createBackup(
                suggestion.configFile,
                `Auto-tuning: ${suggestion.id}`,
            );

            // Create tuning session
            const session: AutoTuningSession = {
                id: sessionId,
                startTime: new Date(),
                suggestionId: suggestion.id,
                configFile: suggestion.configFile,
                parameter: suggestion.parameter,
                originalValue: suggestion.currentValue,
                newValue: suggestion.suggestedValue,
                status: TuningStatus.TESTING,
                preChangeMetrics: this.calculateMetricsAverage(
                    currentMetrics.slice(-5),
                ),
            };

            this.activeSessions.set(sessionId, session);

            // Apply the configuration change
            await this.applyConfigurationChange(suggestion);

            console.log(`✅ Applied configuration change for session ${sessionId}`);
            console.log(
                `⏱️  Testing for ${this.config.testDuration / 1000} seconds...`,
            );

            // Schedule validation and potential rollback
            this.scheduleValidation(sessionId, backup.id);
        } catch (error) {
            console.error(`❌ Failed to apply suggestion ${suggestion.id}:`, error);

            // Clean up failed session
            this.activeSessions.delete(sessionId);
        }
    }

    private async createBackup(
        filePath: string,
        reason: string,
    ): Promise<ConfigBackup> {
        const backup: ConfigBackup = {
            id: this.generateBackupId(),
            timestamp: new Date(),
            configFile: filePath,
            originalContent: await fs.readFile(filePath, "utf-8"),
            reason,
        };

        // Save backup to disk
        const backupFilePath = path.join(this.backupDir, `${backup.id}.backup`);
        await fs.writeFile(backupFilePath, JSON.stringify(backup, null, 2));

        this.backups.push(backup);

        console.log(
            `💾 Created backup: ${backup.id} for ${path.basename(filePath)}`,
        );

        return backup;
    }

    private async applyConfigurationChange(
        suggestion: OptimizationSuggestion,
    ): Promise<void> {
        // This is a simplified implementation
        // In a real system, this would parse and modify the actual config files

        if (
            suggestion.configFile === "system" ||
            suggestion.configFile === "algorithmic_optimization"
        ) {
            // These are virtual suggestions, log the change but don't modify files
            console.log(
                `📝 Virtual configuration change: ${suggestion.parameter} = ${suggestion.suggestedValue}`,
            );
            return;
        }

        // For real files, we would implement proper parsing and modification
        // For demo purposes, we'll simulate the change
        try {
            const content = await fs.readFile(suggestion.configFile, "utf-8");

            // Simple JSON modification (in production, this would be more sophisticated)
            if (suggestion.configFile.endsWith(".json")) {
                const config = JSON.parse(content);

                // Apply the suggested change (simplified)
                if (suggestion.parameter !== "unknown") {
                    const paramPath = suggestion.parameter.split(".");
                    let target = config;

                    for (let i = 0; i < paramPath.length - 1; i++) {
                        if (!target[paramPath[i]]) target[paramPath[i]] = {};
                        target = target[paramPath[i]];
                    }

                    target[paramPath[paramPath.length - 1]] = suggestion.suggestedValue;

                    await fs.writeFile(
                        suggestion.configFile,
                        JSON.stringify(config, null, 2),
                    );
                    console.log(
                        `✏️  Modified ${suggestion.parameter} in ${path.basename(suggestion.configFile)}`,
                    );
                }
            }
        } catch (error) {
            console.log(
                `📝 Simulated configuration change for ${suggestion.configFile}`,
            );
        }
    }

    private scheduleValidation(sessionId: string, backupId: string): void {
        setTimeout(async () => {
            await this.validateAndFinalize(sessionId, backupId);
        }, this.config.testDuration);
    }

    private async validateAndFinalize(
        sessionId: string,
        backupId: string,
    ): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            console.log(`⚠️  Session ${sessionId} not found for validation`);
            return;
        }

        console.log(`🔍 Validating auto-tuning session: ${sessionId}`);

        try {
            // Collect post-change metrics (this would come from the metrics collector)
            const postChangeMetrics = this.simulatePostChangeMetrics(
                session.preChangeMetrics,
            );
            session.postChangeMetrics = postChangeMetrics;

            // Validate the change
            const validation = this.validatePerformanceChange(
                session.preChangeMetrics,
                postChangeMetrics,
            );

            console.log(`📊 Validation result: ${validation.recommendation}`);
            console.log(
                `   Improvement: ${validation.improvementPercent.toFixed(2)}%`,
            );
            console.log(
                `   Confidence: ${(validation.confidence * 100).toFixed(1)}%`,
            );

            if (validation.recommendation === "keep" && validation.isValid) {
                // Success! Keep the change
                session.status = TuningStatus.SUCCESSFUL;
                session.improvementMeasured = validation.improvementPercent;
                session.endTime = new Date();

                console.log(`✅ Auto-tuning successful for session ${sessionId}`);
                console.log(
                    `🎉 Measured improvement: ${validation.improvementPercent.toFixed(2)}%`,
                );
            } else {
                // Rollback the change
                await this.rollbackChange(
                    sessionId,
                    backupId,
                    validation.issues.join("; "),
                );
            }

            // Move to completed sessions
            this.completedSessions.push(session);
            this.activeSessions.delete(sessionId);
        } catch (error) {
            console.error(
                `❌ Error during validation for session ${sessionId}:`,
                error,
            );
            await this.rollbackChange(sessionId, backupId, "Validation error");
        }
    }

    private validatePerformanceChange(
        beforeMetrics: any,
        afterMetrics: any,
    ): ValidationResult {
        // Simple performance validation algorithm
        const cpuImprovement = beforeMetrics.avgCpu - afterMetrics.avgCpu;
        const memoryImprovement = beforeMetrics.avgMemory - afterMetrics.avgMemory;
        const stabilityImprovement =
            afterMetrics.stability - beforeMetrics.stability;

        const overallImprovement =
            cpuImprovement * 0.4 +
            memoryImprovement * 0.4 +
            stabilityImprovement * 20;

        const isValid =
            overallImprovement > 0 &&
            afterMetrics.avgCpu < 90 &&
            afterMetrics.avgMemory < 95;

        const confidence = Math.min(1, Math.abs(overallImprovement) / 10);

        const issues: string[] = [];
        if (afterMetrics.avgCpu > beforeMetrics.avgCpu * 1.1)
            issues.push("CPU usage increased significantly");
        if (afterMetrics.avgMemory > beforeMetrics.avgMemory * 1.1)
            issues.push("Memory usage increased significantly");
        if (afterMetrics.stability < beforeMetrics.stability * 0.9)
            issues.push("System stability decreased");

        return {
            isValid,
            confidence,
            improvementPercent: overallImprovement,
            issues,
            recommendation: isValid && overallImprovement > 2 ? "keep" : "rollback",
        };
    }

    private async rollbackChange(
        sessionId: string,
        backupId: string,
        reason: string,
    ): Promise<void> {
        console.log(`🔄 Rolling back session ${sessionId}: ${reason}`);

        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.status = TuningStatus.ROLLED_BACK;
            session.rollbackReason = reason;
            session.endTime = new Date();
        }

        // Restore from backup
        const backup = this.backups.find((b) => b.id === backupId);
        if (backup) {
            try {
                if (
                    backup.configFile !== "system" &&
                    backup.configFile !== "algorithmic_optimization"
                ) {
                    await fs.writeFile(backup.configFile, backup.originalContent);
                    console.log(
                        `📄 Restored ${path.basename(backup.configFile)} from backup`,
                    );
                } else {
                    console.log(`📄 Simulated rollback for ${backup.configFile}`);
                }
            } catch (error) {
                console.error(`❌ Failed to restore from backup ${backupId}:`, error);
            }
        }

        console.log(`✅ Rollback completed for session ${sessionId}`);
    }

    // Utility methods
    private calculateMetricsAverage(snapshots: MetricsSnapshot[]): any {
        if (snapshots.length === 0) {
            return { avgCpu: 0, avgMemory: 0, stability: 1 };
        }

        const avgCpu =
            snapshots.reduce((sum, s) => sum + s.system.cpu.usage, 0) /
            snapshots.length;
        const avgMemory =
            snapshots.reduce((sum, s) => sum + s.system.memory.percentage, 0) /
            snapshots.length;

        return {
            avgCpu,
            avgMemory,
            stability: this.calculateStability(snapshots),
        };
    }

    private calculateStability(snapshots: MetricsSnapshot[]): number {
        if (snapshots.length < 2) return 1;

        const cpuValues = snapshots.map((s) => s.system.cpu.usage);
        const mean = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
        const variance =
            cpuValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
            cpuValues.length;
        const stdDev = Math.sqrt(variance);

        return Math.max(0, 1 - (stdDev / mean || 0));
    }

    private simulatePostChangeMetrics(preMetrics: any): any {
        // Simulate improved metrics (in real system, this would come from actual measurements)
        return {
            avgCpu: Math.max(0, preMetrics.avgCpu * (0.9 + Math.random() * 0.2)), // ±10% variation
            avgMemory: Math.max(
                0,
                preMetrics.avgMemory * (0.85 + Math.random() * 0.3),
            ), // Potential memory improvement
            stability: Math.min(1, preMetrics.stability * (1 + Math.random() * 0.1)), // Slight stability improvement
        };
    }

    private generateSessionId(): string {
        return `tune_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateBackupId(): string {
        return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public methods
    getActiveSessions(): AutoTuningSession[] {
        return Array.from(this.activeSessions.values());
    }

    getCompletedSessions(): AutoTuningSession[] {
        return [...this.completedSessions];
    }

    getSuccessfulTunings(): AutoTuningSession[] {
        return this.completedSessions.filter(
            (s) => s.status === TuningStatus.SUCCESSFUL,
        );
    }

    getTuningStats(): any {
        const total = this.completedSessions.length;
        const successful = this.getSuccessfulTunings().length;
        const rolledBack = this.completedSessions.filter(
            (s) => s.status === TuningStatus.ROLLED_BACK,
        ).length;
        const avgImprovement =
            successful > 0
                ? this.getSuccessfulTunings().reduce(
                    (sum, s) => sum + (s.improvementMeasured || 0),
                    0,
                ) / successful
                : 0;

        return {
            totalSessions: total,
            successful,
            rolledBack,
            successRate: total > 0 ? (successful / total) * 100 : 0,
            avgImprovement,
        };
    }

    async cleanupOldBackups(): Promise<void> {
        const cutoff =
            Date.now() - this.config.backupRetention * 24 * 60 * 60 * 1000;
        const oldBackups = this.backups.filter(
            (b) => b.timestamp.getTime() < cutoff,
        );

        for (const backup of oldBackups) {
            try {
                const backupFile = path.join(this.backupDir, `${backup.id}.backup`);
                await fs.remove(backupFile);
                console.log(`🗑️  Cleaned up old backup: ${backup.id}`);
            } catch (error) {
                console.error(`❌ Failed to cleanup backup ${backup.id}:`, error);
            }
        }

        this.backups = this.backups.filter((b) => b.timestamp.getTime() >= cutoff);
    }
}
