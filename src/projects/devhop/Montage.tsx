// The long cut's problem chapter. Hard cuts on the downbeat, one slow push per
// shot, until the Chrome phone; from there one camera rides through the
// workaround (terminal-3d). Captures: Chrome on localhost is Noor's iPhone
// screenshot; the Vite banner, block page, config edit, git output and tunnel
// hostnames come from fixtures/devhop/; the mic page is the demo app drawn from
// its code (TrailApp.tsx), in browser chrome drawn after the iPhone screenshots.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { lineText, parseAnsi } from '../../lib/ansi';
import { display, mono } from '../../lib/fonts';
import { EASE, alpha, bezier, mix, ramp, rand } from '../../lib/motion';
import { Phone } from '../../lib/Phone';
import { TerminalLines } from '../../lib/Terminal';
import { C, rawHostOf, type Meta } from './Demo';
import { COMMIT, GLITCH, P, PUSH, RIDE, commitBeat, commitEnter, pushBeat, pushEnter, stackSteps } from './timeline';
import { CHROME_TOP, Chrome, PAGE, SAFARI_TOP, Safari, TYPE_ERROR, TrailPage, VIEW_W } from './TrailApp';

const SHOT = 4; // beats

const SHOT_W = 1170; // Noor's screenshots, 1170 × 2532
const SHOT_H = 2532;
const TAILNET_HOST = '100.112.233.33:3000'; // the address in Noor's screenshots, on port 3000

const PHONE_W = 760;
const PHONE_LEFT = 1060;
const PHONE_TOP = 70;
const bezel = Math.round(PHONE_W * 0.035);
const SCREEN_W = PHONE_W - bezel * 2;
const px = SCREEN_W / SHOT_W; // screen px per screenshot px
const css = SCREEN_W / VIEW_W; // screen px per page CSS px

