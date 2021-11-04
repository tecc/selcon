import ts from "typescript";
import browserify from "browserify";
import * as path from "@/util/path";
import { dataFile, isNull } from "@/util";
import fs from "fs";
import { walkDirectory } from "@/util/fs";
import Log from "@/log";
import * as minify from "@/util/minify";

function dataDir(): string {
    const path = dataFile("webscript");
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, {recursive: true});
    }
    return path;
}

function inputDir(): string {
    const p = path.resolve(packageDirectory, "websrc");
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p, {recursive: true});
    }
    return p;
}

function file(...n: string[]): string {
    return path.resolve(dataDir(), ...n);
}

const SCRIPT_OUTPUT = file("script.js");
const SCRIPT_OUTPUT_DIR = file("raw");
const OPTIONS: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES3,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    outDir: SCRIPT_OUTPUT_DIR,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    baseUrl: inputDir()
};

export function init(): void {
    if (webscriptState.initialised) {
        return;
    }
    Log.debug("Initialising Webscript");
    webscriptState.hosts = {
        compiler: ts.createCompilerHost(OPTIONS)
    };
    webscriptState.compiled = false;

    (webscriptState as Selcon.InitialisedWebscriptState).initialised = true;
}

export interface CompileOptions {
    minify: boolean
}
export function compileFiles(files: string[], options: CompileOptions): void {
    if (!webscriptState.initialised) {
        throw new Error("Initialised");
    }
    const program = ts.createProgram(files, OPTIONS, webscriptState.hosts.compiler);
    const emitResult = program.emit(undefined);
    const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            const {line, character} = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            Log.warn(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            Log.warn(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        }
    });
    webscriptState.compiled = true;
}

export function generateAssignScript(modules: string[]): string {
    let str = "";
    for (const module of modules) {
        str += `Object.assign(globalThis, require("${module}"));\n`;
    }
    return str;
}

export function bundleModules(modules: string[], options: CompileOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        Log.debug("Bundling modules");
        const bundle = browserify({
            basedir: inputDir()
        });
        for (const module of modules) {
            bundle.add(module, {
                entry: true,
            });
            bundle.require(module);
        }

        bundle.bundle((err, data) => {
            Log.debug("Bundled modules");
            if (!isNull(err)) {
                reject(err);
                return;
            }

            const as = generateAssignScript(modules);
            const total = `${data.toString("utf-8")}\n${as}`;
            let complete: Promise<string>;
            if (options.minify) {
                complete = minify.js(total, {
                    preservedNames: ["init"]
                });
            } else {
                complete = (async () => total)();
            }
            complete
                .then((completed) => {
                    fs.writeFile(SCRIPT_OUTPUT, completed, "utf-8", (err) => {
                        if (!isNull(err)) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
        });
    });
}

export const DEFAULT_COMPILE_OPTIONS: CompileOptions = {
    minify: false
};
export function compile(optionsPart: Partial<CompileOptions>): Promise<string> {
    const options = Object.assign({}, DEFAULT_COMPILE_OPTIONS, optionsPart);
    init();
    return new Promise<string>((resolve, reject) => {
        if (!webscriptState.initialised) {
            reject("Webscript state is not initialised");
            return;
        }
        Log.debug("Compiling Webscript files");
        if (webscriptState.compiled) {
            Log.debug("Webscript is already compiled");
            resolve(webscriptState.result);
            return;
        }

        const files = walkDirectory(inputDir(), {
            filter: (v) => path.extname(v) === ".ts",
            mapBeforeFilter: false
        });
        compileFiles(files, options);
        bundleModules(files.map((v) => path.resolve(SCRIPT_OUTPUT_DIR, path.filename(v) + ".js")), options)
            .then(() => {
                if (!webscriptState.compiled) {
                    Log.error("Webscript is not compiled");
                    reject("Webscript is not compiled");
                    return;
                }
                fs.readFile(SCRIPT_OUTPUT, "utf-8", (err, data) => {
                    if (!isNull(err)) {
                        reject(err);
                        return;
                    }
                    webscriptState.result = data;
                    resolve(webscriptState.result);
                });
                return;
            })
            .catch(reject);
        return;
    });
}