// devhop launch loop. Story, look and timing rules are in BRIEF.md; what each
// critique round changed is in ROUNDS.md.
import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { lineText, parseAnsi, isQrLine, type Line } from '../../lib/ansi';
import { display, mono } from '../../lib/fonts';
import { Kangaroo } from '../../lib/Kangaroo';
import { EASE, SpeedBlur, alpha, mix, ramp, rand } from '../../lib/motion';
import { Phone } from '../../lib/Phone';
import { TerminalLines, qrIndent } from '../../lib/Terminal';
import { useTextAsset } from '../../lib/useTextAsset';

export const DEVHOP_DEMO = { durationInFrames: 960, fps: 60, width: 1920, height: 1080 };

const C = { bg: '#07090C', ink: '#EDEFF3', ink2: '#8A93A3', accent: '#3FE0F0' };
const PERSP = 2000;
const TILT = -4;
const FLOOR_Y = 640;

type V3 = [number, number, number];
type Pose = { x: number; y: number; z: number; ry: number };

// World layout. Each object is placed once; the camera does all the moving.
const PHONE: Pose = { x: 760, y: 0, z: 0, ry: -14 };
const TERM: Pose = { x: -880, y: -40, z: -260, ry: 16 };
const EDIT: Pose = { x: -240, y: 250, z: 900, ry: 8 };

// Phone is laid out at twice its world size and scaled down, so the hook's
// close-up rasterizes the error text from the full-resolution screenshot.
const PW = 520;
const PHONE_LAYOUT = PW * 2;
const BEZEL_L = Math.round(PHONE_LAYOUT * 0.035);
const SCREEN_W_L = PHONE_LAYOUT - BEZEL_L * 2;
const SCREEN_H_L = Math.round((SCREEN_W_L * 844) / 390);
const PHONE_H_L = SCREEN_H_L + BEZEL_L * 2;
const BAR_L = 112;
const LAND: V3 = [0, -210, 0]; // where hops land on the phone, phone-local world px

const TERM_W = 1240;
const TERM_FONT = 24;
const TERM_ROW = 34;
const QR_MODULE = 10;
const TERM_TITLE = 64;
const TERM_PAD = 36;
const CMD_ROW = 80;

const EDIT_W = 1100;
const EDIT_FONT = 40;
const EDIT_ROW = 64;

// Beats, in frames at 60 fps.
const T = {
  slam: 96,
  type: 232,
  hop1: [368, 412],
  editIn: [500, 546],
  select: 578,
  retype: 594,
  save: 624,
  hop2: [630, 658],
  outro: [770, 822],
  hop3: [800, 838],
  word: 838,
  fadeOut: 930,
};

// ───────── camera ─────────
type Cam = { at: V3; yaw: number; pull: number };
type Key = Cam & { f: number; ease?: (t: number) => number; bump?: number };

const toWorld = (p: Pose, l: V3): V3 => {
  const r = (p.ry * Math.PI) / 180;
  return [p.x + l[0] * Math.cos(r) + l[2] * Math.sin(r), p.y + l[1], p.z - l[0] * Math.sin(r) + l[2] * Math.cos(r)];
};
const center = (p: Pose): V3 => [p.x, p.y, p.z];
const yawFor = (p: Pose, view: number) => view - p.ry;

const PHONE_YAW = yawFor(PHONE, -6);
const TERM_YAW = yawFor(TERM, 7);
const EDIT_YAW = yawFor(EDIT, 6);
const HOOK_AT = toWorld(PHONE, [0, -415, 0]);
const PHONE_SHOT = toWorld(PHONE, [-380, 0, 0]);
const TERM_CMD = toWorld(TERM, [-260, -330, 0]);
const WIDE_AT: V3 = [-80, -60, -120];

