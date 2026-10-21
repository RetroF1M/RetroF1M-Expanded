# RetroF1M Project Roadmap: 1950-2026

This document is the handoff source of truth for continuing RetroF1M work in a
new chat or branch.

**Status**: Phase 0 - Foundation Research & Repository Setup (2026-10-21). See `docs/progress-tracking.md` for detailed current progress.

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

## Original Project Brief

Repository:

- `https://github.com/RetroF1M/RetroF1M.github.io/tree/main`

Project context:

- RetroF1M hosts modified ZX Spectrum `.sna` snapshots of the 1985 game
  Formula One using the QAOP JavaScript ZX Spectrum emulator.
- Season mods are already made by editing `.sna` files.
- The target deliverable is a working modified game package, not an
  open-ended reverse-engineering research project.
- Use `seasons/f12023.sna` as the main baseline because it is the most
  up-to-date snapshot.

Original requested deliverables:

- A working modified `.sna` game that still plays like the original Formula
  One.
- Optional arrow-key controls for pit stops.
- More cars/teams available in races so the grid can be filled properly.
- More circuits available so a season can include every real race from that
  year.
- Correct points system for the selected season.
- Editing tools or scripts that make it easy to keep making season files from
  1950 onward.

Hard boundaries:

- Do not build a new JavaScript remake.
- Do not replace the game with a dashboard, simulator, or new browser game.
- Do not turn this into a research-only task.
- Do not spend time on speculative labs unless they directly produce the
  working modified `.sna` or editing workflow.
- Preserve the original ZX Spectrum game, menus, race flow, graphics, pit
  stops, and feel.
- Keep the QAOP emulator approach.

Pit-stop key remap requirement:

- Add it in the emulator wrapper if possible.
- It must be off by default and toggleable.
- It must not break menu navigation.
- It must not interfere when typing names, numbers, save names, or text.
- Mapping:

```text
Left arrow  -> Q
Down arrow  -> Z
Up arrow    -> I
Right arrow -> P
Enter       -> N
```

Game modification goals:

- Expand the usable race grid beyond the original small team/car limit.
- Expand the season calendar beyond the original circuit limit.
- Allow the points system to be changed per season, including modern top-10
  systems like `25,18,15,12,10,8,6,4,2,1`.
- Keep the result as a playable `.sna` in QAOP.

Editing workflow goals:

- Provide a practical way to generate or edit season `.sna` files.
- Support producing many F1 seasons, ideally every season from 1950 onward.
- Cover:
  - driver names
  - team names
  - managers/principals
  - circuits
  - lap counts
  - track lengths
  - lap records
  - previous winners
  - sponsors
  - failure/incident text
  - points system
  - car/team graphics if feasible
- Prefer scripts or a simple web editor that writes valid `.sna` files.
- The editor is a support tool; the main deliverable remains the working
  modified game.

Expected package outputs:

- A patched playable `.sna` based on `f12023.sna`.
- Updated emulator page with the safe toggleable pit-stop remap.
- Repeatable editing workflow for future season files.
- Clear testing instructions.
- Notes only where needed to explain how to continue editing safely.

## Branch State

| Branch | Commit | Purpose |
| --- | --- | --- |
| `safe-build-pit-toggle-points` | `f18535d` | Protected safe build with pit toggle and modern 2023 points |
| `boundary-grid-calendar-z80` | `5a95f8c` | Current working branch; calendar/compiler/editor work and existing experimental artifacts |
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

- Race 17+ reached through a complete natural in-game season progression.
- Race 17+ uses correct race setup in a complete manually played race session.
- End-of-season behavior after race 22.

Controlled-state evidence is now checked by
`tools/f1-boundary-runtime-probe.mjs`: a separate probe snapshot with current
round 16 proves that patched setup advances to round 17 and reads Baku's
relocated lap count, record, length, and name. This is narrower than full
manual QAOP race completion, which remains required before promotion.

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

Initial implementation delivered:

- `tools/f1-canonical-season.mjs` validates canonical packages and compiles
  either `safe-16` or `experimental-calendar-22` outputs.
- `tools/seasons/f12023-canonical.json` converts the current 2023 data into
  this format and round-trips byte-for-byte to the experimental 22-round
  snapshot when compiled from the modern baseline.
- `editor/season-editor.html` accepts canonical JSON for profile validation
  and fixed-table preview, while deliberately requiring the CLI compiler for
  17-22-round `.sna` output.

These canonical/compiler/editor additions are already present in commits
`f122093` and `5a95f8c`. They are existing work, not a request to create more
probe or duplicate snapshots. The generated files
`seasons/f12023-canonical-experimental.sna` and
`seasons/f12023-round17-probe-experimental.sna` are already tracked on the
current branch. Do not create additional lab artifacts. Decide separately
whether these existing files/tools should be retained or cleaned up; do not
delete or rewrite them without checking their use and preserving recoverable
history.

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

## Current Handoff: QAOP Runtime Checkpoint

The user wants direct progress on the playable game and editor toward editable
1950-2026 season packages, full calendars, and eventually full race grids. Do
not create more lab/probe/duplicate `.sna` artifacts or turn the work into a
research-only exercise. Continue on the current working branch; preserve the
protected `safe-build-pit-toggle-points` branch and its safe build.

Most recent real QAOP test of
`seasons/f12023-boundary-experimental.sna`:

- Loaded the existing snapshot in the QAOP emulator and advanced through the
  title and player-count screens.
- Selected 0 players, which starts an automated race flow without requiring
  driving.
- Reached Bahrain race setup/results and then the live Bahrain race screen.
- Confirmed the live timing board advanced over subsequent observations
  (through approximately lap 15); a later view showed a pit-stop sequence.
- This establishes that race 1 can run in QAOP. It does **not** establish that
  the season finishes races 1-16, reaches race 17, or ends correctly after the
  configured final race.
- No repository files or snapshots were changed during this QAOP attempt.

Do not spend an entire session passively waiting through 16 races as the
default next step. First make the handoff actionable: use the existing browser
session if available, choose 0 players, and advance with Enter as needed. If
continuous automated progression is too slow or the emulator session is lost,
record the tested boundary and continue with another concrete game/editor
deliverable; do not create a synthetic round-17 `.sna` just to claim runtime
proof. Only revisit race-17 runtime proof when it can be obtained through the
real game flow or a safe, explicitly approved test method.

## Next Work Sequence

1. Check branch and worktree state; do not alter the protected safe branch.
2. Continue the existing QAOP session if practical and low-cost. The current
   known checkpoint is the automated Bahrain race, not race 17.
3. Prioritize a user-visible game/editor improvement that directly advances
   season editability or playable season creation; work on the project, not a
   speculative lab. Keep risky Z80 changes isolated from the safe branch and
   use the project’s agreed naming/output policy.
4. Generalize season data/build/editor support so variable historical race
   counts and season-specific data can be represented and validated.
5. Expand the actual playable calendar and grid capabilities in verifiable
   increments. Calendar runtime proof is still needed; full-grid expansion is
   not implemented.
6. Verify the game in QAOP and run relevant editor/compiler checks for each
   milestone. Commit every playable or checkable milestone.

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

For calendar milestones, separately record which rounds were actually
reached in QAOP; static patch verification or controlled RAM inspection alone
does not count as proof that the in-game season progression works.

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
