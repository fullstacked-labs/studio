// devhop launch film. Story, look and rules are in BRIEF.md, timing in
// timeline.ts (beats of the music), what each critique round changed in ROUNDS.md.
// Shot recipes from video-shotcraft: terminal-3d (camera as the inverse of a pose
// table), glow-flyline (the hop), palette-theme-ripple (the reload),
// vertical-word-roll-blur-cycle (BLOCKED → LIVE → ms), blur-slide (captions),
// typewriter error-retype (the edit), logo-shrink-wordmark-lockup (the outro).
import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { lineText, parseAnsi, isQrLine, type Line } from '../../lib/ansi';
import { BUNNY_ASPECT, Bunny } from '../../lib/Bunny';
import { display, mono } from '../../lib/fonts';
import { EASE, Grain, Vignette, alpha, bezier, mix, ramp, rand } from '../../lib/motion';
import { Phone } from '../../lib/Phone';
import { TerminalLines, qrIndent } from '../../lib/Terminal';
import { useTextAsset } from '../../lib/useTextAsset';
import { MicPrompt, PAGE, SAFARI_TOP, Safari, TYPE_ERROR, TrailPage, VIEW_H, VIEW_W } from './TrailApp';
import {
  AUDIO_START_SEC, B, CAPTIONS, OUTPUT_AUDIO_OFFSET_SEC, CUES, DELETED, END_BEAT, FPS, RETYPED, TYPED, cueFrom, delBeat, fb, retypeBeat, typeBeat,
  type Caption, type Cue,
} from './timeline';

export { DEVHOP_DEMO } from './timeline';

export const C = { bg: '#07090C', ink: '#EDEFF3', ink2: '#8A93A3', accent: '#3FE0F0' };
const PERSP = 2000;
const TILT = -4;
const FLOOR_Y = 640;
export const PER_FRAME = 1 / fb(1); // beats per frame

type V3 = [number, number, number];
type Pose = { x: number; y: number; z: number; ry: number };
type Ease = (t: number) => number;

// World layout: the laptop's windows stage left, the phone stage right. The
// camera only travels left to right, riding a hop; going back to the laptop
// is a cut on a bar line.
const PHONE: Pose = { x: 760, y: 0, z: 0, ry: -14 };
const TERM: Pose = { x: -1150, y: -60, z: -240, ry: 14 };
const EDIT: Pose = { x: -860, y: 230, z: 380, ry: 10 };

// The phone is laid out at twice its world size and scaled down, so close-ups
// rasterize from the full-resolution screenshots.
const PW = 520;
const PHONE_LAYOUT = PW * 2;
const BEZEL_L = Math.round(PHONE_LAYOUT * 0.035);
const SCREEN_W_L = PHONE_LAYOUT - BEZEL_L * 2;
const SCREEN_H_L = Math.round((SCREEN_W_L * 844) / 390);
const PHONE_H_L = SCREEN_H_L + BEZEL_L * 2;
const LAND: V3 = [0, -210, 0]; // where hops land on the phone, phone-local world px

const TERM_W = 1560;
const TERM_FONT = 32;
const TERM_ROW = 44;
const TERM_BLANK = 22;
const QR_MODULE = 11;
const TERM_TITLE = 64;
const TERM_PAD = 40;
const CMD_ROW = 92;

const EDIT_W = 1100;
const EDIT_FONT = 40;
const EDIT_ROW = 64;

// ───────── camera ─────────
type Cam = { at: V3; yaw: number; pull: number };
type Key = Cam & { b: number; ease?: Ease; bump?: number };

const toWorld = (p: Pose, l: V3): V3 => {
  const r = (p.ry * Math.PI) / 180;
  return [p.x + l[0] * Math.cos(r) + l[2] * Math.sin(r), p.y + l[1], p.z - l[0] * Math.sin(r) + l[2] * Math.cos(r)];
};
const yawFor = (p: Pose, view: number) => view - p.ry;

const PHONE_YAW = yawFor(PHONE, -6);
const TERM_YAW = yawFor(TERM, 7);
const EDIT_YAW = yawFor(EDIT, 6);

// Each shot is its own list of keys; a new shot starts with a cut.
const shots = (g: Geometry): { from: number; keys: Key[] }[] => {
  const hook = toWorld(PHONE, [0, -415, 0]);
  const phoneShot = toWorld(PHONE, [-420, 20, 0]);
  const problemShot = toWorld(PHONE, [-430, -250, 0]);
  const cmd = toWorld(TERM, [g.cmdCenter[0], g.cmdCenter[1] + 110, 0]);
  // Close enough on the dashboard's text rows for 32 px type to read ≥ 32 px,
  // then down to the QR, which sits center right, clear of the captions.
  const rows = toWorld(TERM, [-10, g.rowsCenterY, 0]);
  const qr = toWorld(TERM, [g.qrCenter[0] - 200, g.qrCenter[1] + 120, 0]);
  const line = toWorld(EDIT, [EDIT_LINE_END[0] - 240, EDIT_LINE_END[1] + 120, 0]);
  const wide: V3 = [-200, -40, -40];
  return [
    {
      from: 0,
      keys: [
        { b: 0, at: hook, yaw: PHONE_YAW - 3, pull: -1170 },
        { b: B.pullBack[0], at: hook, yaw: PHONE_YAW + 1, pull: -1000, ease: EASE.linear },
        { b: B.pullBack[1], at: problemShot, yaw: PHONE_YAW, pull: -200, ease: EASE.swift },
        { b: B.cutTerm, at: problemShot, yaw: PHONE_YAW + 4, pull: 80, ease: EASE.linear },
      ],
    },
    {
      from: B.cutTerm,
      keys: [
        { b: B.cutTerm, at: cmd, yaw: TERM_YAW, pull: -380 },
        { b: B.enter, at: cmd, yaw: TERM_YAW - 2, pull: -640, ease: EASE.linear },
        { b: B.dashOut[1], at: rows, yaw: TERM_YAW, pull: -120, ease: EASE.smooth },
        { b: B.qrPush[0], at: rows, yaw: TERM_YAW - 2, pull: -260, ease: EASE.linear },
        { b: B.qrPush[1], at: qr, yaw: TERM_YAW, pull: -250, ease: EASE.smooth },
        { b: B.hop1[0], at: qr, yaw: TERM_YAW + 6, pull: -420, ease: EASE.linear },
        { b: B.hop1[1], at: phoneShot, yaw: PHONE_YAW, pull: 470, ease: EASE.smooth, bump: 850 },
        { b: B.cutEdit, at: phoneShot, yaw: PHONE_YAW + 5, pull: 250, ease: EASE.linear },
      ],
    },
    {
      from: B.cutEdit,
      keys: [
        { b: B.cutEdit, at: line, yaw: EDIT_YAW, pull: -250 },
        { b: B.hop2[0], at: line, yaw: EDIT_YAW - 3, pull: -560, ease: EASE.linear },
        { b: B.hop2[1], at: phoneShot, yaw: PHONE_YAW, pull: 470, ease: EASE.smooth, bump: 750 },
        { b: B.wide[0], at: phoneShot, yaw: PHONE_YAW + 5, pull: 280, ease: EASE.linear },
        { b: B.wide[1], at: wide, yaw: 0, pull: 2300, ease: EASE.smooth },
        { b: END_BEAT, at: wide, yaw: 0, pull: 2500, ease: EASE.linear },
      ],
    },
  ];
};

// The first landing pushes the camera in and lets it settle: one of the film's
// two whole-frame hits (the other is the logo).
const punch = (b: number) => {
  const t = (b - B.hop1[1]) * fb(1);
  return t < 0 ? 0 : 90 * Math.exp(-t / 7) * (1 - Math.exp(-t / 1.5));
};

