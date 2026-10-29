# Architectural Analysis: Grid-Dependent Systems

## Analysis Goal
Determine if 20+ car expansion is feasible in 48K mode or requires 128K banking.

## Car Lifecycle Mapping

### 1. Initialization (0xC906-C960)
```
- Constructor points: 6 teams at 0x6910 (6 bytes)
- Driver points: 12 drivers at 0x6948 (24 bytes, 2 bytes each)
- Special array: 24 bytes at 0x692F (semantics unknown)
- Car arrays: 4 parallel arrays, 12 cars each
  - 0x6979: Car state A (12 bytes)
  - 0x6985: Car state B (12 bytes)
  - 0x6991: Car→driver map (12 bytes)
  - 0x6A51: Car state 4 (12 bytes)
```
**Status**: Single init routine, all arrays cleared with DJNZ loops

### 2. Data Copy Routine (0xC785-C7B0)
```
- Copies all car arrays to display buffer at 0x7B8E
- Sequential copy: 0x6979 → 0x6985 → 0x6A51 → 0x6991
- Uses simple ADD HL,BC + LD (DE),A pattern
```
**Status**: Linear copy, grid size not hardcoded (uses caller-provided counter)

### 3. Display Access (0xA4F0-A580)
```
- 0xA4F4: Accesses car→driver map with calculated offset
- 0xA55C: Another access to car→driver map
- Uses HL index + DE offset pattern
```
**Status**: Indirect addressing via index, not hardcoded count

## Key Finding: Display System

### Timing Board (0xA4F0 region)
```
0xA503: LD A,0x14  <- Shows 20 hex (not car count)
0xA505: LD C,0x0D  <- Shows 13 (possibly timing entries)
0xA507: LD B,0x0A  <- Shows 10 (top 10?)
```
**Critical**: Display code may already have logic for more than 6 cars!

### Analysis of 0x0C References (203 total occurrences)
Most 0x0C bytes are:
- ASCII characters
- Loop counters for unrelated systems
- NOT all are car-count references

## Systems That Likely Depend on Grid Size

### CONFIRMED DEPENDENCIES:
1. **Init loop counter at 0xC936** - LD B,0x0C (12 cars)
2. **Four array addresses** - Embedded in multiple locations (47 refs total)

### POTENTIAL DEPENDENCIES (need investigation):
1. **Pit stop handling** - Car numbers may be hardcoded
2. **Grid display** - Visual layout may assume 12 positions
3. **Standings display** - May have paging system
4. **Race positioning** - AI may assume 12 cars

### LIKELY INDEPENDENT:
1. **Data copy routines** - Use caller-provided counters
2. **Display buffer** - Size appears larger than needed
3. **Indirect addressing** - Uses calculated offsets

## Memory Analysis

### Current Usage
- Car arrays: 48 bytes total (4 × 12)
- To 20 cars: 80 bytes total (4 × 20)
- **Increase**: 32 bytes only

### Free Space Found
- 0xAA70-0xAB05: 150 bytes available
- **Requirement**: 32 bytes
- **Status**: EASILY fits in existing free space

## Bottleneck Analysis

### Is it memory? NO
- Only 32 bytes needed for 20-car arrays
- 150 bytes free at 0xAA70

### Is it code? MAYBE
- 47 reference sites need patching
- Some may be data, not instructions
- Need to categorize before patching

### Is it display? UNKNOWN
- Timing board shows values like 0x14 (20), 0x0D (13)
- Suggests display may already support larger grids
- Need to test actual display behavior

## Critical Test Required

### Test: Increase to 13 cars (1 above current)
**Why**: Minimal change, isolates whether the architecture is flexible

**What to patch**:
1. Init loop: 0xC936 from 0x0C to 0x0D
2. Keep all array addresses same (no relocation)
3. Test if game handles 13 cars

**Expected outcomes**:
- If crash: Architecture tightly coupled to 12 cars → 128K banking needed
- If works: Architecture flexible → proceed with full expansion

## Recommendation

### Phase 1: Minimal Incremental Test (15 minutes)
Patch init loop to 13 cars (0x0D) without relocating arrays.
Test in QAOP.

### Phase 2: Based on Test Result
**If test passes**:
- Architecture is flexible
- Proceed with array relocation to 20 cars
- Patch 47 reference sites systematically

**If test fails**:
- Architecture tightly coupled to 12 cars
- Investigate 128K banking approach
- Or create era-specific 12-car snapshots for pre-1990 seasons

## Conclusion

The game architecture is **not obviously broken** for expansion:
- Memory is available (150 bytes free, only 32 needed)
- Display code suggests larger grid support
- Copy routines use caller-provided counters

**The 12-car limit appears to be in the initialization counter and array addresses only.**

Next step: 13-car test to verify architectural flexibility.
