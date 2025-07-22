export interface SystemMetrics {
    timestamp: Date;
    cpu: {
        usage: number; // percentage
        loadAverage: number[];
    };

    memory: {
        used: number; //bytes
        total: number; // bytes
        percentage: number;
    };
    process: {
        pid: number;
        cpu: number;
        memory: number;
        uptime: number;
    };
}

export interface ApplicationMetrics {
    timestamp: Date;
    responseTime: number; // milliseconds
    requestCount: number;
    errorRate: number; //percentage
    throughput: number; // request per second
    activeConnections: number;
    customMetrics: Record<string, number>;
}

export interface MetricsSnapshot {
    id: string;
    timestamp: Date;
    system: SystemMetrics;
    application?: ApplicationMetrics;
    configHash: string; // Hash of current configuration
    tags: Record<string, string>;
}

export interface MetricsCollectionConfig {
    interval: number; //milliseconds
    retentionPeriod: number; // milliseconds
    enableSystemMetrics: boolean;
    enableApplicationMetrics: boolean;
    customMetrics: string[];
}
