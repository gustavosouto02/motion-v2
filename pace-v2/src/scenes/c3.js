// CAPÍTULO 3 · O QUE ISSO MOVE — one dot breathes, a team huddles, a jersey, a flag, the stands;
// the decisive play (freeze, silence, explosion); the emotion reaching everyone, down to a phone.
import { createCanvas } from '@napi-rs/canvas';
import {
  C, WHITE, ACCENT, BG, dot, ring, line, text, textW, tabular, box, rrect, sp, spIO, tw, prog, lerp, clamp,
  expoIn, expoOut, expoInOut, spring, hash, stateIcon,
} from '../core.js';
import { B, T } from '../timeline.js';
import { L, num, ord } from '../i18n.js';
import { chapter, shield } from '../lib.js';

const CX = 960, CY = 470;
const BEAT = 0.6;

// ---------- shapes ----------
const RING1 = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; return [CX + Math.cos(a) * 95, CY + Math.sin(a) * 95]; });
const RING2 = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 - Math.PI / 2 + 0.2; return [CX + Math.cos(a) * 175, CY + Math.sin(a) * 175]; });
const GROUP = [[CX, CY], ...RING1, ...RING2]; // 25
const BUS = Array.from({ length: 25 }, (_, i) => [CX - 288 + (i % 13) * 48, CY - 24 + Math.floor(i / 13) * 48]);
const JERSEY = (() => {
  const P = [[-55, -200], [-130, -180], [-215, -105], [-165, -55], [-122, -88], [-122, 215], [122, 215], [122, -88], [165, -55], [215, -105], [130, -180], [55, -200], [0, -158]];
  const c = createCanvas(1920, 1080), x = c.getContext('2d');
  x.beginPath(); P.forEach(([px, py], i) => (i ? x.lineTo(CX + px, CY + py) : x.moveTo(CX + px, CY + py))); x.closePath();
  const pts = [];
  for (let y = CY - 210; y <= CY + 215; y += 26)
    for (let xx = CX - 220; xx <= CX + 220; xx += 26) if (x.isPointInPath(xx, y)) pts.push([xx, y]);
  pts.sort((a, b) => Math.hypot(a[0] - CX, a[1] - CY) - Math.hypot(b[0] - CX, b[1] - CY));
  return { pts, path: P };
})();
const FLAG = (() => {
  const pts = [];
  for (let r = 0; r < 12; r++) for (let c = 0; c < 24; c++) pts.push([700 + c * 22, 250 + r * 22, c, r]);
  return pts;
})();
const STANDS = (() => {
  const pts = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 44; c++) pts.push([250 + c * 33.5 + (r % 2) * 16, 600 + r * 38, c, r]);
  return pts;
})();
// court for the decisive play
const COURT = { x: 560, y: 282, w: 800, h: 400 };
const HOOP = [COURT.x + COURT.w - 46, COURT.y + COURT.h / 2];
const CROWD_LANCE = STANDS.map((_, i) => {
  const top = i % 2 === 0;
  const k = Math.floor(i / 2);
  const col = k % 44, row = Math.floor(k / 44);
  return [250 + col * 33.5, top ? 208 + row * 22 : 712 + row * 22];
});

const ours = (i) => hash(i, 31) < 0.55; // fans of "your athletic" (Teal)

