# Critique rounds

Each round: `npm run qa -- DevhopDemo` (a still every half second, or `--frames` at the
beats in question), read the sheet as a senior motion designer, fix, repeat. The first
film (a 3D loop without music or story text) and its five rounds are in the history;
this log is the rebuild.

## Why the rebuild

Feedback on the first film: no text guiding the story, camera moving back and forth
without intent, no rhythm. Causes: it had no music, so nothing set the timing; it had
almost no words; and the camera flew wherever the next thing was. The rebuild follows
video-shotcraft's method: music first with a measured beat grid, timeline in beats,
shot cards adapted from its tuned demos, one caption at a time, and a camera that only
travels left to right riding a hop.

## Round 1

- Kangaroo disappeared on the white QR code and covered `night` in the editor: hops now
  start from the top edge of what they leave, and the mascot is drawn in the accent
  color with a shadow.
- Dashboard text was about 22 px on screen: terminal type 28 → 32 px, and the camera
  holds close on the rows (≈ 34 px) instead of the whole window.
- `Press Ctrl+C …` ran into the caption in the QR shot; the QR now sits center right and
  higher.
- BLOCKED was clipped by the terminal window: the laptop's windows moved further left.
- `226ms` read as one word: an en space before `ms`.

## Round 2

- The outgoing caption wrapped into a narrow column (its absolute wrapper had no width).
- In the problem shot the whole phone read as a white slab: the camera stays closer, on
  the error text, and BLOCKED moved up beside it.

## Round 3

- Chapter label overlapped a two-line caption: the next caption was mounted early with no
  height. Captions now show strictly one at a time.
- Dashboard rows sat behind the caption (the framing moved the wrong way); raised.
- The QR wiped in under a caption: it now prints as the camera arrives on it, which also
  gives it its own reveal.
- Full render with sound: −17.5 LUFS, true peak −1.9 dB. The export is normalized to
  −14 LUFS with a −1.5 dB ceiling.
- Sound sync: cues measured 43–51 ms late, so `OUTPUT_AUDIO_OFFSET_SEC` became 0.047.
  That measurement was wrong (see round 5).

## Round 4

