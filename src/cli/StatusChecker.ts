// src/cli/StatusChecker.ts

import chalk from "chalk";
import * as fs from "fs-extra";
import * as path from "path";
const Table = require("cli-table3");
import { StatusInfo } from "../types/cli";

export class StatusChecker {
    private statusFile: string;

    constructor() {
        this.statusFile = path.join(process.cwd(), ".configflow", "status.json");
    }

    async displayStatus(format: string = "table"): Promise<void> {
        try {
            const status = await this.getStatus();

            if (format === "json") {
                console.log(JSON.stringify(status, null, 2));
            } else {
                this.displayTableStatus(status);
            }
        } catch (error) {
            console.error(chalk.red("❌ Failed to get status:"), error);
            this.displayOfflineStatus();
        }
    }

    private async getStatus(): Promise<StatusInfo> {
        // In a real implementation, this would connect to the running ConfigFlow instance
        // For demo purposes, we'll simulate the status

        const isRunning = await this.checkIfRunning();

        if (!isRunning) {
            throw new Error("ConfigFlow is not running");
        }

        return {
            isRunning: true,
            uptime: this.getRandomUptime(),
            configFilesMonitored: 2040,
            metricsCollected: 156,
            analysesPerformed: 23,
            suggestionsGenerated: 8,
            tuningSessionsCompleted: 12,
            successRate: 83.3,
            lastActivity: new Date(Date.now() - 30000), // 30 seconds ago
            systemResources: {
                cpu: 2.1,
                memory: 52.4,
                processMemory: 198.2,
            },
        };
    }

    private displayTableStatus(status: StatusInfo): void {
        console.log(chalk.green("✅ ConfigFlow Status - RUNNING\n"));

        // System Status Table
        const systemTable = new Table({
            head: [
                chalk.cyan("Component"),
                chalk.cyan("Status"),
                chalk.cyan("Details"),
            ],
            style: { head: [], border: [] },
        });

        systemTable.push(
            [
                "ConfigFlow Engine",
                chalk.green("🟢 Running"),
                `Uptime: ${this.formatUptime(status.uptime)}`,
            ],
            [
                "Configuration Scanner",
                chalk.green("🟢 Active"),
                `${status.configFilesMonitored} files monitored`,
            ],
            [
                "Metrics Collector",
                chalk.green("🟢 Active"),
                `${status.metricsCollected} snapshots collected`,
            ],
            [
                "Impact Analyzer",
                chalk.green("🟢 Active"),
                `${status.analysesPerformed} analyses performed`,
            ],
            [
                "Optimization Engine",
                chalk.green("🟢 Active"),
                `${status.suggestionsGenerated} suggestions generated`,
            ],
            [
                "Auto-tuning Engine",
                chalk.green("🟢 Active"),
                `${status.tuningSessionsCompleted} sessions completed`,
            ],
        );

        console.log(systemTable.toString());

        // Performance Table
        console.log(chalk.white("\n📊 System Performance:"));
        const perfTable = new Table({
            head: [
                chalk.cyan("Metric"),
                chalk.cyan("Current Value"),
                chalk.cyan("Status"),
            ],
            style: { head: [], border: [] },
        });

        perfTable.push(
            [
                "CPU Usage",
                `${status.systemResources.cpu.toFixed(1)}%`,
                this.getResourceStatus(status.systemResources.cpu, "cpu"),
            ],
            [
                "Memory Usage",
                `${status.systemResources.memory.toFixed(1)}%`,
                this.getResourceStatus(status.systemResources.memory, "memory"),
            ],
            [
                "Process Memory",
                `${status.systemResources.processMemory.toFixed(1)} MB`,
                this.getResourceStatus(status.systemResources.processMemory, "process"),
            ],
        );

        console.log(perfTable.toString());

        // Activity Summary
        console.log(chalk.white("\n🎯 Activity Summary:"));
        const activityTable = new Table({
            head: [
                chalk.cyan("Activity"),
                chalk.cyan("Count"),
                chalk.cyan("Performance"),
            ],
            style: { head: [], border: [] },
        });

        activityTable.push(
            [
                "Auto-tuning Success Rate",
                `${status.successRate.toFixed(1)}%`,
                status.successRate > 80
                    ? chalk.green("🎯 Excellent")
                    : chalk.yellow("⚠️ Good"),
            ],
            ["Configuration Changes", "Real-time", chalk.green("🔄 Monitoring")],
            ["Performance Analysis", "Continuous", chalk.green("📊 Active")],
            [
                "Last Activity",
                this.formatTimestamp(status.lastActivity),
                chalk.green("🕒 Recent"),
            ],
        );

        console.log(activityTable.toString());

        // Quick Actions
        console.log(chalk.white("\n💡 Quick Actions:"));
        console.log(
            chalk.cyan("   npm run cli report          - Generate detailed report"),
        );
        console.log(
            chalk.cyan(
                "   npm run cli suggestions     - View optimization suggestions",
            ),
        );
        console.log(
            chalk.cyan(
                "   npm run cli tuning --stats  - View auto-tuning statistics",
            ),
        );
        console.log(
            chalk.cyan("   npm run cli metrics         - View performance metrics"),
        );
    }