// ---------- people ----------
function people(ctx, t) {
  const [p0, p1] = B.people;
  if (t < p0 || t > T.cores) return;
  chapter(ctx, L('03 · O QUE ISSO MOVE', '03 · WHAT IT MOVES'), t, p0 + 0.2, 3.4);
  const breath = 1 + 0.18 * Math.sin((t - p0) * Math.PI * 2 * 0.55);
  const rot = 0.9 * tw(t, T.treino - 0.1, 2.4, expoInOut);
  const toBus = tw(t, T.onibus - 0.1, 0.6);
  const toCluster = tw(t, T.expectativa - 0.1, 0.5);
  const toJersey = tw(t, T.camisa - 0.15, 0.7);
  const teal = tw(t, T.honrar - 0.1, 0.8);
  const busX = -80 * prog(t, T.onibus, T.expectativa);
  if (t > T.cores - 0.2) return; // the flag scene takes the dots over
  // bus outline
  const ba = toBus * (1 - toCluster);
  if (ba > 0.002) box(ctx, CX - 330 + busX, CY - 70, 660, 140, { r: 36, lw: 2.5, stroke: C.border, a: ba });
  // arms between the huddle
  const arms = sp(t, T.amigo, 16) * (1 - toBus);
  if (arms > 0.002) RING1.forEach((_, i) => {
    const a1 = (i / 8) * Math.PI * 2 - Math.PI / 2 + rot, a2 = ((i + 1) / 8) * Math.PI * 2 - Math.PI / 2 + rot;
    line(ctx, CX + Math.cos(a1) * 95, CY + Math.sin(a1) * 95, CX + Math.cos(a2) * 95, CY + Math.sin(a2) * 95, 2, C.text2, arms);
  });
  const N = Math.max(GROUP.length, JERSEY.pts.length);
  for (let i = 0; i < N; i++) {
    let x, y, a = 1;
    if (i < GROUP.length) {
      const [gx, gy] = GROUP[i];
      const ang = Math.atan2(gy - CY, gx - CX) + rot, rad = Math.hypot(gx - CX, gy - CY);
      [x, y] = [CX + Math.cos(ang) * rad, CY + Math.sin(ang) * rad];
      // arrival: ring 1 on "rosto", ring 2 on "história"
      const tin = i === 0 ? p0 : i <= 8 ? T.rosto - 0.4 + i * 0.04 : T.historia - 0.3 + (i - 9) * 0.03;
      const pin = tw(t, tin, 0.7, expoOut);
      const from = [CX + Math.cos(i * 2.1) * 1200, CY + Math.sin(i * 2.1) * 800];
      if (i) { x = lerp(from[0], x, pin); y = lerp(from[1], y, pin); a = pin; }
      x = lerp(x, BUS[i][0] + busX, toBus); y = lerp(y, BUS[i][1], toBus);
      const cl = [CX + Math.cos(i * 2.39996) * Math.sqrt(i) * 16, CY + Math.sin(i * 2.39996) * Math.sqrt(i) * 16];
      x = lerp(x, cl[0], toCluster); y = lerp(y, cl[1], toCluster);
    } else {
      [x, y] = JERSEY.pts[i]; a = toJersey;
    }
    if (toJersey > 0 && i < JERSEY.pts.length) { x = lerp(x, JERSEY.pts[i][0], toJersey); y = lerp(y, JERSEY.pts[i][1], toJersey); }
    if (i >= JERSEY.pts.length && toJersey > 0) a *= 1 - toJersey;
    const pulse = i === 0 && toBus === 0 ? breath : 1 + 0.12 * Math.sin((t - T.expectativa) * Math.PI * 2 * 1.6) * toCluster * (1 - toJersey);
    const d = Math.hypot(x - CX, y - CY);
    const isTeal = tw(t, T.honrar - 0.1 + d / 900, 0.3);
    const col = isTeal > 0.5 ? C.teal : i <= 8 ? WHITE : C.text2;
    dot(ctx, x, y, (i === 0 ? 14 * pulse : 9 * pulse) * lerp(1, 0.75, toJersey), col, a);
  }
  // jersey outline
  if (toJersey > 0.002) {
    ctx.save(); ctx.globalAlpha = toJersey * 0.9; ctx.strokeStyle = teal > 0.5 ? C.teal : C.border; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); JERSEY.path.forEach(([px, py], i) => (i ? ctx.lineTo(CX + px * 1.08, CY + py * 1.06) : ctx.moveTo(CX + px * 1.08, CY + py * 1.06))); ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
}