// One move per shot: a slow push with a little yaw, from the cut to the next.
const Shot: React.FC<{ b: number; at: number; children: React.ReactNode }> = ({ b, at, children }) => {
  const t = Math.min(1, Math.max(0, (b - at) / SHOT));
  return (
    <AbsoluteFill style={{ perspective: 2400 }}>
      <AbsoluteFill style={{ transform: `rotateY(${mix(-3, -1.2, t).toFixed(3)}deg) scale(${mix(1, 1.04, t).toFixed(4)})`, transformOrigin: '60% 45%' }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Backlight: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div
    style={{
      position: 'absolute', left: x - 900, top: y - 650, width: 1800, height: 1300, borderRadius: '50%',
      background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${alpha('#9fdcff', 0.16)} 0%, ${alpha('#9fdcff', 0.05)} 45%, ${alpha('#9fdcff', 0)} 72%)`,
    }}
  />
);

// The key line of each screenshot, pulled out large beside the phone, with the
// browser it came from. The label rolls when only the browser changes.
const Callout: React.FC<{ b: number; at: number; label: string; prev?: string; text: string[] }> = ({ b, at, label, prev, text }) => {
  const p = ramp(b, at + 0.25, 0.8, EASE.out);
  const roll = prev ? ramp(b, at + 0.25, 0.6, EASE.snappy) : 1;
  const lineIn = prev ? 1 : p;
  return (
    <div style={{ position: 'absolute', left: 120, top: 230, width: 900 }}>
      <div style={{ position: 'relative', height: 44, overflow: 'hidden', fontFamily: mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.12em', color: C.accent }}>
        {prev ? <div style={{ position: 'absolute', top: -roll * 44, opacity: 1 - roll }}>{prev}</div> : null}
        <div style={{ position: 'absolute', top: (1 - roll) * 44, opacity: prev ? roll : p }}>{label}</div>
      </div>
      <div style={{ marginTop: 26, fontFamily: mono, fontWeight: 700, fontSize: 56, lineHeight: 1.3, color: C.ink }}>
        {text.map((t, i) => {
          const q = prev ? 1 : ramp(b, at + 0.25 + i * 0.25, 0.8, EASE.out);
          return (
            <div key={i} style={{ whiteSpace: 'pre', opacity: q * lineIn, transform: `translateY(${((1 - q) * 22).toFixed(1)}px)`, filter: q < 0.999 ? `blur(${((1 - q) * 7).toFixed(2)}px)` : undefined }}>
              {t}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PhoneAt: React.FC<{ y?: number; children: React.ReactNode }> = ({ y = 0, children }) => (
  <div style={{ position: 'absolute', left: PHONE_LEFT, top: PHONE_TOP + y }}>
    <Phone width={PHONE_W} aspect={SHOT_H / SHOT_W}>
      {children}
    </Phone>
  </div>
);

const Screenshot: React.FC<{ src: string }> = ({ src }) => (
  <Img src={staticFile(`devhop/iphone/${src}`)} style={{ position: 'absolute', inset: 0, width: '100%' }} />
);

// The drawn page, at the phone's screen size.
const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: VIEW_W, height: (SHOT_H * px) / css, transform: `scale(${css.toFixed(5)})`, transformOrigin: '0 0' }}>{children}</div>
);

// A tap ring at a point in page CSS px.
const Tap: React.FC<{ b: number; at: number; x: number; y: number }> = ({ b, at, x, y }) => {
  const t = b - at;
  if (t < 0 || t > 0.6) return null;
  const r = mix(30, 90, ramp(b, at, 0.6, EASE.out));
  return (
    <div
      style={{
        position: 'absolute', left: x * css - r, top: y * css - r, width: r * 2, height: r * 2, borderRadius: '50%',
        background: alpha(C.accent, 0.25 * (1 - t / 0.6)), border: `4px solid ${alpha(C.accent, 0.9 * (1 - t / 0.6))}`, boxSizing: 'border-box',
      }}
    />
  );
};

// ───────── windows ─────────
const Window: React.FC<{ title: string; dirty?: boolean; width: number; top: number; children: React.ReactNode }> = ({ title, dirty, width, top, children }) => (
  <div
    style={{
      position: 'absolute', left: (1920 - width) / 2, top, width, borderRadius: 26, overflow: 'hidden',
      background: 'linear-gradient(180deg, #1a1e26 0%, #12151b 40%, #0d0f13 100%)',
      boxShadow: `inset 0 0 0 1.5px ${alpha('#cfe9ff', 0.1)}, 0 60px 140px rgba(0,0,0,.7)`,
    }}
  >
    <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 26px', borderBottom: `1.5px solid ${alpha('#cfe9ff', 0.07)}` }}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.85 }} />
      ))}
      <div style={{ marginLeft: 'auto', marginRight: 'auto', fontFamily: mono, fontSize: 22, color: C.ink2 }}>
        {title}
        <span style={{ marginLeft: 12, color: C.ink, opacity: dirty ? 1 : 0 }}>●</span>
      </div>
    </div>
    <div style={{ padding: 40 }}>{children}</div>
  </div>
);

const Caret: React.FC<{ on: boolean }> = ({ on }) => (
  <span style={{ display: 'inline-block', width: '0.58em', height: '1.05em', marginLeft: 4, verticalAlign: '-0.16em', borderRadius: 4, background: C.accent, opacity: on ? 0.95 : 0 }} />
);

const Prompt: React.FC<{ text: string; caret?: boolean }> = ({ text, caret }) => (
  <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 52, lineHeight: '76px', color: C.ink, whiteSpace: 'pre' }}>
    <span style={{ color: C.accent }}>❯ </span>
    {text}
    {caret !== undefined ? <Caret on={caret} /> : null}
  </div>
);

const BannerShot: React.FC<{ b: number; vite: string; port: number }> = ({ b, vite, port }) => {
  const all = parseAnsi(vite);
  const lines = all.slice(all.findIndex((l) => lineText(l).includes('VITE'))).filter((l, i, a) => i < a.length - 1 || lineText(l).trim());
  const local = lines.findIndex((l) => lineText(l).includes('Local'));
  const glow = ramp(b, P.banner + 1.75, 0.5, EASE.out);
  return (
    <>
      <Backlight x={960} y={420} />
      <Window title="~/trailhead — zsh" width={1640} top={150}>
        <Prompt text={`npx vite --port ${port}`} />
        <div style={{ height: 20 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: -14, right: 420, top: local * 66 - 4, height: 74, borderRadius: 12, background: alpha(C.accent, 0.12 * glow), border: `2px solid ${alpha(C.accent, 0.6 * glow)}` }} />
          <TerminalLines lines={lines} font={46} row={66} qrModule={1} rowOpacity={(i) => ramp(b, P.banner + 0.5 + i * 0.25, 0.2, EASE.snappy)} />
        </div>
      </Window>
    </>
  );
};

// The edit Vite's error asks for, pasted in (⌘V) and saved (⌘S).
const Keys: React.FC<{ b: number; at: number; keys: string[] }> = ({ b, at, keys }) => {
  const k = ramp(b, at - 0.08, 0.45, EASE.overshoot) * (1 - ramp(b, at + 1.2, 0.4, EASE.out));
  if (k < 0.01) return null;
  return (
    <div style={{ position: 'absolute', right: 140, top: 730, display: 'flex', gap: 14, transform: `scale(${k.toFixed(3)})`, transformOrigin: 'right top', fontFamily: display, fontWeight: 800, fontSize: 50, color: C.bg }}>
      {keys.map((key) => (
        <div key={key} style={{ width: 100, height: 100, borderRadius: 22, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 10px 30px ${alpha(C.accent, 0.4)}` }}>
          {key}
        </div>
      ))}
    </div>
  );
};

