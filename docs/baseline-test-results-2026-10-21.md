# Baseline Test Results - 2026-10-21

## Test Summary
- **Snapshot**: seasons/f12023-boundary-experimental.sna
- **Date**: 2026-10-21
- **Test Method**: Automated QAOP at 128x speed with 0-player mode
- **Duration**: 90.7 seconds

## Results

### ✅ Success Criteria Met
- **Season Completion**: All 22 rounds completed successfully
- **Round Progression**: Perfect transitions through rounds 1-22
- **No Crashes**: Game remained stable throughout
- **Natural Flow**: Season progressed correctly via Enter key presses

### ⚠️ Issues Identified

#### 1. Lap Count Display Corruption
- **Symptom**: "er laps" shown before race starts
- **Location**: Pre-race circuit information screen
- **Severity**: Display-only, does not affect gameplay
- **Root Cause**: Unknown - needs investigation in display rendering code
- **Priority**: Medium - cosmetic issue that should be fixed

#### 2. Points Cap at 255
- **Symptom**: Driver and constructor points capped at 255
- **Impact**: Changes final standings when points exceed 255
- **Root Cause**: Byte-sized totals (known limitation)
- **Fix**: Phase 3 - 16-bit championship points implementation
- **Priority**: High - affects game accuracy for modern seasons

#### 3. Tape Save Prompt Hang (NEW)
- **Symptom**: Game asks to save halfway through season; if yes, it hangs
- **Root Cause**: Expects ZX Spectrum tape save mechanism (obsolete in QAOP)
- **Impact**: Blocks automated testing; requires manual intervention
- **Potential Benefit**: Removing this could free Z80 code space for grid expansion
- **Suggested Fix**: Remove tape save prompt entirely; QAOP has F2/F3 state save
- **Priority**: Medium - quality-of-life improvement, potential code space gain

## Round Progression Log
```
Round 0: 0.0s (initial)
Round 1: 1.6s
Round 2: 4.5s
Round 3: 8.1s
Round 4: 11.9s
Round 5: 16.3s
Round 6: 21.1s
Round 7: 25.6s
Round 8: 30.0s
Round 9: 32.8s
Round 10: 36.9s
Round 11: 41.0s
Round 12: 45.1s
Round 13: 48.7s
Round 14: 53.1s
Round 15: 56.5s
Round 16: 60.2s
Round 17: 64.8s
Round 18: 69.6s
Round 19: 74.7s
Round 20: 79.7s
Round 21: 83.7s
Round 22: 88.7s
```

## Timing Analysis
- Average time per round: ~4.0 seconds at 128x speed
- Total real time: 90.7 seconds
- Effective speedup: ~128x (as expected)

## Conclusion
The boundary-experimental snapshot is **functionally working** for 22-round calendar progression. The two identified issues are:
1. Display corruption (cosmetic, needs investigation)
2. Points cap (expected, to be fixed in Phase 3)

## Next Steps
1. Investigate "er laps" display issue (could be related to calendar expansion)
2. Proceed to Phase 1.1: 128K Spectrum investigation for 16-bit points solution
3. Phase 1.2: Complete grid array grounding

## Test Method
Script: `tools/baseline-test-script.js`
Usage: Paste into browser DevTools Console when emulator is loaded
