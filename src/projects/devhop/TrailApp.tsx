// The demo app (fixtures/devhop/app) redrawn from its own code, so each piece can
// move: App.jsx's layout and themes.js's colors, in the 390 × 844 CSS px viewport
// the captures used. The browser chrome follows Noor's iPhone screenshots
// (captures/devhop/iphone/): Safari's floating bottom bar, Chrome's dark top bar.
// The iOS microphone prompt is drawn from memory of the system dialog.
//
// Assemble-then-type-flyin (video-shotcraft demos/effects/assemble-then-type-flyin,
// Apache-2.0, see NOTICE): the page's parts fly in without text first, then the
// text flies in letter by letter from 3D space, headline first.
import React from 'react';
import { themes } from '../../../fixtures/devhop/app/src/themes.js';
import { mono, sans } from '../../lib/fonts';
import { EASE, mix, ramp, rand } from '../../lib/motion';

export const VIEW_W = 390;
export const VIEW_H = 844;
export type ThemeName = keyof typeof themes;
type Theme = (typeof themes)[ThemeName];

// Copied from App.jsx; keep in sync.
const TRAILS = [
  { name: 'Lakeside loop', km: 6.4, time: '1 h 40 min' },
  { name: 'Ridge overlook', km: 9.1, time: '2 h 50 min' },
  { name: 'Old mill path', km: 3.2, time: '55 min' },
];
export const TYPE_ERROR = "TypeError: undefined is not an object (evaluating 'navigator.mediaDevices.getUserMedia')";
export type LogLine = { text: string; ok?: boolean; at: number };

// Where things sit in the page, in CSS px from the top of the page (below any
// browser bar), for taps and landings.
const HERO_H = 230;
export const PAGE = {
  voiceButton: { x: VIEW_W / 2, y: HERO_H + 22 + 17 + 6 + 37 + 18 + 26 },
  logTop: HERO_H + 22 + 17 + 6 + 37 + 18 + 52,
  logLine: 8 + 3 * 17, // one TypeError wraps to three lines at 13 px
};

// ───────── assemble ─────────
const rnd = (seed: number, k: number) => rand(Math.floor(seed * 7919 + k * 104729)) * 2 - 1;
const SKELETON_STEP = 0.07; // beats between parts
const SKELETON_DUR = 0.5;
const TEXT_AT = 0.95; // beats after arrival, once the parts have landed
const CHAR_STEP = 0.01;
const CHAR_DUR = 0.4;

// Each part flies in from its own direction and lands with an overshoot.
const Part: React.FC<{ b: number; arrive?: number; i: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ b, arrive, i, style, children }) => {
  if (arrive === undefined) return <div style={style}>{children}</div>;
  const p = ramp(b, arrive + i * SKELETON_STEP, SKELETON_DUR, EASE.overshoot);
  const r = ramp(b, arrive + i * SKELETON_STEP + 0.07, SKELETON_DUR, EASE.out);
  if (p <= 0) return <div style={{ ...style, visibility: 'hidden' }}>{children}</div>;
  const dx = rnd(i, 1) * 180;
  const dy = 140 + rnd(i, 2) * 90;
  const rot = rnd(i, 3) * 7;
  return (
    <div style={{ ...style, opacity: Math.min(1, p * 2.5), transform: p >= 1 && r >= 1 ? undefined : `translate(${((1 - p) * dx).toFixed(2)}px,${((1 - p) * dy).toFixed(2)}px) rotate(${((1 - r) * rot).toFixed(2)}deg)` }}>
      {children}
    </div>
  );
};

