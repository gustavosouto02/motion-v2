// CAPÍTULO 4 · PACE — the score becomes a record and travels to the panel and the app; PACE.;
// ORGANIZAR (real admin screens), REGISTRAR (digital scoresheet), ACOMPANHAR (real iOS screens);
// the opening questions find their answers; three pieces, one play; signature and end card.
import { createCanvas } from '@napi-rs/canvas';
import {
  C, WHITE, ACCENT, BG, dot, ring, line, text, textW, tabular, box, rrect, sp, spIO, tw, prog, lerp, clamp,
  expoIn, expoOut, expoInOut, spring, hash, stateIcon, sampleText, featureLabel, rgba,
} from '../core.js';
import { B, T } from '../timeline.js';
import { L, num, ord } from '../i18n.js';
import { img, SCREENS, drawCover, phone, laptop, cursor, shield, view } from '../lib.js';
import { liveCard, REACH_CARD } from './c3.js';

// ---------- shared ----------
function wordmarkLayout(ctx, size, cx = 960, baseline = 540) {
  const wText = textW(ctx, 'PACE', size, 900);
  const r = size * 0.092, gap = size * 0.05;
  const x0 = cx - (wText + gap + 2 * r) / 2;
  return { x0, wText, size, baseline, dot: [x0 + wText + gap + r, baseline - r], r };
}
const mctx = createCanvas(10, 10).getContext('2d');
const WM = wordmarkLayout(mctx, 220, 960, 540);
const LETTERS = sampleText('PACE', { size: 220, weight: 900, cx: WM.x0 + WM.wText / 2, baseline: 540, step: 17 }).pts;

function tapLime(ctx, x, y, t, beat) {
  const appear = sp(t, beat - 0.25, 24) * (1 - tw(t, beat + 0.3, 0.2, expoIn));
  if (appear <= 0.002) return;
  const press = 1 - 0.25 * spIO(t, beat, beat + 0.12, 40, 30);
  dot(ctx, x, y, 13 * press * appear, ACCENT, 0.9 * appear);
  const rp = prog(t, beat, beat + 0.45);
  if (rp > 0 && rp < 1) ring(ctx, x, y, 16 + 30 * expoOut(rp), 2.5, ACCENT, (1 - rp) * appear);
}
function deviceIcon(ctx, kind, x, y, s, a, color = C.border) {
  if (a <= 0.002) return;
  if (kind === 'laptop') {
    box(ctx, x - 70 * s, y - 46 * s, 140 * s, 88 * s, { r: 8 * s, lw: 3, stroke: color, fill: C.s1, a });
    line(ctx, x - 90 * s, y + 52 * s, x + 90 * s, y + 52 * s, 3, color, a);
  } else {
    box(ctx, x - 34 * s, y - 62 * s, 68 * s, 124 * s, { r: 14 * s, lw: 3, stroke: color, fill: C.s1, a });
    if (kind === 'sumula') { for (let k = 0; k < 3; k++) line(ctx, x - 18 * s, y - 20 * s + k * 18 * s, x + 18 * s, y - 20 * s + k * 18 * s, 2, C.text2, a); }
    else dot(ctx, x, y - 20 * s, 8 * s, C.live, a);
  }
}
// map a point (pu, pv) of an image drawn with drawCover(rect, {u, v, z}) to the screen
function mapPt(im, R, V, pu, pv) {
  const s = Math.max(R.w / im.width, R.h / im.height) * V.z;
  const dw = im.width * s, dh = im.height * s;
  const dx = Math.min(R.x, Math.max(R.x + R.w - dw, R.x + R.w / 2 - V.u * dw));
  const dy = Math.min(R.y, Math.max(R.y + R.h - dh, R.y + R.h / 2 - V.v * dh));
  return [dx + pu * dw, dy + pv * dh];
}

