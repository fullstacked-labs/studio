export type Style = { fg?: string; bg?: string; bold?: boolean; dim?: boolean };
export type Span = Style & { text: string };
export type Line = Span[];

// One Dark–ish palette; terminal.ansi only carries indices, so the look is ours to pick.
const base = ['#1e2127', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#dcdfe4'];
const bright = ['#5c6370', '#ff7a85', '#b5e890', '#ffd68a', '#82c4ff', '#de9bf0', '#7fd4dd', '#ffffff'];

const xterm256 = (n: number): string => {
  if (n < 8) return base[n];
  if (n < 16) return bright[n - 8];
  if (n < 232) {
    const c = n - 16;
    const level = (v: number) => (v === 0 ? 0 : 55 + v * 40);
    return `rgb(${level(Math.floor(c / 36))},${level(Math.floor(c / 6) % 6)},${level(c % 6)})`;
  }
  const g = 8 + (n - 232) * 10;
  return `rgb(${g},${g},${g})`;
};

const applySgr = (style: Style, params: number[]): Style => {
  const s = { ...style };
  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    if (p === 0) {
      delete s.fg; delete s.bg; delete s.bold; delete s.dim;
    } else if (p === 1) s.bold = true;
    else if (p === 2) s.dim = true;
    else if (p === 22) { s.bold = false; s.dim = false; }
    else if (p >= 30 && p <= 37) s.fg = base[p - 30];
    else if (p >= 90 && p <= 97) s.fg = bright[p - 90];
    else if (p === 39) delete s.fg;
    else if (p >= 40 && p <= 47) s.bg = base[p - 40];
    else if (p >= 100 && p <= 107) s.bg = bright[p - 100];
    else if (p === 49) delete s.bg;
    else if (p === 38 || p === 48) {
      const key = p === 38 ? 'fg' : 'bg';
      if (params[i + 1] === 5) {
        s[key] = xterm256(params[i + 2]);
        i += 2;
      } else if (params[i + 1] === 2) {
        s[key] = `rgb(${params[i + 2]},${params[i + 3]},${params[i + 4]})`;
        i += 4;
      }
    }
  }
  return s;
};

// Enough of a terminal for recorded CLI output: SGR colors are kept, other CSI
// sequences (cursor show/hide, clears) are dropped, and \r rewinds the line.
export const parseAnsi = (raw: string): Line[] => {
  const lines: Line[] = [];
  let line: Line = [];
  let style: Style = {};
  const push = (text: string) => {
    if (text) line.push({ ...style, text });
  };
  const re = /\x1b\[([0-9;?]*)([A-Za-z])|\x1b\][^\x07]*\x07|\r\n|\n|\r/g;
  let last = 0;
  for (let m = re.exec(raw); m; m = re.exec(raw)) {
    push(raw.slice(last, m.index));
    last = re.lastIndex;
    if (m[0] === '\n' || m[0] === '\r\n') {
      lines.push(line);
      line = [];
    } else if (m[0] === '\r') {
      line = [];
    } else if (m[2] === 'm') {
      style = applySgr(style, m[1] === '' ? [0] : m[1].split(';').map(Number));
    }
  }
  push(raw.slice(last));
  if (line.length) lines.push(line);
  return lines;
};

export const lineText = (line: Line) => line.map((s) => s.text).join('');

export const isQrLine = (line: Line) => /^ *[▀▄█ ]+$/.test(lineText(line)) && /[▀▄█]/.test(lineText(line));
