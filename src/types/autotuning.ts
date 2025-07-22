// src/types/autotuning.ts

export interface AutoTuningConfig {
    enabled: boolean;
    safetyMode: boolean;
    maxConcurrentChanges: number;
    rollbackTimeout: number; // milliseconds
    approvalRequired: boolean;
    riskThreshold: "low" | "medium" | "high";
    testDuration: number; // milliseconds to test changes
    backupRetention: number; // days
}

export interface ConfigBackup {
    id: string;
    timestamp: Date;
    configFile: string;
    originalContent: string;
    reason: string;
    suggestionId?: string;
}

export interface AutoTuningSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    suggestionId: string;
    configFile: string;
    parameter: string;
    originalValue: any;
    newValue: any;
    status: TuningStatus;
    preChangeMetrics?: any;
    postChangeMetrics?: any;
    improvementMeasured?: number;
    rollbackReason?: string;
}

export enum TuningStatus {
    PENDING = "pending",
    TESTING = "testing",
    SUCCESSFUL = "successful",
    FAILED = "failed",
    ROLLED_BACK = "rolled_back",
    AWAITING_APPROVAL = "awaiting_approval",
}

export interface PerformanceValidator {
    validate(beforeMetrics: any, afterMetrics: any): ValidationResult;
}

export interface ValidationResult {
    isValid: boolean;
    confidence: number;
    improvementPercent: number;
    issues: string[];
    recommendation: "keep" | "rollback" | "continue_testing";
}
