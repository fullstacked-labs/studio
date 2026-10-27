# devhop captures

`app/` is a small Vite + React page with a day and a night theme. `capture.mjs` puts it through two real tunnels
and records what a phone sees:

| File | What it is |
| --- | --- |
| `blocked.png` | the app through a plain `cloudflared` quick tunnel: Vite's block page at phone width, 4x |
| `terminal.ansi` | `devhop <port>` run under a pseudo-TTY, colors and QR code included |
| `loaded.png` | the app through devhop's tunnel |
| `edited.png` | the same page after `App.jsx` switches `themes.day` to `themes.night`, with no reload |
| `meta.json` | port, URLs, versions, and the measured hot-update latency (`hmrMs`) |

```bash
cd fixtures/devhop/app && npm ci && cd -
node fixtures/devhop/capture.mjs     # needs network; port 5173 free (or PORT=…)
```

It expects a devhop checkout at `../apps/devhop` relative to this repo (`DEVHOP_DIR`
overrides it), the cloudflared devhop has already cached in `~/.cache/devhop/bin`,
and Chromium at `/usr/bin/chromium` (`CHROME` overrides it). The trycloudflare
hostnames in the captures stop resolving once the run ends.

## Render

```bash
node scripts/sfx.mjs                                   # synthesized sound effects
npx remotion render src/index.ts DevhopDemo exports/devhop/demo.mp4 --crf=16
npx remotion still src/index.ts DevhopDemo exports/devhop/poster.png --frame=900
# README animation: AV1 in AVIF, encoded from PNG frames (never from the h264 MP4).
npx remotion render src/index.ts DevhopDemo out/frames --sequence --image-format=png --scale=0.6667
ffmpeg -framerate 60 -i out/frames/element-%03d.png \
  -c:v libaom-av1 -crf 26 -cpu-used 6 -row-mt 1 -pix_fmt yuv444p exports/devhop/demo.avif
```

devhop's README embeds `demo.avif` and `poster.png` as `docs/demo.avif` and
`docs/demo-poster.png`. Animated WebP was tried and dropped: with a camera that never
stops, libwebp's animation encoder either leaves stale 8×8 blocks on dark gradients or
grows past 20 MB.
