# RetroF1M.github.io

RetroF1M hosts modified ZX Spectrum `.sna` snapshots of CRL's 1985
Formula One in the QAOP JavaScript ZX Spectrum emulator.

**Status**: Phase 0 - Foundation Research & Repository Setup. See `docs/progress-tracking.md` for current progress.

## Current Package

- Play the patched 2023 build: open `emulator.html`.
- Patched snapshot: `seasons/f12023-modern.sna`.
- Baseline snapshot: `seasons/f12023.sna`.
- Browser editor: `editor/season-editor.html`.
- CLI editor/build tool: `tools/f1-season-tool.mjs`.

## Run Locally

Serve the repository root, then open the emulator page:

```sh
python3 -m http.server 8000
```

```text
http://127.0.0.1:8000/emulator.html
```

`emulator.html` auto-loads `seasons/f12023-modern.sna` when no hash is
provided. To load another snapshot, use a hash path such as:

```text
http://127.0.0.1:8000/emulator.html#/seasons/f12023.sna
```

`f12023-modern.sna` is based on `f12023.sna` and changes the race points
table to modern top-10 scoring:

```text
25,18,15,12,10,8,6,4,2,1
```

The patch also updates the Z80 award loop so ten finishing positions are
processed instead of the previous eight.

## Pit Stop Remap

`emulator.html` includes an off-by-default Pit keys toggle. When enabled
and the emulator is in full-screen play mode, it maps:

```text
Left arrow  -> Q
Down arrow  -> Z
Up arrow    -> I
Right arrow -> P
Enter       -> N
```

The wrapper ignores the remap when the QAOP menu is open, when a browser
text control has focus, or when Ctrl/Alt/Meta modifiers are held.

## Editing Workflow

Export a season JSON file:

```sh
node tools/f1-season-tool.mjs export seasons/f12023-modern.sna tools/seasons/f12023-modern.json
```

Build a new playable snapshot:

```sh
node tools/f1-season-tool.mjs build seasons/f12023.sna tools/seasons/f12023-modern.json seasons/f12023-custom.sna
```

Create the current patched 2023 snapshot directly:

```sh
node tools/f1-season-tool.mjs patch-2023 seasons/f12023.sna seasons/f12023-modern.sna
```

The current editor covers the stable fixed-width snapshot tables: driver
names, special driver labels, team names, managers, circuit names, lap
counts, track lengths, lap-record times, lap-record years, driver/reference
bytes used by circuit records and winners, sponsors, incident text, and
the points table.

## Engine Limits

The tooling preserves the original game and QAOP path. It does not replace
the ZX Spectrum game with a remake.

The current safe patch keeps the original engine's sixteen circuit slots
and byte-sized championship totals. Expanding the live race grid, moving
beyond sixteen in-season circuits, or making championship totals fully
16-bit requires deeper Z80 code changes across race flow, standings, and
screen layout.

## Experimental Boundary Build

On the `boundary-grid-calendar-z80` branch, the safe build remains available
as `seasons/f12023-modern.sna`. The experimental 22-round calendar build is:

```text
seasons/f12023-boundary-experimental.sna
```

Build and verify it with:

```sh
node tools/f1-boundary-patch.mjs build seasons/f12023-modern.sna tools/seasons/f12023-boundary-22.json seasons/f12023-boundary-experimental.sna
node tools/f1-boundary-patch.mjs verify seasons/f12023-boundary-experimental.sna 22
```

Then load it locally with:

```text
http://127.0.0.1:8000/emulator.html#/seasons/f12023-boundary-experimental.sna
```

The controlled round-17 probe is deliberately separate from that normal
experimental artifact:

```sh
node tools/f1-boundary-runtime-probe.mjs build seasons/f12023-boundary-experimental.sna seasons/f12023-round17-probe-experimental.sna
node tools/f1-boundary-runtime-probe.mjs verify seasons/f12023-round17-probe-experimental.sna
```

## Canonical Season Packages

`tools/seasons/f12023-canonical.json` is the first offset-independent season
package. It declares an engine profile, structured calendar, drivers, teams,
points, and text. Compile it to an explicitly experimental 22-round snapshot:

```sh
node tools/f1-canonical-season.mjs validate tools/seasons/f12023-canonical.json
node tools/f1-canonical-season.mjs compile seasons/f12023-modern.sna tools/seasons/f12023-canonical.json seasons/f12023-canonical-experimental.sna
```

The compiler validates profile capacity, data widths, circuit references, and
points before invoking the existing safe or boundary snapshot builders. Before
compiling, assess whether the selected profile can represent the season without
known engine compromises:

```sh
node tools/f1-canonical-season.mjs assess tools/seasons/f12023-canonical.json
```

`assess` reports calendar, live-grid, standings, historical-scoring, and QAOP
runtime blockers. A successfully compiled snapshot is only a promoted playable
season package after that assessment is clear and the QAOP release checklist is
completed. In particular, the current 22-round profile remains a development
path: it has byte-sized capped standings, a six-car live grid, and no natural
round-17/end-of-season runtime proof.

The browser editor can also preview a canonical JSON package, validates its
declared engine profile, and shows the same headline release-capacity limits.
It intentionally directs 17-22 round packages to the CLI compiler, so the
browser cannot accidentally export a fixed 16-round snapshot as a longer
season.

## Long-Term Roadmap

The detailed handoff plan for the 1950-2026 season archive, customizer,
calendar expansion, points engine, and race-grid expansion is in
`docs/project-roadmap-1950-2026.md`.
