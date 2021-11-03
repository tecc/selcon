import terser from 'terser';
import sp from 'synchronized-promise';
import { escapeStringRegexp } from '@/util';
import HTMLMinifier from 'html-minifier-terser';

export interface JSMinifyOptions {
    obfuscate: boolean;
    preservedNames: string[]
    inlining: boolean;
}
export const DEFAULT_JS_OPTIONS: JSMinifyOptions = {
    obfuscate: true,
    preservedNames: [],
    inlining: true
}
export async function js(input: string, optionsPart: Partial<JSMinifyOptions>): Promise<string> {
    const options = Object.assign({}, DEFAULT_JS_OPTIONS, optionsPart)
    const result = await terser.minify(input, {
        mangle: {
            keep_fnames: new RegExp(`(${options.preservedNames.map(escapeStringRegexp).join('|')})`),
            reserved: options.preservedNames
        },
        compress: {
            collapse_vars: options.inlining,
            inline: options.inlining
        }
    })
    return result.code!!;
}

// TODO: Options
export async function html(code: string): Promise<string> {
    return await HTMLMinifier.minify(code, {
        minifyCSS: false,
        minifyJS: false,
        minifyURLs: false,
        html5: true,
        preserveLineBreaks: false,
        removeComments: true
    })
}