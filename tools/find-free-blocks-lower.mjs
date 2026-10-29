import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

console.log("Searching for free RAM blocks in lower memory (0x5000-0x6000)...\n");

const searchStart = 0x5000;
const searchEnd = 0x6000;

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

console.log(`Found ${blocks.length} free blocks (≥32 bytes):\n`);
blocks.forEach(block => {
  console.log(`  0x${block.start.toString(16).toUpperCase().padStart(4, '0')} - 0x${(block.start + block.size - 1).toString(16).toUpperCase().padStart(4, '0')} (${block.size} bytes)`);
});

const largeBlocks = blocks.filter(b => b.size >= 200);
console.log(`\nBlocks >= 200 bytes: ${largeBlocks.length}`);
largeBlocks.forEach(block => {
  console.log(`  0x${block.start.toString(16).toUpperCase().padStart(4, '0')} - 0x${(block.start + block.size - 1).toString(16).toUpperCase().padStart(4, '0')} (${block.size} bytes)`);
});
