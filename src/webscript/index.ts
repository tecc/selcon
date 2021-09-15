/*
 * SPDX-FileCopyrightText: 2021 Cae Lundin <tecc@tecc.me>
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-KDE-Accepted-LGPL
 */

import ts from 'typescript';
import path from 'path';
import { dataFile } from 'src/util';
import fs from 'fs';

function basedir(): string {
    const path = dataFile('webscript');
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
    return path;
}
function file(...n: string[]): string {
    return path.resolve(basedir(), ...n);
}

const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES3,
    module: ts.ModuleKind.None,
    strict: true,
    outFile: file('script.js')
}

ts.createCompilerHost(options)
