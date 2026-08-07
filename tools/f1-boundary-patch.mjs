#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SNA_HEADER_LENGTH = 27;
const SNA_48K_SIZE = 49179;
const RAM_BASE = 0x4000;

const SOURCE = {
  lapCounts: { offset: 10992, count: 16, size: 1 },
  lapRecordTenths: { offset: 11008, count: 16, size: 2 },
  raceRecordTenths: { offset: 11040, count: 16, size: 2 },
  circuitRefColumns: { offset: 11072, count: 16, columns: 4 },
  trackLengthHundredths: { offset: 11136, count: 16, size: 2 },
  lapRecordYears: { offset: 11168, count: 16, size: 2 },
  shortGrid: { ram: 0x7025, count: 16, width: 8 },
  fullNames: { offset: 12480, count: 16, width: 18 },
  reportGrid: { ram: 0x9402, count: 16, width: 8 },
};

const EXPANDED = {
  maxCalendarCount: 22,
  lapCounts: 0x613c,
  lapRecordTenths: 0x6152,
  raceRecordTenths: 0x617e,
  refColumns: [0x61aa, 0x61c0, 0x61d6, 0x61ec],
  trackLengthHundredths: 0x6202,
  lapRecordYears: 0x622e,
  fullNames: 0x625a,
  shortGrid: 0x63e6,
  reportGrid: 0x6496,
  pointsSaturatingAdd: 0x6550,
  end: 0x6560,
};

const WORD_PATCHES = [
  { label: "lap-count table", old: 0x6ad5, next: EXPANDED.lapCounts, refs: [0x9d2a, 0xc142, 0xc1fd, 0xc7ed] },
  { label: "lap-record table", old: 0x6ae5, next: EXPANDED.lapRecordTenths, refs: [0x9b92, 0xbf37, 0xc806] },
  { label: "race-record table", old: 0x6b05, next: EXPANDED.raceRecordTenths, refs: [0xcc28, 0xe5e5] },
  { label: "circuit ref column 1", old: 0x6b25, next: EXPANDED.refColumns[0], refs: [0xcc42, 0xe627] },
  { label: "circuit ref column 2", old: 0x6b35, next: EXPANDED.refColumns[1], refs: [0xcc5c, 0xe642] },
  { label: "circuit ref column 3", old: 0x6b45, next: EXPANDED.refColumns[2], refs: [0xcbef, 0xda7b, 0xe934] },
  { label: "circuit ref column 4", old: 0x6b55, next: EXPANDED.refColumns[3], refs: [0xcc0e, 0xda7f, 0xe931] },
  { label: "track-length table", old: 0x6b65, next: EXPANDED.trackLengthHundredths, refs: [0x9d47] },
  { label: "lap-record year table", old: 0x6b85, next: EXPANDED.lapRecordYears, refs: [0xcc74, 0xe647] },
  { label: "circuit full-name table", old: 0x70a5, next: EXPANDED.fullNames, refs: [0x9d11] },
  { label: "circuit short-name grid", old: 0x7025, next: EXPANDED.shortGrid, refs: [0x986f, 0x9cbb, 0xccc6, 0xd105, 0xd7b1, 0xe92d] },
  { label: "track-report short-name grid", old: 0x9402, next: EXPANDED.reportGrid, refs: [0x9f96, 0xad2b, 0xb8e0] },
];

const BYTE_PATCHES = [
  { label: "season setup rollover", addr: 0xc7d9, old: 0x10 },
  { label: "pre-race final-round check", addr: 0xe9a5, old: 0x10 },
  { label: "post-race final-round check", addr: 0xea3b, old: 0x10 },
  { label: "lap-record reset loop count", addr: 0xbf3a, old: 0x10 },
  { label: "short-name redraw loop count", addr: 0xe93a, old: 0x10 },
  { label: "short-name redraw row base", addr: 0xe947, old: 0x14 },
];

const CODE_PATCHES = [
  {
    label: "driver points saturating add call",
    addr: 0xce7b,
    old: [0x7e, 0x81, 0x77],
    next: [0xcd, EXPANDED.pointsSaturatingAdd & 0xff, EXPANDED.pointsSaturatingAdd >> 8],
  },
  {
    label: "constructor points saturating add call",
    addr: 0xce93,
    old: [0x7e, 0x81, 0x77],
    next: [0xcd, EXPANDED.pointsSaturatingAdd & 0xff, EXPANDED.pointsSaturatingAdd >> 8],
  },
  {
    label: "points saturating add trampoline",
    addr: EXPANDED.pointsSaturatingAdd,
    old: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    next: [0x7e, 0x81, 0x30, 0x02, 0x3e, 0xff, 0x77, 0xc9],
  },
];