// ---------- reveal ----------
function reveal(ctx, t) {
  const [v0, v1] = B.reveal;
  if (t < v0 - 0.1 || t > v1 + 0.5) return;
  const toRow = tw(t, v0 + 0.1, 0.6);
  const spread = tw(t, v0 + 0.7, 0.7, expoOut);
  const collapse = tw(t, T.pace - 0.55, 0.45, expoIn);
  const out = tw(t, v1 - 0.15, 0.4, expoIn);
  if (collapse < 1) {
    // the live card turns into a record row
    ctx.save(); ctx.translate(REACH_CARD.x, REACH_CARD.y);
    liveCard(ctx, 0, 0, REACH_CARD.w, '72 : 70', 1 - toRow);
    ctx.restore();
    const rowA = toRow * (1 - collapse);
    const rw = 560, rx = 960 - rw / 2, ry = lerp(380, 444, spread);
    box(ctx, rx, ry, rw, 72, { r: 14, lw: 2, stroke: C.success, fill: C.s2, a: rowA });
    stateIcon(ctx, 'success', rx + 34, ry + 36, 22, C.success, rowA);
    text(ctx, 'Búfalos 72 : 70 Imortal', rx + 64, ry + 46, { size: 28, weight: 700, a: rowA });
    text(ctx, L('registrado', 'logged'), rx + rw - 22, ry + 46, { size: 22, weight: 600, color: C.success, align: 'right', a: rowA });
    // it travels: scoresheet → panel and app
    const da = spread * (1 - collapse);
    deviceIcon(ctx, 'sumula', 960, 640, 1, da);
    deviceIcon(ctx, 'laptop', 520, 450, 1, da);
    deviceIcon(ctx, 'phone', 1400, 450, 1, da);
    text(ctx, L('súmula', 'scoresheet'), 960, 740, { size: 22, weight: 600, track: 0.12, color: C.text2, align: 'center', a: da });
    text(ctx, L('painel', 'dashboard'), 520, 540, { size: 22, weight: 600, track: 0.12, color: C.text2, align: 'center', a: da });
    text(ctx, 'app', 1400, 540, { size: 22, weight: 600, track: 0.12, color: C.text2, align: 'center', a: da });
    for (const [tx_, ty_, d] of [[600, 450, 0], [1320, 450, 0.15]]) {
      const p = tw(t, v0 + 1.3 + d, 0.6, expoInOut);
      line(ctx, 960, 600, lerp(960, tx_, p), lerp(600, ty_, p), 2, ACCENT, da * 0.8);
      if (p > 0 && p < 1) dot(ctx, lerp(960, tx_, p), lerp(600, ty_, p), 7, ACCENT, da);
    }
  }
  // everything collapses into the lime dot, which becomes the full stop of PACE.
  const m = sp(t, T.pace - 0.05, 13);
  const wipe = tw(t, T.pace, 0.55, expoOut);
  const dotA = sp(t, T.pace - 0.5, 20) * (1 - out);
  dot(ctx, lerp(960, WM.dot[0], m), lerp(480, WM.dot[1], m), lerp(16, WM.r, m), ACCENT, dotA);
  if (wipe > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(WM.x0 - 20, 300, (WM.wText + 40) * wipe, 300); ctx.clip();
    text(ctx, 'PACE', WM.x0, WM.baseline, { size: 220, weight: 900, a: 1 - out });
    ctx.restore();
  }
  const la = sp(t, T.planejamento - 0.1, 18) * (1 - out);
  text(ctx, L('ORGANIZAR · REGISTRAR · ACOMPANHAR', 'ORGANIZE · RECORD · FOLLOW'), 960, 650, { size: 30, weight: 600, track: 0.2, color: C.text2, align: 'center', a: la });
}

