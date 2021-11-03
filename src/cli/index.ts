#!/usr/bin/env node
import * as tsconfigPaths from "tsconfig-paths";
import path from "path";
import pkgdir from "pkg-dir";
import * as luxon from "luxon";

const tsconfig = tsconfigPaths.loadConfig(path.resolve(pkgdir.sync()!, "tsconfig.json"));
if (tsconfig.resultType === "failed") {
    console.error("Cannot initialise tsconfig-paths");
} else {
    const mappedPathValues: Record<string, string[]> = {};
    for (const key of Object.keys(tsconfig.paths)) {
        const value = tsconfig.paths[key];
        for (const i in value) {
            value[i] = value[i].replace(/^(\.\/)?src/g, "$1dist");
        }
        mappedPathValues[key] = value;
    }
    tsconfigPaths.register({
        baseUrl: tsconfig.baseUrl,
        paths: mappedPathValues
    });
}

import Log from "@/log";
import { declareGlobal, isNull, toDisplayString } from "@/util";
import arg from "arg";
import { CommandArgs, findAllCommands, loadCommand } from "@/cli/commands";
import options from "@/cli/options";

declareGlobal<string>("packageDir", pkgdir.sync()!);
declareGlobal<Selcon.WebscriptState>("webscriptState", {
    initialised: false
});
declareGlobal<Selcon.Options>("selconOptions", {
    verbose: false,
    command: "help"
});

let commands: string[];
function initialiseCli() {
    commands = findAllCommands();
}

async function cli() {
    initialiseCli();
    let argv = process.argv;
    let argsStart = 1;
    for (const arg of argv) {
        if (arg.endsWith(".js")) break;
        argsStart++;
    }
    argv = argv.slice(argsStart);

    let command = argv[0];
    if (isNull(command)) {
        Log.debug("No command specified, defaulting to help", command);
        command = "help";
    }

    if (!commands.includes(command)) {
        Log.error("That's not a valid command! List of commands: " + commands.join(", "));
        return;
    }

    selconOptions.command = <Selcon.CommandName> command;

    Log.debug(`Executing command '${command}'`);
    const cmd = await loadCommand(command);
    const cmdOptSpec = cmd.options();
    const optSpec = Object.assign<Record<string, never>, arg.Spec, typeof options>({}, cmdOptSpec, options);
    const args: CommandArgs<unknown> = arg(optSpec);
    const verbose = !!args["--verbose"];
    if (verbose) {
        selconOptions.verbose = verbose;
        Log.debug("Enabling verbose log output");
    }
    args._ = args._.slice(1);
    await cmd.run(args);
}

function wrapper() {
    const start = Date.now();
    cli()
        .then(() => {
            Log.debug("Exit OK");
        })
        .catch((err) => {
            Log.error("An error occurred whilst running:", err);
        })
        .finally(() => {
            const end = Date.now();
            const time = end - start;
            const duration = luxon.Duration.fromMillis(time);
            Log.info("Exited in " + toDisplayString("duration", duration));
        });
}
wrapper();