function hex(value, width = 4) {
  return `0x${value.toString(16).toUpperCase().padStart(width, "0")}`;
}

function fileOffsetForRam(ram) {
  if (ram < RAM_BASE || ram > 0xffff) {
    throw new Error(`RAM address out of 48K range: ${hex(ram)}`);
  }
  return ram - RAM_BASE + SNA_HEADER_LENGTH;
}

function assertSna48k(buffer, file) {
  if (buffer.length !== SNA_48K_SIZE) {
    throw new Error(`${file} is ${buffer.length} bytes, expected ${SNA_48K_SIZE} for a 48K .sna`);
  }
}

function readByteTable(buffer, table) {
  return Array.from({ length: table.count }, (_, index) => buffer[table.offset + index]);
}

function readWordTable(buffer, table) {
  return Array.from({ length: table.count }, (_, index) => buffer.readUInt16LE(table.offset + index * 2));
}

function readFixedRamTable(buffer, table) {
  const offset = table.offset ?? fileOffsetForRam(table.ram);
  return Array.from({ length: table.count }, (_, index) =>
    buffer.subarray(offset + index * table.width, offset + (index + 1) * table.width).toString("latin1"),
  );
}

function readRefColumns(buffer) {
  return Array.from({ length: SOURCE.circuitRefColumns.columns }, (_, column) =>
    Array.from(
      buffer.subarray(
        SOURCE.circuitRefColumns.offset + column * SOURCE.circuitRefColumns.count,
        SOURCE.circuitRefColumns.offset + (column + 1) * SOURCE.circuitRefColumns.count,
      ),
    ),
  );
}

function writeByteTable(buffer, ram, values) {
  const offset = fileOffsetForRam(ram);
  values.forEach((value, index) => {
    assertByte(value, `byte table ${hex(ram)}[${index}]`);
    buffer[offset + index] = value;
  });
}

function writeWordTable(buffer, ram, values) {
  const offset = fileOffsetForRam(ram);
  values.forEach((value, index) => {
    assertWord(value, `word table ${hex(ram)}[${index}]`);
    buffer.writeUInt16LE(value, offset + index * 2);
  });
}

function writeFixedRamTable(buffer, ram, width, values, label) {
  const offset = fileOffsetForRam(ram);
  values.forEach((value, index) => {
    writeAsciiPadded(buffer, offset + index * width, width, value, `${label}[${index}]`);
  });
}

function writeAsciiPadded(buffer, offset, width, value, label) {
  const text = String(value ?? "");
  if (!/^[\x20-\x7e]*$/u.test(text)) {
    throw new Error(`${label} contains unsupported characters; use printable ASCII only`);
  }
  if (text.length > width) {
    throw new Error(`${label} is ${text.length} characters, maximum is ${width}: ${text}`);
  }
  buffer.write(text.padEnd(width, " "), offset, width, "latin1");
}

function assertByte(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error(`${label} must be an integer from 0 to 255`);
  }
}

function assertWord(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new Error(`${label} must be an integer from 0 to 65535`);
  }
}

function patchWord(buffer, ram, oldValue, nextValue, label) {
  const offset = fileOffsetForRam(ram);
  const actual = buffer.readUInt16LE(offset);
  if (actual !== oldValue) {
    throw new Error(`${label} at ${hex(ram)} expected ${hex(oldValue)}, found ${hex(actual)}`);
  }
  buffer.writeUInt16LE(nextValue, offset);
}

function patchByte(buffer, ram, oldValue, nextValue, label) {
  const offset = fileOffsetForRam(ram);
  const actual = buffer[offset];
  if (actual !== oldValue) {
    throw new Error(`${label} at ${hex(ram)} expected ${hex(oldValue, 2)}, found ${hex(actual, 2)}`);
  }
  buffer[offset] = nextValue;
}

function patchCode(buffer, ram, oldBytes, nextBytes, label) {
  if (oldBytes.length !== nextBytes.length) {
    throw new Error(`${label} old/new byte arrays must be the same length`);
  }
  const offset = fileOffsetForRam(ram);
  oldBytes.forEach((expected, index) => {
    const actual = buffer[offset + index];
    if (actual !== expected) {
      throw new Error(`${label} at ${hex(ram + index)} expected ${hex(expected, 2)}, found ${hex(actual, 2)}`);
    }
  });
  nextBytes.forEach((value, index) => {
    assertByte(value, `${label}[${index}]`);
    buffer[offset + index] = value;
  });
}

