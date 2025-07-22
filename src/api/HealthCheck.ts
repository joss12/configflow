import { timeStamp } from "console";
import * as http from "http";
import { URL } from "url";

export interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    uptime: number;
    version1: string;
    components: {
        configScanner: ComponentStatus;
        metricsCollector: ComponentStatus;
        impatcAnalyzer: ComponentStatus;
        optimizationEngine: ComponentStatus;
        autoTuningEngine: ComponentStatus;
    };
    metrics: {
        configFilesMonitored: number;
        metricsCollected: number;
        suggestionGenerated: number;
        tuningSessionsCompleted: number;
        memoryUsage: number;
        cpuUsage: number;
    };
}

export interface ComponentStatus {
    status: "healthy" | "degraded" | "unhealthy";
    lastCheck: string;
    message?: string;
}

export class HealthCheckServer {
    private server?: http.Server;
    private port: number;
    private getHealthStatus: () => HealthStatus;

    constructor(port: number = 3001, getHealthStatus: () => HealthStatus) {
        this.port = port;
        this.getHealthStatus = getHealthStatus;
    }

    start(): void {
        this.server = http.createServer((req, res) => {
            const url = new URL(req.url || "", `http://localhost:${this.port}`);

            //Set CORS headers
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");

            if (req.method === "OPTIONS") {
                res.writeHead(200);
                res.end();
                return;
            }

            if (url.pathname === "/health" || url.pathname === "/") {
                this.handleHealthCheck(res);
            } else if (url.pathname === "/health/live") {
                this.handleLivenessCheck(res);
            } else if (url.pathname === "/health/ready") {
                this.handleReadinessCheck(res);
            } else {
                res.writeHead(404, { "content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Not found" }));
            }
        });

        this.server.listen(this.port, () => {
            console.log(
                `🏥 Health check server running on http://localhost:${this.port}/health`,
            );
        });
    }

    stop(): void {
        if (this.server) {
            this.server.close();
            console.log("🏥 Health check server stopped");
        }
    }

    private handleHealthCheck(res: http.ServerResponse): void {
        try {
            const health = this.getHealthStatus();
            const statusCode =
                health.status === "healthy"
                    ? 200
                    : health.status === "degraded"
                        ? 200
                        : 503;

            res.writeHead(statusCode, { "Content-Type": "application/json" });
            res.end(JSON.stringify(health, null, 2));
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    status: "unhealthy",
                    error: "Health check failed",
                    timestamp: new Date().toISOString(),
                }),
            );
        }
    }

    private handleLivenessCheck(res: http.ServerResponse): void {
        //Simple liveness check - just verify the process is running
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                status: "alive",
                timestamp: new Date().toISOString(),
            }),
        );
    }

    private handleReadinessCheck(res: http.ServerResponse): void {
        try {
            const health = this.getHealthStatus();
            const isReady =
                health.status === "healthy" || health.status === "degraded";
            const statusCode = isReady ? 200 : 503;

            res.writeHead(statusCode, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    status: isReady ? "ready" : "not_ready",
                    timestamp: health.components,
                }),
            );
        } catch (error) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    status: "not_ready",
                    error: "Readiness check failed",
                    timestamp: new Date().toISOString(),
                }),
            );
        }
    }
}
