// Easing set, ramp/mix and SpeedBlur adapted from video-shotcraft
// (https://github.com/Vincentwei1021/video-shotcraft, Apache-2.0); see NOTICE.
import React from 'react';
import { Easing } from 'remotion';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const bezier = (a: number, b: number, c: number, d: number) => Easing.bezier(a, b, c, d);

export const EASE = {
  snappy: bezier(0.16, 1, 0.3, 1),
  out: bezier(0.22, 1, 0.36, 1),
  smooth: bezier(0.65, 0, 0.35, 1),
  swift: bezier(0.4, 0, 0.2, 1),
  exit: bezier(0.7, 0, 0.84, 0),
  anticip: bezier(0.5, -0.32, 0.25, 1),
  overshoot: bezier(0.34, 1.45, 0.64, 1),
  linear: clamp01,
};

export const ramp = (frame: number, start: number, dur: number, ease: (t: number) => number = EASE.snappy) =>
  ease(clamp01((frame - start) / Math.max(1e-6, dur)));

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`;
};

// Directional blur along the camera's screen velocity; free when the camera is still.
export const SpeedBlur: React.FC<{ vx: number; vy?: number; amount?: number; max?: number; children: React.ReactNode }> = ({
  vx,
  vy = 0,
  amount = 0.45,
  max = 36,
  children,
}) => {
  const rid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const sd = Math.min(max, Math.hypot(vx, vy) * amount);
  const fill: React.CSSProperties = { position: 'absolute', inset: 0 };
  if (sd < 0.35) return <div style={fill}>{children}</div>;
  const deg = (Math.atan2(vy, vx) * 180) / Math.PI;
  const id = `speedblur-${rid}`;
  return (
    <div style={fill}>
      <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${sd.toFixed(2)} 0`} edgeMode="none" />
        </filter>
      </svg>
      <div style={{ ...fill, transform: `rotate(${deg}deg)`, filter: `url(#${id})` }}>
        <div style={{ ...fill, transform: `rotate(${-deg}deg)` }}>{children}</div>
      </div>
    </div>
  );
};
