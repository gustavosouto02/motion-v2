"""Prepare the real material from ../ (the motion V2 folder) into build/assets/.

- TikTok testimony (PT and EN-captioned edits): frames at 30 fps (540×960 JPG) + audio (48 kHz WAV)
- officials photos: resized to 1920 px wide
- scoresheets: names, signatures and personal data blurred (rectangles in source pixels)
- app screens: copied as they are
Usage: .venv/bin/python -I scripts/prep_assets.py
"""
import pathlib, shutil, subprocess
import numpy as np
from scipy.ndimage import uniform_filter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT.parent
OUT = ROOT / "build/assets"
OUT.mkdir(parents=True, exist_ok=True)

def run(*a):
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", *a])

# TikTok testimony: PT (original captions) → tiktok/, EN (English captions) → tiktok_en/
for name, vid in (("tiktok", SRC / "depoimentos-organizacao.mp4"), ("tiktok_en", SRC / "depoimentos-organizacao-EN.mp4")):
    (OUT / name).mkdir(exist_ok=True)
    run("-i", str(vid), "-vf", "fps=30,scale=540:960:flags=lanczos", "-q:v", "2", str(OUT / f"{name}/f%04d.jpg"))
    run("-i", str(vid), "-vn", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(OUT / f"{name}.wav"))
    n = len(list((OUT / name).glob("f*.jpg")))
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(vid)]))
    (OUT / f"{name}.json").write_text(f'{{"frames": {n}, "fps": 30, "duration": {dur:.3f}}}')

# officials photos
for i in range(1, 5):
    run("-i", str(SRC / f"Fotos Reais/mesarios{i}.jpg"), "-vf", "scale='min(1920,iw)':-2", "-q:v", "2", str(OUT / f"mesarios{i}.jpg"))

# scoresheets with personal data blurred
def load_rgb(path):
    w, h = [int(x) for x in subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(path)]).decode().strip().split(",")]
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])
    return np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3).copy()

def save_png(img, path):
    h, w, _ = img.shape
    p = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-i", "-", str(path)], input=img.tobytes())
    assert p.returncode == 0

def blur(img, rects, k):
    out = img.astype(np.float32)
    for x0, y0, x1, y1 in rects:
        reg = out[y0:y1, x0:x1]
        for _ in range(3):
            reg = uniform_filter(reg, size=(k, k, 1), mode="nearest")
        out[y0:y1, x0:x1] = reg
    return out.clip(0, 255).astype(np.uint8)

# SÚMULA DA FINAL.jpg (1087×1473): scorers, substitutions, cautions, referee signature
s1 = load_rgb(SRC / "Fotos Reais/SÚMULA DA FINAL.jpg")
s1 = blur(s1, [(90, 505, 445, 605), (595, 505, 965, 555), (85, 815, 245, 910), (280, 815, 460, 910),
               (590, 815, 750, 910), (785, 815, 970, 910), (250, 1030, 555, 1250), (740, 1320, 1000, 1440)], 25)
save_png(s1, OUT / "sumula_final.png")

# sumula.png (612×792): referee, inspector, player licences + names, coaches
s2 = load_rgb(SRC / "Fotos Reais/sumula.png")
s2 = blur(s2, [(465, 128, 594, 151), (455, 144, 594, 164), (22, 304, 203, 446), (65, 440, 185, 468),
               (22, 606, 203, 738), (65, 738, 200, 760)], 13)
save_png(s2, OUT / "sumula_basquete.png")

# app screens
(OUT / "screens").mkdir(exist_ok=True)
for f in (SRC / "Fotos protótipo").glob("*.png"):
    shutil.copy(f, OUT / "screens" / f.name)
print("assets ready: TikTok PT + EN frames, 4 photos, 2 blurred scoresheets, screens")
