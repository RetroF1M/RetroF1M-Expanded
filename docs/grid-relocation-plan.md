# Grid Array Relocation Plan

## Problem
No contiguous 450-byte free block available in RAM after calendar relocation.
- Maximum free block: 150 bytes at 0xAA70-0xAB05
- Required for 26 cars: ~450 bytes for expanded grid arrays
- Memory is severely constrained in 48K mode

## Revised Approach: Incremental Expansion
Given memory constraints, use a phased approach:

### Phase 1: 20-Car Expansion (2023 Season)
- **Target**: 20 cars / 10 teams (2023 F1 season)
- **Space required**: ~260 bytes (smaller than 26-car requirement)
- **Feasible**: 150-byte block at 0xAA70 + segmented relocation

### Phase 2: 26-Car Expansion (Historical Seasons)
- **Target**: 26 cars / 13 teams (max historical grid)
- **Space required**: ~450 bytes
- **Feasible**: Requires significant code optimization or 128K banking

## 20-Car Segmentation Plan

### Core Car Arrays ( relocated to 0xAA70)
- **0x6979**: Car state A (12 → 20 bytes)
- **0x6985**: Car state B (12 → 20 bytes)
- **0x6991**: Car→driver map (12 → 20 bytes)
- **0x6A51**: Car state (12 → 20 bytes)
- **Total**: 80 bytes (4 arrays × 20 bytes)
- **Target**: 0xAA70-0xAACF (80 bytes within 150-byte block)

### Points Arrays (segmented)
- **0x6910**: Constructor points (6 → 10 bytes)
- **0x6948**: Driver points (24 → 40 bytes, 2 bytes per driver)
- **Total**: 50 bytes
- **Target**: 0xAAD0-0xAB00 (32 bytes) + remaining space

### Team Arrays (expand in place)
- **0x701F**: Team active table (6 → 10 bytes)
- **Total**: 10 bytes
- **Target**: Expand in place (4 extra bytes available)

### Race Arrays (segmented)
- **0x6849**: Finish→car map (12 → 20 bytes)
- **0x69D9**: Race status (12 → 20 bytes)
- **Total**: 40 bytes
- **Target**: Find another small free block or use remaining space

## Season-Specific Active Counts Configuration
Add to f1-season-tool.mjs:
```json
{
  "year": 2023,
  "gridConfig": {
    "activeTeams": 10,
    "activeCars": 20,
    "activeDrivers": 20
  }
}
```

For 2026:
```json
{
  "year": 2026,
  "gridConfig": {
    "activeTeams": 11,
    "activeCars": 22,
    "activeDrivers": 22
  }
}
```

## Implementation Steps (20-Car Focus)
1. Relocate 4 core car arrays to 0xAA70
2. Update initialization loop to initialize 20 entries instead of 12
3. Update all reference sites (scan with z80-inspect.mjs refs)
4. Add `activeCarCount` variable (e.g., at 0x7028)
5. Test with 20 cars using 2023 season data
6. Verify pit stops, race timing, standings work with 20 cars
7. Once 20 cars works, assess memory for 26-car expansion

## Memory Optimization Opportunities
- Remove tape-save prompt code (free ~50-100 bytes)
- Remove obsolete text/graphics
- Use 128K upper memory banks if needed for 26-car expansion
