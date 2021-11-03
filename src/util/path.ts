import * as path from "path";

export { resolve, basename, extname, relative, dirname, sep, delimiter, join, isAbsolute, parse, normalize, format, toNamespacedPath, ParsedPath, FormatInputPathObject, PlatformPath } from "path";

export function filename(str: string): string {
    return path.parse(str).name;
}
