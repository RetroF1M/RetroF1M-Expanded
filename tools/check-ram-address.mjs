import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const ramAddr = parseInt(process.argv[3], 16);

const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

const arrayOffset = ramAddr - 0x4000;
console.log(`RAM address: 0x${ramAddr.toString(16).toUpperCase()}`);
console.log(`Array offset: 0x${arrayOffset.toString(16).toUpperCase()} (${arrayOffset})`);
console.log(`Byte at array offset: 0x${ram[arrayOffset].toString(16).toUpperCase()} (${ram[arrayOffset]})`);
