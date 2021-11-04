import { isNull } from "@/util";

export default {
    "--verbose": Boolean,
    "-v": "--verbose",
    "--silent": Boolean,
    "-s": "--silent"
};

export const opts = {
    or<T>(a: T | undefined, b: T): T {
        return isNull(a) ? b : a!;
    }
};