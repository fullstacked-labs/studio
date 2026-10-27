# Critique rounds

Each round: `node scripts/qa.mjs DevhopDemo --scale 0.4`, read the sheet, fix, repeat.

## Round 1

- Big word (BLOCKED / LIVE / ms) cropped by the frame edge and covered by the phone; label cut.
  Smaller (230 px), anchored left of the phone's edge, nearer the phone in depth.
- The word leaked into terminal shots as stray letters. It now fades with the phone's focus.
- Editor landed in front of the terminal with both in focus. Moved it to its own spot,
  forward and center, so the others defocus.
- Kangaroo read as a speck in the wide hop: 120 → 190 (hop 1), 110 → 170 (hop 2).
- A dull teal disc sat behind the landed logo kangaroo. The glow now shows only in flight.

## Round 2

- BLOCKED still clipped at the left edge: 230 → 205 px, phone shot framed further right.
- Dead second of an empty terminal while typing: the camera now arrives close on the
  prompt (command as hero type), then pulls back as the dashboard prints.
- Hop landings had no weight: added a short push-in that settles (camera punch).
- The editor stayed in the foreground of the phone shot as a big blurred block: it now
  sinks out after its hop.

## Round 3

- The editor exit started too late and too slowly (ease-in): starts as the hop leaves,
  30 frames, swift curve.
- ⌘S keycaps were too small to register: 70 → 100 px.

## Round 4

- 1:1 crops of the hook, terminal and stat: all text sharp (the 2x phone layout works).
- "226 ms" bled through the dimmed world behind the wordmark: outro dims to 10 % with
  10 px blur.
- The glow disc behind the flying kangaroo read as a flat badge: removed; the trail's
  glow is enough.
- Added sound (MP4 only), synthesized by scripts/sfx.mjs and cued per action.

## Round 5

- Full sheet clean. Final MP4 1080p60 with sound (peak −3.5 dB).
- Animated WebP showed stale-block patches on the dark gradients even at quality 95;
  switched the README asset to animated AVIF (AV1, 4:4:4): 1.8 MB at 60 fps against
  8.9 MB for the WebP at 30 fps, no patches.
