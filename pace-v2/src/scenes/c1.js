// CAPÍTULO 1 · POR TRÁS DO EVENTO — the real TikTok testimony, the group chat that floods,
// the officials' paper, the rush on three fronts, the hard cut to black.
import {
  C, WHITE, ACCENT, BG, dot, ring, line, text, textW, box, rrect, sp, spIO, tw, prog, lerp, clamp,
  expoIn, expoOut, expoInOut, spring, hash, stateIcon, rgba,
} from '../core.js';
import { B, T, TIKTOK } from '../timeline.js';
import { L, num, ord } from '../i18n.js';
import { img, tiktokFrame, drawCover, phone, chapter } from '../lib.js';

const VID = { x: 707, y: 90, w: 506, h: 900 };
export const CHAT_PHONE = { x: 760, y: 108, w: 400, h: 744 };

// ---------- TikTok ----------
function tiktok(ctx, t) {
  const [t0, t1] = B.tiktok;
  if (t >= t1 + 0.05) return;
  // the clip frame morphs into the chat phone in its last 0.45 s
  const m = tw(t, t1 - 0.45, 0.45);
  const R = { x: lerp(VID.x, CHAT_PHONE.x, m), y: lerp(VID.y, CHAT_PHONE.y, m), w: lerp(VID.w, CHAT_PHONE.w, m), h: lerp(VID.h, CHAT_PHONE.h, m) };
  // gentle push-in on the two handwritten signs
  const z = 1 + 0.07 * spIO(t, 0.15, 1.6, 6, 8) + 0.07 * spIO(t, 2.9, 4.4, 6, 8);
  box(ctx, R.x, R.y, R.w, R.h, { r: 28, lw: 0, stroke: null, fill: C.base });
  drawCover(ctx, tiktokFrame(Math.min(t, TIKTOK.duration - 0.01)), R.x, R.y, R.w, R.h, { z, r: 28, a: 1 - m });
  box(ctx, R.x, R.y, R.w, R.h, { r: 28, lw: 2.5, stroke: C.border });
  chapter(ctx, L('01 · POR TRÁS DO EVENTO', '01 · BEHIND THE EVENT'), t, 0.5, 3.4);
}

// ---------- group chat ----------
const QUESTIONS = [L('Qual é o horário do jogo?', 'What time is the game?'), L('Já saiu o resultado?', 'Is the result out yet?'), L('Mudaram a quadra?', 'Did they change the court?'), L('Quem está com a súmula?', 'Who has the scoresheet?'), L('Esse placar está certo?', 'Is this score right?')];
const SENDERS = ['Lucas', 'Bia', 'Rafa', 'Duda', 'Gabi', 'Teo', 'Nina', 'Caio'];
// message schedule: accelerating; the first question returns exactly on "de novo"
const MSGS = (() => {
  const out = [];
  let t = B.chat[0] + 0.25, gap = 0.95, k = 0;
  while (t < B.photos[0] + 0.2) {
    out.push({ t, q: QUESTIONS[k % QUESTIONS.length], who: SENDERS[(k * 3) % SENDERS.length], k });
    k++; t += gap; gap = Math.max(0.22, gap * 0.8);
  }
  // the repeat on "de novo"
  out.push({ t: T.deNovo - 0.05, q: QUESTIONS[0], who: SENDERS[5], k: 99, repeat: true });
  return out.sort((a, b) => a.t - b.t);
})();

