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
    console.log("Usage: node tools/patch-team-config-10teams.mjs <input.sna> <output.sna>");
    process.exit(1);
  }

  const bytes = await readFile(input);
  const buffer = Buffer.from(bytes);

  // Static data offsets from f1-season-tool.mjs
  // Teams: file offset 12216, RAM 0x6F7D, 8 teams × 8 chars = 64 bytes
  // Managers: file offset 12286, RAM 0x6FCB, 6 managers × 10 chars = 60 bytes

  // The teams table is just names (8 chars each). We need to expand this.
  // But the real team configuration (car numbers, sponsors) is NOT in this table.
  // We need to find where car numbers and sponsors are actually stored.

  // For now, let's just:
  // 1. Expand teams table from 8 to 10 entries (64 to 80 bytes)
  // 2. Expand managers table from 6 to 10 entries (60 to 100 bytes)
  // 3. Patch loop counters
  // 4. Expand team active table

  console.log("Expanding teams table from 8 to 10 entries...");
  const teamsOffset = 12216;
  const teamsWidth = 8;
  const newTeams = [
    "AlphaT   ",  // AlphaTauri
    "Williams ",  // Williams
    "AlfaRomeo",  // Alfa Romeo
    "Haas     ",  // Haas
  ];

  for (let i = 0; i < newTeams.length; i++) {
    const name = newTeams[i];
    const offset = teamsOffset + 8 * 8 + i * teamsWidth; // After existing 8 teams
    for (let j = 0; j < teamsWidth; j++) {
      buffer[offset + j] = name.charCodeAt(j) || 0x20;
    }
    console.log(`  Team ${8 + i}: "${name}" at offset ${offset}`);
  }

  console.log("\nExpanding managers table from 6 to 10 entries...");
  const managersOffset = 12286;
  const managersWidth = 10;
  const newManagers = [
    "Tost     ",  // AlphaTauri
    "Capito    ", // Williams
    "Vasseur   ", // Alfa Romeo
    "Steiner   ", // Haas
  ];

  for (let i = 0; i < newManagers.length; i++) {
    const name = newManagers[i];
    const offset = managersOffset + 6 * 10 + i * managersWidth; // After existing 6 managers
    for (let j = 0; j < managersWidth; j++) {
      buffer[offset + j] = name.charCodeAt(j) || 0x20;
    }
    console.log(`  Manager ${6 + i}: "${name}" at offset ${offset}`);
  }

  // Team active table at 0x701F (1 byte per team)
  // Expand from 6 to 10 bytes
  console.log("\nExpanding team active table at 0x701F from 6 to 10 bytes...");
  for (let i = 6; i < 10; i++) {
    buffer[off(0x701F + i)] = 0x01; // Activate new teams
    console.log(`  Team ${i} active flag set to 0x01`);
  }

  // Patch loop counters
  // 0xC912: LD B,0x06 → LD B,0x0A (6 → 10 teams)
  // 0xC936: LD B,0x0C → LD B,0x14 (12 → 20 cars)
  // 0xA4A6: LD B,0x0C → LD B,0x14 (12 → 20 display iterations)
  // 0xA4B1: CP 0x0C → CP 0x14 (12 → 20 comparison)

  console.log("\nPatching loop counters...");
  buffer[off(0xC912 + 1)] = 0x0A; // 6 → 10 teams
  console.log("  0xC912: LD B,0x06 → LD B,0x0A");

  buffer[off(0xC936 + 1)] = 0x14; // 12 → 20 cars
  console.log("  0xC936: LD B,0x0C → LD B,0x14");

  buffer[off(0xA4A6 + 1)] = 0x14; // 12 → 20 display iterations
  console.log("  0xA4A6: LD B,0x0C → LD B,0x14");

  buffer[off(0xA4B1 + 1)] = 0x14; // 12 → 20 comparison
  console.log("  0xA4B1: CP 0x0C → CP 0x14");

  await writeFile(output, buffer);
  console.log(`\n✅ Saved to ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