function assertWritableWindow(buffer) {
  const start = fileOffsetForRam(EXPANDED.lapCounts);
  const end = fileOffsetForRam(EXPANDED.end);
  const nonZero = [];
  for (let offset = start; offset < end; offset += 1) {
    if (buffer[offset] !== 0) nonZero.push(offset - SNA_HEADER_LENGTH + RAM_BASE);
  }
  if (nonZero.length) {
    throw new Error(`expanded calendar window is not empty near ${hex(nonZero[0])}; refusing to overwrite`);
  }
}

function normalizeExtraCircuit(circuit, index) {
  const label = `extraCircuits[${index}]`;
  if (!circuit || typeof circuit !== "object") {
    throw new Error(`${label} must be an object`);
  }
  const refs = circuit.refColumns ?? circuit.driverRefs;
  if (!Array.isArray(refs) || refs.length !== 4) {
    throw new Error(`${label}.refColumns must contain four byte values`);
  }
  refs.forEach((value, refIndex) => assertByte(value, `${label}.refColumns[${refIndex}]`));
  return {
    name: circuit.name,
    shortName: circuit.shortName ?? circuit.name,
    reportName: circuit.reportName ?? circuit.shortName ?? circuit.name,
    laps: circuit.laps,
    lapRecordTenths: circuit.lapRecordTenths,
    raceRecordTenths: circuit.raceRecordTenths ?? circuit.lapRecordTenths,
    trackLengthHundredths: circuit.trackLengthHundredths,
    lapRecordYear: circuit.lapRecordYear,
    refColumns: refs,
  };
}

function buildExpandedData(buffer, extension) {
  const calendarCount = extension.calendarCount;
  if (!Number.isInteger(calendarCount) || calendarCount < 17 || calendarCount > EXPANDED.maxCalendarCount) {
    throw new Error(`calendarCount must be 17-${EXPANDED.maxCalendarCount}`);
  }

  const extraCircuits = extension.extraCircuits ?? extension.circuits;
  if (!Array.isArray(extraCircuits) || extraCircuits.length !== calendarCount - SOURCE.lapCounts.count) {
    throw new Error(`expected ${calendarCount - SOURCE.lapCounts.count} extraCircuits for calendarCount ${calendarCount}`);
  }
  const extras = extraCircuits.map(normalizeExtraCircuit);

  const lapCounts = readByteTable(buffer, SOURCE.lapCounts);
  const lapRecordTenths = readWordTable(buffer, SOURCE.lapRecordTenths);
  const raceRecordTenths = readWordTable(buffer, SOURCE.raceRecordTenths);
  const trackLengthHundredths = readWordTable(buffer, SOURCE.trackLengthHundredths);
  const lapRecordYears = readWordTable(buffer, SOURCE.lapRecordYears);
  const refColumns = readRefColumns(buffer);
  const fullNames = readFixedRamTable(buffer, SOURCE.fullNames);
  const shortGrid = readFixedRamTable(buffer, SOURCE.shortGrid);
  const reportGrid = readFixedRamTable(buffer, SOURCE.reportGrid);

  for (const circuit of extras) {
    assertByte(circuit.laps, `${circuit.name}.laps`);
    assertWord(circuit.lapRecordTenths, `${circuit.name}.lapRecordTenths`);
    assertWord(circuit.raceRecordTenths, `${circuit.name}.raceRecordTenths`);
    assertWord(circuit.trackLengthHundredths, `${circuit.name}.trackLengthHundredths`);
    assertWord(circuit.lapRecordYear, `${circuit.name}.lapRecordYear`);
    lapCounts.push(circuit.laps);
    lapRecordTenths.push(circuit.lapRecordTenths);
    raceRecordTenths.push(circuit.raceRecordTenths);
    trackLengthHundredths.push(circuit.trackLengthHundredths);
    lapRecordYears.push(circuit.lapRecordYear);
    fullNames.push(circuit.name);
    shortGrid.push(circuit.shortName);
    reportGrid.push(circuit.reportName);
    circuit.refColumns.forEach((value, column) => refColumns[column].push(value));
  }

  return {
    calendarCount,
    lapCounts,
    lapRecordTenths,
    raceRecordTenths,
    refColumns,
    trackLengthHundredths,
    lapRecordYears,
    fullNames,
    shortGrid,
    reportGrid,
  };
}

