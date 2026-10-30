// One helper for every on-screen string: L(portuguese, english).
import { LANG } from './timeline.js';

export const L = (pt, en) => (LANG === 'en' ? en : pt);
// numbers: 6.352 / 6,352
export const num = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, LANG === 'en' ? ',' : '.');
// ordinals for the refresh counter: 10ª / 10th
export const ord = (n) => (LANG === 'en' ? `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}` : `${n}ª`);
