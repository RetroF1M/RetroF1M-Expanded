# Reference Site Categorization

## Method
Each reference site was examined using `z80-inspect.mjs disasm` to identify the instruction that uses the array address.

## Categories

### Direct Load Instructions (Need Patching)
These instructions load the array address directly into a register. They need the address updated.

| Address | Array | Instruction | New Address | Status |
|---------|-------|-------------|-------------|--------|
| 0xA4F4 | 0x6991 | LD HL,0x6991 | 0xAA98 | Pending |
| 0xA55C | 0x6991 | LD HL,0x6991 | 0xAA98 | Pending |
| 0xABF5 | 0x6991 | LD HL,0x6991 | 0xAA98 | Pending |
| 0xAD5F | 0x6991 | LD HL,0x6991 | 0xAA98 | Pending |
| 0xADA6 | 0x6991 | LD HL,0x6991 | 0xAA98 | Pending |
| 0xBFB0 | 0x6979 | LD HL,0x6979 | 0xAA70 | Pending |
| 0xBFE9 | 0x6985 | LD HL,0x6985 | 0xAA84 | Pending |
| 0xC022 | 0x6991 | LD HL,0x6991 | 0xAA98 | Pending |
| 0xC1D1 | 0x6985 | LD HL,0x6985 | 0xAA84 | Pending |
| 0xC918 | 0x6991 | LD HL,0x6991 | 0xAA98 | ✅ Patched |
| 0xC91D | 0x6A51 | LD IX,0x6A51 | 0xAAB0 | ✅ Patched |
| 0xC921 | 0x6985 | LD IY,0x6985 | 0xAA84 | ✅ Patched |
| 0xC925 | 0x6979 | LD DE,0x6979 | 0xAA70 | ✅ Patched |

### Indirect References (Complex)
These use calculated addresses or index registers. May need code logic changes.

### Data Access (May Not Need Patching)
These access array elements, not the base address.

### Other (Needs Investigation)
Complex patterns that need closer analysis.

## Disassembly Findings

### Pattern 1: Simple Array Index Access
```
LD HL,arrayAddr    ; Load base address
ADD HL,DE          ; Add offset
LD A,(HL)          ; Access element
```
Found at: 0xA4F4, 0xA55C, 0xABF5, 0xAD5F, 0xADA6, 0xC022, 0xC1D1
**Patch needed**: Update the `LD HL,arrayAddr` instruction

### Pattern 2: Parallel Array Access
```
LD HL,array1
LD IX,array2
LD IY,array3
LD DE,array4
[loop]
LD (HL),A
LD (IX+0),A
LD (IY+0),A
LD (DE),A
INC HL, INC IX, INC IY, INC DE
```
Found at: 0xBFB0, 0xBFE9
**Patch needed**: Update all array load instructions

### Pattern 3: State Machine with Array Lookup
```
LD HL,arrayAddr
ADD HL,DE
[complex logic]
```
Found at: Various locations
**Patch needed**: Update the `LD HL,arrayAddr` instruction

## Summary
- **Total references**: 47
- **Direct loads identified**: 9 (from sample)
- **Already patched**: 4 (init loop)
- **Pending**: 5+ (need to complete full scan)

## Next Steps
1. Complete disassembly of remaining 38 sites
2. Identify all direct load instructions
3. Create comprehensive patcher for all sites
4. Apply patches systematically
5. Test after full patch
