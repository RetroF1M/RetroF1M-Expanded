import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

console.log("Searching for free RAM blocks >= 100 bytes (0x6560-0xC000)...\n");

const searchStart = 0x6560;
const searchEnd = 0xC000;

let blocks = [];
let blockStart = -1;
let blockSize = 0;

for (let addr = searchStart; addr < searchEnd; addr++) {
  if (ram[addr] === 0) {
    if (blockStart === -1) {
      blockStart = addr;
      blockSize = 1;
    } else {
      blockSize++;
    }
  } else {
    if (blockStart !== -1 && blockSize >= 32) {
      blocks.push({ start: blockStart, size: blockSize });
    }
    blockStart = -1;
    blockSize = 0;
  }
}

if (blockStart !== -1 && blockSize >= 32) {
  blocks.push({ start: blockStart, size: blockSize });
}

const blocks100 = blocks.filter(b => b.size >= 100);
console.log(`Found ${blocks100.length} blocks >= 100 bytes:\n`);
blocks100.forEach(block => {
  console.log(`  0x${block.start.toString(16).toUpperCase().padStart(4, '0')} - 0x${(block.start + block.size - 1).toString(16).toUpperCase().padStart(4, '0')} (${block.size} bytes)`);
});

if (blocks100.length === 0) {
  console.log("\nNo blocks >= 100 bytes found.");
  console.log("Available blocks (sorted by size):");
  blocks.sort((a, b) => b.size - a.size).slice(0, 10).forEach(block => {
    console.log(`  0x${block.start.toString(16).toUpperCase().padStart(4, '0')} - 0x${(block.start + block.size - 1).toString(16).toUpperCase().padStart(4, '0')} (${block.size} bytes)`);
  });
}
