import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const start = parseInt(process.argv[3], 16);
const end = parseInt(process.argv[4], 16);

const data = readFileSync(snapshot);
// SNA header is 27 bytes, actual RAM starts at offset 0x1B
const ram = data.subarray(0x1B);

console.log(`RAM dump from 0x${start.toString(16).toUpperCase()} to 0x${end.toString(16).toUpperCase()}:`);
for (let addr = start; addr <= end; addr++) {
  const byte = ram[addr];
  const ascii = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
  console.log(`0x${addr.toString(16).toUpperCase().padStart(4, '0')}: 0x${byte.toString(16).toUpperCase().padStart(2, '0')} (${byte.toString().padStart(3, ' ')}) '${ascii}'`);
}