function chat(ctx, t) {
  const [c0] = B.chat;
  if (t < B.tiktok[1] - 0.45 || t > B.photos[0] + 0.6) return;
  const out = tw(t, B.photos[0] - 0.05, 0.45, expoIn);
  const P = { ...CHAT_PHONE, x: CHAT_PHONE.x - out * 1100 };
  const ui = tw(t, B.tiktok[1] - 0.1, 0.35);
  const S = phone(ctx, P.x, P.y, P.w, P.h);
  if (ui <= 0.002) return;
  // header
  ctx.save(); rrect(ctx, S.x, S.y, S.w, S.h, S.r); ctx.clip();
  box(ctx, S.x, S.y, S.w, 96, { r: 0, lw: 0, stroke: null, fill: C.s1, a: ui });
  line(ctx, S.x, S.y + 96, S.x + S.w, S.y + 96, 1.5, C.sep, ui);
  dot(ctx, S.x + 52, S.y + 56, 22, C.s3, ui);
  text(ctx, L('Grupo da atlética', 'Athletic group chat'), S.x + 88, S.y + 52, { size: 24, weight: 700, a: ui });
  text(ctx, L('avisos · jogos · resultados', 'news · games · results'), S.x + 88, S.y + 78, { size: 22, weight: 500, color: C.text2, a: ui });
  const unread = MSGS.filter((m) => m.t <= t).length * 3 + (t > c0 ? Math.floor((t - c0) * 4) : 0);
  if (t > c0 + 0.3) {
    const bw = Math.max(44, textW(ctx, String(unread), 22, 700) + 22);
    box(ctx, S.x + S.w - bw - 18, S.y + 36, bw, 34, { r: 17, lw: 0, stroke: null, fill: ACCENT, a: ui });
    text(ctx, String(unread), S.x + S.w - bw / 2 - 18, S.y + 61, { size: 22, weight: 700, color: C.onLime, align: 'center', a: ui });
  }
  // messages stack from the bottom up
  const bottom = S.y + S.h - 28;
  let y = bottom;
  const visible = MSGS.filter((m) => m.t <= t + 0.05).slice().reverse();
  for (const m of visible) {
    const pin = sp(t, m.t, 26);
    const tw_ = textW(ctx, m.q, 24, 600);
    const bw = Math.min(S.w - 70, tw_ + 34), bh = 82;
    y -= (bh + 12) * pin;
    if (y < S.y + 100) break;
    const left = m.k % 2 === 0 || m.repeat;
    const bx = left ? S.x + 18 : S.x + S.w - 18 - bw;
    box(ctx, bx, y, bw, bh, { r: 16, lw: m.repeat ? 2 : 0, stroke: m.repeat ? C.warn : null, fill: C.s2, a: pin });
    text(ctx, m.who, bx + 17, y + 30, { size: 22, weight: 700, color: m.repeat ? C.warn : C.text2, a: pin });
    text(ctx, m.q, bx + 17, y + 62, { size: 24, weight: 600, a: pin });
  }
  ctx.restore();
  text(ctx, L('mensagens ilustrativas', 'illustrative messages'), P.x + P.w + 24, P.y + P.h - 14, { size: 22, weight: 500, color: C.text3, a: ui * (1 - out) });
}

// ---------- officials' paper ----------
const FR = { x: 230, y: 96, w: 1460, h: 760 };
function beats() {
  return [
    { t: B.photos[0] - 0.05, im: 'mesarios1.jpg', u: 0.5, v: 0.55 },
    { t: T.confira - 0.1, im: 'sumula_final.png', u: 0.5, v: 0.78 },
    { t: T.responda - 0.1, im: 'mesarios2.jpg', u: 0.55, v: 0.5 },
    { t: T.avise - 0.1, im: 'mesarios4.jpg', u: 0.5, v: 0.45 },
  ];
}
function photos(ctx, t) {
  const [p0, p1] = B.photos;
  if (t < p0 - 0.2 || t > p1 + 0.5) return;
  const out = tw(t, p1 - 0.05, 0.4, expoIn);
  const bs = beats();
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i], next = bs[i + 1];
    if (t < b.t) continue;
    if (next && t > next.t + 0.4) continue;
    const slide = tw(t, b.t, 0.4, expoOut);
    const z = 1.02 + 0.06 * prog(t, b.t, (next ? next.t : p1) + 0.4);
    const x = FR.x + (1 - slide) * (i ? 260 : 0);
    drawCover(ctx, img(b.im), x, FR.y + out * 40, FR.w, FR.h, { u: b.u, v: b.v, z, r: 18, a: (i ? slide : tw(t, p0 - 0.2, 0.35)) * (1 - out) });
    box(ctx, x, FR.y + out * 40, FR.w, FR.h, { r: 18, lw: 2, stroke: C.border, a: (i ? slide : 1) * (1 - out) });
  }
}

