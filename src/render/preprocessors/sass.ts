import type { PreprocessRenderOptions } from "@/render/preprocessors";
import Sass from "sass";
import Log from "@/log";

export function preprocess(indented: boolean, input: string, options: PreprocessRenderOptions): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        Sass.render({
            includePaths: options.includePaths,
            indentedSyntax: indented,
            data: input
        }, (err, res) => {
            if (err) {
                Log.error("Error whilst preprocessing using Sass", err);
                reject(err);
                return;
            }
            resolve(res.css.toString("utf-8"));
        });
    });
}
export function sass(input: string, options: PreprocessRenderOptions): Promise<string> {
    return preprocess(true, input, options);
}
export function scss(input: string, options: PreprocessRenderOptions): Promise<string> {
    return preprocess(false, input, options);
}