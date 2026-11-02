"""Builds the Hero images from the Comms KV folder on Drive (#26).

- Desktop / tablet: the no-info KV (thereismore_主日背景_taipei.png, 3713×1152, title baked in),
  as WebP at a few widths instead of the 8.8 MB PNG.
- Phone: the KV is a 3.2:1 banner, so cropping it cuts the title. thereismore.ai embeds the
  original photo (4204×2804, no title); a 1:2 slice of it from the stage edge down, so the
  crowd fills the frame (Jessie, 10/27), is sharp enough for a phone (≈1.5× on a 3× screen).
  The title is live text on phones. Comms may supply a phone KV later (1170×2532 or larger);
  swap it in here.

Run: npm run assets:kv -- <KV folder>   (needs Pillow + PyMuPDF)
"""
import io
import sys
from pathlib import Path

import fitz  # PyMuPDF: the .ai file is PDF-compatible
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "kv"
DESKTOP_WIDTHS = (1280, 1920, 2560)
PHONE_WIDTHS = (780, 1170)
PHONE_RATIO = 1 / 2  # about a phone Hero: 390 wide × calc(100svh - 56px)
PHONE_LEFT = 0.30  # where the slice starts, as a share of the photo width
PHONE_TOP = 0.42  # starts at the stage edge, so the crowd fills the frame


def embedded_images(ai_path: Path) -> list[Image.Image]:
    doc = fitz.open(str(ai_path))
    images = []
    for xref, *_ in doc[0].get_images(full=True):
        images.append(Image.open(io.BytesIO(doc.extract_image(xref)["image"])))
    return images


def save_webp(image: Image.Image, width: int, name: str, quality: int = 80) -> None:
    height = round(image.height * width / image.width)
    path = OUT / name
    image.resize((width, height), Image.LANCZOS).save(path, "WEBP", quality=quality, method=6)
    print(f"-> {path.relative_to(ROOT)} {width}×{height} ({path.stat().st_size // 1024} KB)")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1]).expanduser()
    OUT.mkdir(parents=True, exist_ok=True)

    kv = Image.open(src / "thereismore_主日背景_taipei.png").convert("RGB")
    for width in DESKTOP_WIDTHS:
        save_webp(kv, width, f"kv-{width}.webp")

    images = embedded_images(src / "thereismore.ai")
    # The photo is the largest image shaped like a photo (the wider ones are thin line-art
    # layers); the large portrait one is the paper texture.
    photo = max((i for i in images if 1.2 < i.width / i.height < 2), key=lambda i: i.width * i.height).convert("RGB")
    texture = max((i for i in images if i.height > i.width), key=lambda i: i.width * i.height)
    print(f"photo {photo.size}, texture {texture.size}")
    top = round(photo.height * PHONE_TOP)
    width = round((photo.height - top) * PHONE_RATIO)
    left = round(photo.width * PHONE_LEFT)
    phone = photo.crop((left, top, left + width, photo.height))
    # Same paper grain as the KV, lightly.
    grain = texture.convert("L").resize(phone.size)
    phone = Image.blend(phone, Image.merge("RGB", [grain] * 3), 0.08)
    for w in PHONE_WIDTHS:
        # Grainy photo behind a dark overlay: lower quality is invisible and halves the bytes.
        save_webp(phone, w, f"kv-phone-{w}.webp", quality=62)


if __name__ == "__main__":
    main()
