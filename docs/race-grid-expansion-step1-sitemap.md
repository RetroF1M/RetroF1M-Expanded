# Priority 2 · Step 1 — Grid-Expansion Site Map & Relocation Plan

**Status:** PLANNING ONLY. Read-only analysis. No `.sna` created or modified.
**Baseline snapshot:** `seasons/f12023-boundary-experimental.sna` (22-round calendar, QAOP-proven end to end).
**Goal of Step 1:** map every grid-related structure and hardcoded count, decide a relocation layout for
**13 teams / 26 cars** (historical-max ceiling) with the **active count as a per-season runtime variable**,
and record what is proven vs. what still must be classified before any patch.

> Every address, instruction, and reference count below was re-verified this session with
> `tools/z80-inspect.mjs disasm` and `tools/z80-inspect.mjs refs` against the live snapshot. SNA byte `n`
> maps to RAM `0x4000 + (n - 27)`; the inspect tool already accounts for the 27-byte header.

---

## 1. Confirmed architecture (disassembly-proven, not assumed)

- **6 teams × 2 cars = 12 cars.**
  - Init `0xC95E–0xC97C`: loop `LD B,0x01`; per iteration `INC B; INC B` (**B += 2**), bounded by
    `LD A,0x0C; CP B; JP NC` → walks **B = 1,3,5,7,9,11 = 6 teams**. It indexes the team table at
    `0x701F` by `E = (B-1) >> 1` → team 0..5. This is the "2 cars per team" relationship in hardware.
- **Car-state init `0xC933–0xC954`:** `LD B,0x0C` (12) fills **four parallel 12-entry arrays** in one loop:
  - `0x6991` init `0x19`, `0x6A51` (IX), `0x6985` (IY), `0x6979` (DE) init `0xFF`.
- **Constructor points** at `0x6910[team]`, **driver points** at `0x6948[driver-1]`, both added via the
  saturating-add trampoline at `0x6550`.
- **Points/Results loop `0xCE52–0xCEC4`:**
  - Loop A (award points): `B=1..` bound `LD A,0x09; CP B; JP NC` → **B = 1..9** (top-9 finishers score).
    Per iteration: `0x7B96[B-1]` = points-for-position; `0x6849[B]` = finish-order→car;
    `0x69D9[car]` checked `== 0xFF` (skip retired); `0x6991[car]` = car→driver;
    `0x6948[driver-1] += pts`; `0x6916[driver-1] -= pts` (scratch); then **`0xCE8D SRL E`** → `team = driver>>1`;
    `0x6910[team] += pts`.
  - Loop B (results/positions): resumes `B` at 10, bound `LD A,0x0B; CP B; JP NC` → **B = 10,11** (finish top-12).
  - Third block `0xCECC–0xCF00`: a per-entry loop over the **24-byte `0x692F`** array, bound `LD A,0x17`
    (23) reading/writing `0x6916`. **0x692F is 24 bytes — NOT grid-sized (≠ 12, ≠ 26). Must be classified
    in Step 2** before it is touched; it is very likely a pit/retirement/scratch accumulator, not a per-car
    grid array. Do not assume it scales with the car count.

---

## 2. Array inventory (extent + live reference count)

Reference counts are from `z80-inspect.mjs refs` (a superset that includes a few data false-positives,
but every count below was sanity-checked). "Extent now" is the proven current size; "index unit" is
what the code uses to index it.

| Base  | Purpose (from disasm)                                   | Extent now | Index unit      | Refs |
|-------|---------------------------------------------------------|-----------:|-----------------|-----:|
| 0x6910 | Constructor (team) championship points                  | 6          | team 0..5       | 4    |
| 0x6916 | Per-driver race scratch (points subtraction/position)   | 12 (≈)     | driver 0..11    | 16   |
| 0x692F | 24-byte array (pit/retire/scratch — **TBC**)            | 24         | entry 0..23     | 10   |
| 0x6948 | Driver championship points (saturating-add)             | 12 (≈)     | driver 0..11    | 5    |
| 0x6979 | Car state A                                             | 12         | car 0..11       | 12   |
| 0x6985 | Car state B                                             | 12         | car 0..11       | 12   |
| 0x6991 | Car → driver/team map                                   | 12         | car 0..11       | 27   |
| 0x699D | Car-indexed array (value ×3 used as offset, @0xC357)    | **TBC**    | car (×3 stride) | 6    |
| 0x69D9 | Race result/status (0xFF = retired marker)              | **TBC**    | car 0..11       | 5    |
| 0x6A51 | Car state (4th parallel array)                          | 12         | car 0..11       | 10   |
| 0x701F | Team active/data table (indexed by team)                | 6          | team 0..5       | 20   |
| 0x6849 | Finish-order → car map                                  | **TBC**    | finish pos 1..12| 21   |
| 0x7B96 | Points-per-finishing-position table (9 entries used)    | ≥9         | finish pos 1..9 | 2    |
| 0x6BB2 | **Round byte** (current round counter)                  | 1          | —               | 25   |

