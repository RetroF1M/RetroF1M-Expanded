# Original Formula One Game Research (1985 - BP Wheelhouse & George Munday)

## Game Overview
- **Title**: Formula One
- **Developers**: G.B. Munday, B.P. Wheelhouse
- **Publisher**: CRL Group PLC
- **Platform**: ZX Spectrum (48K)
- **Release**: 1985
- **Genre**: Sports management simulation
- **Modes**: Single-player, hotseat multiplayer (up to 6 players)

## Core Game Concept
The player is a Formula One team manager, not a driver. The game simulates running a team over a 16-race season (based on 1984 F1 calendar data). The goal is to win the Constructors' Championship and/or Drivers' Championship.

## Game Flow

### 1. Title Screen
- Load saved game (L key)
- Enable Kempston joystick (J key)
- Select number of players (0-6)
  - 0 = demonstration/spectator mode
  - 1-6 = human players managing teams
- Select CPU team difficulty (Novice to Expert, 5 levels)

### 2. Team Setup
Each player:
- Enters their name
- Chooses a team from 6 available: Brabham, Ferrari, Lotus, Williams, McLaren, Renault
- Chooses 2 sponsors from a list of 13
- Hires up to 2 drivers from a pool of 24 available drivers
- Drivers have skill levels and associated costs (better drivers = more expensive)
- Can change rookie driver names to play as a driver yourself

### 3. Car Preparation
Each car has 4 management bars that can be upgraded:
- **Driver**: Skill level (cannot be directly upgraded with funds, only by hiring better drivers or through race experience)
- **Power**: Engine performance
- **Car**: Chassis strength/reliability
- **Crew**: Pit crew speed

Plus an overall efficiency percentage.

**Upgrade Options** (selected with arrow keys):
- **B**: Buy new (replace current)
- **I**: Improve current
- **0**: Leave as-is

Amounts are entered in thousands of pounds.

**Balance**:
- More funds in engine + less in chassis = faster but fragile
- More funds in chassis + less in engine = slower but more reliable
- Crew investment = faster pit stops

If a car is not race-worthy, warning appears and it cannot race.

### 4. Race Day
**Pre-race**:
- Circuit card displayed showing: laps, lap record, previous year's winner
- Weather forecast shown
- Choose tyres from 5 options:
  - Slicks (soft, medium, hard compounds)
  - Intermediates
  - Rain (wet) tyres
- Grid display
- Race begins

**During Race**:
- View from grandstand (starting line perspective)
- Cars pass by every lap
- Timing board shows top 6 drivers with time differences
- Commentary line warns of: breakdowns, spins, punctures, weather changes
- Weather can change during race
- Accidents can occur
- Player can call pit stops or cars may come in automatically

**Race Controls**:
- **F**: Watch full race
- **H**: Watch highlights only
- **G**: Betting
- **P**: Call pit stop (with car number if 2 cars)
- **C**: Cancel pit stop
- **S**: Save game to tape (saved at end of race)

### 5. Pit Stops
When a car pits:
- Player controls one mechanic
- Must change 4 tyres one by one
- Then perform repairs if needed
- **Mechanic Controls**:
  - **Q**: Move up
  - **Z**: Move down
  - **I**: Move left
  - **P**: Move right
  - **N** (or fire): Carry out tyre change/repair
- Must position mechanic in front of each wheel
- Crew investment level determines mechanic movement speed
- Better positioning = faster tyre changes
- If multiplayer, each player handles their own pit stops

### 6. Post-Race
- Prize money awarded for participation
- Extra money for top finishes
- Sponsors contribute varying amounts
- Funds must be managed for:
  - Car repairs (if damaged)
  - Upgrades (engine, chassis, crew)
  - Hiring new drivers (if current injured or fired)
- Driver skill levels:
  - Increase after successful race finishes
  - Decrease after accidents/retirements
  - Reset to minimum if injured (marked injured for rest of season)

### 7. Season End
- Season continues to next race until all 16 completed
- Championships awarded (Drivers' and Constructors')
- New season begins automatically
- Cycle repeats (endless gameplay)