// Letters fly in from 3D space: each has its own seeded offset, depth and spin.
// `order` sets when the block starts; headlines go first.
const Fly: React.FC<{ b: number; arrive?: number; order: number; text: string }> = ({ b, arrive, order, text }) => {
  if (arrive === undefined) return <>{text}</>;
  const start = arrive + TEXT_AT + order * 0.06;
  return (
    <>
      {[...text].map((ch, i) => {
        const a = ramp(b, start + i * CHAR_STEP, CHAR_DUR, EASE.snappy);
        const seed = order * 131 + i;
        const glyph = ch === ' ' ? ' ' : ch;
        if (a >= 1) return <span key={i} style={{ display: 'inline-block' }}>{glyph}</span>;
        const u = 1 - a;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block', opacity: a <= 0 ? 0 : Math.min(1, a * 3),
              transform: `perspective(900px) translate3d(${(rnd(seed, 1) * 120 * u).toFixed(1)}px,${(rnd(seed, 2) * 90 * u).toFixed(1)}px,${(-mix(120, 420, (rnd(seed, 3) + 1) / 2) * u).toFixed(1)}px) rotateX(${(rnd(seed, 4) * 170 * u).toFixed(1)}deg) rotateY(${(rnd(seed, 5) * 190 * u).toFixed(1)}deg) rotateZ(${(rnd(seed, 6) * 120 * u).toFixed(1)}deg)`,
              filter: u > 0.05 ? `blur(${(u * 3).toFixed(2)}px)` : undefined,
            }}
          >
            {glyph}
          </span>
        );
      })}
    </>
  );
};

