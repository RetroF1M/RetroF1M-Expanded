import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

console.log("Investigating 128K banking feasibility for grid arrays...\n");

// 128K Spectrum memory layout:
// Banks 0-2: 16KB each (ROM in bank 0, RAM 0x4000-0x7FFF in banks 1-2)
// Banks 3-7: 16KB each (RAM at 0xC000-0xFFFF when selected)
// Current game likely uses bank 1 for variables (0x4000-0x7FFF)

console.log("Checking if upper memory banks are accessible at game start:");
console.log("Upper memory region: 0xC000-0xFFFF (banks 3-7)\n");

// Check if upper memory is zeroed (might be uninitialized)
let upperZero = true;
for (let addr = 0xC000; addr < 0xC100; addr++) {
  if (ram[addr] !== 0) {
    upperZero = false;
    break;
  }
}

console.log(`Upper memory (0xC000-0xC0FF) is ${upperZero ? 'zeroed' : 'non-zero'}`);

if (upperZero) {
  console.log("Upper memory appears unused - good candidate for grid arrays!");
  console.log("Available space: 16KB per bank (banks 3-7 = 80KB total)");
  console.log("Required for 26-car grid: ~450 bytes");
  console.log("Plethora of space available!\n");
}

console.log("Challenges to consider:");
console.log("1. Game code may need bank-switching instructions to access upper memory");
console.log("2. Current Z80 code may assume all data in 0x4000-0x7FFF");
console.log("3. Need to verify which memory model the game uses (normal 48K vs 128K)");
console.log("4. Need to find bank-select port and mechanism\n");

console.log("Alternative: Use upper memory without bank switching?");
console.log("If game runs in 128K mode with upper memory always mapped, we can:");
console.log("- Relocate grid arrays to 0xC000+");
console.log("- Update all reference sites to use new addresses");
console.log("- No bank switching needed if upper memory is always accessible\n");

console.log("Next steps:");
console.log("1. Test if upper memory (0xC000+) is always accessible in QAOP 128K mode");
console.log("2. If yes, proceed with relocation to upper memory for 26-car support");
console.log("3. If no, need to implement bank-switching in game code");
