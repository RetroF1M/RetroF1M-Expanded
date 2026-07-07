#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const SNA_HEADER = 27;
const RAM_BASE = 0x4000;

function hex(value, width = 4) {
  return `0x${(value >>> 0).toString(16).toUpperCase().padStart(width, "0")}`;
}

function off(addr) {
  return addr - RAM_BASE + SNA_HEADER;
}

function byteAt(bytes, addr) {
  return bytes[off(addr)];
}

function wordAt(bytes, addr) {
  return byteAt(bytes, addr) | (byteAt(bytes, addr + 1) << 8);
}

function signed(value) {
  return value > 127 ? value - 256 : value;
}

function rel(base, disp) {
  return (base + 2 + signed(disp)) & 0xffff;
}

const r = ["B", "C", "D", "E", "H", "L", "(HL)", "A"];
const rp = ["BC", "DE", "HL", "SP"];
const rp2 = ["BC", "DE", "HL", "AF"];
const cc = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"];
const alu = ["ADD A,", "ADC A,", "SUB ", "SBC A,", "AND ", "XOR ", "OR ", "CP "];

function indexedOperand(indexName, d) {
  const s = signed(d);
  const sign = s < 0 ? "-" : "+";
  return `(${indexName}${sign}${hex(Math.abs(s), 2)})`;
}

function decodeCB(op) {
  const x = op >> 6;
  const y = (op >> 3) & 7;
  const z = op & 7;
  if (x === 0) return `${["RLC", "RRC", "RL", "RR", "SLA", "SRA", "SLL", "SRL"][y]} ${r[z]}`;
  return `${["BIT", "RES", "SET"][x - 1]} ${y},${r[z]}`;
}

function decodeED(op) {
  const known = {
    0x44: "NEG", 0x45: "RETN", 0x46: "IM 0", 0x47: "LD I,A", 0x4D: "RETI",
    0x56: "IM 1", 0x57: "LD A,I", 0x5E: "IM 2", 0x5F: "LD A,R", 0x67: "RRD",
    0x6F: "RLD", 0xA0: "LDI", 0xA1: "CPI", 0xA2: "INI", 0xA3: "OUTI",
    0xA8: "LDD", 0xA9: "CPD", 0xAA: "IND", 0xAB: "OUTD", 0xB0: "LDIR",
    0xB1: "CPIR", 0xB2: "INIR", 0xB3: "OTIR", 0xB8: "LDDR", 0xB9: "CPDR",
    0xBA: "INDR", 0xBB: "OTDR",
  };
  if (known[op]) return known[op];
  const x = op >> 6;
  const y = (op >> 3) & 7;
  const z = op & 7;
  if (x === 1 && z === 0) return `IN ${r[y]},(C)`;
  if (x === 1 && z === 1) return `OUT (C),${r[y]}`;
  if (x === 1 && z === 2) return `${y & 1 ? "ADC" : "SBC"} HL,${rp[(y >> 1) & 3]}`;
  if (x === 1 && z === 3) return `${y & 1 ? "LD " + rp[(y >> 1) & 3] + ",(" : "LD ("}nn${y & 1 ? ")" : ")," + rp[(y >> 1) & 3]}`;
  return `ED ${hex(op, 2)}`;
}

function decodeIndexed(bytes, addr, indexName) {
  const op = byteAt(bytes, addr + 1);
  const rr = indexName;
  const first = byteAt(bytes, addr);
  const prefix = first === 0xdd ? "DD" : "FD";
  if (op === 0xcb) {
    const d = byteAt(bytes, addr + 2);
    const cb = byteAt(bytes, addr + 3);
    return { size: 4, text: `${decodeCB(cb).replace("(HL)", indexedOperand(indexName, d))}` };
  }
  if (op === 0x21) return { size: 4, text: `LD ${rr},${hex(wordAt(bytes, addr + 2))}` };
  if (op === 0x22) return { size: 4, text: `LD (${hex(wordAt(bytes, addr + 2))}),${rr}` };
  if (op === 0x2a) return { size: 4, text: `LD ${rr},(${hex(wordAt(bytes, addr + 2))})` };
  if (op === 0x23) return { size: 2, text: `INC ${rr}` };
  if (op === 0x2b) return { size: 2, text: `DEC ${rr}` };
  if (op === 0x34) return { size: 3, text: `INC ${indexedOperand(indexName, byteAt(bytes, addr + 2))}` };
  if (op === 0x35) return { size: 3, text: `DEC ${indexedOperand(indexName, byteAt(bytes, addr + 2))}` };
  if (op === 0x36) return { size: 4, text: `LD ${indexedOperand(indexName, byteAt(bytes, addr + 2))},${hex(byteAt(bytes, addr + 3), 2)}` };
  if (op === 0xe1) return { size: 2, text: `POP ${rr}` };
  if (op === 0xe5) return { size: 2, text: `PUSH ${rr}` };
  if (op === 0xe3) return { size: 2, text: `EX (SP),${rr}` };
  if (op === 0xf9) return { size: 2, text: `LD SP,${rr}` };
  const y = (op >> 3) & 7;
  const z = op & 7;
  const x = op >> 6;
  if (x === 1 && (y === 6 || z === 6)) {
    const d = byteAt(bytes, addr + 2);
    const dst = y === 6 ? indexedOperand(indexName, d) : r[y].replace("H", `${rr}H`).replace("L", `${rr}L`);
    const src = z === 6 ? indexedOperand(indexName, d) : r[z].replace("H", `${rr}H`).replace("L", `${rr}L`);
    return { size: 3, text: `LD ${dst},${src}` };
  }
  if (x === 2 && z === 6) return { size: 3, text: `${alu[y]}${indexedOperand(indexName, byteAt(bytes, addr + 2))}` };
  return { size: 2, text: `${prefix} ${hex(op, 2)}` };
}

