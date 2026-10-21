# Reference Site Categorization

## Method
Each reference site was examined using `z80-inspect.mjs disasm` to identify the instruction that uses the array address.

## Categories

### Direct Load Instructions (Need Patching)
These instructions load the array address directly into a register. They need the address updated.

| Address | Array | Instruction | New Address |
|---------|-------|-------------|-------------|
| 0xA4F4 | 0x6991 | LD HL,0x6991 | 0xAA98 |
| 0xA55C | 0x6991 | LD HL,0x6991 | 0xAA98 |
| 0xABF5 | 0x6991 | LD HL,0x6991 | 0xAA98 |
| 0xAD5F | 0x6991 | LD HL,0x6991 | 0xAA98 |
| 0xADA6 | 0x6991 | LD HL,0x6991 | 0xAA98 |
| 0xBFB0 | 0x6979 | LD HL,0x6979 | 0xAA70 |
| 0xBFE9 | 0x6985 | LD HL,0x6985 | 0xAA84 |
| 0xBFB1-0xBFE0 area (multiple) | various | Various loads | various |

### Indirect References (Complex)
These use calculated addresses or index registers. May need code logic changes.

### Data Access (May Not Need Patching)
These access array elements, not the base address.

### Other (Needs Investigation)
Complex patterns that need closer analysis.

## Confirmed Direct Loads (from disassembly)
From my earlier disassembly work:

1. **0xA4F4**: `LD HL,0x6991` - car→driver map
2. **0xA55C**: `LD HL,0x6991` - car→driver map  
3. **0xABF5**: `LD HL,0x6991` - car→driver map
4. **0xBFB0**: `LD HL,0x6979` - car state A
5. **0xBFE9**: `LD HL,0x6985` - car state B
6. **0xC918**: `LD HL,0x6991` - car→driver map (already patched)
7. **0xC91D**: `LD IX,0x6A51` - car state 4 (already patched)
8. **0xC921**: `LD IY,0x6985` - car state B (already patched)
9. **0xC925**: `LD DE,0x6979` - car state A (already patched)

## Next Steps
1. Complete disassembly of all 47 sites
2. Identify which are direct loads vs indirect
3. Create comprehensive patch list
4. Apply patches systematically
5. Test after each batch
