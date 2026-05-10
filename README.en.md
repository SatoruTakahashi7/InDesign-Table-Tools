# InDesign Table Tools

A collection of JSX utility scripts for Adobe InDesign table workflows.

These tools are designed to support practical table editing tasks such as table stroke editing, column width adjustment, and cell size matching.

---

## Download

Latest release:

https://github.com/SatoruTakahashi7/InDesign-Table-Tools/releases/latest

---

## Included Scripts

### TableLineHelper.jsx

A helper script for editing table strokes in Adobe InDesign.

Features:

- Manual execution after selecting table cells
- Apply all borders
- Apply outer borders
- Apply inner borders
- Remove outer borders
- Remove inner borders
- Remove all borders
- Thick outer border + thin inner border
- Individual selection of top / bottom / left / right / inner horizontal / inner vertical borders
- Visual border selection UI
- Stroke width presets
- mm / pt unit switching
- Remembers last-used settings

---

### TableColumnWidthPanel.jsx

A helper panel for adjusting table column widths.

Features:

- Adjust column widths for selected tables or columns
- Numeric width input
- mm / pt unit support
- Helps adjust multiple columns
- Improves efficiency when working with InDesign tables

---

### TableCellSizeMatcher.jsx

A helper script for matching table cell sizes.

Features:

- Read the size of selected cells
- Match cell width and/or height
- Adjust cells based on a reference cell
- Helps clean up inconsistent table cell sizes
- Useful for practical table layout work

---

## Installation

1. Download the `.jsx` files.
2. Place them into the InDesign Scripts Panel folder.
3. Run them from the InDesign Scripts panel.

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

Warning:

- No guarantees are provided for the results.
- Accuracy and completeness of script processing/results are not guaranteed.
- Always test with duplicated files before using in production.
- Some cases may not work as expected depending on document structure, table conditions, merged cells, and InDesign version differences.

---

## License

MIT License

---

## Author

GYAHTEI Design Laboratory  
Satoru Takahashi

https://gyahtei.com/
