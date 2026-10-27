// The long cut: the problem chapter (Montage.tsx), the film from the cut to the
// terminal on, and a last chapter on the agent skill devhop ships. Timing is in
// timeline.ts under "long cut".
//
// Chapter 04 adapts three video-shotcraft recipes (Apache-2.0, see NOTICE):
// draw-svg-trace (the bunny draws the card's outline, one corner per beat),
// canvas-materialize-moves A, panel-to-canvas (rows leave the file and become
// cards, their slots left dashed), and grain-dissolve (feTurbulence +
// feDisplacementMap boil the card, which condenses into the pill).
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { mono } from '../../lib/fonts';
import { EASE, alpha, bezier, mix, ramp } from '../../lib/motion';
import { useTextAsset } from '../../lib/useTextAsset';
import { C, Captions, Film, Finish, Hop, LEAP, PER_FRAME, Sound, lockupMascot, type Pt } from './Demo';
import { Montage } from './Montage';
import { B, LONG_AUDIO_START_SEC, LONG_CAPTIONS, LONG_CUES, LONG_END, LONG_SHIFT, P, SK } from './timeline';

export { LONG_DEMO } from './timeline';

const LOCKUP_END = LONG_END - LONG_SHIFT;
const CARD = { left: 110, top: 440, w: 1060, font: 23, row: 34, head: 54, padTop: 16, padBottom: 18, radius: 22 };
const CARD_CHARS = Math.floor((CARD.w - 64) / (CARD.font * 0.6));

// The "When to use it" list, from its heading to the navigator.mediaDevices line,
// soft-wrapped the way an editor would.
const whenToUse = (skill: string) => {
  const lines = skill.split('\n');
  const from = lines.findIndex((l) => l.startsWith('## When to use it'));
  const to = lines.findIndex((l, i) => i > from && l.includes('`navigator.mediaDevices`'));
  if (from < 0 || to < 0) throw new Error('SKILL.md no longer has the "When to use it" list this chapter quotes');
  const rows: string[] = [];
  for (const line of lines.slice(from, to + 1).filter((l) => l.trim())) {
    const indent = /^\s*(- )?/.exec(line)![0].replace('-', ' ');
    let rest = line;
    let first = true;
    while (rest.length > CARD_CHARS - (first ? 0 : indent.length)) {
      const room = CARD_CHARS - (first ? 0 : indent.length);
      const cut = rest.lastIndexOf(' ', room);
      rows.push((first ? '' : indent) + rest.slice(0, cut));
      rest = rest.slice(cut + 1);
      first = false;
    }
    rows.push((first ? '' : indent) + rest);
  }
  return rows;
};

const cardHeight = (rows: number) => CARD.head + CARD.padTop + rows * CARD.row + CARD.padBottom;

// Rows that name chapter 01's errors, and the cards they become.
const FLYERS = [
  { match: 'Vite:', label: 'VITE · THROUGH A TUNNEL', text: 'Blocked request.', to: { x: 1225, y: 455 }, tilt: -2.5 },
  { match: '`navigator.mediaDevices`', label: 'SAFARI · CHROME', text: 'mediaDevices → undefined', to: { x: 1225, y: 640 }, tilt: 1.8 },
];
const TARGET = { w: 640, h: 150 };

const quad = (a: { x: number; y: number }, c: { x: number; y: number }, e: { x: number; y: number }, t: number) => {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * e.x, y: u * u * a.y + 2 * u * t * c.y + t * t * e.y };
};
const arc = (a: { x: number; y: number }, e: { x: number; y: number }, lift: number) => (t: number): Pt => ({
  ...quad(a, { x: (a.x + e.x) / 2, y: Math.min(a.y, e.y) - lift }, e, t),
  k: 1,
});

const RowText: React.FC<{ text: string }> = ({ text }) => {
  if (/^#+ /.test(text)) return <span style={{ color: '#e06c75', fontWeight: 700 }}>{text}</span>;
  return (
    <>
      {text.split(/(`[^`]*`)/).map((part, i) => (
        <span key={i} style={{ color: part.startsWith('`') ? '#98c379' : '#c9ced8' }}>
          {part}
        </span>
      ))}
    </>
  );
};

