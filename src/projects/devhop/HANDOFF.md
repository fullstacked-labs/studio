# devhop films: handoff

## Handoff 2026-10-27

How films are made here is in the project skill `.claude/skills/studio-craft/`;
read it first. This note is the state of devhop's films.

### Decisions (settled; don't re-ask)

- Four assets share video-shotcraft's recipes, because one film can't star them
  all: the README film (`DevhopDemo`), the long cut (`DevhopLong`), a "How it
  works" explainer and a launch poster (both still to build). The allocation is the
  table in `.claude/skills/studio-craft/references/shots.md`.
- The demo app is drawn from its own code (`TrailApp.tsx`) so its parts can move;
  Noor's call. Browser chrome follows Noor's iPhone screenshots
  (`captures/devhop/iphone/`); the iOS mic prompt is drawn from memory.
- The long cut's card flip goes from the http TypeError to the mic working over
  devhop. No collab cursors.
- The bunny never appears before the fix; afterwards each transition it causes
  starts from one of its jumps.
- The tailnet address 100.112.233.33 stays in the screenshots and the film.
- Mobile mic failure is in every browser, not Safari only: plain http on a
  non-localhost address is not a secure context, so `navigator.mediaDevices` is
  undefined (MDN). Script wording says so.

### State

- `DevhopDemo` (README film, 56 beats ≈ 25.8 s): drawn app, carried `night` dot
  and ripple, ring + hopping letters at the lockup. Exported to
  `exports/devhop/demo.{mp4,avif}`, `demo-nobgm.mp4`, `demo-poster.png` (frame
  1480). Verified by `scripts/export.mjs` on 2026-10-27: demo.mp4 -13.8 LUFS,
  -1.8 dBTP; demo-nobgm.mp4 -17.2 LUFS, -1.7 dBTP (main file's gain, +3.31 dB).
- `DevhopLong` (88 beats ≈ 40.6 s): critique round 2 (ROUNDS.md, "Long cut, round
  2"). Last render `out/long-r2-norm.mp4` (not in git): -14.0 LUFS, -1.6 dBTP;
  seven cues measured within ±7 ms (verified with `scripts/sync.mjs`). Not
  exported or published.
- devhop's own repo still shows the kangaroo-era `docs/demo.avif` and
  `docs/demo-poster.png`; swapping them is a devhop commit, not done.

### Open

- [ ] Long cut rounds 3 and 4, then an independent review (qa.md), then export.
- [ ] Cut `DevhopDemo` down to ≈15 s for the README (the brief asks for it).
- [ ] Build the "How it works" explainer (`DevhopHow`): paper-title-card opener,
      basic-3d-scene stations (iPhone Safari → `*.trycloudflare.com` → devhop proxy,
      Host → `localhost:3000` → Vite :3000, from devhop's README diagram),
      orb-flyline-relay overview with the bunny as the flyline head.
- [ ] Build the launch poster (`DevhopPoster`): assemble-then-type-flyin, a ≈5 s
      loop at 1920×1080 and a 1280×640 still for GitHub's social preview.
- [ ] Noor: approve swapping the new exports into devhop's README.

### Restart

`Read src/projects/devhop/HANDOFF.md and .claude/skills/studio-craft/SKILL.md, then continue with the long cut's round 3.`
