import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { parseAnsi, lineText, type Line } from '../../lib/ansi';
import { Editor } from '../../lib/Editor';
import { sans } from '../../lib/fonts';
import { Phone } from '../../lib/Phone';
import { Terminal } from '../../lib/Terminal';
import { useTextAsset } from '../../lib/useTextAsset';

export const DEVHOP_DEMO = { durationInFrames: 515, fps: 30, width: 1280, height: 800 };

const OLD_COLOR = "'#2563eb'";
const NEW_COLOR = "'#f97316'";
const APP_LINES = [
  `const accent = ${OLD_COLOR};`,
  '',
  'const trails = [',
  "  { name: 'Lakeside loop', km: 6.4, time: '1 h 40 min' },",
  "  { name: 'Ridge overlook', km: 9.1, time: '2 h 50 min' },",
  "  { name: 'Old mill path', km: 3.2, time: '55 min' },",
  '];',
];

// Beats, in frames. Each scene holds its payoff for at least a second so it
// can be read at README size before the next thing moves.
const T = {
  typeRaw: 12,
  blocked: 78,
  captionA: 84,
  sceneB: 165,
  typeDevhop: 176,
  dashboard: 206,
  loaded: 250,
  sceneC: 345,
  backspace: 372,
  retype: 388,
  save: 410,
  fadeOut: 500,
};

type Meta = { port: number; devhopUrl: string; blockedText: string; hmrMs: number };

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const fade = (frame: number, start: number, length = 8) =>
  interpolate(frame, [start, start + length], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
const typed = (text: string, frame: number, start: number, perChar: number) =>
  text.slice(0, Math.max(0, Math.floor((frame - start) / perChar)));

const prompt = (cmd: string): Line => [
  { text: '~/trailhead ', fg: '#61afef' },
  { text: '$ ', fg: '#5c6370' },
  { text: cmd },
];

// The dashboard is the real recording, trimmed to devhop's own output.
const dashboardLines = (raw: string): Line[] => {
  const lines = parseAnsi(raw);
  const start = lines.findIndex((l) => lineText(l).includes('DEVHOP'));
  const end = lines.findLastIndex((l) => lineText(l).includes('Press Ctrl+C'));
  if (start < 0 || end < 0) throw new Error('terminal.ansi does not contain the devhop dashboard');
  return lines.slice(start, end + 1);
};

const AddressBar: React.FC<{ host: string }> = ({ host }) => (
  <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7', borderBottom: '1px solid #d8d8de' }}>
    <div style={{ fontFamily: sans, fontSize: 12.5, color: '#1c1c1e', background: '#e3e3e8', borderRadius: 9, padding: '6px 12px', maxWidth: '88%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {host}
    </div>
  </div>
);

const Screen: React.FC<{ src: string; opacity: number }> = ({ src, opacity }) => (
  <Img src={staticFile(src)} style={{ position: 'absolute', top: 44, left: 0, width: '100%', opacity }} />
);

// Vite's block page is too small to read on the phone, so its text is shown
// magnified from the same response captured at a readable size.
const Loupe: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: 90,
      top: 230,
      width: 660,
      padding: '18px 22px',
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 24px 60px rgba(0,0,0,.5)',
      opacity,
      transform: `translateY(${(1 - opacity) * 16}px)`,
    }}
  >
    <Img src={staticFile('devhop/blocked-text.png')} style={{ display: 'block', width: '100%' }} />
  </div>
);

const Caption: React.FC<{ text: string; opacity: number }> = ({ text, opacity }) => (
  <div style={{ position: 'absolute', left: 850, width: 400, top: 738, textAlign: 'center', fontFamily: sans, fontSize: 23, fontWeight: 500, color: '#e8eaee', opacity }}>
    {text}
  </div>
);

