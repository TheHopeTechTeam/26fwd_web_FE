"""Derives web-sized brand assets: a small header logo and the apple-touch icon from the
design-system originals in the prototype folder, and the Open Graph share image from the KV
(#26; run npm run assets:kv first).
Run: npm run assets:brand  (needs Pillow)
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DS = ROOT / "Forward_ There is more" / "_ds" / "the-hope-design-system-66e3dad3-e4ef-4716-a46b-b03fc04047ab" / "assets"
BASE = (15, 59, 89)  # KV 深藍 #0f3b59, same as --rgb-base in src/styles/tokens.css
OG_SIZE = (1200, 630)


def main():
    logo = Image.open(DS / "logo" / "hope-h-white.png").convert("RGBA")
    brand = ROOT / "src" / "assets" / "brand"
    brand.mkdir(parents=True, exist_ok=True)
    small = logo.resize((round(logo.width * 96 / logo.height), 96), Image.LANCZOS)
    small.save(brand / "hope-h-white.png", optimize=True)

    icon = Image.new("RGBA", (180, 180), BASE + (255,))
    mark = logo.resize((round(logo.width * 104 / logo.height), 104), Image.LANCZOS)
    icon.alpha_composite(mark, ((180 - mark.width) // 2, 38))
    icon.convert("RGB").save(ROOT / "public" / "apple-touch-icon.png", optimize=True)

    # The KV title spans about 23–78% of the banner's width, so a centred 1.9:1 crop keeps it whole.
    kv = Image.open(ROOT / "src" / "assets" / "kv" / "kv-2560.webp").convert("RGB")
    width = round(kv.height * OG_SIZE[0] / OG_SIZE[1])
    left = (kv.width - width) // 2
    og = kv.crop((left, 0, left + width, kv.height)).resize(OG_SIZE, Image.LANCZOS)
    og.save(ROOT / "public" / "og-image.jpg", quality=85, optimize=True, progressive=True)
    print("brand assets written")


if __name__ == "__main__":
    main()
