/* eslint-disable @typescript-eslint/no-explicit-any */
import colours from "colors";
import * as util from "util"; // NOTE(tecc): screw american spelling. any commit that changes this is immediately reversed.

export function toPrintableString(s: (a: string) => string, value: any): string {
    switch (typeof value) {
    case "string":
        return s(value);
    default:
        return s(util.inspect(value, {
            colors: true
        }));
    }
}

export const Log = {
    log(prefix: string, col: (a: string) => string = colours.reset, ...params: any[]) {
        const space = col(" ");
        process.stdout.write(prefix);
        for (const param of params) {
            process.stdout.write(toPrintableString(col, param) + space);
        }
        process.stdout.write("\n");
    },
    debug(...params: any[]) {
        if (selconOptions.verbose) {
            this.log(colours.gray.italic("[DBG]: "), colours.gray.italic, ...params);
        }
    },
    info(...params: any[]) {
        this.log(colours.reset("[INF]: "), colours.reset, ...params);
    },
    error(...params: any[]) {
        this.log(colours.black.bgRed("[ERR]:") + " ", colours.red, ...params);
    },
    warn(...params: any[]) {
        this.log(colours.yellow.bold("[WRN]: "), colours.yellow, ...params);
    }
};

export default Log;