const KEYS: Key[] = [
  { f: 0, at: HOOK_AT, yaw: PHONE_YAW, pull: -1170 },
  { f: 70, at: HOOK_AT, yaw: PHONE_YAW, pull: -1110, ease: EASE.linear },
  { f: 112, at: PHONE_SHOT, yaw: PHONE_YAW, pull: 420, ease: EASE.swift },
  { f: 176, at: PHONE_SHOT, yaw: PHONE_YAW + 2, pull: 470, ease: EASE.linear },
  { f: 224, at: TERM_CMD, yaw: TERM_YAW, pull: -420, ease: EASE.swift, bump: 1100 },
  { f: 268, at: TERM_CMD, yaw: TERM_YAW - 1, pull: -470, ease: EASE.linear },
  { f: 316, at: center(TERM), yaw: TERM_YAW, pull: 170, ease: EASE.smooth },
  { f: 352, at: center(TERM), yaw: TERM_YAW - 1.5, pull: 130, ease: EASE.linear },
  { f: 398, at: WIDE_AT, yaw: 0, pull: 1750, ease: EASE.smooth },
  { f: 450, at: PHONE_SHOT, yaw: PHONE_YAW, pull: 420, ease: EASE.swift },
  { f: 520, at: PHONE_SHOT, yaw: PHONE_YAW + 1.5, pull: 380, ease: EASE.linear },
  { f: 562, at: center(EDIT), yaw: EDIT_YAW, pull: 230, ease: EASE.swift, bump: 700 },
  { f: 628, at: center(EDIT), yaw: EDIT_YAW - 1, pull: 190, ease: EASE.linear },
  { f: 664, at: PHONE_SHOT, yaw: PHONE_YAW, pull: 470, ease: EASE.swift, bump: 380 },
  { f: 770, at: PHONE_SHOT, yaw: PHONE_YAW + 1.5, pull: 420, ease: EASE.linear },
  { f: 822, at: [-60, -120, 0], yaw: 0, pull: 2900, ease: EASE.smooth },
  { f: 960, at: [-60, -120, 0], yaw: 0, pull: 3050, ease: EASE.linear },
];

// A hop landing pushes the camera in a little and lets it settle back.
const punch = (f: number) =>
  [T.hop1[1], T.hop2[1]].reduce((sum, at) => (f < at ? sum : sum + 90 * Math.exp(-(f - at) / 7) * (1 - Math.exp(-(f - at) / 1.5))), 0);

const camAt = (f: number): Cam => {
  let i = 0;
  while (i < KEYS.length - 2 && f >= KEYS[i + 1].f) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const raw = Math.min(1, Math.max(0, (f - a.f) / (b.f - a.f)));
  const u = (b.ease ?? EASE.smooth)(raw);
  const bump = b.bump ? Math.sin(Math.PI * Math.pow(raw, 0.85)) * b.bump : 0;
  return {
    at: [mix(a.at[0], b.at[0], u), mix(a.at[1], b.at[1], u), mix(a.at[2], b.at[2], u)],
    yaw: mix(a.yaw, b.yaw, u),
    pull: mix(a.pull, b.pull, u) + bump - punch(f),
  };
};

// Same chain as the world's CSS transform: translateZ(-pull) rotateX(TILT) rotateY(yaw) translate(-at).
const project = (cam: Cam, p: V3) => {
  const x0 = p[0] - cam.at[0];
  const y0 = p[1] - cam.at[1];
  const z0 = p[2] - cam.at[2];
  const ty = (cam.yaw * Math.PI) / 180;
  const tx = (TILT * Math.PI) / 180;
  const x1 = x0 * Math.cos(ty) + z0 * Math.sin(ty);
  const z1 = -x0 * Math.sin(ty) + z0 * Math.cos(ty);
  const y2 = y0 * Math.cos(tx) - z1 * Math.sin(tx);
  const z2 = y0 * Math.sin(tx) + z1 * Math.cos(tx) - cam.pull;
  const k = PERSP / (PERSP - z2);
  return { x: 960 + x1 * k, y: 540 + y2 * k, k, z: z2 };
};

const worldCss = (cam: Cam) =>
  `translateZ(${(-cam.pull).toFixed(2)}px) rotateX(${TILT}deg) rotateY(${cam.yaw.toFixed(3)}deg) translate3d(${(-cam.at[0]).toFixed(2)}px,${(-cam.at[1]).toFixed(2)}px,${(-cam.at[2]).toFixed(2)}px)`;
const placeCss = (p: Pose, l: V3 = [0, 0, 0]) => {
  const w = toWorld(p, l);
  return `translate3d(${w[0].toFixed(2)}px,${w[1].toFixed(2)}px,${w[2].toFixed(2)}px) rotateY(${p.ry}deg)`;
};

