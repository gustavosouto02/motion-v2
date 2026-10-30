#!/usr/bin/env bash
# Contact sheet from an encoded film: scripts/sheet.sh <video> <name> t1 t2 ...
set -euo pipefail
v=$1; name=$2; shift 2
mkdir -p build/cs; rm -f build/cs/${name}_*.png
i=0
for t in "$@"; do
  ffmpeg -v error -y -ss "$t" -i "$v" -frames:v 1 -vf scale=480:270 "build/cs/${name}_$(printf %03d $i).png"
  i=$((i+1))
done
ffmpeg -v error -y -i "build/cs/${name}_%03d.png" -vf "tile=5x$(( ($#+4)/5 )):padding=4" -frames:v 1 "build/sheet_$name.png"
echo "build/sheet_$name.png"