const Hero: React.FC<{ t: Theme; night: boolean }> = ({ t, night }) => (
  <svg viewBox="0 0 390 230" style={{ display: 'block', width: '100%' }}>
    <defs>
      <linearGradient id={`sky-${night ? 'n' : 'd'}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={t.sky[0]} />
        <stop offset="1" stopColor={t.sky[1]} />
      </linearGradient>
    </defs>
    <rect width="390" height="230" fill={`url(#sky-${night ? 'n' : 'd'})`} />
    <circle cx="300" cy="70" r="34" fill={t.orb} />
    {night ? [[40, 40], [90, 80], [150, 30], [210, 60], [350, 140], [250, 110]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2" fill="#fff" opacity="0.8" />) : null}
    <path d="M0 170 Q90 110 180 160 T390 140 V230 H0 Z" fill={t.hills[0]} />
    <path d="M0 200 Q120 150 230 190 T390 180 V230 H0 Z" fill={t.hills[1]} />
  </svg>
);

// The page itself. `arrive` assembles it from that beat; `log` lines appear at
// their beats under the Voice note button.
export const TrailPage: React.FC<{ b: number; theme: ThemeName; arrive?: number; log?: LogLine[] }> = ({ b, theme, arrive, log = [] }) => {
  const t = themes[theme];
  const night = theme === 'night';
  const shown = log.filter((l) => b >= l.at);
  return (
    <div style={{ width: VIEW_W, minHeight: VIEW_H, fontFamily: sans, background: arrive === undefined || b >= arrive ? t.bg : 'transparent', color: t.ink }}>
      <Part b={b} arrive={arrive} i={0}>
        <Hero t={t} night={night} />
      </Part>
      <div style={{ padding: '22px 20px 28px' }}>
        <Part b={b} arrive={arrive} i={1} style={{ margin: 0, color: t.accent, fontWeight: 700, fontSize: 14, letterSpacing: 0.6, height: 17 }}>
          <Fly b={b} arrive={arrive} order={2} text={t.label} />
        </Part>
        <Part b={b} arrive={arrive} i={2} style={{ margin: '6px 0 18px', fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>
          <Fly b={b} arrive={arrive} order={0} text={t.title} />
        </Part>
        <Part b={b} arrive={arrive} i={3} style={{ padding: '14px 0', border: `2px solid ${t.accent}`, borderRadius: 14, color: t.accent, fontSize: 17, fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }}>
          <Fly b={b} arrive={arrive} order={1} text="🎙 Voice note" />
        </Part>
        <div style={{ marginBottom: 18 }}>
          {shown.map((l, i) => {
            const p = ramp(b, l.at, 0.25, EASE.snappy);
            return (
              <p key={i} style={{ margin: '8px 0 0', fontFamily: mono, fontSize: 13, lineHeight: '17px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: l.ok ? '#16a34a' : '#dc2626', opacity: p, transform: `translateY(${((1 - p) * 6).toFixed(1)}px)` }}>
                {l.text}
              </p>
            );
          })}
        </div>
        {TRAILS.map((trail, i) => (
          <Part key={trail.name} b={b} arrive={arrive} i={4 + i} style={{ background: t.card, borderRadius: 16, padding: '15px 18px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,.12)' }}>
            <div style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              <Fly b={b} arrive={arrive} order={3 + i} text={trail.name} />
            </div>
            <div style={{ margin: '4px 0 0', color: t.muted, fontSize: 15 }}>
              <Fly b={b} arrive={arrive} order={6 + i} text={`${trail.km} km · ${trail.time}`} />
            </div>
          </Part>
        ))}
        <Part b={b} arrive={arrive} i={7} style={{ marginTop: 8, padding: '16px 0', borderRadius: 14, background: t.accent, color: night ? '#1a1200' : '#fff', fontSize: 17, fontWeight: 700, textAlign: 'center' }}>
          <Fly b={b} arrive={arrive} order={9} text="Start route" />
        </Part>
      </div>
    </div>
  );
};

// ───────── browser chrome ─────────
const STATUS_H = 54;

const StatusBar: React.FC<{ dark?: boolean; time: string }> = ({ dark, time }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: STATUS_H, display: 'flex', alignItems: 'center', padding: '0 34px 0 40px', fontFamily: sans, fontWeight: 600, fontSize: 17, color: dark ? '#fff' : '#000', zIndex: 2 }}>
    {time}
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="18" height="12" viewBox="0 0 18 12">{[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="1" fill="currentColor" opacity={i === 3 ? 0.35 : 1} />)}</svg>
      <svg width="17" height="12" viewBox="0 0 17 12"><path d="M8.5 11.5 5.6 8.6a4.1 4.1 0 0 1 5.8 0zM3.5 6.5a7.1 7.1 0 0 1 10 0l1.6-1.6a9.4 9.4 0 0 0-13.2 0zM.4 3.4a11.5 11.5 0 0 1 16.2 0L17 3A12 12 0 0 0 0 3z" fill="currentColor" /></svg>
      <div style={{ width: 26, height: 13, borderRadius: 4, border: '1.5px solid currentColor', opacity: 0.9, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 1.5, right: 6, borderRadius: 2, background: 'currentColor' }} />
      </div>
    </div>
  </div>
);

// The content scrolls under a status bar; `top` is how far down the page starts.
const Viewport: React.FC<{ top: number; bottom: number; scroll?: number; children: React.ReactNode }> = ({ top, bottom, scroll = 0, children }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top, bottom, overflow: 'hidden' }}>
    <div style={{ transform: scroll ? `translateY(${(-scroll).toFixed(1)}px)` : undefined }}>{children}</div>
  </div>
);

export const SAFARI_TOP = STATUS_H;
export const CHROME_TOP = STATUS_H + 62;

// Safari, iOS 26: the page runs under the status bar, and a floating pill at the
// bottom carries the address. Plain http says Not Secure.
export const Safari: React.FC<{ host: string; secure: boolean; scroll?: number; time?: string; children: React.ReactNode }> = ({ host, secure, scroll, time = '12:22', children }) => (
  <div style={{ position: 'absolute', inset: 0, width: VIEW_W, height: VIEW_H, background: '#fafafa', overflow: 'hidden' }}>
    <Viewport top={SAFARI_TOP} bottom={0} scroll={scroll}>{children}</Viewport>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: STATUS_H, background: 'rgba(250,250,250,0.92)' }} />
    <StatusBar time={time} />
    <div style={{ position: 'absolute', left: 16, right: 16, bottom: 22, height: 50, display: 'flex', alignItems: 'center', gap: 8, fontFamily: sans }}>
      <div style={{ width: 46, height: 46, borderRadius: 23, background: 'rgba(255,255,255,0.86)', boxShadow: '0 2px 12px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b0b5', fontSize: 22 }}>‹</div>
      <div style={{ flex: 1, height: 46, borderRadius: 23, background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0 14px', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 16, color: '#3a3a3c' }}>
        {secure ? (
          <svg width="11" height="14" viewBox="0 0 11 14" style={{ flexShrink: 0 }}><rect x="1" y="6" width="9" height="7.5" rx="1.6" fill="#3a3a3c" /><path d="M3 6V4.2a2.5 2.5 0 0 1 5 0V6" stroke="#3a3a3c" strokeWidth="1.5" fill="none" /></svg>
        ) : (
          <span style={{ color: '#6e6e73' }}>Not Secure –</span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{host}</span>
      </div>
      <div style={{ width: 46, height: 46, borderRadius: 23, background: 'rgba(255,255,255,0.86)', boxShadow: '0 2px 12px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3c', fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>···</div>
    </div>
  </div>
);

// Chrome on iOS: a dark top bar with the address in a rounded field, and a
// warning sign for plain http.
export const Chrome: React.FC<{ host: string; secure: boolean; scroll?: number; time?: string; children: React.ReactNode }> = ({ host, secure, scroll, time = '16:37', children }) => (
  <div style={{ position: 'absolute', inset: 0, width: VIEW_W, height: VIEW_H, background: '#2b2b2e', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: CHROME_TOP, bottom: 72, borderRadius: '0 0 22px 22px', overflow: 'hidden', background: '#fafafa' }}>
      <Viewport top={0} bottom={0} scroll={scroll}>{children}</Viewport>
    </div>
    <StatusBar dark time={time} />
    <div style={{ position: 'absolute', top: STATUS_H + 6, left: 0, right: 0, height: 48, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', fontFamily: sans, color: '#fff' }}>
      <span style={{ fontSize: 24, width: 26 }}>←</span>
      <div style={{ flex: 1, height: 44, borderRadius: 22, background: '#48484c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 16, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 13 }}>{secure ? '🔒' : '⚠'}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{host}</span>
      </div>
      <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>···</span>
    </div>
  </div>
);

// iOS asks before a page gets the microphone. `p` 0–1 brings it in; `allow`
// 0–1 presses Allow.
export const MicPrompt: React.FC<{ host: string; p: number; allow: number }> = ({ host, p, allow }) => {
  if (p <= 0) return null;
  const gone = ramp(allow, 0.4, 0.6, EASE.out);
  return (
    <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${(0.28 * p * (1 - gone)).toFixed(3)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
      <div style={{ width: 270, borderRadius: 14, overflow: 'hidden', background: 'rgba(242,242,247,0.97)', textAlign: 'center', opacity: p * (1 - gone), transform: `scale(${mix(1.15, 1, p).toFixed(4)})` }}>
        <div style={{ padding: '19px 16px 18px' }}>
          <div style={{ fontSize: 17, fontWeight: 600, lineHeight: '22px', color: '#000', overflowWrap: 'anywhere' }}>“{host}” Would Like to Access the Microphone</div>
        </div>
        <div style={{ display: 'flex', borderTop: '0.5px solid rgba(60,60,67,0.3)', fontSize: 17, color: '#007aff' }}>
          <div style={{ flex: 1, padding: '11px 0', borderRight: '0.5px solid rgba(60,60,67,0.3)' }}>Don’t Allow</div>
          <div style={{ flex: 1, padding: '11px 0', fontWeight: 600, background: `rgba(0,0,0,${(0.08 * Math.sin(Math.PI * Math.min(1, allow * 2.5))).toFixed(3)})` }}>Allow</div>
        </div>
      </div>
    </div>
  );
};