// ---------- climb: flag, stands, the drums ----------
function beatPulse(t, t0) {
  if (t < t0) return 0;
  const ph = ((t - t0) % BEAT) / BEAT;
  return Math.exp(-ph * 7);
}
function climb(ctx, t) {
  if (t < T.cores - 0.25 || t > B.lance[0] + 0.6) return;
  const toFlag = tw(t, T.cores - 0.2, 0.7);
  const flagUp = tw(t, T.voz - 0.15, 0.7);
  const toLance = tw(t, B.lance[0], 0.55, expoInOut);
  const fa = 1 - toLance;
  // flag (from the jersey dots)
  FLAG.forEach(([fx, fy, c], i) => {
    const j = JERSEY.pts[i % JERSEY.pts.length];
    const wave = 10 * Math.sin(c * 0.45 - (t - T.cores) * 4) * (c / 24);
    let x = lerp(j[0], fx + 60, toFlag), y = lerp(j[1], fy + wave, toFlag);
    x = lerp(x, CX + (fx + 60 - CX) * 0.55, flagUp); y = lerp(y, 160 + (fy - 250) * 0.55 + wave * 0.55, flagUp);
    const a = (i < JERSEY.pts.length ? 1 : toFlag) * fa;
    dot(ctx, x, y, lerp(6.5, 4.5, flagUp), C.teal, a);
  });
  if (toFlag > 0.5) {
    const px = lerp(752, CX + (752 - CX) * 0.55, flagUp);
    line(ctx, px, lerp(240, 150, flagUp), px, lerp(560, 340, flagUp), 3, C.text2, (toFlag - 0.5) * 2 * fa);
  }
  // stands
  const sa = sp(t, T.voz - 0.05, 12);
  if (sa > 0.002) {
    const drum = beatPulse(t, T.voz);
    const rise = 12 * spring(t - T.segundo, 10);
    STANDS.forEach(([x, y, , r], i) => {
      const tin = T.voz - 0.1 + r * 0.12 + hash(i, 2) * 0.25;
      const a = tw(t, tin, 0.35) * sa;
      const bob = drum * (2 + 3 * hash(i, 7)) + rise;
      const [lx, ly] = CROWD_LANCE[i];
      dot(ctx, lerp(x, lx, toLance), lerp(y - bob, ly, toLance), lerp(6 + drum * 1.5, 4.5, toLance), ours(i) ? C.teal : C.text, a);
    });
  }
}