const camAt = (plan: ReturnType<typeof shots>, b: number): Cam => {
  const shot = [...plan].reverse().find((s) => b >= s.from) ?? plan[0];
  const k = shot.keys;
  let i = 0;
  while (i < k.length - 2 && b >= k[i + 1].b) i++;
  const a = k[i];
  const c = k[i + 1];
  const raw = Math.min(1, Math.max(0, (b - a.b) / (c.b - a.b)));
  const u = (c.ease ?? EASE.smooth)(raw);
  const bump = c.bump ? Math.sin(Math.PI * Math.pow(raw, 0.85)) * c.bump : 0;
  return {
    at: [mix(a.at[0], c.at[0], u), mix(a.at[1], c.at[1], u), mix(a.at[2], c.at[2], u)],
    yaw: mix(a.yaw, c.yaw, u),
    pull: mix(a.pull, c.pull, u) + bump - punch(b),
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

// Basic-3d-scene's dust: specks fixed in world space, so every bit of parallax
// comes from the camera.
const DUST = Array.from({ length: 70 }, (_, i): V3 => [mix(-2800, 2800, rand(i * 3 + 1)), mix(-760, 560, rand(i * 3 + 2)), mix(-1900, 1300, rand(i * 3 + 3))]);
const Dust: React.FC<{ cam: Cam }> = ({ cam }) => (
  <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
    {DUST.map((p, i) => {
      const q = project(cam, p);
      if (q.z > PERSP - 260 || q.x < -20 || q.x > 1940 || q.y < -20 || q.y > 1100) return null;
      const near = Math.min(1, Math.max(0, 1.25 - (PERSP - q.z) / 5000));
      return <circle key={i} cx={q.x} cy={q.y} r={Math.min(7, 2.4 * q.k)} fill="#cfe9ff" opacity={(0.18 + 0.32 * rand(i * 7)) * near} />;
    })}
  </svg>
);

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

// ───────── hop: a glowing arc with the bunny at its head ─────────
export type Pt = { x: number; y: number; k: number };
const bezier3 = (a: V3, c: V3, b: V3, t: number): V3 => {
  const u = 1 - t;
  return [0, 1, 2].map((i) => u * u * a[i] + 2 * u * t * c[i] + t * t * b[i]) as V3;
};
// Leaves fast, lands soft.
export const LEAP: Ease = bezier(0.3, 0.55, 0.35, 1);
// The bunny's paws sit this far down its box; hops anchor on them.
const FEET = 0.92;

// `out` is when the bunny appears on the launch point; it crouches for the
// last half beat before `start`.
// `handoff`: the sprite goes at the landing (another hop takes over); the trail
// still fades as usual.
// `carry`: a glowing dot in the bunny's paws until it lands (the saved edit, on
// its way to the phone).
export const Hop: React.FC<{ id: string; pts: (t: number) => Pt; b: number; out: number; start: number; end: number; size: number; keep?: boolean; handoff?: boolean; carry?: boolean }> = ({
  id, pts, b, out, start, end, size, keep, handoff, carry,
}) => {
  if (b < out || (!keep && b > end + 1)) return null;
  const head = ramp(b, start, end - start, LEAP);
  const fade = 1 - ramp(b, end, 0.8, EASE.out);
  const N = 72;
  const tail = 0.55;
  const segs: React.ReactNode[] = [];
  const P = Array.from({ length: N + 1 }, (_, i) => pts((i / N) * head));
  for (let i = 0; i < N && head > 0; i++) {
    const t = i / N;
    const o = Math.max(0, 1 - (1 - t) / tail) * fade;
    if (o < 0.02) continue;
    const a = P[i];
    const c = P[i + 1];
    if (Math.hypot(c.x - a.x, c.y - a.y) > 400) continue; // the jump across a wrap
    const w = mix(a.k, c.k, 0.5);
    segs.push(
      <g key={i} strokeOpacity={o}>
        <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={alpha(C.accent, 0.35)} strokeWidth={22 * w} strokeLinecap="round" />
        <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={C.accent} strokeWidth={7 * w} />
        <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="#eaffff" strokeWidth={2.6 * w} />
      </g>,
    );
  }
  const h = pts(head);
  const h2 = pts(Math.max(0, head - 0.02));
  const angle = (Math.atan2(h.y - h2.y, h.x - h2.x) * 180) / Math.PI;
  const flying = b >= start && b < end;
  const pop = ramp(b, out, 0.5, EASE.overshoot);
  const crouch = ramp(b, start - 0.5, 0.5, EASE.smooth) * (1 - ramp(b, start, 0.12, EASE.out));
  const land = ramp(b, end, 0.36, EASE.out);
  const stretch = 0.18 * (1 - ramp(b, start, 0.15, EASE.out)); // take-off, about four frames
  const squash = flying ? 1 + stretch : b >= end ? 1 - 0.25 * Math.sin(Math.PI * land) : 1 - 0.22 * crouch;
  // The sprite faces right and mirrors if it ever travels left.
  const dir = flying ? Math.sign(h.x - h2.x) || 1 : 1;
  const tilt = dir < 0 ? angle - 180 * Math.sign(angle) : angle;
  const rise = b < start ? ramp(b, out, 0.75, EASE.out) : 1;
  const s = size * h.k;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <defs>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id={`perch-${id}`}>
          <rect x={-5000} y={-5000} width={12000} height={5000 + h.y + 2} />
        </clipPath>
      </defs>
      <g filter={`url(#glow-${id})`} opacity={0.6 * fade}>{segs}</g>
      <g>{segs}</g>
      {(flying || keep || fade > 0.02) && !(handoff && b >= end) ? (
        <g clipPath={b < start ? `url(#perch-${id})` : undefined}>
        <g
          transform={`translate(${h.x.toFixed(2)},${h.y.toFixed(2)}) rotate(${flying ? Math.max(-30, Math.min(30, tilt)).toFixed(2) : 0}) scale(${((1 / squash) * dir).toFixed(3)},${squash.toFixed(3)})`}
          opacity={(flying || keep || b < end ? 1 : fade) * Math.min(1, pop * 3)}
        >
          <foreignObject x={-s / 2} y={-s * BUNNY_ASPECT * FEET + (1 - rise) * s * BUNNY_ASPECT} width={s} height={s * BUNNY_ASPECT}>
            <Bunny size={s} style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))' }} />
          </foreignObject>
          {carry && b < end ? <CarriedDot x={s * CHEST[0]} y={-s * BUNNY_ASPECT * CHEST[1]} k={s / 130} /> : null}
        </g>
        </g>
      ) : null}
    </svg>
  );
};

// Where the bunny holds what it carries, as fractions of its width and height
// from the feet anchor.
const CHEST = [0.24, 0.5] as const;
const CarriedDot: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => (
  <g>
    <circle cx={x} cy={y} r={22 * k} fill={alpha(C.accent, 0.35)} style={{ filter: 'blur(8px)' }} />
    <circle cx={x} cy={y} r={8 * k} fill="#f0ffff" />
  </g>
);

export const Impact: React.FC<{ x: number; y: number; k: number; b: number; at: number }> = ({ x, y, k, b, at }) => {
  const t = b - at;
  if (t < 0 || t > 1.1) return null;
  const r = mix(10, 260, ramp(b, at, 0.95, EASE.out)) * k;
  const o = 1 - ramp(b, at, 1, EASE.linear);
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={C.accent} strokeWidth={5 * k} opacity={o} />
      <circle cx={x} cy={y} r={r * 0.62} fill="none" stroke="#eaffff" strokeWidth={2 * k} opacity={o * 0.7} />
    </svg>
  );
};

// ───────── terminal ─────────
const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const dashboardLines = (raw: string): Line[] => {
  const lines = parseAnsi(raw);
  const start = lines.findLastIndex((l) => lineText(l).includes('DEVHOP'));
  const end = lines.findLastIndex((l) => lineText(l).includes('Press Ctrl+C'));
  if (start < 0 || end < 0) throw new Error('terminal.ansi does not contain the devhop dashboard');
  return lines.slice(start, end + 1);
};

type Geometry = { h: number; firstQr: number; qrCenter: V3; qrTop: V3; cmdCenter: V3; rowsCenterY: number };
const rowHeight = (l: Line) => (lineText(l).trim() ? TERM_ROW : TERM_BLANK);

