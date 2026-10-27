import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

// Loaded from Google Fonts at render time so frames match on any machine,
// instead of depending on whichever system fonts the renderer has.
export const sans = loadInter('normal', { weights: ['400', '500', '600'], subsets: ['latin'] }).fontFamily;
export const display = loadInterTight('normal', { weights: ['600', '800'], subsets: ['latin'] }).fontFamily;
export const mono = loadMono('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily;
