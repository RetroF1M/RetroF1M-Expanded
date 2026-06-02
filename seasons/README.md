# RetroF1M Seasons

`f12023.sna` is the main baseline snapshot.

`f12023-modern.sna` is the current patched deliverable. It is generated
from `f12023.sna` with:

- modern top-10 race points: `25,18,15,12,10,8,6,4,2,1`
- the points-award loop patched from eight scoring positions to ten

Regenerate it with:

```sh
node tools/f1-season-tool.mjs patch-2023 seasons/f12023.sna seasons/f12023-modern.sna
```

For future seasons, export JSON from the nearest baseline, edit it, then
build a new `.sna`:

```sh
node tools/f1-season-tool.mjs export seasons/f12023.sna tools/seasons/f12023.json
node tools/f1-season-tool.mjs build seasons/f12023.sna tools/seasons/f12023.json seasons/f1YYYY.sna
```
