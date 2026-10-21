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

## Tools Created

- `tools/dump-bytes.mjs` - Dump RAM bytes with context
- `tools/search-text.mjs` - Search for text strings in RAM
- `tools/search-bytes.mjs` - Search for byte patterns in RAM
- `tools/analyze-car-numbers.mjs` - Analyze car number patterns
- `tools/analyze-team-data.mjs` - Analyze team-related data

## Current Status

Phase 1.2 in progress. Partial grounding complete.

## Key Findings

### ✅ Manager Names Located at 0x2FE3
Found the manager name text region:
- 0x2FE3: "T. Wolff    F. Vasseur  C. Horner  Z. Brown   M. Krack   Szafnauer  "
- **Stride**: 10 characters per manager (6 managers = 60 bytes total)
- Format: "FIRST. LAST  " (10 chars, right-padded with spaces)
- This matches the canonical JSON managers array: ["T. Wolff", "F. Vasseur", "C. Horner", "Z. Brown", "M. Krack", "Szafnauer"]

### ✅ Initialization Loop Discovered (0xC910-C960)
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

### ⚠️ Car Numbers NOT Found Yet
- The 4 parallel car arrays at 0x6979, 0x6985, 0x6991, 0x6A51 do NOT contain car numbers
- Searched for sequential patterns and 2023 car number sequences - not found in these arrays
- Car numbers may be stored elsewhere or calculated from the car→driver mapping
- The canonical JSON has car numbers (1-44 in 2023), but these may not be in the game RAM
- **Hypothesis**: Car numbers may be derived from driver index or stored in a separate array not yet located

### ⚠️ Sponsor/Funds/Upgrades NOT Located Yet
- Sponsor region at 0x8771 contains code, not the sponsor name list
- Funds/balance region at 0x8889 contains code, not the 16-bit balance values
- Upgrade region at 0x8C6A contains code, not upgrade level bytes
- These are likely stored in data tables that the f1-season-tool.mjs edits, but the runtime RAM vars are separate
- **Need to trace the code paths that read/write these values to locate the actual RAM storage**

### ⚠️ Driver Pool/AI Draft Bounds NOT Located Yet
- Driver market region at 0x72B9 contains code, not the driver pool data
- The canonical JSON has 24 drivers, but the runtime driver pool bounds are unclear
- **Need to trace the AI drafting code to find how it selects drivers from the pool**

### Text Address Discrepancy
The documented text addresses (0x820F, 0x8DE3) contain code, not text in the current snapshot. This suggests:
- Documentation may be from a different snapshot
- Text may be dynamically generated
- Addresses may have shifted due to previous patches

### Team Active Table (0x701F)
At 0x701F (6 entries, team 0..5). Likely anchor for other team data.

## Conclusion and Recommendation

### ✅ Grounded Variables
1. **Manager names**: Located at 0x2FE3, 10-character stride per manager (6 managers = 60 bytes)
2. **Car arrays**: 4 parallel arrays at 0x6979, 0x6985, 0x6991, 0x6A51 (1 byte per car, 12 cars)
3. **Points arrays**: Constructor points at 0x6910 (6 teams), Driver points at 0x6948 (12 drivers, 2 bytes each)
4. **Team active table**: 0x701F (6 teams)

### ⚠️ Still To-Ground (Requires Code Tracing)
1. **Car numbers (per-car)**: NOT in the 4 parallel car arrays. May be derived from driver index or stored elsewhere. Need to trace pit-stop code that looks up car by number.
2. **Sponsor value (per-team)**: Sponsor names at 0x8771 are static text. Runtime sponsor index/value needs code tracing.
3. **Funds/balance (per-team, 16-bit)**: 0x8889 is code region. Need to trace balance read/write code to find the actual RAM storage.
4. **Upgrade levels (per-team)**: 0x8C6A is code region. Need to trace upgrade read/write code.
5. **Driver-pool size and AI-draft bounds**: 0x72B9 is code region. Need to trace AI drafting code to find pool bounds.

### Hypothesis
The f1-season-tool.mjs edits static data tables (text, sponsor names, driver names, etc.) at fixed offsets. The runtime RAM variables that hold live values (current balance, upgrade levels, car numbers, etc.) are separate and accessed through code paths. To locate them, we need to:
1. Use z80-inspect.mjs to disassemble the code regions near the documented addresses
2. Trace the instruction paths that read/write these values
3. Identify the actual RAM addresses used at runtime

### Alternative Approach (Recommended)
Instead of deeper RAM analysis, we could:
1. Focus on the proven grid arrays (car states, points, driver mapping)
2. Relocate those to 26-car capacity
3. Let the car numbers, sponsors, funds, and upgrades be handled by the existing f1-season-tool.mjs editing framework
4. Add new team slots to the static data tables
5. Test whether the game naturally handles the larger arrays without needing to ground every individual variable

This approach leverages the existing editor infrastructure rather than reverse-engineering every variable. The critical arrays for grid expansion (car states, points, driver mapping) are already grounded and can be relocated.
