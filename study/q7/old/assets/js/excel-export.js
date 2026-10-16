(function () {
    "use strict";

    const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const XML_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    let crcTable = null;

    function appState() {
        return typeof AppState !== "undefined" ? AppState : window.AppState;
    }

    function uiManager() {
        return typeof UIManager !== "undefined" ? UIManager : window.UIManager;
    }

    function getCurrentExcelExportOptions() {
        const state = appState() || {};
        const manager = uiManager() || {};
        const dom = manager.dom;
        const className = dom && dom.classSelect ? dom.classSelect.value : "";
        return {
            equippedItems: state.equippedItems || {},
            className,
            bow: dom && dom.bowSelect ? dom.bowSelect.value : "precision",
            xinfa: state.currentXinfaLoadout || [],
            setName: dom && dom.setSelect ? dom.setSelect.value : "",
            armory: state.currentArmory || "",
            earlySeasonBonus: !!(dom && dom.earlySeasonBonusCheck && dom.earlySeasonBonusCheck.checked),
            loanDingyin: !!(dom && dom.loanDingyinCheck && dom.loanDingyinCheck.checked),
            loanDingyinValue: typeof window.normalizeLoanDingyinValue === "function"
                ? window.normalizeLoanDingyinValue(state.loanDingyinValue || [])
                : state.loanDingyinValue || [],
            classInputOverrides: typeof window.getCurrentClassInputOverrides === "function"
                ? window.getCurrentClassInputOverrides(className)
                : {},
            flowVersion: typeof window.getCurrentFlowVersionKey === "function"
                ? window.getCurrentFlowVersionKey(className)
                : "",
            flowName: typeof window.getFlowNameForClass === "function"
                ? window.getFlowNameForClass(className)
                : className
        };
    }

    function encodePathSegment(name) {
        return String(name || "").split("/").map(part => encodeURIComponent(part)).join("/");
    }

    function workbookUrl(workbookName) {
        return `excels/${encodePathSegment(workbookName)}`;
    }

    function safeFileName(name) {
        return String(name || "填表数据").replace(/[\\/:*?"<>|]/g, "_");
    }

    function downloadDateStamp() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function buildDownloadName(exportData) {
        const state = appState() || {};
        const account = state.currentAccount ? `${state.currentAccount}_` : "";
        const version = exportData && exportData.meta && exportData.meta.version || exportData.workbookName || exportData.flowName || "表格";
        return `${safeFileName(account + version.replace(/\.xlsx$/i, ""))}_${downloadDateStamp()}.xlsx`;
    }

    function readU16(view, offset) {
        return view.getUint16(offset, true);
    }

    function readU32(view, offset) {
        return view.getUint32(offset, true);
    }

    function writeU16(view, offset, value) {
        view.setUint16(offset, value, true);
    }

    function writeU32(view, offset, value) {
        view.setUint32(offset, value >>> 0, true);
    }

    function findEocd(bytes) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const minOffset = Math.max(0, bytes.length - 65558);
        for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
            if (readU32(view, offset) === 0x06054b50) return offset;
        }
        throw new Error("无法读取 xlsx：未找到 ZIP 中央目录");
    }

    function parseZip(buffer) {
        const bytes = new Uint8Array(buffer);
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const eocd = findEocd(bytes);
        const totalEntries = readU16(view, eocd + 10);
        let offset = readU32(view, eocd + 16);
        const entries = [];
        for (let index = 0; index < totalEntries; index += 1) {
            if (readU32(view, offset) !== 0x02014b50) throw new Error("无法读取 xlsx：ZIP 中央目录损坏");
            const flag = readU16(view, offset + 8);
            const method = readU16(view, offset + 10);
            const modTime = readU16(view, offset + 12);
            const modDate = readU16(view, offset + 14);
            const crc = readU32(view, offset + 16);
            const compressedSize = readU32(view, offset + 20);
            const uncompressedSize = readU32(view, offset + 24);
            const nameLength = readU16(view, offset + 28);
            const extraLength = readU16(view, offset + 30);
            const commentLength = readU16(view, offset + 32);
            const localHeaderOffset = readU32(view, offset + 42);
            const name = textDecoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
            if (readU32(view, localHeaderOffset) !== 0x04034b50) throw new Error(`无法读取 xlsx：${name} 本地文件头损坏`);
            const localNameLength = readU16(view, localHeaderOffset + 26);
            const localExtraLength = readU16(view, localHeaderOffset + 28);
            const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
            entries.push({
                name,
                flag,
                method,
                modTime,
                modDate,
                crc,
                compressedSize,
                uncompressedSize,
                compressedData: bytes.slice(dataOffset, dataOffset + compressedSize)
            });
            offset += 46 + nameLength + extraLength + commentLength;
        }
        return entries;
    }

    async function inflateRaw(data) {
        if (typeof DecompressionStream === "undefined") {
            throw new Error("当前浏览器不支持解压 xlsx 模板，请使用新版 Chrome/Edge/Safari");
        }
        const formats = ["deflate-raw", "deflate"];
        let lastError = null;
        for (const format of formats) {
            try {
                const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream(format));
                return new Uint8Array(await new Response(stream).arrayBuffer());
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error("无法解压 xlsx 内部 XML");
    }

    async function entryBytes(entry) {
        if (!entry) throw new Error("xlsx 模板缺少必要文件");
        if (entry.method === 0) return entry.compressedData;
        if (entry.method === 8) return inflateRaw(entry.compressedData);
        throw new Error(`xlsx 模板包含不支持的压缩方式：${entry.method}`);
    }

    async function entryText(entry) {
        return textDecoder.decode(await entryBytes(entry));
    }

    function entryMap(entries) {
        return new Map(entries.map(entry => [entry.name, entry]));
    }

    function parseXml(text, label) {
        const doc = new DOMParser().parseFromString(text, "application/xml");
        if (doc.getElementsByTagName("parsererror").length) throw new Error(`${label} XML 解析失败`);
        return doc;
    }

    function serializeXml(doc) {
        return textEncoder.encode(new XMLSerializer().serializeToString(doc));
    }

    function normalizeZipPath(path) {
        const parts = [];
        String(path || "").split("/").forEach(part => {
            if (!part || part === ".") return;
            if (part === "..") parts.pop();
            else parts.push(part);
        });
        return parts.join("/");
    }

    function resolveWorkbookRelTarget(target) {
        const raw = String(target || "");
        if (raw.startsWith("/")) return normalizeZipPath(raw.slice(1));
        return normalizeZipPath(`xl/${raw}`);
    }

    async function sheetPathsByName(entries) {
        const map = entryMap(entries);
        const workbookDoc = parseXml(await entryText(map.get("xl/workbook.xml")), "workbook");
        const relsDoc = parseXml(await entryText(map.get("xl/_rels/workbook.xml.rels")), "workbook rels");
        const rels = new Map();
        Array.from(relsDoc.getElementsByTagNameNS("*", "Relationship")).forEach(rel => {
            rels.set(rel.getAttribute("Id"), resolveWorkbookRelTarget(rel.getAttribute("Target")));
        });
        const result = new Map();
        Array.from(workbookDoc.getElementsByTagNameNS("*", "sheet")).forEach(sheet => {
            const name = sheet.getAttribute("name");
            const relId = sheet.getAttribute("r:id") || sheet.getAttributeNS(REL_NS, "id");
            const target = rels.get(relId);
            if (name && target) result.set(name, target);
        });
        return result;
    }

    function splitCellRef(ref) {
        const match = /^([A-Z]+)(\d+)$/i.exec(String(ref || "").trim());
        if (!match) throw new Error(`无效单元格地址：${ref}`);
        return { col: match[1].toUpperCase(), row: Number(match[2]), cell: `${match[1].toUpperCase()}${match[2]}` };
    }

    function columnNumber(col) {
        return String(col || "").toUpperCase().split("").reduce((total, ch) => total * 26 + ch.charCodeAt(0) - 64, 0);
    }

    function cellColumnNumber(cellRef) {
        return columnNumber(splitCellRef(cellRef).col);
    }

    function directChildrenByLocalName(node, localName) {
        return Array.from(node.childNodes).filter(child => child.nodeType === 1 && child.localName === localName);
    }

    function ensureRow(doc, sheetData, rowNumber) {
        const rows = directChildrenByLocalName(sheetData, "row");
        let insertBefore = null;
        for (const row of rows) {
            const current = Number(row.getAttribute("r"));
            if (current === rowNumber) return row;
            if (!insertBefore && current > rowNumber) insertBefore = row;
        }
        const row = doc.createElementNS(XML_NS, "row");
        row.setAttribute("r", String(rowNumber));
        sheetData.insertBefore(row, insertBefore);
        return row;
    }

    function ensureCell(doc, row, cellRef) {
        const cells = directChildrenByLocalName(row, "c");
        const targetColumn = cellColumnNumber(cellRef);
        let insertBefore = null;
        for (const cell of cells) {
            const ref = cell.getAttribute("r");
            if (ref === cellRef) return cell;
            if (!insertBefore && cellColumnNumber(ref) > targetColumn) insertBefore = cell;
        }
        const cell = doc.createElementNS(XML_NS, "c");
        cell.setAttribute("r", cellRef);
        row.insertBefore(cell, insertBefore);
        return cell;
    }

    function setCellValue(doc, cell, kind, value) {
        while (cell.firstChild) cell.removeChild(cell.firstChild);
        if (kind === "str") {
            cell.setAttribute("t", "inlineStr");
            const inline = doc.createElementNS(XML_NS, "is");
            const text = doc.createElementNS(XML_NS, "t");
            const str = String(value || "");
            if (/^\s|\s$/.test(str)) text.setAttribute("xml:space", "preserve");
            text.textContent = str;
            inline.appendChild(text);
            cell.appendChild(inline);
            return;
        }
        cell.removeAttribute("t");
        const number = Number(value);
        const v = doc.createElementNS(XML_NS, "v");
        v.textContent = Number.isFinite(number) ? String(number) : "0";
        cell.appendChild(v);
    }

    function patchSheetXml(xmlText, updates, label) {
        const doc = parseXml(xmlText, label);
        const sheetData = doc.getElementsByTagNameNS("*", "sheetData")[0];
        if (!sheetData) throw new Error(`${label} 缺少 sheetData`);
        updates.forEach(update => {
            const ref = splitCellRef(update.cell);
            const row = ensureRow(doc, sheetData, ref.row);
            const cell = ensureCell(doc, row, ref.cell);
            setCellValue(doc, cell, update.kind, update.value);
        });
        return serializeXml(doc);
    }

    function patchWorkbookXml(xmlText) {
        const doc = parseXml(xmlText, "workbook");
        const workbook = doc.documentElement;
        let calcPr = doc.getElementsByTagNameNS("*", "calcPr")[0];
        if (!calcPr) {
            calcPr = doc.createElementNS(XML_NS, "calcPr");
            workbook.appendChild(calcPr);
        }
        calcPr.setAttribute("calcMode", "auto");
        calcPr.setAttribute("fullCalcOnLoad", "1");
        calcPr.setAttribute("forceFullCalc", "1");
        return serializeXml(doc);
    }

    function buildUpdates(exportData) {
        const updates = [];
        (exportData.fields || []).forEach((field, index) => {
            const cellRef = exportData.cells && exportData.cells[index];
            if (!cellRef || !cellRef.includes("!")) return;
            const bang = cellRef.lastIndexOf("!");
            updates.push({
                field,
                sheet: cellRef.slice(0, bang),
                cell: cellRef.slice(bang + 1).toUpperCase(),
                kind: exportData.kinds && exportData.kinds[index] === "str" ? "str" : "num",
                value: exportData.values[index]
            });
        });
        return updates;
    }

    async function patchWorkbook(buffer, exportData) {
        const entries = parseZip(buffer);
        const map = entryMap(entries);
        const sheetPaths = await sheetPathsByName(entries);
        const replacements = new Map();
        const grouped = new Map();
        buildUpdates(exportData).forEach(update => {
            const path = sheetPaths.get(update.sheet);
            if (!path) throw new Error(`模板中找不到工作表：${update.sheet}`);
            if (!grouped.has(path)) grouped.set(path, []);
            grouped.get(path).push(update);
        });
        for (const [path, updates] of grouped.entries()) {
            const entry = map.get(path);
            if (!entry) throw new Error(`模板中找不到工作表文件：${path}`);
            replacements.set(path, patchSheetXml(await entryText(entry), updates, path));
        }
        const workbookEntry = map.get("xl/workbook.xml");
        if (workbookEntry) replacements.set("xl/workbook.xml", patchWorkbookXml(await entryText(workbookEntry)));
        return writeZip(entries, replacements);
    }

    function makeCrcTable() {
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n += 1) {
            let c = n;
            for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            table[n] = c >>> 0;
        }
        return table;
    }

    function crc32(bytes) {
        if (!crcTable) crcTable = makeCrcTable();
        let crc = 0xffffffff;
        for (let index = 0; index < bytes.length; index += 1) {
            crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    function currentDosDateTime() {
        const date = new Date();
        const year = Math.max(1980, date.getFullYear());
        const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
        const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
        return { dosDate, dosTime };
    }

    function concatParts(parts) {
        const total = parts.reduce((sum, part) => sum + part.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        parts.forEach(part => {
            out.set(part, offset);
            offset += part.length;
        });
        return out;
    }

    function writeZip(originalEntries, replacements) {
        const fileParts = [];
        const centralParts = [];
        const now = currentDosDateTime();
        let offset = 0;
        originalEntries.forEach(original => {
            const replacement = replacements.get(original.name);
            const data = replacement || original.compressedData;
            const method = replacement ? 0 : original.method;
            const flag = (replacement ? 0x0800 : original.flag) & ~0x0008;
            const crc = replacement ? crc32(data) : original.crc;
            const uncompressedSize = replacement ? data.length : original.uncompressedSize;
            const compressedSize = data.length;
            const modTime = replacement ? now.dosTime : original.modTime;
            const modDate = replacement ? now.dosDate : original.modDate;
            const nameBytes = textEncoder.encode(original.name);

            const local = new Uint8Array(30 + nameBytes.length);
            const localView = new DataView(local.buffer);
            writeU32(localView, 0, 0x04034b50);
            writeU16(localView, 4, 20);
            writeU16(localView, 6, flag);
            writeU16(localView, 8, method);
            writeU16(localView, 10, modTime);
            writeU16(localView, 12, modDate);
            writeU32(localView, 14, crc);
            writeU32(localView, 18, compressedSize);
            writeU32(localView, 22, uncompressedSize);
            writeU16(localView, 26, nameBytes.length);
            writeU16(localView, 28, 0);
            local.set(nameBytes, 30);
            fileParts.push(local, data);

            const central = new Uint8Array(46 + nameBytes.length);
            const centralView = new DataView(central.buffer);
            writeU32(centralView, 0, 0x02014b50);
            writeU16(centralView, 4, 20);
            writeU16(centralView, 6, 20);
            writeU16(centralView, 8, flag);
            writeU16(centralView, 10, method);
            writeU16(centralView, 12, modTime);
            writeU16(centralView, 14, modDate);
            writeU32(centralView, 16, crc);
            writeU32(centralView, 20, compressedSize);
            writeU32(centralView, 24, uncompressedSize);
            writeU16(centralView, 28, nameBytes.length);
            writeU16(centralView, 30, 0);
            writeU16(centralView, 32, 0);
            writeU16(centralView, 34, 0);
            writeU16(centralView, 36, 0);
            writeU32(centralView, 38, 0);
            writeU32(centralView, 42, offset);
            central.set(nameBytes, 46);
            centralParts.push(central);

            offset += local.length + data.length;
        });
        const centralOffset = offset;
        const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
        const eocd = new Uint8Array(22);
        const eocdView = new DataView(eocd.buffer);
        writeU32(eocdView, 0, 0x06054b50);
        writeU16(eocdView, 8, originalEntries.length);
        writeU16(eocdView, 10, originalEntries.length);
        writeU32(eocdView, 12, centralSize);
        writeU32(eocdView, 16, centralOffset);
        writeU16(eocdView, 20, 0);
        return concatParts([...fileParts, ...centralParts, eocd]);
    }

    async function downloadFilledExcel() {
        const button = document.getElementById("download-filled-excel-btn");
        const oldText = button ? button.textContent : "";
        try {
            const state = appState();
            if (!state || !state.currentAccount) {
                alert("请先选择或创建角色");
                return;
            }
            const runtime = window.YYSLSExcelRuntime;
            if (!runtime || !runtime.ready) throw new Error("计算模块尚未加载完成");
            if (button) {
                button.disabled = true;
                button.textContent = "生成中...";
            }
            await runtime.ready;
            const exportData = runtime.exportClassInputData(getCurrentExcelExportOptions());
            if (!exportData || !exportData.workbookName) throw new Error("当前流派没有可下载的表格模板");
            const response = await fetch(workbookUrl(exportData.workbookName));
            if (!response.ok) throw new Error(`无法下载模板：${exportData.workbookName}`);
            const filled = await patchWorkbook(await response.arrayBuffer(), exportData);
            const blob = new Blob([filled], { type: XLSX_MIME });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = buildDownloadName(exportData);
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("下载填好的 Excel 失败：", error);
            alert(`下载填好的 Excel 失败：${error && error.message ? error.message : error}`);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = oldText || "下载填好的表格";
            }
        }
    }

    function initExcelExportButton() {
        const button = document.getElementById("download-filled-excel-btn");
        if (!button || button.dataset.excelExportBound) return;
        button.dataset.excelExportBound = "1";
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            downloadFilledExcel();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initExcelExportButton);
    } else {
        initExcelExportButton();
    }

    window.YYSLSExcelExporter = {
        downloadFilledExcel,
        _internals: {
            parseZip,
            patchWorkbook,
            writeZip,
            buildUpdates
        }
    };
}());
