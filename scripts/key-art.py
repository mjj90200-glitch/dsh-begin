#!/usr/bin/env python3
"""把纯色背景的角色图抠成带 alpha 的 PNG。

出图规格见 docs/ASSET-PROMPTS.md：背景是 #FF00FF 品红，这里做三件事
——去溢色、软边 alpha、收缩 1px 去掉描边残留。

用法::

    python3 scripts/key-art.py base-raw.jpg base-keyed.png
    python3 scripts/key-art.py in.jpg out.png --bg 250,5,250 --crop 16:9 --face 494,172,233

依赖：Pillow、numpy。
"""

from __future__ import annotations

import argparse
import sys

try:
    import numpy as np
    from PIL import Image, ImageFilter
except ImportError:  # pragma: no cover - 环境缺失时给出可执行的提示
    sys.exit("需要 Pillow 与 numpy：pip install Pillow numpy")


def key_out(image: Image.Image, bg: tuple[float, float, float]) -> Image.Image:
    """去溢色 + 软边 alpha + 边缘收缩。"""
    rgba = np.asarray(image.convert("RGB")).astype(np.float32)
    background = np.array(bg, dtype=np.float32)

    # alpha 必须从原图算——先去溢色会把背景变成不透明的深色。
    dist = np.abs(rgba - background).max(axis=2)
    alpha = np.clip((dist - 30) / (85 - 30), 0, 1)

    # 去溢色：把「红蓝同时高于绿」的部分压向绿通道。
    spill = np.clip(np.minimum(rgba[..., 0], rgba[..., 2]) - rgba[..., 1], 0, None)
    rgb = rgba.copy()
    rgb[..., 0] -= spill * 0.85
    rgb[..., 2] -= spill * 0.85
    np.clip(rgb, 0, 255, out=rgb)

    # 收缩 1px 干掉描边，再轻微羽化。
    matte = (
        Image.fromarray((alpha * 255).astype(np.uint8))
        .filter(ImageFilter.MinFilter(3))
        .filter(ImageFilter.GaussianBlur(0.6))
    )
    return Image.fromarray(
        np.dstack([rgb.astype(np.uint8), np.asarray(matte)]), "RGBA"
    )


def crop_bust(image: Image.Image, face: tuple[int, int, int], ratio: str, face_ratio: float) -> Image.Image:
    """按「脸高占画面比例」取一个 target ratio 的窗口。"""
    face_x, face_y, face_h = face
    left, top = map(int, ratio.split(":"))
    win_h = int(face_h / face_ratio)
    win_w = int(win_h * left / top)
    # 窗口不能超出图像：可以变高，不能凭空变宽。
    win_w = min(win_w, image.width)
    win_h = int(win_w * top / left)
    x0 = max(0, min(image.width - win_w, face_x - win_w // 2))
    y0 = max(0, min(image.height - win_h, face_y - int(win_h * 0.34)))
    return image.crop((x0, y0, x0 + win_w, y0 + win_h))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("target")
    parser.add_argument("--bg", default="250,5,250", help="背景色 R,G,B")
    parser.add_argument("--crop", default=None, help="取景比例，例如 16:9")
    parser.add_argument("--face", default=None, help="脸 bbox：cx,cy,height")
    parser.add_argument(
        "--face-ratio", type=float, default=0.40, help="脸高占取景窗高度的比例"
    )
    parser.add_argument("--size", default=None, help="输出尺寸，例如 1920x1080")
    args = parser.parse_args()

    bg = tuple(float(part) for part in args.bg.split(","))
    image = Image.open(args.source)
    out = key_out(image, bg)  # type: ignore[arg-type]

    if args.crop is not None:
        if args.face is None:
            sys.exit("--crop 需要同时给出 --face cx,cy,height")
        face = tuple(int(part) for part in args.face.split(","))
        out = crop_bust(out, face, args.crop, args.face_ratio)  # type: ignore[arg-type]

    if args.size is not None:
        width, height = (int(part) for part in args.size.lower().split("x"))
        out = out.resize((width, height), Image.LANCZOS)

    out.save(args.target)
    print(f"{args.target}  {out.width}x{out.height}")


if __name__ == "__main__":
    main()
