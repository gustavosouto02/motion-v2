// Absolute timeline for one language (FILM_LANG=pt|en): blocks (TikTok clip, chat, photos, …), VO placement and word cues.
// Start times are laid out from the measured VO durations; fixed blocks keep their length.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LANG = process.env.FILM_LANG === 'en' ? 'en' : 'pt';
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/vo-lines.json'), 'utf8'));
const meas = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, `src/vo_${LANG}.json`), 'utf8')).map((r) => [r.id, r]));
export const TIKTOK_DIR = LANG === 'en' ? 'tiktok_en' : 'tiktok';
export const TIKTOK = JSON.parse(fs.readFileSync(path.join(ROOT, `build/assets/${TIKTOK_DIR}.json`), 'utf8'));

// order of blocks; `fixed` = length in seconds for blocks without VO
const BLOCKS = [
  { id: 'tiktok', fixed: TIKTOK.duration },
  { id: 'chat', lead: 0.9, tail: 0.3 },
  { id: 'photos', lead: 0.3, tail: 0.3 },
  { id: 'rush', lead: 0.2, tail: 0.55 },
  { id: 'black', lead: 1.0, tail: 0.7 },
  { id: 'cia', lead: 0.8, tail: 0.4 },
  { id: 'chain', lead: 0.2, tail: 0.4 },
  { id: 'numbers', lead: 3.6, tail: 0.6 },
  { id: 'question', lead: 0.6, tail: 1.4 },
  { id: 'people', lead: 0.6, tail: 0.4 },
  { id: 'climb', lead: 0.2, tail: 0.5, gap: 0.4 },
  { id: 'lance', fixed: 4.6 },
  { id: 'reach', lead: 0.4, tail: 0.5 },
  { id: 'reveal', lead: 0.9, tail: 0.5 },
  { id: 'organize', lead: 0.4, tail: 0.45 },
  { id: 'record', lead: 0.3, tail: 0.45 },
  { id: 'follow', lead: 0.3, tail: 0.5 },
  { id: 'answers', lead: 4.8, tail: 0.5 },
  { id: 'sign', lead: 1.6, tail: 0.9 },
  { id: 'end', fixed: 3.2 },
];
const GAP = 0.5;

export const B = {};   // block id → [start, end]
export const VO = [];
{
  let t = 0;
  for (const b of BLOCKS) {
    const start = t;
    if (b.fixed) t += b.fixed;
    else {
      const lines = cfg.lines.filter((l) => l.block === b.id);
      if (!lines.length) throw new Error(`no lines for block ${b.id}`);
      t += b.lead;
      lines.forEach((l, k) => {
        if (k) t += l.gap ?? b.gap ?? GAP;
        const m = meas[l.id];
        const at = +t.toFixed(3);
        VO.push({ ...l, text: LANG === 'en' ? l.en : l.text, cues: LANG === 'en' ? l.cues_en : l.cues, at, dur: m.dur, end: at + m.dur, words: m.words.map((w) => ({ ...w, t0: at + w.t0, t1: at + w.t1 })) });
        t = at + m.dur;
      });
      t += b.tail;
    }
    B[b.id] = [+start.toFixed(3), +t.toFixed(3)];
  }
}
export const DURATION = B.end[1];

const byId = Object.fromEntries(VO.map((v) => [v.id, v]));
export const line = (id) => byId[id];
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
export function cue(id, spec, edge = 't0') {
  const [word, n = '0'] = spec.split('#');
  const hits = byId[id].words.filter((w) => norm(w.w).startsWith(norm(word)));
  if (!hits[+n]) throw new Error(`cue not found: ${id} "${spec}"`);
  return hits[+n][edge];
}
// T.<cue> = absolute time of a word; T.<lineId> / T.<lineId>_end = line bounds
export const T = {};
for (const v of VO) {
  T[v.id] = v.at; T[v.id + '_end'] = v.end;
  for (const [name, word] of Object.entries(v.cues || {})) T[name] = cue(v.id, word);
}

export function captionCues() {
  return VO.map((v, i) => {
    const next = VO[i + 1];
    let end = v.end + 0.35;
    if (next) end = Math.min(end, next.at - 0.08);
    return { start: v.at, end, text: v.text };
  });
}
