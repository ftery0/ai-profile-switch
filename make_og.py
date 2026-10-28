#!/usr/bin/env python3
"""Generate og-image.png (1200x630) for the ai-profile-switch docs site.

Rasterizes the exact brand tokens from website/public/og-image.svg:
- bg #1a1a2e, title #e2e8f0 (mono bold 56), subtitle #94a3b8 (sans 32),
  command #64748b (mono 24). PNG at the path the vitepress config already
  references: ${siteUrl}/og-image.png
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
BG = "#1a1a2e"
FG = "#e2e8f0"
SUB = "#94a3b8"
CMD = "#64748b"

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

def font(path, size):
    return ImageFont.truetype(path, size)

mono_bold = font("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 56)
sans = font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
mono = font("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 24)

def center_text(text, fnt, fill, y):
    bbox = d.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    d.text((x, y), text, font=fnt, fill=fill)

center_text("ai-profile-switch", mono_bold, FG, 220)
center_text("Multi-account Profile Manager", sans, SUB, 315)
center_text("for Claude Code", sans, SUB, 365)
center_text("npx ai-profile-switch init", mono, CMD, 455)

img.save("/home/paperclip/work-ai-profile-switch/website/public/og-image.png", "PNG")
print("saved ai-profile-switch og-image.png")