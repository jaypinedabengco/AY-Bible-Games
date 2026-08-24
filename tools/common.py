"""
Shared palette and SVG helpers for the illustration generators.

Both gen_images.py (game 1 scenes) and gen_clues.py (game 2 rebus clues)
import from here, so the two decks cannot drift apart visually.
"""

import math

# ---------------------------------------------------------------- palette ---
CREAM    = "#FBF3E4"
SKY      = "#BBDCEA"
SKY_D    = "#7FB4C9"
NIGHT    = "#26324A"
NIGHT_D  = "#1B2437"
WATER    = "#3E7F97"
WATER_D  = "#2F657A"
TEAL_L   = "#6BB0C4"
SAND     = "#E3C489"
SAND_D   = "#BE9C61"
SOIL     = "#6B5334"
GREEN    = "#7BA05B"
GREEN_D  = "#5E8046"
WOOD     = "#9C6239"
WOOD_D   = "#79492A"
STONE    = "#A9B2BC"
STONE_D  = "#87919C"
GOLD     = "#E5B23C"
GOLD_D   = "#C08F26"
RED      = "#C1523C"
RED_D    = "#993D2B"
PINK     = "#E08A7E"
PINK_L   = "#F2D2C2"
PURPLE   = "#7B5EA7"
PURPLE_D = "#54407A"
DARK     = "#2E3440"
WHITE    = "#F7F3EA"
FIRE     = "#E8863C"
FIRE_D   = "#C9562A"
SKIN     = "#EFBD93"
GREY     = "#9BA3AD"
GREY_D   = "#7A828C"
BROWN    = "#A9784B"
BROWN_D  = "#7F5730"

# The font stack used for the few glyph clues (letters, ampersand). Kept to
# faces that exist basically everywhere so the SVGs render the same offline.
FONT = "Verdana, DejaVu Sans, Arial, Helvetica, sans-serif"


# ---------------------------------------------------------------- helpers ---
def svg(inner, w, h, bg=None):
    """Wrap markup in a responsive, self-contained SVG root."""
    plate = f'  <rect width="{w}" height="{h}" fill="{bg}"/>\n' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet">\n'
        f'{plate}{inner}\n</svg>\n'
    )


def star4(cx, cy, r, col=GOLD, op=1.0):
    """A four-point sparkle."""
    s = r * 0.28
    d = (f"M{cx:.0f},{cy-r:.0f} L{cx+s:.0f},{cy-s:.0f} L{cx+r:.0f},{cy:.0f} "
         f"L{cx+s:.0f},{cy+s:.0f} L{cx:.0f},{cy+r:.0f} L{cx-s:.0f},{cy+s:.0f} "
         f"L{cx-r:.0f},{cy:.0f} L{cx-s:.0f},{cy-s:.0f} Z")
    return f'<path d="{d}" fill="{col}" opacity="{op}"/>'


def rays(cx, cy, n, r_in, r_out, col=GOLD, op=0.35, width=0.05):
    """A radial burst of tapered rays."""
    out = []
    for i in range(n):
        a = (2 * math.pi / n) * i
        a1, a2 = a - width, a + width
        pts = [(cx + r_in * math.cos(a1), cy + r_in * math.sin(a1)),
               (cx + r_out * math.cos(a1), cy + r_out * math.sin(a1)),
               (cx + r_out * math.cos(a2), cy + r_out * math.sin(a2)),
               (cx + r_in * math.cos(a2), cy + r_in * math.sin(a2))]
        d = "M" + " L".join(f"{x:.0f},{y:.0f}" for x, y in pts) + " Z"
        out.append(f'<path d="{d}" fill="{col}" opacity="{op}"/>')
    return "".join(out)


def glyph(ch, cx=200, baseline=306, size=300, col=DARK):
    """A single large character, for the letter clues."""
    return (f'<text x="{cx}" y="{baseline}" text-anchor="middle" '
            f'font-family="{FONT}" font-size="{size}" font-weight="bold" '
            f'fill="{col}">{ch}</text>')
