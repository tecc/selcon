import * as fs from "@/util/fs";
import * as path from "@/util/path";
import fm from "front-matter";
import Log from "@/log";
import Handlebars from "handlebars";
import { isNull, toDisplayString, DisplayStringInputType } from "@/util";
import { walkDirectory } from "@/util/fs";
import * as minify from '@/util/minify';

export interface RenderOptions {
    path: string;
    minify: boolean;
    forceTemplate: boolean;
}

export type RenderContext = Information & {
    SCRIPT: string,
    CONTENT: string
}
export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
    minify: false,
    forceTemplate: false,
    path: ''
};
export function render(data: string, template: Handlebars.TemplateDelegate<RenderContext>, optionsPart: Partial<RenderOptions>) {
    const options = Object.assign({}, DEFAULT_RENDER_OPTIONS, optionsPart);
    if (isNull(template)) {
        Log.warn("Template is null, returning empty string");
        return "";
    }
    const matter = fm<Information>(data);

    const m = matter.attributes;
    if (m.template) {
        const newTemplate = getTemplate(m.template);
        if (!newTemplate) {
            Log.warn("Input specifies different template '" + m.template + "', but it does not exist. Using provided template.")
        } else {
            template = newTemplate;
            Log.debug("Using different template '" + m.template + "' instead of provided.")
        }
    }
    const script = `
    const Info = JSON.parse(\`${JSON.stringify(m)}\`);
    ${SCRIPT_CONTENTS || ""}
    `;

    const ctx: RenderContext = <RenderContext>Object.assign({},
        matter.attributes,
        {
            "SCRIPT": script,
            "CONTENT": matter.body
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
    Log.debug("Rendered input");
    return rendered;
}

let SCRIPT_CONTENTS = "";
export function setScript(script: string) {
    SCRIPT_CONTENTS = script;
    // console.log("Script", script);
}

export interface BuildOptions {
    template: string,
    minify: boolean
}
export const DEFAULT_BUILD_OPTIONS: BuildOptions = { template: "default", minify: true };

export function buildFile(file: string, optionsPart: Partial<BuildOptions> = {}): Promise<void> {
    const options = Object.assign({}, DEFAULT_BUILD_OPTIONS, optionsPart);
    return new Promise<void>((resolve, reject) => {
        fs.readFile(file, "utf-8", (err, data) => {
            if (err) {
                Log.error(`Couldn't read file ${file}`, err);
                reject(err);
                return;
            }

            const rendered = render(data, getTemplate(options.template)!, {
                path: file,
                minify: options.minify
            });


            let completed: Promise<string>;
            if (options.minify) {
                completed = minify.html(rendered);
            } else {
                completed = (async () => {
                    return rendered;
                })();
            }
            completed
                .then((completed) => {
                    // NOTE(tecc): this is bad, i know, but idc
                    let parts = file.split(".");
                    const extra = parts.slice(0, parts.length - 1);
                    extra.push("out", ...(parts.slice(parts.length - 1)));
                    const filename = extra.join('.');

                    const outputPath = path.resolve(path.dirname(file), `${filename}`);
                    fs.writeFile(outputPath, completed, "utf-8", (err) => {
                        if (err) {
                            Log.error("Couldn't write to file");
                            reject(err);
                            return;
                        }
                        Log.debug(`Wrote rendered result of ${file} to ${outputPath}`);
                        resolve();
                        return;
                    });
                })
                .catch((err) => {
                    Log.error("Couldn't complete");
                    reject(err);

                    return;
                })

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
