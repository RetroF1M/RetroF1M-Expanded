import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const snapshot = process.argv[2];

const REFERENCES = [
  { addr: 0xA4F5, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xA55D, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xABF7, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xAD5F, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xADA6, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xB007, array: 0x6A51, name: 'carState4' },
  { addr: 0xB5C0, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xBFB1, array: 0x6979, name: 'carStateA' },
  { addr: 0xBFEA, array: 0x6985, name: 'carStateB' },
  { addr: 0xC023, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xC1BE, array: 0x6979, name: 'carStateA' },
  { addr: 0xC1D2, array: 0x6985, name: 'carStateB' },
  { addr: 0xC1E6, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xC24A, array: 0x6979, name: 'carStateA' },
  { addr: 0xC260, array: 0x6985, name: 'carStateB' },
  { addr: 0xC2CA, array: 0x6979, name: 'carStateA' },
  { addr: 0xC2D1, array: 0x6985, name: 'carStateB' },
  { addr: 0xC2D8, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xC78E, array: 0x6979, name: 'carStateA' },
  { addr: 0xC794, array: 0x6985, name: 'carStateB' },
  { addr: 0xC79A, array: 0x6A51, name: 'carState4' },
  { addr: 0xC7A0, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xC934, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xC93A, array: 0x6A51, name: 'carState4' },
  { addr: 0xC93E, array: 0x6985, name: 'carStateB' },
  { addr: 0xC941, array: 0x6979, name: 'carStateA' },
  { addr: 0xC98B, array: 0x6979, name: 'carStateA' },
  { addr: 0xC996, array: 0x6985, name: 'carStateB' },
  { addr: 0xC99D, array: 0x6A51, name: 'carState4' },
  { addr: 0xC9C9, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xCAEE, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xCB04, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xCE70, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xCEA6, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xCF35, array: 0x6979, name: 'carStateA' },
  { addr: 0xCF3B, array: 0x6985, name: 'carStateB' },
  { addr: 0xCF41, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xCF7F, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xCFE2, array: 0x6A51, name: 'carState4' },
  { addr: 0xD037, array: 0x6979, name: 'carStateA' },
  { addr: 0xD046, array: 0x6A51, name: 'carState4' },
  { addr: 0xD04B, array: 0x6985, name: 'carStateB' },
  { addr: 0xD0C9, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xD44F, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xD481, array: 0x6A51, name: 'carState4' },
  { addr: 0xD82D, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xDA92, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xDEF9, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xDF3C, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xDF95, array: 0x6979, name: 'carStateA' },
  { addr: 0xDFE0, array: 0x6985, name: 'carStateB' },
  { addr: 0xE02B, array: 0x6A51, name: 'carState4' },
  { addr: 0xE11F, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xE13F, array: 0x6979, name: 'carStateA' },
  { addr: 0xE151, array: 0x6985, name: 'carStateB' },
  { addr: 0xE15F, array: 0x6A51, name: 'carState4' },
  { addr: 0xE242, array: 0x6991, name: 'carDriverMap' },
  { addr: 0xE260, array: 0x6979, name: 'carStateA' },
  { addr: 0xE279, array: 0x6985, name: 'carStateB' },
  { addr: 0xE292, array: 0x6A51, name: 'carState4' },
  { addr: 0xE61D, array: 0x6991, name: 'carDriverMap' }
];

console.log("Categorizing 47 reference sites...\n");

const results = [];

for (const ref of REFERENCES) {
  const start = Math.max(0, ref.addr - 5);
  const end = ref.addr + 15;
  
  try {
    const output = execSync(`node tools/z80-inspect.mjs disasm ${snapshot} ${start.toString(16)} ${end.toString(16)}`, { encoding: 'utf8' });
    const lines = output.split('\n');
    
    // Find the line with our address
    const targetLine = lines.find(line => line.startsWith(`0x${ref.addr.toString(16).toUpperCase()}`));
    
    if (targetLine) {
      // Extract the instruction
      const parts = targetLine.split(/\s+/);
      const instruction = parts.slice(1, 3).join(' ');
      
      // Categorize
      let category = 'unknown';
      if (instruction.includes('LD HL') || instruction.includes('LD IX') || instruction.includes('LD IY') || instruction.includes('LD DE')) {
        // Check if it's a direct load with an address
        if (parts.some(p => p.startsWith('0x') && p.length === 5)) {
          category = 'direct_load';
        } else {
          category = 'indirect';
        }
      } else if (instruction.includes('LD A') || instruction.includes('LD B') || instruction.includes('LD C')) {
        category = 'data_access';
      } else {
        category = 'other';
      }
      
      results.push({
        addr: ref.addr,
        array: ref.name,
        instruction: instruction,
        category: category,
        fullLine: targetLine
      });
    }
  } catch (error) {
    console.error(`Error at 0x${ref.addr.toString(16)}: ${error.message}`);
  }
}

console.log("Categorization Results:\n");
console.log("Address    | Array         | Category      | Instruction");
console.log("-----------|---------------|---------------|------------");

const categories = { direct_load: [], indirect: [], data_access: [], other: [] };

results.forEach(r => {
  console.log(`0x${r.addr.toString(16).toUpperCase().padStart(4, '0')} | ${r.array.padEnd(13)} | ${r.category.padEnd(13)} | ${r.instruction}`);
  categories[r.category].push(r);
});

console.log("\n\nSummary:");
console.log(`Direct Load (needs patching): ${categories.direct_load.length}`);
console.log(`Indirect (needs code change): ${categories.indirect.length}`);
console.log(`Data Access (may not need patching): ${categories.data_access.length}`);
console.log(`Other (needs investigation): ${categories.other.length}`);

console.log("\n\nDirect Load Instructions (targets for patching):");
categories.direct_load.forEach(r => {
  console.log(`  0x${r.addr.toString(16).toUpperCase()}: ${r.fullLine}`);
});
