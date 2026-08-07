# RetroF1M Project Roadmap: 1950-2026

This document is the handoff source of truth for continuing RetroF1M work in a
new chat or branch.

## Non-Negotiable Product Direction

RetroF1M must remain the original ZX Spectrum Formula One game running through
QAOP. The goal is a playable modified `.sna` workflow, not a JavaScript remake,
dashboard, simulator, or new browser game.

Preserve:

- original ZX Spectrum game feel
- original menus and race flow
- original race graphics and pit-stop feel
- QAOP emulator delivery
- `.sna` files as the playable season artifacts

## Branch State

| Branch | Commit | Purpose |
| --- | --- | --- |
| `safe-build-pit-toggle-points` | `f18535d` | Protected safe build with pit toggle and modern 2023 points |
| `boundary-grid-calendar-z80` | `9a0d8c6` | Experimental engine boundary branch |
| `main` / `origin/main` | `f0aec01` | Original upstream state with editor assets |

Do not continue boundary experiments on `safe-build-pit-toggle-points`. Create
or continue a separate branch for risky Z80 work.

## Delivered So Far

### Safe Playable Build

- `seasons/f12023-modern.sna`
- `emulator.html` defaults to this snapshot when no hash is provided.
- Modern top-10 points table:

```text
25,18,15,12,10,8,6,4,2,1
```

- Z80 points award loop patched to process ten scoring positions.
- Off-by-default pit-stop key toggle in the emulator wrapper:

```text
Left arrow  -> Q
Down arrow  -> Z
Up arrow    -> I
Right arrow -> P
Enter       -> N
```

The wrapper avoids menu/text-entry interference by requiring emulator full
screen play state, ignoring browser text controls, and ignoring modifier keys.

### Editing Workflow

- CLI: `tools/f1-season-tool.mjs`
- Browser editor: `editor/season-editor.html`
- Stable fixed-width fields currently covered:
  - driver names
  - special driver labels
  - team names
  - managers/principals
  - circuit names
  - lap counts
  - track lengths
  - lap-record times
  - lap-record years
  - circuit driver/reference bytes
  - sponsors
  - incident/failure text
  - points table

This workflow edits the known fixed tables in the original snapshot layout.
It does not, by itself, solve more than sixteen circuits, full grids, or
wide championship totals.

### Z80 Tooling

- `tools/z80-inspect.mjs`
  - targeted disassembly
  - direct RAM-address reference scans
- `tools/f1-boundary-patch.mjs`
  - experimental calendar relocation patcher
  - Z80 pointer/count verification
  - byte-saturating points guard

### Experimental Boundary Snapshot

- `seasons/f12023-boundary-experimental.sna`
- Built from:

```sh
node tools/f1-boundary-patch.mjs build seasons/f12023-modern.sna tools/seasons/f12023-boundary-22.json seasons/f12023-boundary-experimental.sna
```

- Verify with:

```sh
node tools/f1-boundary-patch.mjs verify seasons/f12023-boundary-experimental.sna 22
```

- Load locally with:

```text
http://127.0.0.1:8000/emulator.html#/seasons/f12023-boundary-experimental.sna
```

Current experimental engine changes:

- Relocated circuit tables into `0x613C-0x655F`.
- Expanded calendar from 16 to 22 slots.
- Patched known final-round checks from `0x10` to `0x16`.
- Patched short-name redraw row base so rows do not underflow at 22 entries.
- Added a points saturating-add trampoline at `0x6550`, so byte totals cap at
  `255` instead of wrapping.

Experimental appended rounds:

- Baku
- Barcelona
- Spielberg
- Hungaroring
- Singapore
- Austin

Verified:

- JS syntax checks pass.
- Boundary patch verifier passes for 22 slots.
- QAOP boot smoke test passes and displays the Formula One title screen.

Not yet verified:

- Race 17+ reached through natural in-game season progression.
- Race 17+ uses correct race setup in a complete race session.
- End-of-season behavior after race 22.

## Current Technical Boundaries

### Championship Points

Current safe and experimental builds still store standings as bytes:

- constructor/team points: `0x6910`
- driver points: `0x6948`

The experimental boundary build prevents wrap by capping byte totals at `255`.
This is not a true modern standings system for seasons where drivers or teams
exceed 255 points.

True completion requires:

- relocating or widening driver standings
- relocating or widening constructor standings
- updating award logic
- updating sorting/comparison logic
- updating standings display
- updating champion/end-of-season screens
- keeping existing 16-race seasons compatible

### Calendar

The experimental branch proves a 22-slot relocation path. This is not yet a
finished all-season calendar engine.

Remaining work:

- Runtime-test race 17+ through a real game flow.
- Confirm end-of-season triggers after configured final race.
- Replace the old fixed 4 x 4 calendar view with a paged Spectrum-native view
  if 22 rows are too dense or unreadable.
- Generalize the patcher beyond the hard-coded 22-slot 2023 experiment.
- Support variable per-season race counts from 1950 onward.

### Race Grid

Mapped evidence is in `docs/race-grid-engine-map.md`.

Important finding:

