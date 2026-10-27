// The whole film is timed in beats of the music, so every cut, move and sound
// lands on the track. The grid comes from scripts/beats.py
// (analysis/devhop/beat_data.json): 130.0 bpm, residual 10.6 ms.
export const FPS = 60;
const SOURCE_T0 = 15.015948951262752; // beat 0 of cat-walk.mp3, in seconds
export const BEAT = 0.4615494054741267; // seconds per beat
// The film starts on bar 4 of the track: four quiet bars for the problem, then
// the drop on the Enter key. Bar 16 of the track drops out for one bar, which
// is where the logo lands.
const START_BEAT = 16;
export const AUDIO_START_SEC = SOURCE_T0 + START_BEAT * BEAT;
// Measured on a decode of the MP4 itself (it carries the AAC priming edit, a raw
// .aac dump doesn't): 0 at Remotion 4.0.539.
export const OUTPUT_AUDIO_OFFSET_SEC = 0;

export const fb = (beat: number) => beat * BEAT * FPS; // film frame of a beat, unrounded
export const beatF = (beat: number) => Math.round(fb(beat));

export const END_BEAT = 56;
export const DEVHOP_DEMO = { durationInFrames: beatF(END_BEAT), fps: FPS, width: 1920, height: 1080 };

// Beats of each action. Typing runs on sixteenth notes.
export const B = {
  pullBack: [4, 7] as const, // macro on the error → the phone's top half
  blocked: 6,
  cutTerm: 12,
  type: 12.25,
  enter: 16, // the drop
  dashOut: [16, 17.5] as const, // camera pulls back as the dashboard prints
  qrPush: [20, 22] as const,
  bunnyOut: 23, // bunny climbs out of the QR code
  hop1: [26, 28] as const,
  hostChip: [26, 28.4] as const, // the request's Host header, shown over the hop
  hostRoll: 26.75, // … rolls from the tunnel's hostname to localhost:5173
  cutEdit: 32,
  del: 34,
  retype: 35,
  save: 37,
  hop2: [38, 40] as const,
  wide: [43, 46] as const,
  hop3: [46.5, 48] as const,
  word: 48.5,
  pill: 52, // the music comes back in
};

// The captures run the demo app on port 3000 (PORT=3000 node fixtures/devhop/capture.mjs),
// the port in the phone screenshot of localhost.
export const TYPED = 'npx devhop 3000';
export const typeBeat = (i: number) => B.type + i * 0.25;
export const DELETED = 'day';
export const RETYPED = 'night';
export const delBeat = (i: number) => B.del + i * 0.25;
export const retypeBeat = (i: number) => B.retype + i * 0.25;

// Story text, bottom left: one line each, at most 32 characters, so the chapter
// label never moves. *word* is drawn in the accent color.
export type Caption = { at: number; to: number; kicker: string; text: string };
export const CAPTIONS: Caption[] = [
  { at: 0.5, to: 4, kicker: '01  THE PROBLEM', text: 'You tunnel Vite to your phone.' },
  { at: 4, to: 8, kicker: '01  THE PROBLEM', text: 'Vite *blocks* the unknown host.' },
  { at: 8, to: 12, kicker: '01  THE PROBLEM', text: 'Vite wants a config edit first.' },
  { at: 12, to: 17.5, kicker: '02  THE FIX', text: '*One command* fixes it.' },
  { at: 18, to: 21.5, kicker: '02  THE FIX', text: 'A *real HTTPS* URL for port 3000.' },
  { at: 22, to: 25.75, kicker: '02  THE FIX', text: 'Scan the code with your phone.' },
  { at: 26, to: 28.5, kicker: '02  THE FIX', text: 'devhop rewrites the *Host header.*' },
  { at: 28.5, to: 32, kicker: '02  THE FIX', text: 'The same app, on your phone.' },
  { at: 32, to: 40, kicker: '03  LIVE EDIT', text: 'Change a line on your laptop.' },
  { at: 40.5, to: 46, kicker: '03  LIVE EDIT', text: 'Hot reload. *No page refresh.*' },
];

