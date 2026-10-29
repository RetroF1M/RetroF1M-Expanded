#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SNA_HEADER_LENGTH = 27;
const SNA_48K_SIZE = 49179;

const OFFSETS = {
  drivers: { offset: 11948, count: 24, width: 10 },
  driverSpecials: { offset: 12188, count: 2, width: 10 },
  teams: { offset: 12216, count: 10, width: 8 },
  managers: { offset: 12286, count: 6, width: 10 },
  circuitGridText: { offset: 12353, length: 127 },
  circuits: { offset: 12480, count: 16, width: 18 },
  lapCounts: { offset: 10992, count: 16 },
  lapRecordTenths: { offset: 11008, count: 16 },
  raceRecordTenths: { offset: 11040, count: 16 },
  circuitDriverRefs: { offset: 11072, count: 16, width: 4 },
  trackLengthHundredths: { offset: 11136, count: 16 },
  lapRecordYears: { offset: 11168, count: 16 },
  points: { offset: 15281, count: 16 },
  incidents: { offset: 15370, count: 14, width: 32 },
  sponsors: { offset: 18316, count: 13, width: 12 },
  seasonYear: { offset: 19243, length: 4 },
  trackReportGridText: { offset: 21534, length: 127 },
  lapCountsDisplay: { offset: 21665, length: 32 },
};

const POINTS_LOOP_SIGNATURE = [0x3e, null, 0xb8, 0xd2, 0x54, 0xce];
const POINTS_LOOP_VALUE_INDEX = 1;

function assertSna48k(buffer, file) {
  if (buffer.length !== SNA_48K_SIZE) {
    throw new Error(`${file} is ${buffer.length} bytes, expected ${SNA_48K_SIZE} for a 48K .sna`);
  }
}

function ramAddress(fileOffset) {
  return 0x4000 + fileOffset - SNA_HEADER_LENGTH;
}

function readAscii(buffer, offset, length) {
  return buffer.subarray(offset, offset + length).toString("latin1");
}

function cleanFixed(text) {
  return text.replace(/\s+$/u, "");
}

function readFixedTable(buffer, table) {
  return Array.from({ length: table.count }, (_, index) =>
    cleanFixed(readAscii(buffer, table.offset + index * table.width, table.width)),
  );
}

function readBytes(buffer, table) {
  return Array.from({ length: table.count }, (_, index) => buffer[table.offset + index]);
}

function readU16Table(buffer, table) {
  return Array.from({ length: table.count }, (_, index) =>
    buffer.readUInt16LE(table.offset + index * 2),
  );
}

function readGroupedBytes(buffer, table) {
  return Array.from({ length: table.count }, (_, index) =>
    Array.from(buffer.subarray(table.offset + index * table.width, table.offset + (index + 1) * table.width)),
  );
}

function pointsFromBuffer(buffer) {
  const values = readBytes(buffer, OFFSETS.points);
  const end = values.indexOf(0);
  return end === -1 ? values : values.slice(0, end);
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

function writeFixedTable(buffer, table, values, label) {
  if (!Array.isArray(values)) return;
  if (values.length > table.count) {
    throw new Error(`${label} has ${values.length} entries, maximum is ${table.count}`);
  }
  values.forEach((value, index) => {
    writeAsciiPadded(buffer, table.offset + index * table.width, table.width, value, `${label}[${index}]`);
  });
}

function assertByte(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error(`${label} must be an integer from 0 to 255`);
  }
}

function assertU16(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new Error(`${label} must be an integer from 0 to 65535`);
  }
}

function writeByteTable(buffer, table, values, label) {
  if (!Array.isArray(values)) return;
  if (values.length > table.count) {
    throw new Error(`${label} has ${values.length} entries, maximum is ${table.count}`);
  }
  values.forEach((value, index) => {
    assertByte(value, `${label}[${index}]`);
    buffer[table.offset + index] = value;
  });
}

function writeU16Table(buffer, table, values, label) {
  if (!Array.isArray(values)) return;
  if (values.length > table.count) {
    throw new Error(`${label} has ${values.length} entries, maximum is ${table.count}`);
  }
  values.forEach((value, index) => {
    assertU16(value, `${label}[${index}]`);
    buffer.writeUInt16LE(value, table.offset + index * 2);
  });
}

function writeGroupedBytes(buffer, table, values, label) {
  if (!Array.isArray(values)) return;
  if (values.length > table.count) {
    throw new Error(`${label} has ${values.length} entries, maximum is ${table.count}`);
  }
  values.forEach((group, index) => {
    if (!Array.isArray(group) || group.length !== table.width) {
      throw new Error(`${label}[${index}] must contain exactly ${table.width} byte values`);
    }
    group.forEach((value, groupIndex) => {
      assertByte(value, `${label}[${index}][${groupIndex}]`);
      buffer[table.offset + index * table.width + groupIndex] = value;
    });
  });
}