- Mascot changed to a low-poly bunny (devhop's CLI badge is now 🐇); captures re-taken
  so the terminal shows the new badge. The measured hot reload in that run is 195 ms.
- The bunny was small in the wide rides: hops 190 → 230 and 170 → 210 px (round 5 sets
  220 and 130, with lower arcs).

## Round 5: independent review

A fresh agent reviewed round 4 with shotcraft's final-review.md and the mg-styles-15 jury
rubric (`out/review/REVIEW.md`, scores 5–7). What it found and what changed:

- Every sound was 42–49 ms early. The round 3 offset had been measured on a raw `.aac`
  dump, which keeps the encoder's priming; the MP4 carries an edit that removes it.
  `OUTPUT_AUDIO_OFFSET_SEC` is 0, measured on a decode of the MP4.
- Motion blur showed as six stepped copies 15–25 px apart. The sample count now follows
  the fastest on-screen speed (copies ≤ 2.5 px apart, up to 16), the Enter pull-back
  eases instead of snapping, and the hop rides pull out half as far.
- The command and the QR were soft: focus was measured to each window's center, so the
  shot's own subject was defocused. Now measured to the nearest edge.
- The bunny flew into the logo tail first: it now faces its direction of travel and
  turns around on landing, stretches at take-off, hops lower so it stays in frame, and
  sits beside `night;` instead of over line 1.
- Holds no longer freeze: every hold has a slow push and yaw, the QR shot has a cyan
  wave from the bunny's feet on sixteenths, and the logo pushes in 3 % with a pill glow
  on each beat. The scene behind the logo fades out fully; a ring marks the landing.
- The Host rewrite is now a picture: after the first landing the camera pushes into the
  address bar and the hostname rolls over to devhop's tunnel, the lock flashing.
- BLOCKED's outline letters overlapped (negative tracking); LIVE now settles solid cyan;
  each word fades after it rolls away; "195 ms" has a MEASURED HOT RELOAD label.
- Captions are one line each (≤ 32 characters), so the chapter label never jumps, plus a
  bottom band so they read over white pages. A caption runs from beat 0.5, and the film
  opens on the error with no fade (no black first frame in the README loop).

## Round 6: second review

A second fresh review (`out/review/REVIEW-2.md`) of round 5:

- The camera still reversed direction inside shots; every return to the laptop is now a
  cut on a bar line and the camera only travels left to right.
- The address-bar close-up moved the camera back and forth off the beat, so the Host rewrite
  is now a chip pinned top center during the first hop, rolling from the tunnel's hostname
  to `localhost:<port>`.
- The bunny faces its direction of travel, climbs out of the QR code, and wraps off the right
  edge into the logo instead of turning around.
- Holds push and yaw slowly; the motion-blur threshold drops samples below 20 px a frame.
- BLOCKED's `D` contour, caption wording against what the picture shows, and the music
  quieter under the problem than after the drop.

# Long cut

`DevhopLong` (84 beats, 38.8 s): a problem chapter from real phone captures over the
track's eight quiet bars, the film from the cut to the terminal on, and a chapter on the
agent skill. Feedback that started it: the short film's intro read as a Vite-only fix.

- The secure-context rule is in every browser, not Safari's: over plain http on a
  non-localhost address `navigator.mediaDevices` is undefined. Captured on an iPhone in
  Safari and in Chrome (`captures/devhop/iphone/`), plus Chrome on `localhost:3000`.
- The captures moved to port 3000 to match that screenshot (`PORT=3000`), and record
  Vite's own startup banner and the `allowedHosts` edit Vite's error asks for.

## Long cut, round 1

- The repeated-tap stack showed half a line at the seam between screenshots: the first
  error block ends at y 1015 in the phone's pixels, not 1041.
- ⌘V/⌘S keycaps covered the pasted hostname; moved below the editor.
- Terminal shots sat small at the top of an empty frame: larger type, the commit shot lower.
- The SKILL.md card was 22 px type in a corner under the caption band; it is now centered
  under the lockup at 28 px, and the tagline gives way to it.

## Long cut, round 2: shotcraft recipes

Ten of video-shotcraft's recipes, each the main event in one place
(plan: one recipe stars once per film, two title styles, at most three
whole-frame hits: the drop, the pill, the grain condensing). The demo app is
drawn from its own code (`TrailApp.tsx`), so its parts can move; Noor's iPhone
screenshots set the look of Safari's and Chrome's chrome.

- Chapter 01 ends in one terminal-3d ride (Chrome → `vite.config.js` → git →
  a new tunnel) instead of hard cuts, with git's real output
  (`capture-git.mjs`) and a glitch-cycle through real quick-tunnel hostnames
  that leaves the committed `allowedHosts` entry struck out.
- Hop1's landing flips the phone (card-flip-reveal) from the http TypeError to
  devhop's HTTPS; the page assembles as the back comes round
  (assemble-then-type-flyin), and the bunny hops onto Voice note, then Allow.
- Hop2 carries the edit: `night` lifts off its line, collapses CRT-style to a
  dot in the bunny's paws, and the night ripple opens where it lands. The word
  first collapsed in place and read as struck out; it now lifts first.
- The lockup: a ring three times the bunny's size closes on its landing with
  a 6 % brake; the letters hop up out of a cropped baseline (split-text-stagger).
- Dust specks in world space give the camera parallax (basic-3d-scene).
- Chapter 04: the bunny hops the SKILL.md card's corners and draws its
  outline (draw-svg-trace); the Vite and `navigator.mediaDevices` rows hop out
  to cards (panel-to-canvas); the card boils and condenses into the pill as the
  lockup comes back down (grain-dissolve). The pill sat on the card's top
  edge; the lockup now lifts 340 px and the card starts at 440.
- The ride's flights were missing (the camera switched stations at the start
  of each flight instead of on arrival).
