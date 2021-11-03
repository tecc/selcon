import * as path from "@/util/path";
import * as fs from "@/util/fs";
import Log from "@/log";
import arg from "arg";
import options from "@/cli/options";

export interface Command<T = unknown> {
    run(args: CommandArgs<T>): Promise<void>;
    options(): arg.Spec;
}

export function getCommandDirectory() {
    return path.resolve(__dirname, "commands");
}

export function findAllCommands(): string[] {
    return fs.walkDirectory(getCommandDirectory(), {
        filter: (v) => path.extname(v) === ".js",
        map: path.filename,
        mapBeforeFilter: false
    });
}

export type CommandArgs<T> = arg.Result<(typeof options) & T>;

export interface ImportedCommand<T = unknown> {
    run: (args: T) => (void | Promise<void>)
    options?: arg.Spec | (() => arg.Spec);
}

const cached: Record<string, Command> = {};
export async function loadCommand(name: string, force = false): Promise<Command> {
    if (!force && cached[name]) {
        return cached[name];
    }
    const p = path.resolve(getCommandDirectory(), `${name}.js`);
    if (!fs.existsSync(p)) {
        Log.error(`Requested command ${name} does not exist!`);
        throw new Error(`Requested command ${name} does not exist!`);
    }
    const imported: ImportedCommand = await import(p);

    cached[name] = {
        run: async (args) => {
            const value = imported.run(args);
            if (value instanceof Promise) return value;
            else return Promise.resolve(value);
        },
        options(): arg.Spec {
            if (!imported.options) {
                return {};
            }
            const type = typeof imported.options;
            if (type === "function") {
                return (imported.options as () => arg.Spec)();
            }
            if (type === "object") {
                return imported.options as arg.Spec;
            }
            return {};
        }
    };
    return cached[name];
}
loadCommand("build");
