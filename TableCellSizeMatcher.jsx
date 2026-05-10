/*
SCRIPTMETA-BEGIN
Script-ID=com.gyahtei.dtp.table-cell-size-matcher.indesign
Version=1.0.0
Meta-URL=https://github.com/SatoruTakahashi7/InDesign-Table-Tools
Target-App=indesign
Name=表セルのサイズとかを別セルへ適用するやつ / Table Cell Size Matcher
Author=GYAHTEI Design Laboratory / Satoru Takahashi
Description-BEGIN
InDesignの表セルから、幅・高さ・セル内マージン・上下位置揃えを拾い、別のセルへ適用する補助スクリプトです。
通常セルを主な対象とし、結合セルは安全優先で扱います。
Description-END
SCRIPTMETA-END


    TableCellSizeMatcher.jsx
    表セルのサイズとかを別セルへ適用するやつ.jsx
    Version: 1.0.0
    Updated: 2026-05-04
    GYAHTEI Design Laboratory
    @gyahtei_satoru

    InDesign 表セル：幅・高さ・セル内マージンを拾って、別セルへ適用するスクリプト

    仕様:
    - パレットUIで出しっぱなし
    - 選択セルから値を拾う
    - 別のセルを選択して「選択セルへ適用」
    - 幅は、選択セルが属する列へ適用
    - 高さは、選択セルが属する行へ適用
    - 高さは「固定」または「最小限度」を選択
    - セル内マージンは、選択セルそのものへ適用
    - mm表示・mm入力
    - Undo 1回で戻せる
    -通常セル向けの実用ツール
    -結合セルは無理に追わない

    - 通常セルを複数列/複数行セルと誤認して、幅・高さを割ってしまう問題を修正
      例: 26.5mm が 6列で割られて 4.417mm になる問題
      例: 10mm が 3行で割られて 3.333mm になる問題
    - 幅は常に「そのセルが属する列」に指定値をそのまま適用
    - 高さは常に「そのセルが属する行」に指定値をそのまま適用
    - 複数セル選択時は、含まれる列・行それぞれへ同じ値を適用
    - 高さの拾い方を改善
      「固定」選択中は実際の行高を拾う
      「最小限度」選択中は minimumHeight を拾う

    - 複数セル選択時に、幅・高さが左上セルだけにしか適用されない問題を修正
    - app.selection[0] が Cell として返っても、selection.cells を優先して選択範囲全体を取得

    - セル内の上下位置揃えを拾って適用
      上揃え / 中央揃え / 下揃え / 均等配置

    - 上部の説明文を削除
    - 前回の設定を保存・復元
      幅/高さ/セル内マージン/上下位置の適用チェック
      高さの扱い
      上下位置
      各入力欄の値

    - 閉じる時だけ保存する方式をやめ、UIを変更した時点で即保存
    - 入力欄、チェックボックス、ラジオボタン、上下位置プルダウンの変更を保存

    注意:
    - InDesignの表では、セル幅は実質的に列幅、セル高さは実質的に行高です。
    - 結合セルの幅・高さを結合全体として拾って分配する処理は、v1.0.1では行いません。
      安全優先で、選択セルが属する列・行にそのまま適用します。
*/

/*
    注意:
    - InDesignの表では、セル幅は実質的に列幅、セル高さは実質的に行高です。
    - 結合セルは非推奨です。
      結合セルでは、幅・高さ・罫線・選択範囲の取得が不安定になることがあります。
      このスクリプトは通常セルを主な対象としています。
    - 結果に関しては一切の保証はできません。
    - 本スクリプトの読み取り結果および使用結果について、正確性・完全性は保証できません。  
*/

#targetengine "GYAHTEI_TableCellSizeMatcher"

