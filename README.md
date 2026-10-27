# studio

Marketing assets (README animations, social clips, posters) for fullstacked-labs
projects, rendered with [Remotion](https://www.remotion.dev/) from real captures.

The pixels a viewer reads as the product come from the product: screenshots taken
through a real run, terminal output recorded from the real CLI. Only the frame
around them (window chrome, a phone body, an editor pane) is drawn here.

## Layout

```text
src/lib/                 shared pieces: Terminal (ANSI replay), Editor, Phone, fonts
src/projects/<product>/  compositions for one product
captures/<product>/      real screenshots, recorded output, meta.json (served as static files)
captures/sfx/            synthesized sound effects (scripts/sfx.mjs)
fixtures/<product>/      apps and scripts that produce the captures
exports/<product>/       finished renders: mp4, animated AVIF, poster
```

## Commands

```bash
npm install
npm run dev                                         # Remotion Studio preview
node fixtures/devhop/capture.mjs                    # re-capture devhop (needs network)
npm run qa -- DevhopDemo                            # contact sheet, a still every half second
```

Rendering and the AVIF encode are per product; devhop's are in
`fixtures/devhop/README.md`. Finished files are committed under `exports/<product>/`.

## License

Code here is MIT; `src/lib/motion.tsx` adapts Apache-2.0 code, see `NOTICE`. Remotion has its own
[license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md): free for
individuals and companies of up to three people, a company license above that.
