# Z80 Boundary Plan

This branch is for pushing beyond the safe `f12023-modern.sna` package.
The protected safe build is committed on `safe-build-pit-toggle-points`.

## Known Data Surfaces

These are the mapped 2023 snapshot tables from `f12023-modern.sna`.

| Table | File offset | RAM address | Current shape |
| --- | ---: | ---: | --- |
| Lap counts | `10992` | `0x6AD5` | 16 bytes |
| Lap records | `11008` | `0x6AE5` | 16 little-endian words, tenths of seconds |
| Race record working table | `11040` | `0x6B05` | 16 little-endian words |
| Circuit driver/reference bytes | `11072` | `0x6B25` | 16 x 4 bytes |
| Track lengths | `11136` | `0x6B65` | 16 little-endian words, hundredths of miles |
| Lap record years | `11168` | `0x6B85` | 16 little-endian words |
| Drivers | `11948` | `0x6E91` | 24 x 10 chars |
| Teams | `12216` | `0x6F9D` | 8 x 8 chars |
| Managers | `12286` | `0x6FE3` | 6 x 10 chars |
| Circuit grid text | `12353` | `0x7026` | 127 chars |
| Circuit names | `12480` | `0x70A5` | 16 x 18 chars |
| Points table | `15281` | `0x7B96` | up to 15 non-zero scoring positions |
| Incident text | `15370` | `0x7BEF` | 14 x 32 chars |
| Sponsors | `18316` | `0x8771` | 13 x 12 chars |
| Track report grid text | `21534` | `0x9403` | 127 chars |
| Points award loop limit byte | `36530` | `0xCE97` | currently `0x09` for top 10 |

Known code references:

- Points table: `0xB9EA`, `0xCE56`
- Lap counts: `0x9D2A`, `0xC142`, `0xC1FD`, `0xC7ED`
- Circuit names: `0x9D11`
- Lap records: `0x9B92`, `0xBF37`, `0xC806`
- Track lengths: `0x9D47`
- Race record working table: `0xCC28`, `0xE5E5`
- Circuit driver/reference bytes: `0xCC42`, `0xE627`
- Lap record years: `0xCC74`, `0xE647`

## Work Package 1: 16-bit Championship Points

This should come before a full modern-length season. The current top-10
points patch awards the right per-race values, but the standings arrays
appear to be byte-sized. A 22 or 24 race season with 25-point wins can
overflow one-byte totals.

Tasks:

- Locate driver and constructor points arrays. The award routine around
  `0xCE56` adds the points byte to standings near the `0x6910` and `0x6916`
  RAM areas.
- Patch addition from 8-bit to 16-bit.
- Patch standings display routines to print 16-bit totals.
- Patch standings sorting/comparison to compare 16-bit totals.
- Update the editor/export format only after the engine patch is stable.

Definition of done:

- A driver can exceed 255 points without wrapping.
- Constructor totals can exceed 255 without wrapping.
- Standings display and end-of-season champion screens still work.

## Work Package 2: More Than 16 Circuits

The current calendar is built around sixteen circuit records plus fixed
four-row screen text. Expanding this is mostly data relocation and loop
count work, plus a small layout redesign inside the Spectrum UI.

Data delta for 24 races over the current 16:

- `+8` lap count bytes
- `+16` lap record bytes
- `+16` race record bytes
- `+32` circuit driver/reference bytes
- `+16` track length bytes
- `+16` lap record year bytes
- `+144` circuit name bytes
- extra grid/report text or a new paged display

Tasks:

- Find a safe RAM area for relocated expanded circuit tables.
- Patch all direct table base references to the relocated bases.
- Replace hard-coded `16` loop limits with a calendar count byte.
- Patch season progression so race 17+ is not treated as end-of-season.
- Replace the fixed 4 x 4 circuit grid with a paged list or a detail view.
- Update track report rendering so the lap-count line can handle more than
  16 entries.
- Extend the CLI/editor only after a 17th race can be reached and played.

Recommended first target:

- 20 circuit slots, not 24. Prove one extra page and race 17 first, then
  scale to 22/24.

Definition of done:

- Race 17 can be selected/reached naturally in-season.
- Track data for race 17 is used in race setup.
- End-of-season triggers after the configured final race, not after race 16.
- Existing 16-race seasons still work.

## Work Package 3: Larger Race Grid

The current race UI and selection text still show a six-car/team model:

- `Lap NoPos Car  Diff` at `0x6BF5`
- `Press 1-6 for number of players` at `0x82F3`
- `Press 1 to 6 for Team Number` at `0x8B69`
- The original editor notes a six-car timing-board bug.

This means the live grid expansion is more than a data-table edit.

Tasks:

- Identify active race car arrays: car number, driver index, team index,
  status, position, lap, gap/time, tyre/pit state, failure state.
- Identify all race loops bounded to six cars.
- Decide the first grid target. A 20-car visible board is not practical on
  one ZX Spectrum screen, so the first useful target should be 8 or 10 cars.
- Patch timing-board layout to show a paged list or top-N plus selected
  player car.
- Patch pit-stop input and validation for the larger active car count.
- Patch qualifying, betting, race result, driver points, and constructor
  points loops to use the new active car count.
- Patch team selection and computer-team setup copy once behavior works.
- Only then extend car/team graphics lookup if more distinct liveries are
  needed.

Recommended first target:

- 8 active cars. It is the smallest step that proves loop expansion without
  forcing a complete 20-car race-screen redesign.

Definition of done:

- More than six cars can start a race.
- Timing board remains readable.
- Pit stops work for the added cars.
- Results and points include the added cars.
- No menu, sponsor, or driver-selection flow regresses.

## Practical Order

1. Build a small Z80 annotation/disassembly workflow around the mapped RAM
   tables and code references above.
2. Patch 16-bit championship totals.
3. Expand calendar to 17, then 20+ circuits with a paged layout.
4. Expand active race grid to 8 cars.
5. Only after those are stable, attempt a full modern 20-car grid.

The key principle is to keep every experiment producing a playable `.sna`.
If a patch cannot boot and reach the original game flow, it should not be
merged back toward the safe build.

## Experimental Calendar Patch Status

This branch now has a concrete 22-round calendar patcher:

```sh
node tools/f1-boundary-patch.mjs build seasons/f12023-modern.sna tools/seasons/f12023-boundary-22.json seasons/f12023-boundary-experimental.sna
```

The patcher relocates the circuit data tables from the tightly packed
`0x6AD5-0x71C4` area into `0x613C-0x655F`, then patches the direct Z80 table
references and final-round checks. It also redirects the two championship
points additions through a saturating-add trampoline so byte totals cap at
`255` instead of wrapping. It deliberately leaves the default safe emulator
route pointed at `f12023-modern.sna`.

This is the first boundary build, not the promotion target. It proves the
patch path for more than sixteen circuit slots; the remaining promotion work
is runtime testing of race 17+, a cleaner paged calendar display if the
current 22-row list is too dense, and then the separate race-grid expansion.

## Race Grid Patch Status

The race-grid side is mapped in `docs/race-grid-engine-map.md`. The engine has
twelve-entry active arrays, but the player/team prompts, visible timing board,
and several race-flow loops still have six-car assumptions. No grid patch is
applied to the experimental snapshot yet because a constant-only edit would
likely make an untestable race-screen regression.