// ---------- the decisive play ----------
export function liveCard(ctx, x, y, w, score, a = 1, { live = true } = {}) {
  if (a <= 0.002) return;
  const h = 150;
  box(ctx, x, y, w, h, { r: 20, lw: 2, stroke: live ? C.live : C.border, fill: C.s1, a });
  if (live) {
    dot(ctx, x + 28, y + 32, 6, C.live, a);
    text(ctx, L('AO VIVO', 'LIVE'), x + 44, y + 40, { size: 22, weight: 700, track: 0.12, color: C.live, a });
  }
  text(ctx, L('Basquete Masculino', "Men's Basketball"), x + w - 24, y + 40, { size: 22, weight: 600, color: C.text2, align: 'right', a });
  shield(ctx, x + 70, y + 96, 30, { ringColor: C.teal, a });
  shield(ctx, x + w - 70, y + 96, 30, { a });
  tabular(ctx, score, x + w / 2, y + 116, { size: 58, weight: 900, align: 'center', a });
  text(ctx, 'Búfalos', x + 70, y + h - 8, { size: 22, weight: 700, color: C.teal, align: 'center', a });
  text(ctx, 'Imortal', x + w - 70, y + h - 8, { size: 22, weight: 700, color: C.text2, align: 'center', a });
}
const PLAYERS = [
  [1090, 520, 1], [1180, 360, 1], [980, 300, 1], [1000, 610, 1], [1240, 600, 1],
  [1150, 470, 0], [1230, 400, 0], [1060, 380, 0], [1120, 590, 0], [1290, 520, 0],
];
function court(ctx, a) {
  const { x, y, w, h } = COURT;
  box(ctx, x, y, w, h, { r: 4, lw: 2.5, stroke: C.border, fill: C.s1, a });
  line(ctx, x + w / 2, y, x + w / 2, y + h, 2, C.border, a);
  ring(ctx, x + w / 2, y + h / 2, 56, 2, C.border, a);
  for (const side of [0, 1]) {
    const hx = side ? x + w - 46 : x + 46;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.beginPath();
    ctx.arc(side ? x + w : x, y + h / 2, 170, side ? Math.PI * 0.5 : -Math.PI * 0.5, side ? Math.PI * 1.5 : Math.PI * 0.5);
    ctx.stroke(); ctx.restore();
    line(ctx, side ? x + w - 22 : x + 22, y + h / 2 - 34, side ? x + w - 22 : x + 22, y + h / 2 + 34, 3, WHITE, a);
    ring(ctx, hx, y + h / 2, 15, 2.5, WHITE, a);
  }
}
export function lanceState(t) {
  const L0 = B.lance[0];
  const shot = L0 + 1.2, freeze = shot + 0.45, resume = freeze + 0.8, swish = resume + 0.32;
  let p;
  if (t < shot) p = 0;
  else if (t < freeze) p = 0.62 * prog(t, shot, freeze);
  else if (t < resume) p = 0.62;
  else p = lerp(0.62, 1, prog(t, resume, swish));
  return { L0, shot, freeze, resume, swish, p };
}
function lance(ctx, t, { scale = 1, ox = 0, oy = 0, a = 1 } = {}) {
  const S = lanceState(t);
  if (t < S.L0 - 0.1 || a <= 0.002) return;
  ctx.save();
  ctx.translate(ox, oy); ctx.translate(CX, CY); ctx.scale(scale, scale); ctx.translate(-CX, -CY);
  const ca = tw(t, S.L0, 0.6) * a;
  court(ctx, ca);
  // players settle, then everything stops during the freeze
  const frozenT = t > S.freeze && t < S.resume ? S.freeze : t;
  PLAYERS.forEach(([px, py, team], i) => {
    const drift = 14 * Math.sin((frozenT - S.L0) * 1.7 + i);
    const pa = sp(t, S.L0 + 0.3 + i * 0.03, 16) * a;
    const celebrate = team ? 10 * spring(t - S.swish, 12) : 0;
    dot(ctx, px + drift * 0.6, py + drift * 0.4 - celebrate, 12, team ? C.teal : C.text, pa);
  });
  // the ball
  const [bx0, by0] = [PLAYERS[0][0] + 14, PLAYERS[0][1] - 12];
  const bx = lerp(bx0, HOOP[0], S.p), by = lerp(by0, HOOP[1], S.p) - 150 * Math.sin(Math.PI * S.p);
  const br = 9 + 7 * Math.sin(Math.PI * S.p);
  if (t < S.swish + 0.25) dot(ctx, bx, by, br, ACCENT, ca);
  const hp = prog(t, S.swish, S.swish + 0.7);
  if (hp > 0 && hp < 1) ring(ctx, HOOP[0], HOOP[1], 16 + 120 * expoOut(hp), 3, ACCENT, (1 - hp) * a);
  ctx.restore();
  // scoreboard (full size only)
  if (scale !== 1) return;
  const flip = tw(t, S.swish, 0.3, expoOut);
  text(ctx, 'BÚFALOS', 960 - 150, 122, { size: 30, weight: 800, track: 0.08, color: C.teal, align: 'right', a: ca });
  text(ctx, 'IMORTAL', 960 + 150, 122, { size: 30, weight: 800, track: 0.08, color: C.text2, a: ca });
  ctx.save(); ctx.beginPath(); ctx.rect(860, 64, 70, 76); ctx.clip();
  tabular(ctx, '70', 930, 130 - flip * 70, { size: 56, weight: 900, align: 'right', a: ca * (1 - flip) });
  tabular(ctx, '72', 930, 130 + (1 - flip) * 70, { size: 56, weight: 900, align: 'right', color: C.teal, a: ca * flip });
  ctx.restore();
  text(ctx, ':', 960, 126, { size: 50, weight: 800, align: 'center', a: ca });
  tabular(ctx, '70', 990, 130, { size: 56, weight: 900, a: ca });
  text(ctx, t < S.swish ? L('4º Q · 00:01', 'Q4 · 00:01') : L('4º Q · 00:00', 'Q4 · 00:00'), 960, 168, { size: 22, weight: 600, track: 0.1, color: C.text2, align: 'center', a: ca });
}
function lanceCrowd(ctx, t, { scale = 1, ox = 0, oy = 0, a = 1 } = {}) {
  const S = lanceState(t);
  if (t < B.lance[0] + 0.55 || a <= 0.002) return; // climb() hands the dots over until then
  const boom = spring(t - S.swish, 12);
  const frozen = t > S.freeze && t < S.resume;
  ctx.save(); ctx.translate(ox, oy); ctx.translate(CX, CY); ctx.scale(scale, scale); ctx.translate(-CX, -CY);
  CROWD_LANCE.forEach(([x, y], i) => {
    const sway = frozen ? 0 : 2 * Math.sin((t - S.L0) * 6 + i);
    const wave = tw(t, S.swish + Math.abs(x - HOOP[0]) / 2200, 0.15);
    const jump = ours(i) ? -12 * wave * (1 - 0.5 * prog(t, S.swish + 0.6, S.swish + 2.5)) : 0;
    dot(ctx, x, y + sway + jump, 4.5 + (ours(i) ? 1.5 * wave : 0), ours(i) ? C.teal : C.text, a * (ours(i) ? 1 : lerp(1, 0.55, boom)));
  });
  ctx.restore();
}

