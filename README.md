# studio

Marketing assets (README animations, social clips, posters) for fullstacked-labs
projects, rendered with [Remotion](https://www.remotion.dev/) from real captures.

The pixels a viewer reads as the product come from the product: screenshots taken
through a real run, terminal output recorded from the real CLI. Only the frame
around them (window chrome, a phone body, an editor pane) is drawn here.

## Layout

```text
src/lib/                 shared pieces: Terminal (ANSI replay), Phone, Bunny, fonts, motion kit
src/projects/<product>/  compositions for one product, with BRIEF.md and ROUNDS.md
captures/<product>/      real screenshots, recorded output, meta.json (served as static files)
captures/audio/          music and sound effects, not in git (scripts/audio.mjs)
analysis/<product>/      beat grid of the music (scripts/beats.py)
fixtures/<product>/      apps and scripts that produce the captures
exports/<product>/       finished renders: mp4, animated AVIF, poster
```

## Commands

```bash
npm install
node scripts/audio.mjs                              # music + sound effects into captures/audio/
npm run dev                                         # Remotion Studio preview
node fixtures/devhop/capture.mjs                    # re-capture devhop (needs network)
npm run qa -- DevhopDemo                            # contact sheet, a still every half second
node scripts/sync.mjs <file.mp4> --grid devhop --beats "name=beat,…"   # sound drift per cue
node scripts/export.mjs DevhopDemo exports/devhop/demo --nobgm --avif --poster 1480
```

How a film is made here (the loop, captures, critique rounds, sound, shot recipes)
is in the project skill [`.claude/skills/studio-craft/`](./.claude/skills/studio-craft/SKILL.md).

Films follow video-shotcraft's method (installed as a Claude Code skill): a brief, shot
recipe cards adapted from its tuned demos, a timeline written in beats of the music, and at
least four render-and-critique rounds logged in `ROUNDS.md`.

Rendering and the AVIF encode are per product; devhop's are in
`fixtures/devhop/README.md`. Finished files are committed under `exports/<product>/`.

## License

Apache-2.0, see `LICENSE`. Parts are copied from video-shotcraft (also Apache-2.0); `NOTICE` lists
them. Remotion has its own [license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md):
free for individuals and companies of up to three people, a company license above that.
