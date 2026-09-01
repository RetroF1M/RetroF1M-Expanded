#!/usr/bin/env node

// Controlled state test for the first relocated round.  It records the exact
// state consumed by the C7BA race-setup routine when a completed round 16
// advances to round 17.  It intentionally writes a separately named snapshot;
// the normal experimental and safe snapshots are never modified.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const HEADER = 27;
const RAM = 0x4000;
const SIZE = 49179;
const ROUND = 0x6bb2;
const LAP_COUNT = 0x613c;
const LAP_RECORD = 0x6152;
const TRACK_LENGTH = 0x6202;
const NAME = 0x625a;

function offset(address) {
  if (address < RAM || address > 0xffff) throw new Error(`invalid RAM address: 0x${address.toString(16)}`);
  return HEADER + address - RAM;
}

function assertSnapshot(bytes, file) {
  if (bytes.length !== SIZE) throw new Error(`${file} is not a 48K .sna snapshot`);
}

function word(bytes, address) {
  return bytes.readUInt16LE(offset(address));
}

function text(bytes, address, width) {
  return bytes.subarray(offset(address), offset(address) + width).toString("latin1").trimEnd();
}

function proveRound17(bytes) {
  // C7D5-C7F8: count 16 is below the patched 22-round limit, so INC A stores
  // 17; the following table offset is (17 - 1).  These are the concrete
  // values C7BA supplies to the race engine before it continues setup.
  const previousRound = bytes[offset(ROUND)];
  if (previousRound !== 16) throw new Error(`probe expects round 16, found ${previousRound}`);
  const nextRound = previousRound + 1;
  const index = nextRound - 1;
  const lapCount = bytes[offset(LAP_COUNT) + index];
  const lapRecordTenths = word(bytes, LAP_RECORD + index * 2);
  const trackLengthHundredths = word(bytes, TRACK_LENGTH + index * 2);
  const circuitName = text(bytes, NAME + index * 18, 18);
  if (nextRound !== 17 || circuitName !== "Baku" || lapCount !== 51 || lapRecordTenths !== 1030 || trackLengthHundredths !== 373) {
    throw new Error(`round-17 table proof failed: ${JSON.stringify({ nextRound, circuitName, lapCount, lapRecordTenths, trackLengthHundredths })}`);
  }
  return { previousRound, nextRound, circuitName, lapCount, lapRecordTenths, trackLengthHundredths };
}

const [command, input, output] = process.argv.slice(2);
try {
  if (command === "build" && input && output) {
    if (!path.basename(output).includes("experimental")) throw new Error("probe output name must include 'experimental'");
    const bytes = Buffer.from(await readFile(input));
    assertSnapshot(bytes, input);
    bytes[offset(ROUND)] = 16;
    const proof = proveRound17(bytes);
    await writeFile(output, bytes);
    console.log(`Built controlled round-17 probe ${output}: ${proof.circuitName}, ${proof.lapCount} laps`);
  } else if (command === "verify" && input && !output) {
    const bytes = await readFile(input);
    assertSnapshot(bytes, input);
    const proof = proveRound17(bytes);
    console.log(`Verified controlled round-17 state: round ${proof.previousRound} -> ${proof.nextRound}, ${proof.circuitName}, ${proof.lapCount} laps, record ${proof.lapRecordTenths}, length ${proof.trackLengthHundredths}`);
  } else {
    console.log(`Usage:\n  node tools/f1-boundary-runtime-probe.mjs build <experimental.sna> <round-17-experimental.sna>\n  node tools/f1-boundary-runtime-probe.mjs verify <round-17-experimental.sna>`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