const termGeometry = (dash: Line[]): Geometry => {
  const firstQr = dash.findIndex(isQrLine);
  const qrRows = dash.filter(isQrLine);
  const qrW = Math.max(...qrRows.map((r) => lineText(r).length - qrIndent(qrRows))) * QR_MODULE;
  const qrH = qrRows.length * 2 * QR_MODULE;
  const textH = dash.filter((l) => !isQrLine(l)).reduce((sum, l) => sum + rowHeight(l), 0);
  const bodyTop = TERM_TITLE + TERM_PAD + CMD_ROW;
  const h = bodyTop + textH + qrH + TERM_ROW * 0.5 + TERM_PAD;
  const qrTop = bodyTop + dash.slice(0, firstQr).reduce((sum, l) => sum + rowHeight(l), 0) + TERM_ROW * 0.25;
  const qrLeft = TERM_PAD + qrIndent(qrRows) * TERM_FONT * 0.6;
  const cmdW = (TYPED.length + 2) * 52 * 0.6;
  return {
    h,
    firstQr,
    qrCenter: [qrLeft + qrW / 2 - TERM_W / 2, qrTop + qrH / 2 - h / 2, 0],
    qrTop: [qrLeft + qrW / 2 - TERM_W / 2, qrTop - h / 2, 0],
    rowsCenterY: (bodyTop + qrTop) / 2 + 60 - h / 2,
    cmdCenter: [TERM_PAD + cmdW / 2 - TERM_W / 2, TERM_TITLE + TERM_PAD + CMD_ROW / 2 - h / 2, 0],
  };
};

// Dashboard rows print on sixteenth notes after Enter; the QR wipes in over a beat.
const rowBeat = (i: number, firstQr: number) => B.enter + 0.25 + (i <= firstQr ? i : firstQr + 4 + (i - firstQr) * 0.04) * 0.25;

