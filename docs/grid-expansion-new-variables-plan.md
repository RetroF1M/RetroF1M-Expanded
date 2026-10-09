# Grid Expansion — New Per-Team / Per-Car Variables Plan

Status: planning (read-only analysis). Companion to
`race-grid-expansion-step1-sitemap.md` (the array site map) and
`race-grid-engine-map.md` (the original engine map).
Branch: `boundary-grid-calendar-z80`. No `.sna` touched by this doc.

## Why this doc exists

The original game models **6 teams x 2 cars = 12 cars**. Priority 2 grows
this to the **historical max 13 teams x 2 = 26 cars** as the structural
ceiling, with the **active count written per season** (2023 writes 10; a
proof-of-concept writes 13). Growing the arrays is not enough: every
per-team and per-car piece of *state* that the game already models must
scale too, or the new teams/cars will be unplayable (no driver number for
a pit call, no manager name, no sponsor, no funds, no upgrades, and the
AI will not draft/run drivers for them).

This doc lists every such variable, what we have **proven** from
disassembly vs what is still **assumed / to-ground**, and how it must scale.

## Confirmed facts (disassembly-proven — see step-1 sitemap)

- Per-car state arrays are 12-entry: `0x6979 / 0x6985 / 0x6991 / 0x6A51`.
  Contiguous cluster `0x6979-0x699C`. Init loop `0xC933` `LD B,0x0C`.
- `0x6991` = car -> driver/team map (finish/state), **27 refs**.
- `0x6849` = finish-order -> car map, **21 refs**.
- `0x701F` = 6-byte per-team **active** flag table, read `CP 0x01` at
  `0xC96B`. **20 refs**.
- Team walk `0xC95E-0xC97C` steps `B += 2` (B = 1,3,5,7,9,11 = 6 teams),
  indexes `0x701F` by `E = (B-1) >> 1`.
- Points/results `0xCE52-0xCEC4`: driver points `0x6948[driver-1]` added via
  the saturating-add trampoline `0x6550`; `SRL E` (team = driver >> 1);
  constructor points `0x6910[team]` via `0x6550`. Loop bounds
  `LD A,0x09` (top-10 points) and `LD A,0x0B` (12-car results).
- `0x692F` = 24-byte array (cleared `LD B,0x18` at `0xC926`); per-car
  pit/retire flag indexed `car mod 12`. **Not** grid-sized (24, not 12/26).
  Do NOT scale blindly — investigate before touching.

## Text / UI locations found (runtime RAM variables still to-ground)

These are the on-screen strings that prove each feature exists. The exact
**runtime RAM bytes** that hold the live values are partly identified and
partly still to-ground — flagged honestly per item.

| Feature | UI/text address found | Notes |
|---|---|---|
| Balance / funds | `0x8889` "Current Balance - 70,000" | 16-bit money likely; find the RAM var in the balance routine |
| Prizes / expenses / sponsorship | `0x8CDD-0x8D55` | where funds change each round |
| Sponsor selection | `0x8889` "Sponsor Selection" | per-team sponsor value |
| Upgrades | `0x8C6A` "Engine Chassis Crew" (improve via 'I') | upgrade levels per team |
| Car stats | `0x9608` "Power Car Crew Overall Efficiency %" | per-team performance inputs |
| Team managers | `0x7000` (principal names, e.g. "Z. Brown M. Krack Szafnauer") | per-team name text block |
| Driver market / AI draft | `0x72B9` "Name Team Car Cost ... Press keys A to X for driver" | AI/novice driver selection |
| Novice driver pool | `0xD4B8` "Do you want to be a driver?" | AI driver pool routine |
| Car numbers | `0x820F` "Please enter car number"; `0x8DE3` "Enter car number for betting" | **needed so a pit stop knows which car** |
| Pit / tyre options | `0x94B3` tyre-change options | pit routine; must resolve to a specific car |
| End of season | `0x8978` "Another Season?"; `0xE6AB` "Constructors/Drivers Champion / managed by" | reads manager + standings |

## New per-team / per-car variables that MUST scale (user requirements)

These are the features the user explicitly required to work for the new
teams/cars. Each row states what the game already does for 6 teams / 12
cars, what must grow for 13 / 26, and the proven-vs-unknown status.

