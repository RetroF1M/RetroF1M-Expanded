# 20-Car Grid Relocation Analysis

## Date
2026-10-21

## Context
Attempting to expand grid from 12 cars to 20 cars for 2023 season.

## Memory Constraints
- **No contiguous 450-byte block** available for 26-car expansion in 48K mode
- **Maximum free block**: 150 bytes at 0xAA70-0xAB05
- **128K upper memory**: Requires snapshot format conversion and bank-switching code (too complex for first pass)

## Approach
Segmented relocation to 0xAA70 region:
- Core car arrays (4 × 20 bytes = 80 bytes) → 0xAA70-0xAACF
- Points arrays (50 bytes) → segmented
- Team arrays (10 bytes) → expand in place
- Race arrays (40 bytes) → segmented

## Current Array Locations
- **0x6979**: Car state A (12 bytes)
- **0x6985**: Car state B (12 bytes)
- **0x6991**: Car→driver map (12 bytes)
- **0x6A51**: Car state 4 (12 bytes)

## Target Array Locations
- **0xAA70**: Car state A (20 bytes)
- **0xAA84**: Car state B (20 bytes)
- **0xAA98**: Car→driver map (20 bytes)
- **0xAAB0**: Car state 4 (20 bytes)

## Reference Site Analysis

### Total References Found: 47
Using `node tools/z80-inspect.mjs refs seasons/f12023-20car-experimental.sna array6979=0x6979 array6985=0x6985 array6991=0x6991 array6A51=0x6A51`

### Reference Categories
Not all references are direct load instructions. Need to categorize each:

1. **Direct Load Instructions** (require patching):
   - `LD HL,addr` (0x21 low high)
   - `LD IX,addr` (0xDD 0x21 low high)
   - `LD IY,addr` (0xFD 0x21 low high)
   - `LD DE,addr` (0x11 low high)

