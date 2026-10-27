import React from 'react';
import { isQrLine, lineText, type Line } from './ansi';
import { mono } from './fonts';

const FONT = 15;
const ROW = 22;
// JetBrains Mono advances 600/1000 em per glyph.
const CHAR = FONT * 0.6;

// Half-block QR rows hold two modules each. Text glyphs leave hairline gaps
// between rows, so the code is redrawn as rects with the same ink.
const QrBlock: React.FC<{ rows: Line[]; module: number }> = ({ rows, module }) => {
  const text = rows.map(lineText);
  const indent = Math.min(...text.map((t) => t.length - t.trimStart().length));
  const grid = text.map((t) => [...t.slice(indent)]);
  const width = Math.max(...grid.map((r) => r.length));
  const rects: React.ReactNode[] = [];
  grid.forEach((cells, y) =>
    cells.forEach((c, x) => {
      const top = c === '█' || c === '▀';
      const bottom = c === '█' || c === '▄';
      if (top) rects.push(<rect key={`${x}-${y}t`} x={x} y={y * 2} width={1.02} height={1.02} />);
      if (bottom) rects.push(<rect key={`${x}-${y}b`} x={x} y={y * 2 + 1} width={1.02} height={1.02} />);
    }),
  );
  return (
    <svg
      width={width * module}
      height={grid.length * 2 * module}
      viewBox={`0 0 ${width} ${grid.length * 2}`}
      style={{ display: 'block', marginLeft: indent * CHAR, marginTop: 4, marginBottom: 4, background: '#000' }}
      shapeRendering="crispEdges"
    >
      <g fill="#fff">{rects}</g>
    </svg>
  );
};

const TextRow: React.FC<{ line: Line; cursor?: boolean }> = ({ line, cursor }) => (
  <div style={{ height: ROW, whiteSpace: 'pre' }}>
    {line.map((s, i) => (
      <span
        key={i}
        style={{
          color: s.fg ?? '#dcdfe4',
          background: s.bg,
          fontWeight: s.bold ? 700 : 400,
          opacity: s.dim ? 0.6 : 1,
        }}
      >
        {s.text}
      </span>
    ))}
    {cursor ? <span style={{ display: 'inline-block', width: CHAR, height: FONT + 2, verticalAlign: -3, background: '#dcdfe4' }} /> : null}
  </div>
);

export const Terminal: React.FC<{
  title: string;
  lines: Line[];
  cursor?: boolean;
  qrModule?: number;
  style?: React.CSSProperties;
}> = ({ title, lines, cursor, qrModule = 6, style }) => {
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isQrLine(lines[i])) {
      const start = i;
      while (i + 1 < lines.length && isQrLine(lines[i + 1])) i++;
      blocks.push(<QrBlock key={start} rows={lines.slice(start, i + 1)} module={qrModule} />);
    } else {
      blocks.push(<TextRow key={i} line={lines[i]} cursor={cursor && i === lines.length - 1} />);
    }
  }
  return (
    <Window title={title} style={style}>
      <div style={{ fontFamily: mono, fontSize: FONT, lineHeight: `${ROW}px`, padding: '14px 18px', color: '#dcdfe4' }}>{blocks}</div>
    </Window>
  );
};

export const Window: React.FC<{ title: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ title, style, children }) => (
  <div
    style={{
      background: '#16181d',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,.09)',
      boxShadow: '0 24px 60px rgba(0,0,0,.45)',
      overflow: 'hidden',
      ...style,
    }}
  >
    <div style={{ height: 34, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', background: '#1d2026', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
      ))}
      <span style={{ flex: 1, textAlign: 'center', marginRight: 52, fontFamily: mono, fontSize: 13, color: '#8b929e' }}>{title}</span>
    </div>
    {children}
  </div>
);

export { CHAR as TERMINAL_CHAR_WIDTH };
