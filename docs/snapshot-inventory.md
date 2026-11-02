# Snapshot Inventory

## Overview
This document tracks all `.sna` snapshot files in the repository, their lineage, and their purpose.

## Snapshots in seasons/

### Original/Reference Snapshots

| File | Size | Date | Purpose | Status |
|------|------|------|---------|--------|
| `f12023.sna` | 49179 | May 21 | Original 2023 season (unmodified) | ✅ Safe reference |
| `f11998.sna` | 49179 | May 21 | 1998 season reference | ✅ Safe reference |
| `f12018.sna` | 49179 | May 21 | 2018 season reference | ✅ Safe reference |
| `f12021.sna` | 49179 | May 21 | 2021 season reference | ✅ Safe reference |

### Experimental Snapshots (Branch: development)

| File | Size | Date | Modifications | Status |
|------|------|------|---------------|--------|
| `f12023-modern.sna` | 49179 | Oct 21 | Modern data updates (details TBD) | Unknown |
| `f12023-boundary-experimental.sna` | 49179 | Oct 21 | Grid array boundary testing, calendar relocation | ⚠️ Modified arrays |
| `f12023-canonical-experimental.sna` | 49179 | Oct 21 | Canonical reference for 2023 | 🟡 Likely stable |
| `f12023-round17-probe-experimental.sna` | 49179 | Oct 21 | Round 17 specific probe | Unknown |
| `f12023-20car-experimental.sna` | 49179 | Oct 21 | Failed 20-car relocation attempt | ❌ Corrupted |
| `f12023-13car-test.sna` | 49179 | Oct 23 | Successful 13-car test (proved flexibility) | ✅ Working |
| `f12023-10teams.sna` | 49179 | Oct 29 | 10-team names added, counters patched (only 12 cars visible) | ❌ Incomplete |
| `f12023-team-config-test.sna` | 49179 | Oct 29 | Just created, not yet modified | 🟡 New |

## Git Branch Information

| Branch | Purpose | Tracking |
|--------|---------|----------|
| `safe-original` | Original unmodified snapshots | Local only |
| `main` | Main development branch | Tracking `origin/main` |
| `development` | Current work branch | Tracking `remotes/expanded/development` |
| `expanded/development` | Remote for RetroF1M-Expanded repo | GitHub |

## Safe Snapshots (Do Not Modify)

- `safe-original` branch contains original `f12023.sna`
- All snapshots in the root `seasons/` folder are copies, not the authoritative source
- Work should be done on copies in the `development` branch

## Recommended Baseline for Team Configuration Expansion

**Candidate**: `f12023-canonical-experimental.sna`

**Reasoning**:
- User mentioned it has points patched and new races added
- Likely the most stable experimental version
- Not the corrupted 20-car attempt
- Not the boundary-experimental with relocated arrays

**Alternative**: `f12023-boundary-experimental.sna`

**Reasoning**:
- User mentioned it as one of the options
- Has calendar relocation
- May have points patched

**Decision Needed**: Verify which one has:
1. Points system patched
2. New races added
3. Working 12-car baseline
4. No array relocation corruption

## Next Steps

1. Test both `f12023-canonical-experimental.sna` and `f12023-boundary-experimental.sna` in QAOP
2. Determine which is the stable baseline
3. Use that baseline for team configuration expansion
4. Document the final decision here