2. **Data Tables** (may not need patching if they're just holding addresses):
   - Tables that contain array addresses as data bytes
   - These might be used for lookup tables or metadata

3. **Indirect References** (complex):
   - Calculated addresses
   - Index registers pointing to arrays
   - May require code logic changes, not just address patches

4. **Other Instruction Types** (unknown):
   - Need disassembly to identify
   - May be part of larger instruction sequences

### Reference Site List
| Address | Array | Byte Pattern (hex) | Status |
|---------|-------|-------------------|--------|
| 0xA4F5 | 0x6991 | 18 6 7 cd | Needs analysis |
| 0xA55D | 0x6991 | 9b c1 21 cd | Needs analysis |
| 0xABF7 | 0x6991 | 49 68 23 7e | Needs analysis |
| 0xAD5F | 0x6991 | 49 68 23 7e | Needs analysis |
| 0xADA6 | 0x6991 | 14 6c cb 3f | Needs analysis |
| 0xB007 | 0x6A51 | ae c9 2a 3 | Needs analysis |
| 0xB5C0 | 0x6991 | 14 6c cb 3f | Needs analysis |
| 0xBFB1 | 0x6979 | e5 fd 6e 0 | Needs analysis |
| 0xBFEA | 0x6985 | e5 fd 6e 0 | Needs analysis |
| 0xC023 | 0x6991 | 6e 0 fd 66 | Needs analysis |
| 0xC1BE | 0x6979 | 6b fd 9 fd | Needs analysis |
| 0xC1D2 | 0x6985 | 21 16 69 9 | **LD HL,0x6916** (wrong array) |
| 0xC1E6 | 0x6991 | d5 3a f 69 | Needs analysis |
| 0xC24A | 0x6979 | 46 0 80 30 | Needs analysis |
| 0xC260 | 0x6985 | 46 0 80 30 | Needs analysis |
| 0xC2CA | 0x6979 | c1 cd fd c2 | Needs analysis |
| 0xC2D1 | 0x6985 | c2 79 fe 0 | Needs analysis |
| 0xC2D8 | 0x6991 | 5 c3 13 10 | Needs analysis |
| 0xC78E | 0x6979 | d cd b5 c7 | Needs analysis |
| 0xC794 | 0x6985 | 69 cd b5 c7 | Needs analysis |
| 0xC79A | 0x6A51 | 9 7e 13 12 | Needs analysis |
| 0xC7A0 | 0x6991 | d5 f5 c5 dd | Needs analysis |
| 0xC934 | 0x6991 | 23 fd 23 13 | Needs analysis |
| 0xC93A | 0x6A51 | ef fd e1 fb | Needs analysis |
| 0xC93E | 0x6985 | 3e 1 32 be | Needs analysis |
| 0xC941 | 0x6979 | be 76 6 1 | Needs analysis |
| 0xC98B | 0x6979 | c5 e c b9 | Needs analysis |
| 0xC996 | 0x6985 | 20 1 81 21 | Needs analysis |
| 0xC99D | 0x6A51 | 0 5f 19 7e | Needs analysis |
| 0xC9C9 | 0x6991 | 91 18 fa 86 | Needs analysis |
| 0xCAEE | 0x6991 | 1d 19 77 c1 | Needs analysis |
| 0xCB04 | 0x6991 | 21 99 72 77 | Needs analysis |
| 0xCE70 | 0x6991 | 77 d1 cb 3b | Needs analysis |
| 0xCEA6 | 0x6991 | 3e b b8 d2 | Needs analysis |
| 0xCF35 | 0x6979 | fe 33 da 9a | Needs analysis |
| 0xCF3B | 0x6985 | 6 18 e ff | Needs analysis |
| 0xCF41 | 0x6991 | 69 11 1 0 | Needs analysis |
| 0xCF7F | 0x6991 | 3e b b8 d2 | Needs analysis |
| 0xCFE2 | 0x6A51 | fa d1 81 38 | Needs analysis |
| 0xD037 | 0x6979 | e1 d1 c1 f1 | Needs analysis |
| 0xD046 | 0x6A51 | fd e5 3e 68 | Needs analysis |
| 0xD04B | 0x6985 | 76 99 cd 5b | Needs analysis |
| 0xD0C9 | 0x6991 | c1 f1 c9 f5 | Needs analysis |
| 0xD44F | 0x6991 | 5e 23 56 2b | Needs analysis |
| 0xD481 | 0x6A51 | 4f 21 59 88 | Needs analysis |
| 0xD82D | 0x6991 | 7e fe 2 d2 | Needs analysis |
| 0xDA92 | 0x6991 | c5 d5 e5 dd | Needs analysis |
| 0xDEF9 | 0x6991 | e1 23 7e 47 | Needs analysis |
| 0xDF3C | 0x6991 | e1 11 38 96 | Needs analysis |
| 0xDF95 | 0x6979 | 38 e cd ff | Needs analysis |
| 0xDFE0 | 0x6985 | 38 e cd ff | Needs analysis |
| 0xE02B | 0x6A51 | 38 e cd ff | Needs analysis |
| 0xE11F | 0x6991 | dd cd 1 dd | Needs analysis |
| 0xE13F | 0x6979 | dd cd 1 dd | Needs analysis |
| 0xE151 | 0x6985 | f1 99 fe 30 | Needs analysis |
| 0xE15F | 0x6A51 | c2 6b e1 cd | Needs analysis |
| 0xE242 | 0x6991 | 41 96 21 79 | Needs analysis |
| 0xE260 | 0x6979 | 19 7e fe 32 | Needs analysis |
| 0xE279 | 0x6985 | 19 7e fe 32 | Needs analysis |
| 0xE292 | 0x6A51 | 90 87 21 c4 | Needs analysis |
| 0xE61D | 0x6991 | 59 1d 19 7e | Needs analysis |

## Initialization Loop (0xC910-C960)
The initialization loop that sets up the arrays needs updates:

### Current Loop Counters:
- **0xC912**: `LD B,0x06` - Constructor points (6 teams)
- **0xC91C**: `LD B,0x18` - Driver points (24 bytes for 12 drivers)
- **0xC926**: `LD B,0x18` - Special array (24 bytes)
- **0xC936**: `LD B,0x0C` - Car arrays (12 cars)

### Required Loop Counters (20 cars):
- **0xC912**: `LD B,0x0A` - Constructor points (10 teams)
- **0xC91C**: `LD B,0x28` - Driver points (40 bytes for 20 drivers)
- **0xC926**: `LD B,0x28` - Special array (40 bytes, unknown semantics)
- **0xC936**: `LD B,0x14` - Car arrays (20 cars)

### Array Load Instructions in Init Loop:
- **0xC933**: `LD HL,0x6991` → `LD HL,0xAA98` (car→driver map)
- **0xC938**: `LD IX,0x6A51` → `LD IX,0xAAB0` (car state 4)
- **0xC93C**: `LD IY,0x6985` → `LD IY,0xAA84` (car state B)
- **0xC940**: `LD DE,0x6979` → `LD DE,0xAA70` (car state A)

## Known Issues

### z80-inspect.mjs Ref Output Inaccuracy
The `refs` command shows all locations where the address bytes appear in the code, but:
- Some are part of larger instructions (not the instruction we care about)
- Some are data bytes, not instructions
- Some are part of instruction operands that aren't the address we want to patch
- Example: 0xC1D2 shows 0x6916 but the actual instruction is `LD HL,0x6916` (not one of our 4 arrays)

### Need Systematic Disassembly
Each reference site needs:
1. Disassemble the surrounding code (±10 bytes)
2. Identify the instruction that uses the array address
3. Determine if it's a direct load that needs patching
4. Determine the correct patch for that instruction type
5. Document the patch before applying

## Next Steps

### Phase 1: Categorize All References
For each of the 47 reference sites:
1. Disassemble the code around the address
2. Identify the instruction that references the array
3. Categorize as: direct load, data, indirect, or other
4. Document the instruction type and patch strategy

### Phase 2: Create Patch Plan
Based on categorization:
1. List all direct load instructions that need patching
2. Determine correct patch for each instruction type
3. Identify any references that don't need patching
4. Identify any references that require code logic changes

### Phase 3: Apply Patches
1. Update initialization loop counters
2. Update array load instructions in init loop
3. Update all direct load instructions
4. Leave data/indirect references unchanged
5. Verify each patch

### Phase 4: Test
1. Boot patched snapshot
2. Test initialization (check arrays are initialized correctly)
3. Test race flow (check arrays are accessed correctly)
4. Debug any crashes or corruption

## Tools Needed
- `tools/z80-inspect.mjs disasm` - for disassembling code around references
- `tools/patch-20car-grid.mjs` - for applying patches (needs refinement)
- Documentation tracking for each reference site
