import * as path from "@/util/path";
import * as fs from "@/util/fs";
import * as render from "@/render";
import * as webscript from "@/webscript";
import Log from "@/log";
import arg from "arg";
import { isEmpty, isNull } from "@/util";
import type { CommandArgs } from "@/cli/commands";

function findInputs(dir: string): string[] {
    return fs.walkDirectory(dir, {filter: (v) => v.endsWith(".in.html")});
}

export const options = {
    "--template": (value: string) => { return isEmpty(value) ? "default" : value; },
    "-t": "--template",
    "--minify": Boolean,
    "-m": "--minify"
};

export async function run(args: CommandArgs<typeof options>): Promise<void> {
    let paths: string[] = args._;
    if (paths.length == 0) {
        Log.error("No files specified.");
        return;
    }
    paths = paths.map((v) => path.resolve(process.cwd(), v));
    const template = args["--template"] || "default";
    const minify = (!isNull(args["--minify"]) && args["--minify"]) || false;

    if (minify) {
        Log.warn("Minify is an experimental feature.");
    }

    await render.init();
    if (isNull(render.getTemplate(template))) {
        Log.error("Template '" + template + "' does not exist.");
        return;
    }

    const script = await webscript.compile({
        minify: args["--minify"]
    });
    render.setScript(script);

    Log.info(`Rendering ${paths.length} file(s)`);
    const promises: Promise<void>[] = [];
    for (const path of paths) {
        Log.info("Building", path);
        const promise = render.buildFile(path, {
            template: template,
            minify: minify
        })
            .then(() => Log.info(`Built ${path}`))
            .catch((e) => Log.error(`Error whilst building ${path}:`, e));
        promises.push(promise);
    }
    await Promise.all(promises);
}