function applyExpandedData(buffer, data) {
  writeByteTable(buffer, EXPANDED.lapCounts, data.lapCounts);
  writeWordTable(buffer, EXPANDED.lapRecordTenths, data.lapRecordTenths);
  writeWordTable(buffer, EXPANDED.raceRecordTenths, data.raceRecordTenths);
  data.refColumns.forEach((values, index) => writeByteTable(buffer, EXPANDED.refColumns[index], values));
  writeWordTable(buffer, EXPANDED.trackLengthHundredths, data.trackLengthHundredths);
  writeWordTable(buffer, EXPANDED.lapRecordYears, data.lapRecordYears);
  writeFixedRamTable(buffer, EXPANDED.fullNames, SOURCE.fullNames.width, data.fullNames, "fullNames");
  writeFixedRamTable(buffer, EXPANDED.shortGrid, SOURCE.shortGrid.width, data.shortGrid, "shortGrid");
  writeFixedRamTable(buffer, EXPANDED.reportGrid, SOURCE.reportGrid.width, data.reportGrid, "reportGrid");

  for (const patch of WORD_PATCHES) {
    for (const ref of patch.refs) patchWord(buffer, ref, patch.old, patch.next, patch.label);
  }
  for (const patch of BYTE_PATCHES) {
    patchByte(buffer, patch.addr, patch.old, data.calendarCount, patch.label);
  }
  for (const patch of CODE_PATCHES) {
    patchCode(buffer, patch.addr, patch.old, patch.next, patch.label);
  }
}

function verifyPatchedSnapshot(buffer, calendarCount) {
  for (const patch of WORD_PATCHES) {
    for (const ref of patch.refs) {
      const actual = buffer.readUInt16LE(fileOffsetForRam(ref));
      if (actual !== patch.next) {
        throw new Error(`${patch.label} reference ${hex(ref)} is ${hex(actual)}, expected ${hex(patch.next)}`);
      }
    }
  }
  for (const patch of BYTE_PATCHES) {
    const actual = buffer[fileOffsetForRam(patch.addr)];
    if (actual !== calendarCount) {
      throw new Error(`${patch.label} at ${hex(patch.addr)} is ${hex(actual, 2)}, expected ${hex(calendarCount, 2)}`);
    }
  }
  for (const patch of CODE_PATCHES) {
    const offset = fileOffsetForRam(patch.addr);
    patch.next.forEach((expected, index) => {
      const actual = buffer[offset + index];
      if (actual !== expected) {
        throw new Error(`${patch.label} at ${hex(patch.addr + index)} is ${hex(actual, 2)}, expected ${hex(expected, 2)}`);
      }
    });
  }
}

async function buildCommand(input, extensionFile, output) {
  const buffer = Buffer.from(await readFile(input));
  assertSna48k(buffer, input);
  assertWritableWindow(buffer);
  const extension = JSON.parse(await readFile(extensionFile, "utf8"));
  const data = buildExpandedData(buffer, extension);
  applyExpandedData(buffer, data);
  verifyPatchedSnapshot(buffer, data.calendarCount);
  await writeFile(output, buffer);
  console.log(`Built ${output} with ${data.calendarCount} relocated calendar slots`);
  console.log(`Expanded tables/code: ${hex(EXPANDED.lapCounts)}-${hex(EXPANDED.end - 1)}; stack starts at 0x67B2 in the baseline SNA`);
}

async function verifyCommand(file, expectedCount) {
  const buffer = await readFile(file);
  assertSna48k(buffer, file);
  verifyPatchedSnapshot(buffer, Number.parseInt(expectedCount, 10));
  console.log(`Verified ${file} for ${expectedCount} relocated calendar slots`);
}

function usage() {
  const script = path.basename(process.argv[1]);
  console.log(`Usage:
  node tools/${script} build <baseline.sna> <extension.json> <output.sna>
  node tools/${script} verify <snapshot.sna> <calendarCount>

Example:
  node tools/${script} build seasons/f12023-modern.sna tools/seasons/f12023-boundary-22.json seasons/f12023-boundary-experimental.sna`);
}

async function main() {
  const [, , command, ...args] = process.argv;
  try {
    if (command === "build" && args.length === 3) {
      await buildCommand(args[0], args[1], args[2]);
    } else if (command === "verify" && args.length === 2) {
      await verifyCommand(args[0], args[1]);
    } else {
      usage();
      process.exitCode = command ? 1 : 0;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
