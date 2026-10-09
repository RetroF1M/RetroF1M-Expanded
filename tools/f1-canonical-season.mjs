#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const FORMAT = "RetroF1M canonical season v1";
const PROFILES = {
  "safe-16": {
    calendarMinimum: 16,
    calendarCapacity: 16,
    gridCapacity: 6,
    pointsTotals: "u8-wrap",
    developmentOnly: false,
  },
  "experimental-calendar-22": {
    calendarMinimum: 17,
    calendarCapacity: 22,
    gridCapacity: 6,
    pointsTotals: "u8-saturating",
    developmentOnly: true,
  },
};

const DRIVER_ROLES = new Set(["race", "reserve", "substitute"]);

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

function activeRounds(value, label, roundCount) {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.length !== 2 || !Number.isInteger(value[0]) || !Number.isInteger(value[1])) {
    fail(`${label} must be [firstRound, lastRound]`);
  }
  const [firstRound, lastRound] = value;
  if (firstRound < 1 || lastRound < firstRound || lastRound > roundCount) {
    fail(`${label} must fall within rounds 1-${roundCount}`);
  }
  return [firstRound, lastRound];
}

function namedValue(value, label, width, keys) {
  if (typeof value === "string") return string(value, label, width);
  if (!value || typeof value !== "object") fail(`${label} must be a string or object`);
  for (const key of keys) {
    if (Object.hasOwn(value, key)) return string(value[key], `${label}.${key}`, width);
  }
  fail(`${label} must include one of: ${keys.join(", ")}`);
}

function normalizeDrivers(values, roundCount) {
  if (!Array.isArray(values) || values.length > 24) fail("drivers must have at most 24 entries");
  return values.map((driver, index) => {
    const label = `drivers[${index}]`;
    const name = namedValue(driver, label, 10, ["name"]);
    if (typeof driver === "string") return { name, activeRounds: null, role: null };
    const role = driver.role ?? "race";
    if (!DRIVER_ROLES.has(role)) fail(`${label}.role must be one of: ${[...DRIVER_ROLES].join(", ")}`);
    if (Object.hasOwn(driver, "team")) string(driver.team, `${label}.team`, 32);
    if (Object.hasOwn(driver, "nationality")) string(driver.nationality, `${label}.nationality`, 32);
    if (Object.hasOwn(driver, "number") && (!Number.isInteger(driver.number) || driver.number < 0 || driver.number > 99)) {
      fail(`${label}.number must be an integer from 0 to 99`);
    }
    return { name, activeRounds: activeRounds(driver.activeRounds, `${label}.activeRounds`, roundCount), role };
  });
}

function normalizeTeams(values, roundCount) {
  if (!Array.isArray(values) || values.length > 8) fail("teams must have at most 8 entries");
  return values.map((team, index) => {
    const label = `teams[${index}]`;
    const displayName = namedValue(team, label, 8, ["displayName", "constructor"]);
    if (typeof team === "string") return { displayName, activeRounds: null };
    if (Object.hasOwn(team, "constructor")) string(team.constructor, `${label}.constructor`, 64);
    if (Object.hasOwn(team, "principal")) string(team.principal, `${label}.principal`, 64);
    return { displayName, activeRounds: activeRounds(team.activeRounds, `${label}.activeRounds`, roundCount) };
  });
}