const KEYWORDS = /^(import|from|export|default)$/;
const ConfigLine: React.FC<{ code: string; host: string }> = ({ code, host }) => (
  <>
    {code.split(/('[^']*')/).map((part, i) => (
      <span key={i} style={{ color: /^'/.test(part) ? (part.includes(host) ? '#ffd68a' : '#98c379') : undefined }}>
        {/^'/.test(part)
          ? part
          : part.split(/\b/).map((w, j) => (
              <span key={j} style={{ color: KEYWORDS.test(w) ? '#c678dd' : w === 'server' || w === 'allowedHosts' || w === 'plugins' ? '#e06c75' : '#c9ced8' }}>
                {w}
              </span>
            ))}
      </span>
    ))}
  </>
);

const ConfigShot: React.FC<{ b: number; meta: Meta }> = ({ b, meta }) => {
  const host = rawHostOf(meta);
  const pasted = b >= P.paste;
  const lines = (pasted ? meta.configAfter : meta.configBefore).replace(/\n$/, '').split('\n');
  const before = meta.configBefore.replace(/\n$/, '').split('\n');
  const added = (i: number) => pasted && !before.includes(lines[i]);
  const wipe = ramp(b, P.paste, 0.5, EASE.out);
  const flash = 1 - ramp(b, P.paste + 0.5, 1.5, EASE.out);
  return (
    <>
      <Backlight x={960} y={400} />
      <Window title="vite.config.js" dirty={pasted && b < P.save} width={1680} top={150}>
        <div style={{ fontFamily: mono, fontSize: 32, lineHeight: '56px' }}>
          {lines.map((code, i) => (
            <div key={i} style={{ display: 'flex', height: 56, whiteSpace: 'pre', background: added(i) ? alpha('#98c379', 0.06 + 0.14 * flash) : undefined, clipPath: added(i) ? `inset(0 ${((1 - wipe) * 100).toFixed(1)}% 0 0)` : undefined }}>
              <span style={{ width: 60, color: '#4b5263', flexShrink: 0 }}>{i + 1}</span>
              <ConfigLine code={code} host={host} />
            </div>
          ))}
        </div>
      </Window>
      <Keys b={b} at={P.paste} keys={['⌘', 'V']} />
      <Keys b={b} at={P.save} keys={['⌘', 'S']} />
    </>
  );
};

// git's own output, from the throwaway repo in capture-git.mjs. Commit and push
// each print their lines on sixteenths after Enter.
const gitLines = (raw: string) => parseAnsi(raw).filter((l) => lineText(l).trim());

const GitShot: React.FC<{ b: number; commitAnsi: string; pushAnsi: string }> = ({ b, commitAnsi, pushAnsi }) => {
  const c = [...COMMIT].filter((_, i) => b >= commitBeat(i)).length;
  const p = [...PUSH].filter((_, i) => b >= pushBeat(i)).length;
  const blink = Math.floor(b * 2) % 2 === 0;
  const out = (lines: ReturnType<typeof gitLines>, at: number) =>
    b < at ? null : (
      <TerminalLines lines={lines} font={30} row={44} qrModule={1} rowOpacity={(i) => ramp(b, at + 0.1 + i * 0.12, 0.15, EASE.snappy)} />
    );
  return (
    <>
      <Backlight x={960} y={420} />
      <Window title="~/trailhead — zsh" width={1640} top={150}>
        <Prompt text={COMMIT.slice(0, c)} caret={b >= commitEnter ? undefined : c < COMMIT.length || blink} />
        {out(gitLines(commitAnsi), commitEnter)}
        {b >= commitEnter + 0.3 ? <Prompt text={PUSH.slice(0, p)} caret={b >= pushEnter ? undefined : p < PUSH.length || blink} /> : null}
        {out(gitLines(pushAnsi), pushEnter)}
      </Window>
    </>
  );
};

// Glitch-cycle: one fixed-width slot shows each new tunnel's hostname. A
// hostname melts in and out (glitch probability 1 at its ends, a flicker of
// 0.1 mid-way) and the last one settles clean; the same strength shifts the
// row and splits its color.
const KF = [1, 0, 0, 0.1, 0, 0, 1];
const KF_LAST = [1, 0, 0, 0.1, 0, 0, 0];
const POOL = 'abcdefghijklmnopqrstuvwxyz0123456789-';
const strength = (kf: number[], p: number) => {
  const x = Math.min(0.999, Math.max(0, p)) * (kf.length - 1);
  const i = Math.floor(x);
  return mix(kf[i], kf[i + 1], x - i);
};

const GlitchHost: React.FC<{ b: number; hosts: string[]; size: number }> = ({ b, hosts, size }) => {
  const slot = Math.min(hosts.length - 1, Math.max(0, Math.floor((b - GLITCH.at) / GLITCH.slot)));
  const p = (b - GLITCH.at - slot * GLITCH.slot) / GLITCH.slot;
  const last = slot === hosts.length - 1;
  const g = b < GLITCH.at ? 0 : last && p > 1 ? 0 : strength(last ? KF_LAST : KF, p);
  const width = Math.max(...hosts.map((h) => h.length));
  const text = hosts[slot].padEnd(width);
  const bucket = Math.floor(b * 26); // a new roll about every four frames
  const jx = (rand(bucket * 3 + 1) * 2 - 1) * g * 30;
  const jy = (rand(bucket * 3 + 2) * 2 - 1) * g * 8;
  const split = g > 0.04 ? `${(-g * 8).toFixed(1)}px 0 rgba(255,60,90,0.8), ${(g * 8).toFixed(1)}px 0 rgba(80,220,255,0.8)` : undefined;
  return (
    <span style={{ display: 'inline-flex', transform: `translate(${jx.toFixed(1)}px,${jy.toFixed(1)}px)`, textShadow: split }}>
      {[...text].map((ch, i) => {
        const hit = rand(i * 31 + bucket * 17 + slot * 97) < g;
        const glyph = hit ? POOL[Math.floor(rand(i * 13 + bucket * 7) * POOL.length)] : ch;
        return (
          <span key={i} style={{ display: 'inline-block', width: size * 0.6, textAlign: 'center', color: hit ? (rand(i + bucket) < 0.5 ? C.accent : '#ff5c7a') : undefined }}>
            {glyph === ' ' ? '\u00a0' : glyph}
          </span>
        );
      })}
    </span>
  );
};

// The next run: a plain quick tunnel prints a new hostname each time, so the
// one committed to allowedHosts no longer matches. cloudflared's banner text
// is quoted from its output.
const TunnelShot: React.FC<{ b: number; hosts: string[] }> = ({ b, hosts }) => {
  const settled = GLITCH.at + GLITCH.slot * (hosts.length - 1) + GLITCH.slot * 0.7;
  const miss = ramp(b, settled, 0.35, EASE.out);
  return (
    <>
      <Backlight x={960} y={420} />
      <div style={{ position: 'absolute', left: 140, top: 150, fontFamily: mono, fontSize: 30, color: C.ink2, whiteSpace: 'pre' }}>
        <span style={{ color: '#e06c75' }}>allowedHosts</span>: [
        <span style={{ position: 'relative', color: '#ffd68a' }}>
          '{hosts[0]}'
          <span style={{ position: 'absolute', left: 0, right: 0, top: '52%', height: 4, borderRadius: 2, background: '#ff5c7a', transform: `scaleX(${miss.toFixed(3)})`, transformOrigin: 'left' }} />
        </span>
        ]
      </div>
      <Window title="~/trailhead — cloudflared" width={1640} top={240}>
        <Prompt text="cloudflared tunnel --url http://localhost:3000" />
        <div style={{ marginTop: 18, fontFamily: mono, fontSize: 34, lineHeight: '54px', color: C.ink2, whiteSpace: 'pre', opacity: ramp(b, P.tunnel - 0.1, 0.2, EASE.snappy) }}>
          Your quick Tunnel has been created! Visit it at:
        </div>
        <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 42, lineHeight: '64px', color: C.ink, whiteSpace: 'pre', opacity: ramp(b, GLITCH.at - 0.1, 0.1, EASE.snappy) }}>
          https://<GlitchHost b={b} hosts={hosts.slice(1)} size={42} />
        </div>
      </Window>
    </>
  );
};