const TerminalWindow: React.FC<{ b: number; dash: Line[]; firstQr: number }> = ({ b, dash, firstQr }) => {
  const n = [...TYPED].filter((_, i) => b >= typeBeat(i)).length;
  const typing = n < TYPED.length;
  const caretOn = typing || Math.floor(b * 2) % 2 === 0;
  // The code prints as the camera arrives on it, so it never wipes in under a caption.
  const qrReveal = ramp(b, Math.max(rowBeat(firstQr, firstQr), B.qrPush[1] - 1), 1, EASE.out);
  const spinning = b >= B.enter && b < B.enter + 0.25;
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
        <div style={{ height: CMD_ROW, fontFamily: mono, fontSize: 52, fontWeight: 700, color: C.ink, whiteSpace: 'pre', lineHeight: '64px' }}>
          <span style={{ color: C.accent }}>❯ </span>
          {TYPED.slice(0, n)}
          {b < B.enter + 0.25 ? (
            <span style={{ display: 'inline-block', width: '0.58em', height: '1.05em', marginLeft: 4, verticalAlign: '-0.16em', borderRadius: 4, background: C.accent, opacity: caretOn ? 0.95 : 0 }} />
          ) : null}
          {spinning ? <span style={{ color: C.accent, marginLeft: 18 }}>{SPIN[Math.floor(b * 16) % SPIN.length]}</span> : null}
        </div>
        <TerminalLines
          lines={dash}
          font={TERM_FONT}
          row={TERM_ROW}
          blankRow={TERM_BLANK}
          qrModule={QR_MODULE}
          qrReveal={qrReveal}
          qrWave={b >= B.bunnyOut && b < B.bunnyOut + 2.5 ? Math.floor((b - B.bunnyOut) * 4) * 4 : undefined}
          rowOpacity={(i) => ramp(b, rowBeat(i, firstQr), 0.22, EASE.snappy)}
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
const EDIT_LINES = ["import { themes } from './themes.js';", '', `${EDIT_PREFIX}${DELETED};`, '', 'const trails = ['];
const EDIT_H = 64 + 40 + EDIT_LINES.length * EDIT_ROW + 40;
const EDIT_LINE_END: V3 = [-EDIT_W / 2 + 40 + 70 + (EDIT_PREFIX.length + 6) * EDIT_FONT * 0.6, -EDIT_H / 2 + 64 + 40 + EDIT_ROW * 2.5, 0];

// Error-retype: the cursor waits on "day", backspaces it, then types "night"
// without a pause.
const EditorWindow: React.FC<{ b: number }> = ({ b }) => {
  const removed = [...DELETED].filter((_, i) => b >= delBeat(i)).length;
  const typed = [...RETYPED].filter((_, i) => b >= retypeBeat(i)).length;
  const word = DELETED.slice(0, DELETED.length - removed) + RETYPED.slice(0, typed);
  const hesitating = b < B.del;
  const caretOn = !hesitating || Math.floor((b - B.cutEdit) * 4) % 2 === 0;
  const dirty = b >= B.del && b < B.save;
  const key = ramp(b, B.save - 0.08, 0.45, EASE.overshoot) * (1 - ramp(b, B.save + 1.2, 0.4, EASE.out));
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
          <div key={i} style={{ display: 'flex', height: EDIT_ROW, whiteSpace: 'pre', background: i === 2 ? alpha('#ffffff', 0.04) : undefined }}>
            <span style={{ width: 70, color: '#4b5263', flexShrink: 0 }}>{i + 1}</span>
            {i === 2 ? (
              <span>
                <Code code={EDIT_PREFIX} />
                <span style={{ color: '#e06c75' }}>{word}</span>
                <span style={{ display: 'inline-block', width: 3, height: 44, verticalAlign: -8, background: C.accent, opacity: caretOn ? 1 : 0 }} />
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
            position: 'absolute', left: EDIT_LINE_END[0] + EDIT_W / 2 - 110, top: 64 + 40 + EDIT_ROW * 3 + 6, display: 'flex', gap: 14,
            transform: `scale(${key.toFixed(3)})`, transformOrigin: 'left top',
            fontFamily: display, fontWeight: 800, fontSize: 50, color: C.bg,
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

// Palette-theme-ripple's cause, collapsed CRT-style: after ⌘S a glowing copy of
// the new word lifts off its line (so it never reads as struck out), squeezes
// to a bright line, then to a dot, which hops into the bunny's paws before it
// leaves for the phone.
const COLLAPSE = { at: B.save + 0.15, lift: 0.15, line: 0.2, dot: 0.15, toPaws: 0.3 };
const WORD_LOCAL: V3 = [40 + 70 + (EDIT_PREFIX.length + RETYPED.length / 2) * EDIT_FONT * 0.6 - EDIT_W / 2, 64 + 40 + EDIT_ROW * 2.5 - EDIT_H / 2, 0];
const Collapse: React.FC<{ b: number; cam: Cam; perch: Pt; size: number }> = ({ b, cam, perch, size }) => {
  const t0 = COLLAPSE.at + COLLAPSE.lift;
  const t1 = t0 + COLLAPSE.line;
  const t2 = t1 + COLLAPSE.dot;
  const t3 = t2 + COLLAPSE.toPaws;
  if (b < COLLAPSE.at || b >= B.hop2[0]) return null;
  const rise = ramp(b, COLLAPSE.at, COLLAPSE.lift, EASE.out);
  const w0 = project(cam, toWorld(EDIT, WORD_LOCAL));
  const w = { ...w0, y: w0.y - rise * EDIT_ROW * 0.9 * w0.k };
  const paws = { x: perch.x + size * perch.k * CHEST[0], y: perch.y - size * perch.k * BUNNY_ASPECT * CHEST[1] };
  if (b >= t2) {
    const u = ramp(b, t2, COLLAPSE.toPaws, EASE.swift);
    const x = mix(w.x, paws.x, u);
    const y = mix(w.y, paws.y, u) - Math.sin(Math.PI * u) * 70 * w.k;
    return (
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <CarriedDot x={x} y={y} k={mix(w.k, perch.k, u) * (b >= t3 ? 1 : 1)} />
      </svg>
    );
  }
  const sy = mix(1, 0.06, ramp(b, t0, COLLAPSE.line, EASE.exit));
  const sx = mix(1, 0.04, ramp(b, t1, COLLAPSE.dot, EASE.exit));
  const glow = rise;
  return (
    <div
      style={{
        position: 'absolute', left: w.x, top: w.y, opacity: Math.min(1, rise * 2), transform: `translate(-50%,-50%) scale(${(sx * w.k).toFixed(4)},${(sy * w.k).toFixed(4)})`,
        fontFamily: mono, fontSize: EDIT_FONT, lineHeight: 1, whiteSpace: 'nowrap', color: '#f0ffff',
        background: sy < 0.5 ? '#f0ffff' : undefined, borderRadius: 999,
        textShadow: `0 0 18px ${alpha(C.accent, 0.9 * glow)}, 0 0 40px ${alpha(C.accent, 0.5 * glow)}`,
        boxShadow: sy < 0.5 ? `0 0 30px 8px ${alpha(C.accent, 0.6)}` : undefined,
      }}
    >
      {RETYPED}
    </div>
  );
};

// ───────── phone ─────────
// Palette-theme-ripple: the new screen opens from the exact landing point on
// the landing beat, a white-hot ring with an accent glow and a late echo ring,
// and settles from 1.035. Works in the page's CSS px.
const RIPPLE_EASE = bezier(0.2, 0.55, 0.3, 1);
const RIPPLE_BEATS = 2.25;
const Ripple: React.FC<{ b: number; at: number; cx: number; cy: number; children: React.ReactNode }> = ({ b, at, cx, cy, children }) => {
  if (b < at) return null;
  const maxR = Math.hypot(Math.max(cx, VIEW_W - cx), Math.max(cy, VIEW_H - cy)) * 1.1;
  const r = mix(3, maxR, ramp(b, at, RIPPLE_BEATS, RIPPLE_EASE));
  const r2 = mix(3, maxR, ramp(b, at + 0.29, RIPPLE_BEATS, RIPPLE_EASE)) * 0.96;
  const ring = 1 - ramp(b, at + 0.2, RIPPLE_BEATS - 0.2, EASE.out);
  const settle = mix(1.035, 1, ramp(b, at, 1.9, EASE.snappy));
  const done = b >= at + RIPPLE_BEATS;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, clipPath: done ? undefined : `circle(${r.toFixed(1)}px at ${cx}px ${cy}px)` }}>
        <div style={{ position: 'absolute', inset: 0, transformOrigin: `${cx}px ${cy}px`, transform: settle > 1.0001 ? `scale(${settle.toFixed(4)})` : undefined }}>{children}</div>
      </div>
      {ring > 0.01 ? (
        <>
          <div style={{ position: 'absolute', left: cx - r2, top: cy - r2, width: r2 * 2, height: r2 * 2, borderRadius: '50%', boxSizing: 'border-box', border: `1.2px solid ${alpha('#bff7ff', 0.5)}`, opacity: ring * 0.6 }} />
          <div
            style={{
              position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%', boxSizing: 'border-box',
              border: '2.5px solid rgba(240,255,255,0.95)', opacity: ring,
              boxShadow: `0 0 27px 5px ${alpha(C.accent, 0.55)}, 0 0 72px 16px ${alpha(C.accent, 0.22)}, inset 0 0 24px rgba(255,255,255,0.3)`,
            }}
          />
        </>
      ) : null}
    </>
  );
};

// One string rolls over to another, character by character, in a fixed-width
// cell per character so nothing reflows while it rolls.
const HostRoll: React.FC<{ b: number; at: number; from: string; to: string; size: number }> = ({ b, at, from, to, size }) => {
  const H = Math.round(size * 1.3);
  const n = Math.max(from.length, to.length);
  return (
    <span style={{ display: 'flex', height: H, overflow: 'hidden', fontFamily: mono, fontSize: size, lineHeight: `${H}px` }}>
      {Array.from({ length: n }, (_, i) => {
        const p = ROLL(Math.min(1, Math.max(0, (b - at - i * 0.012) / 0.5)));
        return (
          <span key={i} style={{ position: 'relative', width: '0.6em', height: H, flexShrink: 0 }}>
            <span style={{ position: 'absolute', left: 0, top: -p * H }}>{from[i] ?? ''}</span>
            <span style={{ position: 'absolute', left: 0, top: (1 - p) * H }}>{to[i] ?? ''}</span>
          </span>
        );
      })}
    </span>
  );
};

// Pinned top center while the camera rides the hop; it narrows as the hostname
// rolls down to the shorter one.
const HostChip: React.FC<{ b: number; from: string; to: string }> = ({ b, from, to }) => {
  const on = ramp(b, B.hostChip[0], 0.4, EASE.out) * (1 - ramp(b, B.hostChip[1], 0.4, EASE.exit));
  if (on <= 0) return null;
  const width = (n: number) => (6.6 + n) * 34 * 0.6 + 72;
  const w = mix(width(from.length), width(to.length), ROLL(Math.min(1, Math.max(0, (b - B.hostRoll - 0.15) / 0.8))));
  return (
    <div
      style={{
        position: 'absolute', left: 960 - w / 2, top: 92, width: w, boxSizing: 'border-box', overflow: 'hidden', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', padding: '14px 32px', borderRadius: 16,
        background: 'rgba(7,9,12,0.86)', border: `2px solid ${alpha(C.accent, 0.6)}`, boxShadow: `0 0 40px ${alpha(C.accent, 0.25)}`,
        fontFamily: mono, fontWeight: 700, fontSize: 34, color: C.ink, opacity: on, transform: `translateY(${((1 - on) * 14).toFixed(1)}px)`,
      }}
    >
      <span style={{ color: C.accent, marginRight: '0.6em' }}>Host:</span>
      <HostRoll b={b} at={B.hostRoll} from={from} to={to} size={34} />
    </div>
  );
};

// The phone's screen is the drawn page at 390 CSS px, scaled up to the layout.
const SCREEN_SCALE = SCREEN_W_L / VIEW_W;
// A point in the screen's CSS px (status bar included) → phone-local world px.
const onScreen = (x: number, y: number): V3 => [(x * SCREEN_SCALE - SCREEN_W_L / 2) / 2, (y * SCREEN_SCALE - SCREEN_H_L / 2) / 2, 0];
const LAND_CSS = { x: VIEW_W / 2, y: (SCREEN_H_L / 2 + LAND[1] * 2) / SCREEN_SCALE - SAFARI_TOP };

// The long cut's payoff: the phone over plain http (the TypeError from chapter 01)
// flips over to devhop's HTTPS, the bunny hops onto Voice note and then Allow.
const TAILNET_HOST = '100.112.233.33:3000'; // the address in Noor's screenshots, on port 3000
const MIC = {
  flip: B.hop1[1],
  arrive: B.hop1[1] + 0.3, // as the back face comes round
  tap: B.hop1[1] + 1.6, // the bunny lands on Voice note
  prompt: B.hop1[1] + 1.85,
  allow: B.hop1[1] + 2.75, // … and on Allow
  recording: B.hop1[1] + 3.05,
};
const ALLOW_CSS = { x: VIEW_W / 2 + 67, y: VIEW_H / 2 + 52 };
const MIC_ERRORS = [0, 1, 2].map(() => ({ text: TYPE_ERROR, at: -Infinity }));

const ScreenScale: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: VIEW_W, height: VIEW_H, transform: `scale(${SCREEN_SCALE.toFixed(5)})`, transformOrigin: '0 0' }}>{children}</div>
);

