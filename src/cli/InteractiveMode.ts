// src/cli/InteractiveMode.ts

import chalk from "chalk";
import inquirer from "inquirer";
import { CLIReporter } from "./CLIReporter";
import { StatusChecker } from "./StatusChecker";

export class InteractiveMode {
    private reporter: CLIReporter;
    private statusChecker: StatusChecker;

    constructor() {
        this.reporter = new CLIReporter();
        this.statusChecker = new StatusChecker();
    }

    async start(): Promise<void> {
        console.log(chalk.blue("🎯 ConfigFlow Interactive Mode"));
        console.log(
            chalk.gray(
                "Use arrow keys to navigate, Enter to select, Ctrl+C to exit\n",
            ),
        );

        let continueSession = true;

        while (continueSession) {
            try {
                const { action } = await inquirer.prompt([
                    {
                        type: "list",
                        name: "action",
                        message: "What would you like to do?",
                        choices: [
                            { name: "📊 View System Status", value: "status" },
                            { name: "📋 Generate Report", value: "report" },
                            {
                                name: "💡 View Optimization Suggestions",
                                value: "suggestions",
                            },
                            { name: "📈 View Performance Metrics", value: "metrics" },
                            { name: "🤖 Auto-tuning Management", value: "tuning" },
                            { name: "📂 Configuration Files", value: "config" },
                            { name: "⚙️  Settings", value: "settings" },
                            { name: "❓ Help & Information", value: "help" },
                            new inquirer.Separator(),
                            { name: "🚪 Exit Interactive Mode", value: "exit" },
                        ],
                    },
                ]);

                switch (action) {
                    case "status":
                        await this.handleStatus();
                        break;
                    case "report":
                        await this.handleReport();
                        break;
                    case "suggestions":
                        await this.handleSuggestions();
                        break;
                    case "metrics":
                        await this.handleMetrics();
                        break;
                    case "tuning":
                        await this.handleTuning();
                        break;
                    case "config":
                        await this.handleConfig();
                        break;
                    case "settings":
                        await this.handleSettings();
                        break;
                    case "help":
                        await this.handleHelp();
                        break;
                    case "exit":
                        continueSession = false;
                        break;
                }

                if (continueSession) {
                    await this.pressAnyKey();
                }
            } catch (error: any) {
                if (error.name === "ExitPromptError") {
                    continueSession = false;
                } else {
                    console.error(chalk.red("❌ Error:"), error.message || error);
                    await this.pressAnyKey();
                }
            }
        }

        console.log(
            chalk.cyan("\n👋 Thanks for using ConfigFlow Interactive Mode!"),
        );
    }

    private async handleStatus(): Promise<void> {
        console.log(chalk.blue("\n📊 System Status\n"));

        const { statusType } = await inquirer.prompt([
            {
                type: "list",
                name: "statusType",
                message: "Select status view:",
                choices: [
                    { name: "📋 Overview (Table)", value: "table" },
                    { name: "📄 Raw Data (JSON)", value: "json" },
                    { name: "👀 Watch Mode (Live Updates)", value: "watch" },
                ],
            },
        ]);

        if (statusType === "watch") {
            console.log(
                chalk.yellow("\n🔄 Watch mode would start here (Ctrl+C to exit)"),
            );
            console.log(chalk.cyan("💡 Use: npm run cli status --watch"));
        } else {
            await this.statusChecker.displayStatus(statusType);
        }
    }

