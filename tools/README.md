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
