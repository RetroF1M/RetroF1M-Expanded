import { readFileSync, writeFileSync } from 'fs';

const snapshot = process.argv[2];
const data = Buffer.from(readFileSync(snapshot));

const SNA_HEADER = 27;
const RAM_BASE = 0x4000;

function off(addr) {
  return addr - RAM_BASE + SNA_HEADER;
}

console.log("=== 20-Car Complete Patch ===");
console.log("10 teams already added to season data\n");

// 1. Constructor points loop (determines team count)
const constAddr = off(0xC912);
data[constAddr] = 0x0A;
console.log("✓ Constructor loop 0xC912: 6 → 10 teams");

// 2. Init loop counter (cars)
const initAddr = off(0xC936);
data[initAddr] = 0x14;
console.log("✓ Init loop 0xC936: 12 → 20 cars");

// 3. Display loop counter
const dispAddr = off(0xA4A6);
data[dispAddr] = 0x14;
console.log("✓ Display loop 0xA4A6: 12 → 20 cars");

// 4. Display check
const checkAddr = off(0xA4B1);
data[checkAddr] = 0x14;
console.log("✓ Display check 0xA4B1: 12 → 20 cars");

writeFileSync(snapshot, data);
console.log(`\nPatched snapshot written to ${snapshot}`);
console.log("\nChanges:");
console.log("- Season data: 6 → 10 teams");
console.log("- Init loop: 12 → 20 cars");
console.log("- Display loop: 12 → 20 cars");
console.log("- Display check: 12 → 20 cars");
console.log("\nArrays extend in-place using existing gaps - no relocation needed");
