#target indesign
#targetengine "tableLineHelperManualEngine"

/*
SCRIPTMETA-BEGIN
Script-ID=com.gyahtei.dtp.table-line-helper.indesign
Version=1.0.0
Meta-URL=https://github.com/SatoruTakahashi7/InDesign-Table-Tools
Target-App=indesign
Name=表組の罫線をいじるやつ / Table Line Helper
Author=GYAHTEI Design Laboratory / Satoru Takahashi
Description-BEGIN
InDesignの表セル罫線操作を補助するスクリプトです。
全体・外枠・内部・個別線を、見やすいUIで選択し、線幅・線種・スウォッチ色を指定して適用できます。
Description-END
SCRIPTMETA-END


    TableLineHelper.jsx
    Japanese name: 表組の罫線をいじるやつ.jsx

    Version: 1.0.0
    Updated: 2026-05-03
    GYAHTEI Design Laboratory
    @gyahtei_satoru
    Developed with ChatGPT
    InDesign 表罫線操作補助ツール

    表セルを選択してから起動し、表組の罫線を操作するための補助スクリプトです。
    InDesign標準の線パネルで行う表罫線操作を、見やすく・押しやすいUIで行えるようにします。

    ■注意
    必ず複製データ、または元に戻せる状態で検証してから使用してください。
    特に結合セルを含む表では、内部罫線の処理が意図通りにならない場合があります。

    Credits:
    - Planning / testing / direction: GYAHTEI Design Laboratory @gyahtei_satoru
    - Development support: ChatGPT

    機能:
    - 表セル選択後に手動起動
    - 全部適用
    - 外枠適用
    - 内部適用
    - 外枠消去
    - 内部消去
    - 全消去
    - 外枠太線 + 内部細線
    - 上 / 下 / 左 / 右 / 内側横 / 内側縦 の個別指定
    - 罫線選択用の視覚的UI
    - 線幅の手入力および候補選択
    - 単位 mm / pt 対応
    - 線種プルダウン
    - スウォッチ色プルダウン
    - 前回設定の保持
    - ユーザー定義プリセットの保存 / 読み込み / 削除
    - プリセット選択時の設定自動反映
    - 結合セルを含む内部罫線処理時の警告表示
    - テンキーによる線選択の試験的対応

    操作:
    1. InDesign上で表セルを選択します。
    2. スクリプトパネルからこのスクリプトを実行します。
    3. 処理モードを選びます。
       - クイック操作
       - 線選択
    4. 線幅、単位、必要に応じて色・線種を指定します。
    5. 実行ボタンで罫線を適用します。

    処理モード:
    クイック操作:
    - 全部適用
    - 外枠適用
    - 内部適用
    - 外枠消去
    - 内部消去
    - 全消去
    - 外枠太線 + 内部細線

    線選択:
    - 上
    - 下
    - 左
    - 右
    - 内側横
    - 内側縦

    テンキー操作（試験的機能）:
    - 7: 上 + 左
    - 8: 上
    - 9: 上 + 右
    - 4: 左
    - 5: 内側横 + 内側縦
    - 6: 右
    - 1: 下 + 左
    - 2: 下
    - 3: 下 + 右
    - 0: 全解除
    - .: 全部選択

    注意:
    このスクリプトは、InDesignの表セル罫線を対象にしています。
    表以外のオブジェクト、段落罫線、文字飾り罫線、アンカー付きオブジェクト等は対象外です。

    結合セルについて:
    結合セルを含む表では、内部罫線の処理はベストエフォートです。
    InDesignの表では、結合セルが見た目上は複数の行・列にまたがっていても、
    スクリプト上は1つのCellとして扱われる場合があります。

    そのため、以下の処理では、内部罫線が一部反映されない、
    または想定外の辺に反映される可能性があります。

    - 内部適用
    - 内部消去
    - 内側横
    - 内側縦
    - 外枠太線 + 内部細線

    結合セルを含む選択範囲でこれらの処理を実行する場合、
    スクリプトは確認ダイアログを表示します。
    処理後は、必ず結果を目視で確認してください。

    テンキー操作について:
    テンキーによる線選択は試験的機能です。
    キーボードやOS、InDesignのバージョン、ScriptUIのフォーカス状態によっては、
    期待通りに動作しない場合があります。

    制限事項:
    - InDesign標準の線パネルと完全に同一の挙動を保証するものではありません。
    - 複雑な結合セルを含む表では、内部罫線の判定に限界があります。
    - 選択範囲が複数の表にまたがる場合は処理できません。
    - ロックされたオブジェクト、編集不可のストーリー、マスターページ上の表などでは処理できない場合があります。
    - 実行前にデータを保存し、必要に応じて複製データで検証してください。

    注意:
    - 結果に関しては一切の保証はできません。
    - 本スクリプトの読み取り結果および使用結果について、正確性・完全性は保証できません。
*/

