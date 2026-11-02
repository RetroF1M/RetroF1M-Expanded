# Team Configuration Analysis - Master Document

## Problem
Adding team names to static tables doesn't activate teams. Teams need full configuration: decals, drivers, sponsors, upgrades, pit stops, transfers, AI behavior, car numbers, funds.

## Current Status
- ✅ Static text tables expanded (teams: 8→10, managers: 6→10)
- ✅ Team active flags expanded (0x701F: 6→10 bytes)
- ✅ Loop counters patched (6→10 teams, 12→20 cars)
- ❌ Teams still not wired - need actual configuration data

## Known Team Structures

### Team Active Table (0x701F)
- 1 byte per team, value 0x01 = active
- Indexed by team index (0-5 for 6 teams)
- Checked in initialization loop at 0xC964-0xC96D

### Team Graphics (0x6FDD+)
- Display routine at 0x96AA loads from 0x6FDD
- Indexed by team index
- Contains sprite/UDG data for car graphics

### Static Text Tables (File Offsets)
- Teams: offset 12216, 8 chars per team (just names)
- Managers: offset 12286, 10 chars per manager (just names)
- These are LABELS only, not configuration

## Required Team Configuration (What We Need to Find)

### 1. Car Numbers
- Each team needs 2 car numbers (e.g., Mercedes: 44, 63)
- Must be displayed on cars
- Used for pit stop identification
- Likely in static data or calculated from team index

### 2. Sponsor Assignments
- Each team assigned to a sponsor (e.g., Mercedes → Petronas)
- Sponsor affects funds/income
- Likely 1 byte per team mapping to sponsor ID

### 3. Driver Assignments
- Each team hires 2 drivers from driver pool
- Driver pool: 24 drivers available
- Assignment happens during team setup phase
- Need driver hiring logic and assignment storage

### 4. Car Upgrade State
- Reliability rating
- Speed rating
- Aerodynamics rating
- Likely per-team runtime arrays

### 5. Team Funds/Balance
- 16-bit money value per team
- Affected by sponsors, race results
- Used for upgrades

### 6. Pit Stop Strategy
- AI behavior for pit stops
- Tire strategy
- Fuel strategy
- Likely per-team configuration

### 7. Decals/Visual Identity
- Team-specific car graphics
- Already found at 0x6FDD+ but structure unclear
- Need to expand for 10 teams

### 8. AI Behavior
- Aggressiveness
- Skill level
- Drafting behavior
- Likely per-team runtime values

## Critical Failure - In-Place Expansion

**Test Result**: FAILED - Game crashed, text garbled, sponsor selection broken

**Root Cause**: Static data expansion (teams, managers) overwrote critical data. The gaps we thought were free were NOT actually free.

**New Approach Needed**:
1. Find truly free space in the snapshot (outside static data region)
2. Or use 128K banking for additional data
3. Or accept 12-car limit and focus on historical accuracy for eras that had ≤12 cars

## Recommendation

Given the severe memory constraints and the critical failure, I recommend:

**Option A**: 128K Banking Approach
- Use upper memory banks (0x8000+) for expanded arrays
- Requires snapshot format conversion (48K → 128K)
- Add bank-switching code
- More complex but provides actual space

**Option B**: Conservative 12-Car Focus
- Accept 12-car limit for 48K snapshots
- Focus on historical seasons that had ≤12 cars (1950s-1980s)
- Modern eras would need 128K approach
- Safer, preserves game stability

**Option C**: Minimal 20-Car Patch
- Only patch loop counters (no array expansion)
- Use existing arrays with waste/overlap
- Risky but minimal code changes

**Which approach should we pursue?**

## Investigation Findings

### ✅ Car Numbers - Runtime Generated
**Location**: File offset 8522 (RAM 0x6FCB)
**Structure**: 12 bytes (1 byte per car)
**Data**: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
**Purpose**: Car numbers in grid order
**Conclusion**: Sequential (1-12), likely generated at runtime from car index

### ✅ Driver Assignment Logic - FOUND
**Location**: 0xC960-0xC9D2 (team activation loop)
**Key operations**:
- 0xC9C8: `LD HL,0x6991` - Car→driver map array
- 0xC9D0: `LD (HL),A` - Assign driver to car
- 0xC9B4: `LD HL,0x692F` - Special array (24 bytes)
- 0xC9C7: `LD (HL),B` - Track car assignment

**Logic**:
- Loop iterates by car (1, 3, 5, 7, 9, 11)
- Team index = (car index - 1) / 2
- Checks team active flag at 0x701F
- Assigns driver to car at 0x6991
- Tracks assignments in 0x692F

