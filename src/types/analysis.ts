export interface ConfigChangeEvent {
    id: string;
    timestamp: Date;
    configFile: string;
    changeType: "added" | "modified" | "removed";
    parameter?: string;
    oldValue?: any;
    newValue?: any;
    configHash: string;
}

export interface PerformanceBaseline {
    configHash: string;
    timestamp: Date;
    metrics: {
        avgCpu: number;
        avgMemory: number;
        maxCpu: number;
        maxMemory: number;
        sampleCount: number;
    };
    stability: number; // 0-1, how stable the metrics are
}

export interface ImpactAnalysis {
    changeId: string;
    configFile: string;
    parameter?: string;
    impactScore: number; // -1 to 1, negative is bad, positive is good
    confidence: number; // 0-1, how confident we are in this ananlysis
    metrics: {
        cpuDelta: number;
        memoryDelta: number;
        stabilityDelta: number;
    };
    recommendation: string;
    evidence: string[];
}

export interface OptimizationSuggestion {
    id: string;
    priority: "low" | "medium" | "high" | "critical";
    type: "perfomance" | "stability" | "recource" | "security";
    configFile: string;
    parameter: string;
    currentValue: any;
    suggestValue: any;
    expectedImpact: string;
    reasoning: string[];
    confident: number;
}

export interface AnalysisConfig {
    minSampleSize: number;
    stabilityThreshold: number;
    significanceThreshold: number;
    analysisWindow: number; // milliseconds
}
