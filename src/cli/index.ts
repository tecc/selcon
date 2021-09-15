/*
 * SPDX-FileCopyrightText: 2021 Cae Lundin <tecc@tecc.me>
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-KDE-Accepted-LGPL
 */

import path from "path";
import * as walk from 'walk-sync';
import Log from "../log";
import * as render from '../render'
import pkgdir from 'pkg-dir';
import fs from 'fs';
import { declareGlobal } from "../util";
import arg from 'arg';

declareGlobal('packageDir', pkgdir.sync()!!);

function walkf(dir: string): string[] {
    return walk.default(dir)
        .map((v) => { return path.resolve(dir, v); })
        .filter((v) => v.endsWith(".in.html"));
}

async function run() {
    let paths: string[] = process.execArgv
    if (paths.length == 0) paths = walkf(path.resolve(packageDir, 'rfcs'));
    else paths = paths.map((v) => path.resolve(process.cwd(), v))

    render.registerTemplate('template', fs.readFileSync(path.resolve(packageDir, 'templates/template.html'), 'utf-8'));

    Log.info(`Rendering ${paths.length} file(s)`);
    for (let path of paths) {
        await render.buildFile(path);
        Log.info(`Built ${path}`);
    }
}

function cli() {
    const args = arg({

    }, {

    });
    run();
}

cli();
