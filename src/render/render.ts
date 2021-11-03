import * as fs from "@/util/fs";
import * as path from "@/util/path";
import fm from "front-matter";
import Log from "@/log";
import Handlebars from "handlebars";
import { isNull, toDisplayString, DisplayStringInputType } from "@/util";
import { walkDirectory } from "@/util/fs";

export interface RenderOptions {
    path: string;
}

export type RenderContext = Information & {
    SCRIPT: string,
    CONTENT: string
}

export function render(data: string, template: Handlebars.TemplateDelegate<RenderContext>, options: RenderOptions) {
    if (isNull(template)) {
        Log.warn("Template is null, returning empty string");
        return "";
    }
    const matter = fm<Information>(data);

    const m = matter.attributes;
    const script = `
    const Info = JSON.parse(\`${JSON.stringify(m)}\`);
    ${SCRIPT_CONTENTS || ""}
    `;

    const ctx: RenderContext = <RenderContext>Object.assign({},
        matter.attributes,
        {
            "SCRIPT": script
        }
    );
    const rendered = template(ctx, {
        partials: {
            "include": (ctx) => {
                if (isNull(ctx.paths)) {
                    Log.debug("Paths is null, skipping");
                    return "";
                }
                const paths: string[] = ctx.paths.split(";");
                const result: string[] = [];
                for (const pb of paths) {
                    Log.debug(`Reading contents of file ${pb}`);
                    let p = path.resolve(path.dirname(options.path), pb);
                    if (!fs.existsSync(p)) {
                        p = path.resolve(packageDir, "templates", pb);
                    }
                    if (!fs.existsSync(p)) {
                        Log.error("Tried to include file that does not exist: ", pb);
                        continue;
                    }
                    let rv;
                    try {
                        rv = fs.readFileSync(p, "utf-8");
                    } catch (e) {
                        Log.error("Couldn't include file", pb, e);
                        continue;
                    }
                    result.push(rv);
                }
                return result.join("\n\n");
            },
            "display": (ctx) => {
                const type: string = ctx.type;
                return toDisplayString(<DisplayStringInputType>type, ctx.value);
            }
        }
    });
    return rendered;
}

let SCRIPT_CONTENTS = "";
export function setScript(script: string) {
    SCRIPT_CONTENTS = script;
    // console.log("Script", script);
}



export function buildFile(file: string, template: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.readFile(file, "utf-8", (err, data) => {
            if (err) {
                Log.error(`Couldn't read file ${file}`, err);
                reject(err);
                return;
            }

            const rendered = render(data, getTemplate(template)!, {
                path: file
            });

            const parts = file.split(".");
            const filename = parts.slice(0, parts.length - 2).join("");
            const outputPath = path.resolve(path.dirname(file), `${filename}.html`);
            Log.debug(`Wrote rendered result of ${file} to ${outputPath}`);
            fs.writeFile(outputPath, rendered, "utf-8", (err) => {
                if (err) {
                    Log.error("Couldn't write to file");
                    reject(err);
                    return;
                }
                Log.debug("Wrote output");
                resolve();
                return;
            });

            return;
        });
    });
}

const templates: Record<string, Handlebars.TemplateDelegate<RenderContext>> = {};

export function getTemplate(template: string): Handlebars.TemplateDelegate<RenderContext> | null {
    return templates[template];
}

export function registerTemplate(name: string, content: string) {
    Log.debug("Register template " + name);
    templates[name] = Handlebars.compile<RenderContext>(content);
}

export function loadAllTemplates(): void {
    const templates = walkDirectory(path.resolve(packageDir, "templates"), {
        filter: p => path.extname(p) === ".hbs"
    });
    Log.debug("Found templates", templates.join(", "));

    templates.forEach((file) => {
        const name = path.filename(file);
        const data = fs.readFileSync(file, "utf-8");
        registerTemplate(name, data);
    });
}

export function init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            loadAllTemplates();
            resolve();
        } catch (e) {
            reject(e);
        }
    });
}
