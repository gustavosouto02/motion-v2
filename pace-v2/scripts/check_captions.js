// Flags frames where artwork reaches into the burned-in caption zone (2-line worst case).
import { createCanvas } from '@napi-rs/canvas';
const { drawFrame, prepare } = await import('../src/film.js');
const { captionCues } = await import('../src/timeline.js');
const c = createCanvas(1920, 1080), x = c.getContext('2d');
const hits = [];
for (const cue of captionCues()) {
  for (let t = cue.start; t < cue.end; t += 0.25) {
    await prepare(t);
    drawFrame(x, t);
    const d = x.getImageData(300, 862, 1320, 130).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 240) n++;
    if (n > 30) hits.push(`${t.toFixed(2)}s:${n}px`);
  }
}
console.log(hits.length ? 'content in caption zone at: ' + hits.join(' ') : 'caption zone clear in all checked frames');
