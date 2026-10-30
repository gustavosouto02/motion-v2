// FILM_LANG=pt|en node scripts/cues.js — export the timeline (blocks, VO placement, word cues) for the audio script.
import fs from 'node:fs';
const { T, B, VO, DURATION, TIKTOK, TIKTOK_DIR, LANG } = await import('../src/timeline.js');
const { lanceState } = await import('../src/scenes/c3.js');
const L = lanceState(B.lance[0] + 3);
fs.mkdirSync(`build/${LANG}`, { recursive: true });
fs.writeFileSync(`build/${LANG}/cues.json`, JSON.stringify({ LANG, T, B, DURATION, TIKTOK, TIKTOK_DIR, LANCE: L, VO: VO.map(({ id, at, dur, end }) => ({ id, at, dur, end })) }, null, 1));
console.log(`wrote build/${LANG}/cues.json · ${DURATION.toFixed(2)} s`);
