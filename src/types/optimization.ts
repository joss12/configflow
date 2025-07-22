// src/types/optimization.ts

export interface OptimizationRule {
    id: string;
    name: string;
    description: string;
    configPattern: string; // regex or glob pattern
    parameterPattern: string;
    condition: (value: any, metrics: any) => boolean;
    suggestion: (currentValue: any, metrics: any) => OptimizationSuggestion;
    priority: OptimizationPriority;
    category: OptimizationCategory;
}

export enum OptimizationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical",
}

export enum OptimizationCategory {
    PERFORMANCE = "performance",
    MEMORY = "memory",
    STABILITY = "stability",
    SECURITY = "security",
    RESOURCE = "resource",
}

export interface OptimizationSuggestion {
    id: string;
    timestamp: Date;
    priority: OptimizationPriority;
    category: OptimizationCategory;
    configFile: string;
    parameter: string;
    currentValue: any;
    suggestedValue: any;
    expectedImpact: string;
    reasoning: string[];
    confidence: number; // 0-1
    estimatedGain: {
        cpu?: number; // percentage improvement
        memory?: number; // percentage improvement
        stability?: number; // 0-1 improvement
    };
    riskLevel: "low" | "medium" | "high";
    rollbackPlan: string;
}

export interface OptimizationEngine {
    generateSuggestions(): Promise<OptimizationSuggestion[]>;
    applySuggestion(suggestionId: string): Promise<boolean>;
    rollbackSuggestion(suggestionId: string): Promise<boolean>;
    validateSuggestion(suggestion: OptimizationSuggestion): Promise<boolean>;
}

export interface OptimizationSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    suggestionsGenerated: number;
    suggestionsApplied: number;
    improvementsMeasured: {
        avgCpuImprovement: number;
        avgMemoryImprovement: number;
        stabilityImprovement: number;
    };
    status: "active" | "completed" | "cancelled";
}
