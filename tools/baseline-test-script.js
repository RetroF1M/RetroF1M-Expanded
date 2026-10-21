(async () => {
  const emu = window.emu;
  const zx = emu.zx;
  const ROUND = 0x6BB2;
  const TARGET = 22;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  console.log("=== RetroF1M Baseline Test ===");
  console.log("Loading f12023-boundary-experimental.sna");
  console.log("Target: Complete 22-round season");

  // Wait for emulator to be ready
  await sleep(2000);

  // Set speed to 128x for rapid progression
  console.log("Setting speed to 128x");
  emu.setState({ speed: 128 });

  const trace = [];
  const t0 = performance.now();
  let last = zx.get(ROUND);
  const mark = v => {
    const elapsed = +((performance.now() - t0) / 1000).toFixed(1);
    trace.push({ t: elapsed, round: v });
    console.log(`[Round ${v}] at ${elapsed}s`);
  };
  mark(last);

  // Function to tap Enter key
  const tapEnter = async () => {
    emu.kbd(~13, true, 0);
    await sleep(60);
    emu.kbd(~13, false, 0);
  };

  // Function to tap '0' key for 0 players
  const tapZero = async () => {
    emu.kbd(~48, true, 0);
    await sleep(60);
    emu.kbd(~48, false, 0);
  };

  console.log("Starting automated season progression...");

  // Initial setup: Select 0 players
  await sleep(1000);
  console.log("Selecting 0 players for automated mode");
  tapZero();
  await sleep(500);

  let reached = false;
  let seasonComplete = false;

  for (let i = 0; i < 800; i++) { // Extended budget for 128x speed
    await sleep(100);
    const r = zx.get(ROUND);

    if (r !== last) {
      last = r;
      mark(r);

      if (r === TARGET) {
        reached = true;
        console.log("Target round 22 reached! Slowing down to 1x...");
        emu.setState({ speed: 1 });
        break;
      }

      // Tap Enter periodically to advance menus
      if (i % 20 === 0) {
        tapEnter();
      }
    }

    // Tap Enter periodically anyway
    if (i % 15 === 0) {
      tapEnter();
    }
  }

  // Final snapshot after slowing down
  await sleep(2000);
  const finalRound = zx.get(ROUND);
  const finalSpeed = emu.getState().speed;

  const result = {
    reached,
    finalRound,
    last,
    trace,
    finalSpeed,
    totalTime: +((performance.now() - t0) / 1000).toFixed(1)
  };

  console.log("=== Test Complete ===");
  console.log(JSON.stringify(result, null, 2));

  return result;
})();
