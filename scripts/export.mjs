// Finished files for one composition:
//   <out>.mp4        h264 CRF 16, music normalized to -14 LUFS, true peak ≤ -1.5 dB
//   <out>-nobgm.mp4  the same picture with sound effects only, at the same gain
//   <out>.avif       AV1 in AVIF for READMEs, encoded from PNG frames (never from
//                    the h264, whose chroma blur the AV1 encoder would keep)
//   <out>-poster.png one still
// node scripts/export.mjs DevhopDemo exports/devhop/demo [--nobgm] [--avif] [--poster 1480] [--avif-scale 0.6667] [--fps 60]
//
// Loudness: two-pass loudnorm in linear mode, then a limiter. The AAC encoder
// overshoots the limiter by up to ~2 dB, so the ceiling steps down until the
// encoded file measures ≤ -1.5 dBTP.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const [id, outBase, ...rest] = process.argv.slice(2);
const has = (name) => rest.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
if (!id || !outBase) throw new Error('usage: node scripts/export.mjs <composition> <out base path> [--nobgm] [--avif] [--poster frame]');

const root = resolve(import.meta.dirname, '..');
const tmp = join(root, 'out/export', id);
mkdirSync(tmp, { recursive: true });
mkdirSync(dirname(resolve(root, outBase)), { recursive: true });
const out = (suffix) => resolve(root, `${outBase}${suffix}`);
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
const remotion = (...args) => sh('npx', ['remotion', ...args, '--log=error']);

// ffmpeg prints its analysis on stderr.
const analyse = (file, filter) => execFileSync('sh', ['-c', `ffmpeg -hide_banner -nostats -i "${file}" -af "${filter}" -f null - 2>&1`], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
const ebur = (file) => {
  const text = analyse(file, 'ebur128=peak=true');
  const summary = text.slice(text.lastIndexOf('Summary:'));
  return { I: Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)[1]), TP: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)[1]) };
};

const encode = (src, dst, filter) => {
  for (let limit = 0.78; limit > 0.4; limit -= 0.04) {
    sh('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-i', src, '-c:v', 'copy', '-af', `${filter},aresample=48000,alimiter=limit=${limit.toFixed(2)}:attack=1:release=50:level=false`, '-c:a', 'aac', '-b:a', '256k', dst]);
    const m = ebur(dst);
    if (m.TP <= -1.5) return m;
    console.log(`  true peak ${m.TP} dB at limit ${limit.toFixed(2)}; lowering`);
  }
  throw new Error(`${dst}: could not get the true peak under -1.5 dB`);
};

// 1. Main mp4, normalized.
const raw = join(tmp, 'raw.mp4');
console.log(`rendering ${id}`);
remotion('render', 'src/index.ts', id, raw, '--crf=16');
const text = analyse(raw, 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json');
const m = JSON.parse(text.slice(text.lastIndexOf('{'), text.lastIndexOf('}') + 1));
const norm = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const main = encode(raw, out('.mp4'), norm);
console.log(`${out('.mp4')}: ${main.I} LUFS, true peak ${main.TP} dB`);

// 2. No music: the main file's gain, so the effects sit where they do with music.
if (has('nobgm')) {
  const rawFx = join(tmp, 'raw-nobgm.mp4');
  remotion('render', 'src/index.ts', id, rawFx, '--crf=16', '--props={"bgm":false}');
  const gain = -14 - Number(m.input_i);
  const fx = encode(rawFx, out('-nobgm.mp4'), `volume=${gain.toFixed(2)}dB`);
  console.log(`${out('-nobgm.mp4')}: ${fx.I} LUFS, true peak ${fx.TP} dB (gain ${gain.toFixed(2)} dB)`);
}

// 3. AVIF from PNG frames.
if (has('avif')) {
  const frames = join(tmp, 'frames');
  rmSync(frames, { recursive: true, force: true });
  remotion('render', 'src/index.ts', id, frames, '--sequence', '--image-format=png', `--scale=${opt('avif-scale', '0.6667')}`);
  const digits = /element-(\d+)\.png/.exec(readdirSync(frames).sort()[0])[1].length;
  sh('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-framerate', opt('fps', '60'), '-i', join(frames, `element-%0${digits}d.png`), '-c:v', 'libaom-av1', '-crf', '26', '-cpu-used', '6', '-row-mt', '1', '-pix_fmt', 'yuv444p', out('.avif')]);
  console.log(out('.avif'));
}

// 4. Poster.
if (opt('poster')) {
  remotion('still', 'src/index.ts', id, out('-poster.png'), `--frame=${opt('poster')}`);
  console.log(out('-poster.png'));
}
