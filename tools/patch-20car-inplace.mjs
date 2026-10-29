import { readFileSync, writeFileSync } from 'fs';

const snapshot = process.argv[2];
const data = Buffer.from(readFileSync(snapshot));

const SNA_HEADER = 27;
const RAM_BASE = 0x4000;

function off(addr) {
  return addr - RAM_BASE + SNA_HEADER;
}

console.log("=== 20-Car In-Place Expansion ===");
console.log("Strategy: Extend arrays in place using existing gaps");
console.log("No address relocation needed!\n");

// Change car loop counter at 0xC936 from 0x0C (12) to 0x14 (20)
const carLoopAddr = off(0xC936);
const oldByte = data[carLoopAddr];
data[carLoopAddr] = 0x14;

console.log(`✓ Changed 0xC936 from 0x${oldByte.toString(16)} to 0x14 (20 cars)`);
console.log("\nArray layout:");
console.log("  0x6979: Car state A (12→20 bytes, uses 6-byte gap)");
console.log("  0x6985: Car state B (12→20 bytes, uses 6-byte gap)");
console.log("  0x6991: Car→driver map (12→20 bytes, uses 180-byte gap)");
console.log("  0x6A51: Car state 4 (12→20 bytes, extends into 0xFF padding)");

writeFileSync(snapshot, data);
console.log(`\nPatched snapshot written to ${snapshot}`);
console.log("\nTest this in QAOP:");
console.log("1. Load the snapshot");
console.log("2. Select 0 players");
console.log("3. Check if game handles 20 cars correctly");
