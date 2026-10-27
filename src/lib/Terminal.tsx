import React from 'react';
import { isQrLine, lineText, type Line } from './ansi';
import { mono } from './fonts';

// Half-block QR rows hold two modules each. Text glyphs leave hairline gaps
// between rows, so the code is redrawn as rects with the same ink. `reveal`
// wipes it in top to bottom; `wave` is the radius, in modules from the top
// center, of a ring of modules drawn in `waveColor`.
const QrBlock: React.FC<{ rows: Line[]; module: number; indent: number; reveal: number; wave?: number; waveColor?: string }> = ({
  rows, module, indent, reveal, wave, waveColor = '#3FE0F0',
}) => {
  const text = rows.map(lineText);
  const grid = text.map((t) => [...t.slice(indent)]);
  const width = Math.max(...grid.map((r) => r.length));
  const rects: React.ReactNode[] = [];
  const lit = (x: number, y: number) => wave !== undefined && Math.abs(Math.hypot(x - width / 2, y) - wave) < 2;
  const cell = (x: number, y: number, key: string) => (
    <rect key={key} x={x} y={y} width={1.02} height={1.02} fill={lit(x, y) ? waveColor : undefined} />
  );
  grid.forEach((cells, y) =>
    cells.forEach((c, x) => {
      if (c === '█' || c === '▀') rects.push(cell(x, y * 2, `${x}-${y}t`));
      if (c === '█' || c === '▄') rects.push(cell(x, y * 2 + 1, `${x}-${y}b`));
    }),
  );
  return (
    <svg
      width={width * module}
      height={grid.length * 2 * module}
      viewBox={`0 0 ${width} ${grid.length * 2}`}
      style={{ display: 'block', background: '#000', clipPath: `inset(0 0 ${((1 - reveal) * 100).toFixed(2)}% 0)` }}
      shapeRendering="crispEdges"
    >
      <g fill="#fff">{rects}</g>
    </svg>
  );
};

export const qrIndent = (rows: Line[]) => Math.min(...rows.map(lineText).map((t) => t.length - t.trimStart().length));

// Recorded CLI output at any size. Rows are fixed height so callers can place
// things against them (the QR's position, a cursor); `blankRow` lets empty
// rows take less room when the output has to fit a frame.
export const TerminalLines: React.FC<{
  lines: Line[];
  font: number;
  row: number;
  qrModule: number;
  qrReveal?: number;
  rowOpacity?: (i: number) => number;
  blankRow?: number;
  qrWave?: number;
}> = ({ lines, font, row, qrModule, qrReveal = 1, rowOpacity, blankRow = row, qrWave }) => {
  const char = font * 0.6;
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isQrLine(lines[i])) {
      const start = i;
      while (i + 1 < lines.length && isQrLine(lines[i + 1])) i++;
      const rows = lines.slice(start, i + 1);
      const indent = qrIndent(rows);
      blocks.push(
        <div key={start} style={{ paddingLeft: indent * char, margin: `${row * 0.25}px 0` }}>
          <QrBlock rows={rows} module={qrModule} indent={indent} reveal={qrReveal} wave={qrWave} />
        </div>,
      );
      continue;
    }
    blocks.push(
      <div key={i} style={{ height: lineText(lines[i]).trim() ? row : blankRow, whiteSpace: 'pre', opacity: rowOpacity?.(i) ?? 1 }}>
        {lines[i].map((s, k) => (
          <span key={k} style={{ color: s.fg ?? '#dcdfe4', background: s.bg, fontWeight: s.bold ? 700 : 400, opacity: s.dim ? 0.6 : 1 }}>
            {s.text}
          </span>
        ))}
      </div>,
    );
  }
  return <div style={{ fontFamily: mono, fontSize: font, lineHeight: `${row}px`, color: '#dcdfe4' }}>{blocks}</div>;
};