    private displayOfflineStatus(): void {
        console.log(chalk.red("❌ ConfigFlow Status - OFFLINE\n"));

        const table = new Table({
            head: [chalk.cyan("Component"), chalk.cyan("Status")],
            style: { head: [], border: [] },
        });

        table.push(
            ["ConfigFlow Engine", chalk.red("🔴 Not Running")],
            ["Configuration Scanner", chalk.gray("⚫ Inactive")],
            ["Metrics Collector", chalk.gray("⚫ Inactive")],
            ["Impact Analyzer", chalk.gray("⚫ Inactive")],
            ["Optimization Engine", chalk.gray("⚫ Inactive")],
            ["Auto-tuning Engine", chalk.gray("⚫ Inactive")],
        );

        console.log(table.toString());

        console.log(chalk.white("\n🚀 To start ConfigFlow:"));
        console.log(chalk.green("   npm run dev"));

        console.log(chalk.white("\n💡 Alternative commands:"));
        console.log(
            chalk.cyan("   npm run cli start    - Start ConfigFlow (daemon mode)"),
        );
        console.log(
            chalk.cyan("   npm run cli info     - Show information about ConfigFlow"),
        );
    }

    private async checkIfRunning(): Promise<boolean> {
        try {
            // In a real implementation, this would check for:
            // - Process PID file
            // - Socket connection
            // - HTTP health endpoint
            // - Process list grep

            // For demo, we'll simulate based on recent activity
            const statusExists = await fs.pathExists(this.statusFile);
            if (!statusExists) {
                return false;
            }

            const statusData = await fs.readJson(this.statusFile);
            const lastUpdate = new Date(statusData.lastUpdate);
            const timeDiff = Date.now() - lastUpdate.getTime();

            // Consider running if updated within last 2 minutes
            return timeDiff < 2 * 60 * 1000;
        } catch {
            return false;
        }
    }

    private getResourceStatus(
        value: number,
        type: "cpu" | "memory" | "process",
    ): string {
        switch (type) {
            case "cpu":
                if (value < 10) return chalk.green("✅ Low");
                if (value < 50) return chalk.yellow("⚠️ Medium");
                return chalk.red("🔴 High");

            case "memory":
                if (value < 70) return chalk.green("✅ Normal");
                if (value < 85) return chalk.yellow("⚠️ High");
                return chalk.red("🔴 Critical");

            case "process":
                if (value < 250) return chalk.green("✅ Normal");
                if (value < 500) return chalk.yellow("⚠️ High");
                return chalk.red("🔴 Excessive");

            default:
                return chalk.gray("❓ Unknown");
        }
    }

    private formatUptime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    private formatTimestamp(date: Date): string {
        const diff = Date.now() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return `${seconds}s ago`;
        }
    }

    private getRandomUptime(): number {
        // Simulate random uptime between 30 seconds and 4 hours
        return Math.floor(Math.random() * 14400) + 30;
    }

    async updateStatus(status: Partial<StatusInfo>): Promise<void> {
        try {
            await fs.ensureDir(path.dirname(this.statusFile));

            const currentStatus = await this.getStatus().catch(() => ({
                isRunning: false,
                uptime: 0,
                configFilesMonitored: 0,
                metricsCollected: 0,
                analysesPerformed: 0,
                suggestionsGenerated: 0,
                tuningSessionsCompleted: 0,
                successRate: 0,
                lastActivity: new Date(),
                systemResources: { cpu: 0, memory: 0, processMemory: 0 },
            }));

            const updatedStatus = {
                ...currentStatus,
                ...status,
                lastUpdate: new Date().toISOString(),
            };

            await fs.writeJson(this.statusFile, updatedStatus, { spaces: 2 });
        } catch (error) {
            console.error(chalk.red("❌ Failed to update status:"), error);
        }
    }
}
