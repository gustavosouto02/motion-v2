# MOTION v2 — PACE: Do caos à torcida

Filme institucional do PACE (1920×1080, 60 fps, 3:10), renderizado por código: cada frame é uma função do tempo desenhada em canvas (Node) e depois muxado com o áudio via ffmpeg. Há versões em português e inglês.

## Estrutura

| Pasta / arquivo | Conteúdo |
|---|---|
| `pace-v2/` | Projeto do filme (código, fontes, scripts de build). Detalhes em [`pace-v2/README.md`](pace-v2/README.md) |
| `depoimentos-organizacao*.mp4` | Depoimentos reais usados na abertura (PT e EN) |
| `Fotos Reais/`, `Fotos protótipo/` | Imagens usadas nas cenas |
| `Roteiro PACE V2.txt`, `Paleta Dark do CIA.md` | Roteiro aprovado e paleta de cores |

## Pré-requisitos

- macOS ou Linux
- [Node.js](https://nodejs.org) 18+
- Python 3.9+
- [ffmpeg](https://ffmpeg.org) no `PATH` (`brew install ffmpeg`)
- Internet na primeira execução (a locução é gerada com `edge-tts`)

## Como rodar o vídeo

```bash
git clone https://github.com/gustavosouto02/motion-v2.git
cd motion-v2/pace-v2

# 1. dependências
npm install
python3 -m venv --system-site-packages .venv
.venv/bin/pip install edge-tts scipy numpy

# 2. render completo (PT + EN)
./build.sh --vo
```

> A pasta `audio/` não está versionada (são centenas de MB de WAV gerados), por isso a **primeira execução precisa do `--vo`** para gerar a locução. Nas próximas, `./build.sh` basta.

O render leva cerca de 5 minutos em um Mac M4. Os arquivos finais saem em `pace-v2/out/`:

| Arquivo | Conteúdo |
|---|---|
| `PACE_V2_Do-caos-a-torcida.mp4` | Filme em português, com legenda |
| `PACE_V2_Do-caos-a-torcida_sem-legenda.mp4` | Português, sem legenda |
| `PACE_V2_From-chaos-to-the-stands_EN.mp4` | Filme em inglês, com legenda |
| `PACE_V2_From-chaos-to-the-stands_EN_no-captions.mp4` | Inglês, sem legenda |
| `legendas_PT-BR.srt`, `captions_EN.srt` | Legendas |
| `stems/`, `stems_EN/` | Trilhas separadas (locução, áudio original, música, efeitos) |

Para abrir: `open pace-v2/out/PACE_V2_Do-caos-a-torcida.mp4`.

### Variações

```bash
./build.sh pt          # só português
./build.sh en          # só inglês
WORKERS=4 ./build.sh   # menos processos paralelos (padrão 9), útil em máquinas com pouca RAM
```

### Pré-visualização rápida

Sem renderizar o filme todo:

```bash
node scripts/stills.js build/sheet.png 120 125 130 --captions   # frames em segundos 120, 125, 130
node scripts/render.js --from 110 --to 120                       # só um trecho (build/video/video_capt.mp4)
```

## Editando

- Locução e legendas: `pace-v2/src/vo-lines.json`
- Tempos: `pace-v2/src/timeline.js`
- Cenas: `pace-v2/src/scenes/c1.js` a `c4.js`

Mais detalhes no [README do projeto](pace-v2/README.md).
