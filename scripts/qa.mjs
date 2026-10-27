// Contact sheet for critique rounds: bundles once, renders stills, tiles them with
// ImageMagick. Stills from earlier runs are deleted first, so the sheet and the
// f*.png files only ever show this run.
// node scripts/qa.mjs DevhopDemo                      a still every half second
//   [--every 30]                                       … or every N frames
//   [--frames 0,96,412]                                … or these frames
//   [--beats 37.2,37.45 --grid devhop]                 … or these beats of analysis/<grid>/beat_data.json
//   [--scale 0.5] [--crop 600x260+180+0] [--tile 4x]   crop is in the scaled still's pixels
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [id, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
if (!id) throw new Error('usage: node scripts/qa.mjs <composition> [--every N | --frames a,b | --beats a,b --grid <product>] [--scale S] [--crop WxH+X+Y] [--tile 4x]');

const root = resolve(import.meta.dirname, '..');
const serveUrl = await bundle({ entryPoint: join(root, 'src/index.ts'), publicDir: join(root, 'captures') });
const composition = await selectComposition({ serveUrl, id });

let frames;
let labels;
if (opt('beats')) {
  const grid = opt('grid');
  if (!grid) throw new Error('--beats needs --grid <product> (reads analysis/<product>/beat_data.json)');
  const { T } = JSON.parse(readFileSync(join(root, 'analysis', grid, 'beat_data.json'), 'utf8'));
  const beats = opt('beats').split(',').map(Number);
  frames = beats.map((b) => Math.round(b * T * composition.fps));
  labels = beats.map((b) => `beat ${b}`);
} else if (opt('frames')) {
  frames = opt('frames').split(',').map(Number);
} else {
  const every = Number(opt('every', composition.fps / 2));
  frames = Array.from({ length: Math.ceil(composition.durationInFrames / every) }, (_, i) => i * every);
}

const dir = join(root, 'out/qa', id);
mkdirSync(dir, { recursive: true });
for (const f of readdirSync(dir)) if (/^f\d+\.png$/.test(f)) rmSync(join(dir, f));

const files = [];
for (const [i, frame] of frames.entries()) {
  const output = join(dir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({ serveUrl, composition, frame, output, scale: Number(opt('scale', 0.5)) });
  if (opt('crop')) execFileSync('magick', [output, '-crop', opt('crop'), '+repage', output]);
  if (labels) execFileSync('magick', [output, '-set', 'label', labels[i], output]);
  files.push(output);
  process.stdout.write(`${frame} `);
}
const sheet = join(dir, 'sheet.png');
execFileSync('magick', ['montage', ...files, '-tile', opt('tile', '4x'), '-geometry', '+4+4', '-background', '#222', '-pointsize', '18', '-fill', '#fff', '-label', labels ? '%l' : '%t', sheet]);
console.log(`\n${sheet}`);