function writeRawText(buffer, table, value, label) {
  if (value === undefined) return;
  const text = String(value);
  if (!/^[\x20-\x7e]*$/u.test(text)) {
    throw new Error(`${label} contains unsupported characters; use printable ASCII only`);
  }
  if (text.length !== table.length) {
    throw new Error(`${label} must be exactly ${table.length} characters`);
  }
  buffer.write(text, table.offset, table.length, "latin1");
}

function writePoints(buffer, points) {
  if (!Array.isArray(points)) return;
  if (points.length < 1 || points.length > OFFSETS.points.count - 1) {
    throw new Error(`points must contain between 1 and ${OFFSETS.points.count - 1} scoring positions`);
  }
  const padded = Array(OFFSETS.points.count).fill(0);
  points.forEach((value, index) => {
    assertByte(value, `points[${index}]`);
    if (value === 0) {
      throw new Error("points entries must be non-zero; trailing zeroes are written automatically");
    }
    padded[index] = value;
  });
  writeByteTable(buffer, OFFSETS.points, padded, "points");
  patchPointsAwardingLimit(buffer, points.length);
}

function findSignature(buffer, signature) {
  outer: for (let index = 0; index <= buffer.length - signature.length; index += 1) {
    for (let offset = 0; offset < signature.length; offset += 1) {
      const expected = signature[offset];
      if (expected !== null && buffer[index + offset] !== expected) continue outer;
    }
    return index;
  }
  return -1;
}

function patchPointsAwardingLimit(buffer, pointCount) {
  const patchValue = pointCount - 1;
  const index = findSignature(buffer, POINTS_LOOP_SIGNATURE);
  if (index === -1) {
    throw new Error("Could not find the points-awarding loop signature; snapshot code may differ");
  }
  buffer[index + POINTS_LOOP_VALUE_INDEX] = patchValue;
}

function updateLapDisplay(buffer, lapCounts) {
  if (!Array.isArray(lapCounts)) return;
  const text = lapCounts
    .slice(0, 16)
    .map((value, index) => {
      assertByte(value, `lapCounts[${index}]`);
      return String(value).padStart(2, "0").slice(-2);
    })
    .join("");
  if (text.length === OFFSETS.lapCountsDisplay.length) {
    buffer.write(text, OFFSETS.lapCountsDisplay.offset, OFFSETS.lapCountsDisplay.length, "latin1");
  }
}

function extractSeason(buffer, source = "") {
  const laps = readBytes(buffer, OFFSETS.lapCounts);
  const lapRecordTenths = readU16Table(buffer, OFFSETS.lapRecordTenths);
  const raceRecordTenths = readU16Table(buffer, OFFSETS.raceRecordTenths);
  const trackLengthHundredths = readU16Table(buffer, OFFSETS.trackLengthHundredths);
  const lapRecordYears = readU16Table(buffer, OFFSETS.lapRecordYears);
  const refs = readGroupedBytes(buffer, OFFSETS.circuitDriverRefs);
  const circuitNames = readFixedTable(buffer, OFFSETS.circuits);

  return {
    source,
    format: "RetroF1M Formula One 48K SNA season data v1",
    notes: [
      "This edits the fixed-width data tables already present in the Formula One snapshot.",
      "The original engine still has sixteen circuit slots and byte-sized championship totals unless deeper Z80 code is patched.",
      "points values are per-race awards; the build step patches the award loop to match the number of non-zero positions.",
    ],
    seasonYear: Number.parseInt(readAscii(buffer, OFFSETS.seasonYear.offset, OFFSETS.seasonYear.length), 10),
    drivers: readFixedTable(buffer, OFFSETS.drivers),
    driverSpecials: readFixedTable(buffer, OFFSETS.driverSpecials),
    teams: readFixedTable(buffer, OFFSETS.teams),
    managers: readFixedTable(buffer, OFFSETS.managers),
    points: pointsFromBuffer(buffer),
    circuits: circuitNames.map((name, index) => ({
      name,
      laps: laps[index],
      lapRecordTenths: lapRecordTenths[index],
      raceRecordTenths: raceRecordTenths[index],
      trackLengthHundredths: trackLengthHundredths[index],
      lapRecordYear: lapRecordYears[index],
      driverRefs: refs[index],
    })),
    sponsors: readFixedTable(buffer, OFFSETS.sponsors),
    incidents: readFixedTable(buffer, OFFSETS.incidents),
    circuitGridText: readAscii(buffer, OFFSETS.circuitGridText.offset, OFFSETS.circuitGridText.length),
    trackReportGridText: readAscii(buffer, OFFSETS.trackReportGridText.offset, OFFSETS.trackReportGridText.length),
    offsets: Object.fromEntries(
      Object.entries(OFFSETS).map(([key, value]) => [key, { ...value, ram: ramAddress(value.offset) }]),
    ),
  };
}