- The engine has several internal arrays that look sized for twelve active
  race entries.
- The user-facing player/team selection, prompts, visible timing board, and
  some race-flow checks still assume six.

Do not ship a blind constant-only grid patch.

First safe target:

- 8 active cars.

Required before a committed grid snapshot:

- Patch input prompts and validation from `1-6` to `1-8`.
- Patch visible timing-board loop and row math.
- Verify display buffers have room.
- Verify pit stops for added cars.
- Verify retire/failure logic for added cars.
- Verify results and points include added cars.
- Verify no menu/sponsor/driver-selection regressions.

Long-term target:

- Full real F1 grid for each season. Depending on the original engine limits,
  this may require an intermediate 12-car engine, then a deeper layout rewrite
  for 20+ visible/active cars.

## End Goal

Create accurate, playable season packages for every Formula One season from
1950 through 2026.

Each season should include:

- every championship race from that season
- correct driver list
- correct teams/constructors
- correct managers/principals where applicable
- correct reserve/substitute drivers for the time
- correct lap counts
- correct track lengths
- correct lap records and record holders
- correct previous winners where the game uses them
- correct sponsors/period-appropriate text where feasible
- correct failure/incident text where season-specific changes are useful
- correct points system for that season
- season-appropriate driver/team valuations
- car/team graphics where feasible
- enough active race grid capacity to reflect the season properly

## Data Model Needed

The current JSON export is useful but too close to the original fixed tables.
For 1950-2026 production, add a canonical season-data format independent of
the `.sna` layout.

Recommended structure:

- `year`
- `calendar`
  - round number
  - race name
  - circuit name
  - country/location
  - lap count
  - track length
  - race distance
  - lap record time
  - lap record holder
  - lap record year
  - previous winner
- `drivers`
  - name
  - nationality
  - constructor/team
  - car number where applicable
  - role: race/reserve/substitute
  - active rounds
  - valuation/rating
- `teams`
  - constructor name
  - entrant/display name
  - principal/manager
  - active rounds
  - valuation/rating
- `pointsSystem`
  - classified position awards
  - fastest lap rule where applicable
  - dropped scores or special historical rules where applicable
- `text`
  - sponsors
  - incident/failure strings
  - menu/display labels if season-specific
- `graphics`
  - livery/team graphic mapping
  - optional per-season car graphic patches
- `sourceNotes`
  - citations or provenance for manually entered historical data

The builder should compile this canonical data into the snapshot tables and
engine patch profile required for that season.

## Customizer Requirements

The customizer/editor should evolve from a fixed-table editor into a
season-package editor.

Required capabilities:

- load canonical season JSON
- validate field widths for `.sna` output
- validate race count against selected engine profile
- validate points system against engine profile
- validate driver/team capacity
- preview generated fixed-width ZX text
- export playable `.sna`
- export canonical season JSON
- warn when a season requires unsupported engine features
- show clear engine profile:
  - safe 16-race profile
  - experimental 22-race profile
  - future 8-grid profile
  - future full-grid profile

Nice-to-have capabilities:

- import structured CSV/JSON historical data
- batch-build seasons
- compare season JSON against previous version
- generate a QA checklist per season
- show source/provenance notes in editor

## Proposed One-Shot Work Sequence For A New Chat

Use this order in a new one-shot session:

1. Start from `boundary-grid-calendar-z80`.
2. Confirm `safe-build-pit-toggle-points` remains untouched.
3. Run:

```sh
node tools/f1-boundary-patch.mjs verify seasons/f12023-boundary-experimental.sna 22
```

4. Runtime-test race 17+ in QAOP or by controlled snapshot-state patching.
5. If race 17+ works, document the proof and keep the 22-round patch.
6. If race 17+ fails, inspect the exact failing routine and patch only that.
7. Build a canonical season JSON schema and convert current 2023 data into it.
8. Add compiler path from canonical season JSON to `.sna`.
9. Add editor support for canonical season files.
10. Start 8-car grid patch only after calendar runtime proof is stable.
11. Keep every risky engine change behind an explicit experimental output file.
12. Commit after each playable/checkable milestone.

## Verification Checklist

For every playable `.sna` milestone:

- `node --check tools/f1-season-tool.mjs`
- `node --check tools/f1-boundary-patch.mjs`
- `node --check tools/z80-inspect.mjs`
- relevant patcher `verify` command
- QAOP boot smoke test
- title screen visible
- menu navigation still works
- pit toggle still off by default
- pit toggle does not affect text entry
- at least one race can be started
- points are awarded as expected
- season progression reaches the expected next race

For promoted season data:

- race count matches real season
- driver/team lineups match the selected season and round coverage
- substitute/reserve drivers are represented correctly for that period
- points system matches historical rules
- track data is validated against source notes
- all fixed-width ZX text fits without corrupting adjacent data

## Current Short Version

Safe build is solid and preserved. Experimental branch now boots a 22-round
2023 boundary snapshot with relocated calendar tables and capped points. The
main unfinished technical work is runtime proof of race 17+, true wide
standings, full-grid expansion, and a canonical season-data/customizer workflow
for 1950-2026.
