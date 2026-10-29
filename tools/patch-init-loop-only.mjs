import { readFileSync, writeFileSync } from 'fs';

const snapshot = process.argv[2];
const data = Buffer.from(readFileSync(snapshot));

console.log("Patching initialization loop for 20-car expansion...\n");

const ram = data.subarray(0x1B);

// Target addresses for 20-car expansion
const NEW_ADDRESSES = {
  carStateA: 0xAA70,
  carStateB: 0xAA84,
  carDriverMap: 0xAA98,
  carState4: 0xAAB0
};

console.log("Updating car arrays loop (constructor/driver points skipped for now):");
console.log("  Car arrays: 12 cars -> 20 cars\n");

// Update car arrays loop at 0xC91C
const carLoopAddr = 0xC91C - 0x4000 + 0x1B;
if (ram[carLoopAddr] === 0x0C) {
  ram[carLoopAddr] = 0x14; // 20 in decimal
  console.log("✓ Updated car arrays loop: 12 -> 20 cars at 0xC91C");
} else {
  console.log(`✗ WARNING: Car arrays loop byte at 0xC91C is ${ram[carLoopAddr]}, expected 0x0C`);
}

console.log("\nUpdating array load instructions in init loop:");

// 0xC918: LD HL,0x6991 -> LD HL,0xAA98
const carMapLoadAddr = 0xC918 - 0x4000 + 0x1B;
if (ram[carMapLoadAddr] === 0x21 && ram[carMapLoadAddr + 1] === 0x91 && ram[carMapLoadAddr + 2] === 0x69) {
  ram[carMapLoadAddr + 1] = 0x98;
  ram[carMapLoadAddr + 2] = 0xAA;
  console.log("✓ Updated car→driver map load: 0x6991 -> 0xAA98 at 0xC918");
} else {
  console.log(`✗ WARNING: Car map load at 0xC918 is ${ram[carMapLoadAddr].toString(16)} ${ram[carMapLoadAddr+1].toString(16)} ${ram[carMapLoadAddr+2].toString(16)}, expected 21 91 69`);
}

// 0xC91D: LD IX,0x6A51 -> LD IX,0xAAB0
const carState4LoadAddr = 0xC91D - 0x4000 + 0x1B;
if (ram[carState4LoadAddr] === 0xDD && ram[carState4LoadAddr + 1] === 0x21 && ram[carState4LoadAddr + 2] === 0x51 && ram[carState4LoadAddr + 3] === 0x6A) {
  ram[carState4LoadAddr + 2] = 0xB0;
  ram[carState4LoadAddr + 3] = 0xAA;
  console.log("✓ Updated car state 4 load: 0x6A51 -> 0xAAB0 at 0xC91D");
} else {
  console.log(`✗ WARNING: Car state 4 load at 0xC91D is ${ram[carState4LoadAddr].toString(16)} ${ram[carState4LoadAddr+1].toString(16)} ${ram[carState4LoadAddr+2].toString(16)} ${ram[carState4LoadAddr+3].toString(16)}, expected DD 21 51 6A`);
}

// 0xC921: LD IY,0x6985 -> LD IY,0xAA84
const carStateBLoadAddr = 0xC921 - 0x4000 + 0x1B;
if (ram[carStateBLoadAddr] === 0xFD && ram[carStateBLoadAddr + 1] === 0x21 && ram[carStateBLoadAddr + 2] === 0x85 && ram[carStateBLoadAddr + 3] === 0x69) {
  ram[carStateBLoadAddr + 2] = 0x84;
  ram[carStateBLoadAddr + 3] = 0xAA;
  console.log("✓ Updated car state B load: 0x6985 -> 0xAA84 at 0xC921");
} else {
  console.log(`✗ WARNING: Car state B load at 0xC921 is ${ram[carStateBLoadAddr].toString(16)} ${ram[carStateBLoadAddr+1].toString(16)} ${ram[carStateBLoadAddr+2].toString(16)} ${ram[carStateBLoadAddr+3].toString(16)}, expected FD 21 85 69`);
}

// 0xC925: LD DE,0x6979 -> LD DE,0xAA70
const carStateALoadAddr = 0xC925 - 0x4000 + 0x1B;
if (ram[carStateALoadAddr] === 0x11 && ram[carStateALoadAddr + 1] === 0x79 && ram[carStateALoadAddr + 2] === 0x69) {
  ram[carStateALoadAddr + 1] = 0x70;
  ram[carStateALoadAddr + 2] = 0xAA;
  console.log("✓ Updated car state A load: 0x6979 -> 0xAA70 at 0xC925");
} else {
  console.log(`✗ WARNING: Car state A load at 0xC925 is ${ram[carStateALoadAddr].toString(16)} ${ram[carStateALoadAddr+1].toString(16)} ${ram[carStateALoadAddr+2].toString(16)}, expected 11 79 69`);
}

console.log("\nVerifying patched code:");
const initLoopStart = 0xC915 - 0x4000 + 0x1B;
const initLoopEnd = 0xC930 - 0x4000 + 0x1B;
console.log("Disassembling 0xC915-0xC930:");
for (let i = 0; i < (initLoopEnd - initLoopStart); i++) {
  const addr = 0xC915 + i;
  const byte = ram[initLoopStart + i];
  console.log(`  0x${addr.toString(16).toUpperCase()}: 0x${byte.toString(16).toUpperCase().padStart(2, '0')}`);
}

writeFileSync(snapshot, data);
console.log(`\nPatched snapshot written to ${snapshot}`);
console.log("\nNext: Boot and test to verify initialization works with 20 cars");
