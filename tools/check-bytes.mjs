import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const start = parseInt(process.argv[3], 16);
const end = parseInt(process.argv[4], 16);

const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

console.log(`Checking ${snapshot} from 0x${start.toString(16).toUpperCase()} to 0x${end.toString(16).toUpperCase()}:`);

for (let addr = start; addr <= end; addr++) {
  const ramAddr = addr - 0x4000 + 0x1B;
  if (ramAddr >= 0 && ramAddr < ram.length) {
    const byte = ram[ramAddr];
    console.log(`0x${addr.toString(16).toUpperCase()}: 0x${byte.toString(16).toUpperCase().padStart(2, '0')} (${byte})`);
  } else {
    console.log(`0x${addr.toString(16).toUpperCase()}: OUT OF RANGE`);
  }
}
