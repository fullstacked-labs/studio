---
name: studio-craft
description: Making or changing a film in the studio repo (Remotion, timed in beats of the music, built from real captures). Use when starting a product's film, adding or reworking a shot from video-shotcraft's recipe cards, taking or redoing captures, running a critique round (QA sheet, review), checking sound sync, or exporting MP4/AVIF/posters.
---

# studio-craft

A film here is a timeline in beats (`src/projects/<product>/timeline.ts`), shots built
from real captures (`captures/<product>/`), and a log of critique rounds
(`src/projects/<product>/ROUNDS.md`). The brief for each product is its `BRIEF.md`.

## The loop

Every change to a film goes round this loop until the round's sheet has nothing
left to fix.

1. **Time it in beats.** Cuts on bar lines (every 4 beats), actions on beats or
   sixteenths, sounds pinned to the beat their peak lands on. Done when every new
   moment is a named beat in `timeline.ts`, not a frame number in a component.
2. **Build the shot.** Real captures for everything a viewer reads as the product;
   recipes adapted from video-shotcraft. Done when `npm run typecheck` passes.
3. **Look at it.** `node scripts/qa.mjs <Comp> --beats … --grid <product>` at the
   beats you changed, then a whole-film sheet (`--every 30 --scale 0.25`). Done
   when you have read every still and written down each fault.
4. **Fix and log.** Each fault fixed, then one line in `ROUNDS.md` under the
   round: what was wrong and what changed. Done when the next sheet shows the fix.
5. **Render and measure.** Full render, `scripts/sync.mjs` on the new cues,
   loudness through `scripts/export.mjs`. Done when every cue is within ±10 ms
   and the file reads -14 LUFS, ≤ -1.5 dBTP.

A film ships after at least four rounds and one independent review by a fresh
agent (qa.md says how).

## References

Read the one the task touches:

- [references/shots.md](references/shots.md): video-shotcraft's cards in English,
  which ones each film uses, the allocation rules, how to port a demo.
- [references/captures.md](references/captures.md): capturing terminals, git, phone
  screenshots and tunnels for real; when drawing an app from its own code is allowed.
- [references/qa.md](references/qa.md): contact sheets, what to look for, the
  independent review.
- [references/sound.md](references/sound.md): beat grid, cue offsets, sync check,
  loudness and export.
