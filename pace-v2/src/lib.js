// V2 helpers: real images (cached, decoded synchronously), device frames in the PACE style,
// cursor, chapter labels, shield. Everything stays a pure function of time.
import { loadImage } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, WHITE, ACCENT, BG, dot, ring, line, text, textW, box, rrect, sp, tw, lerp, expoIn, expoOut, spring } from './core.js';
import { TIKTOK, TIKTOK_DIR } from './timeline.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const A = (p) => path.join(ROOT, 'build/assets', p);

// Images decode asynchronously in @napi-rs/canvas, so frames are prepared before drawing:
// `await prepare(t)` loads what time t needs; drawing then reads the caches synchronously.
const cache = new Map();
const STATIC = ['mesarios1.jpg', 'mesarios2.jpg', 'mesarios3.jpg', 'mesarios4.jpg', 'sumula_final.png', 'sumula_basquete.png'];
export function img(rel) {
  const im = cache.get(rel);
  if (!im) throw new Error(`image not prepared: ${rel}`);
  return im;
}
const fcache = new Map();
const frameKey = (tc) => `${TIKTOK_DIR}/f${String(Math.max(1, Math.min(TIKTOK.frames, Math.floor(tc * TIKTOK.fps) + 1))).padStart(4, '0')}.jpg`;
export function tiktokFrame(tc) {
  const im = fcache.get(frameKey(tc));
  if (!im) throw new Error(`frame not prepared: ${tc}`);
  return im;
}
export async function prepare(t) {
  if (!cache.size) for (const rel of [...STATIC, ...Object.values(SCREENS)]) cache.set(rel, await loadImage(A(rel)));
  if (t <= TIKTOK.duration + 0.1) {
    const key = frameKey(Math.min(t, TIKTOK.duration - 0.01));
    if (!fcache.has(key)) {
      fcache.set(key, await loadImage(A(key)));
      if (fcache.size > 8) fcache.delete(fcache.keys().next().value);
    }
  }
}

export const SCREENS = {
  home: 'screens/Home - iOS.png',
  crono: 'screens/Cronograma - Sem filtros - iOS.png',
  filtros: 'screens/Filtros - Cronograma - iOS.png',
  cronoF: 'screens/Cronograma - Filtrado - iOS.png',
  notif: 'screens/Notificações - iOS.png',
  macCrono: 'screens/Cronograma - Admin - Mac.png',
  macChave: 'screens/Chaveamento - Admin - Mac.png',
};

// draw image `im` into rect (x,y,w,h) covering it; view = { u, v, z } = focus (0..1) and zoom
export function drawCover(ctx, im, x, y, w, h, { u = 0.5, v = 0.5, z = 1, a = 1, r = 0 } = {}) {
  if (a <= 0.002) return;
  const s = Math.max(w / im.width, h / im.height) * z;
  const dw = im.width * s, dh = im.height * s;
  let dx = x + w / 2 - u * dw, dy = y + h / 2 - v * dh;
  dx = Math.min(x, Math.max(x + w - dw, dx));
  dy = Math.min(y, Math.max(y + h - dh, dy));
  ctx.save();
  ctx.globalAlpha = a;
  rrect(ctx, x, y, w, h, r); ctx.clip();
  ctx.drawImage(im, dx, dy, dw, dh);
  ctx.restore();
}
// image fit to width inside rect, scrolled by `scroll` (fraction of image height)
export function drawFitWidth(ctx, im, x, y, w, h, { scroll = 0, z = 1, u = 0.5, v = 0, a = 1, r = 0 } = {}) {
  if (a <= 0.002) return;
  const s = (w / im.width) * z;
  const dw = im.width * s, dh = im.height * s;
  const dx = Math.min(x, Math.max(x + w - dw, x + w / 2 - u * dw));
  const dy = y - scroll * dh - v * Math.max(0, dh - h);
  ctx.save();
  ctx.globalAlpha = a;
  rrect(ctx, x, y, w, h, r); ctx.clip();
  ctx.drawImage(im, dx, dy, dw, dh);
  ctx.restore();
}

