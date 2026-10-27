# devhop captures

`app/` is a small Vite + React page. `capture.mjs` puts it through two real tunnels
and records what a phone sees:

| File | What it is |
| --- | --- |
| `blocked.png` | the app through a plain `cloudflared` quick tunnel: Vite's block page, iPhone-sized |
| `blocked-text.png` | the same response in a narrow desktop window, for the magnified loupe |
| `terminal.ansi` | `devhop <port>` run under a pseudo-TTY, colors and QR code included |
| `loaded.png` | the app through devhop's tunnel |
| `edited.png` | the same page after `App.jsx` changes its accent color, with no reload |
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
npx remotion render src/index.ts DevhopDemo exports/devhop/demo.mp4 --crf=12
npx remotion still src/index.ts DevhopDemo exports/devhop/poster.png --frame=440
ffmpeg -i exports/devhop/demo.mp4 -vf "fps=20,scale=1280:-1:flags=lanczos" \
  -c:v libwebp_anim -q:v 70 -compression_level 6 -loop 0 exports/devhop/demo.webp
```

`demo.webp` is what devhop's README embeds as `docs/demo.webp`.