// One row lifts, then hops along an arc to its card, growing into it on the way:
// the row's text fades out before the card's fades in, and it lands tilted with
// a small squash.
const Flyer: React.FC<{ b: number; k: number; from: { x: number; y: number }; text: string }> = ({ b, k, from, text }) => {
  const at = SK.rows[k];
  if (b < at) return null;
  const f = FLYERS[k];
  const lift = ramp(b, at, 0.15, EASE.out);
  const u = ramp(b, at + 0.15, 0.9, LEAP);
  const size = ramp(b, at + 0.22, 0.9, LEAP);
  const fromW = CARD.w - 44;
  const p = quad(from, { x: (from.x + f.to.x) / 2, y: Math.min(from.y, f.to.y) - 220 }, f.to, u);
  const land = at + 1.05;
  const squash = b >= land ? 1 - 0.03 * Math.sin(Math.PI * ramp(b, land, 0.25, EASE.linear)) : 1;
  const grow = 1 + 0.02 * lift * (1 - u);
  const rowOp = 1 - ramp(u, 0.08, 0.32, EASE.linear);
  const cardOp = ramp(u, 0.5, 0.3, EASE.linear);
  return (
    <div
      style={{
        position: 'absolute', left: p.x, top: p.y, width: mix(fromW, TARGET.w, size), height: mix(CARD.row, TARGET.h, size), boxSizing: 'border-box',
        borderRadius: mix(8, 18, size), background: alpha('#1a1e26', Math.max(lift * 0.9, size)), overflow: 'hidden',
        boxShadow: `inset 0 0 0 1.5px ${alpha(C.accent, 0.35 * size)}, 0 ${(10 + 30 * lift).toFixed(1)}px ${(30 + 50 * size).toFixed(1)}px rgba(0,0,0,0.55)`,
        transform: `rotate(${(f.tilt * size).toFixed(2)}deg) scale(${grow.toFixed(4)}, ${(squash * grow).toFixed(4)})`, transformOrigin: 'center bottom',
      }}
    >
      <div style={{ position: 'absolute', left: 10, top: 0, lineHeight: `${CARD.row}px`, fontFamily: mono, fontSize: CARD.font, whiteSpace: 'pre', opacity: rowOp }}>
        <RowText text={text.trimStart()} />
      </div>
      <div style={{ position: 'absolute', left: 30, top: 26, opacity: cardOp, whiteSpace: 'nowrap' }}>
        <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.12em', color: C.accent }}>{f.label}</div>
        <div style={{ marginTop: 16, fontFamily: mono, fontWeight: 700, fontSize: 38, color: C.ink }}>{f.text}</div>
      </div>
    </div>
  );
};

