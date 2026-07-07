# Race Grid Engine Map

This documents the current boundary finding for expanding beyond the original
small grid. No race-grid patch is applied to
`f12023-boundary-experimental.sna` yet.

## Key Text

| Text | RAM address |
| --- | ---: |
| `Press 1-6 for number of players` | `0x82F3` |
| `Press 1 to 6 for Team Number` | `0x8B69` |
| `Lap NoPos Car  Diff` | `0x6BF5` |
| `GRID:` | `0x91B3` |

## Active Race State

The engine has several active race arrays that look sized for twelve cars:

| Purpose | RAM address | Evidence |
| --- | ---: | --- |
| Car/order lookup | `0x6849` | Used by result and points routines |
| Team points | `0x6910` | Six constructor totals |
| Per-driver/team race scratch | `0x6916` | Interleaved with race behavior |
| Driver championship points | `0x6948` | 24 byte totals |
| Car state A | `0x6979` | Initialized with twelve entries at `0xC930` |
| Car state B | `0x6985` | Initialized with twelve entries at `0xC930` |
| Driver/team map | `0x6991` | Initialized with twelve entries at `0xC930` |
| Race position/result A | `0x69D9` | Used by finish/points routines |
| Race position/result B | `0x69E5` | Used by finish/points routines |
| Status/failure state | `0x69FD` | Used by race update routines |
| Lap/time state | `0x6A8D` | Used by race update routines |

Important initializer:

- `0xC930`: clears/initializes twelve entries across `0x6991`, `0x6A51`,
  `0x6985`, and `0x6979`.

Important points/result behavior:

- `0xCE52`: awards configured points positions.
- `0xCE9C`: walks result slots up to `B = 0x0B`, so twelve active entries are
  already meaningful after the scoring loop.

## Six-Car Boundaries

These are the first hard blockers before an 8-car grid should be shipped:

- `0xA49C`: clears six bytes at `0x82A1`.
- `0xA4B7`: rejects team/player input at six.
- `0xBE90-0xBEA4`: player-count prompt validates number input against the
  original six-player/team model.
- `0xC0E7`: race update branch checks `0x690E` against six.
- `0xD3D7`: timing/race adjustment loop runs six visible entries.
- `0xD3F2`: derives a visible-row index from six.

## Practical Next Patch

The safest next grid target is not a full 20-car field. It is an 8-car
experiment with these steps:

1. Patch the input bounds and screen text to allow `1-8`.
2. Patch the six-entry timing-board loop at `0xD3D7` and its row math at
   `0xD3F2`.
3. Verify the `0x82A1`/`0x8B09` display buffers have spare room for two more
   visible entries.
4. Confirm pit-stop and retire/failure state still track the new entries.
5. Only then patch selection flow and make a new experimental `.sna`.

The internal twelve-entry arrays are encouraging, but the visible race board
and selection flow still need a controlled patch rather than a constant-only
edit.
