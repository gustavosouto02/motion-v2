"""V2 soundtrack: original music, sound design, crowd and drums synthesized offline, the real
TikTok audio and the VO, mixed from build/cues.json.

Writes audio/<lang>/vo.wav, real.wav (TikTok), music.wav, sfx.wav (48 kHz stereo, at mix level)
and build/<lang>/mix.wav (−16 LUFS integrated, true peak under −1 dBTP).
Usage: .venv/bin/python -I scripts/gen_audio.py pt|en
"""
import json, pathlib, subprocess, re, sys
import numpy as np
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANG = sys.argv[1] if len(sys.argv) > 1 else "pt"
C = json.loads((ROOT / f"build/{LANG}/cues.json").read_text())
T, B, L = C["T"], C["B"], C["LANCE"]
SR = 48000
N = int(round(C["DURATION"] * SR))
rng = np.random.default_rng(11)
t_ = lambda n: np.arange(n) / SR
BEAT = 0.6


def place(buf, t0, sig, gain=1.0):
    i0 = int(round(t0 * SR))
    if i0 >= len(buf) or len(sig) == 0:
        return
    j0 = max(0, -i0); i0 = max(0, i0)
    n = min(len(sig) - j0, len(buf) - i0)
    if n > 0:
        buf[i0:i0 + n] += sig[j0:j0 + n] * gain


def env_ad(n, a=0.005, d=0.2):
    t = t_(n)
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)

