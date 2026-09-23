"""Builds the Chinese *heading* font as a small subset woff2 (US-18: 中文標題採子集化
woff2，內文系統字 — never ship the 16 MB OTF). Body copy keeps using system fonts.

The subset only covers characters that are rendered in the heading face (see collect()).
Missing glyphs fall back to the system font, so re-run this whenever heading copy changes.

Run: npm run assets:font   (needs fonttools + brotli)
"""
import re
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Forward_ There is more" / "_ds" / "the-hope-design-system-66e3dad3-e4ef-4716-a46b-b03fc04047ab" / "assets" / "fonts" / "noto-sans-tc-400.otf"
OUT = ROOT / "src" / "assets" / "fonts" / "fwd-heading-tc.woff2"
CJK = re.compile(r"[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]")

# Only text that is actually set in the heading face: .display-zh elements, the card
# prompts, and the heading-like content fields. Buttons and body copy use system fonts.
CONTENT_FIELDS = {
    "src/data/content.ts": r"(?:title|zh|headline):\s*'([^']*)'",
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