// ---------- organize: the real admin panel ----------
const LAP = { x: 440, y: 150, w: 1040, h: 654 };
const P = (x, y) => [x / 1512, y / 951]; // points measured on the 1512×951 grid
const SIDEBAR = { atleticas: P(80, 439), modalidades: P(92, 599), quadras: P(79, 631), chave: P(98, 375), crono: P(93, 343), publicado: P(303, 127) };
function organize(ctx, t) {
  const [o0, o1] = B.organize;
  if (t < o0 - 0.1 || t > o1 + 0.4) return;
  featureLabel(ctx, L('ORGANIZAR', 'ORGANIZE'), 150, 122, t, o0 + 0.1, o1 - 0.3);
  const a = sp(t, o0, 16) * (1 - tw(t, o1 - 0.2, 0.4, expoIn));
  const S = laptop(ctx, LAP.x, LAP.y + (1 - a) * 30, LAP.w, LAP.h, a);
  const onChave = t >= T.chaveamento - 0.05 && t < T.cronograma - 0.05;
  const im = img(onChave ? SCREENS.macChave : SCREENS.macCrono);
  const V = view(t, [
    [o0, { u: 0.5, v: 0.5, z: 1 }],
    [T.atleticas - 0.9, { u: 0.14, v: 0.6, z: 2.0 }],
    [T.chaveamento - 0.05, { u: 0.32, v: 0.25, z: 1.6 }],
    [T.cronograma - 0.05, { u: 0.33, v: 0.36, z: 1.6 }],
    [T.revisou - 0.2, { u: 0.84, v: 0.3, z: 1.6 }],
    [T.publicou - 0.35, { u: 0.22, v: 0.16, z: 2.1 }],
    [o1 - 0.6, { u: 0.5, v: 0.5, z: 1 }],
  ], 7);
  drawCover(ctx, im, S.x, S.y, S.w, S.h, { ...V, r: 6, a });
  // highlights drawn on top of the real screens
  const hi = (x0, y0, x1, y1, tt, color = ACCENT) => {
    const ha = spIO(t, tt, tt + 1.6, 22, 10) * a;
    if (ha <= 0.002) return;
    const [ax, ay] = mapPt(im, S, V, x0 / 1512, y0 / 951), [bx, by] = mapPt(im, S, V, x1 / 1512, y1 / 951);
    ctx.save(); rrect(ctx, S.x, S.y, S.w, S.h, 6); ctx.clip();
    box(ctx, ax - 4, ay - 4, bx - ax + 8, by - ay + 8, { r: 10, lw: 3, stroke: color, a: ha });
    ctx.restore();
  };
  if (onChave) {
    hi(264, 167, 488, 250, T.chaveamento + 0.25);
    hi(264, 267, 488, 350, T.chaveamento + 0.55);
    hi(536, 217, 760, 300, T.chaveamento + 0.9);
  } else if (t > T.cronograma - 0.05) {
    hi(324, 261, 519, 351, T.cronograma + 0.2);
    hi(324, 357, 519, 447, T.cronograma + 0.45);
    hi(324, 453, 519, 543, T.cronograma + 0.7);
    hi(524, 261, 719, 351, T.cronograma + 0.95);
    hi(1068, 118, 1495, 225, T.revisou - 0.05);
  }
  // the cursor walks the flow
  const cp = view(t, [
    [o0, { u: 0.55, v: 0.55 }],
    [T.atleticas - 0.35, { u: SIDEBAR.atleticas[0], v: SIDEBAR.atleticas[1] }],
    [T.modalidades - 0.35, { u: SIDEBAR.modalidades[0], v: SIDEBAR.modalidades[1] }],
    [T.quadras - 0.35, { u: SIDEBAR.quadras[0], v: SIDEBAR.quadras[1] }],
    [T.chaveamento - 0.55, { u: SIDEBAR.chave[0], v: SIDEBAR.chave[1] }],
    [T.chaveamento + 0.2, { u: 0.4, v: 0.32 }],
    [T.cronograma - 0.55, { u: SIDEBAR.crono[0], v: SIDEBAR.crono[1] }],
    [T.cronograma + 0.2, { u: 0.3, v: 0.36 }],
    [T.revisou - 0.2, { u: 0.8, v: 0.18 }],
    [T.publicou - 0.45, { u: SIDEBAR.publicado[0], v: SIDEBAR.publicado[1] }],
  ], 11);
  const [cx, cy] = mapPt(im, S, V, cp.u, cp.v);
  const ca = sp(t, o0 + 0.9, 18) * a * (1 - tw(t, o1 - 0.5, 0.3, expoIn));
  ctx.save(); rrect(ctx, S.x, S.y, S.w, S.h, 6); ctx.clip();
  cursor(ctx, cx, cy, t, [T.atleticas, T.modalidades, T.quadras, T.chaveamento - 0.1, T.cronograma - 0.1, T.publicou], ca);
  // "Publicou." — a success stamp next to the badge
  const pa = spIO(t, T.publicou + 0.05, o1 - 0.5, 22, 12) * a;
  if (pa > 0.002) {
    const [bx, by] = mapPt(im, S, V, 345 / 1512, 127 / 951);
    box(ctx, bx + 30, by - 30, 220, 60, { r: 30, lw: 0, stroke: null, fill: C.success, a: pa });
    stateIcon(ctx, 'success', bx + 64, by, 26, C.onLime, pa);
    text(ctx, L('Publicado', 'Published'), bx + 88, by + 10, { size: 26, weight: 800, color: C.onLime, a: pa });
  }
  ctx.restore();
}