**Total live reference sites across grid arrays: ~150.** This confirms the change is *relocation-grade*,
not a constant tweak.

> **Correction carried forward (honest):** an earlier analysis in this effort claimed the *entire*
> `0x6AD5–0x71C4` span (~1,776 B) was freed by the boundary patch and safe as a relocation target. That was
> **overstated**. The boundary patcher repointed only **specific table footprints**; the round byte
> `0x6BB2` (25 refs) and circuit-name ASCII still live inside that span. Only the four repointed footprints
> below are genuinely dead (each interior verified free by disassembly — the raw "ref" hits inside them are
> provable data-byte false positives, e.g. `0x7150` = `LD D,B`+`LD (HL),C`, `0x6B00` = `NOP`+`LD L,E`).

---

## 3. Relocation-target analysis — the honest open problem (Step-2 prerequisite)

This is the crux of the relocation and I want it stated plainly rather than glossed.

**Space required for a 13-team / 26-car layout (arrays kept as a coherent cluster):**

| Array (grown) | now | → 26/13 |
|---|---:|---:|
| `0x6979` car state A | 12 | 26 |
| `0x6985` car state B | 12 | 26 |
| `0x6991` car→driver map | 12 | 26 |
| `0x6A51` car state (IX) | 12 | 26 |
| `0x699D` car-indexed (×3 stride) | ~12 | 26 |
| `0x6916` driver scratch | 12 | 26 |
| `0x6948` driver points | 12 | 26 |
| `0x69D9` race status | 12 | 26 |
| `0x6910` constructor points | 6 | 13 |
| `0x701F` team table | 6 | 13 |
| `0x6849` finish→car map | 12 | 26 |
| active-count variable | — | 1–2 |

≈ **+180 bytes net growth**. Because the arrays are **interspersed with live data** (§6) they cannot be
grown in place; the coherent cluster (grown arrays + preserved interspersed arrays + the count bytes) is on
the order of **~450–520 bytes** that must be moved as a block to a **contiguous, provably free** region, then
all ~150 address references repointed.

**What the boundary patch actually freed (authoritative, verified):**

| Old footprint | → repointed to | Interior dead? |
|---|---|---|
| `0x6AD5–0x6BA5` (lap/record/ref/track/year, ~208 B) | `0x613C…` | ✅ yes |
| `0x7025–0x70A5` (short-name grid, 128 B) | `0x63E6` | ✅ yes |
| `0x70A5–0x71C5` (full names, 288 B) | `0x625A` | ✅ yes |
| `0x9402–0x9482` (report grid, 128 B) | `0x6496` | ✅ yes |

**Why this is NOT a clean target, stated honestly:**
- The four freed footprints are **fragmented and interspersed with live data** — the round byte `0x6BB2`
  (25 refs) sits between the first two footprints, circuit-name ASCII fills the gaps, and the **live team
  table `0x701F` (20 refs)** sits nearby. You cannot drop a 450-byte block there without colliding.
- Summed (~752 B) they are *close* to the size needed, but they are **not contiguous** and are **dovetailed
  with live data**, so they cannot host the cluster as-is.
- The boundary patch already used free RAM around `0x613C–0x655F` for the 22-round calendar; whether more
  contiguous free RAM of the required size exists nearby, or elsewhere in `0x5B00–0xC000`, is **not yet
  established**.

**Honest status:** the exact relocation target is **unproven**. Locating (and proving free) a contiguous
~450–520-byte region, plus repointing ~150 references, is the core of Step 2 and the single biggest risk in
Priority 2. Step 1 deliberately stops here — it documents the requirement without guessing a target.

---

## 4. Hardcoded count sites — classification status

Raw census: **~88** sites use `LD B/C/A,0x0C` (12) and **~67** use `LD B/A,0x06` / `CP 0x06` (6). **Many are
coincidental** (common constants), so **each candidate must be disassembled in context — no blind
find/replace.**

