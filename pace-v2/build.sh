#!/usr/bin/env bash
# Full build of "PACE — Do caos à torcida" (PT) and "From chaos to the stands" (EN). Outputs land in out/.
#   ./build.sh            → both languages
#   ./build.sh en         → one language
#   ./build.sh --vo       → also regenerate the voiceover (needs internet)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out build
LANGS=(); VO=0
for a in "$@"; do case $a in --vo) VO=1 ;; pt|en) LANGS+=("$a") ;; esac; done
[[ ${#LANGS[@]} -eq 0 ]] && LANGS=(pt en)
[[ -f build/assets/tiktok_en.json ]] || .venv/bin/python -I scripts/prep_assets.py
for L in "${LANGS[@]}"; do
  [[ $VO == 1 ]] && .venv/bin/python -I scripts/gen_vo.py "$L"
  FILM_LANG=$L node scripts/cues.js
  .venv/bin/python -I scripts/gen_audio.py "$L"
  FILM_LANG=$L node scripts/texts.js
  node scripts/render.js --lang "$L" --clean --workers "${WORKERS:-9}" --sub "${SUB:-4}"
  if [[ $L == en ]]; then base="PACE_V2_From-chaos-to-the-stands_EN"; clean="${base}_no-captions"; stems="out/stems_EN"
  else base="PACE_V2_Do-caos-a-torcida"; clean="${base}_sem-legenda"; stems="out/stems"; fi
  for kind in capt clean; do
    name=$([[ $kind == capt ]] && echo "$base" || echo "$clean")
    ffmpeg -v error -y -i "build/$L/video/video_$kind.mp4" -i "build/$L/mix.wav" -map 0:v -map 1:a -c:v copy \
      -af apad -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "out/$name.mp4"
  done
  mkdir -p "$stems" && cp "audio/$L/vo.wav" "audio/$L/real.wav" "audio/$L/music.wav" "audio/$L/sfx.wav" "$stems/"
  echo "done → out/$base.mp4"
done
