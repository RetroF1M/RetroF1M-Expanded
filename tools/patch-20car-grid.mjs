import { readFileSync, writeFileSync } from 'fs';

const snapshot = process.argv[2];
const data = Buffer.from(readFileSync(snapshot));

// Current array locations
const OLD_ADDRESSES = {
  carStateA: 0x6979,
  carStateB: 0x6985,
  carDriverMap: 0x6991,
  carState4: 0x6A51
};

// New array locations (segmented at 0xAA70)
const NEW_ADDRESSES = {
  carStateA: 0xAA70,
  carStateB: 0xAA84,    // 0xAA70 + 20
  carDriverMap: 0xAA98, // 0xAA84 + 20
  carState4: 0xAAB0     // 0xAA98 + 20
};

// Reference sites to update (from z80-inspect.mjs refs output)
const REFERENCES = [
  { addr: 0xA4F5, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xA55D, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xABF7, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xAD5F, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xADA6, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xB007, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xB5C0, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xBFB1, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xBFEA, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xC023, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xC1BE, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xC1D2, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xC1E6, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xC24A, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xC260, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xC2CA, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xC2D1, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xC2D8, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xC78E, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xC794, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xC79A, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xC7A0, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xC934, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xC93A, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xC93E, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xC941, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xC98B, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xC996, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xC99D, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xC9C9, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xCAEE, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xCB04, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xCE70, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xCEA6, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xCF35, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xCF3B, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xCF41, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xCF7F, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xCFE2, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xD037, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xD046, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xD04B, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xD0C9, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xD44F, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xD481, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xD82D, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xDA92, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xDEF9, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xDF3C, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xDF95, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xDFE0, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xE02B, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xE11F, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xE13F, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xE151, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xE15F, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xE242, old: 0x6991, new: NEW_ADDRESSES.carDriverMap },
  { addr: 0xE260, old: 0x6979, new: NEW_ADDRESSES.carStateA },
  { addr: 0xE279, old: 0x6985, new: NEW_ADDRESSES.carStateB },
  { addr: 0xE292, old: 0x6A51, new: NEW_ADDRESSES.carState4 },
  { addr: 0xE61D, old: 0x6991, new: NEW_ADDRESSES.carDriverMap }
];

console.log("Patching 20-car grid arrays...\n");

const ram = data.subarray(0x1B);

// Update reference sites
let updated = 0;
REFERENCES.forEach(ref => {
  const ramAddr = ref.addr - 0x4000 + 0x1B;
  const lowByte = ref.new & 0xFF;
  const highByte = (ref.new >> 8) & 0xFF;

  // Check for LD HL,addr (0x21 low high)
  if (ram[ramAddr] === 0x21 && ram[ramAddr + 1] === (ref.old & 0xFF) && ram[ramAddr + 2] === ((ref.old >> 8) & 0xFF)) {
    ram[ramAddr + 1] = lowByte;
    ram[ramAddr + 2] = highByte;
    updated++;
    console.log(`Updated LD HL at 0x${ref.addr.toString(16).toUpperCase()}: 0x${ref.old.toString(16).toUpperCase()} -> 0x${ref.new.toString(16).toUpperCase()}`);
  }
  // Check for LD IX,addr (0xDD 0x21 low high)
  else if (ram[ramAddr] === 0xDD && ram[ramAddr + 1] === 0x21 && ram[ramAddr + 2] === (ref.old & 0xFF) && ram[ramAddr + 3] === ((ref.old >> 8) & 0xFF)) {
    ram[ramAddr + 2] = lowByte;
    ram[ramAddr + 3] = highByte;
    updated++;
    console.log(`Updated LD IX at 0x${ref.addr.toString(16).toUpperCase()}: 0x${ref.old.toString(16).toUpperCase()} -> 0x${ref.new.toString(16).toUpperCase()}`);
  }
  // Check for LD IY,addr (0xFD 0x21 low high)
  else if (ram[ramAddr] === 0xFD && ram[ramAddr + 1] === 0x21 && ram[ramAddr + 2] === (ref.old & 0xFF) && ram[ramAddr + 3] === ((ref.old >> 8) & 0xFF)) {
    ram[ramAddr + 2] = lowByte;
    ram[ramAddr + 3] = highByte;
    updated++;
    console.log(`Updated LD IY at 0x${ref.addr.toString(16).toUpperCase()}: 0x${ref.old.toString(16).toUpperCase()} -> 0x${ref.new.toString(16).toUpperCase()}`);
  }
  // Check for LD DE,addr (0x11 low high)
  else if (ram[ramAddr] === 0x11 && ram[ramAddr + 1] === (ref.old & 0xFF) && ram[ramAddr + 2] === ((ref.old >> 8) & 0xFF)) {
    ram[ramAddr + 1] = lowByte;
    ram[ramAddr + 2] = highByte;
    updated++;
    console.log(`Updated LD DE at 0x${ref.addr.toString(16).toUpperCase()}: 0x${ref.old.toString(16).toUpperCase()} -> 0x${ref.new.toString(16).toUpperCase()}`);
  }
  else {
    console.log(`WARNING: Reference at 0x${ref.addr.toString(16).toUpperCase()} does not match expected instruction pattern`);
    console.log(`  Bytes: ${ram[ramAddr].toString(16)} ${ram[ramAddr+1].toString(16)} ${ram[ramAddr+2].toString(16)} ${ram[ramAddr+3]?.toString(16) || 'N/A'}`);
  }
});