// ---------- record: the digital scoresheet ----------
const REC_PHONE = { x: 760, y: 108, w: 400, h: 744 };
const ROSTER = ['#4  Caio Rocha', '#7  Davi Nunes', '#9  Léo Martins', '#11  Rafa Souza', '#15  Theo Lima'];
function record(ctx, t) {
  const [r0, r1] = B.record;
  if (t < r0 - 0.1 || t > r1 + 0.4) return;
  featureLabel(ctx, L('REGISTRAR', 'RECORD'), 150, 122, t, r0 + 0.1, r1 - 0.3);
  const a = sp(t, r0, 16) * (1 - tw(t, r1 - 0.2, 0.4, expoIn));
  // the paper scoresheet beside it, until it turns into dots
  const paperOut = tw(t, T.folha - 0.1, 0.6);
  const pa = sp(t, r0 + 0.2, 16) * (1 - tw(t, r1 - 0.2, 0.3, expoIn));
  const PR = { x: 210, y: 220, w: 400, h: 520 };
  if (paperOut < 1) drawCover(ctx, img('sumula_final.png'), PR.x, PR.y, PR.w, PR.h, { u: 0.5, v: 0.4, z: 1, r: 10, a: pa * (1 - paperOut) });
  if (paperOut > 0 && paperOut < 1) for (let k = 0; k < 90; k++) {
    const x0 = PR.x + hash(k, 1) * PR.w, y0 = PR.y + hash(k, 2) * PR.h;
    const d = clamp(paperOut * 1.5 - hash(k, 3) * 0.5);
    dot(ctx, lerp(x0, x0 - 60, d), lerp(y0, y0 + 30, d), 3.5, WHITE, pa * (1 - d));
  }
  const S = phone(ctx, REC_PHONE.x, REC_PHONE.y + (1 - a) * 30, REC_PHONE.w, REC_PHONE.h, a);
  ctx.save(); rrect(ctx, S.x, S.y, S.w, S.h, S.r); ctx.clip();
  text(ctx, L('Súmula digital', 'Digital scoresheet'), S.x + 24, S.y + 54, { size: 30, weight: 800, a });
  text(ctx, L('Basquete Masculino · Final', "Men's Basketball · Final"), S.x + 24, S.y + 86, { size: 22, weight: 500, color: C.text2, a });
  // score
  const flip = tw(t, T.placar - 0.1, 0.3, expoOut);
  const ok = sp(t, T.trocado - 0.1, 20);
  const cy = S.y + 116;
  box(ctx, S.x + 18, cy, S.w - 36, 150, { r: 18, lw: 2, stroke: ok > 0.5 ? C.success : C.sep, fill: C.s1, a });
  shield(ctx, S.x + 70, cy + 70, 28, { ringColor: C.teal, a });
  shield(ctx, S.x + S.w - 70, cy + 70, 28, { a });
  text(ctx, 'Búfalos', S.x + 70, cy + 130, { size: 22, weight: 700, color: C.teal, align: 'center', a });
  text(ctx, 'Imortal', S.x + S.w - 70, cy + 130, { size: 22, weight: 700, color: C.text2, align: 'center', a });
  ctx.save(); ctx.beginPath(); ctx.rect(S.x + 120, cy + 30, 66, 80); ctx.clip();
  tabular(ctx, '70', S.x + 184, cy + 94 - flip * 70, { size: 54, weight: 900, align: 'right', a: a * (1 - flip) });
  tabular(ctx, '72', S.x + 184, cy + 94 + (1 - flip) * 70, { size: 54, weight: 900, align: 'right', color: C.teal, a: a * flip });
  ctx.restore();
  text(ctx, ':', S.x + S.w / 2, cy + 90, { size: 46, weight: 800, align: 'center', a });
  tabular(ctx, '70', S.x + S.w - 184, cy + 94, { size: 54, weight: 900, a });
  if (ok > 0.002) stateIcon(ctx, 'success', S.x + S.w / 2, cy + 128, 20, C.success, ok * a);
  // roster
  text(ctx, L('BÚFALOS · EM QUADRA', 'BÚFALOS · ON COURT'), S.x + 24, S.y + 304, { size: 22, weight: 700, track: 0.12, color: C.text2, a });
  const sel = sp(t, T.registra - 0.1, 20);
  ROSTER.forEach((n, i) => {
    const y = S.y + 318 + i * 52;
    const chosen = i === 2 && sel > 0.5;
    box(ctx, S.x + 18, y, S.w - 36, 44, { r: 12, lw: chosen ? 2 : 0, stroke: chosen ? ACCENT : null, fill: chosen ? C.s3 : C.s1, a });
    text(ctx, n, S.x + 38, y + 30, { size: 24, weight: 600, a });
  });
  // actions
  const tapped = t > T.toque - 0.02;
  ['+1', '+2', '+3'].forEach((lab, k) => {
    const bw = (S.w - 36 - 24) / 3, bx = S.x + 18 + k * (bw + 12), by = S.y + S.h - 140;
    const on = k === 1 && tapped && t < T.toque + 0.9;
    box(ctx, bx, by, bw, 62, { r: 14, lw: on ? 0 : 1.5, stroke: on ? null : C.sep, fill: on ? ACCENT : C.s2, a });
    text(ctx, lab, bx + bw / 2, by + 42, { size: 30, weight: 800, color: on ? C.onLime : C.text, align: 'center', a });
    if (k === 1) tapLime(ctx, bx + bw / 2, by + 31, t, T.toque);
  });
  const st = sp(t, T.sistema - 0.1, 20) * a;
  stateIcon(ctx, 'success', S.x + 40, S.y + S.h - 50, 20, C.success, st);
  text(ctx, L('registrado · sincronizado', 'logged · synced'), S.x + 60, S.y + S.h - 42, { size: 22, weight: 600, color: C.success, a: st });
  ctx.restore();
  // "já tá no sistema": the record leaves the phone for the panel and the app
  const sa = sp(t, T.sistema - 0.2, 18) * a;
  deviceIcon(ctx, 'laptop', 1500, 330, 0.9, sa);
  deviceIcon(ctx, 'phone', 1500, 610, 0.9, sa);
  for (const [ty, d] of [[330, 0], [610, 0.12]]) {
    const p = tw(t, T.sistema + d, 0.5, expoInOut);
    const x0 = REC_PHONE.x + REC_PHONE.w + 10;
    if (p > 0) line(ctx, x0, 470, lerp(x0, 1410, p), lerp(470, ty, p), 2, ACCENT, sa * 0.8);
    if (p > 0 && p < 1) dot(ctx, lerp(x0, 1410, p), lerp(470, ty, p), 7, ACCENT, sa);
  }
}

