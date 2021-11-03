import * as path from "@/util/path";
import * as fs from "@/util/fs";
import * as render from "@/render";
import * as webscript from "@/webscript";
import Log from "@/log";
import arg from "arg";
import { isEmpty, isNull } from "@/util";

function findInputs(dir: string): string[] {
    return fs.walkDirectory(dir, {filter: (v) => v.endsWith(".in.html")});
}

interface Args {
    "--template": string
}

export function options(): arg.Spec {
    return {
        "--template": (s) => {
            return isEmpty(s) ? "default" : s;
        },
        "-t": "--template"
    };
}

export async function run(args: Args): Promise<void> {
    let paths: string[] = process.execArgv;
    if (paths.length == 0) paths = findInputs(path.resolve(packageDir, "rfcs"));
    else paths = paths.map((v) => path.resolve(process.cwd(), v));

    const template = args["--template"] || "default";

    await render.init();
    if (isNull(render.getTemplate(template))) {
        Log.error("Template '" + template + "' does not exist.");
        return;
    }

    const script = await webscript.compile();
    render.setScript(script);

    Log.info(`Rendering ${paths.length} file(s)`);
    const promises: Promise<void>[] = [];
    for (const path of paths) {
        const promise = render.buildFile(path, template)
            .then(() => Log.info(`Built ${path}`))
            .catch((e) => Log.error(`Error whilst building ${path}:`, e));
        promises.push(promise);
    }
    await Promise.all(promises);
}
