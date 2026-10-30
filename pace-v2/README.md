# PACE — Do caos à torcida (filme V2)

3:10 · 1920×1080 · 60 fps · português. Roteiro: `../Roteiro PACE V2.txt` (versão aprovada).
Referência de design: o projeto `cia-motion` (apenas copiado, nunca alterado) e a paleta dark do PACE.

## Entregáveis (`out/`)

| Arquivo | Conteúdo |
|---|---|
| `PACE_V2_Do-caos-a-torcida.mp4` | Filme com legendas PT-BR embutidas |
| `PACE_V2_Do-caos-a-torcida_sem-legenda.mp4` | Mesmo filme, sem legendas |
| `legendas_PT-BR.srt` | Legendas da narração |
| `roteiro_locucao_timecodes.txt` | Narração com timecodes absolutos, por capítulo/bloco |
| `stems/` | `vo.wav` (narração), `real.wav` (áudio original do TikTok), `music.wav`, `sfx.wav` (efeitos, torcida, tambores), todos no nível da mixagem |

H.264 High, yuv420p, BT.709, timestamps uniformes, AAC 48 kHz, `+faststart`. Mixagem: −16 LUFS integrado, −1,8 dBTP.

## Material real utilizado (de `../`)

- **`depoimentos-organizacao.mp4`:** usado na íntegra na abertura, com o áudio e as legendas originais.
- **`Fotos Reais/mesarios1–4.jpg`:** a montagem do capítulo 1.
- **Súmulas:** nomes, assinaturas e dados pessoais desfocados em `scripts/prep_assets.py`. A súmula de basquete de 2009 recebe a marca "súmula ilustrativa".
- **`Fotos protótipo/*.png`:** as telas reais do admin (Mac) e do app (iOS) no capítulo 4.

O que não tem imagem real (torcedores, o evento, a jogada, o app da mesa) é feito em motion graphics no estilo do filme 1. Torcida, tambores, apito e buzina são sintetizados.

## Renderizar novamente

```bash
npm install
python3 -m venv --system-site-packages .venv && .venv/bin/pip install edge-tts scipy numpy
./build.sh          # assets (primeira execução) + áudio + frames + mux, ≈5 min em um M4
./build.sh --vo     # também regenera a narração (precisa de internet)
```

Pré-visualizações:

```bash
node scripts/stills.js build/sheet.png 120 125 130 --captions   # stills / folha de contato a partir do código
node scripts/render.js --from 110 --to 120                       # um trecho → build/video/video_capt.mp4
node scripts/check_captions.js                                   # há arte dentro da zona de legenda?
scripts/sheet.sh out/PACE_V2_Do-caos-a-torcida.mp4 nome 10 20 30 # folha de contato a partir de um arquivo codificado
```

## Edição

- **Narração:** `src/vo-lines.json`. Cada linha tem `text` (legenda), `tts` (o que é falado; "PACE" é escrito "Peis"), `rate`/`pitch`, `gap` e `cues` (as palavras que disparam a animação).
- **Tempos:** `src/timeline.js`. Os blocos rodam em ordem com uma entrada, as linhas e uma saída. Blocos fixos (TikTok, a jogada, o card final) mantêm a duração. Todo o resto é re-temporizado a partir da narração.
- **Cenas:**
  - `src/scenes/c1.js`: bastidores do evento
  - `c2.js`: a escala do CIA
  - `c3.js`: o que ele movimenta
  - `c4.js`: PACE
  - Os helpers (imagens reais, molduras de dispositivo, cursor, view/zoom) ficam em `src/lib.js`. Paleta e primitivas ficam em `src/core.js`.
- **Imagens:** são decodificadas de forma assíncrona, então `prepare(t)` carrega o que o instante `t` precisa antes de `drawFrame(ctx, t)` desenhar. Cada frame continua sendo uma função pura do tempo.
- **Som:** `scripts/gen_audio.py` cuida da música por capítulo, torcida/tambores, cues, ducking sob a narração e dos silêncios: 1 s de preto antes de "Tudo isso…" e 0,8 s de silêncio total enquanto a bola está no ar.
