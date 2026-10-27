# devhop launch loop: brief

## Product

- devhop puts a local dev server on a phone: `npx devhop`, scan the QR, and the app
  loads with hot reload. No config edits, no accounts.
- Promise: your dev server, on your phone, in one command.
- Three beats in order: the problem (Vite blocks the phone), the fix (`npx devhop`),
  the payoff (an edit on the laptop hot-reloads on the phone).

## Story

- Hook, command, hop, live edit, logo. About 15.5 s; it loops in the README.
- The thread: a glowing cyan arc with the 🦘 at its head. It carries the URL from the
  QR code to the phone, then carries the edit from the editor to the phone, and its
  last hop lands in the wordmark.
- The camera flies between objects placed in one dark 3D space (terminal, editor,
  phone). No cuts or fades inside the film; each scene hands over to the next by
  camera move or by the hop.
- A giant outlined word sits behind the phone: BLOCKED, rolling to LIVE when the
  first hop lands. That technique is used once.
- The live edit must change the whole screen: day theme to night theme, revealed by a
  ripple from where the hop lands. The hot-reload number is the measured `hmrMs`.

## Format

- 1920×1080, 60 fps. MP4 with sound for social; animated WebP (1280 wide, 30 fps,
  high quality, encoded from PNG frames, not from the MP4) for the README.
  (Shipped as animated AVIF instead; see fixtures/devhop/README.md.)

## Look

- Stage #07090C, ink #EDEFF3, secondary ink #8A93A3, one accent: cyan #3FE0F0
  (the devhop badge). Product pixels (screenshots, real terminal colors) keep theirs.
- Headlines Inter Tight 800, code JetBrains Mono.
- Depth: perspective floor grid, backlight behind the object in focus, floor pool,
  defocus on objects away from the camera.
- Avoid: template layouts (headline left, card right), stock icons, glints on
  everything, a second accent color.

## Motion

- The camera never sits frozen; settled shots creep.
- Flights are asymmetric in-out with a pull-back bump, with directional blur while
  the camera moves.
- Every word that must be read is big at its moment: command 52 px, dashboard 24 px
  at 1:1, error text zoomed until it fills the frame.

## Sound (MP4 only)

- Made in code. Key clicks on typing, a whoosh per flight, a rising tone on each hop,
  a soft impact on landing, a shimmer on the theme ripple, one low note under the logo.
- Every sound sits on the frame of its action.

## Quality check

- Render a frame every half second, critique like a senior motion designer (story,
  layout, type, timing, depth, readability), fix, repeat. At least four rounds.
  Write down what changed each round in `ROUNDS.md`.
