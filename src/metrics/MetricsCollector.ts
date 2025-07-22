// src/metrics/MetricsCollector.ts

import * as os from "os";
import pidusage from "pidusage";
import {
    SystemMetrics,
    ApplicationMetrics,
    MetricsSnapshot,
    MetricsCollectionConfig,
} from "../types/metrics";
import { createHash } from "crypto";

export class MetricsCollector {
    private config: MetricsCollectionConfig;
    private isCollecting: boolean = false;
    private intervalId?: NodeJS.Timeout;
    private metricsHistory: MetricsSnapshot[] = [];
    private requestCount: number = 0;
    private errorCount: number = 0;
    private responseTimes: number[] = [];
    private startTime: Date = new Date();

    constructor(config: Partial<MetricsCollectionConfig> = {}) {
        this.config = {
            interval: 5000, // 5 seconds
            retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
            enableSystemMetrics: true,
            enableApplicationMetrics: true,
            customMetrics: [],
            ...config,
        };

        console.log("📊 MetricsCollector initialized");
        console.log(`   Interval: ${this.config.interval}ms`);
        console.log(
            `   Retention: ${this.config.retentionPeriod / 1000 / 60} minutes`,
        );
    }

    async startCollection(): Promise<void> {
        if (this.isCollecting) {
            console.log("⚠️  Metrics collection already running");
            return;
        }

        console.log("🔄 Starting metrics collection...");

        this.isCollecting = true;
        this.startTime = new Date();

        // Collect initial snapshot
        await this.collectSnapshot();

        // Start periodic collection
        this.intervalId = setInterval(async () => {
            try {
                await this.collectSnapshot();
                this.cleanupOldMetrics();
            } catch (error) {
                console.error("❌ Error collecting metrics:", error);
            }
        }, this.config.interval);

        console.log("✅ Metrics collection started");
    }

    async stopCollection(): Promise<void> {
        if (!this.isCollecting) {
            console.log("⚠️  Metrics collection not running");
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }

        this.isCollecting = false;
        console.log("🛑 Metrics collection stopped");
    }

    private async collectSnapshot(): Promise<void> {
        const timestamp = new Date();
        const id = this.generateSnapshotId();

        const snapshot: MetricsSnapshot = {
            id,
            timestamp,
            system: await this.collectSystemMetrics(),
            configHash: this.generateConfigHash(),
            tags: {
                version: "1.0.0",
                environment: process.env.NODE_ENV || "development",
            },
        };

        if (this.config.enableApplicationMetrics) {
            snapshot.application = this.collectApplicationMetrics();
        }

        this.metricsHistory.push(snapshot);

        // Log summary every 10 collections
        if (this.metricsHistory.length % 10 === 0) {
            this.logMetricsSummary(snapshot);
        }
    }

    private async collectSystemMetrics(): Promise<SystemMetrics> {
        const processStats = await pidusage(process.pid);
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        return {
            timestamp: new Date(),
            cpu: {
                usage: processStats.cpu,
                loadAverage: os.loadavg(),
            },
            memory: {
                used: usedMemory,
                total: totalMemory,
                percentage: (usedMemory / totalMemory) * 100,
            },
            process: {
                pid: process.pid,
                cpu: processStats.cpu,
                memory: processStats.memory,
                uptime: process.uptime(),
            },
        };
    }

    private collectApplicationMetrics(): ApplicationMetrics {
        const now = Date.now();
        const uptime = now - this.startTime.getTime();
        const avgResponseTime =
            this.responseTimes.length > 0
                ? this.responseTimes.reduce((a, b) => a + b, 0) /
                this.responseTimes.length
                : 0;

        const errorRate =
            this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
        const throughput = uptime > 0 ? this.requestCount / (uptime / 1000) : 0;

        return {
            timestamp: new Date(),
            responseTime: avgResponseTime,
            requestCount: this.requestCount,
            errorRate,
            throughput,
            activeConnections: 0, // Would be populated by application
            customMetrics: {},
        };
    }

    private generateConfigHash(): string {
        // This would normally hash the current configuration
        // For now, we'll use a simple timestamp-based hash
        const configData = {
            timestamp: Date.now(),
            nodeVersion: process.version,
            platform: os.platform(),
        };

        return createHash("md5").update(JSON.stringify(configData)).digest("hex");
    }

    private generateSnapshotId(): string {
        return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private cleanupOldMetrics(): void {
        const cutoff = Date.now() - this.config.retentionPeriod;
        const originalLength = this.metricsHistory.length;

        this.metricsHistory = this.metricsHistory.filter(
            (snapshot) => snapshot.timestamp.getTime() > cutoff,
        );

        const removed = originalLength - this.metricsHistory.length;
        if (removed > 0) {
            console.log(`🧹 Cleaned up ${removed} old metrics snapshots`);
        }
    }

    private logMetricsSummary(snapshot: MetricsSnapshot): void {
        const sys = snapshot.system;
        console.log(`📊 Metrics Summary:`);
        console.log(`   CPU: ${sys.cpu.usage.toFixed(1)}%`);
        console.log(
            `   Memory: ${sys.memory.percentage.toFixed(1)}% (${this.formatBytes(sys.memory.used)})`,
        );
        console.log(`   Process Memory: ${this.formatBytes(sys.process.memory)}`);
        console.log(`   Uptime: ${this.formatUptime(sys.process.uptime)}`);
        console.log(`   Snapshots: ${this.metricsHistory.length}`);
    }

    private formatBytes(bytes: number): string {
        const sizes = ["B", "KB", "MB", "GB"];
        if (bytes === 0) return "0 B";
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    private formatUptime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}h ${minutes}m ${secs}s`;
    }

    // Public methods for application to report metrics
    recordRequest(responseTime: number): void {
        this.requestCount++;
        this.responseTimes.push(responseTime);

        // Keep only last 100 response times for average calculation
        if (this.responseTimes.length > 100) {
            this.responseTimes.shift();
        }
    }

    recordError(): void {
        this.errorCount++;
    }

    getMetricsHistory(): MetricsSnapshot[] {
        return [...this.metricsHistory];
    }

    getLatestMetrics(): MetricsSnapshot | undefined {
        return this.metricsHistory[this.metricsHistory.length - 1];
    }

    getMetricsCount(): number {
        return this.metricsHistory.length;
    }

    isCollectionActive(): boolean {
        return this.isCollecting;
    }
}
