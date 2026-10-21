# RetroF1M Progress Tracking

**Last Updated**: 2026-10-21
**Current Phase**: Phase 1 - Technical Foundation Investigation
**Branch**: development

## Completed Milestones

### Phase 0: Foundation Research & Repository Setup ✅
- **Status**: COMPLETE
- **Date**: 2026-10-21
- **Deliverables**:
  - `docs/original-game-research.md` - Original game mechanics documented
  - `docs/qaop-emulator-research.md` - QAOP emulator capabilities documented
  - `docs/progress-tracking.md` - Milestone tracking system
  - `docs/github-repo-setup.md` - Repository setup instructions
  - `docs/baseline-test-results-2026-10-21.md` - Baseline test results
  - `docs/128k-spectrum-investigation.md` - 128K investigation findings
  - GitHub repo: https://github.com/RetroF1M/RetroF1M-Expanded
  - Playwright MCP configured for browser automation
- **Summary**: All foundation work complete. GitHub repo created, baseline tested, 128K investigated and decided against.
- **Issues Found**:
  - "er laps" display corruption (cosmetic)
  - Points cap at 255 (expected, Phase 3 will fix)
  - Tape save prompt hang (obsolete mechanism, needs removal)

### Phase 1.1: 128K Spectrum Investigation ✅
- **Status**: COMPLETE
- **Date**: 2026-10-21
- **Decision**: Manual 16-bit relocation in 48K mode (not 128K)

### Phase 0.1: Original Game Research ✅
- **Status**: COMPLETE
- **Date**: 2026-10-21
- **Deliverable**: `docs/original-game-research.md`
- **Summary**: Researched BP Wheelhouse & George Munday's 1985 Formula One game. Documented all game mechanics, controls, flow, and management systems. Identified what must be preserved vs what can be expanded.

### Phase 0.2: QAOP Emulator Research ✅
- **Status**: COMPLETE
- **Date**: 2026-10-21
- **Deliverable**: `docs/qaop-emulator-research.md`
- **Summary**: Researched QAOP/JS emulator capabilities. Documented 48K vs 128K support, JavaScript API (window.emu.kbd, memory access, speed control), automation patterns, and limitations. 128K investigation pending.

## Current Work In Progress

**Phase 1: Technical Foundation Investigation**

### Phase 1.1: 128K Spectrum Investigation ✅
- **Status**: COMPLETE
- **Date**: 2026-10-21
- **Deliverable**: `docs/128k-spectrum-investigation.md`
- **Summary**: Investigated 128K Spectrum support in QAOP. Upper memory (0x8000+) is accessible and writable. ROM signature indicates 128K mode active. **Decision**: Proceed with manual 16-bit relocation in 48K mode instead of 128K. Banking complexity outweighs benefits for this use case.
- **Key Finding**: Upper memory accessible but requires complex Z80 banking patches
- **Decision**: Use manual 16-bit relocation in 48K (simpler, proven pattern from boundary patch)

### Phase 0.3: GitHub Repository Setup ✅
- **Status**: COMPLETE
- **Date**: 2026-10-21
- **Repository**: https://github.com/RetroF1M/RetroF1M-Expanded
- **Tasks**:
  - [x] Create setup instructions document
  - [x] Create repository on GitHub (using gh CLI)
  - [x] Add remote and push branches
  - [x] Set up branch structure (main, safe-original, development)
  - [x] Update README to reference new repository
  - [x] Add link back to original RetroF1M.github.io
- **Branches Created**:
  - main: Latest stable expanded build
  - safe-original: Protected reference to original safe build
  - development: Active development (current branch)
- **Working Branch**: development (contains all Phase 0 work)

### Phase 0.4: Documentation Updates ✅
- **Status**: COMPLETE
- **Date**: 2026-10-21
- **Tasks**:
  - [x] Create progress-tracking.md (this file)
  - [x] Update README.md with new repository context
  - [x] Update project-roadmap-1950-2026.md with refined phases
  - [x] Update project-state-and-handoff.md with current status
  - [x] Update boundary-experimental.md with proven vs unproven
  - [x] Update all tool READMEs

### Phase 0.5: Baseline Testing ✅
- **Status**: COMPLETE
- **Date**: 2026-10-21
- **Tasks**:
  - [x] Serve emulator locally (running on port 8000)
  - [x] Load seasons/f12023-boundary-experimental.sna
  - [x] Create automation script (tools/baseline-test-script.js)
  - [x] Script saves to repository for future use
  - [x] Run full 22-round season at 128x speed
  - [x] Document any crashes, corruption, or issues
  - [x] Establish working baseline
- **Automation Script**: `tools/baseline-test-script.js`
- **Test Results**:
  - **Total Time**: 90.7 seconds at 128x speed
  - **Rounds Completed**: 22/22 ✅
  - **Round Progression**: Perfect - all rounds transitioned correctly
  - **No Crashes**: Season completed successfully
- **Issues Found**:
  1. **Text Display Overflow**: "er laps" shown before race starts (lap count display corruption)
  2. **Points Cap at 255**: Driver and constructor points capped at 255, affecting final standings
- **Notes**:
  - Points cap is expected - this is the known byte overflow that Phase 3 (16-bit points) will fix
  - "er laps" issue needs investigation in display rendering code
  - Overall game flow works correctly through all 22 rounds

## Next Immediate Steps

