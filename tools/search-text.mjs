import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const searchText = process.argv[3].toUpperCase();

const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

console.log(`Searching for "${searchText}" in ${snapshot}...`);

const searchBytes = [];
for (let i = 0; i < searchText.length; i++) {
  searchBytes.push(searchText.charCodeAt(i));
}

for (let i = 0; i < ram.length - searchBytes.length; i++) {
  let match = true;
  for (let j = 0; j < searchBytes.length; j++) {
    if (ram[i + j] !== searchBytes[j]) {
      match = false;
      break;
    }
  }
  if (match) {
    console.log(`Found at RAM address: 0x${i.toString(16).toUpperCase()}`);
    // Show context
    const contextStart = Math.max(0, i - 20);
    const contextEnd = Math.min(ram.length, i + searchBytes.length + 20);
    console.log('Context:');
    for (let addr = contextStart; addr < contextEnd; addr++) {
      const byte = ram[addr];
      const ascii = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
      const marker = (addr >= i && addr < i + searchBytes.length) ? '>>>' : '   ';
      console.log(`${marker} 0x${addr.toString(16).toUpperCase().padStart(4, '0')}: 0x${byte.toString(16).toUpperCase().padStart(2, '0')} (${byte.toString().padStart(3, ' ')}) '${ascii}'`);
    }
  }
}
