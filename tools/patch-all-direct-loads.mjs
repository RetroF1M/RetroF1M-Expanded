import { readFileSync, writeFileSync } from 'fs';

const snapshot = process.argv[2];
const data = Buffer.from(readFileSync(snapshot));

console.log("Patching all direct load instructions for 20-car expansion...\n");

const ram = data.subarray(0x1B);

// Address mappings
const MAPPINGS = {
  0x6991: 0xAA98, // car→driver map
  0x6979: 0xAA70, // car state A
  0x6985: 0xAA84, // car state B
  0x6A51: 0xAAB0  // car state 4
};

// Direct load instructions to patch
const DIRECT_LOADS = [
  { addr: 0xA4F4, old: 0x6991, new: 0xAA98 },
  { addr: 0xA55C, old: 0x6991, new: 0xAA98 },
  { addr: 0xABF5, old: 0x6991, new: 0xAA98 },
  { addr: 0xAD5F, old: 0x6991, new: 0xAA98 },
  { addr: 0xADA6, old: 0x6991, new: 0xAA98 },
  { addr: 0xB006, old: 0x6A51, new: 0xAAB0 },
  { addr: 0xB5BF, old: 0x6991, new: 0xAA98 },
  { addr: 0xBFB0, old: 0x6979, new: 0xAA70 },
  { addr: 0xBFE9, old: 0x6985, new: 0xAA84 },
  { addr: 0xC022, old: 0x6991, new: 0xAA98 },
  { addr: 0xC1D1, old: 0x6985, new: 0xAA84 },
  { addr: 0xC249, old: 0x6979, new: 0xAA70 },
  { addr: 0xC25F, old: 0x6985, new: 0xAA84 },
  { addr: 0xC2C9, old: 0x6979, new: 0xAA70 },
  { addr: 0xC2D0, old: 0x6985, new: 0xAA84 },
  { addr: 0xC2D7, old: 0x6991, new: 0xAA98 },
  { addr: 0xC793, old: 0x6985, new: 0xAA84 },
  { addr: 0xC799, old: 0x6A51, new: 0xAAB0 },
  { addr: 0xC79F, old: 0x6991, new: 0xAA98 },
  { addr: 0xC933, old: 0x6991, new: 0xAA98 },
  { addr: 0xC938, old: 0x6A51, new: 0xAAB0 },
  { addr: 0xC93C, old: 0x6985, new: 0xAA84 },
  { addr: 0xC940, old: 0x6979, new: 0xAA70 }
];

let patched = 0;

DIRECT_LOADS.forEach(ref => {
  const ramAddr = ref.addr - 0x4000 + 0x1B;
  const lowByte = ref.new & 0xFF;
  const highByte = (ref.new >> 8) & 0xFF;

  // Check for LD HL,addr (0x21 low high)
  if (ram[ramAddr] === 0x21 && ram[ramAddr + 1] === (ref.old & 0xFF) && ram[ramAddr + 2] === ((ref.old >> 8) & 0xFF)) {
    ram[ramAddr + 1] = lowByte;
    ram[ramAddr + 2] = highByte;
    patched++;
    console.log(`✓ Patched LD HL at 0x${ref.addr.toString(16).toUpperCase()}: 0x${ref.old.toString(16).toUpperCase()} -> 0x${ref.new.toString(16).toUpperCase()}`);
  }
  // Check for LD IX,addr (0xDD 0x21 low high)
  else if (ram[ramAddr] === 0xDD && ram[ramAddr + 1] === 0x21 && ram[ramAddr + 2] === (ref.old & 0xFF) && ram[ramAddr + 3] === ((ref.old >> 8) & 0xFF)) {
    ram[ramAddr + 2] = lowByte;
    ram[ramAddr + 3] = highByte;
    patched++;
    console.log(`✓ Patched LD IX at 0x${ref.addr.toString(16).toUpperCase()}: 0x${ref.old.toString(16).toUpperCase()} -> 0x${ref.new.toString(16).toUpperCase()}`);
  }
  // Check for LD IY,addr (0xFD 0x21 low high)
  else if (ram[ramAddr] === 0xFD && ram[ramAddr + 1] === 0x21 && ram[ramAddr + 2] === (ref.old & 0xFF) && ram[ramAddr + 3] === ((ref.old >> 8) & 0xFF)) {
    ram[ramAddr + 2] = lowByte;
    ram[ramAddr + 3] = highByte;
    patched++;
    console.log(`✓ Patched LD IY at 0x${ref.addr.toString(16).toUpperCase()}: 0x${ref.old.toString(16).toUpperCase()} -> 0x${ref.new.toString(16).toUpperCase()}`);
  }
  // Check for LD DE,addr (0x11 low high)
  else if (ram[ramAddr] === 0x11 && ram[ramAddr + 1] === (ref.old & 0xFF) && ram[ramAddr + 2] === ((ref.old >> 8) & 0xFF)) {
    ram[ramAddr + 1] = lowByte;
    ram[ramAddr + 2] = highByte;
    patched++;
    console.log(`✓ Patched LD DE at 0x${ref.addr.toString(16).toUpperCase()}: 0x${ref.old.toString(16).toUpperCase()} -> 0x${ref.new.toString(16).toUpperCase()}`);
  }
  else {
    console.log(`✗ Failed to patch at 0x${ref.addr.toString(16).toUpperCase()}: pattern not matched`);
  }
});

console.log(`\nPatched ${patched}/${DIRECT_LOADS.length} direct load instructions`);

writeFileSync(snapshot, data);
console.log(`\nPatched snapshot written to ${snapshot}`);
