// Shared primitives: palette, easing, seeded randomness, text, dots and the recurring
// structures (Brazil outline, 1,800-dot grid, control-room ring). Everything here is pure.
import { GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const w of ['Medium', 'SemiBold', 'Bold', 'Black']) {
  GlobalFonts.registerFromPath(path.join(ROOT, 'fonts', `Geist-${w}.ttf`), 'Geist');
}

export const W = 1920, H = 1080, FPS = 60;
// PACE dark palette (design system "Paleta Dark"): green-biased neutrals, Lime = action and
// selection, Teal = your athletic, semantic states always paired with a shape (● ✓ ▲ ⚠).
export const C = {
  base: '#0B0E0C', s1: '#151A17', s2: '#1F2521', s3: '#2A312C', sep: '#2E3631', border: '#6B756F',
  text: '#F2F5F2', text2: '#A7B0AA', text3: '#8A938D',
  lime: '#B7F34B', onLime: '#152211', teal: '#2DD4BF',
  live: '#FF5C5C', success: '#34D399', warn: '#FBBF24', error: '#FF6B5E',
};
export const BG = C.base, WHITE = C.text, ACCENT = C.lime;
export const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
export const SAFE = { l: 150, r: 1770, t: 90, b: 990 };

// ---------- math & easing ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const mix2 = (p0, p1, p) => [lerp(p0[0], p1[0], p), lerp(p0[1], p1[1], p)];
export const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));

// critically damped spring 1 − (1 + ωt)e^(−ωt); never overshoots
export const spring = (dt, w = 20) => (dt <= 0 ? 0 : 1 - (1 + w * dt) * Math.exp(-w * dt));
// spring that lands on `beat` (motion starts 0.05 s early)
export const sp = (t, beat, w = 20) => spring(t - beat + 0.05, w);
// spring in then spring out: 0 → 1 at `a`, 1 → 0 at `b`
export const spIO = (t, a, b, w = 20, wOut = 26) => sp(t, a, w) * (1 - sp(t, b, wOut));

export const expoIn = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, 10 * p - 10));
export const expoOut = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const expoInOut = (p) =>
  p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2;
// timed tween with an easing fn
export const tw = (t, t0, dur, ease = expoInOut) => ease(prog(t, t0, t0 + dur));

// ---------- deterministic randomness ----------
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
export const hash = (i, k = 0) => {
  let x = (i * 374761393 + k * 668265263) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};

