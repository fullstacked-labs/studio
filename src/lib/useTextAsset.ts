import { useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

// Captures are plain files next to the screenshots; rendering waits for them
// so no frame is drawn with the text missing.
export const useTextAsset = (path: string): string | null => {
  const [text, setText] = useState<string | null>(null);
  const [handle] = useState(() => delayRender(`load ${path}`));
  useEffect(() => {
    fetch(staticFile(path))
      .then((r) => {
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => {
        setText(t);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [path, handle]);
  return text;
};
