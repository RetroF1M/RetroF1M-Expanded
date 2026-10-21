# Grid Array Grounding Progress

## Date
2026-10-21

## Objective
Locate the exact RAM bytes for the 6 to-ground variables before Step-2 relocation:
1. Car numbers (per-car)
2. Sponsor value (per-team)
3. Funds/balance (per-team, 16-bit)
4. Upgrade levels (per-team)
5. Driver-pool size and AI-draft bounds
6. Manager-name slot stride

## Approach

The documentation indicates text/string addresses (e.g., "0x820F 'Please enter car number'"), but memory inspection shows these areas contain code, not text. This suggests the car numbers are stored in the car data structures themselves.

### Strategy: Examine existing car data arrays

The grid arrays are already mapped:
- `0x6979` - Car state A (12 entries, car 0..11)
- `0x6985` - Car state B (12 entries, car 0..11)
- `0x6991` - Car → driver/team map (12 entries, car 0..11)
- `0x699D` - Car-indexed array (×3 stride)
- `0x69D9` - Race result/status (12 entries, car 0..11)
- `0x6A51` - Car state (4th parallel array, 12 entries, car 0..11)

Each of these arrays likely contains multiple bytes per car. The car number is probably stored in one of these parallel arrays or in a separate array indexed by car.

### Next Investigation Steps

1. **Dump and analyze the car state arrays** to understand their structure:
   - Dump 0x6979 with stride analysis (what bytes per car?)
   - Dump 0x6985 with stride analysis
   - Dump 0x6991 with stride analysis
   - Dump 0x6A51 with stride analysis

2. **Search for car number patterns**:
   - In the 2023 season, car numbers are 1-44 across 10 teams
   - Look for byte patterns matching these values in car-indexed regions

3. **Examine the Formula One Editor**:
   - The editor allows editing car numbers
   - The editor documentation says "The two large boxes on the left are the car numbers"
   - The editor may reveal where in the snapshot it stores these values

4. **Sponsor/funds/upgrades**:
   - These are per-team (6 teams currently)
   - Look near 0x701F (team active table) for team data
   - Look near 0x7000 (manager names) for other team data

5. **Driver pool/AI draft**:
   - Look near 0x72B9 (driver market text)
   - Look near 0xD4B8 (novice pool text)
   - Search for driver name arrays (24 drivers known at 0x6E91)

## Tools Created

- `tools/dump-bytes.mjs` - Dump RAM bytes with context
- `tools/search-text.mjs` - Search for text strings in RAM

## Current Status

Phase 1.2 in progress. Need to systematically examine the car data arrays to locate car numbers and other per-car/per-team variables.

## Findings

### Initialization Loop Discovered (0xC910-C960)
Key initialization routine that sets up all car arrays:
- **0xC912**: `LD B,0x06` - Constructor points loop (6 teams, 0x6910)
- **0xC91C**: `LD B,0x18` - Driver points loop (24 bytes at 0x6948, for 12 drivers)
- **0xC926**: `LD B,0x18` - Special array loop (24 bytes at 0x692F, **24-byte special array**
- **0xC936**: `LD B,0x0C` - Car arrays loop (12 cars)
  - `0x6991` - Car → driver/team map (12 entries)
  - `0x6A51` - Car state array (12 entries)
  - `0x6985` - Car state array (12 entries)
  - `0x6979` - Car state array (12 entries)

This confirms the structure:
- **12 cars** (6 teams × 2 cars)
- **6 teams** (constructor points)
- **24 drivers** (driver points, 2 bytes per driver)

### Car Array Stride Analysis
The init loop uses `INC IX`, `INC IY`, `INC DE` for the 4 parallel car arrays. This suggests **1 byte per car** for each array:
- `0x6979` - Car state A (12 bytes, 1 per car)
- `0x6985` - Car state B (12 bytes, 1 per car)
- `0x6991` - Car → driver/team map (12 bytes, 1 per car)
- `0x6A51` - Car state (12 bytes, 1 per car)

### 24-byte Special Array (0x692F)
Documented in the original research as "24-byte special array whose semantics are still unresolved". The init loop zeroes this entire array (24 bytes). This is **not** a per-car array (12 cars × 2 bytes = 24 bytes would match, but semantics unknown).

### Finish-Order → Car Map (0x6849)
Located in the reference search. This array maps finish positions to car indices.

### Text Address Discrepancy
The documented text addresses (0x820F, 0x8DE3) contain code, not text in the current snapshot. This suggests:
- Documentation may be from a different snapshot
- Text may be dynamically generated
- Addresses may have shifted due to previous patches

### Manager Name Region (0x7000)
Dumped region shows code, not straight text. The manager names may be stored elsewhere or dynamically generated. Need to search for actual manager name strings.

### Team Active Table (0x701F)
At 0x701F (6 entries, team 0..5). Likely anchor for other team data.

## Next Steps

1. Dump car state arrays with stride analysis
2. Dump manager name region to determine stride
3. Search for car number patterns in car-indexed regions
4. Locate sponsor/funds arrays near team data
