import React from 'react';
import { mono } from './fonts';
import { Window } from './Terminal';

const KEYWORDS = /\b(const|let|export|default|function|return|import|from)\b/;
const TOKEN = /('[^']*'?|"[^"]*"?|\b(?:const|let|export|default|function|return|import|from)\b|\b\d+(?:\.\d+)?\b)/g;

// Just enough highlighting to read as code; not a real grammar.
const highlight = (code: string) =>
  code.split(TOKEN).map((part, i) => {
    let color = '#c9ced8';
    if (/^['"]/.test(part)) color = '#98c379';
    else if (KEYWORDS.test(part)) color = '#c678dd';
    else if (/^\d/.test(part)) color = '#d19a66';
    return (
      <span key={i} style={{ color }}>
        {part}
      </span>
    );
  });

export const Editor: React.FC<{
  file: string;
  lines: string[];
  dirty?: boolean;
  activeLine?: number;
  cursorCol?: number;
  style?: React.CSSProperties;
}> = ({ file, lines, dirty, activeLine, cursorCol, style }) => (
  <Window title={`${file}${dirty ? ' ●' : ''}`} style={style}>
    <div style={{ fontFamily: mono, fontSize: 15, lineHeight: '24px', padding: '12px 0' }}>
      {lines.map((code, i) => (
        <div key={i} style={{ display: 'flex', whiteSpace: 'pre', background: i === activeLine ? 'rgba(255,255,255,.05)' : undefined }}>
          <span style={{ width: 44, paddingRight: 14, textAlign: 'right', color: '#4b5263', flexShrink: 0 }}>{i + 1}</span>
          <span style={{ position: 'relative' }}>
            {highlight(code)}
            {i === activeLine && cursorCol !== undefined ? (
              <span style={{ position: 'absolute', left: `${cursorCol * 0.6}em`, top: 3, width: 2, height: 18, background: '#61afef' }} />
            ) : null}
          </span>
        </div>
      ))}
    </div>
  </Window>
);
