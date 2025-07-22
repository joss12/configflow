// src/types/cli.ts

export interface CLIConfig {
    configPath?: string;
    outputFormat: "table" | "json" | "csv";
    verbose: boolean;
    quiet: boolean;
    interactive: boolean;
}

export interface ReportOptions {
    type: "summary" | "detailed" | "performance" | "suggestions" | "tuning";
    timeRange?: string; // '1h', '24h', '7d', 'all'
    format: "table" | "json" | "csv" | "markdown";
    output?: string; // file path
    filter?: {
        priority?: string[];
        category?: string[];
        status?: string[];
    };
}

export interface StatusInfo {
    isRunning: boolean;
    uptime: number;
    configFilesMonitored: number;
    metricsCollected: number;
    analysesPerformed: number;
    suggestionsGenerated: number;
    tuningSessionsCompleted: number;
    successRate: number;
    lastActivity: Date;
    systemResources: {
        cpu: number;
        memory: number;
        processMemory: number;
    };
}

export interface CommandResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}
