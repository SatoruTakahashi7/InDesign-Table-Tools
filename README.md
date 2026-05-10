# InDesign Table Tools

InDesign の表組作業を補助する JSX スクリプト集です。

## Included scripts

- `TableCellSizeMatcher.jsx`  
  表セルの幅・高さ・セル内マージン・上下位置揃えを拾って、別セルへ適用します。

- `TableColumnWidthPanel.jsx`  
  表組の列幅をパネルUIから変更します。固定mm、fill、プリセット保存に対応します。

- `TableLineHelper.jsx`  
  表セル罫線を、見やすいUIで操作します。外枠、内部、個別線、線幅、線種、色指定に対応します。

## SCRIPTMETA

各 JSX には SCRIPTMETA v1.4 形式のローカルメタデータを埋め込んでいます。
リポジトリ直下の `SCRIPTMETA.txt` は配布メタデータです。

## Download

最新版は Releases からダウンロードしてください。

https://github.com/SatoruTakahashi7/InDesign-Table-Tools/releases/latest

## Notes

必ず複製データ、または元に戻せる状態で検証してから使用してください。
結合セルを含む表では、一部の処理が意図通りにならない場合があります。