// Sound cues. `at` is where the sound's peak should land; `peak` is how far
// into the file that peak sits (measured), so the cue starts early by that much.
export type Cue = { at: number; src: string; volume: number; peak: number; frames?: number };
const KEY = [
  { src: 'typewriter-hit-soft.mp3', peak: 0.141 },
  { src: 'typewriter-hit-single.mp3', peak: 0.171 },
];
const keys = (beats: number[], volume: number): Cue[] =>
  beats.map((at, i) => ({ at, volume: volume * (i % 2 ? 0.85 : 1), frames: 24, ...KEY[i % 2] }));

export const CUES: Cue[] = [
  { at: B.blocked, src: 'impact-zoom-quick.mp3', volume: 0.45, peak: 0.414 }, // BLOCKED slams in
  { at: B.cutTerm, src: 'sweep-fast-small.mp3', volume: 0.3, peak: 0.296 }, // cut to the terminal
  ...keys([...TYPED].map((_, i) => typeBeat(i)), 0.32),
  { at: B.enter, src: 'typewriter-hit-hard.mp3', volume: 0.6, peak: 0.036 }, // Enter, on the drop
  { at: B.bunnyOut, src: 'switch-click-quick.mp3', volume: 0.4, peak: 0.015 }, // bunny pops out of the QR
  { at: B.hop1[0] + 1, src: 'whoosh-fast.mp3', volume: 0.5, peak: 0.713 }, // hop 1, mid-flight
  ...keys([0, 1, 2, 3, 4, 5].map((i) => B.hostRoll + i * 0.1), 0.24), // the Host header rolls over
  { at: B.hostRoll + 0.6, src: 'switch-click-quick.mp3', volume: 0.35, peak: 0.015 }, // … and settles
  { at: B.hop1[1], src: 'impact-zoom-quick.mp3', volume: 0.6, peak: 0.414 }, // lands on the phone
  { at: B.hop1[1] + 1, src: 'shimmer-sparkle-sweep.mp3', volume: 0.35, peak: 0.979 }, // ripple to the live app
  { at: B.hop1[1] + 0.6, src: 'switch-click-quick.mp3', volume: 0.35, peak: 0.015 }, // BLOCKED rolls to LIVE
  { at: B.cutEdit, src: 'sweep-fast-small.mp3', volume: 0.3, peak: 0.296 }, // cut to the editor
  ...keys([...DELETED].map((_, i) => delBeat(i)), 0.26),
  ...keys([...RETYPED].map((_, i) => retypeBeat(i)), 0.32),
  { at: B.save, src: 'switch-tap.mp3', volume: 0.6, peak: 0.002 }, // ⌘S
  { at: B.hop2[0] + 1, src: 'whoosh-fast.mp3', volume: 0.5, peak: 0.713 }, // hop 2, mid-flight
  { at: B.hop2[1], src: 'impact-zoom-quick.mp3', volume: 0.55, peak: 0.414 }, // lands on the phone
  { at: B.hop2[1] + 1, src: 'shimmer-sparkle-sweep.mp3', volume: 0.35, peak: 0.979 }, // ripple to night
  { at: B.hop2[1] + 0.6, src: 'switch-click-quick.mp3', volume: 0.35, peak: 0.015 }, // LIVE rolls to the measured ms
  { at: B.wide[0] + 1.5, src: 'sweep-fast-small.mp3', volume: 0.25, peak: 0.296 }, // pull back to the wide shot
  { at: B.hop3[0] + 0.8, src: 'whoosh-fast.mp3', volume: 0.45, peak: 0.713 }, // hop 3, into the logo
  { at: B.hop3[1], src: 'sparkle-touch.mp3', volume: 0.45, peak: 0.474 }, // bunny lands in the lockup
  { at: B.pill, src: 'impact-deep-whoosh.mp3', volume: 0.7, peak: 0.551 }, // npx devhop stamps in: loudest hit
  { at: B.pill + 1, src: 'sparkle-touch.mp3', volume: 0.3, peak: 0.474 },
];

export const cueFrom = (c: Cue) => Math.round((c.at * BEAT - c.peak - OUTPUT_AUDIO_OFFSET_SEC) * FPS);