bp = lambda x, lo, hi, o=2: sosfilt(butter(o, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos"), x)
lp = lambda x, f, o=2: sosfilt(butter(o, f / (SR / 2), btype="low", output="sos"), x)
hp = lambda x, f, o=2: sosfilt(butter(o, f / (SR / 2), btype="high", output="sos"), x)
noise = lambda d: rng.standard_normal(int(d * SR))
midi = lambda m: 440 * 2 ** ((m - 69) / 12)


def fade(n, fi=0.01, fo=0.05):
    w = np.ones(n); a, b = int(fi * SR), int(fo * SR)
    if a: w[:a] = np.linspace(0, 1, a)
    if b: w[-b:] *= np.linspace(1, 0, b)
    return w

# ================================================================ MUSIC
music = np.zeros(N)
CH = [[45, 52, 59, 60, 64], [41, 48, 52, 57, 64], [48, 55, 62, 64, 67], [43, 50, 59, 62, 64]]  # Am9 Fmaj7 Cadd9 G6


def pad(t0, t1, chord, g, att=1.0, rel=1.2, bright=900):
    n = int((t1 - t0 + rel) * SR); t = t_(n); s = np.zeros(n)
    for k, m in enumerate(chord):
        f = midi(m + 12)
        for det in (-0.2, 0.2):
            s += np.sin(2 * np.pi * (f + det) * t + k)
    s = lp(s, bright)
    e = np.minimum(1, t / att) * np.where(t < t1 - t0, 1, np.exp(-(t - (t1 - t0)) / (rel / 3)))
    place(music, t0, s * e / len(chord), g)


def pads(t0, t1, g, bright=900, ref=None):
    ref = t0 if ref is None else ref
    k = t0
    while k < t1 - 0.2:
        e = min(t1, k + BEAT * 8)
        pad(k, e, CH[int((k - ref + 0.01) // (BEAT * 8)) % 4], g, 0.8, 1.0, bright)
        k = e


def kick(t0, g=0.2, f0=72, f1=44, d=0.26):
    n = int(0.6 * SR); t = t_(n); f = f1 + (f0 - f1) * np.exp(-t / 0.05)
    place(music, t0, np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.004, d), g)


def hat(t0, g=0.025):
    place(music, t0, hp(noise(0.08), 7000) * env_ad(int(0.08 * SR), 0.001, 0.02), g)


def pluck(t0, m, g=0.05, d=0.3):
    n = int(1.1 * SR); t = t_(n); f = midi(m)
    s = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * env_ad(n, 0.003, d)
    place(music, t0, lp(s, 3800), g)


def bass(t0, m, g=0.12, d=0.45):
    n = int(1.3 * SR); t = t_(n); f = midi(m)
    place(music, t0, (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)) * env_ad(n, 0.01, d), g)


def brand_tone(t0, dur=5.0, g=0.3):
    n = int(dur * SR); t = t_(n)
    f = 55 + 3.0 * np.exp(-t / 0.35); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    e = np.minimum(1, t / 0.06) * (0.55 + 0.45 * np.exp(-t / 0.5)) * np.exp(-t / (dur * 0.55)) * fade(n, 0, 0.4)
    place(music, t0, np.tanh(1.3 * s) / 1.1 * e, g)


def groove(t0, t1, kick_g=0.18, hats=True, sixteen=False, plucks=False, bass_g=0.12, ref=None):
    ref = t0 if ref is None else ref
    bt, i = t0, 0
    while bt < t1 - 0.01:
        ch = CH[int((bt - ref + 0.01) // (BEAT * 8)) % 4]
        kick(bt, kick_g if i % 2 == 0 else kick_g * 0.7)
        if hats: hat(bt + BEAT / 2)
        if sixteen:
            for q in (1, 3): hat(bt + q * BEAT / 4, 0.018)
        if i % 2 == 0 and bass_g: bass(bt, ch[0], bass_g)
        if plucks: pluck(bt + (BEAT / 2 if i % 2 else 0), ch[1 + i % 4] + 12, 0.03, 0.22)
        bt += BEAT; i += 1

# Chapter 1: a dark tension bed under the TikTok tail, the chat, the paper, the rush
tk1 = B["tiktok"][1]
pad(tk1 - 4.0, B["rush"][1], [45, 52, 57], 0.07, att=3.0, rel=0.2, bright=500)
bt = tk1 - 2.4
while bt < B["rush"][1] - 0.01:   # a ticking pulse that tightens
    hat(bt, 0.02 + 0.02 * (bt > B["photos"][0]))
    bt += BEAT / (2 if bt < B["rush"][0] else 4)
groove(B["chat"][0], B["rush"][1], kick_g=0.14, hats=False, bass_g=0.08)
rn = int((B["rush"][1] - B["rush"][0]) * SR)
place(music, B["rush"][0], bp(noise(B["rush"][1] - B["rush"][0]), 400, 5000) * np.linspace(0, 1, rn) ** 2.5, 0.06)

# Chapter 2: contained, a regular pulse, room to read
c2a, c2b = B["cia"][0], B["question"][0]
pads(c2a, c2b + 1.5, 0.09, 850)
groove(c2a + BEAT * 4, B["numbers"][1] - 1.2, kick_g=0.12, hats=True, plucks=True, bass_g=0.1, ref=c2a)

# Chapter 3: the drums build to the play
p0 = B["people"][0]
pad(T["camisa"] - 0.5, L["freeze"], [45, 52, 57, 60, 64], 0.07, att=2.5, rel=0.1, bright=1100)
groove(T["camisa"] - 0.2, L["freeze"], kick_g=0.16, hats=True, sixteen=True, bass_g=0.12, ref=T["camisa"] - 0.2)
# the peak: a wide chord and a clean pulse right after the basket
pad(L["swish"], B["reach"][1], [45, 52, 59, 64, 69], 0.12, att=0.05, rel=1.5, bright=1600)
groove(L["swish"] + BEAT, B["reach"][1] - 0.5, kick_g=0.18, hats=True, plucks=True, bass_g=0.13, ref=L["swish"])

# Chapter 4: wide and confident
r0 = B["reveal"][0]
rr = int((T["pace"] - r0) * SR)
place(music, r0, bp(noise(T["pace"] - r0), 600, 7000) * np.linspace(0, 1, rr) ** 3, 0.05)
brand_tone(T["pace"] + 0.05, 5.0, 0.32)
pads(T["pace"], B["sign"][0] + 0.5, 0.1, 1400, ref=T["pace"])
groove(T["pace"] + BEAT * 4, B["sign"][0] - 0.3, kick_g=0.17, hats=True, plucks=True, bass_g=0.12, ref=T["pace"])
brand_tone(T["pace2"] - 0.05, 6.0, 0.3)
pad(T["pace2"], B["end"][1] - 0.5, CH[0], 0.1, att=0.6, rel=1.2, bright=1200)

# ================================================================ SFX, crowd, drums
sfx = np.zeros(N)
crowd = np.zeros(N)


def click(t0, g=0.12, f=2500, d=0.012):
    place(sfx, t0, bp(noise(0.06), f * 0.6, min(f * 1.6, 20000)) * env_ad(int(0.06 * SR), 0.0005, d), g)


def thump(t0, g=0.25, f=90, d=0.12, buf=None):
    n = int(0.5 * SR); t = t_(n); fr = f * (0.6 + 0.4 * np.exp(-t / 0.04))
    place(sfx if buf is None else buf, t0, np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_ad(n, 0.002, d), g)


def ping(t0, g=0.1, f=1760):
    n = int(0.8 * SR); t = t_(n)
    place(sfx, t0, (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t)) * env_ad(n, 0.003, 0.2), g)


def chime(t0, g=0.08):
    ping(t0, g, 1318.5); ping(t0 + 0.09, g, 1975.5)


def swoosh(t0, dur, g=0.05, lo=300, hi=3000):
    n = int(dur * SR); x = noise(dur); h = n // 2
    s = np.concatenate([bp(x[:h], lo, hi * 0.6), bp(x[h:], lo * 1.5, hi)])
    place(sfx, t0, s * np.sin(np.pi * np.linspace(0, 1, n)) ** 2, g)


def buzz(t0, g=0.06):  # phone vibration
    n = int(0.35 * SR); t = t_(n)
    place(sfx, t0, np.sin(2 * np.pi * 170 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * t))) * fade(n, 0.01, 0.05), g)


def chant(t0, t1, g=0.1, buf=None):
    """A crowd chant: many detuned voices on a simple 'ô-ô-ô' figure, formant filtered."""
    buf = crowd if buf is None else buf
    n = int((t1 - t0) * SR); t = t_(n)
    melody = [64, 64, 67, 64, 62, 64, 60, 64]
    s = np.zeros(n)
    step = BEAT
    for v in range(14):
        det = (hash_ := (v * 0.37) % 1) * 0.6 - 0.3
        ph = 0.0
        sig = np.zeros(n)
        idx = (t // step).astype(int) % len(melody)
        f = np.array([midi(melody[i] - 12) for i in range(len(melody))])[idx] * (1 + det / 100)
        ph = 2 * np.pi * np.cumsum(f) / SR + v
        saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
        s += saw
    s = bp(s, 500, 900, 2) + 0.6 * bp(s, 1000, 1400, 2)
    syl = np.clip(np.sin(np.pi * ((t % step) / step)) * 1.4, 0, 1) ** 0.6
    s = s * syl + 0.6 * bp(rng.standard_normal(n), 400, 2500) * syl
    place(buf, t0, s * fade(n, 1.0, 1.2) / 14, g)


def crowd_noise(t0, t1, g=0.05, shape=None):
    n = int((t1 - t0) * SR)
    x = bp(rng.standard_normal(n), 300, 3200, 2) * np.clip(lp(rng.standard_normal(n), 3) * 4 + 1, 0.3, 2)
    e = fade(n, 0.6, 0.8) if shape is None else shape(t_(n) / max(1e-6, t_(n)[-1]))
    place(crowd, t0, x * e, g)


def drum_bateria(t0, t1, g=1.0):
    bt, i = t0, 0
    while bt < t1 - 0.01:
        thump(bt, 0.22 * g if i % 2 else 0.32 * g, 62, 0.25, buf=crowd)            # surdo
        for q in range(4):                                                         # caixa
            acc = 1.0 if q in (0, 2) else 0.55
            place(crowd, bt + q * BEAT / 4, hp(noise(0.06), 1800) * env_ad(int(0.06 * SR), 0.001, 0.03), 0.05 * g * acc)
        place(crowd, bt + BEAT * 0.75, bp(noise(0.03), 3500, 9000) * env_ad(int(0.03 * SR), 0.0005, 0.012), 0.06 * g)  # tamborim
        bt += BEAT; i += 1

# --- Chapter 1
MSGS = []
tt, gap = B["chat"][0] + 0.25, 0.95
while tt < B["photos"][0] + 0.2:
    MSGS.append(tt); tt += gap; gap = max(0.22, gap * 0.8)
MSGS.append(T["deNovo"] - 0.05)
for m in MSGS:
    click(m, 0.07, 1500, 0.02); ping(m + 0.02, 0.03, 2100)
for k, m in enumerate(MSGS[::3]):
    buzz(m + 0.1, 0.035)
for tt in (B["photos"][0], T["confira"] - 0.1, T["responda"] - 0.1, T["avise"] - 0.1):
    swoosh(tt - 0.05, 0.35, 0.035, 1500, 6000)
    click(tt + 0.05, 0.05, 900, 0.03)
kt = T["organiza"]
while kt < T["joga"]:
    click(kt, 0.045, 2200 + 700 * rng.random(), 0.01); kt += 0.06 + 0.07 * rng.random()
swoosh(T["joga"], 0.4, 0.04, 2000, 8000)          # paper
for k in range(6):
    swoosh(T["torce"] + k * 0.55, 0.3, 0.03, 800, 4000)  # refresh
for k in range(14):
    ping(T["decima"] + 0.35 + k * 0.07, 0.035, 1600 + 90 * (k % 5)); buzz(T["decima"] + 0.35 + k * 0.07, 0.02)

# --- Chapter 2
swoosh(B["cia"][0] + 0.1, 1.2, 0.04, 200, 3000)
thump(T["cia"] + 0.25, 0.45, 70, 0.8)
ping(T["uberaba"], 0.05, 1320)
wn = int(0.45 * SR); wt = t_(wn)
whistle = np.sin(2 * np.pi * np.cumsum(2900 + 160 * np.sin(2 * np.pi * 38 * wt)) / SR) * fade(wn, 0.02, 0.12)
place(sfx, T["apito"] - 0.03, whistle + 0.15 * bp(noise(0.45), 2000, 6000), 0.045)
for i in range(7):
    click(T["w%d" % i], 0.09, 700, 0.04); thump(T["w%d" % i], 0.08, 160, 0.05)
for i in range(7):
    place(sfx, T["derruba"] + 0.2 + i * 0.13, bp(noise(0.05), 900, 3500) * env_ad(int(0.05 * SR), 0.0005, 0.02), 0.14)
click(T["mudanca"], 0.08, 500, 0.05)
for tt in (B["numbers"][0] + 0.2, B["numbers"][0] + 1.2, B["numbers"][0] + 2.2, T["fora"], T["hotel"], T["restaurante"], T["cidade"]):
    click(tt, 0.06, 1800, 0.02)
thump(T["poucos"] + 0.5, 0.18, 80, 0.3)

# --- the question: music recedes, a chant far away
chant(B["question"][0] - 0.5, B["people"][0] + 3, 0.035, buf=crowd)

# --- Chapter 3
p0 = B["people"][0]
br_n = int(4.0 * SR); br = bp(rng.standard_normal(br_n), 300, 1800) * (0.5 - 0.5 * np.cos(2 * np.pi * 0.55 * t_(br_n))) * fade(br_n, 0.4, 0.8)
place(sfx, p0 + 0.1, br, 0.035)                                     # breathing
sq = lambda t0: place(sfx, t0, np.sin(2 * np.pi * np.cumsum(np.linspace(2600, 3600, int(0.09 * SR))) / SR) * fade(int(0.09 * SR), 0.005, 0.03), 0.03)
for tt in (T["rosto"] - 0.2, T["treino"], T["treino"] + 0.4, T["onibus"] - 0.5):
    sq(tt)
thump(T["rosto"], 0.2, 70, 0.3, buf=crowd)                           # the first drum
for k in range(4):
    thump(T["historia"] + k * BEAT * 2, 0.16, 65, 0.3, buf=crowd)
chant(T["camisa"] - 1.0, L["freeze"], 0.08)
drum_bateria(T["voz"] - 0.05, L["freeze"], 1.0)
crowd_noise(T["cores"], L["freeze"], 0.05, shape=lambda p: 0.3 + 0.7 * p)
# the play: dribbles, the release, the freeze (silence), swish, buzzer, the eruption
for k in range(3):
    thump(L["L0"] + 0.3 + k * 0.3, 0.2, 130, 0.06)
swoosh(L["shot"] - 0.05, 0.4, 0.05, 1000, 5000)
place(sfx, L["swish"], bp(noise(0.25), 3000, 9000) * env_ad(int(0.25 * SR), 0.002, 0.08), 0.16)
bz = int(0.9 * SR); bzt = t_(bz)
place(sfx, L["swish"] + 0.06, np.sign(np.sin(2 * np.pi * 220 * bzt)) * 0.5 * lp(np.ones(bz), 2000) * fade(bz, 0.01, 0.1), 0.035)
er_d = 5.0; er = int(er_d * SR)
eruption = bp(rng.standard_normal(er), 250, 4000) * np.minimum(1, t_(er) / 0.12) * np.exp(-t_(er) / 2.2)
place(crowd, L["swish"] + 0.02, eruption, 0.22)
chant(L["swish"] + 1.6, B["reach"][1], 0.07)
for k in range(3):
    ping(T["todo"] + 0.5 + k * 0.15, 0.04, 1500 + 200 * k)

# --- Chapter 4
swoosh(T["pace"] - 0.55, 0.6, 0.05, 300, 4000)
mouse = [T["atleticas"], T["modalidades"], T["quadras"], T["chaveamento"] - 0.1, T["cronograma"] - 0.1, T["publicou"]]
for tt in mouse:
    click(tt, 0.1, 3200, 0.006)
chime(T["publicou"] + 0.08, 0.06)
click(T["toque"], 0.12, 1300, 0.012); click(T["placar"], 0.06, 4000, 0.005)
chime(T["sistema"], 0.05)
swoosh(T["folha"] - 0.1, 0.7, 0.03, 3000, 10000)
for tt in (T["app"] + 0.45, T["agenda"] - 0.15, T["agenda"] + 0.4, T["agenda"] + 0.85, T["mudar"] + 0.95):
    click(tt, 0.09, 1400, 0.012)
ping(T["mudar"] - 0.3, 0.06, 1760); buzz(T["mudar"] - 0.3, 0.04)
for k in range(4):
    click(B["answers"][0] + 0.2 + k * 1.05, 0.06, 1200, 0.02); ping(B["answers"][0] + 0.7 + k * 1.05, 0.03, 1400 + 120 * k)
for tt in (T["organizar"], T["registrar"], T["acompanhar"]):
    thump(tt, 0.12, 110, 0.12)
chime(T["lance"] + 0.4, 0.05)
# the stands come back for the signature; the chant stays a moment on the mark
crowd_noise(B["sign"][0] - 0.2, B["end"][1] - 0.3, 0.05, shape=lambda p: np.clip(np.minimum(p * 5, 1) * (1 - p) ** 0.6 * 1.3, 0, 1))
chant(B["sign"][0], B["end"][1] - 0.2, 0.06)

# ================================================================ VO + the real TikTok audio
vo = np.zeros(N)
for v in C["VO"]:
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(ROOT / f"audio/vo_{LANG}/{v['id']}.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    place(vo, v["at"], np.frombuffer(raw, dtype=np.float32).astype(np.float64))
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(ROOT / f"build/assets/{C['TIKTOK_DIR']}.wav"), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
real = np.zeros(N)
tk = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
place(real, 0, tk * fade(len(tk), 0.005, 0.25))

# ================================================================ cuts, silences, ducking
def zero(bufs, a, b, ramp=0.004):
    i, j, r = int(a * SR), int(b * SR), int(ramp * SR)
    for x in bufs:
        x[max(0, i - r):i] *= np.linspace(1, 0, min(r, i))
        x[i:j] = 0

zero([music, sfx, crowd], B["rush"][1], B["black"][1])     # hard cut into black; the VO speaks alone
zero([vo], B["black"][0], B["black"][0] + 1.0)              # 1 s of nothing first
zero([music, sfx, crowd, vo], L["freeze"], L["resume"])     # the ball in the air: total silence
music[int((B["end"][1] - 0.1) * SR):] = 0

env = np.sqrt(np.convolve(vo ** 2, np.ones(4800) / 4800, mode="same"))
duck = 1 - 0.5 * np.clip(env / (np.max(env) * 0.15 + 1e-9), 0, 1)
duck = np.convolve(duck, np.ones(9600) / 9600, mode="same")
music *= duck
crowd *= 0.55 + 0.45 * duck

# ================================================================ loudness staging
def write_wav(path, x):
    st = np.stack([x, x], axis=1).astype(np.float32)
    p = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s24le", str(path)], input=st.tobytes())
    assert p.returncode == 0

def lufs(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])

tmp = ROOT / "build" / LANG
sfx_all = sfx + crowd
stems = {"vo": vo, "real": real, "music": music, "sfx": sfx_all}
target = {"vo": -16.0, "real": -17.0, "music": -27.0, "sfx": -29.0}
for k, x in stems.items():
    write_wav(tmp / f"_{k}.wav", x)
    I, _ = lufs(tmp / f"_{k}.wav")
    stems[k] = x * 10 ** ((target[k] - I) / 20)
mix = sum(stems.values())
write_wav(tmp / "_mix.wav", mix)
I, _ = lufs(tmp / "_mix.wav")
trim = 10 ** ((-16.0 - I) / 20)
stems = {k: x * trim for k, x in stems.items()}
mix = mix * trim
lim = 10 ** (-1.8 / 20)
if np.max(np.abs(mix)) > lim * 0.8:
    thr = lim * 0.8
    a = np.abs(mix)
    soft = np.where(a <= thr, a, thr + (lim - thr) * np.tanh((a - thr) / (lim - thr)))
    ratio = np.where(a > 1e-9, soft / np.where(a > 1e-9, a, 1), 1)
    stems = {k: x * ratio for k, x in stems.items()}
    mix = mix * ratio
A = ROOT / "audio" / LANG
A.mkdir(parents=True, exist_ok=True)
for k, x in stems.items():
    write_wav(A / f"{k}.wav", x)
write_wav(tmp / "mix.wav", mix)
for p in tmp.glob("_*.wav"):
    p.unlink()
for k in stems:
    print(k.ljust(5), "LUFS %.1f  TP %.1f" % lufs(A / f"{k}.wav"))
print("mix   LUFS %.1f  TP %.1f" % lufs(tmp / "mix.wav"))