// phone: body + screen rect; returns the screen rect
export function phone(ctx, x, y, w, h, a = 1) {
  box(ctx, x, y, w, h, { r: Math.min(56, w * 0.14), lw: 3, stroke: C.border, fill: C.base, a });
  const pad = 9;
  return { x: x + pad, y: y + pad, w: w - 2 * pad, h: h - 2 * pad, r: Math.min(46, w * 0.12) };
}
// laptop: screen + deck line; returns the screen rect
export function laptop(ctx, x, y, w, h, a = 1) {
  box(ctx, x - 10, y - 10, w + 20, h + 20, { r: 16, lw: 3, stroke: C.border, fill: C.base, a });
  ctx.save();
  ctx.globalAlpha = a; ctx.strokeStyle = C.border; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 60, y + h + 26); ctx.lineTo(x + w + 60, y + h + 26);
  ctx.lineTo(x + w + 20, y + h + 10); ctx.lineTo(x - 20, y + h + 10); ctx.closePath(); ctx.stroke();
  ctx.restore();
  return { x, y, w, h, r: 6 };
}

// mouse cursor (arrow) with a click ring
export function cursor(ctx, x, y, t, clicks = [], a = 1) {
  if (a <= 0.002) return;
  for (const c of clicks) {
    const p = (t - c) / 0.45;
    if (p > 0 && p < 1) ring(ctx, x, y, 10 + 30 * expoOut(p), 2.5, ACCENT, (1 - p) * a);
  }
  const press = clicks.some((c) => t > c - 0.06 && t < c + 0.1) ? 0.85 : 1;
  ctx.save();
  ctx.translate(x, y); ctx.scale(press * 1.15, press * 1.15);
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.lineTo(7, 20); ctx.lineTo(12, 31); ctx.lineTo(17, 29); ctx.lineTo(12, 18); ctx.lineTo(21, 18); ctx.closePath();
  ctx.fillStyle = WHITE; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = C.base; ctx.stroke();
  ctx.restore();
}

// chapter label: small lime dot + tracked caps, top-left, on for ~3 s
export function chapter(ctx, str, t, t0, dur = 3.2) {
  const a = sp(t, t0, 20) * (1 - tw(t, t0 + dur, 0.35, expoIn));
  if (a <= 0.002) return;
  dot(ctx, 158, 113, 7, ACCENT, a);
  text(ctx, str, 178 + (1 - a) * 10, 122, { size: 24, weight: 600, track: 0.22, color: C.text2, a });
}

// app shield (as in the iOS screens), optional Teal ring for "your athletic"
export function shield(ctx, x, y, r, { ringColor = null, a = 1 } = {}) {
  dot(ctx, x, y, r, C.s2, a);
  if (ringColor) ring(ctx, x, y, r, 3, ringColor, a);
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.text; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
  const s = r * 0.42;
  ctx.beginPath();
  ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.85, y - s * 0.65); ctx.lineTo(x + s * 0.85, y + s * 0.05);
  ctx.quadraticCurveTo(x + s * 0.8, y + s * 0.7, x, y + s); ctx.quadraticCurveTo(x - s * 0.8, y + s * 0.7, x - s * 0.85, y + s * 0.05);
  ctx.lineTo(x - s * 0.85, y - s * 0.65); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

// pick the value of the last keyframe whose time has passed: [[t, value], ...]
export const at = (t, keys) => keys.reduce((v, [k, val]) => (t >= k ? val : v), keys[0][1]);
// smooth view between keyframes [[t, {u,v,z}], ...] with critically damped springs
export function view(t, keys, w = 9) {
  let cur = { ...keys[0][1] };
  for (let i = 1; i < keys.length; i++) {
    const p = spring(t - keys[i][0], w);
    for (const k of Object.keys(cur)) cur[k] = lerp(cur[k], keys[i][1][k], p);
  }
  return cur;
}