| # | Variable / feature | 6-team / 12-car reality (to confirm) | Must grow to 13 / 26 | Proven / Unknown |
|---|---|---|---|---|
| 1 | **Driver / car numbers** | Car number entered per driver (`0x820F`, `0x8DE3`). Each car already has an internal index (0–11) used by pit/tyre routines. | Every car needs a unique number so a **pit stop knows which car to pull in**; extend the per-car number store 12 → 26. | Text proven; the exact per-car number **RAM var still to-ground** in the car-number entry routine. |
| 2 | **Team managers** | Manager name text block at `0x7000` (2023 principals). One name per team. | Grow the name block 6 → 13 (fixed-stride name slots) so every team shows a principal on the end-of-season "managed by" screen (`0xE6AB`). | Text + `0x7000` region proven; exact slot stride to confirm before writing slots. |
| 3 | **Sponsors** | Sponsor selection screen + per-team sponsor value feeding funds. | One sponsor slot per team, 6 → 13. | Screen text proven; sponsor **RAM var still to-ground**. |
| 4 | **Funds / balance** | 16-bit balance (`0x8889` "Current Balance - 70,000"); changes via prizes/expenses/sponsorship (`0x8CDD-0x8D55`). | One 16-bit balance per team, 6 → 13. | Text proven; balance **RAM var still to-ground** in the balance routine near `0x98DC`. |
| 5 | **Car upgrades** | Upgrade screen `0x8C6A` "Engine Chassis Crew" (improve via 'I'); per-team upgrade levels feed car stats `0x9608`. | Upgrade levels per team, 6 → 13. | Screens proven; upgrade-level **RAM vars still to-ground**. |
| 6 | **AI driver selection / drafting** | AI draft header `0x72B9` "Press keys A to X for driver"; novice pool `0xD4B8`. The AI assigns drivers to cars at season start. | Draft routine must fill all 26 cars for AI teams, not just 12; the "A to X" key map must cover the larger driver pool. | Text proven; the draft **routine RAM vars and driver-pool size still to-ground**. |

**Key design consequence (ties to step-1):** items 1–6 are per-team or per-car
*state*. They are the same class of structure as the grid arrays in the
step-1 site map. So the single Step-2 relocation must lay out **all** of these
grown arrays in the target block together, with the **active team/car count as
one RAM variable** every routine reads. Doing the grid arrays first and the
management variables later would mean relocating twice.

## Scaling rules (the "correct amount per season" idea)

- Relocate+expand once to the **ceiling** (13 teams / 26 cars) — this is
  structural, done once.
- Introduce **two RAM variables** (e.g. `teamCount`, `carCount = teamCount*2`),
  initialized by the season package (2023 → 10/20; POC → 13/26).
- Replace the **classified** hardcoded bounds (`LD A,0x0C`, `LD A,0x06`,
  `CP 0x06`, `LD A,0x09`, `LD A,0x0B`) with reads from these variables — **only**
  the sites the step-1 map classifies as grid-related (never blind-replace;
  coincidental reuses of 0x06/0x0C stay put).
- Menus, timing board, results, points, drafting, pit-call resolution, and the
  end-of-season screens all read `teamCount`/`carCount`, so one value drives the
  whole season.

## Sprites / in-race rendering (user point — not a blocker)

The engine draws whatever the snapshot RAM holds, so new teams are filled by
**duplicating existing team sprite/tile data** into the new team slots in the
`.sna`. The engine then calculates and renders them like any other team. This is
in-race *rendering* work (Step 4), and is data-copyable, not a code limit.

## Honest proven vs unknown (as of this doc)

**Proven (disassembly / live memory):** 6×2 = 12 architecture; init + points
loops; the `SRL E` team=driver>>1 relation; the ~150 array reference sites; the
team-table `0x701F` active-flag walk; the manager-name text region `0x7000`;
every feature screen listed above exists (its text is in RAM).

**Still to-ground before Step-2 patching (must resolve, not assume):** the exact
runtime RAM bytes for car number, sponsor value, funds, and upgrade levels; the
driver-pool size and AI-draft loop bounds; the manager-name slot stride; and the
**contiguous free relocation target** (the step-1 doc's #1 open risk — the
"freed calendar block" is *not* uniformly free). Each is a locate-in-disasm task,
recorded here, none yet patched.

## Next

1. Ground the 6 to-ground items above (locate the RAM vars + bounds) so the
   Step-2 relocation layout is exact.
2. Then Step 2 = relocate+expand all grid + management arrays into a proven-free
   target on a **new** `.sna` (per policy — keep
   `seasons/f12023-boundary-experimental.sna` as known-good), introduce
   `teamCount`/`carCount`, and repoint every site in the step-1 map.