// ───────── long cut ─────────
// About 39 s for social and the launch post: a problem chapter made of real phone
// captures plays over the track's eight quiet bars, then the film above from the
// cut to the terminal on, then a chapter on the agent skill after the logo.
// The music starts at the track's beat 0, so the drop still lands on Enter.
export const LONG_SHIFT = 16; // film beat = long beat − LONG_SHIFT, from the terminal on
export const LONG_AUDIO_START_SEC = SOURCE_T0;
export const LONG_END = 88;
export const LONG_DEMO = { durationInFrames: beatF(LONG_END), fps: FPS, width: 1920, height: 1080 };

// Problem shots: one bar each, cut on the downbeat, until the Chrome phone. From
// there one camera rides left to right through the workaround (terminal-3d):
// Chrome → vite.config.js → git → a new tunnel, flying between stations.
export const P = {
  banner: 0,
  localhost: 4,
  blocked: 8,
  mic: 12,
  tap: 12.75, // first tap: the TypeError
  stack: [13.25, 15.25] as const, // each tap on a sixteenth adds the same error again
  chrome: 16, // cut to Chrome; the ride starts here
  chromeTap: 16.75,
  config: 18.6, // arrive at vite.config.js
  paste: 19,
  save: 20.25,
  git: 21.6, // arrive at the terminal
  commitType: 21.65,
  push: 23.2,
  tunnel: 24.85, // arrive at the next run's tunnel
  cut: B.cutTerm + LONG_SHIFT,
  skill: 72,
};
// The last chapter: the bunny leaves the logo and hops the SKILL.md card's four
// corners, one per beat, drawing its outline (draw-svg-trace); the two rows that
// name chapter 01's errors hop out to cards (panel-to-canvas); the bunny hops
// home; the card boils into grain and condenses into the pill (grain-dissolve).
export const SK = {
  lift: 72,
  leave: [72.25, 73] as const,
  corners: [73, 74, 75, 76, 77], // landings; edge i is drawn during the hop that ends at corners[i + 1]
  rows: [77.5, 77.75],
  home: [80.5, 81.25] as const,
  boil: 84,
  stamp: 85.25,
  settle: [84.4, 1.2] as const, // the lockup comes back down
};
// Stations of the ride and the flights between them, in beats.
export const RIDE = { stations: [P.chrome, P.config, P.git, P.tunnel], flight: 0.6 };
export const COMMIT = 'git commit -am "allow tunnel host"';
export const PUSH = 'git push';
export const commitBeat = (i: number) => P.commitType + i * 0.04;
export const commitEnter = commitBeat(COMMIT.length) + 0.1;
export const pushBeat = (i: number) => P.push + i * 0.04;
export const pushEnter = pushBeat(PUSH.length) + 0.1;
export const stackSteps = Math.round((P.stack[1] - P.stack[0]) / 0.25) + 1;
// Each quick tunnel has a new hostname (captures/devhop/hostnames.json); the
// glitch cycles through them, a little over half a beat each.
export const GLITCH = { at: P.tunnel + 0.3, slot: 0.6 };

const shift = (c: Caption): Caption => ({ ...c, at: c.at + LONG_SHIFT, to: c.to + LONG_SHIFT });
// The long cut lands on the mic page instead of Vite's block page.
const longText = (c: Caption): Caption => (c.at === 28.5 ? { ...c, text: 'HTTPS, so *the mic works.*' } : c);
export const LONG_CAPTIONS: Caption[] = [
  { at: 0.5, to: 4, kicker: '01  THE PROBLEM', text: 'Your app runs on *localhost:3000.*' },
  { at: 4, to: 8, kicker: '01  THE PROBLEM', text: "Your phone can't open *localhost.*" },
  { at: 8, to: 12, kicker: '01  THE PROBLEM', text: 'Tunnel it, and Vite *blocks* it.' },
  { at: 12, to: 16, kicker: '01  THE PROBLEM', text: 'No HTTPS, *no microphone.*' },
  { at: 16, to: 18.6, kicker: '01  THE PROBLEM', text: 'Not just Safari. *Every browser.*' },
  { at: 18.6, to: 21.6, kicker: '01  THE PROBLEM', text: 'So you edit the config.' },
  { at: 21.6, to: 24.85, kicker: '01  THE PROBLEM', text: 'Then commit and push it.' },
  { at: 24.85, to: 28, kicker: '01  THE PROBLEM', text: 'Next run, a *new hostname.*' },
  ...CAPTIONS.filter((c) => c.at >= B.cutTerm).map(longText).map(shift),
  { at: P.skill + 0.5, to: 77.5, kicker: '04  YOUR AI', text: 'Give devhop to your AI.' },
  { at: 77.5, to: 80.5, kicker: '04  YOUR AI', text: 'It knows these errors.' },
  { at: 80.5, to: 84.5, kicker: '04  YOUR AI', text: 'Let it focus on what matters.' },
];