## Game Mechanics Details

### Management System
Four key management attributes:
1. **Driver Skill**: Dynamic, changes based on race results, injuries reset to minimum
2. **Engine (Power)**: Determines car speed and reliability
3. **Chassis (Car)**: Determines car durability
4. **Pit Crew**: Determines pit stop speed

**Budget Management**:
- Limited starting funds
- Prize money after each race
- Sponsor payments after each race
- Must balance: repairs, upgrades, driver hiring

### Weather System
- Weather forecast before each race
- Weather can change during race
- Tyre choice critical:
  - Slicks on wet track = cars off road
  - Must pit for wet tyres when rain starts
  - Drivers may pit themselves for tyre changes

### Damage System
- Cars can be damaged during race
- Can be destroyed in accidents
- Drivers can be injured
- Injured drivers = skill reset to minimum, out for season
- Damage costs money to repair

### Points System
- Points awarded for top finishes
- Amount varies by finishing position
- Used for championship standings
- Original 1984 system (need to verify exact values from game data)

## Controls Summary

### Menu Navigation
- **6**: Move arrow down (on team screens)
- **7**: Move arrow up (on team screens)
- **ENTER**: Confirm selection

### Car Preparation
- Arrow keys: Select management bar
- **B**: Buy new
- **I**: Improve
- **0**: Leave as-is

### Race Controls
- **F**: Full race
- **H**: Highlights
- **G**: Betting
- **P**: Pit stop (with car number if 2 cars)
- **C**: Cancel pit stop
- **S**: Save game

### Pit Stop Mechanic
- **Q**: Mechanic up
- **Z**: Mechanic down
- **I**: Mechanic left
- **P**: Mechanic right
- **N**: Perform tyre change/repair

### General
- **L**: Load saved game (title screen)
- **J**: Enable Kempston joystick (title screen)
- **T**: Print screen (where available)

## Technical Constraints (Original)

### Data Limits
- 6 teams (fixed)
- 13 sponsors (fixed)
- 24 drivers (fixed pool)
- 16 races (fixed calendar)
- 2 cars per team (fixed)
- 6 players maximum (hotseat)

### Display Limits
- Timing board shows top 6 only
- Grid display limited
- Championship standings display limited

### Known Issues from Original
- Menu arrow direction inverted in manual (6/7 reversed)
- All tracks have same start/finish line visually
- Weather changes can be sudden

## Data Sources (Original Game)
Based on 1984 F1 World Championship:
- 16 grands prix in order
- Lap counts per circuit
- Lap records
- Previous year's winners
- 24 drivers with accurate names (Lauda, Prost, Piquet, Senna, Mansell, etc.)
- Driver valuations based on real-world performance

## Expansion Implications

### What We're Changing
1. **Grid Size**: 6 teams × 2 cars = 12 cars → up to 13 teams × 2 cars = 26 cars
2. **Calendar**: 16 races → up to 22+ races
3. **Display**: Top 6 → paged display for up to 26 cars
4. **Points**: Byte totals (255 cap) → 16-bit totals
5. **Teams**: 6 fixed → up to 13 variable per season
6. **Sponsors**: 13 fixed → up to 26 (2 per team)
7. **Managers**: 6 fixed → up to 13

### What We're Preserving
- Original game flow and mechanics
- Management system (4 attributes)
- Pit stop mechanic gameplay
- Weather system
- Damage/injury system
- Championship structure
- Spectator mode (0 players)
- All original controls where applicable

### What Needs Careful Testing
- Timing board paging (ensure it works like original top-6 display)
- Pit stop handling for >2 cars per team
- Sponsor selection for >13 options
- Driver selection for >24 options
- Standings display for larger grids
- End-of-season screens with larger data sets

## Research Sources
- Wikipedia: Formula One (1985 video game)
- Turbo80: Formula One game review and history
- Original game inlays and manuals
- Spectrum Computing database
- Archive.org game entry

## Next Steps
1. Research QAOP emulator capabilities
2. Establish baseline test with current boundary-experimental snapshot
3. Verify all mechanics documented above work in current modified version
