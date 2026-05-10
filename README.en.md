# InDesign Table Tools

A collection of JSX scripts that help with Adobe InDesign table workflows.

## Included scripts

- `TableCellSizeMatcher.jsx`  
  Captures table cell width, height, cell insets, and vertical justification, then applies them to other cells.

- `TableColumnWidthPanel.jsx`  
  Changes table column widths from a panel UI. Supports fixed millimeter values, fill columns, and presets.

- `TableLineHelper.jsx`  
  Helps edit table cell strokes with a visual UI. Supports outer/inner/individual strokes, stroke weight, stroke type, and swatch color.

## SCRIPTMETA

Each JSX file includes local metadata in SCRIPTMETA v1.4 format.
The root `SCRIPTMETA.txt` file is distribution metadata.

## Download

Download the latest release from Releases:

https://github.com/SatoruTakahashi7/InDesign-Table-Tools/releases/latest

## Notes

Use on duplicate data first, or in a state where you can safely undo.
Tables containing merged cells may not always behave as expected.
