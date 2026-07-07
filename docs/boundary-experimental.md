# Boundary Experimental Build

This branch keeps `safe-build-pit-toggle-points` untouched. The experimental
snapshot is generated separately from `seasons/f12023-modern.sna`.

## Build

```sh
node tools/f1-boundary-patch.mjs build seasons/f12023-modern.sna tools/seasons/f12023-boundary-20.json seasons/f12023-boundary-experimental.sna
```

Verify the Z80 references after building:

```sh
node tools/f1-boundary-patch.mjs verify seasons/f12023-boundary-experimental.sna 20
```

Load it locally without changing the default safe emulator page:

```text
http://127.0.0.1:8000/emulator.html#/seasons/f12023-boundary-experimental.sna
```

## What Is Patched

- Relocates the core circuit tables into the unused RAM window
  `0x613C-0x64E7`.
- Extends the calendar data from 16 to 20 slots.
- Patches direct Z80 table pointers for lap counts, lap records, race records,
  circuit reference columns, track lengths, lap-record years, full circuit
  names, and short circuit names.
- Patches the three known final-round checks from `16` to `20`.
- Patches the lap-record reset loop and short-name redraw loop from `16` to
  `20`.

The first sixteen rounds are copied from `f12023-modern.sna`. The appended
rounds are Baku, Barcelona, Spielberg, and Hungaroring.

## Current Boundary

This is a playable experimental `.sna` patch path, not a finished full modern
season engine. The next Z80 work is still needed before promoting it:

- Prove race 17 from an in-season save, not just static pointer verification.
- Replace the old 4 x 4 calendar screen with a paged Spectrum layout.
- Patch championship totals from byte-sized storage to a safe wider display,
  or keep season points low enough to avoid byte overflow.
- Expand the live race grid separately; the timing board and race state arrays
  are not patched in this build.