function normalizeRaceEntries(values, drivers, teams, roundCount) {
  if (values === undefined) return [];
  if (!Array.isArray(values)) fail("raceEntries must be an array when provided");
  const driverNames = new Set(drivers.map((driver) => driver.name));
  const teamNames = new Set(teams.map((team) => team.displayName));
  const entries = values.map((entry, index) => {
    const label = `raceEntries[${index}]`;
    if (!entry || typeof entry !== "object") fail(`${label} must be an object`);
    const driver = string(entry.driver, `${label}.driver`, 10);
    const team = string(entry.team, `${label}.team`, 8);
    if (!driverNames.has(driver)) fail(`${label}.driver must match a declared driver`);
    if (!teamNames.has(team)) fail(`${label}.team must match a declared team displayName`);
    if (!Number.isInteger(entry.number) || entry.number < 0 || entry.number > 99) {
      fail(`${label}.number must be an integer from 0 to 99`);
    }
    const coverage = activeRounds(entry.activeRounds, `${label}.activeRounds`, roundCount) ?? [1, roundCount];
    const driverRecord = drivers.find((candidate) => candidate.name === driver);
    const teamRecord = teams.find((candidate) => candidate.displayName === team);
    if (driverRecord.activeRounds && (coverage[0] < driverRecord.activeRounds[0] || coverage[1] > driverRecord.activeRounds[1])) {
      fail(`${label}.activeRounds exceeds ${driver}'s declared activeRounds`);
    }
    if (teamRecord.activeRounds && (coverage[0] < teamRecord.activeRounds[0] || coverage[1] > teamRecord.activeRounds[1])) {
      fail(`${label}.activeRounds exceeds ${team}'s declared activeRounds`);
    }
    return { driver, team, number: entry.number, activeRounds: coverage };
  });

  for (let round = 1; round <= roundCount; round += 1) {
    const active = entries.filter((entry) => entry.activeRounds[0] <= round && entry.activeRounds[1] >= round);
    const driversThisRound = new Set();
    const numbersThisRound = new Set();
    active.forEach((entry) => {
      if (driversThisRound.has(entry.driver)) fail(`raceEntries assigns ${entry.driver} more than once in round ${round}`);
      if (numbersThisRound.has(entry.number)) fail(`raceEntries assigns car ${entry.number} more than once in round ${round}`);
      driversThisRound.add(entry.driver);
      numbersThisRound.add(entry.number);
    });
  }
  return entries;
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
  if (!Array.isArray(season.calendar) || season.calendar.length < profile.calendarMinimum || season.calendar.length > profile.calendarCapacity) {
    const range = profile.calendarMinimum === profile.calendarCapacity
      ? String(profile.calendarCapacity)
      : `${profile.calendarMinimum}-${profile.calendarCapacity}`;
    fail(`calendar must contain ${range} rounds for ${profileId}`);
  }
  const calendar = season.calendar.map(normalizeRound);
  calendar.forEach((round, index) => {
    if (round.round !== index + 1) fail(`calendar[${index}].round must be ${index + 1}`);
  });
  if (profileId === "experimental-calendar-22") {
    calendar.slice(16).forEach((round, index) => {
      if (round.shortName.length > 8) fail(`calendar[${index + 16}].shortName must fit the 8-character relocated grid`);
      if (round.reportName.length > 8) fail(`calendar[${index + 16}].reportName must fit the 8-character relocated report grid`);
    });
  }
  if (!Array.isArray(season.pointsSystem?.awards) || season.pointsSystem.awards.length < 1 || season.pointsSystem.awards.length > 15) {
    fail("pointsSystem.awards must contain 1-15 scoring positions");
  }
  const awards = season.pointsSystem.awards.map((value, index) => {
    byte(value, `pointsSystem.awards[${index}]`);
    if (value === 0) fail("pointsSystem.awards cannot contain zero");
    return value;
  });
  const drivers = normalizeDrivers(season.drivers ?? [], calendar.length);
  const teams = normalizeTeams(season.teams ?? [], calendar.length);
  const raceEntries = normalizeRaceEntries(season.raceEntries, drivers, teams, calendar.length);
  if (season.sourceNotes !== undefined) {
    if (!Array.isArray(season.sourceNotes)) fail("sourceNotes must be an array when provided");
    season.sourceNotes.forEach((note, index) => string(note, `sourceNotes[${index}]`, 500));
  }
  return {
    profileId,
    profile,
    calendar,
    awards,
    drivers,
    driverSpecials: fixed(season.driverSpecials ?? [], "driverSpecials", 2, 10),
    teams,
    raceEntries,
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
    drivers: normalized.drivers.map((driver) => driver.name),
    driverSpecials: normalized.driverSpecials,
    teams: normalized.teams.map((team) => team.displayName),
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

function maximumEntryCount(entries, roundCount) {
  return Math.max(0, ...Array.from({ length: roundCount }, (_, index) => {
    const round = index + 1;
    return entries.filter((entry) => entry.activeRounds[0] <= round && entry.activeRounds[1] >= round).length;
  }));
}

function assess(season, normalized) {
  const { profile, calendar, awards, raceEntries } = normalized;
  const driverMaximum = Math.max(...awards) * calendar.length;
  const constructorMaximum = [...awards]
    .sort((left, right) => right - left)
    .slice(0, 2)
    .reduce((total, award) => total + award, 0) * calendar.length;
  const blockers = [];
  const cautions = [];

  if (profile.developmentOnly) {
    blockers.push("The 17-22 round engine is development-only: only its first race has been observed in QAOP, not natural round-17 or end-of-season progression.");
  }
  if (driverMaximum > 255) {
    blockers.push(`A driver can score ${driverMaximum} points, but this profile stores driver standings in one byte (${profile.pointsTotals}).`);
  }
  if (constructorMaximum > 255) {
    blockers.push(`A constructor can score ${constructorMaximum} points, but this profile stores constructor standings in one byte (${profile.pointsTotals}).`);
  }
  if (season.pointsSystem?.fastestLapRule !== null && season.pointsSystem?.fastestLapRule !== undefined) {
    blockers.push("The snapshot builder does not implement the declared fastest-lap points rule.");
  }
  if (season.pointsSystem?.droppedScores !== null && season.pointsSystem?.droppedScores !== undefined) {
    blockers.push("The snapshot builder does not implement the declared dropped-scores rule.");
  }

  if (!raceEntries.length) {
    blockers.push("No per-round raceEntries are declared, so the package cannot describe or build a real race grid.");
  } else {
    const activeEntries = maximumEntryCount(raceEntries, calendar.length);
    if (activeEntries > profile.gridCapacity) {
      blockers.push(`The largest declared race grid has ${activeEntries} cars; this engine currently runs ${profile.gridCapacity}.`);
    }
    blockers.push("Per-round raceEntries are retained as canonical data, but the snapshot builder cannot yet map them into the original game's live race selection arrays.");
  }

  if (!season.sourceNotes?.length) cautions.push("No sourceNotes are recorded for this package.");
  if (normalized.drivers.length > 24) blockers.push("Driver table exceeds the 24-name snapshot capacity.");
  if (normalized.teams.length > 8) blockers.push("Team table exceeds the 8-name snapshot capacity.");

  return {
    profile,
    calendarCount: calendar.length,
    driverMaximum,
    constructorMaximum,
    activeEntries: raceEntries.length ? maximumEntryCount(raceEntries, calendar.length) : null,
    blockers,
    cautions,
    promotable: blockers.length === 0,
  };
}

function formatAssessment(season, normalized, assessment) {
  const lines = [
    `Assessment for ${season.year} (${normalized.profileId})`,
    `Calendar: ${assessment.calendarCount}/${assessment.profile.calendarCapacity} rounds`,
    `Mapped live grid: ${assessment.profile.gridCapacity} cars`,
    `Possible standings totals: driver ${assessment.driverMaximum}, constructor ${assessment.constructorMaximum} (byte limit 255)`,
    `Release status: ${assessment.promotable ? "candidate — still needs QAOP release testing" : "development snapshot only — not a promoted playable season package"}`,
  ];
  if (assessment.blockers.length) {
    lines.push("Blockers:", ...assessment.blockers.map((blocker) => `- ${blocker}`));
  }
  if (assessment.cautions.length) {
    lines.push("Cautions:", ...assessment.cautions.map((caution) => `- ${caution}`));
  }
  return lines.join("\n");
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

async function assessCommand(file) {
  const season = JSON.parse(await readFile(file, "utf8"));
  const normalized = validate(season);
  console.log(formatAssessment(season, normalized, assess(season, normalized)));
}

async function compileCommand(baseline, seasonFile, output) {
  const season = JSON.parse(await readFile(seasonFile, "utf8"));
  const normalized = validate(season);
  const assessment = assess(season, normalized);
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
  if (assessment.promotable) {
    console.log("Release status: candidate only; complete the QAOP release checklist before promotion.");
  } else {
    console.log("Release status: development snapshot only; do not present this output as a promoted playable season package.");
    assessment.blockers.forEach((blocker) => console.log(`- ${blocker}`));
  }
}

function usage() {
  console.log(`Usage:
  node tools/f1-canonical-season.mjs import-legacy <legacy.json> [boundary-extension.json] <canonical.json>
  node tools/f1-canonical-season.mjs validate <canonical.json>
  node tools/f1-canonical-season.mjs assess <canonical.json>
  node tools/f1-canonical-season.mjs compile <baseline.sna> <canonical.json> <output.sna>`);
}

const [command, ...args] = process.argv.slice(2);
try {
  if (command === "import-legacy" && (args.length === 2 || args.length === 3)) {
    await importLegacy(args[0], args.length === 3 ? args[1] : null, args.at(-1));
  } else if (command === "validate" && args.length === 1) {
    await validateCommand(args[0]);
  } else if (command === "assess" && args.length === 1) {
    await assessCommand(args[0]);
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