// ───────── the ride ─────────
// Each station is a full frame placed in space; at a station the camera sees
// it 1:1. Flights bulge back so the neighbours show, and the camera only moves
// left to right.
const STATIONS = [
  { x: 0, z: 0, ry: 0 },
  { x: 2300, z: -300, ry: -8 },
  { x: 4500, z: 150, ry: 6 },
  { x: 6800, z: -200, ry: -6 },
];
const RIDE_PERSP = 2400;
const FLY = bezier(0.62, 0, 0.16, 1);
const rideCam = (b: number) => {
  const at = RIDE.stations;
  let i = 0;
  while (i < at.length - 1 && b >= at[i + 1]) i++;
  const from = STATIONS[i];
  if (i === at.length - 1 || b < at[i + 1] - RIDE.flight) {
    const hold = b - at[i];
    return { x: from.x, z: from.z, ry: from.ry, pull: -hold * 18, yaw: 2 - hold * 0.25 };
  }
  const to = STATIONS[i + 1];
  const u = FLY(ramp(b, at[i + 1] - RIDE.flight, RIDE.flight, EASE.linear));
  const raw = ramp(b, at[i + 1] - RIDE.flight, RIDE.flight, EASE.linear);
  const holdOut = at[i + 1] - RIDE.flight - at[i];
  return {
    x: mix(from.x, to.x, u), z: mix(from.z, to.z, u), ry: mix(from.ry, to.ry, u),
    pull: mix(-holdOut * 18, 0, u) + Math.sin(Math.PI * Math.pow(raw, 0.85)) * 1250,
    yaw: mix(2 - holdOut * 0.25, 2, u),
  };
};