// The card's outline is drawn edge by edge under the bunny's hops; when it
// closes it flashes white and thick for a moment, then the card fills in.
const SkillCard: React.FC<{ b: number; rows: string[] }> = ({ b, rows }) => {
  if (b < SK.corners[0]) return null;
  const H = cardHeight(rows.length);
  const edges = [CARD.w, H, CARD.w, H];
  const drawn = edges.reduce((sum, len, i) => sum + len * ramp(b, SK.corners[i], SK.corners[i + 1] - SK.corners[i], LEAP), 0);
  const closed = SK.corners[4];
  const flash = ramp(b, closed, 0.05, EASE.linear) * (1 - ramp(b, closed + 0.05, 0.3, EASE.out));
  const strokeOut = ramp(b, closed + 0.25, 0.4, EASE.out);
  const fill = ramp(b, closed, 0.5, EASE.out);
  const flying = FLYERS.map((f) => rows.findIndex((r) => r.includes(f.match)));
  return (
    <>
      <div
        style={{
          position: 'absolute', left: CARD.left, top: CARD.top, width: CARD.w, height: H, borderRadius: CARD.radius, overflow: 'hidden',
          background: `linear-gradient(180deg, ${alpha('#181b22', fill)} 0%, ${alpha('#111318', fill)} 100%)`,
          boxShadow: `inset 0 0 0 1.5px ${alpha('#cfe9ff', 0.1 * fill)}, 0 ${(40 * fill).toFixed(1)}px 100px rgba(0,0,0,${(0.6 * fill).toFixed(3)})`,
        }}
      >
        <div style={{ height: CARD.head, display: 'flex', alignItems: 'center', padding: '0 28px', boxSizing: 'border-box', fontFamily: mono, fontSize: 24, color: C.ink2, borderBottom: `1.5px solid ${alpha('#cfe9ff', 0.07 * fill)}`, opacity: fill }}>
          skills/devhop/SKILL.md
        </div>
        <div style={{ padding: `${CARD.padTop}px 32px 0`, fontFamily: mono, fontSize: CARD.font, lineHeight: `${CARD.row}px`, whiteSpace: 'pre' }}>
          {rows.map((r, i) => {
            const p = ramp(b, closed + 0.1 + i * 0.06, 0.5, EASE.out);
            const gone = flying.indexOf(i);
            const slot = gone >= 0 ? ramp(b, SK.rows[gone] + 0.15, 0.3, EASE.out) : 0;
            return (
              <div key={i} style={{ position: 'relative', height: CARD.row }}>
                {slot > 0 ? <div style={{ position: 'absolute', left: -10, right: 10, top: 2, bottom: 2, borderRadius: 8, border: `2px dashed ${alpha('#cfe9ff', 0.25 * slot)}` }} /> : null}
                <div style={{ opacity: p * (gone >= 0 && b >= SK.rows[gone] ? 0 : 1), transform: `translateY(${((1 - p) * 14).toFixed(1)}px)`, filter: p < 0.999 ? `blur(${((1 - p) * 6).toFixed(2)}px)` : undefined }}>
                  <RowText text={r} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {strokeOut < 1 ? (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 1 - strokeOut }}>
          <rect
            x={CARD.left} y={CARD.top} width={CARD.w} height={H} rx={CARD.radius} pathLength={1} fill="none"
            stroke={flash > 0.02 ? '#ffffff' : C.accent} strokeWidth={mix(5, 10, flash)} strokeDasharray="1"
            strokeDashoffset={1 - drawn / (2 * (CARD.w + H))}
            style={{ filter: `drop-shadow(0 0 ${(8 + 14 * flash).toFixed(1)}px ${alpha(C.accent, 0.8)})` }}
          />
        </svg>
      ) : null}
      {flying.map((idx, k) => (idx >= 0 ? <Flyer key={k} b={b} k={k} from={{ x: CARD.left + 22, y: CARD.top + CARD.head + CARD.padTop + idx * CARD.row }} text={rows[idx]} /> : null))}
    </>
  );
};

// The bunny's tour: off the logo to the card's corner, round the four corners,
// and home again.
const Tour: React.FC<{ b: number; rows: number; lift: number }> = ({ b, rows, lift }) => {
  const H = cardHeight(rows);
  const corners = [
    { x: CARD.left, y: CARD.top },
    { x: CARD.left + CARD.w, y: CARD.top },
    { x: CARD.left + CARD.w, y: CARD.top + H },
    { x: CARD.left, y: CARD.top + H },
    { x: CARD.left, y: CARD.top },
  ];
  const home = lockupMascot(b - LONG_SHIFT, LOCKUP_END, lift);
  const SIZE = 120;
  return (
    <>
      <Hop id="leave" pts={arc(home, corners[0], 160)} b={b} out={SK.leave[0]} start={SK.leave[0]} end={SK.leave[1]} size={SIZE} handoff />
      {corners.slice(1).map((c, i) => (
        <Hop key={i} id={`edge${i}`} pts={arc(corners[i], c, i % 2 ? 70 : 110)} b={b} out={SK.corners[i]} start={SK.corners[i]} end={SK.corners[i + 1]} size={SIZE} handoff={i < 3} keep={i === 3 && b < SK.home[0]} />
      ))}
      {b >= SK.home[0] ? <Hop id="home" pts={arc(corners[0], home, 180)} b={b} out={SK.home[0]} start={SK.home[0]} end={SK.home[1]} size={SIZE} handoff /> : null}
    </>
  );
};

// Grain-dissolve: one burst curve drives turbulence, displacement and blur, the
// noise reseeds every few frames so the grain boils, and the whole card shrinks
// into the pill while it boils.
const PILL = { x: 960, y: 668 }; // where the pill sits once the lockup is back down
const Boil: React.FC<{ b: number; children: React.ReactNode }> = ({ b, children }) => {
  if (b < SK.boil) return <>{children}</>;
  const burst = ramp(b, SK.boil, 0.6, EASE.out);
  const pull = ramp(b, SK.boil + 0.45, SK.stamp - SK.boil - 0.45, bezier(0.65, 0, 0.35, 1));
  const fade = ramp(b, SK.stamp - 0.35, 0.35, EASE.linear);
  if (fade >= 1) return null;
  const cx = (CARD.left + FLYERS[0].to.x + TARGET.w) / 2;
  const cy = 560;
  const seed = Math.floor(b * 12);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - fade, transformOrigin: `${cx}px ${cy}px`, transform: `translate(${((PILL.x - cx) * pull).toFixed(1)}px,${((PILL.y - cy) * pull).toFixed(1)}px) scale(${mix(1, 0.06, pull).toFixed(4)})`, filter: 'url(#boil)' }}>
      <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
        <filter id="boil" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={(0.9 + 0.4 * burst).toFixed(3)} numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={(52 * burst).toFixed(2)} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={(1.1 * burst).toFixed(2)} />
        </filter>
      </svg>
      {children}
    </div>
  );
};

