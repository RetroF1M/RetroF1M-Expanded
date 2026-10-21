# QAOP Emulator Research

## Overview
QAOP/JS is a Sinclair ZX Spectrum emulator written in JavaScript by Jan Bobrowski. It runs directly in web browsers and emulates both 48K and 128K Spectrum models.

**Official Sources**:
- Primary: https://torinak.com/qaop
- GitHub: https://github.com/eldevelopo/qaop
- Info page: https://torinak.com/qaop/about

## Supported Models
- **Spectrum 48K** (default)
- **Spectrum 128K** (selectable via URL parameter)
- **Timex TC2048** (experimental, HiRes not supported)
- **Pentagon 128** (selectable)

## URL Parameters

### Model Selection
- `#48` - Select Spectrum 48K (default)
- `#128` - Select Spectrum 128K
- `#~128` - Switch back to 48K from 128K
- `#tc2048` - Timex TC2048 mode
- `#pentagon` - Pentagon 128

### File Loading
- `#l=URL` - Load program (TAP, Z80, SNA, ROM, MDR, TRD) or screen
- `#t=URL` - Insert tape (but do not load)
- `#u=URL` - Load list of programs (plain text or HTML)

### Features
- `#ay` - Enable AY sound chip even in 48K mode
- `#~ay` - Disable AY
- `#kj` - Emulate Kempston Joystick (arrows + Ctrl)
- `#if1` - Emulate Interface 1
- `#beta` - Emulate Beta 128 interface (experimental)

**Note**: Prefix boolean flags with `!` or `~` to turn off.

### CORS Requirement
All loaded resources must have CORS header: `Access-Control-Allow-Origin: *`

## Supported File Formats

### Content-Types
- `application/x.zx.rom` - ROM image
- `application/x.zx.tap` - TAP tape file
- `application/x.zx.sna` - SNA snapshot
- `application/x.zx.z80` - Z80 snapshot
- `application/x.zx.mdr` - Microdrive cartridge
- `application/x.zx.trd` - Floppy image (TR-DOS)
- `image/x.zx.scr` - Screen dump

### SNA Snapshot Format Details
- Byte 26, bit 6: Border - if set, enable AY

### Z80 Snapshot Format Details
- Byte 37, bit 0: R register emulation - if reset, randomize lower 7 bits
- Byte 28: IFF2 - 0x76 indicates CPU halt
- Byte 58: Spectator flags - if DD, F3, FB, FD, resume after prefix

## JavaScript API

### Main Emulator Object
```javascript
const emu = window.emu;      // emulator handle
const zx  = emu.zx;          // ZX Spectrum core
```

### Keyboard Input (CRITICAL)
**IMPORTANT**: QAOP does NOT respond to synthetic DOM key events (like those from browser automation tools). Keys must be injected through the emulator's own function.

```javascript
// Press + release a key. Note the bitwise-NOT on the ASCII code.
emu.kbd(~ascii, true,  0);   // key down
emu.kbd(~ascii, false, 0);   // key up
```

**Parameters**:
- `ascii`: ASCII code, passed as `~ascii` (bitwise complement)
- `isDown`: true for key down, false for key up
- Third parameter: always 0

**Hold Time**: ~100-150ms between down/up for the game to latch the keypress.

**Common Key Codes**:
- Enter = 13
- Digits '0'-'9' = 48-57
- Space = 32

**Helper Function**:
```javascript
const tap = (code, hold = 120) => {
  emu.kbd(~code, true, 0);
  setTimeout(() => emu.kbd(~code, false, 0), hold);
};
```

### Speed Control
```javascript
emu.getState().speed        // read current speed (e.g., 1, 8, 16, 32)
emu.setState({ speed: N }); // set speed; 1 = real time
```

Speed multipliers allow accelerated testing (32x for rapid season progression).

### Memory Access
```javascript
zx.get(addr)     // read one byte (addr as hex number)
zx.get16(addr)   // read 16-bit word
zx.put(addr, v)  // write one byte (for probe testing only)
```

### State Object
The state object also exposes:
- CPU registers: `pc`, `sp`, `a`, `bc`, `hl`, `ix`, `iy`, etc.
- `time` - emulation time
- `frt` - frame timing

## RetroF1M-Specific Memory Locations

### Round Counter
**Current race/round number**: `0x6BB2` (1-based)
```javascript
zx.get(0x6BB2)   // Returns 1..22 for boundary-experimental calendar
```

### Circuit Tables (Relocated)
**Boundary-experimental calendar** starts at: `0x613C`
Each round's slot holds distinct bytes for:
- Lap count
- Lap record
- Track length
- Circuit name
- etc.

Original (pre-relocation) area: `0x6AD5`

## Automation Pattern for Testing

### Speed Up to Target Round
The game only advances between races when it reads an Enter key. To automate testing:

```javascript
async () => {
  const emu = window.emu, zx = emu.zx;
  const ROUND = 0x6BB2, TARGET = 22;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  emu.setState({ speed: 32 });
  const trace = [], t0 = performance.now();
  let last = zx.get(ROUND), reached = false;
  const mark = v => trace.push({ t: +((performance.now()-t0)/1000).toFixed(1), round: v });
  mark(last);
  for (let i = 0; i < 400; i++) {           // ~24s budget
    await sleep(60);
    const r = zx.get(ROUND);
    if (r !== last) { last = r; mark(r); if (r === TARGET) { reached = true; break; } }
    if (i % 12 === 0) { emu.kbd(~13, true, 0); await sleep(60); emu.kbd(~13, false, 0); }
  }
  emu.setState({ speed: 1 });               // ALWAYS snap back to 1x
  return { reached, last, trace, speedNow: emu.getState().speed };
}
```

