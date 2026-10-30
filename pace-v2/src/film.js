// The film as one pure function of absolute time: drawFrame(ctx, t, { captions }).
import { createCanvas } from '@napi-rs/canvas';
import { W, H, BG, text, textW, box, rgba } from './core.js';
import { B, captionCues, DURATION } from './timeline.js';
import * as c1 from './scenes/c1.js';
import * as c2 from './scenes/c2.js';
import * as c3 from './scenes/c3.js';
import * as c4 from './scenes/c4.js';

export { DURATION };
export { prepare } from './lib.js';
const SCENES = [c1, c2, c3, c4];

// almost invisible vignette with a static dither against banding
const VIGNETTE = (() => {
  const c = createCanvas(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.22)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const img = x.getImageData(0, 0, W, H), d = img.data;
  let s = 12345;
  for (let i = 3; i < d.length; i += 4) { s = (s * 1103515245 + 12345) >>> 0; d[i] = Math.max(0, Math.min(255, d[i] + ((s >>> 16) % 3) - 1)); }
  x.putImageData(img, 0, 0);
  return c;
})();

const CAP = { size: 36, weight: 500, maxW: 1440, lineH: 48, bottom: 978 };
function wrap(ctx, str) {
  const words = str.split(' ');
  if (textW(ctx, str, CAP.size, CAP.weight) <= CAP.maxW) return [str];
  let best = null;
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(' '), b = words.slice(k).join(' ');
    const wa = textW(ctx, a, CAP.size, CAP.weight), wb = textW(ctx, b, CAP.size, CAP.weight);
    if (wa > CAP.maxW || wb > CAP.maxW) continue;
    if (!best || Math.abs(wa - wb) < best.d) best = { d: Math.abs(wa - wb), lines: [a, b] };
  }
  return best ? best.lines : [str];
}
const CUES = captionCues();
function captions(ctx, t) {
  const cue = CUES.find((c) => t >= c.start && t < c.end);
  if (!cue) return;
  const lines = wrap(ctx, cue.text);
  const wMax = Math.max(...lines.map((l) => textW(ctx, l, CAP.size, CAP.weight)));
  const top = CAP.bottom - lines.length * CAP.lineH - 6;
  box(ctx, 960 - wMax / 2 - 22, top - 8, wMax + 44, lines.length * CAP.lineH + 22, { r: 8, lw: 0, stroke: null, fill: rgba(BG, 0.8) });
  lines.forEach((l, i) => text(ctx, l, 960, top + (i + 1) * CAP.lineH - 10, { size: CAP.size, weight: CAP.weight, align: 'center' }));
}

export function drawFrame(ctx, t, { captions: withCaptions = false, overlayOnly = false } = {}) {
  if (!overlayOnly) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    for (const s of SCENES) s.draw(ctx, t);
    ctx.drawImage(VIGNETTE, 0, 0);
  }
  if (withCaptions) captions(ctx, t);
}
