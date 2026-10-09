# RetroF1M — Project State & Handoff

Status: living document. Companion to `project-roadmap-1950-2026.md`
(the authoritative brief). This file records working policies, the skills
in use, what is **proven** vs **unknown**, progress to date, what is
**actively** being worked on, and what is **next**.

Branch: `boundary-grid-calendar-z80`.
Protected (never touch): branch `safe-build-pit-toggle-points` and file
`seasons/f12023-modern.sna`.

## 1. The goal (short form)

Make CRL's 1985 ZX Spectrum *Formula One* highly editable and ship a
playable `.sna` season package for every F1 year 1950–2026 (real calendar,
teams, drivers, points, tracks), eventually the full real-size grid. This
is the **original game** edited via Z80 patches + `.sna` editing, delivered
through QAOP. **Not** a JS remake, dashboard, simulator or lab.

## 2. Working policies (in force)

- **No new experimental/probe/duplicate `.sna` files.** The user objected
  strongly to these. Exception agreed this session: the **Priority-2 grid
  expansion** is built onto a **new** `.sna` so the known-good
  `seasons/f12023-boundimental-experimental.sna` is never risked; the
  boundary-calendar work itself regenerates the existing experimental
  snapshot **in place** (git keeps history). Priorities and rebuilds are
  always confirmed to the user first.
- **Natural progression only.** Never prove runtime behaviour by setting the
  round byte by hand or by the round-17 probe. Play it through with
  0-player automated races (Enter advances menus; selecting 0 players runs
  automated races, no driving needed).
- **Honest proof.** Never claim runtime proof from static checks or synthetic
  snapshots. State plainly what is tested vs unknown. Disassembly = proven
  *structure*; QAOP natural play = proven *runtime*.
- Preserve uncommitted worktree changes (`docs/project-roadmap-1950-2026.md`,
  `.clinerules`). Do not clobber; add to docs, don't duplicate.

## 3. Skills created / used

- **`qaop-spectrum-control`** (local skill, `~/.agents/skills/`). Captures the
  hard-won emulator control knowledge:
  - QAOP does **not** take input from synthetic DOM key events; inject keys via
    `window.emu.kbd(~asciiCode, isDown, 0)` (Enter=13, digits=48–57), ~120ms
    hold. `press_key`/browser typing do **not** reach the Spectrum.
  - Speed: read/set via `window.emu.getState().speed` /
    `window.emu.setState({ speed: N })`.
  - **Which race we're on:** round byte at `zx.get(0x6BB2)` (1-based).
  - Self-cleaning watcher pattern: crank to 32, tap Enter to advance
    post-race menus, trace the round byte, snap to 1× on the target — all in
    one script call so it can't overshoot.
  - Serving: `python -m http.server 8000`; snapshots load via URL hash
    (`#/seasons/<name>.sna`).
  - Loaded automatically on phrasings like "speed up the emulator", "press
    Enter", "which race are we on".

## 4. Proven vs unknown

**Proven — Priority 1 (22-round calendar), by natural progression in QAOP:**
The `experimental-calendar-22` boundary build plays **17 → 18 → 19 → 20 → 21 →
22** through normal Enter-driven, 0-player automated play, loops cleanly into
the next season, and shows all results/scores. This was previously listed as
unproven; it is now proven at the round-counter level (`0x6BB2`) and visually.
Tied top-two championship scores (e.g. 244) were observed — treated as a
byte-total artifact to investigate, not asserted.

**Proven — engine structure (disassembly):**
- 6 teams × 2 cars = 12 cars; init loop `0xC933` (`LD B,0x0C`); team walk
  `0xC95E` steps B+=2; points loop `0xCE52` does `SRL E` (team = driver>>1).
- ~150 live reference sites across the grid arrays (see step-1 sitemap).
- Feature screens all exist (text in RAM): balance/funds, sponsors, upgrades,
  car stats, managers (`0x7000`), driver market/AI draft (`0x72B9`), car
  numbers, pit/tyre options, end-of-season champion screens.

**Unknown / still to-ground (not patched):**
- Contiguous free relocation target for the grown arrays (step-1 #1 risk — the
  "freed calendar block" is NOT uniformly free).
- Runtime RAM bytes for car number, sponsor value, funds, upgrade levels;
  driver-pool size + AI-draft bounds; manager-name slot stride.
- Human team-selection menu + in-race sprite rendering correctness for >6 teams
  (not exercised by automated play; need human-input + visual checks).

## 5. Progress log (this work stream)

- **Priority 1 — DONE (proven).** 22-round calendar verified by natural play
  through race 22 and season loop. Documented in `docs/boundary-experimental.md`.
- **Priority 2, Step 1 — DONE (committed).** `docs/race-grid-expansion-step1-sitemap.md`
  (commit `65a34fb`): classified site map + relocation plan for 6→13 teams /
  12→26 cars, sized to historical max with active-count-per-season. Corrected an
  earlier overstatement (the freed block is fragmented, not one clean span).
- **New-variables plan — DONE (this doc set).**
  `docs/grid-expansion-new-variables-plan.md`: the 6 per-team/per-car features
  that must scale (driver/car numbers, managers, sponsors, funds, upgrades, AI
  draft) + scaling rules + honest proven/unknown split.

## 6. Actively being worked on

Grounding the 6 to-ground items (locate RAM vars + AI-draft bounds + manager
slot stride + the free relocation target) so the Step-2 relocation layout is
exact. Read-only analysis; no `.sna` built or modified.

## 7. Next

1. Finish grounding (this section 6).
2. **Step 2 (Priority 2):** relocate+expand grid AND management arrays into a
   proven-free target on a **new** `.sna`; introduce `teamCount`/`carCount` RAM
   variables; repoint every classified site. Show the per-step plan before any
   patch, per the user's instruction.
3. Steps 3–6: variable loop-bounds → timing board/display → **last** open human
   input bounds; then data (2023 writes 10, POC writes 13); note 2026 (11 teams)
   is within the 13-team ceiling.