**Grid sites confirmed by disassembly (safe to change, and to what):**
- `0xC933` init `LD B,0x0C` → car-array init count (12→26).
- `0xC95E` team walk `LD A,0x0C; CP B` with `INC B; INC B` → 6-team step (12→26; step stays +2).
- `0xCE52` Loop A bound `LD A,0x09` → top-9 scorers (may stay 9, or grow with field — design decision).
- `0xCE52` Loop B bound `LD A,0x0B` → finish top-12 (12→26).
- `0xCECC` bound `LD A,0x17` → 24-byte `0x692F` loop (**not grid-sized — leave until §6 classifies it**).

**Must-classify before touching:** the remaining `0x0C`/`0x06`/`CP 0x06` occurrences. Each needs a
disasm-in-context pass to label grid-count vs coincidence. This is a bounded, mechanical but essential task
inside Step 2/3; it is **not** done yet and Step 1 does not pretend otherwise.


---

## 5. Proposed design (approved direction)

1. **Relocate + expand** the grid arrays to **13 teams / 26 cars** (historical-max ceiling) as the
   structural size.
2. **Introduce an active-count RAM variable** (`teamCount`, `carCount`), initialised per season from the
   `.sna`. 2023 writes 10; a POC writes 13. This is what makes variable field sizes (1950–2026) possible
   **without another relocation**.
3. **Replace the grid-related hardcoded bounds** (classified in §4) with reads from that variable, in init,
   timing board, pit/retire, results and points loops.
4. **Display / menus / in-race rendering** read the count. For new teams' sprites, **duplicate existing team
   sprite data into the `.sna`** (all data is in the snapshot; the engine draws whatever the RAM holds), so
   10–13 teams render and are scored without waiting for bespoke art.

**Safety inversion (held firm):** grow the **data structures first**, open the **human input bounds**
(`CP 0x36→0x3A`, prompt text to "1–10"/"1–13") **last** — otherwise a menu could select a team that writes
past the array.

---

## 6. Interspersed live data that must be preserved on relocation

These sit between the grid arrays and are **live**; they must move (or be avoided) intact:
- `0x692F` — 24-byte array (cleared `LD B,0x18`=24 at `0xC926`; looped `LD A,0x17` at `0xCECC`). Semantics
  still **TBC** (likely pit/retire/scratch). **Do not scale to car count** until classified.
- `0x691C` / `0x6922` / `0x6928` — doc lists these as per-team attribute arrays, but `refs` returned **0**
  independent refs → likely **computed offsets from a base**, not standalone arrays. **Do not relocate based
  on the assumption they are independent** until their access pattern is disassembled.
- `0x6BB2` round byte, circuit-name ASCII, `0x701F` live team table — all resident near the old-calendar
  span; none are free.

---

## 7. Step plan for Step 2+ (each committed separately)

1. **[read-only — THIS DOC]** Site map + relocation requirement. ✅ (this file)
2. **[Z80, big]** **Find + prove free a contiguous ~450–520 B relocation target**; then relocate+expand
   arrays to 26/13, repoint all ~150 refs; re-verify the 22-round QAOP baseline still boots & completes.
3. **[Z80]** Introduce active-count variable; replace classified grid loop-bounds with it (init, timing
   board, pit/retire, results, points). Verify boot + natural play.
4. **[Z80]** Timing board + display buffers / row math (`0xD3D7/0xD3F2`) to render up to 26 cars.
5. **[Z80, last]** Open human input bounds + prompt text to the new max — only now that structures back it.
6. **[Data]** 2023 writes count=10; POC writes 13; note 2026 (11 teams) is within the 13-team ceiling.

**Build-target policy (per your instruction):** Steps 2–6 build onto a **new** `.sna`
(e.g. `seasons/f12023-grid-expand.sna`), leaving `seasons/f12023-boundary-experimental.sna` untouched as
the known-good 22-round baseline. (Step 1 creates no `.sna`.)

---

## 8. Proven vs. unproven (be explicit)

**Proven this session (disassembly/refs against the live snapshot):**
- 6 teams × 2 cars; the `INC B;INC B` / `SRL E` team=car≫1 relations in hardware.
- The four car arrays, their 12-entry extents, and ~150 live reference sites.
- The four calendar footprints the boundary patch freed are genuinely dead (interiors verified).
- `node --check` on tools is clean; worktree preserved; correct branch.

**Unproven / open (must be resolved in Step 2+, not assumed here):**
- A safe contiguous relocation target of sufficient size — **not yet located or verified**.
- The classification of every remaining `0x0C`/`0x06`/`CP 0x06` site (only the §4 subset is done).
- `0x692F` and `0x699D` semantics; whether `0x691C/22/28` are independent arrays.
- Runtime behaviour of a 26-car grid (timing board, scoring, in-race sprites) — **needs a new `.sna` + QAOP
  run**; nothing about a 26-car grid is proven until then.

