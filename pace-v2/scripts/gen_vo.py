"""Generate the voiceover with edge-tts (Andrew Multilingual, Portuguese or English).

For each line in src/vo-lines.json: audio/vo_<lang>/<id>.wav (48 kHz mono, leading/trailing
silence trimmed) and word timings in src/vo_<lang>.json (seconds, relative to the trimmed clip).
Usage: .venv/bin/python -I scripts/gen_vo.py pt|en [ID ...]   (no IDs = all lines)
"""
import asyncio, json, pathlib, subprocess, sys
import numpy as np
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
LANG = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ("pt", "en") else "pt"
cfg = json.loads((ROOT / "src/vo-lines.json").read_text())
VOICE = {"voice": cfg["voice_en"], "rate": cfg["rate_en"]} if LANG == "en" else {"voice": cfg["voice"], "rate": cfg["rate"]}
OUT = ROOT / f"audio/vo_{LANG}"; OUT.mkdir(parents=True, exist_ok=True)
only = set(a for a in sys.argv[1:] if a not in ("pt", "en"))
vo_json = ROOT / f"src/vo_{LANG}.json"
old = {r["id"]: r for r in json.loads(vo_json.read_text())} if vo_json.exists() else {}


async def synth(line):
    mp3 = OUT / f"{line['id']}.mp3"
    for attempt in range(6):
        try:
            com = edge_tts.Communicate(line["tts_en" if LANG == "en" else "tts"], VOICE["voice"], rate=line.get("rate", VOICE["rate"]),
                                       pitch=line.get("pitch", "+0Hz"), boundary="WordBoundary")
            words, audio = [], bytearray()
            async def pull():
                async for ch in com.stream():
                    if ch["type"] == "audio":
                        audio.extend(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        t0 = ch["offset"] / 1e7
                        words.append({"w": ch["text"], "t0": t0, "t1": t0 + ch["duration"] / 1e7})
            await asyncio.wait_for(pull(), timeout=45)  # the service sometimes stalls
            mp3.write_bytes(bytes(audio))
            return mp3, words
        except Exception as e:  # the service drops requests now and then
            print("retry", line["id"], e)
            await asyncio.sleep(2)
    sys.exit(f"edge-tts failed for {line['id']}")


def measure(path):
    """Return (lead, speech_end) in seconds using a -42 dB gate."""
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "48000", "-"])
    x = np.frombuffer(raw, dtype=np.float32)
    env = np.sqrt(np.convolve(x * x, np.ones(480) / 480, mode="same"))
    on = np.where(env > 10 ** (-42 / 20))[0]
    return on[0] / 48000, on[-1] / 48000


async def main():
    result = []
    for line in cfg["lines"]:
        cached = OUT / f"{line['id']}.json"
        if not only and line["id"] not in old and cached.exists() and (OUT / f"{line['id']}.wav").exists():
            old[line["id"]] = json.loads(cached.read_text())  # finished in an earlier, interrupted run
        if (only and line["id"] in only) or line["id"] not in old:
            mp3, words = await synth(line)
            lead, end = measure(mp3)
            lead, end = max(0.0, lead - 0.03), end + 0.12
            subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ss", f"{lead:.3f}", "-to", f"{end:.3f}",
                                   "-af", "afade=t=in:d=0.01,areverse,afade=t=in:d=0.06,areverse",
                                   "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(OUT / f"{line['id']}.wav")])
            mp3.unlink()
            rec = {"id": line["id"], "dur": round(end - lead, 3),
                   "words": [{"w": w["w"], "t0": round(w["t0"] - lead, 3), "t1": round(w["t1"] - lead, 3)} for w in words]}
            cached.write_text(json.dumps(rec, ensure_ascii=False))
        else:
            rec = old[line["id"]]
        nw = len(line["en" if LANG == "en" else "text"].split())
        print(f"{rec['id']:4s} {rec['dur']:5.2f}s  {nw:2d}w  {nw / rec['dur']:.2f} w/s")
        result.append(rec)
    vo_json.write_text(json.dumps(result, indent=1, ensure_ascii=False))

asyncio.run(main())
