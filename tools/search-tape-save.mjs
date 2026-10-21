import { readFileSync } from 'fs';

const snapshot = process.argv[2];
const data = readFileSync(snapshot);
const ram = data.subarray(0x1B);

console.log("Searching for tape-save prompt strings...\n");

const patterns = [
  "SAVE",
  "TAPE",
  "save",
  "tape",
  "RECORD",
  "record",
];

for (const pattern of patterns) {
  for (let i = 0; i < ram.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (ram[i + j] !== pattern.charCodeAt(j)) {
        match = false;
        break;
      }
    }
    if (match) {
      console.log(`Found "${pattern}" at 0x${i.toString(16).toUpperCase()}`);
      // Show context
      const start = Math.max(0, i - 20);
      const end = Math.min(ram.length, i + pattern.length + 20);
      console.log("Context:");
      for (let j = start; j < end; j++) {
        const ascii = (ram[j] >= 32 && ram[j] <= 126) ? String.fromCharCode(ram[j]) : '.';
        const marker = (j >= i && j < i + pattern.length) ? '>>>' : '   ';
        console.log(`  ${marker} 0x${j.toString(16).toUpperCase().padStart(4, '0')}: 0x${ram[j].toString(16).toUpperCase().padStart(2, '0')} (${ram[j].toString().padStart(3, ' ')}) '${ascii}'`);
      }
      console.log();
    }
  }
}
