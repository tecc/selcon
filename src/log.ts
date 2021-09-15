

/*
 * SPDX-FileCopyrightText: 2021 Cae Lundin <tecc@tecc.me>
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-KDE-Accepted-LGPL
 */

//


export const Log = {
    debug: (...params: any[]) => {
        console.debug(`[DBG]:`, ...params)
    },
    info: (...params: any[]) => {
        console.log(`[INF]:`, ...params);
    },
    error: (...params: any[]) => {
        console.error(`[ERR]:`, ...params)
    }
}

export default Log;
