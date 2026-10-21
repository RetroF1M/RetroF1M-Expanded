# Boundary Experimental Build

This branch keeps `safe-build-pit-toggle-points` untouched. The experimental
snapshot is generated separately from `seasons/f12023-modern.sna`.

**Status**: Previously proven through race 22 via natural play (rounds 17-22 tested).
**Last Verified**: Previous session (see `docs/progress-tracking.md` for details).
**Next Action**: Fresh baseline test scheduled for Phase 0.5 to confirm still working.

## Build

```sh
node tools/f1-boundary-patch.mjs build seasons/f12023-modern.sna tools/seasons/f12023-boundary-22.json seasons/f12023-boundary-experimental.sna
```

Verify the Z80 references after building:

```sh
node tools/f1-boundary-patch.mjs verify seasons/f12023-boundary-experimental.sna 22
```

Load it locally without changing the default safe emulator page:

```text
http://127.0.0.1:8000/emulator.html#/seasons/f12023-boundary-experimental.sna
```

## What Is Patched

- Relocates the core circuit tables into the unused RAM window
  `0x613C-0x655F`.
- Extends the calendar data from 16 to 22 slots.
- Patches direct Z80 table pointers for lap counts, lap records, race records,
  circuit reference columns, track lengths, lap-record years, full circuit
  names, and short circuit names.
- Patches the three known final-round checks from `16` to `22`.
- Patches the lap-record reset loop and short-name redraw loop from `16` to
  `22`, and patches the redraw row base so the list uses rows `0-21`.
- Patches championship point awarding through a small saturating-add
  trampoline at `0x6550` so byte totals cap at `255` instead of wrapping.

The first sixteen rounds are copied from `f12023-modern.sna`. The appended
rounds are Baku, Barcelona, Spielberg, Hungaroring, Singapore, and Austin.

## Current Boundary

This is a playable experimental `.sna` patch path, not a finished full modern
season engine. The next Z80 work is still needed before promoting it:

- Prove race 17 from an in-season save, not just static pointer verification.
- Replace the old 4 x 4 calendar screen with a paged Spectrum layout.
- Patch championship totals from byte-sized capped storage to a true wider
  display if exact 300+ point totals are required.
- Expand the live race grid separately; the timing board and race state arrays
  are not patched in this build.

## Controlled Round-17 Proof

`tools/f1-boundary-runtime-probe.mjs` provides a repeatable controlled snapshot
state for the critical transition. It sets the game current-round byte
(`0x6BB2`) to 16 in a separately named probe snapshot, then verifies the
patched `0xC7BA` setup path: the `0x16` count check increments it to 17 and the
relocated tables yield Baku, 51 laps, a 103.0-second lap record, and a 3.73-mile
track length. This proves the race-17 setup inputs without modifying the normal
experimental snapshot. Full completion/end-of-season flow remains a separate
manual QAOP test.
