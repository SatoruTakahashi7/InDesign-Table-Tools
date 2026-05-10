/*
SCRIPTMETA-BEGIN
Script-ID=com.gyahtei.dtp.table-column-width-panel.indesign
Version=1.0.0
Meta-URL=https://github.com/SatoruTakahashi7/InDesign-Table-Tools
Target-App=indesign
Name=表の列幅を変えるやつ / Table Column Width Panel
Author=GYAHTEI Design Laboratory / Satoru Takahashi
Description-BEGIN
InDesignの表組の列幅を、パネルUIからmm指定・fill指定・プリセット保存で変更する補助スクリプトです。
選択中の表の列数を取得し、列ごとの固定幅または残り幅配分を設定できます。
Description-END
SCRIPTMETA-END


    TableColumnWidthPanel.jsx
    Version: 1.0.0
    Updated: 2026-05-04
    GYAHTEI Design Laboratory
    @gyahtei_satoru

    InDesign 表組：列幅をパネル入力で変更するスクリプト

    仕様:
    - 表、または表内セルを選択して実行
    - 選択中の表の列数を自動取得
    - 各列を横並びUIで表示
    - 入力欄が空欄なら「そのまま」
    - 入力欄に数値を入れたら「固定mm」
    - fillボタンONなら「fill」
    - fillボタンONの列に数値を入力したら、fillを解除して固定mm扱い
    - Tab / Shift+Tab は入力欄間を移動
      ※ fillボタンにはTabで行かないように、入力欄側でTabを拾って制御
    - ↑↓キーで数値増減
      - 通常: 1mm
      - Shift: 10mm
      - Option / Alt: 0.1mm
    - fill は現在の表幅を基準に残り幅を均等配分
    - 表幅が足りない場合、fill は「そのまま」と同じ扱い
    - 全列 fill の場合、現在の表幅を全列均等割り
    - 実行後アラートを表示
    - 起動時に現在幅を入力欄へ入れる設定
    - 上記設定を次回以降も記憶
    - プリセット保存 / 読込 / 削除
    - プリセットには「空欄 / 固定mm / fill ON」の状態を保存

    保存場所:
    - Folder.userData/GYAHTEI_TableColumnWidthPanel_Settings.txt

    注意:
    - 幅取得・計算・適用中は points に統一し、InDesignの定規単位に影響されないようにしています。
    - 結果に関しては一切の保証はできません。
    - 本スクリプトの読み取り結果および使用結果について、正確性・完全性は保証できません。
*/

