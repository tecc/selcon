import * as path from "@/util/path";
import walk from "walk-sync";
import { isNull } from "@/util";

export * from "fs";

export type WalkFunction<T> = (path: string) => T;
export interface WalkOptions {
    includeDirectories?: boolean
    relative?: boolean
    filter?: WalkFunction<boolean> | null
    map?: WalkFunction<string> | null
    mapBeforeFilter?: boolean
}
export const DEFAULT_WALK_OPTIONS: Required<WalkOptions> = {
    includeDirectories: false,
    relative: false,
    filter: null,
    map: null,
    mapBeforeFilter: true
};
/**
 * Walks a directory.
 *
 * @param dir The directory to walk
 * @param opts The options of how to walk the directory
 * @returns
 */
export function walkDirectory(dir: string, opts?: WalkOptions): string[] {
    const directory = path.resolve(dir);
    const options: Required<WalkOptions> = isNull(opts) ? DEFAULT_WALK_OPTIONS : Object.assign({}, DEFAULT_WALK_OPTIONS, opts);
    const unmapped = walk(dir, {
        directories: options.includeDirectories
    });
    if (isNull(unmapped)) return [];
    const mapped = [];
    const useMap = !isNull(options.map);
    for (const unmappedPath of unmapped) {
        let mappedPath = path.resolve(directory, unmappedPath);
        if (options.relative) {
            mappedPath = path.relative(directory, mappedPath);
        }
        if (options.mapBeforeFilter && useMap) {
            mappedPath = options.map!(mappedPath);
        }
        if (!isNull(options.filter)) {
            if (!options.filter!(mappedPath)) {
                continue;
            }
        }
        if (!options.mapBeforeFilter && useMap) {
            mappedPath = options.map!(mappedPath);
        }
        mapped.push(mappedPath);
    }
    return mapped;
}
