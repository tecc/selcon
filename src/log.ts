/* eslint-disable @typescript-eslint/no-explicit-any */
export const Log = {
    debug(...params: any[]) {
        if (selconOptions.verbose) {
            console.debug("[DBG]:", ...params);
        }
    },
    info(...params: any[]) {
        console.log("[INF]:", ...params);
    },
    error(...params: any[]) {
        console.error("[ERR]:", ...params);
    },
    warn(...params: any[]) {
        console.warn("[WRN]:", ...params);
    }
};

export default Log;
