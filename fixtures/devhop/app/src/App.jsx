const accent = '#2563eb';

const trails = [
  { name: 'Lakeside loop', km: 6.4, time: '1 h 40 min' },
  { name: 'Ridge overlook', km: 9.1, time: '2 h 50 min' },
  { name: 'Old mill path', km: 3.2, time: '55 min' },
];

export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '28px 20px', background: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box', color: '#0f172a' }}>
      <p style={{ margin: 0, color: accent, fontWeight: 600, fontSize: 14, letterSpacing: 0.4 }}>SATURDAY</p>
      <h1 style={{ margin: '6px 0 22px', fontSize: 30, lineHeight: 1.15 }}>Pick a trail</h1>
      {trails.map((t) => (
        <section key={t.name} style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', marginBottom: 12, boxShadow: '0 1px 3px rgba(15,23,42,.08)' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{t.name}</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 15 }}>{t.km} km · {t.time}</p>
        </section>
      ))}
      <button style={{ width: '100%', marginTop: 10, padding: '15px 0', border: 0, borderRadius: 14, background: accent, color: '#fff', fontSize: 17, fontWeight: 600 }}>
        Start route
      </button>
    </main>
  );
}
