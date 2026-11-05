"""Builds the FORWARD 卡 web background from the print design (11/04): the same brown, the
architectural line drawing and the paper grain as the printed card, composited at web size.

Source: Forward卡/forward卡.pdf (Comms' print file, kept out of git because of its size). The
two raster layers used are the line drawing (850×1100) and the grain (2173×3000).

Run: python3 scripts/gen-card-bg.py   (needs PyMuPDF and Pillow)
"""
import io
from pathlib import Path

import fitz
from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Forward卡" / "forward卡.pdf"
OUT = ROOT / "src" / "assets" / "card" / "forward-card-bg.webp"
# For tall sections: the same ground with a mirrored copy below, so it repeats down the page
# without a visible seam.
OUT_TILE = ROOT / "src" / "assets" / "card" / "forward-card-bg-tile.webp"
SIZE = (1600, 1600)
BROWN = (72, 60, 58)  # #483c3a, sampled from the printed card
LINE_XREF, GRAIN_XREF = 1550, 66


def layer(doc, xref):
    return Image.open(io.BytesIO(doc.extract_image(xref)["image"])).convert("L")


def cover(im, size):
    scale = max(size[0] / im.width, size[1] / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left, top = (im.width - size[0]) // 2, (im.height - size[1]) // 2
    return im.crop((left, top, left + size[0], top + size[1]))


def main():
    doc = fitz.open(str(SOURCE))
    base = Image.new("RGB", SIZE, BROWN)

    # Line drawing: dark lines on pale paper → a soft darkening of the brown along the lines.
    # The print shows only part of the drawing, larger and faint: use the middle half, enlarged.
    drawing = layer(doc, LINE_XREF)
    w, h = drawing.size
    drawing = drawing.crop((w // 4, h // 4, w * 3 // 4, h * 3 // 4))
    lines = cover(drawing, SIZE)
    lines = ImageOps.autocontrast(ImageOps.invert(lines), cutoff=2)  # lines bright, paper dark
    shade = lines.point(lambda v: 255 - int(v * 0.17))  # up to 17% darker on a line
    out = ImageChops.multiply(base, Image.merge("RGB", [shade] * 3))

    # Grain: the print shows small light specks, so the grain's dark specks are lifted.
    grain = cover(layer(doc, GRAIN_XREF), SIZE)
    specks = ImageOps.invert(grain).point(lambda v: 0 if v < 120 else min(255, (v - 120) * 3))
    light = Image.new("RGB", SIZE, (236, 226, 214))
    out = Image.composite(light, out, specks.point(lambda v: int(v * 0.42)))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, "WEBP", quality=72, method=6)
    print(f"{OUT.relative_to(ROOT)} {OUT.stat().st_size // 1024} KB")

    tile = Image.new("RGB", (SIZE[0], SIZE[1] * 2))
    tile.paste(out, (0, 0))
    tile.paste(ImageOps.flip(out), (0, SIZE[1]))
    tile.save(OUT_TILE, "WEBP", quality=72, method=6)
    print(f"{OUT_TILE.relative_to(ROOT)} {OUT_TILE.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