(function () {
    var SCRIPT_NAME = "Table Line Helper";
    var PREF_KEY = "TableLineHelperPrefs_v3";
    var PRESET_KEY = "TableLineHelperUserPresets_v1";
    var WEIGHT_VALUES_MM = ["0.1", "0.15", "0.25", "0.3", "0.4", "0.5", "0.75", "1", "2", "3"];
    var WEIGHT_VALUES_PT = ["0.25", "0.3", "0.5", "1", "2", "4", "6", "8", "10"];


    // =========================================================
    // Utility
    // =========================================================
    function safeAlert(msg) {
        try {
            alert(msg, SCRIPT_NAME);
        } catch (e) {
            alert(msg);
        }
    }

    function logError(msg, e) {
        try {
            $.writeln("[TableLineHelper] " + msg + (e ? " / " + e : ""));
        } catch (_) {}
    }

    function toNumber(v, fallback) {
        if (v === undefined || v === null) return fallback;

        var s = String(v);
        s = s.replace(/,/g, ".");
        s = s.replace(/[^\d.\-]/g, "");

        if (/^\.\d+$/.test(s)) {
            s = "0" + s;
        } else if (/^-\.\d+$/.test(s)) {
            s = s.replace("-.", "-0.");
        }

        var n = parseFloat(s);
        return isNaN(n) ? fallback : n;
    }

    function normalizeNumberField(et) {
        try {
            var n = toNumber(et.text, null);
            if (n === null) return;
            et.text = String(n);
        } catch (e) {}
    }

    function makeMeasurementString(rawValue, unit) {
        return String(rawValue) + unit;
    }

    function savePrefs(ui) {
        try {
            var data = captureUIState(ui);
            app.insertLabel(PREF_KEY, data.toSource());
        } catch (e) {}
    }

    function loadPrefs() {
        try {
            var s = app.extractLabel(PREF_KEY);
            if (!s) return null;
            return eval(s);
        } catch (e) {
            return null;
        }
    }


    function captureUIState(ui) {
        return {
            weight: ui.weightEt ? ui.weightEt.text : "0.1",
            unit: ui.unitDd && ui.unitDd.selection ? ui.unitDd.selection.text : "mm",
            outer: ui.outerEt ? ui.outerEt.text : "0.3",
            inner: ui.innerEt ? ui.innerEt.text : "0.1",
            applyAppearance: ui.appearanceChk ? ui.appearanceChk.value : false,
            strokeStyle: ui.styleDd && ui.styleDd.selection ? ui.styleDd.selection.text : "",
            color: ui.colorDd && ui.colorDd.selection ? ui.colorDd.selection.text : "",
            quickMode: getQuickMode(ui),
            operationMode: ui.rbModeManual && ui.rbModeManual.value ? "manual" : "quick",
            top: ui.topChk ? ui.topChk.value : false,
            bottom: ui.bottomChk ? ui.bottomChk.value : false,
            left: ui.leftChk ? ui.leftChk.value : false,
            right: ui.rightChk ? ui.rightChk.value : false,
            innerH: ui.innerHChk ? ui.innerHChk.value : false,
            innerV: ui.innerVChk ? ui.innerVChk.value : false
        };
    }

    function applyUIState(ui, data) {
        if (!data) return;
        try {
            if (data.weight !== undefined && ui.weightEt) ui.weightEt.text = data.weight;
            if (data.outer !== undefined && ui.outerEt) ui.outerEt.text = data.outer;
            if (data.inner !== undefined && ui.innerEt) ui.innerEt.text = data.inner;
            if (ui.unitDd) setDropdownByText(ui.unitDd, data.unit, 1);
            if (ui.appearanceChk) ui.appearanceChk.value = !!data.applyAppearance;
            if (ui.styleDd) setDropdownByText(ui.styleDd, data.strokeStyle, 0);
            if (ui.colorDd) setDropdownByText(ui.colorDd, data.color, 0);
            setQuickMode(ui, data.quickMode || "all");
            if (data.operationMode === "manual") {
                if (ui.rbModeManual) ui.rbModeManual.value = true;
                if (ui.rbModeQuick) ui.rbModeQuick.value = false;
            } else {
                if (ui.rbModeQuick) ui.rbModeQuick.value = true;
                if (ui.rbModeManual) ui.rbModeManual.value = false;
            }
            if (ui.topChk) ui.topChk.value = !!data.top;
            if (ui.bottomChk) ui.bottomChk.value = !!data.bottom;
            if (ui.leftChk) ui.leftChk.value = !!data.left;
            if (ui.rightChk) ui.rightChk.value = !!data.right;
            if (ui.innerHChk) ui.innerHChk.value = !!data.innerH;
            if (ui.innerVChk) ui.innerVChk.value = !!data.innerV;
        } catch (e) {}
    }

    function loadUserPresets() {
        try {
            var s = app.extractLabel(PRESET_KEY);
            if (!s) return {};
            var data = eval(s);
            if (!data) return {};
            return data;
        } catch (e) {
            return {};
        }
    }

    function saveUserPresets(presets) {
        try {
            app.insertLabel(PRESET_KEY, presets.toSource());
        } catch (e) {}
    }

    function getPresetNames(presets) {
        var names = [];
        var k;
        for (k in presets) {
            if (presets.hasOwnProperty(k)) names.push(k);
        }
        names.sort();
        return names;
    }

    function refreshPresetDropdown(ui, selectedName) {
        try {
            if (!ui.presetDd) return;
            var presets = loadUserPresets();
            var names = getPresetNames(presets);
            ui.presetDd.removeAll();
            ui.presetDd.add("item", "プリセットを選択");
            var i;
            for (i = 0; i < names.length; i++) {
                ui.presetDd.add("item", names[i]);
            }
            ui.presetDd.selection = ui.presetDd.items[0];
            if (selectedName) {
                for (i = 0; i < ui.presetDd.items.length; i++) {
                    if (ui.presetDd.items[i].text === selectedName) {
                        ui.presetDd.selection = ui.presetDd.items[i];
                        break;
                    }
                }
            }
        } catch (e) {}
    }

    function getSelectedPresetName(ui) {
        try {
            if (!ui.presetDd || !ui.presetDd.selection) return "";
            var name = ui.presetDd.selection.text;
            if (name === "プリセットを選択") return "";
            return name;
        } catch (e) {
            return "";
        }
    }

    function quickModeLabel(mode) {
        if (mode === "all") return "全部適用";
        if (mode === "outer") return "外枠適用";
        if (mode === "inner") return "内部適用";
        if (mode === "outerInner") return "外枠太線+内部細線";
        if (mode === "clearOuter") return "外枠消去";
        if (mode === "clearInner") return "内部消去";
        if (mode === "clearAll") return "全消去";
        return "全部適用";
    }

    function manualLineSummary(data) {
        var lines = [];
        if (data.top) lines.push("上");
        if (data.bottom) lines.push("下");
        if (data.left) lines.push("左");
        if (data.right) lines.push("右");
        if (data.innerH) lines.push("内側横");
        if (data.innerV) lines.push("内側縦");
        return lines.length ? lines.join(" / ") : "線選択なし";
    }

    function presetSummaryText(name, data) {
        if (!name || !data) {
            return "プリセットを選ぶと設定に反映されます。実行はまだしません。";
        }

        var unit = data.unit || "mm";
        var mode = data.operationMode === "manual" ? "線選択" : "クイック操作";
        var action = data.operationMode === "manual" ? manualLineSummary(data) : quickModeLabel(data.quickMode || "all");
        var text = "選択中: " + name + " / " + mode + " / " + action + " / 線幅 " + (data.weight || "") + unit;

        if ((data.quickMode || "") === "outerInner") {
            text += " / 外枠 " + (data.outer || "") + unit + "・内部 " + (data.inner || "") + unit;
        }
        if (data.applyAppearance) {
            text += " / 色・線種あり";
        }
        return text;
    }

    function updatePresetInfo(ui, text) {
        try {
            if (ui && ui.presetInfoText) {
                ui.presetInfoText.text = text || "プリセットを選ぶと設定に反映されます。実行はまだしません。";
            }
        } catch (e) {}
    }

    function saveCurrentPreset(ui) {
        try {
            var defaultName = getSelectedPresetName(ui) || "新規プリセット";
            var name = prompt("プリセット名を入力してください。", defaultName, SCRIPT_NAME);
            if (name === null) return;
            name = String(name).replace(/^\s+|\s+$/g, "");
            if (!name) return;

            var presets = loadUserPresets();
            if (presets[name]) {
                if (!confirm("同じ名前のプリセットがあります。上書きしますか？")) return;
            }
            presets[name] = captureUIState(ui);
            saveUserPresets(presets);
            refreshPresetDropdown(ui, name);
            updatePresetInfo(ui, presetSummaryText(name, presets[name]));
        } catch (e) {}
    }

    function loadSelectedPreset(ui) {
        try {
            var name = getSelectedPresetName(ui);
            if (!name) {
                safeAlert("読み込むプリセットを選択してください。");
                return false;
            }
            var presets = loadUserPresets();
            if (!presets[name]) {
                safeAlert("プリセットが見つかりません。");
                refreshPresetDropdown(ui, "");
                return false;
            }
            applyUIState(ui, presets[name]);
            return true;
        } catch (e) {
            return false;
        }
    }

    function deleteSelectedPreset(ui) {
        try {
            var name = getSelectedPresetName(ui);
            if (!name) {
                safeAlert("削除するプリセットを選択してください。");
                return;
            }
            if (!confirm("プリセット「" + name + "」を削除しますか？")) return;
            var presets = loadUserPresets();
            delete presets[name];
            saveUserPresets(presets);
            refreshPresetDropdown(ui, "");
            updatePresetInfo(ui, "プリセットを削除しました。");
        } catch (e) {}
    }

    function setDropdownByText(dd, text, fallbackIndex) {
        var i;
        try {
            if (!dd || !dd.items || !dd.items.length) return;
            if (text) {
                for (i = 0; i < dd.items.length; i++) {
                    if (dd.items[i].text === text) {
                        dd.selection = dd.items[i];
                        return;
                    }
                }
            }
            if (fallbackIndex === undefined || fallbackIndex === null) fallbackIndex = 0;
            if (dd.items.length > fallbackIndex) {
                dd.selection = dd.items[fallbackIndex];
            } else {
                dd.selection = dd.items[0];
            }
        } catch (e) {}
    }

    function getQuickMode(ui) {
        try {
            if (ui.rbAll && ui.rbAll.value) return "all";
            if (ui.rbOuter && ui.rbOuter.value) return "outer";
            if (ui.rbInner && ui.rbInner.value) return "inner";
            if (ui.rbOuterInner && ui.rbOuterInner.value) return "outerInner";
            if (ui.rbClearOuter && ui.rbClearOuter.value) return "clearOuter";
            if (ui.rbClearInner && ui.rbClearInner.value) return "clearInner";
            if (ui.rbClearAll && ui.rbClearAll.value) return "clearAll";
        } catch (e) {}
        return "all";
    }

    function setQuickMode(ui, mode) {
        try {
            ui.rbAll.value = mode === "all" || !mode;
            ui.rbOuter.value = mode === "outer";
            ui.rbInner.value = mode === "inner";
            ui.rbOuterInner.value = mode === "outerInner";
            ui.rbClearOuter.value = mode === "clearOuter";
            if (ui.rbClearInner) ui.rbClearInner.value = mode === "clearInner";
            ui.rbClearAll.value = mode === "clearAll";
        } catch (e) {}
    }

    function formatNumberForField(n) {
        var s = String(Math.round(n * 1000) / 1000);
        if (s.indexOf(".") >= 0) {
            s = s.replace(/0+$/, "").replace(/\.$/, "");
        }
        return s;
    }

    function incrementNumberField(et, delta) {
        var n = toNumber(et.text, 0);
        n += delta;
        if (n < 0) n = 0;
        et.text = formatNumberForField(n);
    }

    function attachCursorIncrement(et, getUnitFn) {
        try {
            et.addEventListener("keydown", function (ev) {
                var key = ev.keyName || ev.keyIdentifier || ev.key;
                if (key !== "Up" && key !== "ArrowUp" && key !== "Down" && key !== "ArrowDown") return;

                // ご指定どおり：通常=1、Shift=0.1、Option=0.01
                var step = 1;
                try {
                    if (ev.shiftKey) step = 0.1;
                    if (ev.altKey || ev.optionKey) step = 0.01;
                } catch (_) {}

                if (key === "Down" || key === "ArrowDown") step = -step;
                incrementNumberField(et, step);
                try { ev.preventDefault(); } catch (_) {}
            });
        } catch (e) {}
    }

    function getWeightPresetValues(unit) {
        return unit === "pt" ? WEIGHT_VALUES_PT : WEIGHT_VALUES_MM;
    }

    function chooseWeightPreset(targetEt, unit) {
        try {
            var values = getWeightPresetValues(unit);
            var labels = [];
            var i;
            for (i = 0; i < values.length; i++) {
                labels.push(values[i] + unit);
            }

            var w = new Window("dialog", "線幅を選択");
            w.orientation = "column";
            w.alignChildren = ["fill", "top"];
            w.margins = 12;

            var list = w.add("listbox", undefined, labels);
            list.preferredSize = [170, 210];

            var current = formatNumberForField(toNumber(targetEt.text, 0));
            for (i = 0; i < values.length; i++) {
                if (values[i] === current) {
                    list.selection = list.items[i];
                    break;
                }
            }
            if (!list.selection && list.items.length) list.selection = list.items[0];

            var g = w.add("group");
            g.orientation = "row";
            g.alignment = "right";
            g.add("button", undefined, "OK", { name: "ok" });
            g.add("button", undefined, "キャンセル", { name: "cancel" });

            list.onDoubleClick = function () {
                try { w.close(1); } catch (e) {}
            };

            if (w.show() === 1 && list.selection) {
                targetEt.text = values[list.selection.index];
                normalizeNumberField(targetEt);
            }
        } catch (e) {
            // 何かあっても手入力はそのまま使えるようにする
        }
    }

    function getActiveDocument() {
        try {
            if (app.documents.length > 0) return app.activeDocument;
        } catch (e) {}
        return null;
    }

    function getSelection() {
        try {
            return app.selection;
        } catch (e) {
            return [];
        }
    }

    function parentOfType(obj, typeName) {
        var cur = obj;
        while (cur) {
            try {
                if (cur && cur.constructor && cur.constructor.name === typeName) {
                    return cur;
                }
                if (!cur.parent || cur.parent === cur) break;
                cur = cur.parent;
            } catch (e) {
                break;
            }
        }
        return null;
    }

    function uniqueById(items) {
        var out = [];
        var seen = {};
        var i, id;

        for (i = 0; i < items.length; i++) {
            try {
                id = items[i].id;
                if (!seen[id]) {
                    seen[id] = true;
                    out.push(items[i]);
                }
            } catch (e) {}
        }
        return out;
    }

    function getCellFromObject(obj) {
        if (!obj) return null;

        try {
            if (obj.constructor && obj.constructor.name === "Cell") return obj;
        } catch (e) {}

        try {
            return parentOfType(obj, "Cell");
        } catch (e) {}

        return null;
    }

    function getSelectedCells() {
        var sel = getSelection();
        if (!sel || !sel.length) return [];

        var cells = [];
        var i, j, obj, name, arr, cell;

        for (i = 0; i < sel.length; i++) {
            obj = sel[i];
            name = "";
            try { name = obj.constructor.name; } catch (e) {}

            try {
                if (name === "Cell") {
                    cells.push(obj);
                    continue;
                }

                if (name === "Cells") {
                    arr = obj.everyItem().getElements();
                    for (j = 0; j < arr.length; j++) cells.push(arr[j]);
                    continue;
                }

                if (name === "Row" || name === "Column" || name === "Table") {
                    arr = obj.cells.everyItem().getElements();
                    for (j = 0; j < arr.length; j++) cells.push(arr[j]);
                    continue;
                }

                cell = getCellFromObject(obj);
                if (cell) {
                    cells.push(cell);
                    continue;
                }

                if (obj.hasOwnProperty && (obj.hasOwnProperty("baseline") || obj.hasOwnProperty("parentTextFrames"))) {
                    cell = parentOfType(obj, "Cell");
                    if (cell) {
                        cells.push(cell);
                        continue;
                    }
                }
            } catch (e) {
                logError("selection parse", e);
            }
        }

        return uniqueById(cells);
    }

    // =========================================================
    // Safe table / cell analysis
    // =========================================================
    function getCellIdSafe(cell) {
        try {
            if (!cell || !cell.isValid) return null;
            return cell.id;
        } catch (e) {
            return null;
        }
    }

    function getTableFromCells(cells) {
        var table = null;
        var i, t;

        for (i = 0; i < cells.length; i++) {
            t = parentOfType(cells[i], "Table");
            if (!t) continue;

            if (!table) {
                table = t;
            } else {
                try {
                    if (table.id !== t.id) return null;
                } catch (e) {
                    return null;
                }
            }
        }
        return table;
    }

    function getAllTableCellInfos(table) {
        var infos = [];
        var arr, i, cell, row, col, rowSpan, colSpan;

        try {
            arr = table.cells.everyItem().getElements();
        } catch (e) {
            return infos;
        }

        for (i = 0; i < arr.length; i++) {
            cell = arr[i];

            try {
                if (!cell || !cell.isValid) continue;
            } catch (e1) {
                continue;
            }

            try {
                row = cell.parentRow.index;
                col = cell.parentColumn.index;
            } catch (e2) {
                continue;
            }

            rowSpan = 1;
            colSpan = 1;

            try { rowSpan = cell.rowSpan || 1; } catch (e3) {}
            try { colSpan = cell.columnSpan || 1; } catch (e4) {}

            infos.push({
                cell: cell,
                id: getCellIdSafe(cell),
                rowStart: row,
                rowEnd: row + rowSpan - 1,
                colStart: col,
                colEnd: col + colSpan - 1
            });
        }

        return infos;
    }

    function buildInfoMapById(infos) {
        var map = {};
        var i, info;
        for (i = 0; i < infos.length; i++) {
            info = infos[i];
            if (info && info.id !== null) {
                map[info.id] = info;
            }
        }
        return map;
    }

    function buildGridMap(infos, minRow, maxRow, minCol, maxCol) {
        var grid = {};
        var i, r, c, info;

        for (i = 0; i < infos.length; i++) {
            info = infos[i];
            if (!info) continue;

            for (r = info.rowStart; r <= info.rowEnd; r++) {
                if (r < minRow || r > maxRow) continue;

                if (!grid[r]) grid[r] = {};

                for (c = info.colStart; c <= info.colEnd; c++) {
                    if (c < minCol || c > maxCol) continue;
                    grid[r][c] = info;
                }
            }
        }

        return grid;
    }

    function collectInfosFromGrid(grid, minRow, maxRow, minCol, maxCol) {
        var out = [];
        var seen = {};
        var r, c, info;

        for (r = minRow; r <= maxRow; r++) {
            if (!grid[r]) continue;

            for (c = minCol; c <= maxCol; c++) {
                info = grid[r][c];
                if (!info) continue;

                if (!seen[info.id]) {
                    seen[info.id] = true;
                    out.push(info);
                }
            }
        }

        return out;
    }

    function analyzeSelection() {
        var cells = getSelectedCells();
        if (!cells.length) {
            return {
                ok: false,
                reason: "表セルが選択されていません。"
            };
        }

        var table = getTableFromCells(cells);
        if (!table) {
            return {
                ok: false,
                reason: "同一の表セルを選択してください。"
            };
        }

        var allInfos = getAllTableCellInfos(table);
        if (!allInfos.length) {
            return {
                ok: false,
                reason: "表セル情報の取得に失敗しました。"
            };
        }

        var infoMap = buildInfoMapById(allInfos);

        var minRow = 999999, maxRow = -1, minCol = 999999, maxCol = -1;
        var i, id, info;

        for (i = 0; i < cells.length; i++) {
            id = getCellIdSafe(cells[i]);
            if (id === null) continue;

            info = infoMap[id];
            if (!info) continue;

            if (info.rowStart < minRow) minRow = info.rowStart;
            if (info.rowEnd > maxRow) maxRow = info.rowEnd;
            if (info.colStart < minCol) minCol = info.colStart;
            if (info.colEnd > maxCol) maxCol = info.colEnd;
        }

        if (maxRow < minRow || maxCol < minCol) {
            return {
                ok: false,
                reason: "選択範囲の解析に失敗しました。"
            };
        }

        var grid = buildGridMap(allInfos, minRow, maxRow, minCol, maxCol);
        var infos = collectInfosFromGrid(grid, minRow, maxRow, minCol, maxCol);
        var outCells = [];
        for (i = 0; i < infos.length; i++) {
            outCells.push(infos[i].cell);
        }

        return {
            ok: true,
            table: table,
            cells: outCells,
            infos: infos,
            grid: grid,
            minRow: minRow,
            maxRow: maxRow,
            minCol: minCol,
            maxCol: maxCol
        };
    }

    function getGridInfo(sel, row, col) {
        try {
            if (!sel.grid[row]) return null;
            return sel.grid[row][col] || null;
        } catch (e) {
            return null;
        }
    }

    // =========================================================
    // Style lookup
    // =========================================================
    function getSwatchByName(doc, name) {
        try {
            var sw = doc.swatches.itemByName(name);
            if (sw && sw.isValid) return sw;
        } catch (e) {}
        return null;
    }

    function getStrokeStyleByName(doc, name) {
        try {
            var st = doc.strokeStyles.itemByName(name);
            if (st && st.isValid) return st;
        } catch (e) {}
        return null;
    }

    function movePriorityToTop(arr, names) {
        var out = [];
        var used = {};
        var i, j;

        for (i = 0; i < names.length; i++) {
            for (j = 0; j < arr.length; j++) {
                if (!used[j] && arr[j] === names[i]) {
                    out.push(arr[j]);
                    used[j] = true;
                }
            }
        }

        for (j = 0; j < arr.length; j++) {
            if (!used[j]) out.push(arr[j]);
        }

        return out;
    }

    // =========================================================
    // Edge helpers
    // =========================================================
    function applyOneEdge(cell, edgeName, weightValue, colorObj, strokeStyleObj, setAppearance) {
        if (!cell) return;

        try {
            if (!cell.isValid) return;
        } catch (e) {
            return;
        }

        try {
            if (edgeName === "top") {
                cell.topEdgeStrokeWeight = weightValue;
                if (setAppearance) {
                    if (colorObj) cell.topEdgeStrokeColor = colorObj;
                    if (strokeStyleObj) cell.topEdgeStrokeType = strokeStyleObj;
                }
                return;
            }

            if (edgeName === "bottom") {
                cell.bottomEdgeStrokeWeight = weightValue;
                if (setAppearance) {
                    if (colorObj) cell.bottomEdgeStrokeColor = colorObj;
                    if (strokeStyleObj) cell.bottomEdgeStrokeType = strokeStyleObj;
                }
                return;
            }

            if (edgeName === "left") {
                cell.leftEdgeStrokeWeight = weightValue;
                if (setAppearance) {
                    if (colorObj) cell.leftEdgeStrokeColor = colorObj;
                    if (strokeStyleObj) cell.leftEdgeStrokeType = strokeStyleObj;
                }
                return;
            }

            if (edgeName === "right") {
                cell.rightEdgeStrokeWeight = weightValue;
                if (setAppearance) {
                    if (colorObj) cell.rightEdgeStrokeColor = colorObj;
                    if (strokeStyleObj) cell.rightEdgeStrokeType = strokeStyleObj;
                }
                return;
            }
        } catch (e2) {}
    }

    function isTopEdge(info, selectionInfo) {
        return info.rowStart === selectionInfo.minRow;
    }

    function isBottomEdge(info, selectionInfo) {
        return info.rowEnd === selectionInfo.maxRow;
    }

    function isLeftEdge(info, selectionInfo) {
        return info.colStart === selectionInfo.minCol;
    }

    function isRightEdge(info, selectionInfo) {
        return info.colEnd === selectionInfo.maxCol;
    }

    // =========================================================
    // Value readers
    // =========================================================
    function getWeightValue(ui) {
        var raw = toNumber(ui.weightEt.text, NaN);
        if (isNaN(raw) || raw < 0) {
            safeAlert("線幅を正しく入力してください。");
            return null;
        }

        var unit = ui.unitDd.selection ? ui.unitDd.selection.text : "mm";
        return makeMeasurementString(raw, unit);
    }

    function getOuterInnerValues(ui) {
        var outerRaw = toNumber(ui.outerEt.text, NaN);
        var innerRaw = toNumber(ui.innerEt.text, NaN);

        if (isNaN(outerRaw) || outerRaw < 0 || isNaN(innerRaw) || innerRaw < 0) {
            safeAlert("外枠/内部の線幅を正しく入力してください。");
            return null;
        }

        var unit = ui.unitDd.selection ? ui.unitDd.selection.text : "mm";
        return {
            outerValue: makeMeasurementString(outerRaw, unit),
            innerValue: makeMeasurementString(innerRaw, unit)
        };
    }

    function getAppearance(ui) {
        var doc = getActiveDocument();
        if (!doc) {
            safeAlert("ドキュメントがありません。");
            return null;
        }

        var setAppearance = ui.appearanceChk.value;
        var colorObj = null;
        var strokeStyleObj = null;

        if (setAppearance) {
            if (!ui.colorDd.selection) {
                safeAlert("色を選択してください。");
                return null;
            }
            if (!ui.styleDd.selection) {
                safeAlert("線種を選択してください。");
                return null;
            }

            colorObj = getSwatchByName(doc, ui.colorDd.selection.text);
            strokeStyleObj = getStrokeStyleByName(doc, ui.styleDd.selection.text);

            if (!colorObj) {
                safeAlert("選択したスウォッチが見つかりません。");
                return null;
            }
            if (!strokeStyleObj) {
                safeAlert("選択した線種が見つかりません。");
                return null;
            }
        }

        return {
            setAppearance: setAppearance,
            colorObj: colorObj,
            strokeStyleObj: strokeStyleObj
        };
    }


    function rangesOverlap(a1, a2, b1, b2) {
        return !(a2 < b1 || b2 < a1);
    }

    function applyHorizontalInternalPairs(sel, weightValue, uiAppearance) {
        var i, j, a, b, keySeen = {};

        for (i = 0; i < sel.infos.length; i++) {
            a = sel.infos[i];
            if (!a) continue;

            for (j = i + 1; j < sel.infos.length; j++) {
                b = sel.infos[j];
                if (!b || a.id === b.id) continue;

                // a が上、b が下
                if (a.rowEnd + 1 === b.rowStart && rangesOverlap(a.colStart, a.colEnd, b.colStart, b.colEnd)) {
                    var key1 = a.id + "_" + b.id + "_HP";
                    if (!keySeen[key1]) {
                        keySeen[key1] = true;
                        applyOneEdge(a.cell, "bottom", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                        applyOneEdge(b.cell, "top", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                    }
                }

                // b が上、a が下
                if (b.rowEnd + 1 === a.rowStart && rangesOverlap(a.colStart, a.colEnd, b.colStart, b.colEnd)) {
                    var key2 = b.id + "_" + a.id + "_HP";
                    if (!keySeen[key2]) {
                        keySeen[key2] = true;
                        applyOneEdge(b.cell, "bottom", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                        applyOneEdge(a.cell, "top", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                    }
                }
            }
        }
    }

    function applyVerticalInternalPairs(sel, weightValue, uiAppearance) {
        var i, j, a, b, keySeen = {};

        for (i = 0; i < sel.infos.length; i++) {
            a = sel.infos[i];
            if (!a) continue;

            for (j = i + 1; j < sel.infos.length; j++) {
                b = sel.infos[j];
                if (!b || a.id === b.id) continue;

                // a が左、b が右
                if (a.colEnd + 1 === b.colStart && rangesOverlap(a.rowStart, a.rowEnd, b.rowStart, b.rowEnd)) {
                    var key1 = a.id + "_" + b.id + "_VP";
                    if (!keySeen[key1]) {
                        keySeen[key1] = true;
                        applyOneEdge(a.cell, "right", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                        applyOneEdge(b.cell, "left", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                    }
                }

                // b が左、a が右
                if (b.colEnd + 1 === a.colStart && rangesOverlap(a.rowStart, a.rowEnd, b.rowStart, b.rowEnd)) {
                    var key2 = b.id + "_" + a.id + "_VP";
                    if (!keySeen[key2]) {
                        keySeen[key2] = true;
                        applyOneEdge(b.cell, "right", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                        applyOneEdge(a.cell, "left", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                    }
                }
            }
        }
    }


    function hasSelectedCellBetweenVertical(sel, leftInfo, rightInfo) {
        var i, x;
        for (i = 0; i < sel.infos.length; i++) {
            x = sel.infos[i];
            if (!x || x.id === leftInfo.id || x.id === rightInfo.id) continue;
            if (!rangesOverlap(x.rowStart, x.rowEnd, leftInfo.rowStart, leftInfo.rowEnd)) continue;
            if (!rangesOverlap(x.rowStart, x.rowEnd, rightInfo.rowStart, rightInfo.rowEnd)) continue;
            if (x.colStart > leftInfo.colEnd && x.colEnd < rightInfo.colStart) return true;
        }
        return false;
    }

    function hasSelectedCellBetweenHorizontal(sel, topInfo, bottomInfo) {
        var i, x;
        for (i = 0; i < sel.infos.length; i++) {
            x = sel.infos[i];
            if (!x || x.id === topInfo.id || x.id === bottomInfo.id) continue;
            if (!rangesOverlap(x.colStart, x.colEnd, topInfo.colStart, topInfo.colEnd)) continue;
            if (!rangesOverlap(x.colStart, x.colEnd, bottomInfo.colStart, bottomInfo.colEnd)) continue;
            if (x.rowStart > topInfo.rowEnd && x.rowEnd < bottomInfo.rowStart) return true;
        }
        return false;
    }

    function applyLooseInternalPairs(sel, weightValue, uiAppearance) {
        var i, j, a, b, keySeen = {};

        for (i = 0; i < sel.infos.length; i++) {
            a = sel.infos[i];
            if (!a) continue;

            for (j = i + 1; j < sel.infos.length; j++) {
                b = sel.infos[j];
                if (!b || a.id === b.id) continue;

                // 縦方向の内部線：同じ高さ方向に重なり、左右に分かれているセル同士
                if (rangesOverlap(a.rowStart, a.rowEnd, b.rowStart, b.rowEnd)) {
                    if (a.colEnd <= b.colStart && !hasSelectedCellBetweenVertical(sel, a, b)) {
                        keySeen[a.id + "_" + b.id + "_LV"] = true;
                        applyOneEdge(a.cell, "right", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                        applyOneEdge(b.cell, "left", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                    } else if (b.colEnd <= a.colStart && !hasSelectedCellBetweenVertical(sel, b, a)) {
                        keySeen[b.id + "_" + a.id + "_LV"] = true;
                        applyOneEdge(b.cell, "right", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                        applyOneEdge(a.cell, "left", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                    }
                }

                // 横方向の内部線：同じ幅方向に重なり、上下に分かれているセル同士
                if (rangesOverlap(a.colStart, a.colEnd, b.colStart, b.colEnd)) {
                    if (a.rowEnd <= b.rowStart && !hasSelectedCellBetweenHorizontal(sel, a, b)) {
                        keySeen[a.id + "_" + b.id + "_LH"] = true;
                        applyOneEdge(a.cell, "bottom", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                        applyOneEdge(b.cell, "top", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                    } else if (b.rowEnd <= a.rowStart && !hasSelectedCellBetweenHorizontal(sel, b, a)) {
                        keySeen[b.id + "_" + a.id + "_LH"] = true;
                        applyOneEdge(b.cell, "bottom", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                        applyOneEdge(a.cell, "top", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                    }
                }
            }
        }
    }

    // =========================================================
    // Merged-cell warning for internal border operations
    // =========================================================
    function selectionHasMergedCells(sel) {
        var i, info;
        try {
            if (!sel || !sel.infos) return false;
            for (i = 0; i < sel.infos.length; i++) {
                info = sel.infos[i];
                if (!info) continue;
                if (info.rowEnd > info.rowStart || info.colEnd > info.colStart) {
                    return true;
                }
            }
        } catch (e) {}
        return false;
    }

    function confirmMergedInternalRisk(sel, operationName) {
        if (!selectionHasMergedCells(sel)) return true;

        var msg =
            "選択範囲に結合セルが含まれています。\n\n" +
            "「" + operationName + "」はベストエフォートで実行します。\n" +
            "結合セルの構造によっては、内部罫線が一部反映されない、\n" +
            "または想定外の辺に反映される可能性があります。\n\n" +
            "続行しますか？";

        try {
            return confirm(msg);
        } catch (e) {
            return true;
        }
    }

    // =========================================================
    // Grid-based internal border application
    // =========================================================
    function applyHorizontalInternalGrid(table, sel, weightValue, uiAppearance) {
        var r, c, infoA, infoB, keySeen = {};

        for (r = sel.minRow; r < sel.maxRow; r++) {
            for (c = sel.minCol; c <= sel.maxCol; c++) {
                infoA = getGridInfo(sel, r, c);
                infoB = getGridInfo(sel, r + 1, c);

                if (!infoA || !infoB) continue;
                if (infoA.id === infoB.id) continue;

                var key = infoA.id < infoB.id
                    ? (infoA.id + "_" + infoB.id + "_H_" + r + "_" + c)
                    : (infoB.id + "_" + infoA.id + "_H_" + r + "_" + c);
                if (keySeen[key]) continue;
                keySeen[key] = true;

                applyOneEdge(infoA.cell, "bottom", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                applyOneEdge(infoB.cell, "top", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
            }
        }
    }

    function applyVerticalInternalGrid(table, sel, weightValue, uiAppearance) {
        var r, c, infoA, infoB, keySeen = {};

        for (r = sel.minRow; r <= sel.maxRow; r++) {
            for (c = sel.minCol; c < sel.maxCol; c++) {
                infoA = getGridInfo(sel, r, c);
                infoB = getGridInfo(sel, r, c + 1);

                if (!infoA || !infoB) continue;
                if (infoA.id === infoB.id) continue;

                var key = infoA.id < infoB.id
                    ? (infoA.id + "_" + infoB.id + "_V_" + r + "_" + c)
                    : (infoB.id + "_" + infoA.id + "_V_" + r + "_" + c);
                if (keySeen[key]) continue;
                keySeen[key] = true;

                applyOneEdge(infoA.cell, "right", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                applyOneEdge(infoB.cell, "left", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
            }
        }
    }

    // =========================================================
    // Core Apply
    // =========================================================
    function applyOuter(weightValue, uiAppearance) {
        var sel = analyzeSelection();
        if (!sel.ok) {
            safeAlert(sel.reason);
            return;
        }

        app.doScript(function () {
            var i, info;
            for (i = 0; i < sel.infos.length; i++) {
                info = sel.infos[i];

                if (isTopEdge(info, sel)) {
                    applyOneEdge(info.cell, "top", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
                if (isBottomEdge(info, sel)) {
                    applyOneEdge(info.cell, "bottom", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
                if (isLeftEdge(info, sel)) {
                    applyOneEdge(info.cell, "left", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
                if (isRightEdge(info, sel)) {
                    applyOneEdge(info.cell, "right", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
            }
        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, SCRIPT_NAME + " outer");
    }

    function applyAll(weightValue, uiAppearance) {
        var sel = analyzeSelection();
        if (!sel.ok) {
            safeAlert(sel.reason);
            return;
        }

        app.doScript(function () {
            var i, info;
            for (i = 0; i < sel.infos.length; i++) {
                info = sel.infos[i];
                applyOneEdge(info.cell, "top", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                applyOneEdge(info.cell, "bottom", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                applyOneEdge(info.cell, "left", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                applyOneEdge(info.cell, "right", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
            }
        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, SCRIPT_NAME + " all");
    }

    function applyInner(weightValue, uiAppearance, operationName) {
        var sel = analyzeSelection();
        if (!sel.ok) {
            safeAlert(sel.reason);
            return;
        }

        operationName = operationName || "内部適用";
        if (!confirmMergedInternalRisk(sel, operationName)) return;

        var table = sel.table;

        app.doScript(function () {
            // グリッド境界で処理し、さらにセルのスパン同士の隣接も保険として処理する。
            // 結合セルを含む選択では、InDesign側のセル参照がグリッド通りに返らないことがあるため。
            applyHorizontalInternalGrid(table, sel, weightValue, uiAppearance);
            applyVerticalInternalGrid(table, sel, weightValue, uiAppearance);
            applyHorizontalInternalPairs(sel, weightValue, uiAppearance);
            applyVerticalInternalPairs(sel, weightValue, uiAppearance);
            applyLooseInternalPairs(sel, weightValue, uiAppearance);
        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, SCRIPT_NAME + " inner-grid-pair");
    }

    function clearOuter() {
        applyOuter(0, {
            setAppearance: false,
            colorObj: null,
            strokeStyleObj: null
        });
    }

    function clearInner() {
        applyInner(0, {
            setAppearance: false,
            colorObj: null,
            strokeStyleObj: null
        }, "内部消去");
    }

    function clearAll() {
        applyAll(0, {
            setAppearance: false,
            colorObj: null,
            strokeStyleObj: null
        });
    }

    function applyOuterInner(outerValue, innerValue, uiAppearance) {
        var sel = analyzeSelection();
        if (!sel.ok) {
            safeAlert(sel.reason);
            return;
        }

        if (!confirmMergedInternalRisk(sel, "外枠太線+内部細線")) return;

        var table = sel.table;

        app.doScript(function () {
            var i, info;

            for (i = 0; i < sel.infos.length; i++) {
                info = sel.infos[i];

                if (isTopEdge(info, sel)) {
                    applyOneEdge(info.cell, "top", outerValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
                if (isBottomEdge(info, sel)) {
                    applyOneEdge(info.cell, "bottom", outerValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
                if (isLeftEdge(info, sel)) {
                    applyOneEdge(info.cell, "left", outerValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
                if (isRightEdge(info, sel)) {
                    applyOneEdge(info.cell, "right", outerValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
            }

            applyHorizontalInternalGrid(table, sel, innerValue, uiAppearance);
            applyVerticalInternalGrid(table, sel, innerValue, uiAppearance);
            applyHorizontalInternalPairs(sel, innerValue, uiAppearance);
            applyVerticalInternalPairs(sel, innerValue, uiAppearance);
            applyLooseInternalPairs(sel, innerValue, uiAppearance);

        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, SCRIPT_NAME + " outer_inner");
    }

    function applyManual(opts, weightValue, uiAppearance) {
        var sel = analyzeSelection();
        if (!sel.ok) {
            safeAlert(sel.reason);
            return;
        }

        if ((opts.innerH || opts.innerV) && !confirmMergedInternalRisk(sel, "線選択（内側横/内側縦）")) return;

        var table = sel.table;

        app.doScript(function () {
            var i, info;

            for (i = 0; i < sel.infos.length; i++) {
                info = sel.infos[i];

                if (opts.top) {
                    applyOneEdge(info.cell, "top", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
                if (opts.bottom) {
                    applyOneEdge(info.cell, "bottom", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
                if (opts.left) {
                    applyOneEdge(info.cell, "left", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
                if (opts.right) {
                    applyOneEdge(info.cell, "right", weightValue, uiAppearance.colorObj, uiAppearance.strokeStyleObj, uiAppearance.setAppearance);
                }
            }

            if (opts.innerH) {
                applyHorizontalInternalGrid(table, sel, weightValue, uiAppearance);
                applyHorizontalInternalPairs(sel, weightValue, uiAppearance);
                applyLooseInternalPairs(sel, weightValue, uiAppearance);
            }

            if (opts.innerV) {
                applyVerticalInternalGrid(table, sel, weightValue, uiAppearance);
                applyVerticalInternalPairs(sel, weightValue, uiAppearance);
                applyLooseInternalPairs(sel, weightValue, uiAppearance);
            }
        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, SCRIPT_NAME + " manual");
    }

    // =========================================================
    // UI
    // =========================================================
    function createPalette() {
        var pal = new Window("palette", "表罫線ヘルパー");
        pal.orientation = "column";
        pal.alignChildren = ["fill", "top"];
        pal.spacing = 8;
        pal.margins = 10;

        // 設定
        var settingPanel = pal.add("panel", undefined, "設定");
        settingPanel.orientation = "column";
        settingPanel.alignChildren = ["fill", "top"];
        settingPanel.margins = 10;
        settingPanel.spacing = 6;

        var row1 = settingPanel.add("group");
        row1.orientation = "row";
        row1.add("statictext", undefined, "線幅:");
        var weightEt = row1.add("edittext", undefined, "0.1");
        weightEt.characters = 8;

        var weightBtn = row1.add("button", undefined, "▼");
        weightBtn.preferredSize = [28, 26];

        var unitDd = row1.add("dropdownlist", undefined, ["pt", "mm"]);
        unitDd.selection = 1; // mm

        var row2 = settingPanel.add("group");
        row2.orientation = "row";
        var appearanceChk = row2.add("checkbox", undefined, "色・線種も適用");
        appearanceChk.value = false;

        var row3 = settingPanel.add("group");
        row3.orientation = "row";
        row3.add("statictext", undefined, "線種:");
        var styleDd = row3.add("dropdownlist", undefined, []);
        styleDd.preferredSize.width = 270;

        var row4 = settingPanel.add("group");
        row4.orientation = "row";
        row4.add("statictext", undefined, "色:");
        var colorDd = row4.add("dropdownlist", undefined, []);
        colorDd.preferredSize.width = 270;

        // プリセット
        var presetPanel = pal.add("panel", undefined, "プリセット");
        presetPanel.orientation = "column";
        presetPanel.alignChildren = ["fill", "top"];
        presetPanel.margins = 10;
        presetPanel.spacing = 6;

        var presetRow1 = presetPanel.add("group");
        presetRow1.orientation = "row";
        presetRow1.add("statictext", undefined, "設定:");
        var presetDd = presetRow1.add("dropdownlist", undefined, []);
        presetDd.preferredSize.width = 260;

        var presetInfoText = presetPanel.add("statictext", undefined, "プリセットを選ぶと設定に反映されます。実行はまだしません。", {multiline: true});
        presetInfoText.preferredSize = [330, 34];

        var presetRow2 = presetPanel.add("group");
        presetRow2.orientation = "row";
        var btnPresetSave = presetRow2.add("button", undefined, "保存");
        var btnPresetDelete = presetRow2.add("button", undefined, "削除");

        // 処理モード
        var modePanel = pal.add("panel", undefined, "処理モード");
        modePanel.orientation = "row";
        modePanel.alignChildren = ["left", "center"];
        modePanel.margins = 10;
        modePanel.spacing = 16;
        var rbModeQuick = modePanel.add("radiobutton", undefined, "クイック操作");
        var rbModeManual = modePanel.add("radiobutton", undefined, "線選択");
        rbModeQuick.value = true;

        // 線選択
        var manualPanel = pal.add("panel", undefined, "線選択");
        manualPanel.orientation = "column";
        manualPanel.alignChildren = ["fill", "top"];
        manualPanel.margins = 10;
        manualPanel.spacing = 6;

        var m1 = manualPanel.add("group");
        m1.orientation = "row";
        var topChk = m1.add("checkbox", undefined, "上");
        var bottomChk = m1.add("checkbox", undefined, "下");
        var leftChk = m1.add("checkbox", undefined, "左");
        var rightChk = m1.add("checkbox", undefined, "右");

        var m2 = manualPanel.add("group");
        m2.orientation = "row";
        var innerHChk = m2.add("checkbox", undefined, "内側横");
        var innerVChk = m2.add("checkbox", undefined, "内側縦");

        var gridPanel = manualPanel.add("panel", undefined, "");
        gridPanel.orientation = "column";
        gridPanel.alignChildren = ["fill", "fill"];
        gridPanel.margins = 8;

        var gridPreview = gridPanel.add("panel", undefined, "");
        gridPreview.preferredSize = [260, 120];

        function getGridGeometry(panel) {
            var w = 260;
            var h = 120;
            try {
                w = panel.size.width || w;
                h = panel.size.height || h;
            } catch (e) {}

            var padX = 18;
            var padY = 14;
            return {
                x0: padX,
                y0: padY,
                x1: w - padX,
                y1: h - padY,
                mx: Math.round(w / 2),
                my: Math.round(h / 2),
                tol: 12
            };
        }

        function drawSegment(g, x1, y1, x2, y2, selected) {
            var pen = g.newPen(
                g.PenType.SOLID_COLOR,
                selected ? [1, 0, 0, 1] : [0, 0.45, 1, 1],
                selected ? 6 : 2
            );
            g.newPath();
            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
            g.strokePath(pen);
        }

        gridPreview.onDraw = function () {
            try {
                var g = this.graphics;
                var geo = getGridGeometry(this);
                var x0 = geo.x0;
                var y0 = geo.y0;
                var x1 = geo.x1;
                var y1 = geo.y1;
                var mx = geo.mx;
                var my = geo.my;

                g.newPath();
                g.rectPath(0, 0, this.size.width, this.size.height);
                g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [1, 1, 1, 1]));

                // 非選択線を先に描く
                drawSegment(g, x0, y0, x1, y0, false); // top
                drawSegment(g, x0, y1, x1, y1, false); // bottom
                drawSegment(g, x0, y0, x0, y1, false); // left
                drawSegment(g, x1, y0, x1, y1, false); // right
                drawSegment(g, mx, y0, mx, y1, false); // inner vertical
                drawSegment(g, x0, my, x1, my, false); // inner horizontal

                // 選択線を太い赤で上書き
                if (topChk.value) drawSegment(g, x0, y0, x1, y0, true);
                if (bottomChk.value) drawSegment(g, x0, y1, x1, y1, true);
                if (leftChk.value) drawSegment(g, x0, y0, x0, y1, true);
                if (rightChk.value) drawSegment(g, x1, y0, x1, y1, true);
                if (innerVChk.value) drawSegment(g, mx, y0, mx, y1, true);
                if (innerHChk.value) drawSegment(g, x0, my, x1, my, true);
            } catch (e) {}
        };

        function redrawGridPreview() {
            try {
                gridPreview.visible = false;
                gridPreview.visible = true;
                pal.layout.layout(true);
            } catch (e) {}
        }

        function toggleNearestGridLine(ev) {
            var geo = getGridGeometry(gridPreview);
            var x = 0;
            var y = 0;
            try {
                x = ev.clientX;
                y = ev.clientY;
            } catch (e1) {
                try {
                    x = ev.screenX - gridPreview.windowBounds[0];
                    y = ev.screenY - gridPreview.windowBounds[1];
                } catch (e2) {}
            }

            var candidates = [
                {name: "top", d: Math.abs(y - geo.y0)},
                {name: "bottom", d: Math.abs(y - geo.y1)},
                {name: "left", d: Math.abs(x - geo.x0)},
                {name: "right", d: Math.abs(x - geo.x1)},
                {name: "innerV", d: Math.abs(x - geo.mx)},
                {name: "innerH", d: Math.abs(y - geo.my)}
            ];
            candidates.sort(function (a, b) { return a.d - b.d; });
            if (candidates[0].d > geo.tol) return;

            if (candidates[0].name === "top") topChk.value = !topChk.value;
            if (candidates[0].name === "bottom") bottomChk.value = !bottomChk.value;
            if (candidates[0].name === "left") leftChk.value = !leftChk.value;
            if (candidates[0].name === "right") rightChk.value = !rightChk.value;
            if (candidates[0].name === "innerH") innerHChk.value = !innerHChk.value;
            if (candidates[0].name === "innerV") innerVChk.value = !innerVChk.value;
            setManualMode();
            syncGridButtons();
        }

        try {
            gridPreview.addEventListener("mousedown", toggleNearestGridLine);
        } catch (e) {
            try { gridPreview.onClick = toggleNearestGridLine; } catch (_) {}
        }


        var m3 = manualPanel.add("group");
        m3.orientation = "row";
        var btnSelectAllTargets = m3.add("button", undefined, "全部選択");
        var btnClearTargets = m3.add("button", undefined, "解除");

        // 物理テンキーのショートカットは内部処理として残す。
        // 画面上の「線選択キー」パネルは表示しない。
        // InDesign / ScriptUI の環境差により、物理テンキーの取得はベストエフォート。
        // 起動直後のキー入力を拾うため、見えない小さな入力欄をキー受けとして置く。
        var keyCatcher = manualPanel.add("edittext", undefined, "");
        keyCatcher.preferredSize = [1, 1];
        keyCatcher.characters = 1;

        // クイック操作
        var quickPanel = pal.add("panel", undefined, "クイック操作");
        quickPanel.orientation = "column";
        quickPanel.alignChildren = ["left", "top"];
        quickPanel.margins = 10;
        quickPanel.spacing = 6;

        var rbAll = quickPanel.add("radiobutton", undefined, "全部適用");
        var rbOuter = quickPanel.add("radiobutton", undefined, "外枠適用");
        var rbInner = quickPanel.add("radiobutton", undefined, "内部適用");
        var rbClearOuter = quickPanel.add("radiobutton", undefined, "外枠消去");
        var rbClearInner = quickPanel.add("radiobutton", undefined, "内部消去");
        var rbClearAll = quickPanel.add("radiobutton", undefined, "全消去");
        var rbOuterInner = quickPanel.add("radiobutton", undefined, "外枠太線+内部細線");
        rbAll.value = true;

        var q2 = quickPanel.add("group");
        q2.orientation = "row";
        q2.add("statictext", undefined, "外枠:");
        var outerEt = q2.add("edittext", undefined, "0.3");
        outerEt.characters = 5;
        var outerUnitText = q2.add("statictext", undefined, "mm");
        var outerBtn = q2.add("button", undefined, "▼");
        outerBtn.preferredSize = [28, 24];

        q2.add("statictext", undefined, "内部:");
        var innerEt = q2.add("edittext", undefined, "0.1");
        innerEt.characters = 5;
        var innerUnitText = q2.add("statictext", undefined, "mm");
        var innerBtn = q2.add("button", undefined, "▼");
        innerBtn.preferredSize = [28, 24];


        var executePanel = pal.add("group");
        executePanel.orientation = "row";
        executePanel.alignChildren = ["left", "center"];
        var btnRun = executePanel.add("button", undefined, "実行");
        btnRun.preferredSize = [140, 36];

        pal.__ui = {
            rbModeQuick: rbModeQuick,
            rbModeManual: rbModeManual,
            weightEt: weightEt,
            weightBtn: weightBtn,
            unitDd: unitDd,
            appearanceChk: appearanceChk,
            styleDd: styleDd,
            colorDd: colorDd,
            presetDd: presetDd,
            presetInfoText: presetInfoText,
            btnPresetSave: btnPresetSave,
            btnPresetDelete: btnPresetDelete,
            rbOuter: rbOuter,
            rbInner: rbInner,
            rbAll: rbAll,
            rbClearOuter: rbClearOuter,
            rbClearInner: rbClearInner,
            rbClearAll: rbClearAll,
            rbOuterInner: rbOuterInner,
            outerEt: outerEt,
            outerBtn: outerBtn,
            outerUnitText: outerUnitText,
            innerEt: innerEt,
            innerBtn: innerBtn,
            innerUnitText: innerUnitText,
            topChk: topChk,
            bottomChk: bottomChk,
            leftChk: leftChk,
            rightChk: rightChk,
            innerHChk: innerHChk,
            innerVChk: innerVChk,
            btnRun: btnRun,
            keyCatcher: keyCatcher,
            btnSelectAllTargets: btnSelectAllTargets,
            btnClearTargets: btnClearTargets
        };

        refreshPresetDropdown(pal.__ui, "");

        function syncGridButtons() {
            redrawGridPreview();
        }

        function setLineSelectionState(top, bottom, left, right, innerH, innerV) {
            topChk.value = !!top;
            bottomChk.value = !!bottom;
            leftChk.value = !!left;
            rightChk.value = !!right;
            innerHChk.value = !!innerH;
            innerVChk.value = !!innerV;
            syncGridButtons();
        }

        function syncPreviewFromQuickSelection() {
            if (rbAll.value) {
                setLineSelectionState(true, true, true, true, true, true);
                return;
            }
            if (rbOuter.value || rbClearOuter.value) {
                setLineSelectionState(true, true, true, true, false, false);
                return;
            }
            if (rbInner.value || rbClearInner.value) {
                setLineSelectionState(false, false, false, false, true, true);
                return;
            }
            if (rbClearAll.value) {
                setLineSelectionState(true, true, true, true, true, true);
                return;
            }
            if (rbOuterInner.value) {
                setLineSelectionState(true, true, true, true, true, true);
                return;
            }
            syncGridButtons();
        }

        function getCurrentUnit() {
            return unitDd.selection ? unitDd.selection.text : "mm";
        }

        attachCursorIncrement(weightEt, getCurrentUnit);
        attachCursorIncrement(outerEt, getCurrentUnit);
        attachCursorIncrement(innerEt, getCurrentUnit);

        var numericFieldActive = false;

        function markNumericField(et) {
            try {
                et.onActivate = function () { numericFieldActive = true; };
                et.onDeactivate = function () { numericFieldActive = false; };
            } catch (_) {}
        }

        markNumericField(weightEt);
        markNumericField(outerEt);
        markNumericField(innerEt);

        weightEt.onChange = function () { normalizeNumberField(weightEt); updateWeightDropdownsAndUnitLabels(); };
        outerEt.onChange = function () { normalizeNumberField(outerEt); updateWeightDropdownsAndUnitLabels(); };
        innerEt.onChange = function () { normalizeNumberField(innerEt); updateWeightDropdownsAndUnitLabels(); };

        function updateWeightDropdownsAndUnitLabels() {
            var unit = getCurrentUnit();
            try { outerUnitText.text = unit; } catch (e1) {}
            try { innerUnitText.text = unit; } catch (e2) {}
        }

        weightBtn.onClick = function () {
            chooseWeightPreset(weightEt, getCurrentUnit());
            updateWeightDropdownsAndUnitLabels();
            refocusKeyCatcherSoon();
        };
        outerBtn.onClick = function () {
            chooseWeightPreset(outerEt, getCurrentUnit());
            updateWeightDropdownsAndUnitLabels();
            refocusKeyCatcherSoon();
        };
        innerBtn.onClick = function () {
            chooseWeightPreset(innerEt, getCurrentUnit());
            updateWeightDropdownsAndUnitLabels();
            refocusKeyCatcherSoon();
        };

        btnPresetSave.onClick = function () {
            saveCurrentPreset(pal.__ui);
            refocusKeyCatcherSoon();
        };

        btnPresetDelete.onClick = function () {
            deleteSelectedPreset(pal.__ui);
            refocusKeyCatcherSoon();
        };

        presetDd.onChange = function () {
            // プリセットを選んだ時点で、UI表示へ反映する。
            // ただし罫線処理そのものは実行ボタンを押すまで行わない。
            var presetName = getSelectedPresetName(pal.__ui);
            if (!presetName) {
                updatePresetInfo(pal.__ui, "プリセットを選ぶと設定に反映されます。実行はまだしません。");
                refocusKeyCatcherSoon();
                return;
            }

            if (loadSelectedPreset(pal.__ui)) {
                updateWeightDropdownsAndUnitLabels();
                if (rbModeQuick.value) {
                    syncPreviewFromQuickSelection();
                } else {
                    syncGridButtons();
                }
                try {
                    var presets = loadUserPresets();
                    updatePresetInfo(pal.__ui, presetSummaryText(presetName, presets[presetName]));
                } catch (e) {}
                savePrefs(pal.__ui);
            }
            refocusKeyCatcherSoon();
        };

        unitDd.onChange = function () {
            updateWeightDropdownsAndUnitLabels();
        };

        function setManualMode() {
            rbModeManual.value = true;
            rbModeQuick.value = false;
            refocusKeyCatcherSoon();
        }

        function setQuickModeUI() {
            rbModeQuick.value = true;
            rbModeManual.value = false;
            syncPreviewFromQuickSelection();
            refocusKeyCatcherSoon();
        }

        function toggleLineCheck(chk) {
            try { chk.value = !chk.value; } catch (e) {}
        }

        function setAllLineChecks(value) {
            topChk.value = value;
            bottomChk.value = value;
            leftChk.value = value;
            rightChk.value = value;
            innerHChk.value = value;
            innerVChk.value = value;
        }

        function isTextInputTarget(target) {
            try {
                if (!target) return false;
                if (String(target.type).toLowerCase() === "edittext") return true;
            } catch (_) {}
            return false;
        }

        function normalizeNumpadKey(ev) {
            var key = "";

            try { if (ev.keyName) key = ev.keyName; } catch (_) {}
            try { if (!key && ev.keyIdentifier) key = ev.keyIdentifier; } catch (_) {}
            try { if (!key && ev.key) key = ev.key; } catch (_) {}
            key = String(key);

            // U+0037 / U+002E のような表記対策を先に行う
            var unicodeMatch = key.match(/^U\+00([0-9A-Fa-f]{2})$/);
            if (unicodeMatch) {
                var code = parseInt(unicodeMatch[1], 16);
                if (code >= 48 && code <= 57) return String(code - 48);
                if (code === 46) return ".";
            }

            // よくある ScriptUI / OS / テンキー表記の差を吸収
            key = key.replace(/^Numpad/i, "");
            key = key.replace(/^NumPad/i, "");
            key = key.replace(/^NUMPAD/i, "");
            key = key.replace(/^Num/i, "");
            key = key.replace(/^Pad/i, "");
            key = key.replace(/^KP_/i, "");
            key = key.replace(/^Key/i, "");
            key = key.replace(/^Digit/i, "");
            key = key.replace(/\s+/g, "");

            if (/^[0-9]$/.test(key)) return key;

            var lower = key.toLowerCase();
            if (lower === "decimal" || lower === "period" || lower === "dot" || lower === "separator") return ".";
            if (lower === "clear") return "0";

            // charCode / keyCode / which フォールバック
            try {
                var chCode = ev.charCode || ev.which || 0;
                if (chCode) {
                    var ch = String.fromCharCode(chCode);
                    if (/^[0-9.]$/.test(ch)) return ch;
                }
            } catch (_) {}

            try {
                if (ev.keyCode) {
                    // 通常数字キー 0-9
                    if (ev.keyCode >= 48 && ev.keyCode <= 57) return String(ev.keyCode - 48);
                    // テンキー 0-9
                    if (ev.keyCode >= 96 && ev.keyCode <= 105) return String(ev.keyCode - 96);
                    // テンキー decimal
                    if (ev.keyCode === 110 || ev.keyCode === 190) return ".";
                }
            } catch (_) {}

            return key;
        }

        function applyNumpadSelectionKey(key) {
            var handled = true;

            if (key === "7") { toggleLineCheck(topChk); toggleLineCheck(leftChk); }
            else if (key === "8") { toggleLineCheck(topChk); }
            else if (key === "9") { toggleLineCheck(topChk); toggleLineCheck(rightChk); }
            else if (key === "4") { toggleLineCheck(leftChk); }
            else if (key === "5") { toggleLineCheck(innerHChk); toggleLineCheck(innerVChk); }
            else if (key === "6") { toggleLineCheck(rightChk); }
            else if (key === "1") { toggleLineCheck(bottomChk); toggleLineCheck(leftChk); }
            else if (key === "2") { toggleLineCheck(bottomChk); }
            else if (key === "3") { toggleLineCheck(bottomChk); toggleLineCheck(rightChk); }
            else if (key === "0") { setAllLineChecks(false); }
            else if (key === ".") { setAllLineChecks(true); }
            else { handled = false; }

            if (handled) {
                setManualMode();
                syncGridButtons();
                return true;
            }
            return false;
        }

        function handleNumpadLineSelection(ev) {
            // 物理テンキーのキーイベントは環境差が大きい。拾えた場合だけ処理する。
            var key = normalizeNumpadKey(ev);
            if (applyNumpadSelectionKey(key)) {
                try { ev.preventDefault(); } catch (_) {}
                return false;
            }
        }

        function focusKeyCatcher() {
            try {
                if (keyCatcher && keyCatcher.visible) {
                    keyCatcher.text = "";
                    keyCatcher.active = true;
                }
            } catch (_) {}
        }

        function refocusKeyCatcherSoon() {
            try {
                $.global.__TLH_refocusKeyCatcher = focusKeyCatcher;
                app.scheduleTask('$.global.__TLH_refocusKeyCatcher && $.global.__TLH_refocusKeyCatcher();', 40, false);
            } catch (_) {
                try { focusKeyCatcher(); } catch (e) {}
            }
        }

        function handleKeyCatcherChange() {
            try {
                var t = String(keyCatcher.text || "");
                if (!t) return;
                var ch = t.charAt(t.length - 1);
                keyCatcher.text = "";
                applyNumpadSelectionKey(ch);
                focusKeyCatcher();
            } catch (_) {}
        }

        var lastPolledNumpadKey = "";

        function getPolledKeyboardKey() {
            try {
                if (typeof ScriptUI === "undefined" || !ScriptUI.environment || !ScriptUI.environment.keyboardState) return "";
                var ks = ScriptUI.environment.keyboardState;
                var raw = "";
                try { raw = ks.keyName || ""; } catch (_) {}
                if (!raw) {
                    try { raw = ks.keyIdentifier || ""; } catch (_) {}
                }
                if (!raw) return "";
                return normalizeNumpadKey({ keyName: raw, keyIdentifier: raw, key: raw });
            } catch (_) {
                return "";
            }
        }

        function pollNumpadKeys() {
            try {
                if (!pal || !pal.visible) {
                    $.global.__TLH_keyPollActive = false;
                    return;
                }

                if (!numericFieldActive) {
                    var key = getPolledKeyboardKey();
                    if (/^[0-9.]$/.test(key)) {
                        if (key !== lastPolledNumpadKey) {
                            applyNumpadSelectionKey(key);
                            lastPolledNumpadKey = key;
                        }
                    } else {
                        lastPolledNumpadKey = "";
                    }
                } else {
                    lastPolledNumpadKey = "";
                }
            } catch (_) {}

            try {
                app.scheduleTask('$.global.__TLH_keyPoll && $.global.__TLH_keyPoll();', 80, false);
            } catch (_) {}
        }

        function startKeyPolling() {
            try {
                $.global.__TLH_keyPoll = pollNumpadKeys;
                if (!$.global.__TLH_keyPollActive) {
                    $.global.__TLH_keyPollActive = true;
                    app.scheduleTask('$.global.__TLH_keyPoll && $.global.__TLH_keyPoll();', 120, false);
                }
            } catch (_) {}
        }

        function attachNumpadShortcuts(ctrl) {
            if (!ctrl) return;
            try {
                ctrl.addEventListener("keydown", handleNumpadLineSelection);
            } catch (_) {}

            try {
                if (ctrl.children && ctrl.children.length) {
                    for (var i = 0; i < ctrl.children.length; i++) {
                        attachNumpadShortcuts(ctrl.children[i]);
                    }
                }
            } catch (_) {}
        }

        attachNumpadShortcuts(pal);
        try {
            keyCatcher.onChanging = handleKeyCatcherChange;
            keyCatcher.addEventListener("keydown", handleNumpadLineSelection);
        } catch (_) {}
        try {
            pal.onShortcutKey = handleNumpadLineSelection;
            pal.onKeyDown = handleNumpadLineSelection;
        } catch (_) {}
        pal.__focusKeyCatcher = focusKeyCatcher;
        pal.__startKeyPolling = startKeyPolling;

        topChk.onClick = function () { setManualMode(); syncGridButtons(); };
        bottomChk.onClick = function () { setManualMode(); syncGridButtons(); };
        leftChk.onClick = function () { setManualMode(); syncGridButtons(); };
        rightChk.onClick = function () { setManualMode(); syncGridButtons(); };
        innerHChk.onClick = function () { setManualMode(); syncGridButtons(); };
        innerVChk.onClick = function () { setManualMode(); syncGridButtons(); };

        rbAll.onClick = setQuickModeUI;
        rbOuter.onClick = setQuickModeUI;
        rbInner.onClick = setQuickModeUI;
        rbClearOuter.onClick = setQuickModeUI;
        rbClearInner.onClick = setQuickModeUI;
        rbClearAll.onClick = setQuickModeUI;
        rbOuterInner.onClick = setQuickModeUI;
        rbModeQuick.onClick = function () { rbModeQuick.value = true; rbModeManual.value = false; syncPreviewFromQuickSelection(); refocusKeyCatcherSoon(); };
        rbModeManual.onClick = function () { rbModeManual.value = true; rbModeQuick.value = false; syncGridButtons(); refocusKeyCatcherSoon(); };

        btnSelectAllTargets.onClick = function () {
            setManualMode();
            topChk.value = true;
            bottomChk.value = true;
            leftChk.value = true;
            rightChk.value = true;
            innerHChk.value = true;
            innerVChk.value = true;
            syncGridButtons();
            refocusKeyCatcherSoon();
        };

        btnClearTargets.onClick = function () {
            setManualMode();
            topChk.value = false;
            bottomChk.value = false;
            leftChk.value = false;
            rightChk.value = false;
            innerHChk.value = false;
            innerVChk.value = false;
            syncGridButtons();
            refocusKeyCatcherSoon();
        };

        btnRun.onClick = function () {
            savePrefs(pal.__ui);
            var ap, w, vals;

            // 線選択モード：下のチェックボックス／プレビューで選んだ線だけを処理
            if (rbModeManual.value) {
                w = getWeightValue(pal.__ui);
                if (w === null) return;
                ap = getAppearance(pal.__ui);
                if (!ap) return;
                applyManual({
                    top: topChk.value,
                    bottom: bottomChk.value,
                    left: leftChk.value,
                    right: rightChk.value,
                    innerH: innerHChk.value,
                    innerV: innerVChk.value
                }, w, ap);
                refocusKeyCatcherSoon();
                return;
            }

            // クイック操作モード：選択したラジオボタンの処理を実行
            if (rbAll.value) {
                w = getWeightValue(pal.__ui);
                if (w === null) return;
                ap = getAppearance(pal.__ui);
                if (!ap) return;
                applyAll(w, ap);
                refocusKeyCatcherSoon();
                return;
            }

            if (rbOuter.value) {
                w = getWeightValue(pal.__ui);
                if (w === null) return;
                ap = getAppearance(pal.__ui);
                if (!ap) return;
                applyOuter(w, ap);
                refocusKeyCatcherSoon();
                return;
            }

            if (rbInner.value) {
                w = getWeightValue(pal.__ui);
                if (w === null) return;
                ap = getAppearance(pal.__ui);
                if (!ap) return;
                applyInner(w, ap, "内部適用");
                refocusKeyCatcherSoon();
                return;
            }

            if (rbClearOuter.value) {
                clearOuter();
                refocusKeyCatcherSoon();
                return;
            }

            if (rbClearInner.value) {
                clearInner();
                refocusKeyCatcherSoon();
                return;
            }

            if (rbClearAll.value) {
                clearAll();
                refocusKeyCatcherSoon();
                return;
            }

            if (rbOuterInner.value) {
                vals = getOuterInnerValues(pal.__ui);
                if (!vals) return;
                ap = getAppearance(pal.__ui);
                if (!ap) return;
                applyOuterInner(vals.outerValue, vals.innerValue, ap);
                refocusKeyCatcherSoon();
                return;
            }
        };

        var prefs = loadPrefs();
        if (prefs) {
            if (prefs.weight) weightEt.text = prefs.weight;
            if (prefs.outer) outerEt.text = prefs.outer;
            if (prefs.inner) innerEt.text = prefs.inner;
            setDropdownByText(unitDd, prefs.unit, 1);
            appearanceChk.value = !!prefs.applyAppearance;
            setQuickMode(pal.__ui, prefs.quickMode);
            if (prefs.operationMode === "manual") {
                rbModeManual.value = true;
                rbModeQuick.value = false;
            } else {
                rbModeQuick.value = true;
                rbModeManual.value = false;
            }
            topChk.value = !!prefs.top;
            bottomChk.value = !!prefs.bottom;
            leftChk.value = !!prefs.left;
            rightChk.value = !!prefs.right;
            innerHChk.value = !!prefs.innerH;
            innerVChk.value = !!prefs.innerV;
        }
        updateWeightDropdownsAndUnitLabels();
        if (rbModeQuick.value) {
            syncPreviewFromQuickSelection();
        } else {
            syncGridButtons();
        }
        try { pal.onClose = function () { savePrefs(pal.__ui); }; } catch (e) {}

        return pal;
    }

    function refillDropdowns(pal) {
        var ui = pal.__ui;
        var doc = getActiveDocument();
        if (!doc) return;

        ui.styleDd.removeAll();
        ui.colorDd.removeAll();

        var styleNames = [];
        var i;

        try {
            for (i = 0; i < doc.strokeStyles.length; i++) {
                styleNames.push(doc.strokeStyles[i].name);
            }
        } catch (e) {
            logError("stroke styles", e);
        }

        styleNames = movePriorityToTop(styleNames, ["ベタ", "Solid", "実線"]);

        for (i = 0; i < styleNames.length; i++) {
            ui.styleDd.add("item", styleNames[i]);
        }

        try {
            for (i = 0; i < doc.swatches.length; i++) {
                ui.colorDd.add("item", doc.swatches[i].name);
            }
        } catch (e) {
            logError("swatches", e);
        }

        var prefs = loadPrefs();
        if (prefs) {
            setDropdownByText(ui.styleDd, prefs.strokeStyle, 0);
            setDropdownByText(ui.colorDd, prefs.color, 0);
        } else {
            if (ui.styleDd.items.length) ui.styleDd.selection = ui.styleDd.items[0];
            if (ui.colorDd.items.length) ui.colorDd.selection = ui.colorDd.items[0];
        }
    }

    // =========================================================
    // Main
    // =========================================================
    var pal = createPalette();
    refillDropdowns(pal);

    var sel = analyzeSelection();
    if (!sel.ok) {
        safeAlert("表セルを選択してからスクリプトを起動してください。");
    }

    pal.center();
    pal.show();

    try {
        if (pal.__startKeyPolling) pal.__startKeyPolling();
    } catch (e0) {}

    try {
        $.sleep(100);
        if (pal.__focusKeyCatcher) pal.__focusKeyCatcher();
    } catch (e) {}
})();