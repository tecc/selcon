import path from "path";
import * as luxon from "luxon";

export function isNull(v: unknown): boolean {
    if ((typeof v) === "undefined") {
        return true;
    }
    if (v === null) {
        return true;
    }
    return false;
}

export function isWhitespaceCharacter(v: string) {
    return v == " " || v == "\n" || v == "\r";
}

export function isEmpty(v: string): boolean {
    if (isNull(v) || v.length == 0) return true;
    for (let i = 0; i < v.length; i++) {
        if (!isWhitespaceCharacter(v.charAt(i))) return false;
    }
    return true;
}

export type DefaultGlobalKey = (keyof (typeof global));
export type ExtraGlobalKey = "packageDir" | "webscriptState" | "selconOptions";
export type GlobalKey = ExtraGlobalKey | DefaultGlobalKey;
export function declareGlobal<T>(name: GlobalKey | string, v: T): void {
    (global as Record<string, unknown>)[name] = v;
}

export function dataFile(...n: string[]): string {
    return path.resolve(packageDir, ".selcon", ...n);
}

/*export type CallbackRunner<Parameters extends any[]> = (cb: (...params: Parameters) => void) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runCbfAsPromise<CallbackParams extends any[], ReturnType extends any[]>(
    run: CallbackRunner<CallbackParams>,
    errorCondition?: (...params: CallbackParams) => boolean): Promise<CallbackParams> {
    return new Promise<CallbackParams>((resolve, reject) => {
        try {
            run((...params: CallbackParams) => {
                if (!isNull(errorCondition)) {
                    errorCondition!(...params);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

export function runCbfSync<CallbackParams extends any[]>(
    run: CallbackRunner<CallbackParams>): CallbackParams {
    return synchronise(() => runCbfAsPromise(run))();
}*/



export type DisplayStringInputType = "duration";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const types: Record<DisplayStringInputType, (v: any) => string> = {
    "duration": (v: luxon.Duration) => {
        function s(v: number): string {
            return v === 1 ? "" : "s";
        }
        let fmt = "";
        let state = 0;

        if (v.years || state > 6) {
            state = 6;
            fmt += `Y year${s(v.years)} `;
        }
        if (v.months || state > 5) {
            state = 5;
            fmt += `M month${s(v.months)} `;
        }
        if (v.days || state > 4) {
            state = 4;
            fmt += `d day${s(v.days)}`;
        }
        if (v.hours || state > 3) {
            state = 3;
            fmt += `h hour${s(v.hours)}`;
        }
        if (v.minutes || state > 2) {
            state = 2;
            fmt += `${v.minutes} minute${s(v.minutes)}`;
        }
        if (v.seconds || state > 1) {
            state = 1;
            fmt += `${v.seconds} second${s(v.seconds)} `;
        }
        if (v.milliseconds) {
            state = 0;
            fmt += `${v.milliseconds} millisecond${s(v.milliseconds)}`;
        }

        return fmt;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDisplayString(type: DisplayStringInputType, obj: any): string {
    if (isNull(type)) return obj.toString();
    const d = types[type];
    if (isNull(d)) return obj.toString();
    return d(obj);
}