const PhoneScreen: React.FC<{ b: number; rawHost: string; devhopHost: string; long?: boolean }> = ({ b, rawHost, devhopHost, long }) => {
  const host = b < B.hop1[1] + 0.2 ? rawHost : devhopHost;
  const log = long ? [{ text: '● Recording', ok: true, at: MIC.recording }] : [];
  return (
    <ScreenScale>
      <Safari host={host} secure>
        {long ? (
          <TrailPage b={b} theme="day" arrive={MIC.arrive} log={log} />
        ) : (
          <>
            <Img src={staticFile('devhop/blocked.png')} style={{ position: 'absolute', top: 0, left: 0, width: VIEW_W }} />
            <Ripple b={b} at={B.hop1[1]} cx={LAND_CSS.x} cy={LAND_CSS.y}>
              <TrailPage b={b} theme="day" arrive={B.hop1[1] + 0.05} />
            </Ripple>
          </>
        )}
        <Ripple b={b} at={B.hop2[1]} cx={LAND_CSS.x} cy={LAND_CSS.y}>
          <TrailPage b={b} theme="night" log={log} />
        </Ripple>
      </Safari>
      {long ? <MicPrompt host={devhopHost} p={ramp(b, MIC.prompt, 0.35, EASE.snappy)} allow={ramp(b, MIC.allow, 0.6, EASE.linear)} /> : null}
    </ScreenScale>
  );
};

// Card-flip-reveal: a lean back as the bunny lands, a fast turn past 180° and a
// spring back, the face darkening as it turns away and a narrow band of light
// crossing the edge at 90°.
const FLIP_TURN = bezier(0.55, 0, 0.3, 1);
const flipAngle = (b: number) => {
  const t = b - MIC.flip;
  if (t < 0) return 0;
  if (t < 0.75) return -10 * ramp(b, MIC.flip, 0.15, EASE.out) * (1 - ramp(b, MIC.flip + 0.15, 0.6, FLIP_TURN)) + 194 * ramp(b, MIC.flip + 0.15, 0.6, FLIP_TURN);
  const u = t - 0.75;
  return 180 + 14 * Math.exp(-u * 6) * Math.cos(u * 2 * Math.PI * 1.1);
};

const FlipFace: React.FC<{ angle: number; back?: boolean; children: React.ReactNode }> = ({ angle, back, children }) => {
  const a = ((back ? angle - 180 : angle) * Math.PI) / 180;
  const shade = (1 - Math.abs(Math.cos(a))) * 0.55;
  const deg = Math.abs((((angle % 360) + 360) % 360) - 90);
  const band = Math.max(0, 1 - deg / 34);
  const pos = ((back ? 1 - (angle - 56) / 68 : (angle - 56) / 68) * 100).toFixed(1);
  return (
    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: back ? 'rotateY(180deg)' : undefined }}>
      <Phone width={PHONE_LAYOUT}>{children}</Phone>
      {shade > 0.01 || band > 0.01 ? (
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: PHONE_LAYOUT * 0.16, pointerEvents: 'none',
            background: `linear-gradient(90deg, transparent calc(${pos}% - 90px), rgba(235,252,255,${(0.75 * band).toFixed(3)}) ${pos}%, transparent calc(${pos}% + 90px)), rgba(0,0,0,${shade.toFixed(3)})`,
          }}
        />
      ) : null}
    </div>
  );
};

const FlipPhone: React.FC<{ b: number; rawHost: string; devhopHost: string }> = ({ b, rawHost, devhopHost }) => {
  const angle = flipAngle(b);
  const lift = 120 * Math.sin(Math.PI * Math.min(1, Math.max(0, (angle + 10) / 204)));
  const showBack = b >= MIC.flip + 0.3;
  return (
    <div style={{ position: 'relative', width: PHONE_LAYOUT, height: PHONE_H_L, transformStyle: 'preserve-3d', transform: angle ? `perspective(3200px) translateZ(${lift.toFixed(1)}px) rotateY(${angle.toFixed(3)}deg)` : undefined }}>
      {angle < 100 ? (
        <FlipFace angle={angle}>
          <ScreenScale>
            <Safari host={TAILNET_HOST} secure={false}>
              <TrailPage b={b} theme="day" log={MIC_ERRORS} />
            </Safari>
          </ScreenScale>
        </FlipFace>
      ) : null}
      {showBack ? (
        <FlipFace angle={angle} back>
          <PhoneScreen b={b} rawHost={rawHost} devhopHost={devhopHost} long />
        </FlipFace>
      ) : null}
    </div>
  );
};

// Vertical word roll: BLOCKED → LIVE → the measured hot-reload time. Each roll
// is 0.7 outQuint + 0.3 outBack; rows away from the center blur vertically and
// fade, and a word turns accent only once it has settled.
const outQuint: Ease = (t) => 1 - Math.pow(1 - t, 5);
const outBack: Ease = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
const ROLL: Ease = (t) => 0.7 * outQuint(t) + 0.3 * outBack(t);
const WORD_ROW = 240;
const WORD_ROLL_BEATS = 1.2;

const BigWord: React.FC<{ b: number; hmrMs: number; presence: number }> = ({ b, hmrMs, presence }) => {
  const slam = ramp(b, B.blocked, 0.5, EASE.snappy);
  if (slam <= 0 || presence < 0.01) return null;
  const rolls = [B.hop1[1] + 0.1, B.hop2[1] + 0.1];
  const p = rolls.reduce((sum, at) => sum + ROLL(Math.min(1, Math.max(0, (b - at) / WORD_ROLL_BEATS))), 0);
  const count = Math.round(hmrMs * ramp(b, rolls[1] + 0.3, 1.2, EASE.out));
  const words = ['BLOCKED', 'LIVE', `${count}\u2002ms`];
  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, transform: `${placeCss(PHONE, [-PW / 2 - 70, -250, -300])} translate(-100%, -50%) scale(${mix(1.3, 1, slam).toFixed(4)})`,
        transformOrigin: 'right center', opacity: slam * presence,
      }}
    >
      <div style={{ position: 'relative', width: 1100, height: WORD_ROW, overflow: 'visible' }}>
        {words.map((w, i) => {
          const d = Math.abs(i - p);
          if (d > 1.2 || (i > p && b < rolls[i - 1])) return null;
          // The card's 3–5 px are for 30 px type; scale to this size, vertical only.
          const blur = (d < 1 ? 3 * d : 3 + 2 * Math.min(d - 1, 1)) * (205 / 30) * 0.5;
          const op = d < 1 ? 1 - 0.65 * d : Math.max(0.1, 0.35 - 0.23 * (d - 1));
          const lit = Math.min(1, Math.max(0, 1 - 2.4 * d));
          const settled = i === 0 ? 0 : lit;
          const gone = i < words.length - 1 ? 1 - ramp(b, rolls[i] + 0.6, 1.5, EASE.out) : 1;
          return (
            <div
              key={w.replace(/\d/g, '')}
              style={{
                position: 'absolute', right: 0, top: (i - p) * WORD_ROW, height: WORD_ROW, lineHeight: `${WORD_ROW}px`,
                fontFamily: display, fontWeight: 800, fontSize: 205, letterSpacing: i === 0 ? '0.02em' : '-0.02em', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                // BLOCKED: the variable font's overlapping contours show through a bare
                // outline, so a dark fill is painted over the inner half of the stroke.
                color: i === 0 ? 'rgba(10,12,16,0.92)' : alpha(C.accent, settled),
                paintOrder: 'stroke fill',
                WebkitTextStroke: `${i === 0 ? 8 : 4}px ${i === 0 ? alpha('#ffffff', 0.5) : alpha(C.accent, 0.35 + 0.65 * settled)}`,
                opacity: op * gone, filter: blur > 0.3 ? `url(#roll-blur-${i})` : undefined,
              }}
            >
              {blur > 0.3 ? (
                <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
                  <filter id={`roll-blur-${i}`} x="-10%" y="-50%" width="120%" height="200%">
                    <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
                  </filter>
                </svg>
              ) : null}
              {w}
            </div>
          );
        })}
        <div style={{ position: 'absolute', right: 6, top: WORD_ROW * 0.9, fontFamily: mono, fontWeight: 700, fontSize: 58, letterSpacing: '0.1em', color: C.ink2, whiteSpace: 'nowrap', opacity: ramp(b, rolls[1] + 0.5, 0.6, EASE.out) }}>
          MEASURED HOT RELOAD
        </div>
      </div>
    </div>
  );
};

