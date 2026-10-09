#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolsDirectory, "..");
const compiler = path.join(toolsDirectory, "f1-canonical-season.mjs");
const fixture = path.join(toolsDirectory, "seasons", "f12023-canonical.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run(args, allowedFailure = false) {
  try {
    return await execFileAsync(process.execPath, [compiler, ...args], { cwd: repositoryRoot });
  } catch (error) {
    if (!allowedFailure) throw error;
    return { stdout: error.stdout ?? "", stderr: error.stderr ?? "", failed: true };
  }
}

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "retrof1m-canonical-test-"));
try {
  const canonical = JSON.parse(await readFile(fixture, "utf8"));
  await run(["validate", fixture]);

  const assessment = await run(["assess", fixture]);
  assert(assessment.stdout.includes("development snapshot only"), "assessment must flag the 22-round fixture as development-only");
  assert(assessment.stdout.includes("driver 550"), "assessment must calculate the driver byte-limit exposure");
  assert(assessment.stdout.includes("constructor 946"), "assessment must calculate the constructor byte-limit exposure");

  const shortCalendar = structuredClone(canonical);
  shortCalendar.engineProfile = { id: "safe-16" };
  shortCalendar.calendar = shortCalendar.calendar.slice(0, 7);
  const shortCalendarFile = path.join(temporaryDirectory, "short-calendar.json");
  await writeFile(shortCalendarFile, `${JSON.stringify(shortCalendar)}\n`);
  const shortCalendarResult = await run(["validate", shortCalendarFile], true);
  assert(shortCalendarResult.failed, "safe-16 must reject a shortened calendar");
  assert(shortCalendarResult.stderr.includes("calendar must contain 16 rounds"), "safe-16 rejection must explain its fixed engine count");

  const duplicateEntry = structuredClone(canonical);
  duplicateEntry.raceEntries = [
    { driver: "Verstappen", team: "Red Bull", number: 1, activeRounds: [1, 22] },
    { driver: "Perez", team: "Red Bull", number: 1, activeRounds: [1, 22] },
  ];
  const duplicateEntryFile = path.join(temporaryDirectory, "duplicate-entry.json");
  await writeFile(duplicateEntryFile, `${JSON.stringify(duplicateEntry)}\n`);
  const duplicateEntryResult = await run(["validate", duplicateEntryFile], true);
  assert(duplicateEntryResult.failed, "duplicate car numbers must be rejected");
  assert(duplicateEntryResult.stderr.includes("assigns car 1 more than once in round 1"), "duplicate-car rejection must identify the affected round");

  console.log("Canonical season tests passed.");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
