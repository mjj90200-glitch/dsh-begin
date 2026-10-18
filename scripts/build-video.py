#!/usr/bin/env python3
"""把带绿幕的 AI 源视频转成带 alpha 的播放资产。

流程（对应 dsh-pet 的 step01–step04）：
  1. 去水印：用同一帧里的一块纯绿幕整块替换水印区域
  2. 抠像：按「绿色 dominance」求 alpha，并做去溢色
  3. 编码：VP9 + yuva420p 的透明 WebM，外加深底预览

用法::

    python3 scripts/build-video.py source.mp4 out-dir \
        --watermark 40,26,245,92 --bg 122,162,84

依赖：ffmpeg（可用 imageio-ffmpeg 提供）、Pillow、numpy。
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent


def ffmpeg() -> str:
    """优先用环境变量，其次 imageio-ffmpeg 自带的静态二进制。"""
    env = os.environ.get("FFMPEG")
    if env:
        return env
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        found = shutil.which("ffmpeg")
        if found:
            return found
        sys.exit("找不到 ffmpeg：设置 FFMPEG 或安装 imageio-ffmpeg")


def probe(ff: str, path: Path) -> dict:
    """从 ffmpeg 的 stderr 里抠出时长与分辨率。"""
    err = subprocess.run(
        [ff, "-hide_banner", "-i", str(path)], capture_output=True, text=True
    ).stderr
    info = {"fps": 24.0, "width": 0, "height": 0, "duration": 0.0}
    for line in err.splitlines():
        if "Duration:" in line:
            stamp = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = stamp.split(":")
            info["duration"] = int(h) * 3600 + int(m) * 60 + float(s)
        if "Stream" in line and "Video:" in line:
            for token in line.split(","):
                token = token.strip()
                if "x" in token and token.replace("x", "").isdigit():
                    w, h = token.split("x")
                    info["width"], info["height"] = int(w), int(h)
                if token.endswith("fps"):
                    try:
                        info["fps"] = float(token[:-3])
                    except ValueError:
                        pass
    return info


def green_score(arr: np.ndarray) -> np.ndarray:
    """绿色优势度：绿通道比红/蓝里更大的那个高出多少。"""
    return arr[..., 1] - np.maximum(arr[..., 0], arr[..., 2])


def find_green_patch(frame: np.ndarray, box: tuple[int, int, int, int]) -> tuple[int, int]:
    """在帧内找一块与 `box` 同尺寸、100% 是绿幕的区域，用作填补来源。"""
    x0, y0, x1, y1 = box
    h, w, _ = frame.shape
    bw, bh = x1 - x0, y1 - y0
    best = (-1.0, x0, y0)
    for dy in range(-260, 261, 26):
        for dx in range(-560, 561, 26):
            sx, sy = x0 + dx, y0 + dy
            if sx < 0 or sy < 0 or sx + bw > w or sy + bh > h:
                continue
            if abs(dx) < bw and abs(dy) < bh:
                continue
            frac = float((green_score(frame[sy : sy + bh, sx : sx + bw]) > 28).mean())
            if frac > best[0]:
                best = (frac, sx, sy)
    return best[1], best[2]


def erase_watermark(frame: np.ndarray, box: tuple[int, int, int, int]) -> np.ndarray:
    """整块替换水印区域。边缘羽化，避免留下方形接缝。"""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    sx, sy = find_green_patch(frame, box)
    patch = frame[sy : sy + bh, sx : sx + bw].copy()

    mask = Image.new("L", (bw, bh), 0)
    ImageDraw.Draw(mask).rectangle((10, 10, bw - 11, bh - 11), fill=255)
    alpha = (np.asarray(mask.filter(ImageFilter.GaussianBlur(7))).astype(np.float32) / 255)[
        ..., None
    ]

    region = frame[y0:y1, x0:x1]
    blended = region * (1 - alpha) + patch.astype(np.float32) * alpha
    out = frame.copy()
    out[y0:y1, x0:x1] = blended
    return out


def key_out(frame: np.ndarray, bg: tuple[float, float, float]) -> np.ndarray:
    """绿幕抠像：软边 alpha + 去遮罩（un-matte）。

    阈值来自实测：背景的 green-score 在 35–43，角色在 −44…−3，
    所以 34→10 之间做软过渡。

    去遮罩：把观察到的颜色还原成前景色
        F = (C − B·(1−a)) / a
    边缘像素里混进来的绿会被真正减掉，而不是靠压通道近似。
    另外把 alpha 在 0.12 以下吸附到 0、0.88 以上吸附到 1——
    否则 VP9 的有损 alpha 会在透明区留下可见的编码块。
    """
    score = green_score(frame)
    # 28/20 是实测出来的甜点：源视频压缩产生的「脏绿」(score≈24)
    # 必须判成背景，否则会在暗底上留下大片灰斑；再宽就会吃掉发丝。
    alpha = np.clip((28.0 - score) / 20.0, 0, 1)
    alpha = np.where(alpha < 0.12, 0.0, np.where(alpha > 0.88, 1.0, alpha))

    a = alpha[..., None]
    background = np.array(bg, dtype=np.float32)
    safe = np.maximum(a, 0.15)
    foreground = np.where(a > 0.12, (frame - background * (1.0 - a)) / safe, frame)
    np.clip(foreground, 0, 255, out=foreground)

    return np.dstack([foreground.astype(np.uint8), (alpha * 255).astype(np.uint8)])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("outdir")
    parser.add_argument(
        "--watermark", default=None, help="水印 bbox x0,y0,x1,y1（不填就跳过去水印）"
    )
    parser.add_argument("--bg", default=None, help="背景色（仅记录用）")
    parser.add_argument("--preview", default=None, help="深底预览输出路径 (mp4)")
    args = parser.parse_args()

    ff = ffmpeg()
    source = Path(args.source)
    outdir = Path(args.outdir)
    frames_dir = outdir / "frames"
    rgba_dir = outdir / "rgba"
    for d in (frames_dir, rgba_dir):
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True)

    info = probe(ff, source)
    print(f"源: {info['width']}x{info['height']}  {info['duration']:.2f}s  {info['fps']}fps")

    subprocess.run(
        [ff, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
         str(frames_dir / "f%04d.png")],
        check=True,
    )
    frames = sorted(frames_dir.glob("*.png"))
    print(f"抽出 {len(frames)} 帧")

    box = None
    if args.watermark:
        box = tuple(int(v) for v in args.watermark.split(","))  # type: ignore[assignment]
        print(f"去水印区域: {box}")

    bg = tuple(float(v) for v in args.bg.split(",")) if args.bg else (122.0, 162.0, 84.0)

    for index, path in enumerate(frames):
        frame = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
        if box is not None:
            frame = erase_watermark(frame, box)  # type: ignore[arg-type]
        rgba = key_out(frame, bg)  # type: ignore[arg-type]
        Image.fromarray(rgba, "RGBA").save(rgba_dir / f"f{index:04d}.png")
        if index % 20 == 0:
            print(f"  处理 {index}/{len(frames)}")

    webm = outdir / "splash-alpha.webm"
    subprocess.run(
        [ff, "-hide_banner", "-loglevel", "error", "-y",
         "-framerate", str(info["fps"]), "-i", str(rgba_dir / "f%04d.png"),
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
         "-b:v", "0", "-crf", "30", "-row-mt", "1", "-an", str(webm)],
        check=True,
    )
    print(f"透明 WebM: {webm}  {webm.stat().st_size/1024:.0f} KB")

    if args.preview:
        subprocess.run(
            [ff, "-hide_banner", "-loglevel", "error", "-y",
             "-framerate", str(info["fps"]), "-i", str(rgba_dir / "f%04d.png"),
             "-f", "lavfi", "-i", f"color=c=0x08141f:s=1280x720",
             "-filter_complex", "[1:v][0:v]overlay=shortest=1,format=yuv420p",
             "-c:v", "libx264", "-crf", "20", str(args.preview)],
            check=True,
        )
        print(f"预览: {args.preview}")


if __name__ == "__main__":
    main()
