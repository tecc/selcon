/*
 * SPDX-FileCopyrightText: 2021 Cae Lundin <tecc@tecc.me>
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-KDE-Accepted-LGPL
 */

declare interface RFC {
    name: string;
    nickname?: string;
    author: {
        name: string;
        link: string;
    };
    repository: {
        name: string;
        link: string;
        branch?: string;
    };
    type: string;
}

declare const packageDir: string;
