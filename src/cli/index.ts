#!/usr/bin/env node
import * as luxon from "luxon";
import Log from "@/log";
import { declareGlobal, isNull, toDisplayString } from "@/util";
import arg from "arg";
import { CommandArgs, findAllCommands, loadCommand } from "@/cli/commands";
import options from "@/cli/options";
import path from "path";
import colours from "colors";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("@/../package.json"); // NOTE(tecc): needs to be a var require because otherwise everything goes wonky

declareGlobal<Selcon.WebscriptState>("webscriptState", {
    initialised: false
});
declareGlobal<Selcon.Options>("selconOptions", {
    verbose: false,
    command: "help"
});
declareGlobal<string>("packageDirectory", path.resolve(__dirname, "../.."));

let commands: string[];
function initialiseCli() {
    commands = findAllCommands();
}

async function cli() {
    Log.log("", colours.reset.bold, "Selcon version " + pkg.version);
    const argv = process.argv.slice(2);
    let args: CommandArgs<unknown> = arg(options, {
        argv: argv,
        permissive: true
    });
    const verbose = !!args["--verbose"];
    if (verbose) {
        selconOptions.verbose = verbose;
        Log.debug("Enabling verbose log output");
    }

    initialiseCli();

    let command = args._[0];
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
    args = arg(optSpec, {
        argv: argv
    });
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
