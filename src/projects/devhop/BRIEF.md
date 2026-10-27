# devhop launch film: brief

Made the video-shotcraft way (autonomous mode): this brief, shot recipe cards adapted
from the skill's tuned demos, a timeline in beats of the music, render-and-critique
rounds in `ROUNDS.md`, then an independent review.

## Product

- devhop puts a local dev server on a phone: `npx devhop`, scan the QR, and the app
  loads with hot reload. No config edits, no accounts.
- Promise: your dev server, on your phone, in one command.
- Three chapters, each named on screen: 01 the problem (Vite blocks a tunnel's host),
  02 the fix (`npx devhop`, scan, the app loads), 03 live edit (a change on the laptop
  hot-reloads the phone).

## Story

- Every chapter is told in words as well as pictures: a mono chapter label and one
  short caption at a time, bottom left, in the words of the README. No stretch of more
  than about two seconds without text, except the logo.
- The thread is a hop by devhop's mascot, a low-poly bunny (🐇 in the CLI). It climbs
  out of the QR code, jumps to the phone, and the screen changes from where it lands. It jumps again from the edited line, and a
  third time into the logo.
- Direction carries meaning. The laptop's windows are stage left, the phone stage
  right. The camera only travels left to right, and only riding a hop; going back to the
  laptop is a hard cut on a bar line. Inside a shot there is one move.
- A big word behind the phone rolls BLOCKED → LIVE → the measured `hmrMs`.

## Shot cards (video-shotcraft)

| Beat | Card | Adapted |
| --- | --- | --- |
| Terminal and camera | camera/terminal-3d | pose table + inverse camera, pull-back bump, typing on a beat grid |
| Hops | effects/glow-flyline-moves (flyline-arc) | bright head, fading tail, impact ring at landing |
| Screen changes | interaction/theme-switch-moves (palette-theme-ripple) | ripple from the landing point on the landing frame, echo ring, 1.035 → 1 settle |
| Big word | typography/vertical-word-roll-blur-cycle | 0.7 outQuint + 0.3 outBack, vertical blur by distance, accent only when settled |
| Captions | typography/blur-slide | y, blur and opacity on one progress, one word per sixteenth note |
| The edit | typography/typewriter-moves (error-retype) | cursor hesitates on `day`, backspace, `night` without a pause |
| Logo | outro/logo-shrink-wordmark-lockup | icon lands, slides aside, letters slide in with focus blur, line under it last |

## Format

- 1920×1080, 60 fps, 56 beats at 130 bpm (25.9 s). MP4 with and without music for
  social; animated AVIF (from PNG frames) for the README.

## Look

- Stage #07090C, ink #EDEFF3, secondary ink #8A93A3, one accent: cyan #3FE0F0
  (the devhop badge). Product pixels (screenshots, real terminal colors) keep theirs.
- Headlines Inter Tight 800, code and labels JetBrains Mono.
- Depth: perspective floor grid, backlight behind the object in focus, floor pool,
  defocus on objects away from the camera.
- Readable text: captions 64 px, labels 32 px, terminal 32 px close up.

## Motion

- Every cut, camera move, hop and landing starts on a beat; typing and printing run on
  sixteenth notes.
- Whole-frame hits: two (the first landing's push-in, the logo stamp), per shotcraft R4.
- Real motion blur where things move fast: six sub-frame renders in a 180° shutter,
  blended with equal weight.

## Sound

- Music: "Cat Walk" by Arulo (Mixkit), from bar 4: four quiet bars for the problem,
  the drop on the Enter key, the track's one-bar dip for the logo, back in for
  `npx devhop`.
- Effects from shotcraft's Mixkit library, film vocabulary (whoosh, impact, sparkle) plus
  foley for typing and the ⌘S key. Every cue is placed by its measured peak.

## Quality check

- Contact sheet every half second, critique as a senior motion designer (story, layout,
  type, timing, depth, readability, sound against picture), fix, repeat. At least four
  rounds, logged in `ROUNDS.md`. Then an independent review by a fresh agent.
