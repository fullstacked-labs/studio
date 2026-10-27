# devhop captures

`app/` is a small Vite + React page with a day and a night theme. `capture.mjs` puts it through two real tunnels
and records what a phone sees:

| File | What it is |
| --- | --- |
| `blocked.png` | the app through a plain `cloudflared` quick tunnel: Vite's block page at phone width, 4x |
| `terminal.ansi` | `devhop <port>` run under a pseudo-TTY, colors and QR code included |
| `loaded.png` | the app through devhop's tunnel |
| `edited.png` | the same page after `App.jsx` switches `themes.day` to `themes.night`, with no reload |
| `vite.ansi` | Vite's startup banner with its default host, under a pseudo-TTY |
| `SKILL.md` | devhop's agent skill, copied as-is for the long cut |
| `git-commit.ansi`, `git-push.ansi` | `capture-git.mjs`: the `allowedHosts` edit from `meta.json` committed and pushed for real, in a throwaway repo with a local bare remote |
| `hostnames.json` | raw quick-tunnel hostnames from earlier capture runs (from this repo's history of `meta.json`), the first one the host in `meta.json`; each run gets a new one |
| `meta.json` | port, URLs, versions, the `allowedHosts` edit Vite asks for, and the measured hot-update latency (`hmrMs`) |
| `iphone/` | screenshots from a real iPhone, Safari and Chrome: `localhost:3000`, and `mic-test/` served over plain http on a tailnet address (`python3 -m http.server --bind <tailnet-ip>`) |

```bash
cd fixtures/devhop/app && npm ci && cd -
PORT=3000 node fixtures/devhop/capture.mjs   # needs network; the phone screenshots use port 3000
node fixtures/devhop/capture-git.mjs          # offline, after capture.mjs
```

It expects a devhop checkout at `../apps/devhop` relative to this repo (`DEVHOP_DIR`
overrides it), the cloudflared devhop has already cached in `~/.cache/devhop/bin`,
and Chromium at `/usr/bin/chromium` (`CHROME` overrides it). The trycloudflare
hostnames in the captures stop resolving once the run ends.

## Render

```bash
node scripts/audio.mjs                                  # music + sound effects (Mixkit, not in git)
node scripts/export.mjs DevhopDemo exports/devhop/demo --nobgm --avif --poster 1480
npx remotion render src/index.ts DevhopLong out/long.mp4 --crf=16   # the long cut, not exported yet
```

devhop's README embeds `demo.avif` and `demo-poster.png` as `docs/demo.avif` and
`docs/demo-poster.png`. Animated WebP was tried and dropped: with a camera that never
stops, libwebp's animation encoder either leaves stale 8×8 blocks on dark gradients or
grows past 20 MB.