// ───────── stage ─────────
const Floor: React.FC<{ cam: Cam }> = ({ cam }) => {
  const segs: React.ReactNode[] = [];
  const CELL = 260;
  const line = (a: V3, b: V3, key: string) => {
    const N = 10;
    for (let j = 0; j < N; j++) {
      const pa = project(cam, [mix(a[0], b[0], j / N), a[1], mix(a[2], b[2], j / N)]);
      const pb = project(cam, [mix(a[0], b[0], (j + 1) / N), a[1], mix(a[2], b[2], (j + 1) / N)]);
      if (pa.z > PERSP - 140 || pb.z > PERSP - 140) continue;
      const depth = PERSP - (pa.z + pb.z) / 2;
      const op = Math.max(0, Math.min(1, 1.3 - depth / 5200));
      if (op < 0.02) continue;
      segs.push(<line key={`${key}${j}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} strokeOpacity={op * op} />);
    }
  };
  for (let i = -16; i <= 16; i++) line([i * CELL, FLOOR_Y, -4200], [i * CELL, FLOOR_Y, 2600], `c${i}`);
  for (let j = -16; j <= 10; j++) line([-4200, FLOOR_Y, j * CELL], [4200, FLOOR_Y, j * CELL], `r${j}`);
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <g stroke={alpha(C.accent, 0.2)} strokeWidth={1.3}>{segs}</g>
    </svg>
  );
};

const Glow: React.FC<{ cam: Cam; at: V3; w: number; h: number; color: string; a: number }> = ({ cam, at, w, h, color, a }) => {
  if (a < 0.01) return null;
  const q = project(cam, at);
  if (q.z > PERSP - 200) return null;
  const W = w * q.k;
  const H = h * q.k;
  return (
    <div
      style={{
        position: 'absolute', left: q.x - W / 2, top: q.y - H / 2, width: W, height: H, borderRadius: '50%',
        background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(color, 0.3 * a)} 0%, ${alpha(color, 0.09 * a)} 45%, ${alpha(color, 0)} 72%)`,
      }}
    />
  );
};

// ───────── hop: a glowing arc with the kangaroo at its head ─────────
type Pt = { x: number; y: number; k: number };
const bezier3 = (a: V3, c: V3, b: V3, t: number): V3 => {
  const u = 1 - t;
  return [0, 1, 2].map((i) => u * u * a[i] + 2 * u * t * c[i] + t * t * b[i]) as V3;
};

const Hop: React.FC<{ id: string; pts: (t: number) => Pt; frame: number; start: number; end: number; size: number; keep?: boolean }> = ({
  id,
  pts,
  frame,
  start,
  end,
  size,
  keep,
}) => {
  if (frame < start - 1 || (!keep && frame > end + 26)) return null;
  const head = ramp(frame, start, end - start, EASE.swift);
  const fade = 1 - ramp(frame, end, 22, EASE.out);
  const N = 72;
  const tail = 0.55;
  const segs: React.ReactNode[] = [];
  const P = Array.from({ length: N + 1 }, (_, i) => pts((i / N) * head));
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const o = Math.max(0, 1 - (1 - t) / tail) * fade;
    if (o < 0.02) continue;
    const a = P[i];
    const b = P[i + 1];
    const w = mix(a.k, b.k, 0.5);
    segs.push(
      <g key={i} strokeOpacity={o}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={alpha(C.accent, 0.35)} strokeWidth={22 * w} strokeLinecap="round" />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.accent} strokeWidth={7 * w} />
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#eaffff" strokeWidth={2.6 * w} />
      </g>,
    );
  }
  const h = pts(head);
  const h2 = pts(Math.max(0, head - 0.02));
  const angle = (Math.atan2(h.y - h2.y, h.x - h2.x) * 180) / Math.PI;
  const flying = frame < end;
  // Stretch along the path while fast, squash on landing.
  const land = ramp(frame, end, 10, EASE.out);
  const squash = flying ? 1 : 1 - 0.25 * Math.sin(Math.PI * land);
  const s = size * h.k;
  const showRoo = flying || keep || fade > 0.02;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <defs>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g filter={`url(#glow-${id})`} opacity={0.6 * fade}>{segs}</g>
      <g>{segs}</g>
      {showRoo ? (
        <g
          transform={`translate(${h.x.toFixed(2)},${h.y.toFixed(2)}) rotate(${flying ? Math.max(-40, Math.min(40, angle)).toFixed(2) : 0}) scale(${(1 / squash).toFixed(3)},${squash.toFixed(3)})`}
          opacity={flying || keep ? 1 : fade}
        >
                    <foreignObject x={-s / 2} y={-s * 0.62} width={s} height={s}>
            <Kangaroo size={s} color={keep && !flying ? C.accent : '#eaffff'} />
          </foreignObject>
        </g>
      ) : null}
    </svg>
  );
};

const Impact: React.FC<{ x: number; y: number; k: number; frame: number; at: number }> = ({ x, y, k, frame, at }) => {
  const t = frame - at;
  if (t < 0 || t > 30) return null;
  const r = mix(10, 260, ramp(frame, at, 26, EASE.out)) * k;
  const o = 1 - ramp(frame, at, 28, EASE.linear);
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={C.accent} strokeWidth={5 * k} opacity={o} />
      <circle cx={x} cy={y} r={r * 0.62} fill="none" stroke="#eaffff" strokeWidth={2 * k} opacity={o * 0.7} />
    </svg>
  );
};

