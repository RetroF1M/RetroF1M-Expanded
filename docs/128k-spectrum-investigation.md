# 128K Spectrum Investigation Results

## Date
2026-10-21

## Test Method
- Used Playwright MCP to navigate QAOP emulator in 128K mode
- URL: `http://127.0.0.1:8000/emulator.html#128#/seasons/f12023-boundary-experimental.sna`
- Inspected memory layout via JavaScript evaluation

## Findings

### ✅ Upper Memory Access
- **Upper memory (0x8000+) IS accessible** in 128K mode
- **Write capability confirmed**: Successfully wrote and read back from 0x8000
- **Memory range 0x8000-0xBF00 contains data**: Not all zeros, indicating 128K RAM banks are active

### ROM Signature
- **Bytes at 0x0000-0x0001**: 0xF3, 0xAF
- This appears to be a 128K ROM signature (different from standard 48K ROM)

### Memory Layout Sample
```
0x8000: 0
0x8100: 38
0x8200: 38
0x8300: 20
...
0x9500: f1
0xA000: a0
0xB000: 3a
0xBF00: 11
```

## Implications for 16-bit Points

### Potential Benefits
1. **More RAM available**: Upper memory banks (0x8000+) provide ~16KB additional space
2. **Natural 16-bit storage**: Could relocate points arrays to upper banks
3. **No space constraints in 48K**: Original data stays intact

### Challenges
1. **Current .sna is 48K format**: Need conversion to 128K format
2. **Memory banking required**: Z80 code must handle bank switching
3. **Complex patching**: Points awarding logic needs banking patches
4. **Compatibility**: QAOP 128K mode works, but game code may not use banking

### Implementation Requirements
If we proceed with 128K solution:
1. Convert `f12023-boundary-experimental.sna` to 128K format
2. Add Z80 code to handle memory bank switching
3. Relocate driver points array (0x6948) to upper bank
4. Relocate constructor points array (0x6910) to upper bank
5. Patch points awarding logic to switch banks before/after access
6. Patch standings display to read from banks
7. Patch sorting/comparison to handle banked 16-bit values
8. Test extensively

## Recommendation

**Proceed with manual 16-bit relocation in 48K mode instead.**

### Reasons:
1. **Lower risk**: Manual relocation in 48K is proven and simpler
2. **Less complexity**: No memory banking, bank switching, or 128K-specific patches
3. **Proven path**: The boundary patch already relocated similar tables
4. **Timeline**: Faster to implement than full 128K conversion
5. **Debugging**: Easier to debug 48K code than 128K banking issues

### When to Reconsider 128K:
- If 48K relocation proves impossible due to space constraints
- If we need >32KB additional space for other features
- If future requirements demand full 128K support

## Alternative: Manual 16-bit in 48K
- Relocate points arrays to a proven-free contiguous block in 48K
- Update addition logic to use 16-bit operations
- Update display logic to print 16-bit values
- Update sorting/comparison for 16-bit
- Keep existing 48K compatibility

This approach follows the same pattern as the boundary calendar relocation.

## Conclusion
128K mode works in QAOP and provides upper memory access, but the complexity of converting the game to use banking outweighs the benefits for the 16-bit points use case. Proceed with manual 16-bit relocation in 48K mode.