// ---------- follow: the real fan app ----------
const FPH = { x: 780, y: 100, w: 360, h: 760 };
function follow(ctx, t) {
  const [f0, f1] = B.follow;
  if (t < f0 - 0.1 || t > f1 + 0.4) return;
  featureLabel(ctx, L('ACOMPANHAR', 'FOLLOW'), 150, 122, t, f0 + 0.1, f1 - 0.3);
  const a = sp(t, f0, 16) * (1 - tw(t, f1 - 0.2, 0.4, expoIn));
  const S = phone(ctx, FPH.x, FPH.y + (1 - a) * 30, FPH.w, FPH.h, a);
  const taps = { tab: T.app + 0.45, filter: T.agenda - 0.15, chip: T.agenda + 0.4, ok: T.agenda + 0.85, banner: T.mudar + 0.95 };
  const seq = [
    [f0 - 1, SCREENS.home], [taps.tab + 0.1, SCREENS.crono], [taps.filter + 0.1, SCREENS.filtros],
    [taps.ok + 0.1, SCREENS.cronoF], [taps.banner + 0.1, SCREENS.notif],
  ];
  let cur = 0;
  seq.forEach(([tt], i) => { if (t >= tt) cur = i; });
  ctx.save(); rrect(ctx, S.x, S.y, S.w, S.h, S.r); ctx.clip();
  // push transition: the new screen slides in over the previous one
  const sIn = cur > 0 ? tw(t, seq[cur][0], 0.35, expoOut) : 1;
  if (cur > 0 && sIn < 1) drawCover(ctx, img(seq[cur - 1][1]), S.x - sIn * 90, S.y, S.w, S.h, { v: 0, a });
  drawCover(ctx, img(seq[cur][1]), S.x + (1 - sIn) * S.w, S.y, S.w, S.h, { v: 0, a });
  // screen-space helper: screens are drawn width-fit and top-aligned
  const sc = S.w / 1206;
  const at_ = (u, v) => [S.x + u * S.w, S.y + v * 2622 * sc];
  // the bracket card (recreated in the app's style; there is no bracket screen in the folder)
  const bc = spIO(t, T.chave - 0.15, T.vivo - 0.35, 18, 18) * a;
  if (bc > 0.002) {
    const y = S.y + S.h - 330 * bc;
    box(ctx, S.x + 10, y, S.w - 20, 320, { r: 24, lw: 1.5, stroke: C.sep, fill: C.s1, a: bc });
    text(ctx, L('Chaveamento', 'Bracket'), S.x + 32, y + 44, { size: 24, weight: 800, a: bc });
    text(ctx, L('Basquete Masculino · Série Ouro', "Men's Basketball · Gold"), S.x + 32, y + 74, { size: 22, weight: 500, color: C.text2, a: bc });
    const rows = [['Búfalos', 1], ['Lobos', 0], ['Imortal', 0], ['Falcões', 0]];
    rows.forEach(([n, ours], i) => {
      const yy = y + 104 + i * 46 + (i > 1 ? 14 : 0);
      box(ctx, S.x + 28, yy, 150, 38, { r: 10, lw: ours ? 2 : 0, stroke: ours ? C.teal : null, fill: C.s2, a: bc });
      text(ctx, n, S.x + 42, yy + 27, { size: 22, weight: 700, color: ours ? C.teal : C.text, a: bc });
    });
    line(ctx, S.x + 178, y + 123, S.x + 205, y + 123, 2, C.teal, bc); line(ctx, S.x + 205, y + 123, S.x + 205, y + 192, 2, C.teal, bc);
    line(ctx, S.x + 178, y + 261, S.x + 205, y + 261, 2, C.border, bc); line(ctx, S.x + 205, y + 230, S.x + 205, y + 261, 2, C.border, bc);
    box(ctx, S.x + 215, y + 192, 112, 38, { r: 10, lw: 2, stroke: C.teal, fill: C.s2, a: bc });
    text(ctx, 'Final', S.x + 271, y + 219, { size: 22, weight: 700, color: C.teal, align: 'center', a: bc });
  }
  // live highlight on the filtered schedule's AO VIVO card
  const lv = spIO(t, T.vivo - 0.05, T.mudar - 0.4, 22, 14) * a;
  if (lv > 0.002) {
    const [x0, y0] = at_(0.055, 0.258), [x1, y1] = at_(0.79, 0.436);
    box(ctx, x0, y0, x1 - x0, y1 - y0, { r: 18, lw: 3, stroke: C.live, a: lv * (0.6 + 0.4 * Math.cos((t - T.vivo) * Math.PI * 2)) });
  }
  // the venue change: a banner drops, a tap opens the notifications
  const bn = spIO(t, T.mudar - 0.3, taps.banner + 0.05, 20, 30) * a;
  if (bn > 0.002) {
    const y = S.y + 40 - (1 - bn) * 140;
    box(ctx, S.x + 10, y, S.w - 20, 116, { r: 22, lw: 1.5, stroke: C.border, fill: C.s2, a: bn });
    stateIcon(ctx, 'warn', S.x + 40, y + 40, 22, C.warn, bn);
    text(ctx, L('Mudança de local', 'Venue change'), S.x + 62, y + 48, { size: 24, weight: 800, a: bn });
    text(ctx, L('Futsal Feminino → Ginásio', "Women's Futsal → Main"), S.x + 30, y + 80, { size: 22, weight: 500, color: C.text2, a: bn });
    text(ctx, L('Principal · 18:00', 'Gym · 18:00'), S.x + 30, y + 104, { size: 22, weight: 500, color: C.text2, a: bn });
  }
  const nh = sp(t, T.sabendo - 0.1, 20) * a * (t > taps.banner + 0.3 ? 1 : 0);
  if (nh > 0.002) {
    const [x0, y0] = at_(0.02, 0.362), [x1, y1] = at_(0.98, 0.462);
    box(ctx, x0, y0, x1 - x0, y1 - y0, { r: 14, lw: 3, stroke: C.warn, a: nh });
  }
  // taps (lime)
  const tapAt = (u, v, tt) => { const [x, y] = at_(u, v); tapLime(ctx, x, y, t, tt); };
  tapLime(ctx, S.x + 0.38 * S.w, S.y + S.h - 48, t, taps.tab);
  tapAt(0.865, 0.102, taps.filter);
  tapAt(0.307, 0.448, taps.chip);
  tapAt(0.872, 0.11, taps.ok);
  tapLime(ctx, S.x + S.w / 2, S.y + 98, t, taps.banner);
  ctx.restore();
  // what is on screen, said in words on the left
  const notes = [[T.agenda - 0.1, T.chave - 0.2, L('A AGENDA DA SUA ATLÉTICA', "YOUR ATHLETIC'S SCHEDULE"), C.text], [T.chave - 0.1, T.vivo - 0.2, L('O CAMINHO NA CHAVE', 'THE PATH THROUGH THE BRACKET'), C.teal],
    [T.vivo - 0.1, T.mudar - 0.2, L('● PLACAR AO VIVO', '● LIVE SCORE'), C.live], [T.mudar - 0.1, f1 - 0.4, L('▲ MUDANÇA DE LOCAL', '▲ VENUE CHANGE'), C.warn]];
  notes.forEach(([n0, n1, s, col]) => {
    const na = spIO(t, n0, n1, 20, 24) * a;
    if (na > 0.002) text(ctx, s, 720, 480 + (1 - na) * 12, { size: 28, weight: 700, track: 0.12, color: col, align: 'right', a: na });
  });
}