export const DevhopLong: React.FC<{ bgm?: boolean }> = ({ bgm = true }) => {
  const frame = useCurrentFrame();
  const metaRaw = useTextAsset('devhop/meta.json');
  const ansi = useTextAsset('devhop/terminal.ansi');
  const vite = useTextAsset('devhop/vite.ansi');
  const skill = useTextAsset('devhop/SKILL.md');
  const commitAnsi = useTextAsset('devhop/git-commit.ansi');
  const pushAnsi = useTextAsset('devhop/git-push.ansi');
  const hostsRaw = useTextAsset('devhop/hostnames.json');
  if (!metaRaw || !ansi || !vite || !skill || !commitAnsi || !pushAnsi || !hostsRaw) return null;
  const meta = JSON.parse(metaRaw);
  const b = frame * PER_FRAME;
  const lift = ramp(b, SK.lift, 1, EASE.smooth) * (1 - ramp(b, SK.settle[0], SK.settle[1], EASE.smooth));
  const rows = whenToUse(skill);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {b < P.cut ? (
        <Montage b={b} meta={meta} vite={vite} commitAnsi={commitAnsi} pushAnsi={pushAnsi} hosts={JSON.parse(hostsRaw)} />
      ) : (
        <Film
          b={b - LONG_SHIFT} meta={meta} ansi={ansi} end={LOCKUP_END} lift={lift} long
          away={[SK.leave[0] - LONG_SHIFT, SK.home[1] - LONG_SHIFT]} stamp={SK.stamp - LONG_SHIFT}
        />
      )}
      <Boil b={b}>
        <SkillCard b={b} rows={rows} />
      </Boil>
      {b >= SK.leave[0] && b < SK.home[1] + 0.5 ? <Tour b={b} rows={rows.length} lift={lift} /> : null}
      <Captions b={b} list={LONG_CAPTIONS} />
      <Finish />
      <Sound bgm={bgm} cues={LONG_CUES} startSec={LONG_AUDIO_START_SEC} drop={B.enter + LONG_SHIFT} end={LONG_END} />
    </AbsoluteFill>
  );
};
