// Sound effects synthesized in code, so there are no sample licenses to track.
// node scripts/sfx.mjs → captures/sfx/*.wav (48 kHz, 16-bit mono)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RATE = 48000;
const out = resolve(import.meta.dirname, '../captures/sfx');
mkdirSync(out, { recursive: true });

// Deterministic noise so every run writes identical files.
let seed = 1;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 31 - 1;
};

const render = (seconds, fn) => {
  const n = Math.round(seconds * RATE);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = fn(i / RATE, i);
  return s;
};

const lowpass = (s, cutoff) => {
  let y = 0;
  return s.map((x, i) => {
    const c = typeof cutoff === 'function' ? cutoff(i / RATE) : cutoff;
    const a = 1 - Math.exp((-2 * Math.PI * c) / RATE);
    y += a * (x - y);
    return y;
  });
};

const wav = (name, s, gain = 0.9) => {
  const peak = s.reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1;
  const buf = Buffer.alloc(44 + s.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + s.length * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(s.length * 2, 40);
  s.forEach((x, i) => buf.writeInt16LE(Math.round((x / peak) * gain * 32767), 44 + i * 2));
  writeFileSync(join(out, `${name}.wav`), buf);
};

const env = (t, attack, decay) => Math.min(1, t / attack) * Math.exp(-t / decay);

// Key: a short, bright tick with a little body.
wav('key', render(0.05, (t) => (noise() * 0.7 + Math.sin(2 * Math.PI * 1800 * t) * 0.3) * env(t, 0.0008, 0.008)), 0.6);

// Whoosh: noise swelling through a sweeping low-pass.
const whooshLen = 0.7;
wav('whoosh', lowpass(render(whooshLen, (t) => noise() * Math.sin((Math.PI * t) / whooshLen) ** 2), (t) => 300 + 2600 * Math.sin((Math.PI * t) / whooshLen)), 0.7);

// Rise: the hop taking off, a gliding sine with a soft octave.
wav('rise', render(0.75, (t) => {
  const f = 260 * 2 ** (t * 1.6);
  const ph = (2 * Math.PI * 260 * (2 ** (t * 1.6) - 1)) / (1.6 * Math.LN2);
  return (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * Math.min(1, t / 0.25) * Math.min(1, (0.75 - t) / 0.12) * (f > 0 ? 1 : 0);
}), 0.5);

// Impact: pitched-down thump plus a noise transient.
wav('impact', render(0.6, (t) => {
  const ph = 2 * Math.PI * (45 * t + (40 * (1 - Math.exp(-t / 0.05))) * 0.05);
  return Math.sin(ph) * env(t, 0.002, 0.16) + noise() * env(t, 0.0005, 0.012) * 0.6;
}), 0.9);

// Shimmer: high partials with a quick tremolo, for the theme ripple.
wav('shimmer', render(1.2, (t) => [1760, 2217, 2637, 3520].reduce((sum, f, i) => sum + Math.sin(2 * Math.PI * f * t + i) / (i + 1), 0) * env(t, 0.03, 0.35) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 14 * t))), 0.35);

// Logo: one warm low chord under the wordmark.
wav('logo', render(2.6, (t) => [110, 164.8, 220, 329.6].reduce((sum, f, i) => sum + Math.sin(2 * Math.PI * f * t) * [1, 0.6, 0.5, 0.25][i], 0) * Math.min(1, t / 0.08) * Math.exp(-t / 1.1)), 0.6);

console.log(out);
