import * as path from "@/util/path";
import * as fs from "@/util/fs";
import Log from "@/log";
import arg from "arg";

export interface Command<T = unknown> {
    run(args: T): Promise<void>;
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

export interface ImportedCommand<T = unknown> {
    run: (args: T) => (void | Promise<void>)
    options?: () => arg.Spec;
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
            if ((typeof imported.options) === "function") {
                return imported.options!();
            } else {
                return {};
            }
        }
    };
    return cached[name];
}
loadCommand("build");
