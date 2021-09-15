/*
 * SPDX-FileCopyrightText: 2021 Cae Lundin <tecc@tecc.me>
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-KDE-Accepted-LGPL
 */

import fs from 'fs';
import fm from 'front-matter';
import path from 'path';
import Log from './log';

function toString(v: any) {
    if (v === undefined) return "undefined";
    switch (typeof v) {
        case 'object':
            return JSON.stringify(v);
        default:
            return v.toString();
    }
}

export function render(data: string, template: string) {
    function replace(t: string, name: string, value: string): string {
        return t.replace(`{{${name}}}`, value);
    }
    function transformToKeyValueMap(o: Record<string, any>, base?: string): Record<string, string> {
        if (o == null) return {};
        const map: Record<string, string> = {};
        for (const key of Object.keys(o)) {
            const newKey = base ? `${base}.${key}` : key;
            const value = o[key];
            switch (typeof value) {
                case 'object':
                    Object.assign(map, transformToKeyValueMap(value, newKey));
                    break;
                case 'undefined':
                    break;
                default:
                    map[newKey] = value.toString();
            }
        }
        return map;
    }
    const matter = fm<RFC>(data);

    const m = matter.attributes;
    const script = `
    const RFC = JSON.parse(\`${JSON.stringify(m)}\`);
    `;

    const templating = Object.assign({},
        transformToKeyValueMap(matter.attributes, 'page'),
        transformToKeyValueMap({
            'SCRIPT': script,
            'TEMPLATE': matter.body
        })
    );
    let rendered = template;
    for (const key of Object.keys(templating)) {
        rendered = replace(rendered, key, templating[key]);
        Log.debug("Replaced key " + key + " with " + templating[key])
    }
    return rendered.replace(/\{\{(.+)\}\}/g, '$1');
}
const templates: Record<string, string> = {};

export function buildFile(file: string): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) {
                Log.error(`Couldn't read file ${file}`, err)
                reject(err);
                return;
            }

            const rendered = render(data, templates["template"]);

            const parts = path.basename(file).split('.');
            const filename = parts.slice(0, parts.length - 2);
            const outputPath = path.resolve(path.dirname(file), `${filename}.html`);
            fs.writeFile(outputPath, rendered, 'utf-8', (err) => {
                if (err) {
                    Log.error(`Couldn't write to file`);
                    reject(err);
                    return;
                }

                resolve();
                return;
            })

            return;
        });
    });
    return promise;
}

export function registerTemplate(name: string, content: string) {
    templates[name] = content;
}
