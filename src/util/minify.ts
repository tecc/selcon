import terser from "terser";
import { escapeStringRegexp } from "@/util";
import HTMLMinifier from "html-minifier-terser";
import Log from "@/log";
import csso from "csso";

function minified(type: string, input: string, output?: string): string {
    if (!output) {
        Log.warn("Couldn't minify, returning original");
        return input;
    }
    const sizeFactor = (output.length / input.length) * 100;
    if (output.length > input.length) {
        Log.warn(`Minify output length (${output.length}) greater than input length (${input.length}) (${sizeFactor}% of original size), returning input`);
        return input;
    } else {
        Log.debug(`Minified ${type} from`, input.length, "to", output.length, "(" + sizeFactor + "% of original size)");
        return output;
    }
}

export interface JSMinifyOptions {
    obfuscate: boolean;
    preservedNames: string[]
    inlining: boolean;
}
export const DEFAULT_JS_OPTIONS: JSMinifyOptions = {
    obfuscate: true,
    preservedNames: [],
    inlining: true
};
export async function js(input: string, optionsPart: Partial<JSMinifyOptions> = {}): Promise<string> {
    const options = Object.assign({}, DEFAULT_JS_OPTIONS, optionsPart);
    const result = await terser.minify(input, {
        mangle: {
            keep_fnames: new RegExp(`(${options.preservedNames.map(escapeStringRegexp).join("|")})`),
            reserved: options.preservedNames
        },
        compress: {
            collapse_vars: options.inlining,
            inline: options.inlining
        }
    });
    return minified("JS", input, result.code);
}

export interface HTMLMinifyOptions {
    conservative: boolean;
    extremes: boolean;
}
export const DEFAULT_HTML_OPTIONS: HTMLMinifyOptions = {
    conservative: false,
    extremes: false
};
export async function html(code: string, optionsPart: Partial<HTMLMinifyOptions> = {}): Promise<string> {
    const options: HTMLMinifyOptions = Object.assign({}, DEFAULT_HTML_OPTIONS, optionsPart);
    const result = await HTMLMinifier.minify(code, {
        minifyCSS: false,
        minifyJS: false, // minifyCSS & minifyJS are intentionally left off because that's handled elsewhere
        minifyURLs: options.extremes,
        html5: true,
        preserveLineBreaks: options.conservative,
        removeComments: !options.conservative,
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
        caseSensitive: true,
        conservativeCollapse: options.conservative,
        removeOptionalTags: !options.conservative,
        keepClosingSlash: true,
        removeAttributeQuotes: options.extremes,
        useShortDoctype: options.extremes
    });
    return minified("HTML", code, result);
}

export interface CSSMinifyOptions {
    useUnsafeOptions: boolean
}
export const DEFAULT_CSS_OPTIONS: CSSMinifyOptions = {
    useUnsafeOptions: true
};
export function css(code: string, optionsPart: Partial<CSSMinifyOptions> = {}) {
    const options: CSSMinifyOptions = Object.assign({}, DEFAULT_CSS_OPTIONS, optionsPart);
    const result = csso.minify(code, {
        sourceMap: false,
        comments: true,
        forceMediaMerge: options.useUnsafeOptions,
        restructure: true
    });
    return minified("CSS", code, result.css);
}