// ───────── captions ─────────
// Blur-slide: each word rises out of focus on a sixteenth note, with y, blur
// and opacity on one progress value. *word* is accent.
const CaptionText: React.FC<{ b: number; at: number; to: number; text: string }> = ({ b, at, to, text }) => {
  const out = ramp(b, to - 0.35, 0.35, EASE.exit);
  if (b < at || out >= 1) return null;
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', columnGap: '0.26em', whiteSpace: 'nowrap', opacity: 1 - out, filter: out > 0 ? `blur(${(out * 8).toFixed(2)}px)` : undefined }}>
      {words.map((w, i) => {
        const p = ramp(b, at + i * 0.25, 0.8, EASE.out);
        const accent = w.startsWith('*') || w.endsWith('*') || w.endsWith('*.');
        const shown = w.replace(/\*/g, '');
        return (
          <span
            key={i}
            style={{
              display: 'inline-block', opacity: p, transform: `translateY(${((1 - p) * 26).toFixed(2)}px)`,
              filter: p >= 0.999 ? undefined : `blur(${((1 - p) * 7).toFixed(2)}px)`, color: accent ? C.accent : C.ink,
            }}
          >
            {shown}
          </span>
        );
      })}
    </div>
  );
};

// Inner `*…*` spans can cover several words; mark every word inside them.
const markAccents = (text: string) => {
  let inside = false;
  return text
    .split(' ')
    .map((w) => {
      const starts = w.startsWith('*');
      const ends = /\*[.,]?$/.test(w);
      const marked = inside || starts ? `*${w.replace(/\*/g, '')}*` : w;
      if (starts) inside = true;
      if (ends) inside = false;
      return marked;
    })
    .join(' ');
};

export const Captions: React.FC<{ b: number; list: Caption[] }> = ({ b, list }) => {
  const current = list.find((c) => b >= c.at && b < c.to);
  const chapter = [...list].reverse().find((c) => b >= c.at)?.kicker;
  const chapterAt = list.find((c) => c.kicker === chapter)?.at ?? 0;
  const chapterEnd = Math.max(...list.filter((c) => c.kicker === chapter).map((c) => c.to));
  const k = ramp(b, chapterAt, 0.6, EASE.out) * (1 - ramp(b, chapterEnd - 0.35, 0.35, EASE.exit));
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 62% 46% at 18% 100%, rgba(7,9,12,0.82) 0%, rgba(7,9,12,0.5) 50%, rgba(7,9,12,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'linear-gradient(0deg, rgba(7,9,12,0.9) 0%, rgba(7,9,12,0.72) 45%, rgba(7,9,12,0) 100%)', opacity: current ? 1 : 0.5 }} />
      <div style={{ position: 'absolute', left: 120, bottom: 112, width: 1120, fontFamily: display, fontWeight: 800, fontSize: 64, lineHeight: 1.12, letterSpacing: '-0.02em' }}>
        {chapter && k > 0 ? (
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 32, letterSpacing: '0.12em', color: C.accent, marginBottom: 22, opacity: k, transform: `translateY(${((1 - k) * 12).toFixed(1)}px)` }}>
            {chapter}
          </div>
        ) : null}
        {current ? <CaptionText b={b} at={current.at} to={current.to} text={markAccents(current.text)} /> : null}
      </div>
    </>
  );
};

// ───────── outro ─────────
// Logo lockup: the bunny lands in the middle, slides left to make room, the
// letters slide in, then `npx devhop` stamps in when the music comes back.
const MASCOT = 260;
const LOCKUP_Y = 450;
const LOCKUP_SHIFT = -330;
const LOCKUP_LIFT = 340; // how far `lift` raises it

// Logo-shrink-wordmark-lockup: an accent ring three times the bunny's size closes
// on its landing point as it flies in, brakes past its size by 6 % on the
// landing beat, heals its gaps to white and lets the bunny take its place.
const RING_R = MASCOT * 0.62;
const LockupRing: React.FC<{ b: number }> = ({ b }) => {
  const land = B.hop3[1];
  const shrink = ramp(b, land - 0.75, 0.75, bezier(0.65, 0, 0.35, 1));
  const brake = b >= land && b < land + 0.3 ? 0.06 * Math.sin((Math.PI * (b - land)) / 0.3) : 0;
  const fade = 1 - ramp(b, land + 0.15, 0.6, EASE.out);
  if (b < land - 0.75 || fade <= 0) return null;
  const r = RING_R * (mix(3.4, 1, shrink) + brake);
  const heal = ramp(b, land - 0.45, 0.45, EASE.out);
  const circ = 2 * Math.PI * r;
  const gap = circ * 0.12 * (1 - heal);
  const cy = LOCKUP_Y;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`rotate(${(-90 + 160 * shrink).toFixed(2)} 960 ${cy})`} opacity={fade}>
        <circle cx={960} cy={cy} r={r} fill="none" stroke={alpha(C.accent, 0.35)} strokeWidth={26} strokeDasharray={`${(circ / 2 - gap).toFixed(1)} ${gap.toFixed(1)}`} style={{ filter: 'blur(10px)' }} />
        <circle cx={960} cy={cy} r={r} fill="none" stroke={heal >= 1 ? '#ffffff' : C.accent} strokeWidth={7} strokeDasharray={`${(circ / 2 - gap).toFixed(1)} ${gap.toFixed(1)}`} />
      </g>
    </svg>
  );
};

// `end` is where the push-in ends; `lift` (0–1) moves the lockup up to make room
// below it, for the long cut's last chapter.
// The bunny's feet and size on screen, for hops that leave or join the lockup.
export const lockupMascot = (b: number, end: number, lift: number) => {
  const s = lockupPush(b, end) * mix(1, 0.75, lift);
  const x = 960 + (960 + LOCKUP_SHIFT - 960) * s;
  const y = LOCKUP_Y + 100 + (LOCKUP_Y + MASCOT * BUNNY_ASPECT * (FEET - 0.5) - LOCKUP_Y - 100) * s - LOCKUP_LIFT * lift;
  return { x, y, size: MASCOT * s };
};
const lockupPush = (b: number, end: number) => 1 + 0.06 * ramp(b, B.word + 1.5, end - B.word - 1.5, EASE.linear);

