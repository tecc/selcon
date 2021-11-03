import { assignId, getPage, isNull, scrollTo } from "./util";
import Data from "./data";

declare const Info: {
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
    revision?: number;
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
function indexEl(name: string, el: HTMLElement, children: HTMLElement[] | NodeListOf<HTMLElement>) {
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
    children.forEach((el) => {
        parent.appendChild(indexEl(el.dataset[Data.Name]!, el, el.querySelectorAll(`*[data-${Data.Name}]`)));
    });
    parent.appendChild(childrenEl);
    return parent;
}
function rfcIndex() {
    // index
    const container = document.getElementById(INDEX_ID);
    if (container == null) {
        console.error("Index element does not exist");
        return;
    }
    const elements = document.querySelectorAll<HTMLElement>(`*[data-${Data.IsRootElement}]`);
    const parent = document.createElement("ul");
    elements.forEach((el) => {
        parent.appendChild(indexEl(el.dataset[Data.Name]!, el, el.querySelectorAll(`*[data-${Data.Name}]`)));
    });
    container.appendChild(parent);
}
// presets
type HTMLApplier = (el: HTMLElement) => void;
const Presets: Record<string, HTMLApplier> = {
    header: (el: HTMLElement) => {
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
    elements.forEach((el) => {
        const preset = el.dataset[Data.Preset];
        if (!preset) return;
        const presetF = Presets[preset];
        if (!presetF) {
            console.warn(`Element has unknown preset ${preset}, skipping`, preset, el);
            return;
        }
        // console.log(`Executing preset ${preset}`);
        presetF(el);
    });
}
// first page header
function rfcFirstPageHeader() {
    // quickinfo
    {
        const values: Record<string, string> = {
            "name": isNull(Info.nickname) ? Info.name : Info.nickname!,
            "type": Info.type,
            "revision": (Info.revision && Info.revision.toString()) || ''
        };
        for (const key of Object.keys(values)) {
            const value = values[key];
            const qiEl = document.getElementById(`info-qi-${key}`);
            if (isNull(qiEl)) {
                console.warn(`QuickInfo element ${qiEl} does not exist`);
                continue;
            }
            qiEl!.innerHTML = value;
        }
    }

    // data
    {
        const dataTableEl = document.getElementById("info-data");
        if (isNull(dataTableEl)) {
            console.error("Data table element is null");
        } else {
            const values: Record<string, HTMLApplier | null> = {
                "Author": !isNull(Info.author) ? (el: HTMLElement) => {
                    if (!Info.author.name) {
                        el.innerHTML = "[Undefined]";
                        return;
                    }

                    const type = isNull(Info.author.link) ? "span" : "a";
                    const nameEl = document.createElement(type);
                    nameEl.innerHTML = Info.author.name;
                    nameEl.classList.add("mono");
                    if (type === "a") {
                        nameEl.setAttribute("href", Info.author.link);
                    }
                    el.appendChild(nameEl);
                } : null,
                "Formal name": isNull(Info.nickname) ? null : (el) => {
                    el.innerHTML = Info.name;
                },
                "Repository": isNull(Info.repository) ? null : (el) => {
                    const linkEl = document.createElement("a");
                    linkEl.setAttribute("href", Info.repository.link);
                    linkEl.classList.add("mono");
                    linkEl.innerHTML = Info.repository.name;

                    el.appendChild(linkEl);
                    if (!isNull(Info.repository.branch)) {
                        const branchEl = document.createElement("span");
                        branchEl.innerHTML = "&nbsp;branch&nbsp;";

                        const branchNameEl = document.createElement("span");
                        branchNameEl.innerHTML = Info.repository.branch!;
                        branchNameEl.classList.add("mono");
                        branchEl.appendChild(branchNameEl);

                        el.appendChild(branchEl);
                    }
                }
            };
            for (const key of Object.keys(values)) {
                const value = values[key];
                if (isNull(value)) continue;
                console.log("Rendering " + key);

                const rowEl = document.createElement("tr");

                const headerEl = document.createElement("th");
                headerEl.innerHTML = key;
                rowEl.appendChild(headerEl);

                const valueEl = document.createElement("td");
                value!(valueEl);
                rowEl.appendChild(valueEl);

                dataTableEl!.appendChild(rowEl);
            }
        }
    }

}
// init
export function rfcInit() {
    rfcInitPresets();
    rfcFirstPageHeader();
    rfcIndex();
}
