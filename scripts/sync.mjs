// Sound sync check: decodes the rendered MP4 (not a raw audio dump, which keeps
// the encoder's priming and reads ~45 ms late) and finds the sharpest rise in
// level within ±60 ms of each cue's beat. Works with the music in; a cue that
// sits under a louder music hit can still lock onto the music, so check a
// suspicious drift against the --props='{"bgm":false}' render.
// node scripts/sync.mjs out/long.mp4 --grid devhop --beats "⌘V=19,⌘S=20.25,corner=74"
//   [--start-beat 0]   the film's first frame, in the grid's beats from t0 of the film (default 0)
//   [--tolerance 10]   ms; exits 1 if any cue drifts further
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [file, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
if (!file || !opt('beats') || !opt('grid')) throw new Error('usage: node scripts/sync.mjs <file.mp4> --grid <product> --beats "name=beat,…"');

const root = resolve(import.meta.dirname, '..');
const { T } = JSON.parse(readFileSync(join(root, 'analysis', opt('grid'), 'beat_data.json'), 'utf8'));
const start = Number(opt('start-beat', 0));
const tolerance = Number(opt('tolerance', 10));
const SR = 48000;

const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:a', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);

// 1 ms moving average of |x|; the onset is where it rises fastest.
const W = SR / 1000;
const onset = (t) => {
  const i0 = Math.max(W, Math.round((t - 0.06) * SR));
  const i1 = Math.min(x.length - 1, Math.round((t + 0.06) * SR));
  let sum = 0;
  for (let k = i0 - W; k < i0; k++) sum += Math.abs(x[k]);
  let prev = sum / W;
  let best = -Infinity;
  let at = i0;
  for (let k = i0; k < i1; k++) {
    sum += Math.abs(x[k]) - Math.abs(x[k - W]);
    const e = sum / W;
    if (e - prev > best) {
      best = e - prev;
      at = k - W / 2;
    }
    prev = e;
  }
  return at / SR;
};

let worst = 0;
for (const pair of opt('beats').split(',')) {
  const [name, beat] = pair.includes('=') ? pair.split('=') : [pair, pair];
  const t = (Number(beat) - start) * T;
  const drift = (onset(t) - t) * 1000;
  worst = Math.max(worst, Math.abs(drift));
  console.log(`${name.padEnd(18)} beat ${String(beat).padStart(6)}  ${(t * 1000).toFixed(1).padStart(8)} ms  drift ${drift >= 0 ? '+' : ''}${drift.toFixed(1)} ms${Math.abs(drift) > tolerance ? '  ✗' : ''}`);
}
console.log(`worst ${worst.toFixed(1)} ms (tolerance ${tolerance} ms)`);
process.exitCode = worst > tolerance ? 1 : 0;