function decode(bytes, addr) {
  const op = byteAt(bytes, addr);
  if (op === 0xdd) return decodeIndexed(bytes, addr, "IX");
  if (op === 0xfd) return decodeIndexed(bytes, addr, "IY");
  if (op === 0xcb) return { size: 2, text: decodeCB(byteAt(bytes, addr + 1)) };
  if (op === 0xed) return { size: 2, text: decodeED(byteAt(bytes, addr + 1)) };
  const x = op >> 6;
  const y = (op >> 3) & 7;
  const z = op & 7;
  const p = y >> 1;
  const q = y & 1;
  if (x === 0) {
    if (z === 0) {
      if (y === 0) return { size: 1, text: "NOP" };
      if (y === 1) return { size: 3, text: `EX AF,AF'` };
      if (y === 2) return { size: 2, text: `DJNZ ${hex(rel(addr, byteAt(bytes, addr + 1)))}` };
      if (y === 3) return { size: 2, text: `JR ${hex(rel(addr, byteAt(bytes, addr + 1)))}` };
      return { size: 2, text: `JR ${cc[y - 4]},${hex(rel(addr, byteAt(bytes, addr + 1)))}` };
    }
    if (z === 1) return q ? { size: 1, text: `ADD HL,${rp[p]}` } : { size: 3, text: `LD ${rp[p]},${hex(wordAt(bytes, addr + 1))}` };
    if (z === 2) return { size: 1, text: q ? ["LD A,(BC)", "LD A,(DE)", `LD HL,(${hex(wordAt(bytes, addr + 1))})`, `LD A,(${hex(wordAt(bytes, addr + 1))})`][p] : ["LD (BC),A", "LD (DE),A", `LD (${hex(wordAt(bytes, addr + 1))}),HL`, `LD (${hex(wordAt(bytes, addr + 1))}),A`][p], forceSize: p > 1 ? 3 : 1 };
    if (z === 3) return { size: 1, text: `${q ? "DEC" : "INC"} ${rp[p]}` };
    if (z === 4) return { size: 1, text: `INC ${r[y]}` };
    if (z === 5) return { size: 1, text: `DEC ${r[y]}` };
    if (z === 6) return { size: 2, text: `LD ${r[y]},${hex(byteAt(bytes, addr + 1), 2)}` };
    return { size: 1, text: ["RLCA", "RRCA", "RLA", "RRA", "DAA", "CPL", "SCF", "CCF"][y] };
  }
  if (x === 1) return { size: 1, text: op === 0x76 ? "HALT" : `LD ${r[y]},${r[z]}` };
  if (x === 2) return { size: 1, text: `${alu[y]}${r[z]}` };
  if (z === 0) return { size: 1, text: `RET ${cc[y]}` };
  if (z === 1) return q ? { size: 1, text: ["RET", "EXX", "JP HL", "LD SP,HL"][p] } : { size: 1, text: `POP ${rp2[p]}` };
  if (z === 2) return { size: 3, text: `JP ${cc[y]},${hex(wordAt(bytes, addr + 1))}` };
  if (z === 3) return { size: [3, 1, 3, 3, 1, 1, 1, 1][y], text: ["JP nn", "CB", "OUT (n),A", "IN A,(n)", "EX (SP),HL", "EX DE,HL", "DI", "EI"][y].replace("nn", hex(wordAt(bytes, addr + 1))).replace("(n)", `(${hex(byteAt(bytes, addr + 1), 2)})`) };
  if (z === 4) return { size: 3, text: `CALL ${cc[y]},${hex(wordAt(bytes, addr + 1))}` };
  if (z === 5) return q ? { size: y === 1 ? 3 : 1, text: y === 1 ? `CALL ${hex(wordAt(bytes, addr + 1))}` : `PUSH ${rp2[p]}` } : { size: 1, text: `PUSH ${rp2[p]}` };
  if (z === 6) return { size: 2, text: `${alu[y]}${hex(byteAt(bytes, addr + 1), 2)}` };
  return { size: 1, text: `RST ${hex(y * 8, 2)}` };
}

function disassemble(bytes, start, end) {
  for (let addr = start; addr < end;) {
    const decoded = decode(bytes, addr);
    const size = decoded.forceSize ?? decoded.size;
    const raw = Array.from({ length: size }, (_, i) => hex(byteAt(bytes, addr + i), 2).slice(2)).join(" ");
    console.log(`${hex(addr)}  ${raw.padEnd(12)} ${decoded.text}`);
    addr += size || 1;
  }
}

function refs(bytes, targets) {
  const targetMap = new Map(targets.map((target) => [target.addr, target.name]));
  for (let addr = RAM_BASE; addr <= 0xffff - 1; addr += 1) {
    const value = wordAt(bytes, addr);
    if (targetMap.has(value)) {
      console.log(`${hex(addr)} references ${targetMap.get(value)} ${hex(value)}`);
    }
  }
}

function parseNumber(value) {
  return value.startsWith("0x") ? Number.parseInt(value, 16) : Number.parseInt(value, 10);
}

async function main() {
  const [, , command, file, ...args] = process.argv;
  if (!command || !file) {
    console.log("Usage: node tools/z80-inspect.mjs disasm <snapshot.sna> <start> <end>");
    console.log("       node tools/z80-inspect.mjs refs <snapshot.sna> name=addr [name=addr...]");
    return;
  }
  const bytes = await readFile(file);
  if (command === "disasm") {
    disassemble(bytes, parseNumber(args[0]), parseNumber(args[1]));
  } else if (command === "refs") {
    refs(bytes, args.map((arg) => {
      const [name, addr] = arg.split("=");
      return { name, addr: parseNumber(addr) };
    }));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