### ✅ Runtime Arrays (from initialization at 0xC906)
- 0x6910: Constructor points (6 teams × 1 byte)
- 0x6948: Driver points (12 drivers × 2 bytes)
- 0x692F: Special array (24 bytes) - driver assignment tracking
- 0x6979: Car state A (12 cars × 1 byte)
- 0x6985: Car state B (12 cars × 1 byte)
- 0x6991: Car→driver map (12 cars × 1 byte)
- 0x6A51: Car state 4 (12 cars × 1 byte)

### ❌ Missing Configuration
- **Sponsor assignments**: Not found in static data, likely runtime or hardcoded
- **Team funds/upgrades**: Not found, likely runtime or default values
- **Pit stop strategy**: Not found, likely runtime AI
- **Decals**: Graphics at 0x6FDD+ but structure unclear

### Critical Insight
The game appears to use:
- Static data: Names (teams, managers, drivers, sponsors, circuits)
- Runtime data: Arrays for cars, drivers, points, assignments
- Car numbers: Generated sequentially (1-12)
- Team configuration: Minimal - mostly just names and active flags

This suggests the original game design assumes 6 teams with 2 cars each, and most configuration is either:
1. Hardcoded in the code
2. Generated at runtime
3. Set to default values

### Expansion Strategy

**NO RELocation Needed** - Found sufficient gaps:

1. **Points array (0x6910)**: 6 → 10 teams (add 4 bytes)
   - Gap to next array: 25 bytes ✅ Sufficient

2. **Driver points (0x6948)**: 12 → 20 drivers (add 16 bytes)
   - Gap to next array: 25 bytes ✅ Sufficient

3. **Car arrays (0x6979, 0x6985, 0x6991, 0x6A51)**: 12 → 20 cars (add 8 bytes each = 32 bytes)
   - Gap after carMap: 180 bytes ✅ Sufficient

4. **Special array (0x692F)**: 24 bytes → 40 bytes (for 20 drivers)
   - MOVED to 0x6958 (after driverPoints) to make room

**Completed Patches**:
1. ✅ Expand points: 0x6910 (6→10 bytes)
2. ✅ Move special array: 0x692F → 0x6958
3. ✅ Expand driver points: 0x6948 (24→40 bytes)
4. ✅ Expand special array: 0x6958 (24→40 bytes)
5. ✅ Expand car arrays: 0x6979, 0x6985, 0x6991, 0x6A51 (12→20 bytes each)
6. ✅ Update special array references: 10 sites (0x692F → 0x6958)
7. ✅ Update loop counters: 0xC912, 0xC936, 0xA4A6, 0xA4B1
8. ✅ Expand static name tables (teams, managers)
9. ✅ Add team active flags

## Test Results - FAILED

**Snapshot**: seasons/f12023-20car-expanded.sna
**Status**: CRITICAL FAILURE

**Issues**:
1. Cannot select team - stuck on "Please select team" screen
2. 0 players mode broken - shows sponsor selection for ALL teams (should skip)
3. Text garbled: "Williams for Mercedes", "AlfaRomeHa for Ferrari", "as     ner for Red Bull"
4. If skip sponsors: "Formula 1 racing cancelled due to lack of interest" + game freaks out

**Root Cause Analysis**:
- Text garbling suggests static data expansion overwrote critical data
- Sponsor selection in 0-player mode suggests loop counter changes broke game flow
- Game freeze/crash indicates array expansion corrupted something critical

**Conclusion**: The in-place expansion approach was too aggressive. Need to revert and try a more conservative approach.

## Baseline
Using: `f12023-boundary-experimental.sna` (has points patch + new races)

## Discovery: Team Configuration Table (0x2FDC-0x2FDF)

Found a critical pattern at 0x2FDC-0x2FDF:
```
0x2FDC: 0x20 (space)
0x2FDD: 0x05
0x2FDE: 0x02
0x2FDF: 0x00
0x2FE0: 0x06
0x2FE1: 0x04
0x2FE2: 0x01
```

**Interpretation**:
- Team 0: Car number 5, Sponsor 2, Unknown 0
- Team 1: Car number 6, Sponsor 4, Unknown 1

This is likely a **3-byte per team table**:
- Byte 0: Car number
- Byte 1: Sponsor ID
- Byte 2: Unknown (maybe upgrade level or fund value)

For 6 teams, this would be 18 bytes (0x2FDD-0x2FEA).

**References to team active table (0x701F)**: 20 locations found
This confirms the team active flag is checked throughout the code.

## Team Activation Loop Discovered (0xC960-0xC9EB)

