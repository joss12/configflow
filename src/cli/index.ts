#!/usr/bin/env node
// src/cli/index.ts

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import * as fs from "fs-extra";
import * as path from "path";
import { CLIReporter } from "./CLIReporter";
import { StatusChecker } from "./StatusChecker";
import { InteractiveMode } from "./InteractiveMode";

const program = new Command();
const reporter = new CLIReporter();
const statusChecker = new StatusChecker();
const interactive = new InteractiveMode();

// ASCII Art Banner
function showBanner(): void {
    console.log(
        chalk.cyan(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                    🔧 ConfigFlow CLI                      ║
  ║            Autonomous Configuration Manager               ║
  ║                 Intelligence without AI                   ║
  ╚═══════════════════════════════════════════════════════════╝
  `),
    );
}

program
    .name("configflow")
    .description(
        "CLI interface for ConfigFlow - Autonomous Configuration Manager",
    )
    .version("1.0.0")
    .option("-v, --verbose", "verbose output")
    .option("-q, --quiet", "minimal output")
    .option("--config <path>", "config file path");

// Status command
program
    .command("status")
    .description("Show current ConfigFlow status")
    .option("-w, --watch", "watch mode (updates every 5 seconds)")
    .option("-f, --format <format>", "output format (table|json)", "table")
    .action(async (options) => {
        showBanner();

        if (options.watch) {
            console.log(
                chalk.yellow("🔄 Watching ConfigFlow status (Ctrl+C to exit)...\\n"),
            );

            const watchStatus = async () => {
                process.stdout.write("\\x1b[2J\\x1b[0f"); // Clear screen
                showBanner();
                await statusChecker.displayStatus(options.format);
                console.log(
                    chalk.dim(`\\n⏰ Last updated: ${new Date().toLocaleTimeString()}`),
                );
            };

            await watchStatus();
            setInterval(watchStatus, 5000);
        } else {
            await statusChecker.displayStatus(options.format);
        }
    });

// Report command
program
    .command("report")
    .description("Generate comprehensive reports")
    .option(
        "-t, --type <type>",
        "report type (summary|detailed|performance|suggestions|tuning)",
        "summary",
    )
    .option(
        "-f, --format <format>",
        "output format (table|json|csv|markdown)",
        "table",
    )
    .option("-o, --output <file>", "output file path")
    .option("-r, --range <range>", "time range (1h|24h|7d|all)", "24h")
    .option("--priority <priorities>", "filter by priority (comma-separated)")
    .option("--category <categories>", "filter by category (comma-separated)")
    .action(async (options) => {
        showBanner();

        const reportOptions = {
            type: options.type,
            format: options.format,
            output: options.output,
            timeRange: options.range,
            filter: {
                priority: options.priority ? options.priority.split(",") : undefined,
                category: options.category ? options.category.split(",") : undefined,
            },
        };

        console.log(chalk.blue(`📊 Generating ${options.type} report...`));
        await reporter.generateReport(reportOptions);
    });

// Start command
program
    .command("start")
    .description("Start ConfigFlow daemon")
    .option("-d, --daemon", "run as daemon")
    .option("-c, --config <path>", "configuration file")
    .action(async (options) => {
        showBanner();

        console.log(chalk.green("🚀 Starting ConfigFlow..."));

        if (options.daemon) {
            console.log(chalk.yellow("📌 Daemon mode not implemented in this demo"));
            console.log(
                chalk.cyan("💡 Use: npm run dev (to start in development mode)"),
            );
        } else {
            console.log(chalk.cyan("💡 Use: npm run dev (to start ConfigFlow)"));
        }
    });

// Stop command
program
    .command("stop")
    .description("Stop ConfigFlow daemon")
    .action(async () => {
        showBanner();
        console.log(chalk.red("🛑 Stop command not implemented in this demo"));
        console.log(chalk.cyan("💡 Use Ctrl+C to stop ConfigFlow when running"));
    });

// Interactive mode
program
    .command("interactive")
    .alias("i")
    .description("Start interactive configuration mode")
    .action(async () => {
        showBanner();
        await interactive.start();
    });

// Suggestions command
program
    .command("suggestions")
    .alias("suggest")
    .description("Show optimization suggestions")
    .option("-a, --apply <id>", "apply suggestion by ID")
    .option(
        "-p, --priority <level>",
        "filter by priority (low|medium|high|critical)",
    )
    .option("-f, --format <format>", "output format (table|json)", "table")
    .action(async (options) => {
        showBanner();

        if (options.apply) {
            console.log(chalk.yellow(`⚡ Applying suggestion ${options.apply}...`));
            console.log(
                chalk.cyan("💡 Auto-application not implemented in CLI demo"),
            );
        } else {
            await reporter.showSuggestions({
                priority: options.priority,
                format: options.format,
            });
        }
    });

// Metrics command
program
    .command("metrics")
    .description("Show performance metrics")
    .option("-l, --latest", "show only latest metrics")
    .option("-c, --count <num>", "number of recent metrics to show", "10")
    .option("-f, --format <format>", "output format (table|json)", "table")
    .action(async (options) => {
        showBanner();

        await reporter.showMetrics({
            latest: options.latest,
            count: parseInt(options.count),
            format: options.format,
        });
    });

// Config command
program
    .command("config")
    .description("Configuration management")
    .option("-l, --list", "list monitored config files")
    .option("-s, --scan", "scan for new config files")
    .option("-f, --format <format>", "output format (table|json)", "table")
    .action(async (options) => {
        showBanner();

        if (options.list) {
            await reporter.showConfigFiles(options.format);
        } else if (options.scan) {
            console.log(chalk.blue("🔍 Scanning for configuration files..."));
            console.log(
                chalk.cyan("💡 Scan functionality integrated in main process"),
            );
        } else {
            console.log(
                chalk.yellow(
                    "💡 Use --list to show monitored files or --scan to rescan",
                ),
            );
        }
    });

// Tuning command
program
    .command("tuning")
    .description("Auto-tuning management")
    .option("-s, --stats", "show tuning statistics")
    .option("-h, --history", "show tuning history")
    .option("-a, --active", "show active tuning sessions")
    .option("-f, --format <format>", "output format (table|json)", "table")
    .action(async (options) => {
        showBanner();

        if (options.stats) {
            await reporter.showTuningStats(options.format);
        } else if (options.history) {
            await reporter.showTuningHistory(options.format);
        } else if (options.active) {
            await reporter.showActiveTuningSessions(options.format);
        } else {
            console.log(chalk.yellow("💡 Use --stats, --history, or --active"));
        }
    });

// Version info
program
    .command("info")
    .description("Show ConfigFlow information")
    .action(() => {
        showBanner();

        console.log(chalk.white("📋 ConfigFlow Information:"));
        console.log(chalk.gray("   Version: 1.0.0"));
        console.log(chalk.gray("   Type: Autonomous Configuration Manager"));
        console.log(chalk.gray("   Intelligence: Algorithmic (No AI/ML)"));
        console.log(
            chalk.gray(
                "   Features: Real-time monitoring, Impact analysis, Auto-tuning",
            ),
        );
        console.log(chalk.gray("   Author: Your Name"));
        console.log(chalk.gray("   License: MIT"));

        console.log(chalk.white("\\n🔧 Available Commands:"));
        console.log(chalk.cyan("   configflow status       - Show current status"));
        console.log(chalk.cyan("   configflow report       - Generate reports"));
        console.log(
            chalk.cyan("   configflow suggestions  - Show optimization suggestions"),
        );
        console.log(
            chalk.cyan("   configflow metrics      - Show performance metrics"),
        );
        console.log(
            chalk.cyan("   configflow tuning       - Auto-tuning management"),
        );
        console.log(chalk.cyan("   configflow interactive  - Interactive mode"));

        console.log(chalk.white("\\n💡 Quick Start:"));
        console.log(chalk.green("   npm run dev             - Start ConfigFlow"));
        console.log(chalk.green("   npm run cli status      - Check status"));
        console.log(chalk.green("   npm run cli report      - Generate report"));
    });

// Handle unknown commands
program.on("command:*", () => {
    console.error(chalk.red("❌ Invalid command: %s"), program.args.join(" "));
    console.log(chalk.cyan("💡 Use --help to see available commands"));
    process.exit(1);
});

// Parse command line arguments
if (process.argv.length === 2) {
    showBanner();
    console.log(chalk.yellow("💡 Use --help to see available commands"));
    console.log(chalk.cyan("🚀 Quick start: npm run cli status"));
}

program.parse(process.argv);
