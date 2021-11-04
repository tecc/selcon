import Log from "@/log";
import { declareGlobal, isNull } from "@/util";
import { sass, scss } from "@/render/preprocessors/sass";
import sp from "synchronized-promise";

export interface PreprocessRenderOptions {
    includePaths: string[];
}


export const DEFAULT_RENDER_OPTIONS: PreprocessRenderOptions = {
    includePaths: []
};
export type Preprocessor = (input: string, options: PreprocessRenderOptions) => Promise<string>;
declare const _registeredPreprocessors: Record<string, Preprocessor>;

if (typeof _registeredPreprocessors === "undefined") {
    declareGlobal<Record<string, Preprocessor>>("_registeredPreprocessors", {
        none: (s) => Promise.resolve(s),
        sass,
        scss
    });
}

export function registerPreprocessor(name: string, func: Preprocessor) {
    _registeredPreprocessors[name] = func;
}

export function getPreprocessor(name: string): Preprocessor {
    return _registeredPreprocessors[name];
}
export function preprocess(type: string, input: string, optionsPart: Partial<PreprocessRenderOptions> = {}): Promise<string> {
    const options: PreprocessRenderOptions = Object.assign({}, DEFAULT_RENDER_OPTIONS, optionsPart);
    const preprocessor = getPreprocessor(type);
    if (isNull(preprocessor)) {
        return Promise.reject(`Preprocessor '${type}' does not exist.`);
    }
    Log.debug(`Using '${type}' preprocessor`);
    return preprocessor(input, options);
}
export const preprocessSync = sp(preprocess);
