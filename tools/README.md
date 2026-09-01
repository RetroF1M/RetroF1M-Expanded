# RetroF1M Tools

## `f1-season-tool.mjs`

Node CLI for editing the fixed-width season tables inside Formula One
48K `.sna` snapshots.

```sh
node tools/f1-season-tool.mjs export <input.sna> <output.json>
node tools/f1-season-tool.mjs build <baseline.sna> <season.json> <output.sna>
node tools/f1-season-tool.mjs patch-2023 <input.sna> <output.sna>
```

The JSON export includes offsets and RAM addresses for each mapped table so
future editing can be checked against the snapshot layout.

Mapped fields:

- drivers: 24 slots, 10 characters
- special driver labels: 2 slots, 10 characters
- teams: 8 slots, 8 characters
- managers: 6 slots, 10 characters
- circuits: 16 slots, 18 characters
- lap counts
- track lengths in hundredths of miles
- lap records in tenths of seconds
- lap-record years
- circuit driver/reference bytes
- sponsors: 13 slots, 12 characters
- incident text: 14 slots, 32 characters
- points table: up to 15 scoring positions

When the points table is written, the tool also patches the Z80 award loop
to process the same number of non-zero scoring positions.

## Known Safe Boundary

These tools preserve the original snapshot structure. They do not relocate
tables or rewrite the race UI. More than sixteen calendar rounds and a
larger live race grid require deeper engine work, not just data-table
editing.

## `z80-inspect.mjs`

Small local inspector for targeted Z80 work:

```sh
node tools/z80-inspect.mjs disasm <snapshot.sna> <start> <end>
node tools/z80-inspect.mjs refs <snapshot.sna> name=addr [name=addr...]
```

Addresses are RAM addresses, for example `0xC7D0`.

## `f1-boundary-patch.mjs`

Experimental patcher for this branch. It relocates the circuit tables into a
free RAM window, adds a byte-saturating points guard, and builds a separate
22-round calendar snapshot:

```sh
node tools/f1-boundary-patch.mjs build seasons/f12023-modern.sna tools/seasons/f12023-boundary-22.json seasons/f12023-boundary-experimental.sna
node tools/f1-boundary-patch.mjs verify seasons/f12023-boundary-experimental.sna 22
```

This does not modify the safe build or the default emulator route.

## `f1-boundary-runtime-probe.mjs`

Creates and verifies a separate controlled-state snapshot for the transition
from round 16 to relocated round 17. It leaves both the safe and normal
experimental snapshots unchanged, sets the current-round byte to 16, and
checks the exact Baku data the patched race-setup routine will read after it
increments to 17:

```sh
node tools/f1-boundary-runtime-probe.mjs build seasons/f12023-boundary-experimental.sna seasons/f12023-round17-probe-experimental.sna
node tools/f1-boundary-runtime-probe.mjs verify seasons/f12023-round17-probe-experimental.sna
```

## `f1-canonical-season.mjs`

Canonical season data is independent of `.sna` file offsets and declares the
engine profile it needs. The compiler validates the profile, fixed-width Z80
text, race count, references, and points before producing a playable snapshot.

```sh
node tools/f1-canonical-season.mjs import-legacy tools/seasons/f12023-modern.json tools/seasons/f12023-boundary-22.json tools/seasons/f12023-canonical.json
node tools/f1-canonical-season.mjs validate tools/seasons/f12023-canonical.json
node tools/f1-canonical-season.mjs compile seasons/f12023-modern.sna tools/seasons/f12023-canonical.json seasons/f12023-canonical-experimental.sna
```

Profiles currently supported: `safe-16` (up to 16 rounds) and
`experimental-calendar-22` (17-22 rounds with byte-saturating totals).
