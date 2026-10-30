// Render stills or a contact sheet.
//   node scripts/stills.js out.png 12.5 13 14            → contact sheet of those times (or one still)
//   node scripts/stills.js out.png --range 0 32 1        → every 1 s from 0 to 32
//   add --captions to burn captions
import { createCanvas } from '@napi-rs/canvas';
import fs from 'node:fs';

const args = process.argv.slice(2);


const li = args.indexOf('--lang');
if (li >= 0) { process.env.FILM_LANG = args[li + 1]; args.splice(li, 2); }
const { drawFrame, prepare } = await import('../src/film.js');
const { text } = await import('../src/core.js');
const out = args.shift();
const withCaptions = args.includes('--captions');
let times = [];
const ri = args.indexOf('--range');
if (ri >= 0) {
  const [a, b, s] = args.slice(ri + 1, ri + 4).map(Number);
  for (let t = a; t <= b + 1e-9; t += s) times.push(+t.toFixed(3));
} else times = args.filter((a) => !a.startsWith('--')).map(Number);

const frame = createCanvas(1920, 1080), fctx = frame.getContext('2d');
if (times.length === 1) {
  await prepare(times[0]);
  drawFrame(fctx, times[0], { captions: withCaptions });
  fs.writeFileSync(out, frame.toBuffer('image/png'));
} else {
  const cols = 4, tw = 480, th = 270, pad = 6, lab = 26;
  const rows = Math.ceil(times.length / cols);
  const sheet = createCanvas(cols * (tw + pad) + pad, rows * (th + lab + pad) + pad), sx = sheet.getContext('2d');
  sx.fillStyle = '#333'; sx.fillRect(0, 0, sheet.width, sheet.height);
  for (const [k, t] of times.entries()) {
    await prepare(t);
    drawFrame(fctx, t, { captions: withCaptions });
    const x = pad + (k % cols) * (tw + pad), y = pad + Math.floor(k / cols) * (th + lab + pad);
    sx.drawImage(frame, x, y + lab, tw, th);
    text(sx, `${t.toFixed(2)}s`, x + 4, y + 19, { size: 18, weight: 600, color: '#fff' });
  }
  fs.writeFileSync(out, sheet.toBuffer('image/png'));
}
console.log('wrote', out, times.length, 'frame(s)');