// ───────── terminal ─────────
const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const charTimes = (cmd: string, seed: number) => {
  const out: number[] = [];
  let t = 0;
  for (let k = 0; k < cmd.length; k++) {
    out.push(t);
    t += (0.75 + rand(seed * 31 + k) * 0.9 + (cmd[k] === ' ' ? 0.6 : 0)) * 2;
  }
  return { out, end: t };
};

const dashboardLines = (raw: string): Line[] => {
  const lines = parseAnsi(raw);
  const start = lines.findLastIndex((l) => lineText(l).includes('DEVHOP'));
  const end = lines.findLastIndex((l) => lineText(l).includes('Press Ctrl+C'));
  if (start < 0 || end < 0) throw new Error('terminal.ansi does not contain the devhop dashboard');
  return lines.slice(start, end + 1);
};

const termGeometry = (dash: Line[]) => {
  const firstQr = dash.findIndex(isQrLine);
  const qrRows = dash.filter(isQrLine);
  const textRows = dash.length - qrRows.length;
  const qrW = Math.max(...qrRows.map((r) => lineText(r).length - qrIndent(qrRows))) * QR_MODULE;
  const qrH = qrRows.length * 2 * QR_MODULE;
  const bodyTop = TERM_TITLE + TERM_PAD + CMD_ROW;
  const h = bodyTop + textRows * TERM_ROW + qrH + TERM_ROW * 0.5 + TERM_PAD;
  const qrTop = bodyTop + firstQr * TERM_ROW + TERM_ROW * 0.25;
  const qrLeft = TERM_PAD + qrIndent(qrRows) * TERM_FONT * 0.6;
  return { h, firstQr, qrCenter: [qrLeft + qrW / 2 - TERM_W / 2, qrTop + qrH / 2 - h / 2, 0] as V3 };
};

const TerminalWindow: React.FC<{ frame: number; dash: Line[]; cmd: string; firstQr: number }> = ({ frame, dash, cmd, firstQr }) => {
  const typing = charTimes(cmd, 7);
  const n = typing.out.filter((x) => x <= frame - T.type).length;
  const enter = T.type + typing.end + 4;
  const dashAt = enter + 10;
  const caretOn = frame < T.type + typing.end || Math.floor(frame / 16) % 2 === 0;
  const rowAt = (i: number) => dashAt + (i < firstQr ? i : firstQr + 4) * 3;
  const qrReveal = ramp(frame, rowAt(firstQr) - 6, 26, EASE.out);
  const spinning = frame >= enter && frame < dashAt;
  return (
    <div
      style={{
        position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden',
        background: 'linear-gradient(180deg, #1a1e26 0%, #12151b 40%, #0d0f13 100%)',
        boxShadow: `inset 0 0 0 1.5px ${alpha('#cfe9ff', 0.1)}, inset 0 2px 0 ${alpha('#ffffff', 0.08)}`,
      }}
    >
      <div style={{ height: TERM_TITLE, display: 'flex', alignItems: 'center', gap: 12, padding: '0 26px', boxSizing: 'border-box', borderBottom: `1.5px solid ${alpha('#cfe9ff', 0.07)}` }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.85 }} />
        ))}
        <div style={{ marginLeft: 'auto', marginRight: 'auto', fontFamily: mono, fontSize: 22, color: C.ink2 }}>~/trailhead — zsh</div>
      </div>
      <div style={{ padding: `${TERM_PAD}px ${TERM_PAD}px 0` }}>
        <div style={{ height: CMD_ROW, fontFamily: mono, fontSize: 46, fontWeight: 700, color: C.ink, whiteSpace: 'pre', lineHeight: '56px' }}>
          <span style={{ color: C.accent }}>❯ </span>
          {cmd.slice(0, n)}
          {frame < dashAt ? (
            <span style={{ display: 'inline-block', width: '0.58em', height: '1.05em', marginLeft: 4, verticalAlign: '-0.16em', borderRadius: 4, background: C.accent, opacity: caretOn ? 0.95 : 0 }} />
          ) : null}
          {spinning ? <span style={{ color: C.accent, marginLeft: 18 }}>{SPIN[Math.floor(frame / 3) % SPIN.length]}</span> : null}
        </div>
        <TerminalLines
          lines={dash}
          font={TERM_FONT}
          row={TERM_ROW}
          qrModule={QR_MODULE}
          qrReveal={qrReveal}
          rowOpacity={(i) => ramp(frame, rowAt(i), 8, EASE.out)}
        />
      </div>
    </div>
  );
};

