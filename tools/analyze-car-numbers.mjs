import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

// Look for car number patterns (1-44 in 2023 season)
// Search for sequences that could be car numbers
console.log("Searching for car number patterns (1-44)...");

// Search for common car number sequences
const patterns = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // sequential 1-12
  [1, 11, 16, 18, 14, 55, 20, 23, 3, 44, 63, 77, 10, 31, 27, 81, 22, 4, 24, 27], // 2023 pattern
];

for (const pattern of patterns) {
  console.log(`\nSearching for pattern: ${pattern.slice(0, 6).join(', ')}...`);
  for (let i = 0; i < ram.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (ram[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      console.log(`  Found at 0x${i.toString(16).toUpperCase()}`);
    }
  }
}

// Search for any ascending sequence of 12 bytes (could be car numbers)
console.log("\nSearching for any 12-byte ascending sequences...");
for (let i = 0; i < ram.length - 12; i++) {
  let ascending = true;
  for (let j = 1; j < 12; j++) {
    if (ram[i + j] <= ram[i + j - 1]) {
      ascending = false;
      break;
    }
  }
  if (ascending && ram[i] < 50) { // reasonable car number range
    console.log(`  Found at 0x${i.toString(16).toUpperCase()}: [${ram.slice(i, i + 12).join(', ')}]`);
  }
}

// Dump known car-related regions
console.log("\nDumping known car-related regions:");
console.log("\n0x6979 (Car state A):");
for (let i = 0; i < 12; i++) {
  console.log(`  Car ${i}: 0x${ram[0x6979 + i].toString(16).toUpperCase()} (${ram[0x6979 + i]})`);
}

console.log("\n0x6985 (Car state B):");
for (let i = 0; i < 12; i++) {
  console.log(`  Car ${i}: 0x${ram[0x6985 + i].toString(16).toUpperCase()} (${ram[0x6985 + i]})`);
}

console.log("\n0x6991 (Car→driver map):");
for (let i = 0; i < 12; i++) {
  console.log(`  Car ${i}: 0x${ram[0x6991 + i].toString(16).toUpperCase()} (${ram[0x6991 + i]})`);
}

console.log("\n0x6A51 (Car state 4):");
for (let i = 0; i < 12; i++) {
  console.log(`  Car ${i}: 0x${ram[0x6A51 + i].toString(16).toUpperCase()} (${ram[0x6A51 + i]})`);
}