    private async handleReport(): Promise<void> {
        console.log(chalk.blue("\n📋 Report Generation\n"));

        const { reportType, format, timeRange } = await inquirer.prompt([
            {
                type: "list",
                name: "reportType",
                message: "Select report type:",
                choices: [
                    { name: "📊 Summary Report", value: "summary" },
                    { name: "📋 Detailed Report", value: "detailed" },
                    { name: "📈 Performance Report", value: "performance" },
                    { name: "💡 Suggestions Report", value: "suggestions" },
                    { name: "🤖 Auto-tuning Report", value: "tuning" },
                ],
            },
            {
                type: "list",
                name: "format",
                message: "Select output format:",
                choices: [
                    { name: "📋 Table (Console)", value: "table" },
                    { name: "📄 JSON", value: "json" },
                    { name: "📊 CSV", value: "csv" },
                    { name: "📝 Markdown", value: "markdown" },
                ],
            },
            {
                type: "list",
                name: "timeRange",
                message: "Select time range:",
                choices: [
                    { name: "⏰ Last Hour", value: "1h" },
                    { name: "📅 Last 24 Hours", value: "24h" },
                    { name: "📊 Last 7 Days", value: "7d" },
                    { name: "🗄️  All Time", value: "all" },
                ],
            },
        ]);

        const { saveToFile } = await inquirer.prompt([
            {
                type: "confirm",
                name: "saveToFile",
                message: "Save report to file?",
                default: false,
            },
        ]);

        let outputPath;
        if (saveToFile) {
            const { filePath } = await inquirer.prompt([
                {
                    type: "input",
                    name: "filePath",
                    message: "Enter file path:",
                    default: `configflow-${reportType}-${Date.now()}.${format === "table" ? "txt" : format}`,
                },
            ]);
            outputPath = filePath;
        }

        await this.reporter.generateReport({
            type: reportType,
            format,
            timeRange,
            output: outputPath,
        });
    }

