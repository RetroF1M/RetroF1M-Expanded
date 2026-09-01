#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const FORMAT = "RetroF1M canonical season v1";
const PROFILES = {
  "safe-16": { calendarCapacity: 16, gridCapacity: 6, pointsTotals: "u8" },
  "experimental-calendar-22": { calendarCapacity: 22, gridCapacity: 6, pointsTotals: "u8-saturating" },
};

function fail(message) {
  throw new Error(message);
}

function string(value, label, width) {
  if (typeof value !== "string" || !/^[\x20-\x7e]*$/u.test(value) || value.length > width) {
    fail(`${label} must be printable ASCII with at most ${width} characters`);
  }
  return value;
}

function byte(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 255) fail(`${label} must be a byte`);
  return value;
}

function word(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 65535) fail(`${label} must be a 16-bit unsigned value`);
  return value;
}

function fixed(values, label, count, width) {
  if (!Array.isArray(values) || values.length > count) fail(`${label} must have at most ${count} entries`);
  return values.map((value, index) => string(value, `${label}[${index}]`, width));
}

function normalizeRound(round, index) {
  if (!round || typeof round !== "object") fail(`calendar[${index}] must be an object`);
  const refs = round.references ?? round.driverRefs;
  if (!Array.isArray(refs) || refs.length !== 4) fail(`calendar[${index}].references must have four bytes`);
  return {
    round: round.round ?? index + 1,
    raceName: string(round.raceName ?? round.circuitName ?? round.name, `calendar[${index}].raceName`, 18),
    circuitName: string(round.circuitName ?? round.raceName ?? round.name, `calendar[${index}].circuitName`, 18),
    // The original 16-round layout derives these labels from its own screen
    // tables.  Only relocated rounds use the 8-character fields, which the
    // boundary builder validates before it writes them.
    shortName: string(round.shortName ?? round.circuitName ?? round.raceName ?? round.name, `calendar[${index}].shortName`, 18),
    reportName: string(round.reportName ?? round.shortName ?? round.circuitName ?? round.raceName ?? round.name, `calendar[${index}].reportName`, 18),
    laps: byte(round.laps, `calendar[${index}].laps`),
    trackLengthHundredths: word(round.trackLengthHundredths, `calendar[${index}].trackLengthHundredths`),
    lapRecordTenths: word(round.lapRecordTenths, `calendar[${index}].lapRecordTenths`),
    raceRecordTenths: word(round.raceRecordTenths ?? round.lapRecordTenths, `calendar[${index}].raceRecordTenths`),
    lapRecordYear: word(round.lapRecordYear, `calendar[${index}].lapRecordYear`),
    references: refs.map((value, refIndex) => byte(value, `calendar[${index}].references[${refIndex}]`)),
  };
}

function validate(season) {
  if (!season || season.format !== FORMAT) fail(`format must be ${JSON.stringify(FORMAT)}`);
  if (!Number.isInteger(season.year) || season.year < 1950 || season.year > 2026) fail("year must be 1950-2026");
  const profileId = season.engineProfile?.id;
  const profile = PROFILES[profileId];
  if (!profile) fail(`engineProfile.id must be one of: ${Object.keys(PROFILES).join(", ")}`);
  if (!Array.isArray(season.calendar) || season.calendar.length < 1 || season.calendar.length > profile.calendarCapacity) {
    fail(`calendar must contain 1-${profile.calendarCapacity} rounds for ${profileId}`);
  }
  if (profileId === "experimental-calendar-22" && season.calendar.length < 17) {
    fail("experimental-calendar-22 is reserved for 17-22 round builds; use safe-16 for shorter calendars");
  }
  const calendar = season.calendar.map(normalizeRound);
  calendar.forEach((round, index) => {
    if (round.round !== index + 1) fail(`calendar[${index}].round must be ${index + 1}`);
  });
  if (!Array.isArray(season.pointsSystem?.awards) || season.pointsSystem.awards.length < 1 || season.pointsSystem.awards.length > 15) {
    fail("pointsSystem.awards must contain 1-15 scoring positions");
  }
  const awards = season.pointsSystem.awards.map((value, index) => {
    byte(value, `pointsSystem.awards[${index}]`);
    if (value === 0) fail("pointsSystem.awards cannot contain zero");
    return value;
  });
  return {
    profileId,
    calendar,
    awards,
    drivers: fixed((season.drivers ?? []).map((driver) => typeof driver === "string" ? driver : driver.name), "drivers", 24, 10),
    driverSpecials: fixed(season.driverSpecials ?? [], "driverSpecials", 2, 10),
    teams: fixed((season.teams ?? []).map((team) => typeof team === "string" ? team : team.displayName ?? team.constructor), "teams", 8, 8),
    managers: fixed(season.managers ?? [], "managers", 6, 10),
    sponsors: fixed(season.text?.sponsors ?? [], "text.sponsors", 13, 12),
    incidents: fixed(season.text?.incidents ?? [], "text.incidents", 14, 32),
    circuitGridText: season.text?.circuitGridText,
    trackReportGridText: season.text?.trackReportGridText,
  };
}

function legacyData(season, normalized) {
  return {
    seasonYear: season.year,
    drivers: normalized.drivers,
    driverSpecials: normalized.driverSpecials,
    teams: normalized.teams,
    managers: normalized.managers,
    sponsors: normalized.sponsors,
    incidents: normalized.incidents,
    circuitGridText: normalized.circuitGridText,
    trackReportGridText: normalized.trackReportGridText,
    points: normalized.awards,
    circuits: normalized.calendar.slice(0, 16).map((round) => ({
      name: round.circuitName,
      laps: round.laps,
      lapRecordTenths: round.lapRecordTenths,
      raceRecordTenths: round.raceRecordTenths,
      trackLengthHundredths: round.trackLengthHundredths,
      lapRecordYear: round.lapRecordYear,
      driverRefs: round.references,
    })),
  };
}