// `away`: beats the bunny is off hopping elsewhere. `stamp`: a second flash of
// the pill, where something condenses into it.
const Lockup: React.FC<{ b: number; end: number; lift: number; away?: [number, number]; stamp?: number }> = ({ b, end, lift, away, stamp }) => {
  const shift = ramp(b, B.word, 1, bezier(0.65, 0, 0.35, 1));
  const pill = ramp(b, B.pill, 0.4, EASE.snappy);
  const flashAt = (at: number) => ramp(b, at, 0.1, EASE.linear) * (1 - ramp(b, at + 0.1, 0.8, EASE.out));
  const flash = Math.max(flashAt(B.pill), stamp === undefined ? 0 : flashAt(stamp));
  const tag = ramp(b, B.pill + 0.75, 0.9, EASE.out);
  const mascot = b >= B.hop3[1] + 0.36 && !(away && b >= away[0] && b < away[1]) ? 1 : 0;
  const push = lockupPush(b, end);
  // Small hops in place on every other downbeat once the lockup is complete.
  const hops = Array.from({ length: Math.floor((end - 51) / 2) + 1 }, (_, i) => 50 + i * 2).filter((at) => Math.abs(at - END_BEAT) > 0.5);
  const idle = hops.reduce((y, at) => y + (b >= at && b < at + 0.7 ? -26 * Math.sin((Math.PI * (b - at)) / 0.7) : 0), 0);
  const pulse = b >= B.pill + 1 ? Math.exp(-((b - B.pill) % 1) * 5) : 0;
  const floor = ramp(b, B.hop3[1], 1, EASE.out);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(-LOCKUP_LIFT * lift).toFixed(1)}px) scale(${(push * mix(1, 0.75, lift)).toFixed(4)})`, transformOrigin: `960px ${LOCKUP_Y + 100}px` }}>
      <div style={{ position: 'absolute', left: 960 - 650, top: LOCKUP_Y + 300, width: 1300, height: 260, borderRadius: '50%', opacity: floor, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha(C.accent, 0.18)} 0%, ${alpha(C.accent, 0.05)} 50%, ${alpha(C.accent, 0)} 72%)` }} />
      {mascot > 0 ? (
        <div style={{ position: 'absolute', left: 960 + LOCKUP_SHIFT * shift - MASCOT / 2, top: LOCKUP_Y - (MASCOT * BUNNY_ASPECT) / 2 + idle }}>
          <Bunny size={MASCOT} style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))' }} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: 960 + LOCKUP_SHIFT + MASCOT / 2 + 30, top: LOCKUP_Y - 120, display: 'flex', height: 240, alignItems: 'center' }}>
        {[...'devhop'].map((l, i) => {
          // Split-text-stagger: each letter hops up out of a cropped baseline on a
          // sixteenth, overshoots 10 % and drops back, after the bunny.
          const at = B.word + 0.45 + i * 0.25;
          const up = ramp(b, at, 0.5, bezier(0.33, 1, 0.68, 1));
          const down = ramp(b, at + 0.5, 0.22, EASE.smooth);
          const y = 1.15 * (1 - up) - 0.1 * up * (1 - down);
          return (
            <span key={i} style={{ display: 'inline-block', overflow: 'hidden', padding: '40px 0 60px', margin: '-40px 0 -60px' }}>
              <span
                style={{
                  display: 'inline-block', fontFamily: display, fontWeight: 800, fontSize: 210, letterSpacing: '-0.045em', color: C.ink,
                  transform: up >= 1 && down >= 1 ? undefined : `translateY(${(y * 100).toFixed(2)}%)`,
                }}
              >
                {l}
              </span>
            </span>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: LOCKUP_Y + 170, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            fontFamily: mono, fontWeight: 700, fontSize: 56, color: C.accent, padding: '16px 44px', borderRadius: 999,
            border: `2.5px solid ${alpha(C.accent, 0.7)}`, background: alpha(C.accent, 0.08 + 0.5 * flash),
            boxShadow: `0 0 ${(30 + 90 * flash + 20 * pulse).toFixed(1)}px ${alpha(C.accent, 0.2 + 0.5 * flash + 0.12 * pulse)}`,
            opacity: pill, transform: `scale(${mix(1.25, 1, pill).toFixed(4)})`,
          }}
        >
          npx devhop
        </div>
        <div style={{ marginTop: 36, fontFamily: display, fontWeight: 600, fontSize: 48, color: C.ink2, opacity: tag * (1 - lift), transform: `translateY(${((1 - tag) * 16).toFixed(1)}px)`, filter: tag < 0.999 ? `blur(${((1 - tag) * 6).toFixed(2)}px)` : undefined }}>
          Your dev server, on your phone.
        </div>
      </div>
    </div>
  );
};

// ───────── sound ─────────
// Quiet under the problem, full from the drop on Enter, out over the last bars.
export const Sound: React.FC<{ bgm: boolean; cues: Cue[]; startSec: number; drop: number; end: number }> = ({ bgm, cues, startSec, drop, end }) => (
  <>
    {bgm ? (
      <Audio
        src={staticFile('audio/cat-walk.mp3')}
        startFrom={Math.round((startSec + OUTPUT_AUDIO_OFFSET_SEC) * FPS)}
        volume={(f) => (f * PER_FRAME < drop ? 0.26 : 0.44) * Math.min(1, f / 6) * (1 - ramp(f * PER_FRAME, end - 2.5, 2.5, EASE.smooth))}
      />
    ) : null}
    {cues.map((c, i) => (
      <Sequence key={i} from={cueFrom(c)} durationInFrames={c.frames ?? Infinity} layout="none">
        <Audio src={staticFile(`audio/${c.src}`)} volume={c.volume} />
      </Sequence>
    ))}
  </>
);

// ───────── composition ─────────
export type Meta = { port: number; devhopUrl: string; blockedText: string; hmrMs: number; configBefore: string; configAfter: string };

// Real motion blur where the camera or the bunny moves fast: the world is
// rendered at several instants inside a 180° shutter and the copies are blended
// with equal weight (each layer is opaque, so 1/(i+1) stacking averages them).
// The sample count follows the fastest on-screen speed, so copies sit at most
// 2.5 px apart and read as a smear, not a ladder.
const SHUTTER = 0.5; // frames
const MAX_SAMPLES = 32;
const HOPS: [number, number][] = [[B.hop1[0], B.hop1[1]], [B.hop2[0], B.hop2[1]], [B.hop3[0], B.hop3[1]]];

const screenSpeed = (plan: ReturnType<typeof shots>, geo: Geometry, b: number) => {
  const anchors: V3[] = [
    toWorld(TERM, geo.qrCenter), toWorld(TERM, geo.cmdCenter), toWorld(PHONE, LAND), toWorld(EDIT, EDIT_LINE_END), [PHONE.x, PHONE.y, PHONE.z],
  ];
  const c0 = camAt(plan, b - PER_FRAME);
  const c1 = camAt(plan, b);
  return Math.max(
    ...anchors.map((p) => {
      const a = project(c0, p);
      const q = project(c1, p);
      const visible = q.z < PERSP - 200 && q.x > -300 && q.x < 2220 && q.y > -300 && q.y < 1380;
      return visible ? Math.hypot(q.x - a.x, q.y - a.y) : 0;
    }),
  );
};

type SceneProps = { b: number; meta: Meta; dash: Line[]; geo: Geometry; plan: ReturnType<typeof shots>; long?: boolean };

