# InDesign Table Tools

InDesign の表組作業を補助する JSX スクリプト集です。

表罫線の操作、列幅の調整、セルサイズの統一など、  
InDesign の表組作業でよく発生する細かい調整を、  
より実務的に扱いやすくするためのツールをまとめています。

---

## Download

最新版はこちらからダウンロードできます。

https://github.com/SatoruTakahashi7/InDesign-Table-Tools/releases/latest

---

## Included Scripts

### TableLineHelper.jsx  
日本語名: 表組の罫線をいじるやつ.jsx

InDesign の表罫線操作を補助するスクリプトです。

主な機能:

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
- 線幅プリセット
- mm / pt 切替
- 最終設定の記憶

---

### TableColumnWidthPanel.jsx

表の列幅を調整するための補助パネルです。

主な機能:

- 選択中の表・列を対象に列幅を調整
- 数値入力による列幅指定
- mm / pt 単位での調整
- 複数列の幅調整補助
- 表組作業中の列幅変更を効率化

---

### TableCellSizeMatcher.jsx

表セルのサイズを揃えるための補助スクリプトです。

主な機能:

- 選択セルのサイズ取得
- セル幅・セル高さの統一
- 基準セルに合わせたサイズ調整
- 表内の不揃いなセルサイズ整理
- 実務組版での表調整補助

---

## Installation

1. `.jsx` ファイルをダウンロードします。
2. InDesign の Scripts Panel フォルダに配置します。
3. InDesign の「スクリプト」パネルから実行します。

### macOS

```text
~/Library/Preferences/Adobe InDesign/
Version XX.X-J/ja_JP/Scripts/Scripts Panel/
```

### Windows

```text
%APPDATA%/Adobe/InDesign/
Version XX.X-J/ja_JP/Scripts/Scripts Panel/
```

---

## Recommended Repository Structure

```text
InDesign-Table-Tools/
├── README.md
├── README.en.md
├── LICENSE
├── SCRIPTMETA.txt
├── screenshots/
└── src/
    ├── TableLineHelper.jsx
    ├── TableColumnWidthPanel.jsx
    └── TableCellSizeMatcher.jsx
```

---

## Notes

注意:

- 結果に関しては一切の保証はできません。
- 本スクリプトの読み取り結果および使用結果について、正確性・完全性は保証できません。
- 必ず複製データで動作確認してから使用してください。
- ドキュメント構造、表の状態、結合セル、InDesign のバージョン差などにより、意図通りに処理できない場合があります。

---

## License

MIT License

---

## Author

GYAHTEI Design Laboratory  
Satoru Takahashi

https://gyahtei.com/
