import { themes } from './themes.js';

const theme = themes.day;

const trails = [
  { name: 'Lakeside loop', km: 6.4, time: '1 h 40 min' },
  { name: 'Ridge overlook', km: 9.1, time: '2 h 50 min' },
  { name: 'Old mill path', km: 3.2, time: '55 min' },
];

function Hero() {
  const t = theme;
  return (
    <svg viewBox="0 0 390 230" style={{ display: 'block', width: '100%' }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.sky[0]} />
          <stop offset="1" stopColor={t.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="390" height="230" fill="url(#sky)" />
      <circle cx="300" cy="70" r="34" fill={t.orb} />
      {t === themes.night &&
        [[40, 40], [90, 80], [150, 30], [210, 60], [350, 140], [250, 110]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2" fill="#fff" opacity="0.8" />
        ))}
      <path d="M0 170 Q90 110 180 160 T390 140 V230 H0 Z" fill={t.hills[0]} />
      <path d="M0 200 Q120 150 230 190 T390 180 V230 H0 Z" fill={t.hills[1]} />
    </svg>
  );
}

export default function App() {
  const t = theme;
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: t.bg, minHeight: '100vh', color: t.ink }}>
      <Hero />
      <div style={{ padding: '22px 20px 28px' }}>
        <p style={{ margin: 0, color: t.accent, fontWeight: 700, fontSize: 14, letterSpacing: 0.6 }}>{t.label}</p>
        <h1 style={{ margin: '6px 0 18px', fontSize: 34, lineHeight: 1.1 }}>{t.title}</h1>
        {trails.map((trail) => (
          <section key={trail.name} style={{ background: t.card, borderRadius: 16, padding: '15px 18px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,.12)' }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{trail.name}</h2>
            <p style={{ margin: '4px 0 0', color: t.muted, fontSize: 15 }}>{trail.km} km · {trail.time}</p>
          </section>
        ))}
        <button style={{ width: '100%', marginTop: 8, padding: '16px 0', border: 0, borderRadius: 14, background: t.accent, color: t === themes.night ? '#1a1200' : '#fff', fontSize: 17, fontWeight: 700 }}>
          Start route
        </button>
      </div>
    </main>
  );
}