// ---------- drawing ----------
export function dot(ctx, x, y, r, color = WHITE, a = 1) {
  if (a <= 0.002 || r <= 0.05) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function ring(ctx, x, y, r, lw = 2, color = WHITE, a = 1) {
  if (a <= 0.002 || r <= 0.1) return;
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function line(ctx, x1, y1, x2, y2, lw = 2, color = WHITE, a = 1) {
  if (a <= 0.002) return;
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// partial line from (x1,y1) towards (x2,y2): p in [0,1]
export const lineP = (ctx, x1, y1, x2, y2, p, lw, color, a) =>
  p > 0 && line(ctx, x1, y1, lerp(x1, x2, p), lerp(y1, y2, p), lw, color, a);

export function rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function box(ctx, x, y, w, h, { r = 12, lw = 2, stroke = WHITE, fill = null, a = 1 } = {}) {
  if (a <= 0.002 || w <= 0 || h <= 0) return;
  ctx.globalAlpha = a;
  rrect(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke && lw > 0) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.globalAlpha = 1;
}

// stroke a rounded-rect outline progressively (p = 0..1) starting from the top-left corner
export function boxDraw(ctx, x, y, w, h, p, { lw = 2, color = WHITE, a = 1 } = {}) {
  if (p <= 0 || a <= 0) return;
  const per = 2 * (w + h);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.setLineDash([per * p, per]);
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();
  ctx.restore();
}

// text with tracking (em); align: left|center|right. Returns drawn width.
export function text(ctx, str, x, y, { size = 26, weight = 600, color = WHITE, track = 0, align = 'left', a = 1, baseline = 'alphabetic' } = {}) {
  ctx.font = `${weight} ${size}px Geist`;
  ctx.letterSpacing = `${track * size}px`;
  const w = ctx.measureText(str).width - track * size;
  if (a > 0.002) {
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.textBaseline = baseline;
    ctx.textAlign = 'left';
    const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillText(str, x0, y);
    ctx.globalAlpha = 1;
  }
  ctx.letterSpacing = '0px';
  return w;
}
export function textW(ctx, str, size, weight = 600, track = 0) {
  ctx.font = `${weight} ${size}px Geist`;
  ctx.letterSpacing = `${track * size}px`;
  const w = ctx.measureText(str).width - track * size;
  ctx.letterSpacing = '0px';
  return w;
}

// numbers drawn in fixed-width cells (Skia ignores font-variant-numeric)
export function tabular(ctx, str, x, y, { size = 60, weight = 800, color = WHITE, align = 'left', a = 1 } = {}) {
  ctx.font = `${weight} ${size}px Geist`;
  ctx.letterSpacing = '0px';
  const cell = ctx.measureText('0').width;
  const widths = [...str].map((ch) => (/[0-9]/.test(ch) ? cell : ctx.measureText(ch).width));
  const total = widths.reduce((s, v) => s + v, 0);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  [...str].forEach((ch, i) => { ctx.fillText(ch, cx + widths[i] / 2, y); cx += widths[i]; });
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
  return total;
}
export const fmtBR = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// text that enters with a short rise + fade and exits with an exponential fade
export function textIO(ctx, str, x, y, t, tIn, tOut, opts = {}) {
  const pin = sp(t, tIn, opts.w || 22);
  const pout = tOut == null ? 0 : tw(t, tOut - 0.05, 0.25, expoIn);
  const a = pin * (1 - pout) * (opts.a ?? 1);
  if (a <= 0.002) return 0;
  return text(ctx, str, x, y + (1 - pin) * (opts.rise ?? 14), { ...opts, a });
}

// feature label: orange dot + tracked white caps, top-left anchored
export function featureLabel(ctx, str, x, y, t, tIn, tOut) {
  const pin = sp(t, tIn, 24);
  const pout = tOut == null ? 0 : tw(t, tOut - 0.05, 0.22, expoIn);
  const a = pin * (1 - pout);
  if (a <= 0.002) return;
  dot(ctx, x + 7, y - 9, 7 * pin, ACCENT, a);
  text(ctx, str, x + 26 + (1 - pin) * 10, y, { size: 26, weight: 600, track: 0.2, a });
}

// geometric finger tap: white dot with an expanding ring
export function tap(ctx, x, y, t, beat) {
  const appear = sp(t, beat - 0.3, 22) * (1 - tw(t, beat + 0.35, 0.25, expoIn));
  if (appear <= 0.002) return;
  const press = 1 - 0.25 * (sp(t, beat, 40) * (1 - sp(t, beat + 0.12, 30)));
  dot(ctx, x, y, 14 * press * appear, WHITE, 0.95 * appear);
  const rp = prog(t, beat, beat + 0.45);
  if (rp > 0 && rp < 1) ring(ctx, x, y, 16 + 34 * expoOut(rp), 2, WHITE, (1 - rp) * appear);
}

// ---------- recurring structures ----------
// Brazil outline (lon, lat), simplified by hand
const BR = [
  [-73.99, -7.53], [-72.9, -5.2], [-70.6, -4.3], [-69.9, -4.2], [-69.4, -1.2], [-69.8, 1.7], [-67.3, 2.0], [-66.85, 1.2],
  [-65.5, 0.8], [-64.2, 1.9], [-64.0, 3.8], [-62.8, 4.0], [-61.3, 4.5], [-60.7, 5.2], [-59.9, 3.0], [-59.6, 1.4],
  [-58.2, 1.5], [-56.5, 1.9], [-54.6, 2.3], [-52.9, 2.2], [-51.6, 4.4], [-51.1, 4.2], [-50.4, 2.2], [-50.0, 0.4],
  [-48.6, -1.1], [-46.9, -0.9], [-44.6, -2.4], [-42.4, -2.7], [-40.0, -2.9], [-38.5, -3.7], [-37.2, -4.8], [-35.5, -5.1],
  [-34.8, -7.1], [-35.0, -8.4], [-35.7, -9.7], [-37.0, -11.0], [-38.4, -12.9], [-39.0, -15.0], [-39.2, -17.6], [-39.7, -19.4],
  [-40.3, -20.3], [-41.0, -21.9], [-42.0, -22.9], [-43.2, -23.0], [-44.7, -23.4], [-46.3, -24.0], [-47.9, -25.1], [-48.6, -26.4],
  [-48.6, -28.3], [-49.7, -29.3], [-50.6, -30.6], [-51.9, -31.9], [-53.4, -33.7], [-53.5, -33.0], [-53.1, -32.6], [-55.6, -30.9],
  [-57.6, -30.2], [-56.0, -28.3], [-55.0, -27.3], [-53.7, -26.9], [-53.6, -26.0], [-54.6, -25.6], [-54.3, -24.0], [-55.4, -23.9],
  [-55.7, -22.4], [-57.6, -22.1], [-58.0, -20.2], [-57.7, -19.0], [-58.2, -17.4], [-58.4, -16.3], [-60.2, -16.2], [-60.2, -13.7],
  [-61.8, -13.4], [-64.5, -12.4], [-65.4, -10.8], [-66.7, -9.9], [-68.6, -11.0], [-70.5, -11.0], [-70.6, -9.5], [-72.4, -10.0],
  [-73.2, -9.4],
];
const BR_SCALE = 19.0, BR_CX = -54.2, BR_CY = -14.2, BR_K = Math.cos((15 * Math.PI) / 180);
export const projBR = ([lon, lat]) => [960 + (lon - BR_CX) * BR_SCALE * BR_K, 470 - (lat - BR_CY) * BR_SCALE];
export const UBERABA = projBR([-47.93, -19.75]);

// points along the outline, evenly spaced (a dotted line)
export const BR_DOTS = (() => {
  const pts = BR.map(projBR);
  pts.push(pts[0]);
  const out = [];
  const step = 9;
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    let d = carry;
    while (d < len) { out.push([x1 + ((x2 - x1) * d) / len, y1 + ((y2 - y1) * d) / len]); d += step; }
    carry = d - len;
  }
  return out;
})();

// 1,800-dot grid: 4 day blocks × (18 cols × 25 rows) = 4 × 450
export const GRID = (() => {
  const cols = 18, rows = 25, sp_ = 15, gap = 70;
  const bw = (cols - 1) * sp_, bh = (rows - 1) * sp_;
  const total = 4 * bw + 3 * gap;
  const x0 = 960 - total / 2, y0 = 455 - bh / 2;
  const pts = [];
  for (let b = 0; b < 4; b++)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        pts.push({ x: x0 + b * (bw + gap) + c * sp_, y: y0 + r * sp_, b, r, c, i: pts.length });
  return pts;
})();
if (GRID.length !== 1800) throw new Error('grid must hold 1800 dots');

// control room: 28 dots on an ellipse around a table
export const ROOM = { cx: 960, cy: 600, rx: 370, ry: 165, n: 28, tableW: 470, tableH: 150 };
export const ringPos = (i, lean = 0) => {
  const a = (i / ROOM.n) * Math.PI * 2 - Math.PI / 2;
  const k = 1 - lean;
  return [ROOM.cx + Math.cos(a) * ROOM.rx * k, ROOM.cy + Math.sin(a) * ROOM.ry * k];
};

// sample points inside rendered text (for dots that become letters)
import { createCanvas } from '@napi-rs/canvas';
export function sampleText(str, { size, weight = 900, cx = 960, baseline = 540, step = 16, track = 0 }) {
  const c = createCanvas(W, H), x = c.getContext('2d');
  const w = text(x, str, cx, baseline, { size, weight, track, align: 'center' });
  const img = x.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += step)
    for (let xx = (y / step) % 2 ? step / 2 : 0; xx < W; xx += step)
      if (img[(Math.round(y) * W + Math.round(xx)) * 4 + 3] > 200) pts.push([xx, y]);
  return { pts, width: w };
}

// tracking/size that fit `maxW` (tracking first, then size, never below 22 px)
export function fit(ctx, str, maxW, { size = 24, weight = 600, track = 0.14, minTrack = 0.03 } = {}) {
  let s = size, tr = track;
  while (textW(ctx, str, s, weight, tr) > maxW && tr > minTrack) tr = Math.max(minTrack, tr - 0.01);
  while (textW(ctx, str, s, weight, tr) > maxW && s > 22) s -= 1;
  return { size: s, track: tr };
}

// semantic state shapes (the design system pairs every state color with a shape)
export function stateIcon(ctx, kind, x, y, s, color, a = 1) {
  if (a <= 0.002) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color; ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.22); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'warn') { // ▲
    ctx.moveTo(x, y - s * 0.55); ctx.lineTo(x + s * 0.55, y + s * 0.45); ctx.lineTo(x - s * 0.55, y + s * 0.45); ctx.closePath(); ctx.fill();
  } else if (kind === 'success') { // ✓
    ctx.moveTo(x - s * 0.45, y); ctx.lineTo(x - s * 0.12, y + s * 0.33); ctx.lineTo(x + s * 0.5, y - s * 0.38); ctx.stroke();
  } else { // ● live
    ctx.arc(x, y, s * 0.42, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