// ---------- answers ----------
const QA = [
  { q: L('Qual é o horário do jogo?', 'What time is the game?'), src: SCREENS.cronoF, v0: 0.235, v1: 0.43 },
  { q: L('Mudaram a quadra?', 'Did they change the court?'), src: SCREENS.notif, v0: 0.355, v1: 0.462 },
  { q: L('Esse placar está certo?', 'Is this score right?'), src: SCREENS.home, v0: 0.255, v1: 0.548 },
  { q: L('Quem está com a súmula?', 'Who has the scoresheet?'), src: null },
];
const CROP_W = 400;
function answers(ctx, t) {
  const [a0, a1] = B.answers;
  if (t < a0 - 0.1 || t > a1 + 0.4) return;
  const rowsOut = tw(t, T.organizar - 0.45, 0.35, expoIn);
  let y = 132;
  QA.forEach((row, i) => {
    const s0 = a0 + 0.2 + i * 1.05;
    const h = row.src ? (CROP_W / 1206) * (row.v1 - row.v0) * 2622 : 90;
    const qa = sp(t, s0, 22) * (1 - rowsOut);
    const lp = tw(t, s0 + 0.3, 0.3);
    const ca = sp(t, s0 + 0.5, 22) * (1 - rowsOut);
    const mid = y + h / 2;
    const qw = textW(ctx, row.q, 26, 600) + 40;
    box(ctx, 760 - qw, mid - 32, qw, 64, { r: 18, lw: 0, stroke: null, fill: C.s2, a: qa });
    text(ctx, row.q, 760 - qw + 20, mid + 9, { size: 26, weight: 600, a: qa });
    if (qa > 0.002) line(ctx, 780, mid, lerp(780, 1000, lp), mid, 2.5, ACCENT, qa);
    if (lp >= 1) dot(ctx, 1000, mid, 6, ACCENT, qa);
    if (ca > 0.002) {
      if (row.src) {
        const im = img(row.src);
        const sy = row.v0 * im.height, sh = (row.v1 - row.v0) * im.height;
        ctx.save(); ctx.globalAlpha = ca; rrect(ctx, 1020, y, CROP_W, h, 16); ctx.clip();
        ctx.drawImage(im, 0, sy, im.width, sh, 1020, y, CROP_W, h);
        ctx.restore();
        box(ctx, 1020, y, CROP_W, h, { r: 16, lw: 2, stroke: C.border, a: ca });
      } else {
        box(ctx, 1020, y, CROP_W, h, { r: 16, lw: 2, stroke: C.success, fill: C.s1, a: ca });
        stateIcon(ctx, 'success', 1052, y + 45, 24, C.success, ca);
        text(ctx, L('Súmula registrada', 'Scoresheet logged'), 1080, y + 40, { size: 24, weight: 800, a: ca });
        text(ctx, 'Búfalos 72 : 70 Imortal', 1080, y + 70, { size: 22, weight: 600, color: C.text2, a: ca });
      }
    }
    y += Math.max(h, 70) + 26;
  });
  // three pieces, one play
  const pieces = [['laptop', L('ORGANIZAR', 'ORGANIZE'), T.organizar, 560], ['sumula', L('REGISTRAR', 'RECORD'), T.registrar, 960], ['phone', L('ACOMPANHAR', 'FOLLOW'), T.acompanhar, 1360]];
  const out = tw(t, a1 - 0.1, 0.45, expoIn);
  const lp = tw(t, T.tres - 0.1, 0.8, expoInOut);
  if (lp > 0) line(ctx, 560, 430, lerp(560, 1360, lp), 430, 2.5, C.sep, 1 - out);
  pieces.forEach(([k, lab, tt, x]) => {
    const pa = sp(t, tt - 0.08, 20) * (1 - out);
    const hit = Math.exp(-(((t - (T.lance - 0.4 + ((x - 560) / 800) * 0.8)) / 0.18) ** 2));
    deviceIcon(ctx, k, x, 430, 1.2 + 0.1 * hit, pa, hit > 0.3 ? ACCENT : C.border);
    text(ctx, lab, x, 560, { size: 30, weight: 800, track: 0.14, color: t > tt ? ACCENT : C.text, align: 'center', a: pa });
  });
  const dp = tw(t, T.lance - 0.4, 0.8, expoInOut);
  if (dp > 0 && dp < 1) dot(ctx, lerp(560, 1360, dp), 430, 10, ACCENT, 1 - out);
}

