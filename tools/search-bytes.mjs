import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const byteValue = parseInt(process.argv[3], 16); // hex byte to search for

const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

console.log(`Searching for byte 0x${byteValue.toString(16).toUpperCase()} in ${snapshot}...`);

const results = [];
for (let i = 0; i < ram.length; i++) {
  if (ram[i] === byteValue) {
    results.push(i);
  }
}

console.log(`Found ${results.length} occurrences at:`);
// Show in groups of 20
for (let i = 0; i < results.length; i += 20) {
  const group = results.slice(i, i + 20);
  console.log(group.map(addr => `0x${addr.toString(16).toUpperCase()}`).join(', '));
}