const World: React.FC<SceneProps> = ({ b, meta, dash, geo, plan, long }) => {
  const rawHost = rawHostOf(meta);
  const devhopHost = new URL(meta.devhopUrl).host;
  const cam = camAt(plan, b);

  const qrWorld = toWorld(TERM, geo.qrTop);
  const landWorld = toWorld(PHONE, LAND);
  const editWorld = toWorld(EDIT, [EDIT_LINE_END[0] + 75, EDIT_LINE_END[1] + EDIT_ROW * 0.3, 0]);
  const arc = (from: V3, to: V3, lift: number) => {
    const mid: V3 = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - lift, (from[2] + to[2]) / 2];
    return (t: number) => project(cam, bezier3(from, mid, to, t));
  };
  const lockupFeet = { x: 960, y: LOCKUP_Y + MASCOT * BUNNY_ASPECT * (FEET - 0.5) };
  const quad = (a: { x: number; y: number }, c: { x: number; y: number }, e: { x: number; y: number }, t: number) => {
    const u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * e.x, y: u * u * a.y + 2 * u * t * c.y + t * t * e.y };
  };
  const hop3 = (t: number): Pt => {
    const s = project(cam, landWorld);
    if (t < 0.45) {
      const p = quad(s, { x: s.x + 260, y: s.y - 420 }, { x: 2160, y: 120 }, t / 0.45);
      return { ...p, k: Math.max(0.5, s.k * 1.4) };
    }
    const p = quad({ x: -240, y: 120 }, { x: 360, y: lockupFeet.y - 360 }, lockupFeet, (t - 0.45) / 0.55);
    return { ...p, k: 1 };
  };

  const wide = Math.min(1, Math.max(0, cam.pull / 1500));
  const focus = (p: Pose) => {
    const half = p === TERM ? TERM_W / 2 : p === EDIT ? EDIT_W / 2 : PW / 2;
    const d = Math.max(0, Math.hypot(cam.at[0] - p.x, cam.at[2] - p.z) - half * 0.9);
    return Math.min(1, Math.max(0, 1 - (d - 150) / 900) + wide * 0.55);
  };
  const objFilter = (p: Pose): React.CSSProperties => {
    const f = focus(p);
    const blur = (1 - f) * 5;
    return { filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px) brightness(${(0.55 + 0.45 * f).toFixed(3)})` : undefined };
  };
  const outro = ramp(b, B.hop3[0] + 0.3, 1.6, EASE.smooth);
  const editIn = b >= B.cutEdit ? 1 - ramp(b, B.hop2[0] + 0.3, 1.2, EASE.swift) * (1 - ramp(b, B.wide[0], 1.5, EASE.smooth)) : 0;
  const landPt = project(cam, landWorld);
  const micWorld = toWorld(PHONE, onScreen(PAGE.voiceButton.x, PAGE.voiceButton.y + SAFARI_TOP - 30));
  const allowWorld = toWorld(PHONE, onScreen(ALLOW_CSS.x, ALLOW_CSS.y - 14));
  const micPt = project(cam, micWorld);
  const allowPt = project(cam, allowWorld);
  const close = Math.min(1, Math.max(0, (cam.pull + 900) / 300));
  const phonePresence = EASE.smooth(Math.min(1, Math.max(0, (focus(PHONE) - 0.35) / 0.5))) * close;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - outro, filter: outro > 0.02 ? `blur(${(outro * 10).toFixed(2)}px)` : undefined }}>
        <Floor cam={cam} />
        <Dust cam={cam} />
        <Glow cam={cam} at={[PHONE.x, PHONE.y - 80, PHONE.z - 380]} w={2000} h={1300} color="#9fdcff" a={focus(PHONE)} />
        <Glow cam={cam} at={[TERM.x, TERM.y, TERM.z - 380]} w={2600} h={1400} color="#9fdcff" a={focus(TERM) * 0.8} />
        <Glow cam={cam} at={[PHONE.x, FLOOR_Y, PHONE.z]} w={1300} h={300} color={C.accent} a={focus(PHONE)} />
        <Glow cam={cam} at={[TERM.x, FLOOR_Y, TERM.z]} w={1700} h={320} color={C.accent} a={focus(TERM)} />
        <div style={{ position: 'absolute', inset: 0, perspective: PERSP, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 960, top: 540, width: 0, height: 0, transformStyle: 'preserve-3d', transform: worldCss(cam) }}>
            <BigWord b={b} hmrMs={meta.hmrMs} presence={phonePresence} />
            <div style={{ position: 'absolute', left: -TERM_W / 2, top: -geo.h / 2, width: TERM_W, height: geo.h, transform: placeCss(TERM), boxShadow: '0 60px 140px rgba(0,0,0,.7)', borderRadius: 26, ...objFilter(TERM) }}>
              <TerminalWindow b={b} dash={dash} firstQr={geo.firstQr} />
            </div>
            {editIn > 0.01 ? (
              <div
                style={{
                  position: 'absolute', left: -EDIT_W / 2, top: -EDIT_H / 2, width: EDIT_W, height: EDIT_H, borderRadius: 24,
                  transform: `${placeCss(EDIT)} translateY(${((1 - editIn) * 520).toFixed(1)}px) rotateX(${((1 - editIn) * 40).toFixed(2)}deg)`,
                  opacity: editIn, boxShadow: '0 60px 140px rgba(0,0,0,.7)', ...objFilter(EDIT),
                }}
              >
                <EditorWindow b={b} />
              </div>
            ) : null}
            <div style={{ position: 'absolute', left: -PHONE_LAYOUT / 2, top: -PHONE_H_L / 2, transform: `${placeCss(PHONE)} scale(0.5)`, ...objFilter(PHONE) }}>
              {long ? (
                <FlipPhone b={b} rawHost={rawHost} devhopHost={devhopHost} />
              ) : (
                <Phone width={PHONE_LAYOUT}>
                  <PhoneScreen b={b} rawHost={rawHost} devhopHost={devhopHost} />
                </Phone>
              )}
            </div>
          </div>
        </div>
      </div>
      <Hop id="h1" pts={arc(qrWorld, landWorld, 200)} b={b} out={B.bunnyOut} start={B.hop1[0]} end={B.hop1[1]} size={220} handoff={long} />
      <Impact x={landPt.x} y={landPt.y} k={landPt.k} b={b} at={B.hop1[1]} />
      {long ? (
        <>
          <Hop id="h1m" pts={arc(landWorld, micWorld, 260)} b={b} out={B.hop1[1]} start={B.hop1[1] + 0.1} end={MIC.tap} size={105} keep={b < MIC.allow} />
          <Impact x={micPt.x} y={micPt.y} k={micPt.k * 0.6} b={b} at={MIC.tap} />
          <Hop id="h1a" pts={arc(micWorld, allowWorld, 140)} b={b} out={MIC.allow - 0.5} start={MIC.allow - 0.5} end={MIC.allow} size={95} />
          <Impact x={allowPt.x} y={allowPt.y} k={allowPt.k * 0.5} b={b} at={MIC.allow} />
        </>
      ) : null}
      <Collapse b={b} cam={cam} perch={project(cam, editWorld)} size={130} />
      <Hop id="h2" pts={arc(editWorld, landWorld, 160)} b={b} out={B.save} start={B.hop2[0]} end={B.hop2[1]} size={130} carry={b >= COLLAPSE.at + COLLAPSE.lift + COLLAPSE.line + COLLAPSE.dot + COLLAPSE.toPaws} />
      <Impact x={landPt.x} y={landPt.y} k={landPt.k} b={b} at={B.hop2[1]} />
      {b >= B.hop3[0] - 0.5 && b < B.hop3[1] + 0.36 ? <Hop id="h3" pts={hop3} b={b} out={B.hop3[0] - 0.5} start={B.hop3[0]} end={B.hop3[1]} size={MASCOT} keep /> : null}
    </AbsoluteFill>
  );
};

export const rawHostOf = (meta: Meta) => /\("?([a-z0-9.-]+\.trycloudflare\.com)"?\)/.exec(meta.blockedText)?.[1] ?? '';

// The film from any beat: the world with motion blur, the Host chip and the
// logo. `b` is in this film's beats; the long cut passes its own minus the shift.
export const Film: React.FC<{ b: number; meta: Meta; ansi: string; end: number; lift?: number; long?: boolean; away?: [number, number]; stamp?: number }> = ({ b, meta, ansi, end, lift = 0, long, away, stamp }) => {
  const dash = dashboardLines(ansi);
  const geo = termGeometry(dash);
  const plan = shots(geo);
  const speed = screenSpeed(plan, geo, b);
  const hopping = HOPS.some(([s, e]) => b >= s && b <= e);
  const n = Math.min(MAX_SAMPLES, Math.max(hopping ? 8 : 1, speed < 20 ? 1 : Math.ceil((speed * SHUTTER) / 2.5) + 1));
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <AbsoluteFill key={i} style={{ opacity: 1 / (i + 1) }}>
          <World b={b - (n > 1 ? (SHUTTER * i) / (n - 1) : 0) * PER_FRAME} meta={meta} dash={dash} geo={geo} plan={plan} long={long} />
        </AbsoluteFill>
      ))}
      <HostChip b={b} from={new URL(meta.devhopUrl).host} to={`localhost:${meta.port}`} />
      <LockupRing b={b} />
      {b >= B.hop3[1] ? <Lockup b={b} end={end} lift={lift} away={away} stamp={stamp} /> : null}
    </>
  );
};

export const Finish: React.FC = () => (
  <>
    <Vignette strength={0.5} inner={0.5} color="#000000" />
    <Grain opacity={0.06} step={1} blend="soft-light" />
  </>
);

export const DevhopDemo: React.FC<{ bgm?: boolean }> = ({ bgm = true }) => {
  const frame = useCurrentFrame();
  const metaRaw = useTextAsset('devhop/meta.json');
  const ansi = useTextAsset('devhop/terminal.ansi');
  if (!metaRaw || !ansi) return null;
  const b = frame * PER_FRAME;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Film b={b} meta={JSON.parse(metaRaw)} ansi={ansi} end={END_BEAT} />
      <Captions b={b} list={CAPTIONS} />
      <Finish />
      <Sound bgm={bgm} cues={CUES} startSec={AUDIO_START_SEC} drop={B.enter} end={END_BEAT} />
    </AbsoluteFill>
  );
};
