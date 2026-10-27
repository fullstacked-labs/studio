import React from 'react';

// A generic phone body, not any one vendor's device: the screen is what matters.
export const Phone: React.FC<{ width: number; aspect?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  width,
  aspect = 844 / 390,
  style,
  children,
}) => {
  const bezel = Math.round(width * 0.035);
  const screenW = width - bezel * 2;
  const screenH = Math.round(screenW * aspect);
  return (
    <div
      style={{
        width,
        height: screenH + bezel * 2,
        padding: bezel,
        boxSizing: 'border-box',
        borderRadius: width * 0.16,
        background: 'linear-gradient(160deg, #3a3d44, #1b1d21)',
        boxShadow: '0 0 0 1px rgba(255,255,255,.12) inset, 0 30px 70px rgba(0,0,0,.5)',
        ...style,
      }}
    >
      <div style={{ position: 'relative', width: screenW, height: screenH, borderRadius: width * 0.13, overflow: 'hidden', background: '#fff' }}>
        {children}
      </div>
    </div>
  );
};