The master team activation loop:
```z80
LD B,0x01        ; Start with car index 1
loop:
LD E,B
DEC E            ; E = car index - 1
SRL E            ; E = (car index - 1) / 2 = team index
LD HL,0x701F     ; Team active table
ADD HL,DE        ; HL = 0x701F + team index
LD A,(HL)        ; Read team active flag
CP 0x01
JP C,skip_team   ; If flag < 1, skip this team
CALL 0x96AA      ; Display team graphics (from 0x6FDD)
CALL 0xC9F4      ; Initialize team
INC B            ; B += 2 (next car in same team)
INC B
LD A,0x0C        ; Compare against 12 cars
CP B
JP NC,loop       ; If B < 12, continue
```

**Key findings**:
- Car index: 1, 3, 5, 7, 9, 11 (2 cars per team)
- Team index: 0, 1, 2, 3, 4, 5 (6 teams)
- Team active table: 0x701F (1 byte per team)
- Team graphics: 0x6FDD (indexed by team index)
- Hardcoded limit: 12 cars (0x0C)

## Team Graphics Data (0x6FDD+)

The display routine at 0x96AA loads graphics from 0x6FDD:
```z80
LD HL,0x6FDD     ; Graphics base
SRL E            ; E = team index
ADD HL,DE        ; HL = 0x6FDD + team index
LD A,(HL)        ; Load graphics byte
OUT (0xFE),A     ; Send to display
```

The data at 0x6FDD is sprite/UDG data (pattern of bytes for car graphics).

## Complete Team Configuration Architecture

```
Runtime activation:
- 0x701F: Team active flags (1 byte per team, 6 entries = 6 bytes)
- 0x6FDD: Team graphics data (indexed by team index, structure unknown)
- 0x6F00-0x6FA0: Extended graphics entries (~17 bytes per team)

Static configuration:
- 0x2F00-0x2FDB: Driver names (24 drivers × 10 chars = 240 bytes)
- 0x2FDD-0x2FEA: Team config (6 teams × 3 bytes = 18 bytes)
  - Per team: [car_number, sponsor_id, unknown]
- 0x2FEB-0x2FFF: Manager names (6 managers × 10 chars = 60 bytes)
- 0x3000+: Sponsor names and other data
```

## Required Changes for 10 Teams (20 Cars)

1. **Team active table (0x701F)**: Expand from 6 to 10 bytes
2. **Team graphics (0x6FDD+)**: Add 4 more graphics entries
3. **Team config (0x2FDD)**: Expand from 18 to 30 bytes (add 4 teams × 3 bytes)
4. **Manager names**: Expand from 6 to 10 entries (60 to 100 bytes)
5. **Loop counters**:
   - 0xC979: 0x0C → 0x14 (12 → 20 cars)
   - 0xC912: 0x06 → 0x0A (6 → 10 teams)
6. **Display counters**:
   - 0xA4A6: 0x0C → 0x14 (12 → 20 display iterations)
   - 0xA4B1: 0x0C → 0x14 (12 → 20 comparison)

## Implementation Progress

### ✅ Completed (v2 - Using boundary-experimental baseline)

1. **Snapshot inventory created** - Documented all .sna files and their status
2. **Static data expansion**:
   - Teams table: 8 → 10 entries (file offset 12216)
   - Managers table: 6 → 10 entries (file offset 12286)
   - Added team names: AlphaT, Williams, AlfaRomeo, Haas
   - Added manager names: Tost, Capito, Vasseur, Steiner
3. **Team active table expansion**:
   - 0x701F: 6 → 10 bytes (activated teams 6-9)
4. **Loop counters patched**:
   - 0xC912: 6 → 10 teams
   - 0xC936: 12 → 20 cars
   - 0xA4A6: 12 → 20 display iterations
   - 0xA4B1: 12 → 20 comparison

### ⚠️ Still Missing

The current patch only modifies:
- Static text tables (team names, manager names)
- Team active flags
- Loop counters

**Missing team wiring**:
- Car numbers per team
- Sponsor assignments per team
- Decals/graphics per team
- Driver assignments per team
- Car upgrade state per team
- Team funds/balance
- Pit stop strategy per team
- AI behavior per team

### Next Critical Investigation

Need to find where the game actually stores and uses:
1. **Car number to team mapping** - Which car number belongs to which team
2. **Sponsor assignment** - Which sponsor each team uses
3. **Driver hiring** - How drivers are assigned to teams
4. **Decal selection** - How team graphics are selected
5. **Runtime team state** - Funds, upgrades, etc.

The static text tables are just labels. The actual team configuration must be in other data structures or calculated at runtime.