function applySeason(buffer, season) {
  if (season.seasonYear !== undefined) {
    writeAsciiPadded(buffer, OFFSETS.seasonYear.offset, OFFSETS.seasonYear.length, season.seasonYear, "seasonYear");
  }

  writeFixedTable(buffer, OFFSETS.drivers, season.drivers, "drivers");
  writeFixedTable(buffer, OFFSETS.driverSpecials, season.driverSpecials, "driverSpecials");
  writeFixedTable(buffer, OFFSETS.teams, season.teams, "teams");
  writeFixedTable(buffer, OFFSETS.managers, season.managers, "managers");
  writeFixedTable(buffer, OFFSETS.sponsors, season.sponsors, "sponsors");
  writeFixedTable(buffer, OFFSETS.incidents, season.incidents, "incidents");
  writeRawText(buffer, OFFSETS.circuitGridText, season.circuitGridText, "circuitGridText");
  writeRawText(buffer, OFFSETS.trackReportGridText, season.trackReportGridText, "trackReportGridText");
  writePoints(buffer, season.points);

  if (Array.isArray(season.circuits)) {
    const names = [];
    const laps = [];
    const lapRecordTenths = [];
    const raceRecordTenths = [];
    const trackLengthHundredths = [];
    const lapRecordYears = [];
    const refs = [];

    season.circuits.forEach((circuit) => {
      names.push(circuit.name);
      laps.push(circuit.laps);
      lapRecordTenths.push(circuit.lapRecordTenths);
      raceRecordTenths.push(circuit.raceRecordTenths);
      trackLengthHundredths.push(circuit.trackLengthHundredths);
      lapRecordYears.push(circuit.lapRecordYear);
      refs.push(circuit.driverRefs);
    });

    writeFixedTable(buffer, OFFSETS.circuits, names, "circuits[].name");
    writeByteTable(buffer, OFFSETS.lapCounts, laps, "circuits[].laps");
    writeU16Table(buffer, OFFSETS.lapRecordTenths, lapRecordTenths, "circuits[].lapRecordTenths");
    writeU16Table(buffer, OFFSETS.raceRecordTenths, raceRecordTenths, "circuits[].raceRecordTenths");
    writeU16Table(buffer, OFFSETS.trackLengthHundredths, trackLengthHundredths, "circuits[].trackLengthHundredths");
    writeU16Table(buffer, OFFSETS.lapRecordYears, lapRecordYears, "circuits[].lapRecordYear");
    writeGroupedBytes(buffer, OFFSETS.circuitDriverRefs, refs, "circuits[].driverRefs");
    updateLapDisplay(buffer, laps);
  }
}

async function exportCommand(input, output) {
  const buffer = await readFile(input);
  assertSna48k(buffer, input);
  const season = extractSeason(buffer, input);
  await writeFile(output, `${JSON.stringify(season, null, 2)}\n`);
  console.log(`Exported ${input} -> ${output}`);
}

async function buildCommand(input, jsonFile, output) {
  const buffer = Buffer.from(await readFile(input));
  assertSna48k(buffer, input);
  const season = JSON.parse(await readFile(jsonFile, "utf8"));
  applySeason(buffer, season);
  await writeFile(output, buffer);
  console.log(`Built ${output} from ${input} and ${jsonFile}`);
}

async function patch2023Command(input, output) {
  const buffer = Buffer.from(await readFile(input));
  assertSna48k(buffer, input);
  applySeason(buffer, {
    points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
  });
  await writeFile(output, buffer);
  console.log(`Wrote ${output} with modern top-10 points`);
}

function usage() {
  const script = path.basename(process.argv[1]);
  console.log(`Usage:
  node tools/${script} export <input.sna> <output.json>
  node tools/${script} build <baseline.sna> <season.json> <output.sna>
  node tools/${script} patch-2023 <input.sna> <output.sna>

Examples:
  node tools/${script} export seasons/f12023.sna tools/seasons/f12023.json
  node tools/${script} build seasons/f12023.sna tools/seasons/f12023.json seasons/f12023-custom.sna
  node tools/${script} patch-2023 seasons/f12023.sna seasons/f12023-modern.sna`);
}

async function main() {
  const [, , command, ...args] = process.argv;
  try {
    if (command === "export" && args.length === 2) {
      await exportCommand(args[0], args[1]);
    } else if (command === "build" && args.length === 3) {
      await buildCommand(args[0], args[1], args[2]);
    } else if (command === "patch-2023" && args.length === 2) {
      await patch2023Command(args[0], args[1]);
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
