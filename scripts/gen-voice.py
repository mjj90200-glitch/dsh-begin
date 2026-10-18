#!/usr/bin/env python3
"""用 edge-tts 把 lib/lines.js 里的全部台词烧成语音。

台词是唯一事实来源：本脚本不保存文本副本，每次运行都从 lines.js 现读。
新增/修改台词后重跑即可，文件名取文本哈希，所以旧音频不会被误用。

用法::

    python3 scripts/gen-voice.py                 # 默认晓伊原速
    python3 scripts/gen-voice.py --rate=-14% --pitch=-3Hz
    NODE_BIN=/path/to/node python3 scripts/gen-voice.py

依赖：edge-tts（pip install edge-tts）、node。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DEFAULT_VOICE = "zh-CN-XiaoyiNeural"
DEFAULT_RATE = "+0%"
DEFAULT_PITCH = "+0Hz"


def read_lines(node_bin: str) -> list[str]:
    """调用 scripts/export-lines.mjs 取回台词列表。"""
    script = ROOT / "scripts" / "export-lines.mjs"
    try:
        out = subprocess.run(
            [node_bin, str(script)],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        ).stdout
    except FileNotFoundError:
        sys.exit(f"找不到 node：{node_bin}（用 NODE_BIN 指定路径）")
    except subprocess.CalledProcessError as error:
        sys.exit(f"导出台词失败：{error.stderr.strip()}")
    return json.loads(out)


def line_id(text: str) -> str:
    """内容哈希，保证「文本改了 → 文件名也变」。"""
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default=DEFAULT_VOICE)
    parser.add_argument("--rate", default=DEFAULT_RATE)
    parser.add_argument("--pitch", default=DEFAULT_PITCH)
    parser.add_argument("--out", default=str(ROOT / "assets" / "voice"))
    args = parser.parse_args()

    node_bin = os.environ.get("NODE_BIN", "node")
    tts_bin = os.environ.get("TTS_BIN", "edge-tts")
    if shutil.which(tts_bin) is None and not Path(tts_bin).exists():
        sys.exit(f"找不到 edge-tts：{tts_bin}（用 TTS_BIN 指定路径）")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    lines = read_lines(node_bin)
    entries: dict[str, dict[str, str]] = {}
    made = 0

    for text in lines:
        ident = line_id(text)
        target = out_dir / f"{ident}.mp3"
        entries[ident] = {"text": text, "file": target.name}
        if target.exists():
            continue
        command = [
            tts_bin,
            "--voice", args.voice,
            f"--rate={args.rate}",
            f"--pitch={args.pitch}",
            "--text", text,
            "--write-media", str(target),
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"  失败: {text} — {result.stderr.strip()}", file=sys.stderr)
            continue
        made += 1
        print(f"  + {target.name}  {text}")

    manifest = {
        "voice": args.voice,
        "rate": args.rate,
        "pitch": args.pitch,
        "entries": entries,
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"完成：新增 {made} 段，共 {len(entries)} 段，清单写入 {out_dir / 'manifest.json'}")


if __name__ == "__main__":
    main()
