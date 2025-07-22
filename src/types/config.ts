//The config file
// src/types/config.ts

export enum ConfigType {
    JSON = "json",
    YAML = "yaml",
    ENV = "env",
    INI = "ini",
    XML = "xml",
    PROPERTIES = "properties",
}

export interface ConfigFile {
    path: string;
    type: ConfigType;
    name: string;
    size: number;
    lastModified: Date;
    content?: any;
}

export interface ConfigParameter {
    key: string;
    value: any;
    type: string;
    path: string[];
    configFile: string;
}

export interface ConfigScanResult {
    files: ConfigFile[];
    parameters: ConfigParameter[];
    totalFiles: number;
    scanDuration: number;
}