// ───────── editor ─────────
const KEYWORDS = /^(const|let|export|default|function|return|import|from)$/;
const TOKEN = /('[^']*'?|\b[A-Za-z_]+\b)/g;
const Code: React.FC<{ code: string }> = ({ code }) => (
  <>
    {code.split(TOKEN).map((part, i) => {
      let color = '#c9ced8';
      if (/^'/.test(part)) color = '#98c379';
      else if (KEYWORDS.test(part)) color = '#c678dd';
      else if (part === 'themes' || part === 'theme') color = '#e5c07b';
      return (
        <span key={i} style={{ color }}>
          {part}
        </span>
      );
    })}
  </>
);

const EDIT_PREFIX = 'const theme = themes.';
const EDIT_LINES = ["import { themes } from './themes.js';", '', `${EDIT_PREFIX}day;`, '', 'const trails = ['];
const EDIT_H = 64 + 40 + EDIT_LINES.length * EDIT_ROW + 40;
const EDIT_LINE_END: V3 = [-EDIT_W / 2 + 40 + 70 + (EDIT_PREFIX.length + 6) * EDIT_FONT * 0.6, -EDIT_H / 2 + 64 + 40 + EDIT_ROW * 2.5, 0];

const EditorWindow: React.FC<{ frame: number }> = ({ frame }) => {
  const word = frame < T.retype ? 'day' : 'night'.slice(0, Math.floor((frame - T.retype) / 4) + 1);
  const selected = frame >= T.select && frame < T.retype;
  const dirty = frame >= T.retype && frame < T.save;
  const key = ramp(frame, T.save - 2, 12, EASE.overshoot) * (1 - ramp(frame, T.save + 34, 10, EASE.out));
  return (
    <div
      style={{
        position: 'absolute', inset: 0, borderRadius: 24,
        background: 'linear-gradient(180deg, #181b22 0%, #111318 100%)',
        boxShadow: `inset 0 0 0 1.5px ${alpha('#cfe9ff', 0.1)}`,
      }}
    >
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 28px', boxSizing: 'border-box', fontFamily: mono, fontSize: 24, color: C.ink2, borderBottom: `1.5px solid ${alpha('#cfe9ff', 0.07)}` }}>
        src/App.jsx
        <span style={{ marginLeft: 12, color: C.ink, opacity: dirty ? 1 : 0 }}>●</span>
      </div>
      <div style={{ padding: '40px 40px', fontFamily: mono, fontSize: EDIT_FONT, lineHeight: `${EDIT_ROW}px` }}>
        {EDIT_LINES.map((code, i) => (
          <div key={i} style={{ display: 'flex', height: EDIT_ROW, whiteSpace: 'pre', background: i === 2 && frame >= T.select - 10 ? alpha('#ffffff', 0.04) : undefined }}>
            <span style={{ width: 70, color: '#4b5263', flexShrink: 0 }}>{i + 1}</span>
            {i === 2 ? (
              <span>
                <Code code={EDIT_PREFIX} />
                <span style={{ color: '#e06c75', background: selected ? alpha(C.accent, 0.32) : undefined, borderRadius: 6 }}>{word}</span>
                <span style={{ display: 'inline-block', width: 3, height: 44, verticalAlign: -8, background: C.accent, opacity: frame >= T.select - 10 && Math.floor(frame / 16) % 2 === 0 ? 1 : 0 }} />
                <Code code=";" />
              </span>
            ) : (
              <Code code={code} />
            )}
          </div>
        ))}
      </div>
      {key > 0.01 ? (
        <div
          style={{
            position: 'absolute', right: 34, top: -60, display: 'flex', gap: 14, transform: `scale(${key.toFixed(3)})`, transformOrigin: 'right bottom',
            fontFamily: display, fontWeight: 800, fontSize: 50, color: '#07090C',
          }}
        >
          {['⌘', 'S'].map((k) => (
            <div key={k} style={{ width: 100, height: 100, borderRadius: 22, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 30px ${alpha(C.accent, 0.4)}` }}>
              {k}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// ───────── phone ─────────
const Lock: React.FC = () => (
  <svg width={26} height={30} viewBox="0 0 26 30" style={{ marginRight: 12, flexShrink: 0 }}>
    <rect x="3" y="13" width="20" height="15" rx="3" fill="#3a3a3c" />
    <path d="M7 13V9a6 6 0 0 1 12 0v4" stroke="#3a3a3c" strokeWidth="3" fill="none" />
  </svg>
);

const Ripple: React.FC<{ src: string; frame: number; at: number; cx: number; cy: number }> = ({ src, frame, at, cx, cy }) => {
  if (frame < at) return null;
  const r = mix(0, 2500, ramp(frame, at, 40, EASE.out));
  const ring = 1 - ramp(frame, at + 18, 22, EASE.out);
  return (
    <>
      <Img src={staticFile(src)} style={{ position: 'absolute', top: BAR_L, left: 0, width: '100%', clipPath: `circle(${r.toFixed(1)}px at ${cx}px ${cy - BAR_L}px)` }} />
      {ring > 0.01 ? (
        <div
          style={{
            position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%',
            border: `10px solid ${alpha(C.accent, ring)}`, boxShadow: `0 0 50px ${alpha(C.accent, 0.8 * ring)}, inset 0 0 40px ${alpha('#ffffff', 0.5 * ring)}`,
          }}
        />
      ) : null}
    </>
  );
};

const PhoneScreen: React.FC<{ frame: number; rawHost: string; devhopHost: string; land1: number; land2: number }> = ({ frame, rawHost, devhopHost, land1, land2 }) => {
  const cx = SCREEN_W_L / 2;
  const cy = SCREEN_H_L / 2 + LAND[1] * 2;
  const host = frame < land1 + 6 ? rawHost : devhopHost;
  return (
    <>
      <Img src={staticFile('devhop/blocked.png')} style={{ position: 'absolute', top: BAR_L, left: 0, width: '100%' }} />
      <Ripple src="devhop/loaded.png" frame={frame} at={land1} cx={cx} cy={cy} />
      <Ripple src="devhop/edited.png" frame={frame} at={land2} cx={cx} cy={cy} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: BAR_L, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16, boxSizing: 'border-box', background: '#f2f2f7', borderBottom: '2px solid #d8d8de' }}>
        <div style={{ display: 'flex', alignItems: 'center', maxWidth: '86%', fontFamily: 'Inter, system-ui', fontSize: 28, color: '#1c1c1e', background: '#e3e3e8', borderRadius: 18, padding: '10px 24px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <Lock />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{host}</span>
        </div>
      </div>
    </>
  );
};

// BLOCKED → LIVE → the measured hot-reload time, rolling behind the phone.
const BigWord: React.FC<{ frame: number; hmrMs: number; land1: number; land2: number; presence: number }> = ({ frame, hmrMs, land1, land2, presence }) => {
  const slam = ramp(frame, T.slam, 14, EASE.snappy);
  if (slam <= 0) return null;
  const roll1 = ramp(frame, land1 + 2, 20, EASE.snappy);
  const roll2 = ramp(frame, land2 + 14, 20, EASE.snappy);
  const count = Math.round(hmrMs * ramp(frame, land2 + 14, 30, EASE.out));
  const words = [
    { key: 'blocked', text: 'BLOCKED', fill: 'transparent', stroke: alpha('#ffffff', 0.5) },
    { key: 'live', text: 'LIVE', fill: alpha(C.accent, 0.12), stroke: C.accent },
    { key: 'ms', text: `${count} ms`, fill: C.accent, stroke: C.accent },
  ];
  const label = ramp(frame, land2 + 34, 16, EASE.out);
  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, transform: `${placeCss(PHONE, [-PW / 2 - 70, -120, -300])} translate(-100%, -50%) scale(${mix(1.3, 1, slam).toFixed(4)})`,
        transformOrigin: 'right center', opacity: slam * presence,
      }}
    >
      <div style={{ height: 240, overflow: 'hidden', textAlign: 'right' }}>
        <div style={{ transform: `translateY(${(-(roll1 + roll2) * 240).toFixed(2)}px)` }}>
          {words.map((w) => (
            <div key={w.key} style={{ height: 240, lineHeight: '240px', fontFamily: display, fontWeight: 800, fontSize: 205, letterSpacing: '-0.04em', whiteSpace: 'nowrap', color: w.fill, WebkitTextStroke: `4px ${w.stroke}`, fontVariantNumeric: 'tabular-nums' }}>
              {w.text}
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'right', marginTop: 10, fontFamily: display, fontWeight: 600, fontSize: 58, color: C.ink, opacity: label, transform: `translateY(${((1 - label) * 20).toFixed(1)}px)` }}>
        hot reload, no refresh
      </div>
    </div>
  );
};

// ───────── outro ─────────
const LOGO_ROO = { x: 620, y: 465 };

const Lockup: React.FC<{ frame: number }> = ({ frame }) => {
  const letters = 'devhop'.split('');
  const pill = ramp(frame, T.word + 22, 18, EASE.snappy);
  const tag = ramp(frame, T.word + 34, 18, EASE.out);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 210 }}>
        <div style={{ width: 230 }} />
        {letters.map((l, i) => {
          const p = ramp(frame, T.word + i * 3, 16, EASE.snappy);
          return (
            <span key={i} style={{ display: 'inline-block', fontFamily: display, fontWeight: 800, fontSize: 200, letterSpacing: '-0.045em', color: C.ink, opacity: p, transform: `translateY(${((1 - p) * 60).toFixed(1)}px)` }}>
              {l}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 40, fontFamily: mono, fontWeight: 700, fontSize: 52, color: C.accent, padding: '16px 40px', borderRadius: 999, border: `2.5px solid ${alpha(C.accent, 0.7)}`, background: alpha(C.accent, 0.08), opacity: pill, transform: `scale(${mix(0.85, 1, pill).toFixed(3)})` }}>
        npx devhop
      </div>
      <div style={{ marginTop: 34, fontFamily: display, fontWeight: 600, fontSize: 46, color: C.ink2, opacity: tag }}>Your dev server, on your phone.</div>
    </div>
  );
};

// ───────── sound ─────────
// Each effect sits on the frame of the action it belongs to (scripts/sfx.mjs makes them).
const Sfx: React.FC<{ cmd: string }> = ({ cmd }) => {
  const typing = charTimes(cmd, 7);
  const cues: [number, string, number][] = [
    [T.slam - 2, 'impact', 0.55],
    ...[64, 172, 350, 396, 516, 624, 766].map((f): [number, string, number] => [f, 'whoosh', 0.45]),
    ...typing.out.map((t): [number, string, number] => [Math.round(T.type + t), 'key', 0.5]),
    [T.select, 'key', 0.4],
    ...[0, 1, 2, 3, 4].map((i): [number, string, number] => [T.retype + i * 4, 'key', 0.5]),
    [T.save - 2, 'key', 0.6],
    [T.save, 'key', 0.6],
    [T.hop1[0], 'rise', 0.5],
    [T.hop2[0], 'rise', 0.5],
    [T.hop3[0], 'rise', 0.45],
    [T.hop1[1], 'impact', 0.8],
    [T.hop2[1], 'impact', 0.8],
    [T.hop1[1] + 2, 'shimmer', 0.5],
    [T.hop2[1] + 2, 'shimmer', 0.5],
    [T.word - 2, 'logo', 0.8],
  ];
  return (
    <>
      {cues.map(([at, name, volume], i) => (
        <Sequence key={i} from={at} layout="none">
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
        </Sequence>
      ))}
    </>
  );
};

// ───────── composition ─────────
type Meta = { port: number; devhopUrl: string; blockedText: string; hmrMs: number };

export const DevhopDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const metaRaw = useTextAsset('devhop/meta.json');
  const ansi = useTextAsset('devhop/terminal.ansi');
  if (!metaRaw || !ansi) return null;

  const meta: Meta = JSON.parse(metaRaw);
  const rawHost = /\("?([a-z0-9.-]+\.trycloudflare\.com)"?\)/.exec(meta.blockedText)?.[1] ?? '';
  const devhopHost = new URL(meta.devhopUrl).host;
  const dash = dashboardLines(ansi);
  const geo = termGeometry(dash);

  const cam = camAt(frame);
  const ca = camAt(frame - 0.5);
  const cb = camAt(frame + 0.5);
  const kS = PERSP / (PERSP + Math.max(-1500, cam.pull));
  const vx = -(cb.at[0] - ca.at[0]) * kS - (cb.yaw - ca.yaw) * 22;
  const vy = -(cb.at[1] - ca.at[1]) * kS;

  const land1 = T.hop1[1];
  const land2 = T.hop2[1];
  const qrWorld = toWorld(TERM, geo.qrCenter);
  const landWorld = toWorld(PHONE, LAND);
  const editWorld = toWorld(EDIT, EDIT_LINE_END);
  const arc = (from: V3, to: V3, lift: number) => {
    const mid: V3 = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - lift, (from[2] + to[2]) / 2];
    return (t: number) => project(cam, bezier3(from, mid, to, t));
  };
  const hop3 = (t: number): Pt => {
    const s = project(cam, qrWorld);
    const c = { x: (s.x + LOGO_ROO.x) / 2, y: Math.min(s.y, LOGO_ROO.y) - 420 };
    const u = 1 - t;
    return { x: u * u * s.x + 2 * u * t * c.x + t * t * LOGO_ROO.x, y: u * u * s.y + 2 * u * t * c.y + t * t * LOGO_ROO.y, k: mix(Math.max(0.5, s.k * 1.4), 1.6, t) };
  };

  const focus = (p: Pose) => {
    const d = Math.hypot(cam.at[0] - p.x, cam.at[2] - p.z);
    const wide = Math.min(1, Math.max(0, cam.pull / 1500));
    return Math.min(1, Math.max(0, 1 - (d - 300) / 900) + wide * 0.55);
  };
  const objFilter = (p: Pose): React.CSSProperties => {
    const f = focus(p);
    const blur = (1 - f) * 5;
    return { filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px) brightness(${(0.55 + 0.45 * f).toFixed(3)})` : undefined };
  };
  const outro = ramp(frame, T.outro[0] + 20, 40, EASE.smooth);
  const editIn = ramp(frame, T.editIn[0], T.editIn[1] - T.editIn[0], EASE.out) * (1 - ramp(frame, T.hop2[0] + 8, 30, EASE.swift));
  const landPt = project(cam, landWorld);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - outro * 0.9, filter: outro > 0.02 ? `blur(${(outro * 10).toFixed(2)}px)` : undefined }}>
        <Floor cam={cam} />
        <Glow cam={cam} at={[PHONE.x, PHONE.y - 80, PHONE.z - 380]} w={2000} h={1300} color="#9fdcff" a={focus(PHONE)} />
        <Glow cam={cam} at={[TERM.x, TERM.y, TERM.z - 380]} w={2600} h={1400} color="#9fdcff" a={focus(TERM) * 0.8} />
        <Glow cam={cam} at={[PHONE.x, FLOOR_Y, PHONE.z]} w={1300} h={300} color={C.accent} a={focus(PHONE)} />
        <Glow cam={cam} at={[TERM.x, FLOOR_Y, TERM.z]} w={1700} h={320} color={C.accent} a={focus(TERM)} />
        <SpeedBlur vx={vx} vy={vy} amount={0.16} max={14}>
          <div style={{ position: 'absolute', inset: 0, perspective: PERSP, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 960, top: 540, width: 0, height: 0, transformStyle: 'preserve-3d', transform: worldCss(cam) }}>
              <BigWord frame={frame} hmrMs={meta.hmrMs} land1={land1} land2={land2} presence={EASE.smooth(Math.min(1, Math.max(0, (focus(PHONE) - 0.35) / 0.5)))} />
              <div style={{ position: 'absolute', left: -TERM_W / 2, top: -geo.h / 2, width: TERM_W, height: geo.h, transform: placeCss(TERM), boxShadow: '0 60px 140px rgba(0,0,0,.7)', borderRadius: 26, ...objFilter(TERM) }}>
                <TerminalWindow frame={frame} dash={dash} cmd={`npx devhop ${meta.port}`} firstQr={geo.firstQr} />
              </div>
              <div
                style={{
                  position: 'absolute', left: -EDIT_W / 2, top: -EDIT_H / 2, width: EDIT_W, height: EDIT_H, borderRadius: 24,
                  transform: `${placeCss(EDIT)} translateY(${((1 - editIn) * 520).toFixed(1)}px) rotateX(${((1 - editIn) * 40).toFixed(2)}deg)`,
                  opacity: editIn, boxShadow: '0 60px 140px rgba(0,0,0,.7)', ...objFilter(EDIT),
                }}
              >
                <EditorWindow frame={frame} />
              </div>
              <div style={{ position: 'absolute', left: -PHONE_LAYOUT / 2, top: -PHONE_H_L / 2, transform: `${placeCss(PHONE)} scale(0.5)`, ...objFilter(PHONE) }}>
                <Phone width={PHONE_LAYOUT}>
                  <PhoneScreen frame={frame} rawHost={rawHost} devhopHost={devhopHost} land1={land1} land2={land2} />
                </Phone>
              </div>
            </div>
          </div>
        </SpeedBlur>
      </div>
      <Hop id="h1" pts={arc(qrWorld, landWorld, 620)} frame={frame} start={T.hop1[0]} end={land1} size={190} />
      <Impact x={landPt.x} y={landPt.y} k={landPt.k} frame={frame} at={land1} />
      <Hop id="h2" pts={arc(editWorld, landWorld, 420)} frame={frame} start={T.hop2[0]} end={land2} size={170} />
      <Impact x={landPt.x} y={landPt.y} k={landPt.k} frame={frame} at={land2} />
      {frame >= T.outro[0] ? (
        <>
          <Hop id="h3" pts={hop3} frame={frame} start={T.hop3[0]} end={T.hop3[1]} size={130} keep />
          <Lockup frame={frame} />
        </>
      ) : null}
      <Sfx cmd={`npx devhop ${meta.port}`} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)' }} />
      <AbsoluteFill style={{ background: '#000', opacity: Math.max(1 - ramp(frame, 0, 14, EASE.out), ramp(frame, T.fadeOut, 30, EASE.smooth)) }} />
    </AbsoluteFill>
  );
};
