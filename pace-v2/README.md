# PACE — Do caos à torcida (filme V2)

3:10 · 1920×1080 · 60 fps · português. Script: `../Roteiro PACE V2.txt` (approved version).
Design reference: the `cia-motion` project (only copied from, never changed) and the PACE dark palette.

## Deliverables (`out/`)

| File | Content |
|---|---|
| `PACE_V2_Do-caos-a-torcida.mp4` | Film with PT-BR captions burned in |
| `PACE_V2_Do-caos-a-torcida_sem-legenda.mp4` | Same film, no captions |
| `legendas_PT-BR.srt` | Captions of the narration |
| `roteiro_locucao_timecodes.txt` | Narration with absolute timecodes, by chapter/block |
| `stems/` | `vo.wav` (narration), `real.wav` (original TikTok audio), `music.wav`, `sfx.wav` (effects, crowd, drums), all at mix level |

H.264 High, yuv420p, BT.709, evenly spaced timestamps, AAC 48 kHz, `+faststart`. Mix: −16 LUFS integrated, −1.8 dBTP.

## Real material used (from `../`)

- **`depoimentos-organizacao.mp4`:** used in full at the opening, with its original audio and captions.
- **`Fotos Reais/mesarios1–4.jpg`:** the chapter 1 montage.
- **Scoresheets:** names, signatures and personal data blurred in `scripts/prep_assets.py`. The 2009 basketball sheet is tagged "súmula ilustrativa".
- **`Fotos protótipo/*.png`:** the real admin (Mac) and app (iOS) screens in chapter 4.

What has no real image (fans, the event, the game play, the score-table app) is done in motion graphics in the film-1 style. Crowd, drums, whistle and buzzer are synthesized.

## Re-render

```bash
npm install
python3 -m venv --system-site-packages .venv && .venv/bin/pip install edge-tts scipy numpy
./build.sh          # assets (first run) + audio + frames + mux, ≈5 min on an M4
./build.sh --vo     # also regenerate the narration (needs internet)
```

Previews:

```bash
node scripts/stills.js build/sheet.png 120 125 130 --captions   # stills / contact sheet from the code
node scripts/render.js --from 110 --to 120                       # one range → build/video/video_capt.mp4
node scripts/check_captions.js                                   # artwork inside the caption zone?
scripts/sheet.sh out/PACE_V2_Do-caos-a-torcida.mp4 name 10 20 30 # sheet from an encoded file
```

## Editing

- **Narration:** `src/vo-lines.json`. Each line has `text` (caption), `tts` (what is spoken; "PACE" is written "Peis"), `rate`/`pitch`, `gap`, and `cues` (the words that drive the animation).
- **Timing:** `src/timeline.js`. Blocks run in order with a lead, the lines, then a tail. Fixed blocks (TikTok, the play, the end card) keep their length. Everything re-times from the narration.
- **Scenes:**
  - `src/scenes/c1.js`: behind the event
  - `c2.js`: the CIA's scale
  - `c3.js`: what it moves
  - `c4.js`: PACE
  - Helpers (real images, device frames, cursor, view/zoom) are in `src/lib.js`. Palette and primitives are in `src/core.js`.
- **Images:** they decode asynchronously, so `prepare(t)` loads what time `t` needs before `drawFrame(ctx, t)` draws it. Each frame stays a pure function of time.
- **Sound:** `scripts/gen_audio.py` handles music by chapter, crowd/drums, cues, ducking under the narration, and the silences: 1 s of black before "Tudo isso…", and 0.8 s of total silence while the ball is in the air.
