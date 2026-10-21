import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const addr = parseInt(process.argv[3], 16);

const data = readFileSync(snapshot);
const fileOffset = addr - 0x4000 + 0x1B;

console.log(`RAM address: 0x${addr.toString(16).toUpperCase()}`);
console.log(`File offset: 0x${fileOffset.toString(16).toUpperCase()} (${fileOffset})`);
console.log(`Byte at file offset: 0x${data[fileOffset].toString(16).toUpperCase()} (${data[fileOffset]})`);
console.log(`Expected (from disasm): 0x06`);