function boundaryData(normalized) {
  return {
    format: "RetroF1M boundary circuit extension v1",
    calendarCount: normalized.calendar.length,
    extraCircuits: normalized.calendar.slice(16).map((round) => ({
      name: round.circuitName,
      shortName: round.shortName,
      reportName: round.reportName,
      laps: round.laps,
      lapRecordTenths: round.lapRecordTenths,
      raceRecordTenths: round.raceRecordTenths,
      trackLengthHundredths: round.trackLengthHundredths,
      lapRecordYear: round.lapRecordYear,
      refColumns: round.references,
    })),
  };
}

async function run(script, args) {
  const { stdout, stderr } = await execFileAsync(process.execPath, [script, ...args]);
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

async function importLegacy(legacyFile, extensionFile, output) {
  const legacy = JSON.parse(await readFile(legacyFile, "utf8"));
  const extension = extensionFile ? JSON.parse(await readFile(extensionFile, "utf8")) : { extraCircuits: [] };
  const rounds = [...(legacy.circuits ?? []), ...(extension.extraCircuits ?? [])];
  if (rounds.length > 22 || rounds.length < 1) fail("legacy data plus extension must contain 1-22 circuits");
  const profileId = rounds.length > 16 ? "experimental-calendar-22" : "safe-16";
  const season = {
    format: FORMAT,
    year: legacy.seasonYear,
    engineProfile: { id: profileId },
    pointsSystem: { awards: legacy.points, fastestLapRule: null, droppedScores: null },
    calendar: rounds.map((round, index) => ({
      round: index + 1,
      raceName: round.name,
      circuitName: round.name,
      shortName: round.shortName ?? round.name,
      reportName: round.reportName ?? round.shortName ?? round.name,
      laps: round.laps,
      trackLengthHundredths: round.trackLengthHundredths,
      lapRecordTenths: round.lapRecordTenths,
      raceRecordTenths: round.raceRecordTenths ?? round.lapRecordTenths,
      lapRecordYear: round.lapRecordYear,
      references: round.driverRefs ?? round.refColumns,
    })),
    drivers: (legacy.drivers ?? []).map((name) => ({ name, role: "race", activeRounds: [1, rounds.length] })),
    driverSpecials: legacy.driverSpecials ?? [],
    teams: (legacy.teams ?? []).map((displayName) => ({ displayName, activeRounds: [1, rounds.length] })),
    managers: legacy.managers ?? [],
    text: {
      sponsors: legacy.sponsors ?? [],
      incidents: legacy.incidents ?? [],
      circuitGridText: legacy.circuitGridText,
      trackReportGridText: legacy.trackReportGridText,
    },
    sourceNotes: [`Converted from ${legacyFile}${extensionFile ? ` with ${extensionFile}` : ""}.`],
  };
  validate(season);
  await writeFile(output, `${JSON.stringify(season, null, 2)}\n`);
  console.log(`Converted ${legacyFile} -> ${output} (${rounds.length} rounds, ${profileId})`);
}

async function validateCommand(file) {
  const season = JSON.parse(await readFile(file, "utf8"));
  const normalized = validate(season);
  console.log(`Validated ${file}: ${season.year}, ${normalized.calendar.length} rounds, ${normalized.profileId}`);
}

async function compileCommand(baseline, seasonFile, output) {
  const season = JSON.parse(await readFile(seasonFile, "utf8"));
  const normalized = validate(season);
  if (normalized.profileId === "experimental-calendar-22" && !path.basename(output).includes("experimental")) {
    fail("experimental-calendar-22 output name must include 'experimental'");
  }
  const temp = await mkdtemp(path.join(os.tmpdir(), "retrof1m-canonical-"));
  try {
    const legacyFile = path.join(temp, "legacy.json");
    const fixedSnapshot = path.join(temp, "fixed.sna");
    await writeFile(legacyFile, `${JSON.stringify(legacyData(season, normalized))}\n`);
    await run(path.resolve("tools/f1-season-tool.mjs"), ["build", baseline, legacyFile, fixedSnapshot]);
    if (normalized.profileId === "safe-16") {
      await run(path.resolve("tools/f1-season-tool.mjs"), ["build", fixedSnapshot, legacyFile, output]);
    } else {
      const extensionFile = path.join(temp, "extension.json");
      await writeFile(extensionFile, `${JSON.stringify(boundaryData(normalized))}\n`);
      await run(path.resolve("tools/f1-boundary-patch.mjs"), ["build", fixedSnapshot, extensionFile, output]);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  console.log(`Compiled ${seasonFile} -> ${output}`);
}

function usage() {
  console.log(`Usage:
  node tools/f1-canonical-season.mjs import-legacy <legacy.json> [boundary-extension.json] <canonical.json>
  node tools/f1-canonical-season.mjs validate <canonical.json>
  node tools/f1-canonical-season.mjs compile <baseline.sna> <canonical.json> <output.sna>`);
}

const [command, ...args] = process.argv.slice(2);
try {
  if (command === "import-legacy" && (args.length === 2 || args.length === 3)) {
    await importLegacy(args[0], args.length === 3 ? args[1] : null, args.at(-1));
  } else if (command === "validate" && args.length === 1) {
    await validateCommand(args[0]);
  } else if (command === "compile" && args.length === 3) {
    await compileCommand(args[0], args[1], args[2]);
  } else {
    usage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