1. **Phase 1.2**: Complete grid array grounding (6 to-ground items) (NEXT)
2. **Phase 3**: Manual 16-bit points relocation in 48K mode (instead of 128K)
3. **Investigate**: "er laps" display corruption issue (display rendering code)
4. **Investigate**: Tape save prompt hang - remove obsolete tape save mechanism

## Known Issues

### Current Snapshot (f12023-boundary-experimental.sna)
- **Status**: ✅ Baseline tested and working (22 rounds completed in 90.7s)
- **Issues**:
  - "er laps" display corruption (cosmetic)
  - Points cap at 255 (expected, to be fixed in Phase 3)
  - Tape save prompt hangs game (obsolete mechanism, needs removal)
- **Risk**: None currently known

### Grid Expansion
- **Status**: Planning phase only
- **Open Questions**:
  - Contiguous free RAM for ~450-520 byte relocation not yet found
  - 6 to-ground RAM variables not yet located
  - Display buffer capacity for paging not yet verified

### 128K Spectrum
- **Status**: Research phase
- **Open Questions**:
  - Can current 48K .sna be converted to 128K?
  - Does game code use banking?
  - Can we add banking support via patches?
  - Are there QAOP 128K compatibility issues?

## Technical Debt

### Documentation
- Some .md files may reference old approaches
- Need to ensure all docs synchronized with new plan
- Progress tracking needs to be maintained after each milestone

### Testing
- No automated test suite exists
- Need to establish QAOP automation patterns for each milestone
- Regression testing process needs formalization

## Risk Register

### High Risk
1. **128K Compatibility**: May not work with current snapshot or game logic
   - **Mitigation**: Have manual 16-bit relocation plan ready as fallback
   - **Status**: Not yet investigated

2. **Free RAM for Grid**: May not exist in 48K space for relocation
   - **Mitigation**: Investigate 128K upper banks, or aggressive compaction
   - **Status**: Not yet proven

### Medium Risk
1. **Display Paging**: Spectrum screen real estate limited
   - **Mitigation**: 6 cars per page, clear navigation
   - **Status**: Design complete, not yet implemented

2. **Historical Data**: Some early seasons have sparse records
   - **Mitigation**: Document gaps, use best-available data
   - **Status**: Future scope

## Decisions Made

### User Decisions
1. **128K Priority**: Investigate 128K first before grid work
2. **GitHub Repo Name**: RetroF1M-Expanded
3. **Display Paging**: 6 cars per page (5 pages for 26 cars)
4. **Season Priority**: Modern era (2000-2026) first
5. **Data Sources**: Research F1 data APIs for automation
6. **Testing**: Hands-off - use QAOP automation with 0-player mode
7. **Documentation**: Update .md files with all changes and progress
8. **Scope**: Make game work 100% before expanding scope

### Technical Decisions
1. **Testing Approach**: Full automated season runs for all milestones
2. **Progress Tracking**: Continuous .md updates to prevent losing track
3. **Scope Management**: Anti-scope creep rules enforced

## Blocked Items

None currently - all pending items are awaiting work or user approval.

## Notes

### Session Notes 2026-10-21
- Completed research of original game and QAOP emulator
- Created comprehensive documentation for both
- Next: Update remaining .md files, then baseline test
- GitHub repo setup requires user credentials/approval

### Previous Session Notes
- 22-round calendar previously proven through natural play (races 17-22)
- Grid expansion step 1 completed (site map + relocation plan)
- 6 to-ground items identified but not yet resolved
- Branch: boundary-grid-calendar-z80
- Protected: safe-build-pit-toggle-points (never touch)

## Verification Checklist

When completing milestones, use this checklist:

### Pre-Code Changes
- [ ] `node --check tools/*.mjs` for all modified tools
- [ ] Read-only disassembly analysis for Z80 changes
- [ ] Document exact RAM addresses and reference counts

### Post-Code Changes
- [ ] Patcher `verify` command for snapshot integrity
- [ ] QAOP boot smoke test
- [ ] Title screen visible and navigable
- [ ] Pit toggle still off by default and functional
- [ ] Select 0 players for automated testing
- [ ] Speed up to 32x for rapid progression
- [ ] **Complete automated season run** (not just first race)
- [ ] Monitor round byte progression to end of season
- [ ] Check for crashes, corruption, or unexpected behavior
- [ ] Verify points awarded correctly (inspect RAM)
- [ ] Verify standings display correctly
- [ ] Verify season loops to next season if applicable
- [ ] Document any anomalies with round numbers and observations

### Regression Testing
- [ ] Re-test all previous milestones after each change
- [ ] Ensure no regressions in menu navigation
- [ ] Ensure pit toggle still works
- [ ] Ensure display paging works if implemented

## References

### Plan Document
- Full plan: `C:\Users\ethan\.devin\plans\plan-0077d83eb19f82c1.md`

### Key Documentation
- Original game research: `docs/original-game-research.md`
- QAOP emulator research: `docs/qaop-emulator-research.md`
- Project roadmap: `docs/project-roadmap-1950-2026.md`
- Project state: `docs/project-state-and-handoff.md`
- Boundary experimental: `docs/boundary-experimental.md`
- Grid expansion plan: `docs/grid-expansion-new-variables-plan.md`
- Grid site map: `docs/race-grid-expansion-step1-sitemap.md`

### Tools
- qaop-spectrum-control skill: `C:\Users\ethan\.agents\skills\qaop-spectrum-control\SKILL.md`
