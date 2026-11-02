# Team Configuration Analysis

## Problem
The user reported that adding team names to the static table doesn't activate teams. Teams need full configuration: decals, drivers, sponsors, upgrades, pit stops, transfers, etc.

## Team Active Table (0x701F)
The initialization code at 0xC964-0xC96D checks a team active table:
```z80
LD HL,0x701F    ; Base address
LD E,B          ; B = team index (0, 2, 4, 6, 8, 10)
SRL E           ; E = team index / 2 (0, 1, 2, 3, 4, 5)
ADD HL,DE       ; HL = 0x701F + team_index/2
LD A,(HL)       ; Read active flag
CP 0x01         ; Check if == 1
```

This suggests:
- Table at 0x701F contains 1-byte active flags per team
- Indexed by team_index/2 (so team 0,2,4,6,8,10 → index 0,1,2,3,4,5)
- Value 0x01 = active, other = inactive

## Team Graphics/Decal Data (0x6F00-0x6FA0)
The display code at 0x96AA-0x96DD loads graphics data:
```z80
LD HL,0x6FDD    ; Primary graphics table
LD E,A          ; A = team index
SRL E           ; E = team index / 2
ADD HL,DE       ; HL = 0x6FDD + team_index/2
LD A,(HL)       ; Load graphics byte
OUT (0xFE),A    ; Send to display
```

Looking at 0x6F00-0x6FA0, there's a pattern of ~17-byte entries:
- 0x6F00: Entry 0
- 0x6F11: Entry 1 (0x6F00 + 0x11)
- 0x6F22: Entry 2 (0x6F11 + 0x11)
- 0x6F33: Entry 3 (0x6F22 + 0x11)
- 0x6F44: Entry 4 (0x6F33 + 0x11)
- 0x6F55: Entry 5 (0x6F44 + 0x11)
- 0x6F66: Entry 6 (0x6F55 + 0x11)

This is 7 entries (0-6), but we only have 6 teams. Need to understand the structure.

## Team Activation Loop (0xC960-0xC9EB)
The main team activation loop:
```z80
LD B,0x01        ; Start with car index 1
loop:
LD E,B
DEC E            ; E = car index - 1
SRL E            ; E = (car index - 1) / 2 = team index
LD HL,0x701F
ADD HL,DE        ; HL = 0x701F + team index
LD A,(HL)        ; Read team active flag
CP 0x01
JP C,skip_team   ; If flag < 1, skip this team
CALL 0x96AA      ; Display team graphics
CALL 0xC9F4      ; Initialize team
INC B            ; B += 2 (next car in same team)
INC B
LD A,0x0C        ; Compare against 12 cars
CP B
JP NC,loop       ; If B < 12, continue
```

This shows:
- Loop iterates by car (1, 3, 5, 7, 9, 11)
- Team index = (car index - 1) / 2
- Only activates teams where active flag == 1
- Hardcoded limit of 12 cars (0x0C)

## Missing Data Structures
To fully wire up teams, we need to find:
1. **Car numbers per team** - Must be somewhere in static data
2. **Sponsor assignments per team** - Maps team ID to sponsor ID
3. **Driver pool and assignments** - How drivers are hired per team
4. **Car upgrade state per team** - Reliability, speed, etc.
5. **Team funds/balance** - 16-bit money value
6. **Pit stop strategy per team** - AI behavior
7. **Driver transfer logic** - How drivers move between teams

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

## Implementation Plan

1. Extract clean baseline from safe-original
2. Edit static data tables:
   - Add 4 manager names (10 total)
   - Add 4 team config entries (car numbers, sponsors)
   - Add 4 team active flags (set to 0x01)
3. Patch loop counters
4. Test in QAOP