const Ride: React.FC<{ b: number; children: React.ReactNode[] }> = ({ b, children }) => {
  const cam = rideCam(b);
  return (
    <AbsoluteFill style={{ perspective: RIDE_PERSP, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 960, top: 540, transformStyle: 'preserve-3d', transform: `translateZ(${(-cam.pull).toFixed(1)}px) rotateY(${(cam.yaw - cam.ry).toFixed(3)}deg) translate3d(${(-cam.x).toFixed(1)}px,0,${(-cam.z).toFixed(1)}px)` }}>
        {STATIONS.map((st, i) => {
          const d = Math.abs(cam.x - st.x) / 2300;
          const focus = Math.max(0, 1 - d);
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: -960, top: -540, width: 1920, height: 1080, transform: `translate3d(${st.x}px,0,${st.z}px) rotateY(${st.ry}deg)`,
                opacity: 0.35 + 0.65 * focus, filter: focus < 0.97 ? `blur(${((1 - focus) * 4).toFixed(2)}px) brightness(${(0.6 + 0.4 * focus).toFixed(3)})` : undefined,
              }}
            >
              {children[i]}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ───────── the chapter ─────────
export const Montage: React.FC<{ b: number; meta: Meta; vite: string; commitAnsi: string; pushAnsi: string; hosts: string[] }> = ({ b, meta, vite, commitAnsi, pushAnsi, hosts }) => {
  const host = rawHostOf(meta);
  const tapY = PAGE.voiceButton.y + SAFARI_TOP;
  if (b >= P.chrome) {
    const chromeTapY = PAGE.voiceButton.y + CHROME_TOP;
    return (
      <AbsoluteFill style={{ background: C.bg }}>
        <Ride b={b}>
          {[
            <React.Fragment key="chrome">
              <Backlight x={1440} y={560} />
              <Callout b={b} at={P.chrome} label="CHROME · IPHONE" prev="SAFARI · IPHONE" text={['navigator.mediaDevices', '→ undefined']} />
              <PhoneAt>
                <Page>
                  <Chrome host={TAILNET_HOST} secure={false}>
                    <TrailPage b={b} theme="day" log={[{ text: TYPE_ERROR, at: P.chromeTap }]} />
                  </Chrome>
                </Page>
                <Tap b={b} at={P.chromeTap} x={VIEW_W / 2} y={chromeTapY} />
              </PhoneAt>
            </React.Fragment>,
            <ConfigShot key="config" b={b} meta={meta} />,
            <GitShot key="git" b={b} commitAnsi={commitAnsi} pushAnsi={pushAnsi} />,
            <TunnelShot key="tunnel" b={b} hosts={hosts} />,
          ]}
        </Ride>
      </AbsoluteFill>
    );
  }
  let shot: React.ReactNode;
  if (b < P.localhost) {
    shot = <BannerShot b={b} vite={vite} port={meta.port} />;
  } else if (b < P.blocked) {
    shot = (
      <>
        <Backlight x={1440} y={560} />
        <Callout b={b} at={P.localhost} label="CHROME · IPHONE" text={['localhost is currently', 'unreachable.', 'ERR_CONNECTION_FAILED']} />
        <PhoneAt>
          <Screenshot src="chrome-localhost.jpg" />
        </PhoneAt>
      </>
    );
  } else if (b < P.mic) {
    // Vite's block page through a plain quick tunnel, in Safari with the tunnel's hostname.
    shot = (
      <>
        <Backlight x={1440} y={560} />
        <Callout b={b} at={P.blocked} label="VITE · THROUGH A TUNNEL" text={['Blocked request.', 'This host is not', 'allowed.']} />
        <PhoneAt>
          <Page>
            <Safari host={host} secure>
              <Img src={staticFile('devhop/blocked.png')} style={{ position: 'absolute', top: 0, left: 0, width: VIEW_W }} />
            </Safari>
          </Page>
        </PhoneAt>
      </>
    );
  } else {
    // Each tap adds the same TypeError; the page scrolls to keep the newest in view.
    const taps = [P.tap, ...Array.from({ length: stackSteps }, (_, i) => P.stack[0] + i * 0.25)];
    const shown = taps.filter((at) => b >= at).length;
    const scroll = Math.max(0, PAGE.logTop + shown * PAGE.logLine - 560) * ramp(b, P.stack[0], 0.4, EASE.out);
    shot = (
      <>
        <Backlight x={1440} y={560} />
        <Callout b={b} at={P.mic} label="SAFARI · IPHONE" text={['navigator.mediaDevices', '→ undefined']} />
        <PhoneAt>
          <Page>
            <Safari host={TAILNET_HOST} secure={false} scroll={scroll}>
              <TrailPage b={b} theme="day" log={taps.map((at) => ({ text: TYPE_ERROR, at }))} />
            </Safari>
          </Page>
          {taps.map((at, i) => <Tap key={i} b={b} at={at} x={VIEW_W / 2} y={tapY - scroll} />)}
        </PhoneAt>
      </>
    );
  }
  const at = [P.banner, P.localhost, P.blocked, P.mic].filter((s) => b >= s).at(-1) ?? 0;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Shot b={b} at={at}>
        {shot}
      </Shot>
    </AbsoluteFill>
  );
};
