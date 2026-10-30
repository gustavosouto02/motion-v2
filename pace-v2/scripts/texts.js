// Write the caption file and the timecoded VO script for one language (FILM_LANG=pt|en).
import fs from 'node:fs';
const { VO, B, LANG, captionCues } = await import('../src/timeline.js');
const tc = (s, sep = ',') => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}${sep}${String(ms % 1000).padStart(3, '0')}`;
};
const en = LANG === 'en';
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync(en ? 'out/captions_EN.srt' : 'out/legendas_PT-BR.srt', captionCues().map((c, i) => `${i + 1}\n${tc(c.start)} --> ${tc(c.end)}\n${c.text}\n`).join('\n'));
const NAMES = en ? {
  tiktok: 'CH. 1 · Real testimony (TikTok, original audio, English captions)', chat: 'CH. 1 · Group chat', photos: 'CH. 1 · Scorekeepers and scoresheets', rush: 'CH. 1 · The rush',
  black: 'Black screen', cia: 'CH. 2 · CIA', chain: 'CH. 2 · The chain / dominoes', numbers: 'CH. 2 · The numbers', question: 'CH. 2 · The question',
  people: 'CH. 3 · The people', climb: 'CH. 3 · The fans', lance: 'CH. 3 · The play (no voiceover)', reach: 'CH. 3 · Reaching everyone',
  reveal: 'CH. 4 · PACE', organize: 'CH. 4 · Organize', record: 'CH. 4 · Record', follow: 'CH. 4 · Follow', answers: 'CH. 4 · The answers',
  sign: 'CH. 4 · Signature', end: 'End card · "PACE. Your championship at the right pace."',
} : {
  tiktok: 'CAP. 1 · Depoimento real (TikTok, áudio original)', chat: 'CAP. 1 · Grupo de mensagens', photos: 'CAP. 1 · Mesários e súmulas', rush: 'CAP. 1 · A correria',
  black: 'Tela preta', cia: 'CAP. 2 · O CIA', chain: 'CAP. 2 · A corrente / dominó', numbers: 'CAP. 2 · Os números', question: 'CAP. 2 · A pergunta',
  people: 'CAP. 3 · As pessoas', climb: 'CAP. 3 · A torcida', lance: 'CAP. 3 · O lance (sem locução)', reach: 'CAP. 3 · Chegar em todo mundo',
  reveal: 'CAP. 4 · PACE', organize: 'CAP. 4 · Organizar', record: 'CAP. 4 · Registrar', follow: 'CAP. 4 · Acompanhar', answers: 'CAP. 4 · As respostas',
  sign: 'CAP. 4 · Assinatura', end: 'Tela final · "PACE. Seu campeonato no ritmo certo."',
};
let out = en
  ? 'PACE — From chaos to the stands · voiceover script with timecodes (HH:MM:SS.mmm, absolute)\nVoice: Microsoft Edge neural "en-US-AndrewMultilingualNeural" (edge-tts).\n'
  : 'PACE — Do caos à torcida · roteiro da locução com timecodes (HH:MM:SS.mmm, absolutos)\nVoz: Microsoft Edge neural "en-US-AndrewMultilingualNeural" falando português (edge-tts).\n';
for (const [k, [a, b]] of Object.entries(B)) {
  out += `\n${NAMES[k]}  [${tc(a, '.')} – ${tc(b, '.')}]\n`;
  for (const v of VO.filter((v) => v.block === k)) out += `  ${v.id}  ${tc(v.at, '.')} → ${tc(v.end, '.')}   ${v.text}\n`;
}
fs.writeFileSync(en ? 'out/vo_script_timecodes_EN.txt' : 'out/roteiro_locucao_timecodes.txt', out);
console.log(`wrote captions + VO script (${LANG})`);