**Key Points**:
- Crank speed to 32x
- Tap Enter periodically to advance menus
- Monitor round byte at `0x6BB2`
- When target reached, snap back to 1x
- Keep entire loop in ONE `evaluate_script` call to prevent overshoot

## Keyboard Controls (Game Keys)

### Spectrum Keys Mapped to PC
- **Shift**: Caps Shift
- **Ctrl, Alt**: Symbol Shift
- **Tab**: Extended Mode
- **Home**: Edit
- **Del**: Reset, restart

### Function Keys
- **F1**: Info page
- **F2**: Remember state (save)
- **F3**: Recall state (load)
- **F6**: CRT distortion
- **F7**: Black & white
- **F8**: Keyboard layout
- **F9**: Toggle menus
- **F10**: Mute
- **F11**: Fullscreen
- **Pause**: Pause
- **PgUp/PgDn**: Change volume
- **Insert**: Games page

### File Operations
- **Ctrl+O**: Open file (when paused)
- **Ctrl+S**: Save file (when paused)

## 128K Spectrum Considerations

### Memory Banking
The 128K Spectrum has memory banks that can be switched. This is critical for the 16-bit points investigation:
- **48K mode**: Single 64K address space (16K ROM + 48K RAM)
- **128K mode**: 128K RAM divided into 8 banks of 16K each
- Banking controlled by port writes
- Lower 16K always contains ROM
- Upper 16K can be switched between banks

### Implications for RetroF1M
**Potential Benefits**:
- Points arrays could be relocated to upper memory banks
- 16-bit values would naturally fit
- More RAM available for expanded data structures

**Potential Issues**:
- Current `.sna` files are 48K format
- Would need conversion to 128K format
- Game code may not use banking (would need patches)
- Z80 code would need to handle bank switching
- QAOP 128K mode may have compatibility issues

**Investigation Needed**:
1. Can current 48K `.sna` be converted to 128K?
2. Does the game's Z80 code use any banking?
3. Can we add banking support via patches?
4. Are there known issues with QAOP 128K mode?

## Serving Locally

### Python HTTP Server
```bash
python -m http.server 8000
```

From repo root: `D:\OpenCode Projects\RETROF1M`

### Loading Snapshots
Via URL hash:
```
http://127.0.0.1:8000/emulator.html#/seasons/f12023-boundary-experimental.sna
```

Default (no hash):
```
http://127.0.0.1:8000/emulator.html
```
Auto-loads `seasons/f12023-modern.sna`

## Pit Stop Key Remap (RetroF1M Wrapper)

The RetroF1M `emulator.html` includes a custom pit-stop key remap wrapper:

**Mapping** (when enabled):
- Left arrow → Q
- Down arrow → Z
- Up arrow → I
- Right arrow → P
- Enter → N

**Activation**:
- Off by default
- Toggle via "Pit keys" button
- Only active in full-screen play mode
- Ignored when:
  - QAOP menu is open
  - Browser text control has focus
  - Ctrl/Alt/Meta modifiers held

**Implementation**:
```javascript
function sendKey(keyCode, isDown) {
  if (window.emu && typeof window.emu.kbd === "function") {
    window.emu.kbd(~keyCode, isDown, 0);
  }
}
```

## Limitations and Known Issues

### Input Limitations
- Synthetic DOM key events don't work (use `window.emu.kbd()`)
- Browser `press_key` tools don't reach the emulator
- Must use proper key injection with bitwise-NOT on ASCII codes

### Performance
- Speed multipliers up to 32x available
- Higher speeds may miss rapid key sequences
- Balance between speed and reliability needed for automation

### Memory Inspection
- `zx.put()` available but should only be used for probe testing
- Never use `zx.put()` to skip game progression (violates natural testing)

### 128K Mode
- Banking adds complexity
- Not all games support it
- May require significant Z80 patches

## Best Practices for RetroF1M Testing

### 1. Always Use 0-Player Mode
Select "0" on the player count screen for automated spectator mode. This:
- Eliminates need for manual driving
- Allows full season automation
- Reduces testing time significantly

### 2. Speed Control Pattern
```javascript
// Speed up for progression
emu.setState({ speed: 32 });

// When approaching target, slow down
emu.setState({ speed: 1 });
```

### 3. Key Injection Pattern
```javascript
// Always use ~ascii
emu.kbd(~13, true, 0);   // Enter down
await sleep(120);
emu.kbd(~13, false, 0);  // Enter up
```

### 4. Memory Monitoring
```javascript
// Monitor round progression
const round = zx.get(0x6BB2);
if (round === target) {
  // Take action
}
```

### 5. Natural Progression Only
- Never use `zx.put()` to set round byte
- Never skip game states synthetically
- Always progress through Enter key presses
- This ensures real runtime behavior

## Integration with qaop-spectrum-control Skill

The local skill at `C:\Users\ethan\.agents\skills\qaop-spectrum-control\SKILL.md` provides:
- Pre-tested automation patterns
- Helper functions for common tasks
- Round monitoring
- Speed control wrappers
- Key injection helpers

**Use this skill** when automating QAOP for:
- Speeding up the emulator
- Pressing keys in the game
- Monitoring which race/round is on
- Playing through to specific rounds
- Running round-17/end-of-season boundary tests

## Research Sources
- QAOP/JS official documentation: https://torinak.com/qaop/about
- GitHub repository: https://github.com/eldevelopo/qaop
- qaop-spectrum-control skill: `C:\Users\ethan\.agents\skills\qaop-spectrum-control\SKILL.md`
- RetroF1M emulator.html implementation
- Project documentation: `docs/project-state-and-handoff.md`

## Next Steps
1. Test 128K mode with current snapshot to assess compatibility
2. Test memory banking for potential 16-bit points solution
3. Establish baseline automated test with current boundary-experimental
4. Document any 128K-specific limitations found