(function () {
    var SCRIPT_NAME = "TableColumnWidthPanel";
    var SETTINGS_FILE_NAME = "GYAHTEI_TableColumnWidthPanel_Settings.txt";
    var DEFAULT_COLUMNS_PER_ROW = 8;

    if (!app.documents.length || !app.selection.length) {
        alert("ドキュメントを開き、表またはセルを選択してから実行してください。");
        return;
    }

    var selection = app.selection[0];
    var table = getSelectedTable(selection);

    if (!table) {
        alert("表、または表内のセルを選択してください。");
        return;
    }

    var store = loadSettingsStore();
    var settings = showColumnWidthDialog(table, store);

    if (!settings) {
        return;
    }

    app.doScript(
        function () {
            applyColumnWidths(table, settings.columnSettings);
        },
        ScriptLanguage.JAVASCRIPT,
        null,
        UndoModes.ENTIRE_SCRIPT,
        "表の列幅を変更"
    );

    alert("列幅の設定が完了しました。");

    function getSelectedTable(selection) {
        if (!selection || !selection.isValid) return null;
        var name = selection.constructor.name;
        if (name === "Table") return selection;
        if (name === "Cell") return selection.parent;
        if (name === "Column" || name === "Row") return selection.parent;
        try {
            if (selection.parent && selection.parent.constructor.name === "Cell") return selection.parent.parent;
        } catch (e1) {}
        try {
            if (selection.cells && selection.cells.length > 0 && selection.cells[0].isValid) return selection.cells[0].parent;
        } catch (e2) {}
        return null;
    }

    function showColumnWidthDialog(table, store) {
        var snapshot = getTableWidthSnapshot(table);
        var columnCount = snapshot.columnWidthsPt.length;
        var currentWidthsMm = [];
        var tableWidthMm = pointsToMillimeters(snapshot.tableWidthPt);
        for (var i = 0; i < columnCount; i++) currentWidthsMm.push(pointsToMillimeters(snapshot.columnWidthsPt[i]));

        var dlg = new Window("dialog", "表の列幅を変えるやつ");
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];

        var infoText =
            "現在の表幅: " + formatNumber(tableWidthMm, 3) + " mm\n" +
            "空欄はそのまま、数値入力は固定mm、fill ON は残り幅の均等配分です。\n" +
            "表幅が足りない場合、fill列は変更せず、固定mmを優先して表を伸ばします。";
        var info = dlg.add("statictext", undefined, infoText, { multiline: true });
        info.characters = 92;

        var topPanel = dlg.add("panel", undefined, "設定 / プリセット");
        topPanel.orientation = "column";
        topPanel.alignChildren = ["fill", "top"];
        topPanel.margins = 14;

        var optionGroup = topPanel.add("group");
        optionGroup.orientation = "row";
        optionGroup.alignChildren = ["left", "center"];
        var prefillCheckbox = optionGroup.add("checkbox", undefined, "起動時に現在幅を入力欄へ入れる");
        prefillCheckbox.value = !!store.options.prefillCurrentWidths;
        prefillCheckbox.helpTip = "ONにすると、次回以降も現在の列幅が最初から入力欄に入ります。";

        var presetGroup = topPanel.add("group");
        presetGroup.orientation = "row";
        presetGroup.alignChildren = ["left", "center"];
        presetGroup.add("statictext", undefined, "プリセット:");
        var presetDropdown = presetGroup.add("dropdownlist", undefined, buildPresetNameList(store));
        presetDropdown.preferredSize.width = 220;
        if (presetDropdown.items.length > 0) presetDropdown.selection = 0;
        var loadPresetButton = presetGroup.add("button", undefined, "読込");
        var savePresetButton = presetGroup.add("button", undefined, "保存");
        var deletePresetButton = presetGroup.add("button", undefined, "削除");

        var outerPanel = dlg.add("panel", undefined, "列設定");
        outerPanel.orientation = "column";
        outerPanel.alignChildren = ["left", "top"];
        outerPanel.margins = 14;

        var columnsPerRow = DEFAULT_COLUMNS_PER_ROW;
        var columnControls = [];
        var rowGroup = null;
        for (var c = 0; c < columnCount; c++) {
            if (c % columnsPerRow === 0) {
                rowGroup = outerPanel.add("group");
                rowGroup.orientation = "row";
                rowGroup.alignChildren = ["left", "top"];
                rowGroup.spacing = 10;
            }
            var colPanel = rowGroup.add("panel", undefined, "列 " + (c + 1));
            colPanel.orientation = "column";
            colPanel.alignChildren = ["fill", "top"];
            colPanel.margins = 10;
            var currentLabel = colPanel.add("statictext", undefined, "現在 " + formatNumber(currentWidthsMm[c], 3) + " mm");
            currentLabel.characters = 15;
            var inputText = store.options.prefillCurrentWidths ? formatNumber(currentWidthsMm[c], 3) : "";
            var input = colPanel.add("edittext", undefined, inputText);
            input.characters = 8;
            input.helpTip = "空欄ならそのまま。数値を入力すると固定mmです。20 または 20mm のように入力できます。";
            var fillButton = colPanel.add("button", undefined, "fill OFF");
            fillButton.isFill = false;
            fillButton.preferredSize.width = 75;
            fillButton.helpTip = "押すたびに fill ON / OFF を切り替えます。ONにすると、現在の表幅内で残り幅を均等配分します。";
            fillButton.onClick = function () { setFillButtonState(this, !this.isFill); };

            columnControls.push({ input: input, fillButton: fillButton, currentWidthMm: currentWidthsMm[c] });
            attachArrowAndTabKeyHandler(input, columnControls);
            attachInputChangeHandler(input, fillButton);
        }

        loadPresetButton.onClick = function () {
            if (!presetDropdown.selection) { alert("読み込むプリセットを選択してください。"); return; }
            var presetName = presetDropdown.selection.text;
            var preset = getPresetByName(store, presetName);
            if (!preset) { alert("プリセットが見つかりません。"); refreshPresetDropdown(presetDropdown, store, null); return; }
            if (!preset.columns || preset.columns.length !== columnControls.length) {
                alert("このプリセットは " + (preset.columns ? preset.columns.length : 0) + "列用です。\n現在の表は " + columnControls.length + "列です。\n\n列数が違うため、読み込みません。");
                return;
            }
            applyPresetToControls(preset, columnControls);
        };

        savePresetButton.onClick = function () {
            var defaultName = presetDropdown.selection ? presetDropdown.selection.text : "preset_" + columnControls.length + "cols";
            var presetName = prompt("プリセット名を入力してください。", defaultName);
            if (presetName === null) return;
            presetName = trimString(presetName);
            if (presetName === "") { alert("プリセット名が空です。"); return; }
            var preset = buildPresetFromControls(presetName, columnControls);
            var existed = !!getPresetByName(store, presetName);
            if (existed && !confirm("同じ名前のプリセットがあります。\n上書きしますか？")) return;
            upsertPreset(store, preset);
            saveSettingsStore(store);
            refreshPresetDropdown(presetDropdown, store, presetName);
            alert("プリセットを保存しました。\n\n" + presetName);
        };

        deletePresetButton.onClick = function () {
            if (!presetDropdown.selection) { alert("削除するプリセットを選択してください。"); return; }
            var presetName = presetDropdown.selection.text;
            if (!confirm("プリセットを削除しますか？\n\n" + presetName)) return;
            deletePresetByName(store, presetName);
            saveSettingsStore(store);
            refreshPresetDropdown(presetDropdown, store, null);
            alert("プリセットを削除しました。");
        };

        var helperPanel = dlg.add("panel", undefined, "補助");
        helperPanel.orientation = "row";
        helperPanel.alignChildren = ["left", "center"];
        helperPanel.margins = 14;
        var clearAllButton = helperPanel.add("button", undefined, "すべて空欄");
        var currentAllButton = helperPanel.add("button", undefined, "現在幅を入力");
        var fillAllButton = helperPanel.add("button", undefined, "すべて fill");
        var clearFillButton = helperPanel.add("button", undefined, "fillを解除");
        clearAllButton.onClick = function () {
            for (var i = 0; i < columnControls.length; i++) { columnControls[i].input.text = ""; setFillButtonState(columnControls[i].fillButton, false); }
        };
        currentAllButton.onClick = function () {
            for (var i = 0; i < columnControls.length; i++) { columnControls[i].input.text = formatNumber(columnControls[i].currentWidthMm, 3); setFillButtonState(columnControls[i].fillButton, false); }
        };
        fillAllButton.onClick = function () {
            for (var i = 0; i < columnControls.length; i++) { columnControls[i].input.text = ""; setFillButtonState(columnControls[i].fillButton, true); }
        };
        clearFillButton.onClick = function () {
            for (var i = 0; i < columnControls.length; i++) setFillButtonState(columnControls[i].fillButton, false);
        };

        var note = dlg.add("statictext", undefined, "入力欄では ↑↓ で数値変更 / Shiftで10mm / Option・Altで0.1mm / Tabで次の入力欄へ移動");
        note.characters = 92;

        var buttons = dlg.add("group");
        buttons.orientation = "row";
        buttons.alignment = "right";
        var cancelButton = buttons.add("button", undefined, "キャンセル", { name: "cancel" });
        var okButton = buttons.add("button", undefined, "実行", { name: "ok" });

        okButton.onClick = function () {
            var result = collectColumnSettings(columnControls);
            if (!result.ok) { alert(result.message); if (result.control) result.control.active = true; return; }
            store.options.prefillCurrentWidths = !!prefillCheckbox.value;
            saveSettingsStore(store);
            dlg.resultValues = { columnSettings: result.settings };
            dlg.close(1);
        };
        cancelButton.onClick = function () {
            store.options.prefillCurrentWidths = !!prefillCheckbox.value;
            saveSettingsStore(store);
            dlg.close(0);
        };
        if (columnControls.length > 0) columnControls[0].input.active = true;
        var resultCode = dlg.show();
        if (resultCode !== 1) return null;
        return dlg.resultValues;
    }

    function collectColumnSettings(columnControls) {
        var result = [];
        for (var i = 0; i < columnControls.length; i++) {
            var control = columnControls[i];
            var raw = trimString(control.input.text);
            if (control.fillButton.isFill) { result.push({ type: "fill", valueMm: null }); continue; }
            if (raw === "") { result.push({ type: "keep", valueMm: null }); continue; }
            raw = normalizeNumberString(raw);
            var num = parseFloat(raw);
            if (isNaN(num)) return { ok: false, message: "列 " + (i + 1) + " の入力値が数値ではありません。", control: control.input };
            if (num < 0) return { ok: false, message: "列 " + (i + 1) + " にマイナス値は指定できません。", control: control.input };
            result.push({ type: "fixed", valueMm: num });
        }
        return { ok: true, settings: result };
    }

    function setFillButtonState(fillButton, value) { fillButton.isFill = !!value; fillButton.text = fillButton.isFill ? "fill ON" : "fill OFF"; }
    function attachInputChangeHandler(input, fillButton) {
        input.onChanging = function () { if (trimString(input.text) !== "") setFillButtonState(fillButton, false); };
    }

    function applyColumnWidths(table, settings) {
        var oldMeasurementUnit = app.scriptPreferences.measurementUnit;
        try {
            app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
            var columns = table.columns;
            var columnCount = columns.length;
            var currentWidthsPt = [];
            var currentTableWidthPt = 0;
            for (var i = 0; i < columnCount; i++) { currentWidthsPt[i] = Number(columns[i].width); currentTableWidthPt += currentWidthsPt[i]; }
            var fixedWidthPtTotal = 0, keepWidthPtTotal = 0, fillIndexes = [], fixedAssignments = [], allFill = true;
            for (var c = 0; c < columnCount; c++) {
                var setting = settings[c];
                if (setting.type !== "fill") allFill = false;
                if (setting.type === "fixed") {
                    var fixedPt = millimetersToPoints(setting.valueMm);
                    fixedAssignments.push({ index: c, widthPt: fixedPt });
                    fixedWidthPtTotal += fixedPt;
                } else if (setting.type === "fill") {
                    fillIndexes.push(c);
                } else {
                    keepWidthPtTotal += currentWidthsPt[c];
                }
            }
            if (allFill && fillIndexes.length === columnCount) {
                var equalWidthPt = currentTableWidthPt / columnCount;
                for (var all = 0; all < columnCount; all++) columns[all].width = equalWidthPt;
                return;
            }
            if (fillIndexes.length === 0) {
                for (var f0 = 0; f0 < fixedAssignments.length; f0++) columns[fixedAssignments[f0].index].width = fixedAssignments[f0].widthPt;
                return;
            }
            var nonFillWidthPtTotal = fixedWidthPtTotal + keepWidthPtTotal;
            var canFitFill = nonFillWidthPtTotal <= currentTableWidthPt;
            if (canFitFill) {
                var remainingPt = currentTableWidthPt - nonFillWidthPtTotal;
                var fillWidthPt = remainingPt / fillIndexes.length;
                for (var f1 = 0; f1 < fixedAssignments.length; f1++) columns[fixedAssignments[f1].index].width = fixedAssignments[f1].widthPt;
                for (var j = 0; j < fillIndexes.length; j++) columns[fillIndexes[j]].width = fillWidthPt;
            } else {
                for (var f2 = 0; f2 < fixedAssignments.length; f2++) columns[fixedAssignments[f2].index].width = fixedAssignments[f2].widthPt;
            }
        } catch (e) {
            alert("処理を中止しました。\n\n" + e.message);
        } finally {
            app.scriptPreferences.measurementUnit = oldMeasurementUnit;
        }
    }

    function getTableWidthSnapshot(table) {
        var oldMeasurementUnit = app.scriptPreferences.measurementUnit;
        try {
            app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
            var widths = [], total = 0;
            for (var i = 0; i < table.columns.length; i++) { var widthPt = Number(table.columns[i].width); widths.push(widthPt); total += widthPt; }
            return { columnWidthsPt: widths, tableWidthPt: total };
        } finally {
            app.scriptPreferences.measurementUnit = oldMeasurementUnit;
        }
    }

    function attachArrowAndTabKeyHandler(editText, columnControls) {
        editText.addEventListener("keydown", function (event) {
            var keyName = "";
            try { keyName = event.keyName; } catch (e1) {}
            if (!keyName) { try { keyName = event.keyIdentifier; } catch (e2) {} }
            var isTab = keyName === "Tab" || keyName === "U+0009";
            if (isTab) {
                var currentIndex = findInputIndex(editText, columnControls);
                if (currentIndex >= 0) {
                    var nextIndex;
                    try { nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1; } catch (e3) { nextIndex = currentIndex + 1; }
                    if (nextIndex >= 0 && nextIndex < columnControls.length) columnControls[nextIndex].input.active = true;
                }
                try { event.preventDefault(); } catch (e4) {}
                try { event.stopPropagation(); } catch (e5) {}
                return;
            }
            var isUp = keyName === "Up" || keyName === "ArrowUp" || keyName === "U+001C";
            var isDown = keyName === "Down" || keyName === "ArrowDown" || keyName === "U+001D";
            if (!isUp && !isDown) return;
            var text = trimString(editText.text);
            if (text === "") text = "0";
            text = normalizeNumberString(text);
            var currentValue = parseFloat(text);
            if (isNaN(currentValue)) currentValue = 0;
            var step = 1;
            try { if (event.shiftKey) step = 10; else if (event.altKey) step = 0.1; } catch (e6) {}
            if (isDown) step = -step;
            var nextValue = currentValue + step;
            if (nextValue < 0) nextValue = 0;
            editText.text = formatNumber(nextValue, 3);
            try { event.preventDefault(); } catch (e7) {}
            try { event.stopPropagation(); } catch (e8) {}
        });
    }

    function findInputIndex(editText, columnControls) {
        for (var i = 0; i < columnControls.length; i++) if (columnControls[i].input === editText) return i;
        return -1;
    }

    function buildPresetNameList(store) {
        var names = [], presets = store.presets || [];
        for (var i = 0; i < presets.length; i++) if (presets[i] && presets[i].name) names.push(presets[i].name);
        names.sort();
        return names;
    }
    function refreshPresetDropdown(dropdown, store, selectName) {
        dropdown.removeAll();
        var names = buildPresetNameList(store);
        for (var i = 0; i < names.length; i++) dropdown.add("item", names[i]);
        if (dropdown.items.length === 0) { dropdown.selection = null; return; }
        var selectedIndex = 0;
        if (selectName) for (var j = 0; j < dropdown.items.length; j++) if (dropdown.items[j].text === selectName) { selectedIndex = j; break; }
        dropdown.selection = selectedIndex;
    }
    function getPresetByName(store, name) {
        var presets = store.presets || [];
        for (var i = 0; i < presets.length; i++) if (presets[i] && presets[i].name === name) return presets[i];
        return null;
    }
    function upsertPreset(store, preset) {
        if (!store.presets) store.presets = [];
        for (var i = 0; i < store.presets.length; i++) if (store.presets[i] && store.presets[i].name === preset.name) { store.presets[i] = preset; return; }
        store.presets.push(preset);
    }
    function deletePresetByName(store, name) {
        var next = [], presets = store.presets || [];
        for (var i = 0; i < presets.length; i++) if (presets[i] && presets[i].name !== name) next.push(presets[i]);
        store.presets = next;
    }
    function buildPresetFromControls(name, columnControls) {
        var columns = [];
        for (var i = 0; i < columnControls.length; i++) {
            var control = columnControls[i];
            var raw = trimString(control.input.text);
            if (control.fillButton.isFill) columns.push({ type: "fill", value: "" });
            else if (raw === "") columns.push({ type: "keep", value: "" });
            else columns.push({ type: "fixed", value: normalizeNumberString(raw) });
        }
        return { name: name, columnCount: columnControls.length, columns: columns };
    }
    function applyPresetToControls(preset, columnControls) {
        for (var i = 0; i < columnControls.length; i++) {
            var item = preset.columns[i], control = columnControls[i];
            if (!item || item.type === "keep") { control.input.text = ""; setFillButtonState(control.fillButton, false); }
            else if (item.type === "fill") { control.input.text = ""; setFillButtonState(control.fillButton, true); }
            else if (item.type === "fixed") { control.input.text = String(item.value); setFillButtonState(control.fillButton, false); }
            else { control.input.text = ""; setFillButtonState(control.fillButton, false); }
        }
    }

    function getSettingsFile() {
        var folder = Folder.userData;
        if (!folder.exists) folder.create();
        return new File(folder.fsName + "/" + SETTINGS_FILE_NAME);
    }
    function createDefaultStore() { return { version: "1.4.0", options: { prefillCurrentWidths: false }, presets: [] }; }
    function loadSettingsStore() {
        var file = getSettingsFile();
        var store = createDefaultStore();
        if (!file.exists) return store;
        try {
            file.encoding = "UTF-8";
            file.open("r");
            var text = file.read();
            file.close();
            if (!text || trimString(text) === "") return store;
            var loaded = parseStoreText(text);
            if (!loaded) return store;
            store.options.prefillCurrentWidths = !!(loaded.options && loaded.options.prefillCurrentWidths);
            store.presets = loaded.presets instanceof Array ? loaded.presets : [];
            return store;
        } catch (e) {
            try { if (file.opened) file.close(); } catch (e2) {}
            return store;
        }
    }
    function saveSettingsStore(store) {
        var file = getSettingsFile();
        try {
            file.encoding = "UTF-8";
            file.open("w");
            file.write(stringifyStore(store));
            file.close();
        } catch (e) {
            try { if (file.opened) file.close(); } catch (e2) {}
            alert("設定ファイルの保存に失敗しました。\n\n" + e.message);
        }
    }
    function parseStoreText(text) {
        try { if (typeof JSON !== "undefined" && JSON.parse) return JSON.parse(text); } catch (e1) {}
        try { return eval("(" + text + ")"); } catch (e2) { return null; }
    }
    function stringifyStore(store) {
        try { if (typeof JSON !== "undefined" && JSON.stringify) return JSON.stringify(store, null, 2); } catch (e1) {}
        return objectToSource(store, 0);
    }
    function objectToSource(value, level) {
        var indent = repeatString("    ", level), nextIndent = repeatString("    ", level + 1);
        if (value === null) return "null";
        if (typeof value === "string") return quoteString(value);
        if (typeof value === "number" || typeof value === "boolean") return String(value);
        if (value instanceof Array) {
            if (value.length === 0) return "[]";
            var arrayParts = [];
            for (var i = 0; i < value.length; i++) arrayParts.push(nextIndent + objectToSource(value[i], level + 1));
            return "[\n" + arrayParts.join(",\n") + "\n" + indent + "]";
        }
        if (typeof value === "object") {
            var parts = [];
            for (var key in value) if (value.hasOwnProperty(key)) parts.push(nextIndent + quoteString(key) + ": " + objectToSource(value[key], level + 1));
            if (parts.length === 0) return "{}";
            return "{\n" + parts.join(",\n") + "\n" + indent + "}";
        }
        return "null";
    }
    function quoteString(str) {
        return '"' + String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t") + '"';
    }
    function repeatString(str, count) { var result = ""; for (var i = 0; i < count; i++) result += str; return result; }

    function pointsToMillimeters(pt) { return Number(pt) * 25.4 / 72; }
    function millimetersToPoints(mm) { return Number(mm) * 72 / 25.4; }
    function trimString(str) { return String(str).replace(/^\s+|\s+$/g, ""); }
    function normalizeNumberString(str) { return String(str).replace(/[ｍＭ]/g, "m").replace(/[，]/g, ",").replace(/[．]/g, ".").replace(/,/g, ".").replace(/mm$/i, "").replace(/\s+/g, ""); }
    function formatNumber(num, decimals) {
        var fixed = Number(num).toFixed(decimals);
        fixed = fixed.replace(/\.?0+$/g, "");
        if (fixed === "-0") fixed = "0";
        return fixed;
    }
})();
