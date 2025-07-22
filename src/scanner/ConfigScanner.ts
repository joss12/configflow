// src/scanner/ConfigScanner.ts

import * as fs from "fs-extra";
import * as path from "path";
import * as chokidar from "chokidar";
import {
    ConfigFile,
    ConfigType,
    ConfigScanResult,
    ConfigParameter,
} from "../types/config";

export class ConfigScanner {
    private watchPath: string;
    private watcher?: chokidar.FSWatcher;
    private configFiles: Map<string, ConfigFile> = new Map();

    // Common configuration file patterns
    private readonly CONFIG_PATTERNS = [
        "**/*.json",
        "**/*.yaml",
        "**/*.yml",
        "**/.env*",
        "**/*.ini",
        "**/*.conf",
        "**/*.config",
        "**/*.properties",
        "**/config.*",
        "**/settings.*",
    ];

    // Files to exclude from scanning
    private readonly EXCLUDE_PATTERNS = [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.git/**",
        "**/logs/**",
        "**/tmp/**",
    ];

    constructor(watchPath: string = process.cwd()) {
        this.watchPath = watchPath;
        console.log(`🔍 ConfigScanner initialized for: ${watchPath}`);
    }

    async scanConfigurations(): Promise<ConfigScanResult> {
        const startTime = Date.now();
        console.log(`📂 Scanning for configuration files in: ${this.watchPath}`);

        try {
            const files = await this.findConfigFiles();
            const parameters = await this.extractParameters(files);

            const result: ConfigScanResult = {
                files,
                parameters,
                totalFiles: files.length,
                scanDuration: Date.now() - startTime,
            };

            console.log(
                `✅ Found ${files.length} configuration files in ${result.scanDuration}ms`,
            );
            this.logFoundFiles(files);

            return result;
        } catch (error) {
            console.error("❌ Error scanning configurations:", error);
            throw error;
        }
    }

    private async findConfigFiles(): Promise<ConfigFile[]> {
        const files: ConfigFile[] = [];

        for (const pattern of this.CONFIG_PATTERNS) {
            const globPath = path.join(this.watchPath, pattern);
            await this.scanPattern(globPath, files);
        }

        return files;
    }

    private async scanPattern(
        pattern: string,
        files: ConfigFile[],
    ): Promise<void> {
        try {
            const entries = await fs.readdir(this.watchPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(this.watchPath, entry.name);

                // Skip excluded directories
                if (entry.isDirectory() && this.shouldExclude(entry.name)) {
                    continue;
                }

                if (entry.isFile() && this.isConfigFile(entry.name)) {
                    const stats = await fs.stat(fullPath);
                    const configFile: ConfigFile = {
                        path: fullPath,
                        type: this.detectConfigType(entry.name),
                        name: entry.name,
                        size: stats.size,
                        lastModified: stats.mtime,
                    };

                    files.push(configFile);
                    this.configFiles.set(fullPath, configFile);
                }

                // Recursively scan subdirectories
                if (entry.isDirectory() && !this.shouldExclude(entry.name)) {
                    const scanner = new ConfigScanner(fullPath);
                    const subFiles = await scanner.findConfigFiles();
                    files.push(...subFiles);
                }
            }
        } catch (error) {
            // Skip directories we can't read
            console.warn(`⚠️  Cannot scan: ${pattern}`);
        }
    }

    private isConfigFile(filename: string): boolean {
        const configIndicators = [
            ".json",
            ".yaml",
            ".yml",
            ".env",
            ".ini",
            ".conf",
            ".config",
            ".properties",
        ];

        const commonConfigNames = [
            "config",
            "settings",
            "configuration",
            "app",
            "server",
            "database",
            "redis",
        ];

        const ext = path.extname(filename).toLowerCase();
        const basename = path.basename(filename, ext).toLowerCase();

        return (
            configIndicators.includes(ext) ||
            commonConfigNames.some((name) => basename.includes(name)) ||
            filename.startsWith(".env")
        );
    }

    private shouldExclude(dirName: string): boolean {
        const excludeDirs = [
            "node_modules",
            "dist",
            "build",
            ".git",
            "logs",
            "tmp",
            ".next",
            ".nuxt",
        ];
        return excludeDirs.includes(dirName);
    }

    private detectConfigType(filename: string): ConfigType {
        const ext = path.extname(filename).toLowerCase();

        switch (ext) {
            case ".json":
                return ConfigType.JSON;
            case ".yaml":
            case ".yml":
                return ConfigType.YAML;
            case ".ini":
                return ConfigType.INI;
            case ".xml":
                return ConfigType.XML;
            case ".properties":
                return ConfigType.PROPERTIES;
            default:
                if (filename.startsWith(".env")) return ConfigType.ENV;
                return ConfigType.JSON; // Default fallback
        }
    }

    private async extractParameters(
        files: ConfigFile[],
    ): Promise<ConfigParameter[]> {
        const parameters: ConfigParameter[] = [];

        for (const file of files) {
            try {
                const fileParams = await this.parseConfigFile(file);
                parameters.push(...fileParams);
            } catch (error) {
                console.warn(`⚠️  Could not parse: ${file.name}`);
            }
        }

        return parameters;
    }

    private async parseConfigFile(file: ConfigFile): Promise<ConfigParameter[]> {
        const content = await fs.readFile(file.path, "utf-8");
        const parameters: ConfigParameter[] = [];

        // For now, just basic JSON parsing - we'll expand this in later steps
        if (file.type === ConfigType.JSON) {
            try {
                const parsed = JSON.parse(content);
                this.extractFromObject(parsed, [], parameters, file.path);
            } catch (error) {
                console.warn(`⚠️  Invalid JSON in ${file.name}`);
            }
        }

        return parameters;
    }

    private extractFromObject(
        obj: any,
        path: string[],
        parameters: ConfigParameter[],
        filePath: string,
    ): void {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = [...path, key];

            if (
                typeof value === "object" &&
                value !== null &&
                !Array.isArray(value)
            ) {
                this.extractFromObject(value, currentPath, parameters, filePath);
            } else {
                parameters.push({
                    key,
                    value,
                    type: typeof value,
                    path: currentPath,
                    configFile: filePath,
                });
            }
        }
    }

    private logFoundFiles(files: ConfigFile[]): void {
        if (files.length === 0) {
            console.log("📄 No configuration files found");
            return;
        }

        console.log("📄 Found configuration files:");
        files.forEach((file) => {
            console.log(
                `   ${file.type.toUpperCase()}: ${file.name} (${file.size} bytes)`,
            );
        });
    }

    startWatching(callback: (event: string, path: string) => void): void {
        if (this.watcher) {
            console.log("👀 Already watching for config changes");
            return;
        }

        console.log("👀 Starting to watch for configuration changes...");

        this.watcher = chokidar.watch(this.CONFIG_PATTERNS, {
            cwd: this.watchPath,
            ignored: this.EXCLUDE_PATTERNS,
            persistent: true,
            ignoreInitial: true,
        });

        this.watcher
            .on("add", (path) => {
                console.log(`➕ New config file: ${path}`);
                callback("add", path);
            })
            .on("change", (path) => {
                console.log(`🔄 Config file changed: ${path}`);
                callback("change", path);
            })
            .on("unlink", (path) => {
                console.log(`➖ Config file removed: ${path}`);
                callback("remove", path);
            });
    }

    stopWatching(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = undefined;
            console.log("👀 Stopped watching for config changes");
        }
    }

    getConfigFiles(): ConfigFile[] {
        return Array.from(this.configFiles.values());
    }
}