export const DevhopDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const metaRaw = useTextAsset('devhop/meta.json');
  const ansi = useTextAsset('devhop/terminal.ansi');
  if (!metaRaw || !ansi) return null;

  const meta: Meta = JSON.parse(metaRaw);
  const CMD_RAW = `cloudflared tunnel --url localhost:${meta.port}`;
  const CMD_DEVHOP = `npx devhop ${meta.port}`;
  const rawHost = /\("?([a-z0-9.-]+\.trycloudflare\.com)"?\)/.exec(meta.blockedText)?.[1] ?? '';
  const devhopHost = new URL(meta.devhopUrl).host;
  const dashboard = dashboardLines(ansi);
  // The phone changes after the measured hot-update latency, not an invented one.
  const hmrAt = T.save + Math.round((meta.hmrMs / 1000) * fps);

  let lines: Line[];
  if (frame < T.sceneB) {
    lines = [prompt(typed(CMD_RAW, frame, T.typeRaw, 1.25))];
  } else {
    const shown = Math.max(0, frame - T.dashboard + 1);
    lines = [
      prompt(CMD_RAW),
      [{ text: '^C', fg: '#5c6370' }],
      prompt(typed(CMD_DEVHOP, frame, T.typeDevhop, 1.7)),
      ...(frame >= T.dashboard ? dashboard.slice(0, shown) : []),
    ];
  }
  const typing = (frame >= T.typeRaw && frame < T.typeRaw + CMD_RAW.length * 1.25) ||
    (frame >= T.typeDevhop && frame < T.dashboard);

  let colorText = OLD_COLOR;
  if (frame >= T.retype) colorText = typed(NEW_COLOR, frame, T.retype, 2);
  else if (frame >= T.backspace) colorText = OLD_COLOR.slice(0, Math.max(0, OLD_COLOR.length - Math.floor((frame - T.backspace) / 2)));
  const editorLines = [`const accent = ${colorText};`, ...APP_LINES.slice(1)];
  const editorIn = fade(frame, T.sceneC, 14);

  const push = interpolate(frame, [T.sceneC, T.fadeOut], [1, 1.04], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  const captionA = fade(frame, T.captionA, 10) * (1 - fade(frame, T.sceneB - 10, 10));
  const loupe = fade(frame, T.blocked + 14, 12) * (1 - fade(frame, T.sceneB - 12, 10));
  const captionB = fade(frame, T.loaded + 4, 10) * (1 - fade(frame, T.sceneC - 10, 10));
  const captionC = fade(frame, hmrAt + 4, 10);

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(120% 90% at 30% 0%, #1b2130 0%, #0d1016 60%)', opacity: 1 - fade(frame, T.fadeOut, 15) }}>
      <Terminal title="zsh" lines={lines} cursor={typing || frame < T.typeRaw} style={{ position: 'absolute', left: 40, top: 40, width: 780, height: 720 }} />
      <Editor
        file="src/App.jsx"
        lines={editorLines}
        dirty={frame >= T.backspace && frame < T.save}
        activeLine={frame >= T.sceneC + 20 ? 0 : undefined}
        cursorCol={frame >= T.sceneC + 20 && frame < T.save + 20 ? 15 + colorText.length : undefined}
        style={{ position: 'absolute', left: 150, top: 516, width: 640, opacity: editorIn, transform: `translateY(${(1 - editorIn) * 24}px)` }}
      />
      <div style={{ position: 'absolute', left: 890, top: 34, transform: `scale(${push})`, transformOrigin: '50% 30%' }}>
        <Phone width={320}>
          <AddressBar host={frame < T.blocked ? '' : frame < T.loaded ? rawHost : devhopHost} />
          <Screen src="devhop/blocked.png" opacity={fade(frame, T.blocked, 6) * (1 - fade(frame, T.loaded, 8))} />
          <Screen src="devhop/loaded.png" opacity={fade(frame, T.loaded, 8)} />
          <Screen src="devhop/edited.png" opacity={fade(frame, hmrAt, 4)} />
        </Phone>
      </div>
      <Loupe opacity={loupe} />
      <Caption text="Plain tunnel: Vite blocks the phone." opacity={captionA} />
      <Caption text="npx devhop: the app loads." opacity={captionB} />
      <Caption text="Save. The phone hot-reloads." opacity={captionC} />
    </AbsoluteFill>
  );
};
