# Display System Analysis

## Grid Display Logic (0xA490-A4F0)

### Key Loop Counters
- **0xA4A6**: `LD B,0x0C` - Outer loop for 12 cars (teams)
- **0xA4B1**: `CP 0x0C` - Checks if >= 12 cars
- **0xA4B7**: `CP 0x06` - Checks if >= 6 cars (paging threshold)

### Paging System
The display uses a **6 cars per page** system:
- Page 1: Cars 0-5
- Page 2: Cars 6-11
- Currently hard-coded for 12 cars total (2 pages)

### For 20 Cars
Need to change:
- **0xA4A6**: `LD B,0x0C` → `LD B,0x14` (20 cars)
- **0xA4B1**: `CP 0x0C` → `CP 0x14` (20 cars)
- **0xA4B7**: Keep `CP 0x06` (6 cars per page)
- Result: 4 pages of 6 cars (last page has 2 cars)

## Why Only 9 Drivers Visible

Current 13-car test shows 9 drivers because:
- Season data has 6 teams with 2 cars each = 12 cars total
- Display loop still set to 12 (0x0C)
- Game likely only populates active cars based on team data
- With 13 counter, it reads past the 12 initialized cars into uninitialized data

## Solution: In-Place Expansion Plan

### Phase 1: Change Counters (3 locations)
1. **Init loop** 0xC936: 0x0C → 0x14 (20 cars)
2. **Display loop** 0xA4A6: 0x0C → 0x14 (20 cars)
3. **Display check** 0xA4B1: 0x0C → 0x14 (20 cars)

### Phase 2: Verify Team Data
Need to ensure season data has enough teams:
- Current: 6 teams × 2 cars = 12 cars
- Required: 10 teams × 2 cars = 20 cars
- **Team data must be expanded first!**

### Phase 3: Test
After team data expansion, test with counter changes only.

## Critical Insight

The display limit is in the loop counter, not the array addresses. The architecture is flexible - we just need to:
1. Expand team/season data to 10 teams
2. Change 3 loop counters to 20
3. Arrays naturally extend into gaps (no relocation needed)