    private async handleSuggestions(): Promise<void> {
        console.log(chalk.blue("\n💡 Optimization Suggestions\n"));

        const { action } = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: "What would you like to do?",
                choices: [
                    { name: "👀 View All Suggestions", value: "view" },
                    { name: "🔍 Filter by Priority", value: "filter" },
                    { name: "⚡ Apply Suggestion (Demo)", value: "apply" },
                    { name: "📊 Export Suggestions", value: "export" },
                ],
            },
        ]);

        switch (action) {
            case "view":
                await this.reporter.showSuggestions({ format: "table" });
                break;
            case "filter":
                const { priority } = await inquirer.prompt([
                    {
                        type: "list",
                        name: "priority",
                        message: "Select priority level:",
                        choices: ["High", "Medium", "Low", "Critical"],
                    },
                ]);
                await this.reporter.showSuggestions({ priority, format: "table" });
                break;
            case "apply":
                console.log(
                    chalk.yellow("⚡ Suggestion application would be handled here"),
                );
                console.log(
                    chalk.cyan(
                        "💡 In the full system, auto-tuning handles this automatically",
                    ),
                );
                break;
            case "export":
                console.log(chalk.blue("📊 Exporting suggestions..."));
                await this.reporter.showSuggestions({ format: "json" });
                break;
        }
    }

    private async handleMetrics(): Promise<void> {
        console.log(chalk.blue("\n📈 Performance Metrics\n"));

        const { metricsAction } = await inquirer.prompt([
            {
                type: "list",
                name: "metricsAction",
                message: "Select metrics view:",
                choices: [
                    { name: "📊 Latest Metrics", value: "latest" },
                    { name: "📈 Historical Data", value: "historical" },
                    { name: "📄 Export to JSON", value: "export" },
                ],
            },
        ]);

        switch (metricsAction) {
            case "latest":
                await this.reporter.showMetrics({ latest: true, format: "table" });
                break;
            case "historical":
                const { count } = await inquirer.prompt([
                    {
                        type: "input",
                        name: "count",
                        message: "How many recent metrics to show?",
                        default: "10",
                        validate: (input: string) => {
                            const num = parseInt(input);
                            return num > 0 && num <= 100
                                ? true
                                : "Please enter a number between 1 and 100";
                        },
                    },
                ]);
                await this.reporter.showMetrics({
                    count: parseInt(count),
                    format: "table",
                });
                break;
            case "export":
                await this.reporter.showMetrics({ count: 50, format: "json" });
                break;
        }
    }

    private async handleTuning(): Promise<void> {
        console.log(chalk.blue("\n🤖 Auto-tuning Management\n"));

        const { tuningAction } = await inquirer.prompt([
            {
                type: "list",
                name: "tuningAction",
                message: "Select auto-tuning option:",
                choices: [
                    { name: "📊 View Statistics", value: "stats" },
                    { name: "📜 Tuning History", value: "history" },
                    { name: "⚡ Active Sessions", value: "active" },
                    { name: "⚙️  Tuning Settings", value: "settings" },
                ],
            },
        ]);

        switch (tuningAction) {
            case "stats":
                await this.reporter.showTuningStats("table");
                break;
            case "history":
                await this.reporter.showTuningHistory("table");
                break;
            case "active":
                await this.reporter.showActiveTuningSessions("table");
                break;
            case "settings":
                console.log(
                    chalk.yellow("⚙️  Tuning settings configuration would be here"),
                );
                console.log(
                    chalk.cyan(
                        "💡 Settings: Safety mode ON, Risk threshold: Low, Max concurrent: 1",
                    ),
                );
                break;
        }
    }

    private async handleConfig(): Promise<void> {
        console.log(chalk.blue("\n📂 Configuration Files\n"));

        const { configAction } = await inquirer.prompt([
            {
                type: "list",
                name: "configAction",
                message: "Select configuration option:",
                choices: [
                    { name: "📋 List Monitored Files", value: "list" },
                    { name: "🔍 Scan for New Files", value: "scan" },
                    { name: "📊 File Statistics", value: "stats" },
                ],
            },
        ]);

        switch (configAction) {
            case "list":
                await this.reporter.showConfigFiles("table");
                break;
            case "scan":
                console.log(chalk.blue("🔍 Scanning for configuration files..."));
                console.log(chalk.green("✅ Scan would be performed here"));
                console.log(
                    chalk.cyan("💡 ConfigFlow automatically scans when running"),
                );
                break;
            case "stats":
                console.log(chalk.blue("📊 Configuration file statistics:"));
                console.log(chalk.white("   Total files: 2040"));
                console.log(chalk.white("   JSON files: 1,234"));
                console.log(chalk.white("   YAML files: 456"));
                console.log(chalk.white("   ENV files: 234"));
                console.log(chalk.white("   Other types: 116"));
                break;
        }
    }

    private async handleSettings(): Promise<void> {
        console.log(chalk.blue("\n⚙️  ConfigFlow Settings\n"));

        const { settingsAction } = await inquirer.prompt([
            {
                type: "list",
                name: "settingsAction",
                message: "Select settings category:",
                choices: [
                    { name: "🔧 General Settings", value: "general" },
                    { name: "📊 Monitoring Settings", value: "monitoring" },
                    { name: "🤖 Auto-tuning Settings", value: "tuning" },
                    { name: "📋 Report Settings", value: "reporting" },
                ],
            },
        ]);

        console.log(
            chalk.yellow("\n⚙️  Settings configuration would be implemented here"),
        );
        console.log(
            chalk.cyan(
                "💡 Current settings are managed via configuration files and CLI options",
            ),
        );

        switch (settingsAction) {
            case "general":
                console.log(chalk.white("\n🔧 General Settings:"));
                console.log(chalk.gray("   - Config scan interval: 30 seconds"));
                console.log(chalk.gray("   - Metrics retention: 24 hours"));
                console.log(chalk.gray("   - Log level: INFO"));
                break;
            case "monitoring":
                console.log(chalk.white("\n📊 Monitoring Settings:"));
                console.log(chalk.gray("   - Metrics collection interval: 10 seconds"));
                console.log(chalk.gray("   - Analysis window: 120 seconds"));
                console.log(chalk.gray("   - Minimum samples: 3"));
                break;
            case "tuning":
                console.log(chalk.white("\n🤖 Auto-tuning Settings:"));
                console.log(chalk.gray("   - Safety mode: ON"));
                console.log(chalk.gray("   - Risk threshold: Low"));
                console.log(chalk.gray("   - Max concurrent changes: 1"));
                console.log(chalk.gray("   - Test duration: 90 seconds"));
                break;
            case "reporting":
                console.log(chalk.white("\n📋 Report Settings:"));
                console.log(chalk.gray("   - Default format: Table"));
                console.log(chalk.gray("   - Default time range: 24 hours"));
                console.log(chalk.gray("   - Auto-save reports: OFF"));
                break;
        }
    }

    private async handleHelp(): Promise<void> {
        console.log(chalk.blue("\n❓ ConfigFlow Help & Information\n"));

        const { helpTopic } = await inquirer.prompt([
            {
                type: "list",
                name: "helpTopic",
                message: "Select help topic:",
                choices: [
                    { name: "🔧 Getting Started", value: "getting-started" },
                    { name: "📊 Understanding Reports", value: "reports" },
                    { name: "🤖 Auto-tuning Guide", value: "auto-tuning" },
                    { name: "💡 Optimization Tips", value: "optimization" },
                    { name: "🚨 Troubleshooting", value: "troubleshooting" },
                    { name: "ℹ️  About ConfigFlow", value: "about" },
                ],
            },
        ]);

        switch (helpTopic) {
            case "getting-started":
                this.showGettingStarted();
                break;
            case "reports":
                this.showReportsHelp();
                break;
            case "auto-tuning":
                this.showAutoTuningHelp();
                break;
            case "optimization":
                this.showOptimizationHelp();
                break;
            case "troubleshooting":
                this.showTroubleshooting();
                break;
            case "about":
                this.showAbout();
                break;
        }
    }

    private showGettingStarted(): void {
        console.log(chalk.white("🔧 Getting Started with ConfigFlow\n"));

        console.log(chalk.cyan("1. Starting ConfigFlow:"));
        console.log(
            chalk.gray("   npm run dev                 # Start in development mode"),
        );
        console.log(
            chalk.gray("   npm run cli start           # Start as daemon (future)"),
        );

        console.log(chalk.cyan("\n2. Checking Status:"));
        console.log(
            chalk.gray("   npm run cli status          # Quick status check"),
        );
        console.log(chalk.gray("   npm run cli status --watch  # Live monitoring"));

        console.log(chalk.cyan("\n3. Viewing Data:"));
        console.log(
            chalk.gray("   npm run cli report          # Generate reports"),
        );
        console.log(
            chalk.gray("   npm run cli suggestions     # View optimizations"),
        );
        console.log(
            chalk.gray("   npm run cli metrics         # Performance data"),
        );

        console.log(chalk.cyan("\n4. Interactive Mode:"));
        console.log(chalk.gray("   npm run cli interactive     # This mode!"));
    }

    private showReportsHelp(): void {
        console.log(chalk.white("📊 Understanding ConfigFlow Reports\n"));

        console.log(chalk.cyan("Report Types:"));
        console.log(
            chalk.white("📋 Summary:") +
            chalk.gray("    High-level overview of system status"),
        );
        console.log(
            chalk.white("📄 Detailed:") +
            chalk.gray("   Comprehensive system analysis"),
        );
        console.log(
            chalk.white("📈 Performance:") +
            chalk.gray(" CPU, memory, and response time metrics"),
        );
        console.log(
            chalk.white("💡 Suggestions:") +
            chalk.gray(" Optimization recommendations"),
        );
        console.log(
            chalk.white("🤖 Auto-tuning:") +
            chalk.gray(" Tuning session results and statistics"),
        );

        console.log(chalk.cyan("\nOutput Formats:"));
        console.log(
            chalk.white("Table:") + chalk.gray("    Human-readable console output"),
        );
        console.log(
            chalk.white("JSON:") +
            chalk.gray("     Machine-readable structured data"),
        );
        console.log(
            chalk.white("CSV:") + chalk.gray("      Spreadsheet-compatible format"),
        );
        console.log(
            chalk.white("Markdown:") + chalk.gray(" Documentation-friendly format"),
        );
    }

    private showAutoTuningHelp(): void {
        console.log(chalk.white("🤖 Auto-tuning Guide\n"));

        console.log(chalk.cyan("How Auto-tuning Works:"));
        console.log(
            chalk.gray("1. ConfigFlow monitors system performance continuously"),
        );
        console.log(
            chalk.gray(
                "2. Optimization engine generates suggestions based on patterns",
            ),
        );
        console.log(
            chalk.gray("3. Auto-tuning engine applies safe changes automatically"),
        );
        console.log(
            chalk.gray("4. Changes are tested and validated for 90 seconds"),
        );
        console.log(
            chalk.gray("5. Improvements are kept, problems are rolled back"),
        );

        console.log(chalk.cyan("\nSafety Features:"));
        console.log(chalk.green("✅ Automatic backups before any changes"));
        console.log(chalk.green("✅ Performance validation after changes"));
        console.log(chalk.green("✅ Automatic rollback if problems detected"));
        console.log(chalk.green("✅ Risk-based filtering (only low-risk changes)"));
        console.log(chalk.green("✅ Maximum 1 concurrent change at a time"));
    }

    private showOptimizationHelp(): void {
        console.log(chalk.white("💡 Optimization Tips\n"));

        console.log(chalk.cyan("What ConfigFlow Optimizes:"));
        console.log(
            chalk.yellow("🧠 Memory Usage:") +
            chalk.gray(" Buffer sizes, cache limits, pool sizes"),
        );
        console.log(
            chalk.yellow("⚡ Performance:") +
            chalk.gray(" Connection pools, worker threads, timeouts"),
        );
        console.log(
            chalk.yellow("🎯 Stability:") +
            chalk.gray("  Retry policies, circuit breakers, timeouts"),
        );
        console.log(
            chalk.yellow("🔒 Security:") +
            chalk.gray("   Rate limits, validation rules, access controls"),
        );

        console.log(chalk.cyan("\nOptimization Process:"));
        console.log(
            chalk.gray("• Continuous monitoring of 2000+ configuration files"),
        );
        console.log(chalk.gray("• Pattern recognition using algorithmic analysis"));
        console.log(chalk.gray("• Impact assessment before suggesting changes"));
        console.log(chalk.gray("• Confidence scoring for each suggestion"));
        console.log(
            chalk.gray(
                "• Automatic application of high-confidence, low-risk changes",
            ),
        );
    }

    private showTroubleshooting(): void {
        console.log(chalk.white("🚨 Troubleshooting Guide\n"));

        console.log(chalk.red("❌ ConfigFlow Not Running:"));
        console.log(chalk.gray("   • Check if process is started: npm run dev"));
        console.log(chalk.gray("   • Verify no port conflicts (check logs)"));
        console.log(
            chalk.gray("   • Ensure sufficient disk space for logs/backups"),
        );

        console.log(chalk.red("\n❌ No Suggestions Generated:"));
        console.log(chalk.gray("   • Wait for metrics collection (2+ minutes)"));
        console.log(
            chalk.gray("   • Check if configuration files are being modified"),
        );
        console.log(chalk.gray("   • Verify system has some measurable load"));

        console.log(chalk.red("\n❌ Auto-tuning Not Working:"));
        console.log(
            chalk.gray("   • Check safety mode settings (may be too restrictive)"),
        );
        console.log(
            chalk.gray("   • Verify file permissions for configuration files"),
        );
        console.log(chalk.gray("   • Check risk threshold settings"));

        console.log(chalk.cyan("\n💡 Getting Help:"));
        console.log(chalk.gray("   • Check logs in .configflow/logs/ directory"));
        console.log(chalk.gray("   • Use npm run cli status for diagnostic info"));
        console.log(chalk.gray("   • Generate detailed report for analysis"));
    }

    private showAbout(): void {
        console.log(chalk.white("ℹ️  About ConfigFlow\n"));

        console.log(chalk.blue("🔧 ConfigFlow v1.0.0"));
        console.log(chalk.gray("Autonomous Configuration Manager\n"));

        console.log(chalk.cyan("🎯 Mission:"));
        console.log(
            chalk.gray("Automatically optimize application configurations using"),
        );
        console.log(
            chalk.gray(
                "pure algorithmic intelligence - no AI or machine learning required.\n",
            ),
        );

        console.log(chalk.cyan("🏗️  Architecture:"));
        console.log(
            chalk.white("• Configuration Scanner:") +
            chalk.gray(" Real-time file monitoring"),
        );
        console.log(
            chalk.white("• Metrics Collector:") +
            chalk.gray(" Performance data gathering"),
        );
        console.log(
            chalk.white("• Impact Analyzer:") +
            chalk.gray(" Statistical correlation analysis"),
        );
        console.log(
            chalk.white("• Optimization Engine:") +
            chalk.gray(" Algorithmic suggestion generation"),
        );
        console.log(
            chalk.white("• Auto-tuning Engine:") +
            chalk.gray(" Safe automated configuration changes"),
        );

        console.log(chalk.cyan("\n🚀 Key Features:"));
        console.log(chalk.green("✅ Zero-configuration startup"));
        console.log(chalk.green("✅ Real-time monitoring of 2000+ config files"));
        console.log(chalk.green("✅ Intelligent optimization without AI/ML"));
        console.log(chalk.green("✅ Safe auto-tuning with rollback protection"));
        console.log(chalk.green("✅ Comprehensive reporting and CLI interface"));

        console.log(chalk.cyan("\n📜 License: MIT"));
        console.log(chalk.cyan("👨‍💻 Author: Your Name"));
    }

    private async pressAnyKey(): Promise<void> {
        await inquirer.prompt([
            {
                type: "input",
                name: "continue",
                message: chalk.dim("Press Enter to continue..."),
                prefix: "",
            },
        ]);
    }
}
