// Deterministic frame renderer → H.264 video-only streams (captioned, and clean with --clean).
//   node scripts/render.js --lang pt|en [--workers 9] [--sub 4] [--from 0] [--to <s>] [--clean]
// Each frame is the average of SUB temporal samples across half a frame (180° shutter);
// anything at rest renders identically in every sample, so it stays perfectly sharp.
import { createCanvas, ImageData } from '@napi-rs/canvas';
import { spawn, fork } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';



const li = process.argv.indexOf('--lang');
if (li >= 0) process.env.FILM_LANG = process.argv[li + 1];
const { drawFrame, DURATION, prepare } = await import('../src/film.js');
const { FPS, W, H } = await import('../src/core.js');
const { captionCues } = await import('../src/timeline.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, 'build', process.env.FILM_LANG === 'en' ? 'en' : 'pt', 'video');
const WITH_CLEAN = process.argv.includes('--clean');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const SUB = +arg('--sub', 4);
const FROM = Math.round(+arg('--from', 0) * FPS);
const TO = Math.round(+arg('--to', DURATION) * FPS);

function ffmpeg(out) {
  const p = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '15', '-tune', 'animation', '-g', '120',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  return p;
}
const write = (p, buf) => new Promise((res) => (p.stdin.write(buf) ? res() : p.stdin.once('drain', res)));
const close = (p) => new Promise((res, rej) => { p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))); p.stdin.end(); });

async function worker(k, f0, f1) {
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d');
  const acc = new Uint16Array(W * H * 4);
  const out = Buffer.alloc(W * H * 4);
  const cues = captionCues();
  const clean = WITH_CLEAN ? ffmpeg(path.join(BUILD, `seg_clean_${String(k).padStart(2, '0')}.mp4`)) : null;
  const capt = ffmpeg(path.join(BUILD, `seg_capt_${String(k).padStart(2, '0')}.mp4`));
  for (let f = f0; f < f1; f++) {
    acc.fill(0);
    for (let s = 0; s < SUB; s++) {
      const t = f / FPS + ((s + 0.5) / SUB - 0.5) * (0.5 / FPS);
      await prepare(Math.max(0, t));
      drawFrame(ctx, Math.max(0, t));
      const d = ctx.getImageData(0, 0, W, H).data;
      for (let i = 0; i < d.length; i++) acc[i] += d[i];
    }
    const half = SUB >> 1;
    for (let i = 0; i < out.length; i++) out[i] = ((acc[i] + half) / SUB) | 0;
    if (clean) await write(clean, out);
    const t = f / FPS;
    if (cues.some((c) => t >= c.start && t < c.end)) {
      ctx.putImageData(new ImageData(new Uint8ClampedArray(out.buffer, out.byteOffset, out.length), W, H), 0, 0);
      drawFrame(ctx, t, { captions: true, overlayOnly: true });
      await write(capt, Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer));
    } else await write(capt, out);
    if (process.send && (f - f0) % 30 === 0) process.send({ k, done: f - f0 });
  }
  await Promise.all([clean && close(clean), close(capt)]);
}

async function main() {
  fs.mkdirSync(BUILD, { recursive: true });
  for (const f of fs.readdirSync(BUILD)) if (/^seg_(clean|capt)_\d+\.mp4$/.test(f)) fs.unlinkSync(path.join(BUILD, f));
  const N = +arg('--workers', 9);
  const total = TO - FROM, per = Math.ceil(total / N);
  const t0 = Date.now();
  const progress = new Array(N).fill(0);
  await Promise.all(Array.from({ length: N }, (_, k) => new Promise((res, rej) => {
    const a = FROM + k * per, b = Math.min(TO, a + per);
    const c = fork(fileURLToPath(import.meta.url), ['--worker', String(k), String(a), String(b), '--sub', String(SUB), ...(WITH_CLEAN ? ['--clean'] : [])]);
    c.on('message', (m) => {
      progress[m.k] = m.done;
      const d = progress.reduce((s, v) => s + v, 0);
      if (m.k === 0) process.stdout.write(`\r${d}/${total} frames · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    });
    c.on('exit', (code) => (code === 0 ? res() : rej(new Error(`worker ${k} exited ${code}`))));
  })));
  for (const kind of WITH_CLEAN ? ['clean', 'capt'] : ['capt']) {
    // exact per-segment durations keep frame timestamps evenly spaced across the joins
    const segs = fs.readdirSync(BUILD).filter((f) => f.startsWith(`seg_${kind}_`)).sort();
    const list = segs.map((f, k) => {
      const n = Math.min(per, total - k * per);
      return `file '${path.join(BUILD, f)}'\nduration ${(n / FPS).toFixed(6)}`;
    }).join('\n');
    fs.writeFileSync(path.join(BUILD, `concat_${kind}.txt`), list);
    await new Promise((res, rej) => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(BUILD, `concat_${kind}.txt`), '-c', 'copy', path.join(BUILD, `video_${kind}.mp4`)], { stdio: 'inherit' }).on('close', (c) => (c ? rej(new Error('concat')) : res())));
  }
  console.log(`\nrendered ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s → ${BUILD}/video_capt.mp4`);
}

const wi = process.argv.indexOf('--worker');
if (wi >= 0) {
  const [k, a, b] = process.argv.slice(wi + 1, wi + 4).map(Number);
  worker(k, a, b).then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
} else main().catch((e) => { console.error(e); process.exit(1); });
