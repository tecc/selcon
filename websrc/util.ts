/*
 * SPDX-FileCopyrightText: 2021 Cae Lundin <tecc@tecc.me>
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-KDE-Accepted-LGPL
 */

import Data from "./data";

let nextId = 0;
export function toString(v: any): string {
    if (v === undefined) return "undefined";
    switch (typeof v) {
        case 'object':
            return JSON.stringify(v);
        default:
            return v.toString();
    }
}
export function isNull(v: any): boolean {
    return typeof v === 'undefined' || v === null;
}
export function scrollTo(el: number): void {
    const sel = document.querySelector(`*[data-${Data.Id}="${el}"]`);
    if (sel) sel.scrollIntoView();
}
export function assignId(el: HTMLElement): number {
    const id = nextId++;
    el.dataset[Data.Id] = id.toString();
    return id;
}
export function getPage(el: HTMLElement | null): number | null {
    if (!isNull(el)) return null;
    el = el!!;
    if (typeof el.dataset[Data.Page] !== 'string') {
        const page = getPage(el.parentElement);
        el.dataset[Data.Page] = page?.toString();
    }
    const parsed = parseInt(el.dataset[Data.Page] || "-1");
    if (parsed < 0) return null;
    return parsed;
}
