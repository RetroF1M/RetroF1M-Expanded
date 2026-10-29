import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const data = readFileSync(snapshot);

console.log(`File size: ${data.length} bytes`);
console.log(`SNA header: ${data.length >= 27 ? 'present' : 'missing'}`);

const ram = data.subarray(0x1B);

console.log("\nChecking init loop at 0xC910-0xC960:");
for (let addr = 0xC910; addr < 0xC960; addr++) {
  const ramAddr = addr - 0x4000 + 0x1B;
  if (ramAddr < ram.length) {
    const byte = ram[ramAddr];
    console.log(`0x${addr.toString(16).toUpperCase()}: 0x${byte.toString(16).toUpperCase().padStart(2, '0')}`);
  }
}
