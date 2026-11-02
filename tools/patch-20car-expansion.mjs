#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const SNA_HEADER = 27;
const RAM_BASE = 0x4000;

function off(addr) {
  return addr - RAM_BASE + SNA_HEADER;
}

async function main() {
  const [, , input, output] = process.argv;
  if (!input || !output) {
    console.log("Usage: node tools/patch-20car-expansion.mjs <input.sna> <output.sna>");
    process.exit(1);
  }

  const bytes = await readFile(input);
  const buffer = Buffer.from(bytes);

  console.log("=== 20-Car Expansion Patch ===\n");

  // Step 1: Expand teams table (static data)
  console.log("1. Expanding teams table (8→10 entries)");
  const teamsOffset = 12216;
  const teamsWidth = 8;
  const newTeams = ["AlphaT   ", "Williams ", "AlfaRomeo", "Haas     "];
  for (let i = 0; i < newTeams.length; i++) {
    const name = newTeams[i];
    const offset = teamsOffset + 8 * 8 + i * teamsWidth;
    for (let j = 0; j < teamsWidth; j++) {
      buffer[offset + j] = name.charCodeAt(j) || 0x20;
    }
  }
  console.log("   ✅ Added 4 team names");

  // Step 2: Expand managers table (static data)
  console.log("2. Expanding managers table (6→10 entries)");
  const managersOffset = 12286;
  const managersWidth = 10;
  const newManagers = ["Tost     ", "Capito    ", "Vasseur   ", "Steiner   "];
  for (let i = 0; i < newManagers.length; i++) {
    const name = newManagers[i];
    const offset = managersOffset + 6 * 10 + i * managersWidth;
    for (let j = 0; j < managersWidth; j++) {
      buffer[offset + j] = name.charCodeAt(j) || 0x20;
    }
  }
  console.log("   ✅ Added 4 manager names");

  // Step 3: Expand team active table
  console.log("3. Expanding team active table (6→10 bytes)");
  for (let i = 6; i < 10; i++) {
    buffer[off(0x701F + i)] = 0x01;
  }
  console.log("   ✅ Activated teams 6-9");

  // Step 4: Move special array from 0x692F to 0x6958
  console.log("4. Moving special array (0x692F → 0x6958)");
  const specialOld = off(0x692F);
  const specialNew = off(0x6958);
  const specialSize = 24;
  for (let i = 0; i < specialSize; i++) {
    buffer[specialNew + i] = buffer[specialOld + i];
  }
  console.log("   ✅ Moved 24 bytes");

  // Step 5: Expand points array (6→10 teams)
  console.log("5. Expanding points array (6→10 teams)");
  for (let i = 6; i < 10; i++) {
    buffer[off(0x6910 + i)] = 0x00;
  }
  console.log("   ✅ Added 4 bytes");

  // Step 6: Expand driver points array (24→40 bytes)
  console.log("6. Expanding driver points array (24→40 bytes)");
  for (let i = 24; i < 40; i++) {
    buffer[off(0x6948 + i)] = 0x00;
  }
  console.log("   ✅ Added 16 bytes");

  // Step 7: Expand special array (24→40 bytes)
  console.log("7. Expanding special array (24→40 bytes)");
  for (let i = 24; i < 40; i++) {
    buffer[specialNew + i] = 0x00;
  }
  console.log("   ✅ Added 16 bytes");

  // Step 8: Expand car arrays (12→20 bytes each)
  console.log("8. Expanding car arrays (12→20 bytes)");
  const carArrays = [0x6979, 0x6985, 0x6991, 0x6A51];
  for (const addr of carArrays) {
    for (let i = 12; i < 20; i++) {
      buffer[off(addr + i)] = 0x00;
    }
  }
  console.log("   ✅ Added 8 bytes × 4 arrays = 32 bytes");

  // Step 9: Update special array reference in code
  console.log("9. Updating special array references (0x692F → 0x6958)");
  const specialRefs = [0xC929, 0xC9B5, 0xCAA2, 0xCAF8, 0xCB36, 0xCED4, 0xCF5B, 0xCF8B, 0xCF93, 0xE634];
  for (const addr of specialRefs) {
    // Check if this is a LD HL,addr instruction (0x21 low high)
    if (buffer[off(addr)] === 0x21 && buffer[off(addr + 1)] === 0x2F && buffer[off(addr + 2)] === 0x69) {
      buffer[off(addr + 1)] = 0x58;
      buffer[off(addr + 2)] = 0x69;
      console.log(`   ✅ Updated 0x${addr.toString(16)}`);
    }
  }

  // Step 10: Patch loop counters
  console.log("10. Patching loop counters");
  buffer[off(0xC912 + 1)] = 0x0A; // 6 → 10 teams
  buffer[off(0xC936 + 1)] = 0x14; // 12 → 20 cars
  buffer[off(0xA4A6 + 1)] = 0x14; // 12 → 20 display
  buffer[off(0xA4B1 + 1)] = 0x14; // 12 → 20 comparison
  console.log("   ✅ Updated 4 counters");

  console.log("\n=== Complete ===");
  await writeFile(output, buffer);
  console.log(`✅ Saved to ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
