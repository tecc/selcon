/*
 * SPDX-FileCopyrightText: 2021 Cae Lundin <tecc@tecc.me>
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-KDE-Accepted-LGPL
 */


import path from "path";

export type DefaultGlobalKey = (keyof (typeof global));
export type ExtraGlobalKey = 'packageDir';
export type GlobalKey = ExtraGlobalKey | DefaultGlobalKey;
export function declareGlobal<T>(name: GlobalKey | string, v: T) {
    (global as any)[name] = v;
}

export function dataFile(...n: string[]): string {
    return path.resolve(packageDir, '.rfc', ...n);
}
