# Shots from video-shotcraft

The recipe cards are at `~/.claude/skills/video-shotcraft/references/shots/<category>/<name>.md`
(in Chinese) with tuned demos in `demos/<category>/<name>/`. Read the card's 参数表
(parameter table) and 已知坑 (known pitfalls) before porting; the numbers are tuned.

## Allocation rules

From the cards' own aesthetic rules (`references/aesthetic-rules.md`):

- **One star per recipe per film** (P4). A recipe that already stars elsewhere in
  the film can only appear as an ingredient (devhop's films use basic-3d-scene's
  dust, not its station tour).
- **At most two title-entrance styles per film.** devhop: blur-slide for captions
  and rows, split-text-stagger for the wordmark.
- **At most three whole-frame hits** (R4). Long cut: the drop on Enter, the pill
  stamp, the grain condensing into the pill.
- **Glows and sweeps once per shot**, on the subject only (Q4).
- Too many recipes for one film → spread them across assets: README film, long
  cut, explainer, poster.

## Porting

Adapt the demo into `src/lib/` (shared) or the film's own files, keep the card's
timing ratios and convert its frame counts to beats (1 beat ≈ 27.7 frames at
60 fps, 130 BPM). Put a header comment naming the card and
`video-shotcraft demos/<path> (Apache-2.0, see NOTICE)`. Use what's already here
first: `ramp`/`EASE`/`bezier`/`SpeedBlur`/`rand` in `src/lib/motion.tsx`, `Hop`,
`Impact`, `Ripple`, `Captions`, `Sound` in `src/projects/devhop/Demo.tsx`.

## The cards, in English, and where devhop uses them

| Card | What it does | Key numbers | devhop |
|---|---|---|---|
| blur-slide | words rise out of focus: y, blur, opacity on one progress value | word stagger ~4f, blur ≤12 % of font size | captions, SKILL rows |
| type-assembly-moves A (split-text-stagger) | letters rise from a cropped baseline, overshoot 10 %, drop back | 2f stagger | wordmark letters hop in |
| logo-shrink-wordmark-lockup | big ring collapses (5.4→1) into the mark with a 6 % brake, mark slides aside, letters in, tagline as one line | brake within the landing beat | ring closes on hop3's landing |
| theme-switch-moves B (palette-theme-ripple) | command collapses CRT-style to a dot; ripple opens from that dot on that frame | white-hot ring + echo 4f later, 1.035→1 settle | `night` → dot in the bunny's paws → night ripple |
| card-flip-reveal | card turns 194° and springs back to 180°, face darkens as it turns, light band across the edge at 90° | 4f lean, 16f turn, spring | phone flips from the http TypeError to devhop's HTTPS (long cut) |
| assemble-then-type-flyin | parts fly in without text, then letters fly in from 3D, headline first | text starts ~8f after the parts land | the demo app arrives on the phone |
| terminal-3d | windows posed in space, camera = inverse pose, flights bulge back so neighbours show | bulge sin(π·u^0.85)·1250 px | chapter 01 ride: Chrome → config → git → tunnel |
| glitch-cycle | one fixed-width slot cycles phrases; glitch probability keyframes [1,0,0,0.1,0,0,1], last [..,0] | reroll every 2f@30, RGB split by the same strength | tunnel hostnames, old `allowedHosts` struck out |
| draw-svg-trace | an element is drawn by a pen along its outline; on closing a short white/thick flash, then the content fills | outline loop ~40f@30 | the bunny hops the SKILL card's corners, the edge draws under it |
| canvas-materialize-moves A (panel-to-canvas) | rows lift, arc out with a lift of ~220 px, morph into cards, slots left dashed | row text out before card text in | SKILL rows → error cards |
| grain-dissolve | feTurbulence + feDisplacementMap boil text; it condenses into a short mark | displacement 52, reseed often | SKILL card boils into the pill |
| basic-3d-scene | impress.js-style stations, camera = inverse pose, 30 % pull-out on flights, overview at the end; dust fixed in world space | | dust for parallax; stations reserved for the explainer |
| glow-flyline-moves C (orb-flyline-relay) | glowing arcs between nodes; orbs behind each node surge on the landing frame | surge and landing share a constant | explainer (planned): the bunny as the flyline head |
| paper-title-card | one line pressed in word by word, one accent word, short underline | scale 1.28→1 + blur 7→0 | explainer opener (planned), dark variant |
| collab-cursor-moves | name-tagged cursors as actors | | not used (Noor declined) |

Bunny rule for devhop: the bunny never appears before the fix; after it arrives,
every transition it causes starts from one of its jumps.
