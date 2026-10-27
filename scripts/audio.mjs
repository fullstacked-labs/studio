// Music and sound effects come from video-shotcraft's Mixkit library. Mixkit's
// license allows them in a rendered video but not redistributing the files, so
// they stay out of git: this copies them from the installed skill, or downloads
// them from Mixkit when the skill isn't there.
// node scripts/audio.mjs → captures/audio/
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const SKILL = process.env.SHOTCRAFT_DIR ?? join(homedir(), '.claude/skills/video-shotcraft');
const out = resolve(import.meta.dirname, '../captures/audio');

// [path under the skill's assets/audio, Mixkit source]. All under the Mixkit
// free licenses, no attribution required; URLs from the skill's ATTRIBUTION.md.
const FILES = [
  ['bgm/cat-walk.mp3', 'https://assets.mixkit.co/music/371/371.mp3'],
  ['sfx/text/typewriter-hit-soft.mp3', 'https://assets.mixkit.co/active_storage/sfx/1366/1366-preview.mp3'],
  ['sfx/text/typewriter-hit-single.mp3', 'https://assets.mixkit.co/active_storage/sfx/1382/1382-preview.mp3'],
  ['sfx/text/typewriter-hit-hard.mp3', 'https://assets.mixkit.co/active_storage/sfx/1364/1364-preview.mp3'],
  ['sfx/transition/whoosh-fast.mp3', 'https://assets.mixkit.co/active_storage/sfx/1490/1490-preview.mp3'],
  ['sfx/transition/sweep-fast-small.mp3', 'https://assets.mixkit.co/active_storage/sfx/166/166-preview.mp3'],
  ['sfx/impact/impact-zoom-quick.mp3', 'https://assets.mixkit.co/active_storage/sfx/772/772-preview.mp3'],
  ['sfx/impact/impact-deep-whoosh.mp3', 'https://assets.mixkit.co/active_storage/sfx/1143/1143-preview.mp3'],
  ['sfx/light/shimmer-sparkle-sweep.mp3', 'https://assets.mixkit.co/active_storage/sfx/2633/2633-preview.mp3'],
  ['sfx/light/sparkle-touch.mp3', 'https://assets.mixkit.co/active_storage/sfx/3083/3083-preview.mp3'],
  ['sfx/ui/switch-click-quick.mp3', 'https://assets.mixkit.co/active_storage/sfx/2582/2582-preview.mp3'],
  ['sfx/ui/switch-tap.mp3', 'https://assets.mixkit.co/active_storage/sfx/2585/2585-preview.mp3'],
];

mkdirSync(out, { recursive: true });
for (const [rel, url] of FILES) {
  const name = rel.split('/').pop();
  const src = join(SKILL, 'assets/audio', rel);
  if (existsSync(src)) {
    copyFileSync(src, join(out, name));
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    writeFileSync(join(out, name), Buffer.from(await res.arrayBuffer()));
  }
  console.log(name);
}