console.log(`\nUpdated ${updated}/${REFERENCES.length} reference sites\n`);

// Update initialization loop at 0xC936
// Change: LD B,0x0C (12 cars) -> LD B,0x14 (20 cars)
const initLoopAddr = 0xC936 - 0x4000 + 0x1B;
if (ram[initLoopAddr] === 0x0C) {
  ram[initLoopAddr] = 0x14; // 20 in decimal
  console.log(`Updated car initialization loop: 12 cars -> 20 cars at 0xC936`);
} else {
  console.log(`WARNING: Car initialization loop byte at 0xC936 is not 0x0C`);
}

// Update constructor points loop at 0xC912
// Change: LD B,0x06 (6 teams) -> LD B,0x0A (10 teams)
const constructorLoopAddr = 0xC912 - 0x4000 + 0x1B;
if (ram[constructorLoopAddr] === 0x06) {
  ram[constructorLoopAddr] = 0x0A; // 10 in decimal
  console.log(`Updated constructor points loop: 6 teams -> 10 teams at 0xC912`);
} else {
  console.log(`WARNING: Constructor points loop byte at 0xC912 is not 0x06`);
}

// Update driver points loop at 0xC91C
// Change: LD B,0x18 (24 bytes) -> LD B,0x28 (40 bytes for 20 drivers)
const driverPointsLoopAddr = 0xC91C - 0x4000 + 0x1B;
if (ram[driverPointsLoopAddr] === 0x18) {
  ram[driverPointsLoopAddr] = 0x28; // 40 in decimal
  console.log(`Updated driver points loop: 24 bytes -> 40 bytes at 0xC91C`);
} else {
  console.log(`WARNING: Driver points loop byte at 0xC91C is not 0x18`);
}

// Update the 4 load instructions in the car initialization loop
// 0xC933: LD HL,0x6991 -> LD HL,0xAA98
const carMapLoadAddr = 0xC933 - 0x4000 + 0x1B;
if (ram[carMapLoadAddr] === 0x21 && ram[carMapLoadAddr + 1] === 0x91 && ram[carMapLoadAddr + 2] === 0x69) {
  ram[carMapLoadAddr + 1] = 0x98;
  ram[carMapLoadAddr + 2] = 0xAA;
  console.log(`Updated car->driver map load: 0x6991 -> 0xAA98 at 0xC933`);
}

// 0xC938: LD IX,0x6A51 -> LD IX,0xAAB0
const carState4LoadAddr = 0xC938 - 0x4000 + 0x1B;
if (ram[carState4LoadAddr] === 0xDD && ram[carState4LoadAddr + 1] === 0x21 && ram[carState4LoadAddr + 2] === 0x51 && ram[carState4LoadAddr + 3] === 0x6A) {
  ram[carState4LoadAddr + 2] = 0xB0;
  ram[carState4LoadAddr + 3] = 0xAA;
  console.log(`Updated car state 4 load: 0x6A51 -> 0xAAB0 at 0xC938`);
}

// 0xC93C: LD IY,0x6985 -> LD IY,0xAA84
const carStateBLoadAddr = 0xC93C - 0x4000 + 0x1B;
if (ram[carStateBLoadAddr] === 0xFD && ram[carStateBLoadAddr + 1] === 0x21 && ram[carStateBLoadAddr + 2] === 0x85 && ram[carStateBLoadAddr + 3] === 0x69) {
  ram[carStateBLoadAddr + 2] = 0x84;
  ram[carStateBLoadAddr + 3] = 0xAA;
  console.log(`Updated car state B load: 0x6985 -> 0xAA84 at 0xC93C`);
}

// 0xC940: LD DE,0x6979 -> LD DE,0xAA70
const carStateALoadAddr = 0xC940 - 0x4000 + 0x1B;
if (ram[carStateALoadAddr] === 0x11 && ram[carStateALoadAddr + 1] === 0x79 && ram[carStateALoadAddr + 2] === 0x69) {
  ram[carStateALoadAddr + 1] = 0x70;
  ram[carStateALoadAddr + 2] = 0xAA;
  console.log(`Updated car state A load: 0x6979 -> 0xAA70 at 0xC940`);
}

// Write patched snapshot
writeFileSync(snapshot, data);
console.log(`\nPatched snapshot written to ${snapshot}`);
