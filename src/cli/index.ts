/*
 * SPDX-FileCopyrightText: 2021 Cae Lundin <tecc@tecc.me>
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-KDE-Accepted-LGPL
 */
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
import * as render from "@/render";
import fs from "fs";
import { declareGlobal, isNull, toDisplayString } from "@/util";
import arg from "arg";
import { findAllCommands, loadCommand } from "@/cli/commands";

declareGlobal<string>("packageDir", pkgdir.sync()!);
declareGlobal<KRFC.WebscriptState>("webscriptState", {
    initialised: false
});
declareGlobal<KRFC.Options>("rfcOptions", {
    debug: true,
    verbose: false,
    command: "help"
});

let commands: string[];
function initialiseCli() {
    commands = findAllCommands();
}

interface GlobalOptions extends arg.Spec {
    "--verbose": arg.Handler<boolean>;
    "-v": "--verbose";
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

    rfcOptions.command = <KRFC.RfcCommand> command;

    Log.debug(`Executing command '${command}'`);
    const cmd = await loadCommand(command);
    const cmdOptSpec = cmd.options();
    const optSpec = Object.assign<Record<string, never>, arg.Spec, GlobalOptions>({}, cmdOptSpec, {
        "--verbose": Boolean,
        "-v": "--verbose",
    });
    const args = arg(optSpec);
    const verbose = !!args["--verbose"];
    rfcOptions.verbose = verbose;
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