const shiftCue = (c: Cue): Cue => ({ ...c, at: c.at + LONG_SHIFT });
export const LONG_CUES: Cue[] = [
  { at: P.localhost, src: 'switch-click-quick.mp3', volume: 0.35, peak: 0.015 },
  { at: P.blocked, src: 'impact-zoom-quick.mp3', volume: 0.4, peak: 0.414 },
  { at: P.mic, src: 'switch-click-quick.mp3', volume: 0.35, peak: 0.015 },
  ...[P.tap, ...Array.from({ length: stackSteps }, (_, i) => P.stack[0] + i * 0.25)].map((at, i) => ({
    at, src: 'switch-tap.mp3', volume: i === 0 ? 0.5 : 0.3, peak: 0.002,
  })),
  { at: P.chrome, src: 'impact-zoom-quick.mp3', volume: 0.35, peak: 0.414 },
  { at: P.chromeTap, src: 'switch-tap.mp3', volume: 0.4, peak: 0.002 },
  ...RIDE.stations.slice(1).map((at) => ({ at: at - RIDE.flight / 2, src: 'whoosh-fast.mp3', volume: 0.3, peak: 0.713 })),
  { at: P.paste, src: 'switch-tap.mp3', volume: 0.55, peak: 0.002 }, // ⌘V
  { at: P.save, src: 'switch-tap.mp3', volume: 0.55, peak: 0.002 }, // ⌘S
  ...keys([...COMMIT].map((_, i) => commitBeat(i)).filter((_, i) => i % 3 === 0), 0.22),
  { at: commitEnter, src: 'typewriter-hit-hard.mp3', volume: 0.32, peak: 0.036 },
  ...keys([...PUSH].map((_, i) => pushBeat(i)).filter((_, i) => i % 2 === 0), 0.22),
  { at: pushEnter, src: 'typewriter-hit-hard.mp3', volume: 0.32, peak: 0.036 },
  ...[0, 1, 2, 3].map((i) => ({ at: GLITCH.at + i * GLITCH.slot, src: 'switch-click-quick.mp3', volume: i === 3 ? 0.4 : 0.25, peak: 0.015 })),
  ...CUES.filter((c) => c.at >= B.cutTerm).map(shiftCue),
  { at: P.skill, src: 'sweep-fast-small.mp3', volume: 0.3, peak: 0.296 },
  ...[SK.leave[1], ...SK.corners.slice(1)].map((at, i) => ({ at, src: 'switch-tap.mp3', volume: i === 4 ? 0.5 : 0.32, peak: 0.002 })),
  { at: SK.corners.at(-1)!, src: 'sparkle-touch.mp3', volume: 0.35, peak: 0.474 }, // the outline closes
  ...SK.rows.map((at) => ({ at: at + 0.4, src: 'whoosh-fast.mp3', volume: 0.3, peak: 0.713 })),
  ...SK.rows.map((at) => ({ at: at + 0.9, src: 'switch-click-quick.mp3', volume: 0.35, peak: 0.015 })),
  { at: SK.home[1], src: 'sparkle-touch.mp3', volume: 0.3, peak: 0.474 },
  { at: SK.boil + 0.2, src: 'sweep-fast-small.mp3', volume: 0.35, peak: 0.296 },
  { at: SK.stamp, src: 'impact-deep-whoosh.mp3', volume: 0.6, peak: 0.551 }, // condenses into the pill
];
