// Contact sheet for critique rounds: bundles once, renders a still every
// `--every` frames (default: half a second), tiles them with ImageMagick.
// node scripts/qa.mjs DevhopDemo [--every 30] [--scale 0.5] [--frames 0,96,412]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [id, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
if (!id) throw new Error('usage: node scripts/qa.mjs <composition> [--every N] [--scale S] [--frames a,b,c]');

const root = resolve(import.meta.dirname, '..');
const serveUrl = await bundle({ entryPoint: join(root, 'src/index.ts'), publicDir: join(root, 'captures') });
const composition = await selectComposition({ serveUrl, id });
const every = Number(opt('every', composition.fps / 2));
const frames = opt('frames')
  ? opt('frames').split(',').map(Number)
  : Array.from({ length: Math.ceil(composition.durationInFrames / every) }, (_, i) => i * every);
const dir = join(root, 'out/qa', id);
mkdirSync(dir, { recursive: true });

const files = [];
for (const frame of frames) {
  const output = join(dir, `f${String(frame).padStart(4, '0')}.png`);
  await renderStill({ serveUrl, composition, frame, output, scale: Number(opt('scale', 0.5)) });
  files.push(output);
  process.stdout.write(`${frame} `);
}
const sheet = join(dir, 'sheet.png');
execFileSync('magick', ['montage', ...files, '-tile', '4x', '-geometry', '+4+4', '-background', '#222', '-pointsize', '18', '-fill', '#fff', '-label', '%t', sheet]);
console.log(`\n${sheet}`);
