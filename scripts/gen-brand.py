"""Derives web-sized brand assets from the design-system originals in the prototype
folder: a small header logo, the apple-touch icon and the Open Graph share image.
Run: npm run assets:brand  (needs Pillow)
"""
import io
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DS = ROOT / "Forward_ There is more" / "_ds" / "the-hope-design-system-66e3dad3-e4ef-4716-a46b-b03fc04047ab" / "assets"
NAVY, GOLD, WHITE = (28, 39, 43), (255, 201, 70), (255, 255, 255)


def montserrat(size, weight):
    # Pillow's FreeType build can't read woff2, so unwrap it to plain TTF bytes first.
    ttf = TTFont(str(DS / "fonts" / "montserrat-400.woff2"))
    ttf.flavor = None
    buf = io.BytesIO()
    ttf.save(buf)
    buf.seek(0)
    font = ImageFont.truetype(buf, size)
    font.set_variation_by_axes([weight])
    return font


def main():
    logo = Image.open(DS / "logo" / "hope-h-white.png").convert("RGBA")
    brand = ROOT / "src" / "assets" / "brand"
    brand.mkdir(parents=True, exist_ok=True)
    small = logo.resize((round(logo.width * 96 / logo.height), 96), Image.LANCZOS)
    small.save(brand / "hope-h-white.png", optimize=True)

    icon = Image.new("RGBA", (180, 180), NAVY + (255,))
    mark = logo.resize((round(logo.width * 104 / logo.height), 104), Image.LANCZOS)
    icon.alpha_composite(mark, ((180 - mark.width) // 2, 38))
    icon.convert("RGB").save(ROOT / "public" / "apple-touch-icon.png", optimize=True)

    og = Image.new("RGB", (1200, 630), NAVY)
    draw = ImageDraw.Draw(og)
    for i in range(0, 630):
        a = max(0.0, 1 - i / 520) * 0.10
        draw.line([(0, i), (1200, i)], fill=tuple(round(NAVY[c] * (1 - a) + GOLD[c] * a) for c in range(3)))
    draw.text((80, 150), "FORWARD", font=montserrat(170, 800), fill=WHITE)
    draw.text((86, 350), "There is more", font=montserrat(64, 700), fill=GOLD)
    draw.text((88, 520), "THE HOPE  ·  FORWARD 2026", font=montserrat(26, 600), fill=(169, 167, 161))
    og_mark = logo.resize((round(logo.width * 70 / logo.height), 70), Image.LANCZOS)
    og.paste(og_mark, (1200 - 80 - og_mark.width, 500), og_mark)
    og.save(ROOT / "public" / "og-image.png", optimize=True)
    print("brand assets written")


if __name__ == "__main__":
    main()