// ---------- reach: the emotion reaching everyone ----------
const VIEWERS = [{ x: 1430, y: 250, kind: 'stands' }, { x: 1430, y: 470, kind: 'side' }, { x: 1430, y: 690, kind: 'phone' }];
export const REACH_CARD = { x: 660, y: 300, w: 600 };
function reach(ctx, t) {
  const [r0, r1] = B.reach;
  if (t < r0 - 0.1 || t > r1 + 0.3) return;
  const shrink = tw(t, r0 - 0.05, 0.7, expoInOut);
  const focus = tw(t, T.informacao - 0.2, 0.8, expoInOut);
  const sideA = 1 - focus;
  const L = { scale: lerp(1, 0.62, shrink), ox: lerp(0, -380, shrink), oy: lerp(0, 10, shrink), a: sideA };
  lance(ctx, t, L);
  lanceCrowd(ctx, t, L);
  const hoop = [(HOOP[0] - CX) * L.scale + CX + L.ox, (HOOP[1] - CY) * L.scale + CY + L.oy];
  VIEWERS.forEach((v, k) => {
    const a = sp(t, T.emocao - 0.1 + k * 0.25, 18);
    if (a <= 0.002) return;
    const got = tw(t, T.todo + 0.45 + k * 0.15, 0.2);
    if (v.kind === 'stands') {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) dot(ctx, v.x - 135 + c * 30, v.y - 30 + r * 28, 6, got > 0.5 && (c + r) % 2 ? C.teal : C.text, a * sideA);
    } else if (v.kind === 'side') {
      line(ctx, v.x - 160, v.y + 30, v.x + 160, v.y + 30, 2, C.border, a * sideA);
      for (let c = 0; c < 8; c++) dot(ctx, v.x - 140 + c * 40, v.y, 8, got > 0.5 && c % 3 === 0 ? C.teal : C.text, a * sideA);
    }
    // the information travels from the hoop to every viewer
    const p = tw(t, T.todo + k * 0.15, 0.5, expoInOut);
    if (p > 0 && p < 1) dot(ctx, lerp(hoop[0], v.x - 180, p), lerp(hoop[1], v.y, p) - 60 * Math.sin(Math.PI * p), 7, ACCENT, a);
  });
  // the phone card grows to the center ("a informação na mão")
  const pa = sp(t, T.emocao + 0.4, 18);
  const s = lerp(0.5, 1, focus);
  const x = lerp(1430 - 150, REACH_CARD.x, focus), y = lerp(690 - 75, REACH_CARD.y, focus);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  liveCard(ctx, 0, 0, 600, '72 : 70', pa);
  ctx.restore();
}

export function draw(ctx, t) {
  if (t < B.people[0] || t > B.reach[1] + 0.3) return;
  people(ctx, t);
  climb(ctx, t);
  if (t >= B.lance[0] && t < B.reach[0] - 0.05) { lance(ctx, t); lanceCrowd(ctx, t); }
  reach(ctx, t);
}