// ---------- signature + end card ----------
const STANDS = (() => {
  const pts = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 44; c++) pts.push([250 + c * 33.5 + (r % 2) * 16, 600 + r * 38]);
  return pts;
})();
function sign(ctx, t) {
  const [s0] = B.sign;
  const [e0, e1] = B.end;
  if (t < s0 - 0.1 || t > e1) return;
  const out = tw(t, e1 - 0.6, 0.5, expoIn);
  const toWord = tw(t, T.pace2 - 0.75, 0.75, expoInOut);
  const solid = tw(t, T.pace2 - 0.05, 0.3);
  // the stands, lit, then their dots become the letters
  if (solid < 1) STANDS.forEach(([x, y], i) => {
    const a = tw(t, s0 + (5 - Math.floor(i / 44)) * 0.08 + hash(i, 3) * 0.2, 0.4);
    const L = LETTERS[i % LETTERS.length];
    const bob = 3 * Math.sin((t - s0) * 6 + i) * (1 - toWord);
    dot(ctx, lerp(x, L[0], toWord), lerp(y + bob, L[1], toWord), lerp(6, 5, toWord) * (1 - solid), hash(i, 31) < 0.55 ? C.teal : C.text, a);
  });
  const dA = sp(t, T.pace2 - 0.4, 18) * (1 - out);
  dot(ctx, WM.dot[0], WM.dot[1], WM.r * dA, ACCENT, 1);
  if (solid > 0) text(ctx, 'PACE', WM.x0, WM.baseline, { size: 220, weight: 900, a: solid * (1 - out) });
  const sl = sp(t, e0 + 0.15, 18) * (1 - out);
  text(ctx, L('Seu campeonato no ritmo certo.', 'Your championship at the right pace.'), 960, 650 + (1 - sl) * 12, { size: 40, weight: 600, color: C.text2, align: 'center', a: sl });
}

export function draw(ctx, t) {
  if (t < B.reveal[0] - 0.1) return;
  reveal(ctx, t);
  organize(ctx, t);
  record(ctx, t);
  follow(ctx, t);
  answers(ctx, t);
  sign(ctx, t);
}
