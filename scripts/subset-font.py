"""Builds the Chinese *heading* font as a small subset woff2 (US-18: 中文標題採子集化
woff2 — never ship the 6 MB OTF). Body copy uses the sliced Noto Serif TC from
scripts/fetch-body-font.py instead.

Source: Noto Serif TC Bold, the KV's Chinese subtitle face (#26, Comms 字體.png; OFL, see
scripts/fonts/OFL.txt).

The subset only covers characters that are rendered in the heading face (see collect()).
Missing glyphs fall back to the system font, so re-run this whenever heading copy changes.

Run: npm run assets:font   (needs fonttools + brotli)
"""
import re
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "scripts" / "fonts" / "NotoSerifTC-Bold.otf"
OUT = ROOT / "src" / "assets" / "fonts" / "fwd-heading-tc.woff2"
CJK = re.compile(r"[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]")

# Only text that is actually set in the heading face: .display-zh elements, the card
# prompts, and the heading-like content fields. Buttons and body copy use the body font.
CONTENT_FIELDS = {
    "src/data/content.ts": r"(?:title|zh|headline|date):\s*'([^']*)'",
    "src/data/testimonies.ts": r"quote:\s*'([^']*)'",
    "src/lib/canvasCard.ts": r"(?:gratitude|anticipate):\s*'([^']*)'",
}
DISPLAY_JSX = re.compile(r'className="[^"]*display-zh[^"]*"[^>]*>\s*([^<{]+)')


def collect():
    chars = set("，。、！？；：「」『』（）…—·")
    for rel, pattern in CONTENT_FIELDS.items():
        text = (ROOT / rel).read_text(encoding="utf-8")
        for match in re.findall(pattern, text):
            chars.update(CJK.findall(match))
    for path in sorted((ROOT / "src").rglob("*.tsx")):
        for match in DISPLAY_JSX.findall(path.read_text(encoding="utf-8")):
            chars.update(CJK.findall(match))
    return "".join(sorted(chars))


def main():
    text = collect()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    options = subset.Options()
    options.flavor = "woff2"
    options.hinting = False
    options.notdef_outline = True
    font = subset.load_font(str(SOURCE), options)
    sub = subset.Subsetter(options)
    sub.populate(text=text)
    sub.subset(font)
    subset.save_font(font, str(OUT), options)
    print(f"{len(text)} glyphs -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
