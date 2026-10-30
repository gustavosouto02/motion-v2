// CAPÍTULO 2 · A DIMENSÃO DO CIA — dots become "CIA", Uberaba on the map, game by day and party
// by night, months of preparation; the chain of steps that falls like dominoes; the figures.
import {
  C, WHITE, ACCENT, BG, dot, ring, line, text, textW, tabular, box, sp, spIO, tw, prog, lerp, clamp,
  expoIn, expoOut, expoInOut, spring, hash, stateIcon, sampleText, BR_DOTS, UBERABA,
} from '../core.js';
import { B, T } from '../timeline.js';
import { L, num, ord } from '../i18n.js';
import { chapter } from '../lib.js';

// ---------- CIA + Uberaba ----------
const CIA = sampleText('CIA', { size: 280, weight: 900, cx: 960, baseline: 560, step: 17 }).pts;
const SEEDS = CIA.map((_, i) => {
  const a = hash(i, 4) * Math.PI * 2, d = 1150 + hash(i, 5) * 400;
  return [960 + Math.cos(a) * d, 470 + Math.sin(a) * d];
});
function whistle(ctx, x, y, s, a) {
  if (a <= 0.002) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a; ctx.strokeStyle = WHITE; ctx.lineWidth = 3 / s;
  ctx.beginPath(); ctx.arc(-8, 6, 22, 0, Math.PI * 2);
  ctx.moveTo(4, -14); ctx.lineTo(44, -14); ctx.lineTo(44, 2); ctx.lineTo(12, 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(-8, 6, 6, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
function cia(ctx, t) {
  const [c0, c1] = B.cia;
  if (t < c0 || t > c1 + 0.6) return;
  chapter(ctx, L('02 · A DIMENSÃO DO CIA', '02 · THE SCALE OF CIA'), t, c0 + 0.2, 3.6);
  const toMap = tw(t, T.uberaba - 0.4, 0.6);          // wordmark steps aside
  const toLine = tw(t, T.operacao - 0.3, 0.55, expoIn); // map leaves for the timeline
  const out = tw(t, c1 - 0.15, 0.4, expoIn);
  const solid = tw(t, T.cia + 0.25, 0.35);
  const wmA = (1 - toLine) * (1 - out);
  ctx.save();
  ctx.translate(lerp(0, -560, toMap), lerp(0, -250, toMap));
  ctx.translate(960, 470); ctx.scale(lerp(1, 0.42, toMap), lerp(1, 0.42, toMap)); ctx.translate(-960, -470);
  CIA.forEach(([x, y], i) => {
    const p = tw(t, c0 + 0.1 + hash(i, 6) * 0.6, 1.1, expoOut);
    const r = 5.5 * (1 - solid);
    if (r > 0.1) dot(ctx, lerp(SEEDS[i][0], x, p), lerp(SEEDS[i][1], y, p), r, WHITE, p * wmA);
  });
  if (solid > 0) text(ctx, 'CIA', 960, 560, { size: 280, weight: 900, align: 'center', a: solid * wmA });
  const sa = sp(t, T.copa - 0.05, 20) * wmA;
  text(ctx, 'Copa Inter Atléticas · EXP', 960, 660 + (1 - sa) * 12, { size: 40, weight: 500, track: 0.03, color: C.text2, align: 'center', a: sa });
  ctx.restore();
  // Brazil + Uberaba
  const mapA = toMap * (1 - toLine);
  if (mapA > 0.002) {
    const n = BR_DOTS.length;
    for (let i = 0; i < n; i++) {
      const a = tw(t, T.uberaba - 0.3 + (i / n) * 0.9, 0.25) * mapA;
      dot(ctx, BR_DOTS[i][0] + 170, BR_DOTS[i][1] - 10, 2.3, WHITE, 0.85 * a);
    }
    const [ux, uy] = [UBERABA[0] + 170, UBERABA[1] - 10];
    const pa = sp(t, T.uberaba, 18) * mapA;
    for (let k = 0; k < 4; k++) {
      const p = prog(t, T.uberaba + 0.2 + k * 1.1, T.uberaba + 1.3 + k * 1.1);
      if (p > 0 && p < 1) ring(ctx, ux, uy, 14 + 60 * expoOut(p), 2, ACCENT, (1 - p) * 0.8 * mapA);
    }
    dot(ctx, ux, uy, 11, ACCENT, pa);
    text(ctx, 'UBERABA · MG', ux + 34, uy - 4, { size: 26, weight: 600, track: 0.2, a: pa });
    text(ctx, L('JUNHO', 'JUNE'), ux + 34, uy + 32, { size: 26, weight: 600, track: 0.2, color: ACCENT, a: pa });
    // game by day (a court), party by night (rings)
    const ga = sp(t, T.jogo - 0.05, 20) * mapA;
    if (ga > 0.002) {
      box(ctx, 1520, 600, 170, 100, { r: 2, lw: 2.5, stroke: WHITE, a: ga });
      line(ctx, 1605, 600, 1605, 700, 2, WHITE, ga); ring(ctx, 1605, 650, 20, 2, WHITE, ga);
      text(ctx, L('JOGO DE DIA', 'GAMES BY DAY'), 1605, 740, { size: 22, weight: 600, track: 0.16, color: C.text2, align: 'center', a: ga });
    }
    const fa = sp(t, T.festa - 0.05, 20) * mapA;
    for (let k = 0; k < 4; k++) ring(ctx, 1605, 330, (22 + k * 22) * (0.8 + 0.2 * fa) + 3 * Math.sin((t - T.festa) * 3 - k), 2, WHITE, 0.75 * fa);
    if (fa > 0.002) text(ctx, L('FESTA DE NOITE', 'PARTIES BY NIGHT'), 1605, 450, { size: 22, weight: 600, track: 0.16, color: C.text2, align: 'center', a: fa });
  }
  // months of preparation before the first whistle
  const la = toLine * (1 - out);
  if (la > 0.002) {
    const x0 = 300, x1 = 1500, y = 480;
    const p = tw(t, T.operacao - 0.1, 1.0, expoOut);
    line(ctx, x0, y, lerp(x0, x1, p), y, 3, C.text2, la);
    for (let k = 0; k < 7; k++) {
      const x = lerp(x0, x1, k / 6);
      const ka = tw(t, T.meses - 0.4 + k * 0.12, 0.2) * la;
      dot(ctx, x, y, 7, k === 6 ? ACCENT : WHITE, ka);
    }
    text(ctx, L('MESES DE PREPARAÇÃO', 'MONTHS OF PREPARATION'), (x0 + x1) / 2, y - 40, { size: 24, weight: 600, track: 0.2, color: C.text2, align: 'center', a: sp(t, T.meses, 20) * la });
    const wa = sp(t, T.apito - 0.05, 18) * la;
    whistle(ctx, x1 + 120, y - 6, 1.6, wa);
    const rp = prog(t, T.apito, T.apito + 0.6);
    if (rp > 0 && rp < 1) ring(ctx, x1 + 112, y, 40 + 60 * expoOut(rp), 2, ACCENT, (1 - rp) * la);
    text(ctx, L('1º APITO', '1ST WHISTLE'), x1 + 112, y + 80, { size: 22, weight: 600, track: 0.16, color: ACCENT, align: 'center', a: wa });
  }
}

// ---------- the chain / domino ----------
const WORDS = [L('INSCRIÇÕES', 'REGISTRATIONS'), L('EQUIPES', 'TEAMS'), L('MODALIDADES', 'SPORTS'), L('QUADRAS', 'COURTS'), L('ARBITRAGEM', 'REFEREES'), L('HORÁRIOS', 'SCHEDULES'), L('RESULTADOS', 'RESULTS')];
const TX = (i) => 330 + i * 210, TILE = { w: 64, h: 190, y: 270 };
const CHANGED = 5;
function chain(ctx, t) {
  const [k0, k1] = B.chain;
  if (t < k0 - 0.1 || t > k1 + 0.5) return;
  const out = tw(t, k1 - 0.1, 0.45, expoIn);
  const cues = WORDS.map((_, i) => T['w' + i]);
  const fall0 = T.derruba + 0.05;
  for (let i = 0; i < WORDS.length; i++) {
    const a = sp(t, cues[i] - 0.06, 22) * (1 - out);
    if (a <= 0.002) continue;
    const cx = TX(i), by = TILE.y + TILE.h;
    // connector to the next tile, with the dependency pulse on "etapa"
    if (i < WORDS.length - 1 && t > cues[i + 1] - 0.06) {
      line(ctx, cx + 40, by - 40, TX(i + 1) - 40, by - 40, 2, C.sep, a);
      const pp = prog(t, T.etapa + i * 0.16, T.etapa + i * 0.16 + 0.3);
      if (pp > 0 && pp < 1) dot(ctx, lerp(cx + 40, TX(i + 1) - 40, pp), by - 40, 6, ACCENT, a);
    }
    // the tile falls forward (domino), one after another
    const f = spring(t - fall0 - i * 0.13, 16);
    ctx.save();
    ctx.translate(cx + TILE.w / 2, by); ctx.rotate(f * 1.22); ctx.translate(-(cx + TILE.w / 2), -by);
    const lit = spIO(t, cues[i] - 0.06, cues[i] + 0.5, 24, 10);
    const changed = i === CHANGED && t > T.mudanca - 0.05;
    box(ctx, cx - TILE.w / 2, TILE.y + (1 - a) * 30, TILE.w, TILE.h, { r: 12, lw: 2.5, stroke: changed ? C.warn : lit > 0.3 ? ACCENT : C.border, fill: C.s1, a });
    dot(ctx, cx, TILE.y + 52, 9, changed ? C.warn : WHITE, a);
    dot(ctx, cx, TILE.y + 138, 9, changed ? C.warn : WHITE, a);
    ctx.restore();
    if (changed) stateIcon(ctx, 'warn', cx, TILE.y - 36, 30, C.warn, sp(t, T.mudanca, 20) * a * (1 - f));
    text(ctx, WORDS[i], cx, by + 64, { size: 24, weight: 700, track: 0.08, align: 'center', color: lit > 0.3 ? ACCENT : WHITE, a: a * (1 - 0.5 * f) });
  }
}

// ---------- the figures ----------
const br = num;
function figure(ctx, x, big, label, a, roll = null, t = 0, t0 = 0) {
  if (a <= 0.002) return;
  const shown = roll ? roll(tw(t, t0, 0.8, expoOut)) : big;
  tabular(ctx, shown, x, 470 + (1 - a) * 16, { size: 92, weight: 900, align: 'center', a });
  text(ctx, label, x, 530 + (1 - a) * 16, { size: 26, weight: 600, track: 0.04, color: C.text2, align: 'center', a });
}
function icon(ctx, kind, x, y, a) {
  if (a <= 0.002) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = WHITE; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  if (kind === 'hotel') { ctx.rect(x - 40, y - 6, 80, 30); ctx.moveTo(x - 40, y - 30); ctx.lineTo(x - 40, y + 34); ctx.moveTo(x + 40, y + 24); ctx.lineTo(x + 40, y + 34); ctx.moveTo(x - 13, y - 16); ctx.arc(x - 22, y - 16, 9, 0, Math.PI * 2); }
  else if (kind === 'food') { ctx.moveTo(x - 18, y - 34); ctx.lineTo(x - 18, y + 34); ctx.moveTo(x - 28, y - 34); ctx.lineTo(x - 28, y - 12); ctx.quadraticCurveTo(x - 18, y - 2, x - 8, y - 12); ctx.lineTo(x - 8, y - 34); ctx.moveTo(x + 18, y + 34); ctx.lineTo(x + 18, y - 34); ctx.quadraticCurveTo(x + 34, y - 20, x + 18, y - 2); }
  else { ctx.rect(x - 44, y - 6, 26, 40); ctx.rect(x - 14, y - 34, 28, 68); ctx.rect(x + 18, y - 18, 26, 52); }
  ctx.stroke(); ctx.restore();
}
function numbers(ctx, t) {
  const [n0] = B.numbers;
  if (t < n0 || t > B.question[1]) return;
  const out3 = tw(t, T.fora - 0.3, 0.3, expoIn);
  const s = n0 + 0.2;
  figure(ctx, 470, '16 → 160', L('atléticas · da 1ª à 11ª edição', 'athletics · from the 1st to the 11th edition'), sp(t, s, 20) * (1 - out3));
  figure(ctx, 960, L('6.352', '6,352'), L('atletas · 2026', 'athletes · 2026'), sp(t, s + 1.0, 20) * (1 - out3), (p) => br(6352 * p), t, s + 1.0);
  figure(ctx, 1450, L('~20.000', '~20,000'), L('pessoas por dia · 2026', 'people a day · 2026'), sp(t, s + 2.0, 20) * (1 - out3), (p) => '~' + br(20000 * p), t, s + 2.0);
  // the city: + R$ 30 mi per edition
  const outB = tw(t, T.preparo - 0.3, 0.3, expoIn);
  const ba = sp(t, T.fora, 18) * (1 - outB);
  if (ba > 0.002) {
    text(ctx, L('+ R$ 30 mi', '+ R$ 30M'), 960, 420 + (1 - ba) * 16, { size: 150, weight: 900, align: 'center', a: ba });
    text(ctx, L('movimentados na cidade por edição', 'moved through the city each edition'), 960, 486, { size: 30, weight: 600, align: 'center', a: ba });
    text(ctx, L('estimativa da organização · movimentação econômica, não receita do evento', "organizers' estimate · economic activity, not event revenue"), 960, 528, { size: 22, weight: 500, color: C.text3, align: 'center', a: ba });
    const ic = [['hotel', T.hotel, L('HOTEL', 'HOTELS')], ['food', T.restaurante, L('RESTAURANTE', 'RESTAURANTS')], ['city', T.cidade, L('CIDADE', 'CITY')]];
    ic.forEach(([k, tt, lab], i) => {
      const a = sp(t, tt - 0.05, 20) * (1 - outB);
      icon(ctx, k, 700 + i * 260, 660, a);
      text(ctx, lab, 700 + i * 260, 730, { size: 22, weight: 600, track: 0.16, color: C.text2, align: 'center', a });
    });
  }
  // months of preparation squeezed into a few days
  const qa = tw(t, T.preparo - 0.1, 0.3) * (1 - tw(t, B.question[0] + 0.2, 0.5, expoIn));
  if (qa > 0.002) {
    const squeeze = tw(t, T.poucos - 0.1, 0.7, expoInOut);
    const N = 120;
    for (let k = 0; k < N; k++) {
      const x0 = 300 + (k / (N - 1)) * 1320;
      const xt = 900 + (k % 4) * 40;
      const lit = tw(t, T.preparo + (k / N) * 1.2, 0.15);
      const keep = squeeze > 0.6 ? (k < 4 ? 1 : 0) : 1;
      dot(ctx, lerp(x0, xt, squeeze), 470, lerp(5, 14, squeeze), squeeze > 0.6 ? ACCENT : WHITE, qa * Math.max(0.25, lit) * keep);
    }
    text(ctx, L('MESES', 'MONTHS'), 960, 410, { size: 24, weight: 600, track: 0.2, color: C.text2, align: 'center', a: qa * (1 - squeeze) });
    text(ctx, L('4 DIAS', '4 DAYS'), 960, 550, { size: 30, weight: 700, track: 0.2, color: ACCENT, align: 'center', a: qa * squeeze });
  }
}

// ---------- the question: everything stops, one dot remains ----------
function question(ctx, t) {
  const [q0, q1] = B.question;
  if (t < q0 || t > q1 + 0.1) return;
  const a = sp(t, q0 + 0.4, 12);
  const tremble = Math.sin((t - T.mover) * 40) * 2.5 * spIO(t, T.mover, T.mover + 0.4, 30, 14);
  dot(ctx, 960 + tremble, 470, 14, WHITE, a);
}

export function draw(ctx, t) {
  if (t < B.cia[0] || t > B.question[1] + 0.2) return;
  cia(ctx, t);
  chain(ctx, t);
  numbers(ctx, t);
  question(ctx, t);
}
