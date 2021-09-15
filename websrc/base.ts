/*
 * SPDX-FileCopyrightText: 2021 Cae Lundin <tecc@tecc.me>
 *
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-KDE-Accepted-LGPL
 */

import { assignId, getPage, isNull, scrollTo } from './util';
import Data from './data';

declare const RFC: {
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
};

const INDEX_ID = "index-id";

function getRootContentsOfPage(page: number) {
    const sel = document.querySelector(`*[data-${Data.Page}="${page}"]`);
    if (!sel) {
        console.warn(`Cannot find page ${page}`);
        return;
    }
}
// index
function indexEl(name, el, children) {
    const parent = document.createElement("li");
    const id = assignId(el);
    // label
    const nameEl = document.createElement("div");
    {
        const linkEl = document.createElement("a");
        linkEl.dataset[Data.ScrollTo] = Data.Id;
        linkEl.onclick = () => scrollTo(id);
        linkEl.innerHTML = name;
        linkEl.classList.add("index-link");
        nameEl.appendChild(linkEl);
    }
    parent.appendChild(nameEl);
    // children
    const childrenEl = document.createElement("ul");
    for (let el of children) {
        parent.appendChild(indexEl(el.dataset[Data.Name], el, el.querySelectorAll(`*[data-${Data.Name}]`)));
    }
    parent.appendChild(childrenEl);
    return parent
}
function rfcIndex() {
    // index
    const container = document.getElementById(INDEX_ID);
    const elements = document.querySelectorAll<HTMLElement>(`*[data-${Data.IsRootElement}]`);
    const parent = document.createElement("ul");
    for (let el of elements) {
        parent.appendChild(indexEl(el.dataset[Data.Name], el, el.querySelectorAll(`*[data-${Data.Name}]`)));
    }
    container.appendChild(parent);
}
// presets
const Presets = {
    header: (el) => {
        el.classList.add("preset-header", "light");
        const page = getPage(el);
        {
            const nameEl = document.createElement("div");
            nameEl.classList.add("montserrat", "fst-bold");
            nameEl.innerHTML = "Krita Extension Manager";
            el.appendChild(nameEl);
            const nicknameEl = document.createElement("span");
            nicknameEl.innerHTML = "&nbsp;Kritex";
            nicknameEl.classList.add("fst-norm", "fst-italic");
            nameEl.appendChild(nicknameEl);
        }
        {
            const pageEl = document.createElement("div");
            pageEl.innerHTML = `Page ${page}`;
            el.appendChild(pageEl);
        }
    }
};
function rfcInitPresets() {
    const elements = document.querySelectorAll<HTMLElement>(`*[data-${Data.Preset}]`);
    for (const el of elements) {
        const preset = el.dataset[Data.Preset];
        if (!preset) continue;
        const presetF = Presets[preset];
        if (!presetF) {
            console.warn(`Element has unknown preset ${preset}, skipping`, preset, el);
            continue;
        }
        // console.log(`Executing preset ${preset}`);
        presetF(el);
    }
}
// first page header
function rfcFirstPageHeader() {
    // quickinfo
    {
        const values = {
            'name': isNull(RFC.nickname) ? RFC.name : RFC.nickname,
            'type': RFC.type
        };
        for (const key of Object.keys(values)) {
            const value = values[key];
            const qiEl = document.getElementById(`info-qi-${key}`);
            qiEl.innerHTML = value;
        }
    }

    // data
    {
        const dataTableEl = document.getElementById('info-data');
        const values = {
            'Author': !isNull(RFC.author) ? (el) => {
                if (!RFC.author.name) {
                    el.innerHTML = "[Undefined]";
                    return;
                }

                const type = isNull(RFC.author.link) ? 'span' : 'a';
                const nameEl = document.createElement(type);
                nameEl.innerHTML = RFC.author.name;
                nameEl.classList.add('mono');
                if (type === 'a') {
                    nameEl.setAttribute('href', RFC.author.link);
                }
                el.appendChild(nameEl);
            } : null,
            'Formal name': isNull(RFC.nickname) ? null : (el) => {
                el.innerHTML = RFC.name;
            },
            'Repository': isNull(RFC.repository) ? null : (el) => {
                const linkEl = document.createElement('a');
                linkEl.setAttribute('href', RFC.repository.link);
                linkEl.classList.add('mono');
                linkEl.innerHTML = RFC.repository.name;

                el.appendChild(linkEl);
                if (!isNull(RFC.repository.branch)) {
                    const branchEl = document.createElement('span');
                    branchEl.innerHTML = `&nbsp;branch&nbsp;`;

                    const branchNameEl = document.createElement('span');
                    branchNameEl.innerHTML = RFC.repository.branch;
                    branchNameEl.classList.add('mono');
                    branchEl.appendChild(branchNameEl);

                    el.appendChild(branchEl)
                }
            }
        };
        for (const key of Object.keys(values)) {
            const value = values[key];
            if (isNull(value)) continue;
            console.log("Rendering " + key);

            const rowEl = document.createElement('tr');

            const headerEl = document.createElement('th');
            headerEl.innerHTML = key;
            rowEl.appendChild(headerEl);

            const valueEl = document.createElement('td');
            value(valueEl);
            rowEl.appendChild(valueEl);

            dataTableEl.appendChild(rowEl);
        }
    }
}
// init
function rfcInit() {
    rfcInitPresets();
    rfcFirstPageHeader();
    rfcIndex();
}
