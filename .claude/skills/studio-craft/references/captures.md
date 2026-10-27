# Captures

What a viewer reads as the product comes from the product. Each product's
`fixtures/<product>/` holds the scripts and its README lists every capture file.

## Terminals

Run CLIs under `script(1)` so they see a TTY and print colors, progress and QR codes:

```js
spawn('script', ['-q', '-e', '-c', `stty cols 80 rows 40; <command>`, '/dev/null'], { env: { ...process.env, TERM: 'xterm-256color', SHELL: '/bin/sh' } });
```

- `stty` inside the command sets the pty size; `COLUMNS`/`LINES` alone don't.
- Output lines end in `\r\n`: match with `[^\n]*\n`, not `.*\n`.
- Kill the real process (`pgrep -f` on its command line), not `script`, and send
  the signal the user would (SIGINT for Ctrl+C), so shutdown output is real too.
- `parseAnsi` in `src/lib/ansi.ts` replays SGR colors and treats `\r` as a line
  rewind, so progress counters collapse to their last state.

## git

`fixtures/devhop/capture-git.mjs` is the pattern: a throwaway repo with a local bare
remote in a temp dir, `GIT_CONFIG_GLOBAL=/dev/null` so signing and the user's
identity stay out, author `you`. Offline and repeatable.

## Tunnels and hostnames

Quick-tunnel hostnames are random per run. Old capture runs leave real ones in
the history of `meta.json` (`jj file show -r <rev> captures/<product>/meta.json`);
collect them there before opening new tunnels. Every tunnel run needs network: ask
first.

## Phone screenshots

Noor takes them on an iPhone. On public Wi-Fi the phone can't reach the laptop's
LAN, so serve the page on the tailnet: `python3 -m http.server <port> --bind <tailnet-ip>`.
Plain http on a non-localhost address is not a secure context in any browser, so
`navigator.mediaDevices` is undefined there (MDN: secure contexts only); that is
the same TypeError in Safari and Chrome on iOS. Ask for the specific states you
need (first load, after one tap, after many taps) and say why.

## When drawing is allowed

The product's own demo app may be drawn from its own code when its parts need to
move (`src/projects/devhop/TrailApp.tsx` mirrors `App.jsx` and imports
`themes.js` directly). Browser chrome is drawn after real screenshots of that
browser. Third-party pages (Vite's block page, Chrome's error page) stay
screenshots. A system dialog drawn from memory is labelled as such in the
component's header comment.
