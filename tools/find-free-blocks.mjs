import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

console.log("Searching for contiguous free RAM blocks (0-filled regions)...\n");

const searchStart = 0x5000; // Start search after low memory
const searchEnd = 0xC000; // End before screen area

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

// Catch any trailing block
if (blockStart !== -1 && blockSize >= 32) {
  blocks.push({ start: blockStart, size: blockSize });
}

console.log(`Found ${blocks.length} free blocks (≥32 bytes):\n`);
blocks.forEach(block => {
  console.log(`  0x${block.start.toString(16).toUpperCase().padStart(4, '0')} - 0x${(block.start + block.size - 1).toString(16).toUpperCase().padStart(4, '0')} (${block.size} bytes)`);
});

console.log("\nFiltering for blocks ≥ 450 bytes (minimum required for grid cluster):");
const largeBlocks = blocks.filter(b => b.size >= 450);
if (largeBlocks.length === 0) {
  console.log("  No blocks >= 450 bytes found!");
  console.log("\nAlternative: Combine adjacent smaller blocks?");
  console.log("  Looking for blocks >= 200 bytes...");
  const mediumBlocks = blocks.filter(b => b.size >= 200);
  console.log(`  Found ${mediumBlocks.length} blocks ≥ 200 bytes:`);
  mediumBlocks.forEach(block => {
    console.log(`    0x${block.start.toString(16).toUpperCase().padStart(4, '0')} - 0x${(block.start + block.size - 1).toString(16).toUpperCase().padStart(4, '0')} (${block.size} bytes)`);
  });
} else {
  largeBlocks.forEach(block => {
    console.log(`  0x${block.start.toString(16).toUpperCase().padStart(4, '0')} - 0x${(block.start + block.size - 1).toString(16).toUpperCase().padStart(4, '0')} (${block.size} bytes)`);
  });
}
