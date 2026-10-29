"""Converts the FORWARD KV Latin fonts (#26, Comms 字體.png) to the woff2 files the site serves.

Recia Serif Display and Awesome Serif are licensed for web use only (Ian, 2026-10-22), so the
source TTFs never go into this public repo; only the woff2 output does. Get the TTFs from the
Comms KV folder on Drive and pass that folder:

Run: npm run assets:kv-fonts -- <folder with the TTFs>   (needs fonttools + brotli)
"""
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "fonts"


def save_woff2(font: TTFont, name: str) -> None:
    path = OUT / name
    font.flavor = "woff2"
    font.save(str(path))
    print(f"-> {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB)")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1]).expanduser()
    OUT.mkdir(parents=True, exist_ok=True)

    save_woff2(TTFont(src / "reciaserifdisplay-bold.ttf"), "recia-serif-display-bold.woff2")

    # 字體.png asks for the "Bold Regular" style: pin the height axis to Regular (0) and keep
    # the weight axis, so CSS font-weight 700 gives Bold Regular.
    awesome = instancer.instantiateVariableFont(TTFont(src / "Awesome-Serif-VAR-VF.ttf"), {"hght": 0})
    save_woff2(awesome, "awesome-serif-var.woff2")


if __name__ == "__main__":
    main()