// ---------- the rush: organizers · athletes · fans ----------
const PANELS = [{ x: 170, label: L('ORGANIZAÇÃO', 'ORGANIZERS') }, { x: 740, label: L('ATLETAS', 'ATHLETES') }, { x: 1310, label: L('TORCIDA', 'FANS') }];
const PW = 440, PY = 170, PH = 600;
function rush(ctx, t) {
  const [r0, r1] = B.rush;
  if (t < r0 - 0.1 || t >= r1) return;
  const cues = [T.organiza, T.joga, T.torce];
  PANELS.forEach((p, i) => {
    const a = sp(t, cues[i] - 0.15, 20);
    if (a <= 0.002) return;
    const y = PY + (1 - a) * 30;
    box(ctx, p.x, y, PW, PH, { r: 18, lw: 2, stroke: C.border, fill: C.s1, a });
    text(ctx, p.label, p.x + 26, y + 46, { size: 24, weight: 700, track: 0.16, color: C.text2, a });
    line(ctx, p.x, y + 70, p.x + PW, y + 70, 1.5, C.sep, a);
    if (i === 0) { // spreadsheet windows piling up
      const n = Math.min(9, Math.floor((t - cues[0]) / 0.3) + 1);
      for (let k = 0; k < n; k++) {
        const wa = sp(t, cues[0] + k * 0.3, 24) * a;
        const wx = p.x + 30 + k * 18, wy = y + 100 + k * 30;
        box(ctx, wx, wy, 300, 190, { r: 10, lw: 1.5, stroke: C.border, fill: C.s2, a: wa });
        for (let r = 0; r < 4; r++) line(ctx, wx + 14, wy + 50 + r * 32, wx + 286, wy + 50 + r * 32, 1, C.sep, wa);
        for (let k2 = 0; k2 < 3; k2++) dot(ctx, wx + 18 + k2 * 14, wy + 18, 4, C.text3, wa);
      }
    } else if (i === 1) { // the scoresheet waiting for a check
      drawCover(ctx, img('sumula_basquete.png'), p.x + 24, y + 92, PW - 48, PH - 200, { u: 0.5, v: 0.35, z: 1.15, r: 10, a });
      const ga = sp(t, cues[1] + 0.35, 20) * a;
      box(ctx, p.x + 24, y + PH - 92, PW - 48, 50, { r: 10, lw: 2, stroke: C.warn, fill: C.s1, a: ga });
      stateIcon(ctx, 'warn', p.x + 52, y + PH - 67, 18, C.warn, ga);
      text(ctx, L('aguardando conferência', 'awaiting review'), p.x + 74, y + PH - 59, { size: 22, weight: 600, color: C.warn, a: ga });
      text(ctx, L('súmula ilustrativa', 'illustrative scoresheet'), p.x + PW / 2, y + PH - 16, { size: 22, weight: 500, color: C.text3, align: 'center', a });
    } else { // refresh, refresh, refresh
      const cx = p.x + PW / 2, cy = y + 260;
      const spin = (t - cues[2]) * 5;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.text; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, 58, spin, spin + Math.PI * 1.5); ctx.stroke(); ctx.restore();
      const n = clamp(Math.floor(lerp(1, 10, prog(t, cues[2], T.decima + 0.2))), 1, 10);
      text(ctx, ord(n), cx, cy + 16, { size: 44, weight: 900, align: 'center', a });
      text(ctx, L('vez que atualiza o grupo', 'time refreshing the chat'), cx, cy + 120, { size: 24, weight: 600, color: C.text2, align: 'center', a });
    }
  });
  // the change that crosses every screen
  const tg = prog(t, T.organiza, T.decima);
  if (tg > 0) {
    const s = L('▲ JOGO 214 · 19:00 → ?', '▲ GAME 214 · 19:00 → ?');
    const blink = 0.55 + 0.45 * Math.cos((t - T.organiza) * Math.PI * 2 * 1.1);
    const x = lerp(220, 1420, expoInOut(tg)), y = 830;
    const w = textW(ctx, s, 22, 600, 0.06) + 28;
    box(ctx, x, y - 28, w, 40, { r: 8, lw: 2, stroke: C.warn, fill: C.s1, a: blink });
    text(ctx, s, x + 14, y, { size: 22, weight: 600, track: 0.06, color: C.warn, a: blink });
  }
  // notifications pile over everything right before the cut
  const n0 = T.decima + 0.35;
  for (let k = 0; k < 14; k++) {
    const nt = n0 + k * 0.07;
    const a = sp(t, nt, 30);
    if (a <= 0.002) continue;
    const x = 200 + hash(k, 1) * 1250, y = 120 + hash(k, 2) * 640;
    box(ctx, x, y + (1 - a) * 20, 420, 76, { r: 16, lw: 1.5, stroke: C.border, fill: C.s2, a });
    if (k % 3 === 0) stateIcon(ctx, 'warn', x + 34, y + 38, 20, C.warn, a);
    else dot(ctx, x + 34, y + 38, 12, k % 3 === 1 ? ACCENT : C.text3, a);
    text(ctx, QUESTIONS[k % QUESTIONS.length], x + 62, y + 46, { size: 24, weight: 600, a });
  }
}

export function draw(ctx, t) {
  if (t > B.black[0]) return;
  tiktok(ctx, t);
  chat(ctx, t);
  photos(ctx, t);
  rush(ctx, t);
}
