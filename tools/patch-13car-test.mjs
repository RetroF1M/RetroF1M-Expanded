import { readFileSync, writeFileSync } from 'fs';

const snapshot = process.argv[2];
const data = Buffer.from(readFileSync(snapshot));

const SNA_HEADER = 27;
const RAM_BASE = 0x4000;

function off(addr) {
  return addr - RAM_BASE + SNA_HEADER;
}

console.log("=== 13-Car Minimal Test ===");
console.log("Changing init loop counter from 12 to 13 cars");
console.log("NOT relocating arrays - just changing the counter\n");

// Change car loop counter at 0xC936 from 0x0C (12) to 0x0D (13)
const carLoopAddr = off(0xC936);
const oldByte = data[carLoopAddr];
data[carLoopAddr] = 0x0D;

console.log(`✓ Changed 0xC936 from 0x${oldByte.toString(16)} to 0x0D (13 cars)`);

writeFileSync(snapshot, data);
console.log(`\nPatched snapshot written to ${snapshot}`);
console.log("\nTest this in QAOP:");
console.log("1. Load the snapshot");
console.log("2. Select 0 players");
console.log("3. Observe if game crashes or behaves correctly");
console.log("4. Check if 13th car data is initialized (arrays may have 13th byte)");
