import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

console.log("Searching for team-related data...\n");

// Dump manager name region (0x7000)
console.log("Manager name region (0x7000-0x7020):");
for (let i = 0; i < 32; i++) {
  const byte = ram[0x7000 + i];
  const ascii = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
  console.log(`  0x${(0x7000 + i).toString(16).toUpperCase()}: 0x${byte.toString(16).toUpperCase().padStart(2, '0')} (${byte.toString().padStart(3, ' ')}) '${ascii}'`);
}

// Dump team active table (0x701F)
console.log("\nTeam active table (0x701F):");
for (let i = 0; i < 8; i++) {
  const byte = ram[0x701F + i];
  console.log(`  Team ${i}: 0x${byte.toString(16).toUpperCase()} (${byte})`);
}

// Look for sponsor patterns (13 sponsors in canonical JSON)
console.log("\nSearching for sponsor data near team region...");
console.log("Sponsors region (0x8771-0x8790):");
for (let i = 0; i < 32; i++) {
  const byte = ram[0x8771 + i];
  const ascii = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
  console.log(`  0x${(0x8771 + i).toString(16).toUpperCase()}: 0x${byte.toString(16).toUpperCase().padStart(2, '0')} (${byte.toString().padStart(3, ' ')}) '${ascii}'`);
}

// Look for funds/balance data (16-bit)
console.log("\nSearching for 16-bit values that could be funds...");
console.log("Region near 0x8889 (documented as 'Current Balance'):");
for (let i = 0; i < 32; i++) {
  const addr = 0x8889 + i;
  const value = ram[addr];
  const ascii = (value >= 32 && value <= 126) ? String.fromCharCode(value) : '.';
  console.log(`  0x${addr.toString(16).toUpperCase()}: 0x${value.toString(16).toUpperCase().padStart(2, '0')} (${value.toString().padStart(3, ' ')}) '${ascii}'`);
}

// Look for upgrade levels
console.log("\nRegion near 0x8C6A (documented as 'Engine Chassis Crew'):");
for (let i = 0; i < 32; i++) {
  const addr = 0x8C6A + i;
  const value = ram[addr];
  const ascii = (value >= 32 && value <= 126) ? String.fromCharCode(value) : '.';
  console.log(`  0x${addr.toString(16).toUpperCase()}: 0x${value.toString(16).toUpperCase().padStart(2, '0')} (${value.toString().padStart(3, ' ')}) '${ascii}'`);
}

// Look for driver market region (0x72B9)
console.log("\nDriver market region (0x72B9-0x72D0):");
for (let i = 0; i < 32; i++) {
  const addr = 0x72B9 + i;
  const value = ram[addr];
  const ascii = (value >= 32 && value <= 126) ? String.fromCharCode(value) : '.';
  console.log(`  0x${addr.toString(16).toUpperCase()}: 0x${value.toString(16).toUpperCase().padStart(2, '0')} (${value.toString().padStart(3, ' ')}) '${ascii}'`);
}
