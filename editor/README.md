# RetroF1M Editor

This folder keeps the original Windows Formula One editor and adds a
browser-based editor for the fixed-width season tables inside the `.sna`
snapshots.

## Browser Editor

Open `season-editor.html` in a browser, load a 48K Formula One `.sna`, edit
the fields, then download a patched `.sna`.

The editor currently covers:

- driver names
- team names
- managers
- circuit names
- lap counts
- track lengths
- lap-record times
- lap-record years
- circuit driver/reference bytes used by record and winner data
- sponsors
- failure/incident text
- points system

The browser editor is intentionally static. It does not need a build step
or a server.

When a canonical season JSON is previewed, the editor shows a concise engine
assessment alongside the fixed-table preview. It distinguishes a snapshot the
current tools can compile from a season package that can honestly be promoted:
calendar profile, byte-sized standings, six-car live-grid capacity, declared
historical scoring rules, and known QAOP runtime boundaries are all surfaced.
Use the CLI for the authoritative validation and compilation:

```sh
node tools/f1-canonical-season.mjs assess tools/seasons/f12023-canonical.json
```

## CLI Workflow

The same table map is available from `tools/f1-season-tool.mjs`:

```sh
node tools/f1-season-tool.mjs export seasons/f12023-modern.sna tools/seasons/f12023-modern.json
node tools/f1-season-tool.mjs build seasons/f12023.sna tools/seasons/f12023-modern.json seasons/f12023-custom.sna
```

## Original Windows Editor

`F1_Editor.exe` and `Formula One Editor.txt` are retained for reference.
The Windows editor only supports the limits it was built with, including
the original points cap.
