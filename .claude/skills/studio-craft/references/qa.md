# QA: contact sheets, critique rounds, the review

## Sheets

```bash
node scripts/qa.mjs DevhopLong --beats 44,44.3,44.6 --grid devhop --scale 0.4   # the beats you changed
node scripts/qa.mjs DevhopLong --every 30 --scale 0.25                          # the whole film
node scripts/qa.mjs DevhopDemo --beats 37.2,37.45 --grid devhop --crop 600x260+180+0 --tile 3x
```

Stills land in `out/qa/<Comp>/` and each run deletes the last run's, so the sheet
never mixes versions (a montage of a stale folder once showed hostnames from an old
capture). `--crop` works in the scaled still's pixels. Mid-motion beats matter
most: check a flight halfway, a flip at 90°, a reveal at 30 %, not just the poses
either side; a camera that jumped instead of flying looked fine on both ends.

## What to look for

Read each still as a senior motion designer, then list faults by name. Ones this
repo has had, worth checking every round:

- Something covering the subject: keycaps over the hostname, the pill over a
  card, the mascot over a dialog it is meant to press.
- A shape read as the wrong sign: a collapse over a word read as strikethrough;
  an outline that reads as a strike.
- Text under 3 % of frame height that the viewer must read; captions one line, at
  most 32 characters, so the chapter label never moves.
- A camera that reverses inside a shot (it travels left to right; going back is a
  cut on a bar line), or holds that freeze (every hold gets a slow push).
- Motion blur showing as a ladder of copies; sample count follows speed.
- More than three whole-frame hits in a film; glows given to more than one
  subject per shot.
- Captions that say something the picture doesn't show.

## Rounds

Log each round in `ROUNDS.md` as `## <Film>, round N` with one bullet per fault:
what was wrong, what changed, and the measurement when there is one. The log is
for the next agent; a fault fixed and not logged gets reintroduced.

## Independent review

After round 3 or 4, a fresh agent reviews the full render with no session context:
give it the MP4, the contact sheet, `BRIEF.md`, video-shotcraft's
`references/final-review.md`, and ask for a scored critique written to
`out/review/REVIEW-<n>.md`. Fix what it finds as the next round. A fresh reviewer
caught every sound running 45 ms early and the camera reversing, after four rounds
of self-review had missed both.