(function () {
    var SCRIPT_TITLE = "表セルのサイズとかをそろえるやつ";
    var PALETTE_NAME = "TableCellSizeMatcherPalette";
    var SETTINGS_FILE_NAME = "GYAHTEI_TableCellSizeMatcher_Settings.txt";

    if (!app.documents.length) {
        alert("ドキュメントを開いてから実行してください。");
        return;
    }

    // すでに同名パレットがあれば閉じる
    try {
        if ($.global[PALETTE_NAME] && $.global[PALETTE_NAME].visible) {
            $.global[PALETTE_NAME].close();
        }
    } catch (e) {}

    var store = loadSettingsStore();

    var win = new Window("palette", SCRIPT_TITLE);
    $.global[PALETTE_NAME] = win;

    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.margins = 14;

    // ------------------------------------------------------------
    // 幅・高さ
    // ------------------------------------------------------------
    var sizePanel = win.add("panel", undefined, "幅 / 高さ");
    sizePanel.orientation = "column";
    sizePanel.alignChildren = ["fill", "top"];
    sizePanel.margins = 12;

    var widthGroup = sizePanel.add("group");
    widthGroup.orientation = "row";
    widthGroup.alignChildren = ["left", "center"];

    var applyWidthCheckbox = widthGroup.add("checkbox", undefined, "幅を適用");
    applyWidthCheckbox.value = !!store.applyWidth;

    widthGroup.add("statictext", undefined, "幅:");
    var widthInput = widthGroup.add("edittext", undefined, store.widthText || "");
    widthInput.characters = 10;
    widthInput.helpTip = "mmで入力します。例: 26.5 または 26.5mm";
    widthGroup.add("statictext", undefined, "mm");

    var heightGroup = sizePanel.add("group");
    heightGroup.orientation = "row";
    heightGroup.alignChildren = ["left", "center"];

    var applyHeightCheckbox = heightGroup.add("checkbox", undefined, "高さを適用");
    applyHeightCheckbox.value = !!store.applyHeight;

    heightGroup.add("statictext", undefined, "高さ:");
    var heightInput = heightGroup.add("edittext", undefined, store.heightText || "");
    heightInput.characters = 10;
    heightInput.helpTip = "mmで入力します。例: 8 または 8mm";
    heightGroup.add("statictext", undefined, "mm");

    var heightModeGroup = sizePanel.add("group");
    heightModeGroup.orientation = "row";
    heightModeGroup.alignChildren = ["left", "center"];

    heightModeGroup.add("statictext", undefined, "高さの扱い:");
    var heightFixedRadio = heightModeGroup.add("radiobutton", undefined, "固定");
    var heightMinimumRadio = heightModeGroup.add("radiobutton", undefined, "最小限度");

    if (store.heightMode === "fixed") {
        heightFixedRadio.value = true;
    } else {
        heightMinimumRadio.value = true;
    }

    // ------------------------------------------------------------
    // セル内マージン
    // ------------------------------------------------------------
    var insetPanel = win.add("panel", undefined, "セル内マージン");
    insetPanel.orientation = "column";
    insetPanel.alignChildren = ["fill", "top"];
    insetPanel.margins = 12;

    var applyInsetCheckbox = insetPanel.add("checkbox", undefined, "セル内マージンを適用");
    applyInsetCheckbox.value = !!store.applyInsets;

    var insetRow1 = insetPanel.add("group");
    insetRow1.orientation = "row";
    insetRow1.alignChildren = ["left", "center"];

    insetRow1.add("statictext", undefined, "上:");
    var topInsetInput = insetRow1.add("edittext", undefined, store.topInsetText || "");
    topInsetInput.characters = 8;
    insetRow1.add("statictext", undefined, "mm");

    insetRow1.add("statictext", undefined, "　下:");
    var bottomInsetInput = insetRow1.add("edittext", undefined, store.bottomInsetText || "");
    bottomInsetInput.characters = 8;
    insetRow1.add("statictext", undefined, "mm");

    var insetRow2 = insetPanel.add("group");
    insetRow2.orientation = "row";
    insetRow2.alignChildren = ["left", "center"];

    insetRow2.add("statictext", undefined, "左:");
    var leftInsetInput = insetRow2.add("edittext", undefined, store.leftInsetText || "");
    leftInsetInput.characters = 8;
    insetRow2.add("statictext", undefined, "mm");

    insetRow2.add("statictext", undefined, "　右:");
    var rightInsetInput = insetRow2.add("edittext", undefined, store.rightInsetText || "");
    rightInsetInput.characters = 8;
    insetRow2.add("statictext", undefined, "mm");

    // ------------------------------------------------------------
    // セル内の上下位置揃え
    // ------------------------------------------------------------
    var verticalPanel = win.add("panel", undefined, "セル内の上下位置");
    verticalPanel.orientation = "row";
    verticalPanel.alignChildren = ["left", "center"];
    verticalPanel.margins = 12;

    var applyVerticalCheckbox = verticalPanel.add("checkbox", undefined, "上下位置を適用");
    applyVerticalCheckbox.value = !!store.applyVertical;

    verticalPanel.add("statictext", undefined, "位置:");

    var verticalDropdown = verticalPanel.add("dropdownlist", undefined, [
        "上揃え",
        "中央揃え",
        "下揃え",
        "均等配置"
    ]);
    verticalDropdown.preferredSize.width = 120;
    verticalDropdown.selection = store.verticalIndex || 0;

    // ------------------------------------------------------------
    // 補助
    // ------------------------------------------------------------
    var helperPanel = win.add("panel", undefined, "補助");
    helperPanel.orientation = "row";
    helperPanel.alignChildren = ["left", "center"];
    helperPanel.margins = 12;

    var pickButton = helperPanel.add("button", undefined, "選択セルから拾う");
    var applyButton = helperPanel.add("button", undefined, "選択セルへ適用");
    var clearButton = helperPanel.add("button", undefined, "クリア");

    var messageText = win.add("statictext", undefined, "準備完了");
    messageText.characters = 48;

    var closeGroup = win.add("group");
    closeGroup.orientation = "row";
    closeGroup.alignment = "right";

    var closeButton = closeGroup.add("button", undefined, "閉じる");

    // ------------------------------------------------------------
    // キー操作
    // ------------------------------------------------------------
    attachArrowKeyHandler(widthInput);
    attachArrowKeyHandler(heightInput);
    attachArrowKeyHandler(topInsetInput);
    attachArrowKeyHandler(bottomInsetInput);
    attachArrowKeyHandler(leftInsetInput);
    attachArrowKeyHandler(rightInsetInput);

    attachAutoSaveHandlers();

    // ------------------------------------------------------------
    // ボタン処理
    // ------------------------------------------------------------
    pickButton.onClick = function () {
        var cell = getFirstSelectedCell();

        if (!cell) {
            alert("基準にするセルを選択してください。");
            return;
        }

        try {
            var values = readCellValues(cell);

            widthInput.text = formatNumber(values.widthMm, 3);
            heightInput.text = formatNumber(values.heightMm, 3);

            topInsetInput.text = formatNumber(values.topInsetMm, 3);
            bottomInsetInput.text = formatNumber(values.bottomInsetMm, 3);
            leftInsetInput.text = formatNumber(values.leftInsetMm, 3);
            rightInsetInput.text = formatNumber(values.rightInsetMm, 3);

            setVerticalDropdownByValue(verticalDropdown, values.verticalJustification);

            messageText.text = "選択セルから値を拾いました。";
            saveCurrentSettings();
        } catch (e) {
            alert("値の取得に失敗しました。\n\n" + e.message);
        }
    };

    applyButton.onClick = function () {
        var selectedCells = getSelectedCells();

        if (!selectedCells || selectedCells.length === 0) {
            alert("適用先のセルを選択してください。");
            return;
        }

        var options = collectOptions();

        if (!options.ok) {
            alert(options.message);
            if (options.control) {
                options.control.active = true;
            }
            return;
        }

        app.doScript(
            function () {
                applyToSelectedCells(selectedCells, options);
            },
            ScriptLanguage.JAVASCRIPT,
            null,
            UndoModes.ENTIRE_SCRIPT,
            "表セルのサイズを合わせる"
        );

        messageText.text = "選択セルへ適用しました。";
        saveCurrentSettings();
        alert("適用が完了しました。");
    };

    clearButton.onClick = function () {
        widthInput.text = "";
        heightInput.text = "";
        topInsetInput.text = "";
        bottomInsetInput.text = "";
        leftInsetInput.text = "";
        rightInsetInput.text = "";
        verticalDropdown.selection = 0;
        messageText.text = "入力欄をクリアしました。";
        saveCurrentSettings();
    };

    closeButton.onClick = function () {
        saveCurrentSettings();
        win.close();
    };

    win.onClose = function () {
        saveCurrentSettings();
        try {
            $.global[PALETTE_NAME] = null;
        } catch (e) {}
    };

    win.center();
    win.show();

    // ------------------------------------------------------------
    // UI変更時に即保存
    // ------------------------------------------------------------
    function attachAutoSaveHandlers() {
        applyWidthCheckbox.onClick = saveCurrentSettings;
        applyHeightCheckbox.onClick = saveCurrentSettings;
        applyInsetCheckbox.onClick = saveCurrentSettings;
        applyVerticalCheckbox.onClick = saveCurrentSettings;

        heightFixedRadio.onClick = saveCurrentSettings;
        heightMinimumRadio.onClick = saveCurrentSettings;
        verticalDropdown.onChange = saveCurrentSettings;

        widthInput.onChanging = saveCurrentSettings;
        heightInput.onChanging = saveCurrentSettings;
        topInsetInput.onChanging = saveCurrentSettings;
        bottomInsetInput.onChanging = saveCurrentSettings;
        leftInsetInput.onChanging = saveCurrentSettings;
        rightInsetInput.onChanging = saveCurrentSettings;
    }

    // ------------------------------------------------------------
    // 現在のUI設定を保存
    // ------------------------------------------------------------
    function saveCurrentSettings() {
        try {
            store.applyWidth = !!applyWidthCheckbox.value;
            store.applyHeight = !!applyHeightCheckbox.value;
            store.applyInsets = !!applyInsetCheckbox.value;
            store.applyVertical = !!applyVerticalCheckbox.value;

            store.heightMode = heightFixedRadio.value ? "fixed" : "minimum";

            store.widthText = String(widthInput.text || "");
            store.heightText = String(heightInput.text || "");
            store.topInsetText = String(topInsetInput.text || "");
            store.bottomInsetText = String(bottomInsetInput.text || "");
            store.leftInsetText = String(leftInsetInput.text || "");
            store.rightInsetText = String(rightInsetInput.text || "");

            try {
                store.verticalIndex = verticalDropdown.selection ? verticalDropdown.selection.index : 0;
            } catch (e1) {
                store.verticalIndex = 0;
            }

            saveSettingsStore(store);
        } catch (e2) {
            // 設定保存に失敗しても、サイズ適用処理自体は止めない。
        }
    }

    // ------------------------------------------------------------
    // 選択セル取得
    // ------------------------------------------------------------
    function getFirstSelectedCell() {
        var cells = getSelectedCells();

        if (!cells || cells.length === 0) {
            return null;
        }

        return cells[0];
    }

    function getSelectedCells() {
        if (!app.documents.length || !app.selection.length) {
            return [];
        }

        var selection = app.selection[0];

        if (!selection || !selection.isValid) {
            return [];
        }

        var name = selection.constructor.name;
        var result = [];

        /*
            v1.0.2:
            ここが重要。
            複数セルを選択していても、app.selection[0] の constructor.name が
            "Cell" になることがあります。

            そのため、name === "Cell" で即 return すると左上セルだけになり、
            幅・高さが左上の列/行にしか適用されません。

            先に selection.cells を見て、選択範囲全体のセルを取得します。
        */
        try {
            if (selection.cells && selection.cells.length > 0) {
                return collectionToArray(selection.cells);
            }
        } catch (e1) {}

        if (name === "Table") {
            return collectionToArray(selection.cells);
        }

        if (name === "Column" || name === "Row") {
            return collectionToArray(selection.cells);
        }

        if (name === "Cell") {
            result.push(selection);
            return result;
        }

        try {
            if (selection.parent && selection.parent.constructor.name === "Cell") {
                result.push(selection.parent);
                return result;
            }
        } catch (e2) {}

        return [];
    }

    function collectionToArray(collection) {
        var arr = [];

        try {
            for (var i = 0; i < collection.length; i++) {
                if (collection[i] && collection[i].isValid) {
                    arr.push(collection[i]);
                }
            }
        } catch (e) {}

        return arr;
    }

    // ------------------------------------------------------------
    // セル値取得
    // ------------------------------------------------------------
    function readCellValues(cell) {
        var oldMeasurementUnit = app.scriptPreferences.measurementUnit;

        try {
            app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;

            var widthPt = getCellColumnWidthPt(cell);
            var heightPt = getCellRowHeightPt(cell);

            return {
                widthMm: pointsToMillimeters(widthPt),
                heightMm: pointsToMillimeters(heightPt),
                topInsetMm: pointsToMillimeters(Number(cell.topInset)),
                bottomInsetMm: pointsToMillimeters(Number(cell.bottomInset)),
                leftInsetMm: pointsToMillimeters(Number(cell.leftInset)),
                rightInsetMm: pointsToMillimeters(Number(cell.rightInset)),
                verticalJustification: cell.verticalJustification
            };
        } finally {
            app.scriptPreferences.measurementUnit = oldMeasurementUnit;
        }
    }

    /*
        v1.0.1:
        通常セルでは必ず parentColumn.width を基準にする。
        cell.columns は環境や選択状態により表全体の列コレクションのように見える場合があり、
        26.5mm が列数で割られる原因になったため使わない。
    */
    function getCellColumnWidthPt(cell) {
        try {
            if (cell.parentColumn && cell.parentColumn.isValid) {
                return Number(cell.parentColumn.width);
            }
        } catch (e1) {}

        try {
            return Number(cell.width);
        } catch (e2) {}

        throw new Error("セルが属する列幅を取得できませんでした。");
    }

    /*
        v1.0.1:
        高さの扱いが「最小限度」の時は minimumHeight を拾う。
        「固定」の時は実際の row.height を拾う。
    */
    function getCellRowHeightPt(cell) {
        var row = null;

        try {
            if (cell.parentRow && cell.parentRow.isValid) {
                row = cell.parentRow;
            }
        } catch (e1) {}

        if (!row) {
            try {
                return Number(cell.height);
            } catch (e2) {}

            throw new Error("セルが属する行高を取得できませんでした。");
        }

        if (heightMinimumRadio.value) {
            try {
                return Number(row.minimumHeight);
            } catch (e3) {}

            try {
                return Number(row.height);
            } catch (e4) {}
        }

        try {
            return Number(row.height);
        } catch (e5) {}

        try {
            return Number(row.minimumHeight);
        } catch (e6) {}

        throw new Error("行高を取得できませんでした。");
    }

    // ------------------------------------------------------------
    // 入力内容取得
    // ------------------------------------------------------------
    function collectOptions() {
        var options = {
            ok: true,
            applyWidth: !!applyWidthCheckbox.value,
            applyHeight: !!applyHeightCheckbox.value,
            applyInsets: !!applyInsetCheckbox.value,
            applyVertical: !!applyVerticalCheckbox.value,
            heightMode: heightFixedRadio.value ? "fixed" : "minimum",
            widthMm: null,
            heightMm: null,
            topInsetMm: null,
            bottomInsetMm: null,
            leftInsetMm: null,
            rightInsetMm: null,
            verticalJustification: null
        };

        if (options.applyWidth) {
            var widthResult = parseMmInput(widthInput.text, "幅", widthInput);
            if (!widthResult.ok) {
                return widthResult;
            }
            options.widthMm = widthResult.value;
        }

        if (options.applyHeight) {
            var heightResult = parseMmInput(heightInput.text, "高さ", heightInput);
            if (!heightResult.ok) {
                return heightResult;
            }
            options.heightMm = heightResult.value;
        }

        if (options.applyInsets) {
            var topResult = parseMmInput(topInsetInput.text, "上マージン", topInsetInput);
            if (!topResult.ok) {
                return topResult;
            }

            var bottomResult = parseMmInput(bottomInsetInput.text, "下マージン", bottomInsetInput);
            if (!bottomResult.ok) {
                return bottomResult;
            }

            var leftResult = parseMmInput(leftInsetInput.text, "左マージン", leftInsetInput);
            if (!leftResult.ok) {
                return leftResult;
            }

            var rightResult = parseMmInput(rightInsetInput.text, "右マージン", rightInsetInput);
            if (!rightResult.ok) {
                return rightResult;
            }

            options.topInsetMm = topResult.value;
            options.bottomInsetMm = bottomResult.value;
            options.leftInsetMm = leftResult.value;
            options.rightInsetMm = rightResult.value;
        }

        if (options.applyVertical) {
            options.verticalJustification = getVerticalValueFromDropdown(verticalDropdown);
        }

        if (!options.applyWidth && !options.applyHeight && !options.applyInsets && !options.applyVertical) {
            return {
                ok: false,
                message: "適用する項目を選択してください。",
                control: null
            };
        }

        return options;
    }

    function parseMmInput(text, label, control) {
        var raw = trimString(text);

        if (raw === "") {
            return {
                ok: false,
                message: label + "が空欄です。",
                control: control
            };
        }

        raw = normalizeNumberString(raw);

        var num = parseFloat(raw);

        if (isNaN(num)) {
            return {
                ok: false,
                message: label + "の入力値が数値ではありません。",
                control: control
            };
        }

        if (num < 0) {
            return {
                ok: false,
                message: label + "にマイナス値は指定できません。",
                control: control
            };
        }

        return {
            ok: true,
            value: num
        };
    }

    // ------------------------------------------------------------
    // 適用処理
    // ------------------------------------------------------------
    function applyToSelectedCells(cells, options) {
        var oldMeasurementUnit = app.scriptPreferences.measurementUnit;

        try {
            app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;

            var widthPt = options.widthMm !== null ? millimetersToPoints(options.widthMm) : null;
            var heightPt = options.heightMm !== null ? millimetersToPoints(options.heightMm) : null;

            var topInsetPt = options.topInsetMm !== null ? millimetersToPoints(options.topInsetMm) : null;
            var bottomInsetPt = options.bottomInsetMm !== null ? millimetersToPoints(options.bottomInsetMm) : null;
            var leftInsetPt = options.leftInsetMm !== null ? millimetersToPoints(options.leftInsetMm) : null;
            var rightInsetPt = options.rightInsetMm !== null ? millimetersToPoints(options.rightInsetMm) : null;

            var processedColumnIds = {};
            var processedRowIds = {};

            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];

                if (!cell || !cell.isValid) {
                    continue;
                }

                if (options.applyWidth) {
                    applyWidthToCellColumn(cell, widthPt, processedColumnIds);
                }

                if (options.applyHeight) {
                    applyHeightToCellRow(cell, heightPt, options.heightMode, processedRowIds);
                }

                if (options.applyInsets) {
                    cell.topInset = topInsetPt;
                    cell.bottomInset = bottomInsetPt;
                    cell.leftInset = leftInsetPt;
                    cell.rightInset = rightInsetPt;
                }

                if (options.applyVertical) {
                    cell.verticalJustification = options.verticalJustification;
                }
            }
        } finally {
            app.scriptPreferences.measurementUnit = oldMeasurementUnit;
        }
    }

    /*
        v1.0.1:
        幅は割らない。
        選択セルが属する列に、指定値をそのまま適用する。
    */
    function applyWidthToCellColumn(cell, widthPt, processedColumnIds) {
        var column = null;

        try {
            if (cell.parentColumn && cell.parentColumn.isValid) {
                column = cell.parentColumn;
            }
        } catch (e1) {}

        if (!column) {
            return;
        }

        var id = getObjectKey(column, "col");

        if (processedColumnIds[id]) {
            return;
        }

        column.width = widthPt;
        processedColumnIds[id] = true;
    }

    /*
        v1.0.1:
        高さは割らない。
        選択セルが属する行に、指定値をそのまま適用する。
    */
    function applyHeightToCellRow(cell, heightPt, heightMode, processedRowIds) {
        var row = null;

        try {
            if (cell.parentRow && cell.parentRow.isValid) {
                row = cell.parentRow;
            }
        } catch (e1) {}

        if (!row) {
            return;
        }

        var id = getObjectKey(row, "row");

        if (processedRowIds[id]) {
            return;
        }

        if (heightMode === "fixed") {
            /*
                固定:
                環境差対策として heightType / minimumHeight / height を可能な範囲で指定。
            */
            try {
                if (typeof RowHeightOptions !== "undefined") {
                    row.heightType = RowHeightOptions.EXACTLY;
                }
            } catch (e2) {}

            try {
                row.minimumHeight = heightPt;
            } catch (e3) {}

            try {
                row.height = heightPt;
            } catch (e4) {}
        } else {
            /*
                最小限度:
                minimumHeight を主に指定。
                行高タイプを at least 系にできる環境では指定。
            */
            try {
                if (typeof RowHeightOptions !== "undefined") {
                    row.heightType = RowHeightOptions.AT_LEAST;
                }
            } catch (e5) {}

            try {
                row.minimumHeight = heightPt;
            } catch (e6) {}

            try {
                if (Number(row.height) < heightPt) {
                    row.height = heightPt;
                }
            } catch (e7) {}
        }

        processedRowIds[id] = true;
    }

    function getObjectKey(obj, prefix) {
        try {
            if (obj.id !== undefined) {
                return prefix + "_" + obj.id;
            }
        } catch (e1) {}

        try {
            return prefix + "_" + obj.index;
        } catch (e2) {}

        try {
            return prefix + "_" + obj.toSpecifier();
        } catch (e3) {}

        return prefix + "_" + Math.random();
    }

    // ------------------------------------------------------------
    // ↑↓キーで数値増減
    // ------------------------------------------------------------
    function attachArrowKeyHandler(editText) {
        editText.addEventListener("keydown", function (event) {
            var keyName = "";

            try {
                keyName = event.keyName;
            } catch (e1) {}

            if (!keyName) {
                try {
                    keyName = event.keyIdentifier;
                } catch (e2) {}
            }

            var isUp =
                keyName === "Up" ||
                keyName === "ArrowUp" ||
                keyName === "U+001C";

            var isDown =
                keyName === "Down" ||
                keyName === "ArrowDown" ||
                keyName === "U+001D";

            if (!isUp && !isDown) {
                return;
            }

            var text = trimString(editText.text);

            if (text === "") {
                text = "0";
            }

            text = normalizeNumberString(text);

            var currentValue = parseFloat(text);

            if (isNaN(currentValue)) {
                currentValue = 0;
            }

            var step = 1;

            try {
                if (event.shiftKey) {
                    step = 10;
                } else if (event.altKey) {
                    step = 0.1;
                }
            } catch (e3) {}

            if (isDown) {
                step = -step;
            }

            var nextValue = currentValue + step;

            if (nextValue < 0) {
                nextValue = 0;
            }

            editText.text = formatNumber(nextValue, 3);

            try {
                event.preventDefault();
            } catch (e4) {}

            try {
                event.stopPropagation();
            } catch (e5) {}
        });
    }

    // ------------------------------------------------------------
    // セル内の上下位置揃え
    // ------------------------------------------------------------
    function getVerticalValueFromDropdown(dropdown) {
        var index = 0;

        try {
            index = dropdown.selection.index;
        } catch (e) {
            index = 0;
        }

        if (index === 1) {
            return VerticalJustification.CENTER_ALIGN;
        }

        if (index === 2) {
            return VerticalJustification.BOTTOM_ALIGN;
        }

        if (index === 3) {
            return VerticalJustification.JUSTIFY_ALIGN;
        }

        return VerticalJustification.TOP_ALIGN;
    }

    function setVerticalDropdownByValue(dropdown, value) {
        var index = 0;

        try {
            if (value === VerticalJustification.CENTER_ALIGN) {
                index = 1;
            } else if (value === VerticalJustification.BOTTOM_ALIGN) {
                index = 2;
            } else if (value === VerticalJustification.JUSTIFY_ALIGN) {
                index = 3;
            } else {
                index = 0;
            }
        } catch (e) {
            index = 0;
        }

        dropdown.selection = index;
    }

    // ------------------------------------------------------------
    // 設定ファイル
    // ------------------------------------------------------------
    function getSettingsFile() {
        var folder = Folder.userData;

        if (!folder.exists) {
            folder.create();
        }

        return new File(folder.fsName + "/" + SETTINGS_FILE_NAME);
    }

    function createDefaultStore() {
        return {
            version: "1.2.1",
            applyWidth: true,
            applyHeight: true,
            applyInsets: false,
            applyVertical: false,
            heightMode: "minimum",
            verticalIndex: 0,
            widthText: "",
            heightText: "",
            topInsetText: "",
            bottomInsetText: "",
            leftInsetText: "",
            rightInsetText: ""
        };
    }

    function loadSettingsStore() {
        var store = createDefaultStore();
        var file = getSettingsFile();

        if (!file.exists) {
            return store;
        }

        try {
            file.encoding = "UTF-8";
            file.open("r");
            var text = file.read();
            file.close();

            if (!text || trimString(text) === "") {
                return store;
            }

            var loaded = parseSettingsText(text);

            if (!loaded) {
                return store;
            }

            for (var key in store) {
                if (store.hasOwnProperty(key) && loaded[key] !== undefined) {
                    store[key] = loaded[key];
                }
            }

            return store;
        } catch (e1) {
            try {
                if (file.opened) {
                    file.close();
                }
            } catch (e2) {}

            return store;
        }
    }

    function saveSettingsStore(store) {
        var file = getSettingsFile();

        try {
            file.encoding = "UTF-8";
            file.open("w");
            file.write(stringifySettings(store));
            file.close();
        } catch (e1) {
            try {
                if (file.opened) {
                    file.close();
                }
            } catch (e2) {}
        }
    }

    function parseSettingsText(text) {
        try {
            if (typeof JSON !== "undefined" && JSON.parse) {
                return JSON.parse(text);
            }
        } catch (e1) {}

        try {
            return eval("(" + text + ")");
        } catch (e2) {
            return null;
        }
    }

    function stringifySettings(obj) {
        try {
            if (typeof JSON !== "undefined" && JSON.stringify) {
                return JSON.stringify(obj, null, 2);
            }
        } catch (e1) {}

        return objectToSource(obj, 0);
    }

    function objectToSource(value, level) {
        var indent = repeatString("    ", level);
        var nextIndent = repeatString("    ", level + 1);

        if (value === null) {
            return "null";
        }

        if (typeof value === "string") {
            return quoteString(value);
        }

        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }

        if (value instanceof Array) {
            if (value.length === 0) {
                return "[]";
            }

            var arrayParts = [];

            for (var i = 0; i < value.length; i++) {
                arrayParts.push(nextIndent + objectToSource(value[i], level + 1));
            }

            return "[\n" + arrayParts.join(",\n") + "\n" + indent + "]";
        }

        if (typeof value === "object") {
            var parts = [];

            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    parts.push(
                        nextIndent +
                        quoteString(key) +
                        ": " +
                        objectToSource(value[key], level + 1)
                    );
                }
            }

            if (parts.length === 0) {
                return "{}";
            }

            return "{\n" + parts.join(",\n") + "\n" + indent + "}";
        }

        return "null";
    }

    function quoteString(str) {
        return '"' + String(str)
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t") + '"';
    }

    function repeatString(str, count) {
        var result = "";

        for (var i = 0; i < count; i++) {
            result += str;
        }

        return result;
    }

    // ------------------------------------------------------------
    // Utility
    // ------------------------------------------------------------
    function pointsToMillimeters(pt) {
        return Number(pt) * 25.4 / 72;
    }

    function millimetersToPoints(mm) {
        return Number(mm) * 72 / 25.4;
    }

    function trimString(str) {
        return String(str).replace(/^\s+|\s+$/g, "");
    }

    function normalizeNumberString(str) {
        return String(str)
            .replace(/[ｍＭ]/g, "m")
            .replace(/[，]/g, ",")
            .replace(/[．]/g, ".")
            .replace(/,/g, ".")
            .replace(/mm$/i, "")
            .replace(/\s+/g, "");
    }

    function formatNumber(num, decimals) {
        var fixed = Number(num).toFixed(decimals);

        fixed = fixed.replace(/\.?0+$/g, "");

        if (fixed === "-0") {
            fixed = "0";
        }

        return fixed;
    }
})();
