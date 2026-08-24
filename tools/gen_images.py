#!/usr/bin/env python3
"""
Generates the flat-vector SVG illustrations for the Bible Names deck.

Why a generator instead of 18 hand-written files:
  - one shared palette and frame size, so the deck reads as a single set
  - restyling everything is a one-line change
  - the SVGs are build output, not source you hand-maintain

Run:  python3 tools/gen_images.py
Out:  games/bible-names/images/*.svg
"""

import math
import os
import random

from common import *  # palette + shared svg/star4/rays helpers

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "games", "characters", "images")

W, H = 800, 600

# ---------------------------------------------------------------- helpers ---
def frame(inner, bg=CREAM):
    return svg(inner, W, H, bg)


def stars(n, seed, x0=0, y0=0, x1=W, y1=380, col=WHITE, rmin=1.4, rmax=3.4):
    rnd = random.Random(seed)
    out = []
    for _ in range(n):
        x = rnd.uniform(x0, x1)
        y = rnd.uniform(y0, y1)
        r = rnd.uniform(rmin, rmax)
        o = rnd.uniform(0.45, 1.0)
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" '
                   f'fill="{col}" opacity="{o:.2f}"/>')
    return "".join(out)




def waves(y, col=WHITE, op=0.45, n=4, seed=1):
    rnd = random.Random(seed)
    out = []
    for i in range(n):
        x = rnd.uniform(20, 680)
        yy = y + rnd.uniform(10, 150)
        w = rnd.uniform(50, 100)
        out.append(f'<path d="M{x:.0f},{yy:.0f} q{w/4:.0f},-10 {w/2:.0f},0 '
                   f'q{w/4:.0f},10 {w/2:.0f},0" fill="none" stroke="{col}" '
                   f'stroke-width="5" stroke-linecap="round" opacity="{op}"/>')
    return "".join(out)


def crown(cx, cy, w=120, h=70, col=GOLD, rim=GOLD_D):
    hw = w / 2
    d = (f"M{cx-hw},{cy+h*0.5} L{cx-hw},{cy-h*0.3} L{cx-hw*0.5},{cy+h*0.05} "
         f"L{cx},{cy-h*0.55} L{cx+hw*0.5},{cy+h*0.05} L{cx+hw},{cy-h*0.3} "
         f"L{cx+hw},{cy+h*0.5} Z")
    jewels = "".join(
        f'<circle cx="{cx+dx:.0f}" cy="{cy+h*0.22:.0f}" r="7" fill="{c}"/>'
        for dx, c in ((-hw*0.55, RED), (0, GREEN), (hw*0.55, PURPLE)))
    tips = "".join(
        f'<circle cx="{cx+dx:.0f}" cy="{cy+dy:.0f}" r="6" fill="{rim}"/>'
        for dx, dy in ((-hw, -h*0.3), (0, -h*0.55), (hw, -h*0.3)))
    return (f'<path d="{d}" fill="{col}"/>'
            f'<rect x="{cx-hw-4:.0f}" y="{cy+h*0.42:.0f}" width="{w+8:.0f}" '
            f'height="16" rx="8" fill="{rim}"/>{jewels}{tips}')


def flame(cx, base, w, h, col, op=1.0):
    """A single upward flame tongue, rooted at (cx, base)."""
    d = (f"M{cx},{base} "
         f"C{cx-w:.0f},{base-h*0.34:.0f} {cx-w*0.55:.0f},{base-h*0.62:.0f} "
         f"{cx-w*0.22:.0f},{base-h:.0f} "
         f"C{cx+w*0.12:.0f},{base-h*0.60:.0f} {cx+w*0.38:.0f},{base-h*0.72:.0f} "
         f"{cx+w*0.48:.0f},{base-h*0.44:.0f} "
         f"C{cx+w*0.8:.0f},{base-h*0.58:.0f} {cx+w:.0f},{base-h*0.28:.0f} "
         f"{cx},{base} Z")
    return f'<path d="{d}" fill="{col}" opacity="{op}"/>'


def dove(cx, cy, s=1.0, wing=STONE):
    """A dove in flight, facing right. Body centred on (cx, cy)."""
    return (f'<g transform="translate({cx} {cy}) scale({s}) rotate(-8)">'
            f'<polygon points="-42,-6 -104,-32 -92,10 -44,14" fill="{WHITE}"/>'
            f'<ellipse cx="0" cy="0" rx="52" ry="26" fill="{WHITE}"/>'
            f'<path d="M-8,10 Q22,40 62,30 Q22,30 -6,4 Z" fill="{wing}" opacity="0.75"/>'
            f'<path d="M-4,-14 Q6,-86 62,-100 Q42,-44 26,-8 Z" fill="{WHITE}" '
            f'stroke="{wing}" stroke-width="4"/>'
            f'<circle cx="48" cy="-14" r="19" fill="{WHITE}"/>'
            f'<polygon points="65,-14 90,-8 65,-2" fill="{GOLD}"/>'
            f'<circle cx="53" cy="-19" r="3.5" fill="{DARK}"/></g>')


def wheat(x, y, hgt=90, col=GOLD, stem=GREEN_D, tilt=0.0):
    """One stalk of wheat, base at (x, y)."""
    tx = x + tilt * hgt
    parts = [f'<path d="M{x},{y} Q{x + tilt*hgt*0.4:.0f},{y-hgt*0.5:.0f} '
             f'{tx:.0f},{y-hgt:.0f}" fill="none" stroke="{stem}" '
             f'stroke-width="4" stroke-linecap="round"/>']
    for i in range(5):
        t = i / 5.0
        gy = y - hgt + hgt * 0.44 * t
        gx = tx - tilt * hgt * 0.44 * t
        for s in (-1, 1):
            parts.append(
                f'<ellipse cx="{gx + s*7:.0f}" cy="{gy:.0f}" rx="6" ry="10" '
                f'fill="{col}" transform="rotate({s*28} {gx + s*7:.0f} {gy:.0f})"/>')
    return "".join(parts)


def figure(cx, base, scale=1.0, col=DARK, staff=False):
    """A small robed human silhouette, feet at (cx, base)."""
    s = scale
    body = (f'<path d="M{cx-26*s:.0f},{base} '
            f'Q{cx-22*s:.0f},{base-70*s:.0f} {cx-13*s:.0f},{base-86*s:.0f} '
            f'L{cx+13*s:.0f},{base-86*s:.0f} '
            f'Q{cx+22*s:.0f},{base-70*s:.0f} {cx+26*s:.0f},{base} Z" '
            f'fill="{col}"/>')
    head = f'<circle cx="{cx}" cy="{base-104*s:.0f}" r="{15*s:.0f}" fill="{col}"/>'
    st = ''
    if staff:
        st = (f'<line x1="{cx+30*s:.0f}" y1="{base+4}" x2="{cx+22*s:.0f}" '
              f'y2="{base-128*s:.0f}" stroke="{WOOD_D}" '
              f'stroke-width="{7*s:.0f}" stroke-linecap="round"/>')
    return st + body + head


# ----------------------------------------------------------------- scenes ---
def noah():
    p = []
    p.append(f'<rect width="800" height="420" fill="{SKY}"/>')
    for i, c in enumerate([RED, FIRE, GOLD, GREEN, SKY_D, PURPLE]):
        r = 320 - i * 26
        p.append(f'<path d="M{400-r},420 A{r},{r} 0 0 1 {400+r},420" '
                 f'fill="none" stroke="{c}" stroke-width="24" opacity="0.75"/>')
    p.append(f'<rect y="392" width="800" height="208" fill="{WATER}"/>')
    p.append(waves(400, n=5, seed=3))
    # animals peeking over the cabin
    for x in (338, 452):
        p.append(f'<rect x="{x}" y="228" width="16" height="72" rx="8" fill="{GOLD_D}"/>'
                 f'<circle cx="{x+8}" cy="226" r="14" fill="{GOLD_D}"/>'
                 f'<circle cx="{x+2}" cy="212" r="4" fill="{DARK}"/>'
                 f'<circle cx="{x+15}" cy="212" r="4" fill="{DARK}"/>')
    p.append(f'<polygon points="306,300 494,300 400,252" fill="{RED}"/>')
    p.append(f'<rect x="322" y="298" width="156" height="80" fill="{WOOD}"/>')
    p.append(f'<circle cx="358" cy="336" r="13" fill="{GOLD}"/>'
             f'<circle cx="442" cy="336" r="13" fill="{GOLD}"/>')
    p.append(f'<rect x="224" y="374" width="352" height="26" rx="8" fill="{WOOD_D}"/>')
    p.append(f'<path d="M232,398 L568,398 L524,470 Q400,494 276,470 Z" fill="{WOOD}"/>')
    for y in (416, 440):
        p.append(f'<path d="M{250 if y<430 else 262},{y} L{550 if y<430 else 538},{y}" '
                 f'stroke="{WOOD_D}" stroke-width="4" opacity="0.6"/>')
    # dove carrying the olive leaf
    p.append(dove(160, 140, s=0.78))
    p.append(f'<ellipse cx="228" cy="146" rx="19" ry="8" fill="{GREEN}" '
             f'transform="rotate(26 228 146)"/>')
    p.append(f'<ellipse cx="252" cy="156" rx="15" ry="7" fill="{GREEN_D}" '
             f'transform="rotate(30 252 156)"/>')
    return frame("\n".join(p))


def moses():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(f'<circle cx="400" cy="230" r="210" fill="{GOLD}" opacity="0.22"/>')
    p.append(f'<rect y="446" width="800" height="154" fill="{SAND}"/>')
    # towering walls of water on either side of a dry corridor
    for side in (0, 1):
        if side == 0:
            wall = ("M0,150 Q46,120 92,158 Q138,196 186,168 L212,600 L0,600 Z")
            crest = ("M0,150 Q46,120 92,158 Q138,196 186,168 L188,204 "
                     "Q138,232 92,194 Q46,156 0,186 Z")
        else:
            wall = ("M614,168 Q662,196 708,158 Q754,120 800,150 L800,600 L588,600 Z")
            crest = ("M614,168 Q662,196 708,158 Q754,120 800,150 L800,186 "
                     "Q754,156 708,194 Q662,232 616,204 Z")
        p.append(f'<path d="{wall}" fill="{WATER}"/>')
        p.append(f'<path d="{crest}" fill="{WHITE}" opacity="0.40"/>')
        for k in range(4):
            y = 260 + k * 78
            xs = 8 if side == 0 else 622
            p.append(f'<path d="M{xs},{y} q46,-22 92,4 q46,26 88,-6" fill="none" '
                     f'stroke="{WHITE}" stroke-width="6" opacity="0.28"/>')
    # dry seabed footprints leading away
    for i, x in enumerate((286, 330, 374, 424, 470)):
        p.append(f'<ellipse cx="{x}" cy="{520 + (i % 2) * 30}" rx="15" ry="9" '
                 f'fill="{SAND_D}" opacity="0.85"/>')
    # the two tablets, large and unmistakable
    p.append(f'<ellipse cx="400" cy="452" rx="150" ry="26" fill="{DARK}" opacity="0.18"/>')
    for x in (272, 406):
        p.append(f'<path d="M{x},{452} L{x},{258} Q{x},{188} {x+61},{188} '
                 f'Q{x+122},{188} {x+122},{258} L{x+122},{452} Z" '
                 f'fill="{STONE}" stroke="{STONE_D}" stroke-width="7"/>')
        for i in range(5):
            y = 264 + i * 36
            p.append(f'<rect x="{x+24}" y="{y}" width="74" height="9" rx="4.5" '
                     f'fill="{DARK}" opacity="0.45"/>')
    p.append(f'<rect x="396" y="188" width="8" height="264" fill="{SKY}" opacity="0.55"/>')
    # the staff
    p.append(f'<path d="M182,566 L146,272 Q144,246 168,242" fill="none" stroke="{WOOD_D}" '
             f'stroke-width="15" stroke-linecap="round"/>')
    return frame("\n".join(p))


def david():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(f'<path d="M0,420 Q200,352 400,412 Q600,464 800,398 L800,600 L0,600 Z" fill="{GREEN}"/>')
    p.append(f'<path d="M0,470 Q220,424 440,472 Q640,516 800,470 L800,600 L0,600 Z" fill="{GREEN_D}"/>')
    p.append(crown(400, 128))
    # harp
    # soundbox down the pillar side, so it reads as a harp and not a ladder
    p.append(f'<path d="M330,192 L372,200 L358,482 L316,482 Z" fill="{GOLD_D}"/>')
    p.append(f'<path d="M340,208 L360,212 L350,470 L332,470 Z" fill="{GOLD}" opacity="0.6"/>')
    p.append(f'<line x1="346" y1="194" x2="478" y2="254" stroke="{GOLD}" '
             f'stroke-width="20" stroke-linecap="round"/>')
    for x in (376, 404, 432, 460):
        y = 194 + (x - 346) * 0.4545
        p.append(f'<line x1="{x}" y1="{y:.0f}" x2="{x}" y2="470" stroke="{WHITE}" '
                 f'stroke-width="3" opacity="0.85"/>')
    p.append(f'<rect x="318" y="468" width="182" height="26" rx="13" fill="{GOLD_D}"/>')
    # shepherd's crook
    p.append(f'<path d="M604,548 L598,268 Q596,214 646,212 Q692,210 694,254 '
             f'Q696,288 664,292" fill="none" stroke="{WOOD}" stroke-width="17" '
             f'stroke-linecap="round"/>')
    # five smooth stones
    for i in range(5):
        p.append(f'<ellipse cx="{116 + i*50}" cy="{540 - (i % 2)*12}" rx="23" ry="17" '
                 f'fill="{STONE}" stroke="{STONE_D}" stroke-width="4"/>')
    return frame("\n".join(p))


def goliath():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(f'<path d="M0,468 Q400,436 800,468 L800,600 L0,600 Z" fill="{GREEN}"/>')
    # giant
    p.append(f'<line x1="646" y1="132" x2="672" y2="562" stroke="{WOOD_D}" '
             f'stroke-width="12" stroke-linecap="round"/>')
    p.append(f'<polygon points="640,138 652,86 664,142" fill="{STONE}"/>')
    p.append(f'<rect x="468" y="380" width="42" height="182" rx="12" fill="{DARK}"/>')
    p.append(f'<rect x="540" y="380" width="42" height="182" rx="12" fill="{DARK}"/>')
    p.append(f'<path d="M452,214 L598,214 L616,398 L434,398 Z" fill="{DARK}"/>')
    p.append(f'<path d="M452,232 L420,318 L438,330 L470,250 Z" fill="{DARK}"/>')
    p.append(f'<path d="M598,232 L634,306 L616,320 L586,252 Z" fill="{DARK}"/>')
    for i in range(4):
        p.append(f'<rect x="466" y="{248 + i*34}" width="118" height="8" rx="4" '
                 f'fill="{STONE_D}" opacity="0.55"/>')
    p.append(f'<circle cx="525" cy="164" r="46" fill="{DARK}"/>')
    p.append(f'<path d="M479,164 Q525,104 571,164 Z" fill="{STONE_D}"/>')
    p.append(f'<path d="M525,104 Q545,58 512,44 Q536,72 517,102 Z" fill="{RED}"/>')
    p.append(f'<ellipse cx="424" cy="318" rx="50" ry="64" fill="{STONE_D}" '
             f'stroke="{DARK}" stroke-width="5"/>'
             f'<circle cx="424" cy="318" r="15" fill="{GOLD}"/>')
    # the small challenger
    p.append(figure(178, 508, scale=0.62, staff=False))
    p.append(f'<circle cx="178" cy="392" r="34" fill="none" stroke="{DARK}" '
             f'stroke-width="4" stroke-dasharray="9 8" opacity="0.75"/>')
    p.append(f'<circle cx="178" cy="358" r="9" fill="{STONE}" stroke="{DARK}" stroke-width="3"/>')
    return frame("\n".join(p))


def jonah():
    p = [f'<rect width="800" height="600" fill="{SKY_D}"/>']
    for cx, cy, r in ((150, 92, 54), (215, 74, 44), (600, 86, 58), (672, 104, 42)):
        p.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{STONE_D}" opacity="0.85"/>')
    p.append(f'<polygon points="330,60 300,150 342,144 314,214 384,116 344,122 372,60" fill="{GOLD}"/>')
    for i in range(9):
        x = 40 + i * 88
        p.append(f'<line x1="{x}" y1="150" x2="{x-18}" y2="228" stroke="{WHITE}" '
                 f'stroke-width="3" opacity="0.35"/>')
    p.append(f'<rect y="332" width="800" height="268" fill="{WATER_D}"/>')
    # boat, listing
    p.append(f'<g transform="rotate(-13 140 344)">'
             f'<path d="M56,332 L214,332 L188,382 L84,382 Z" fill="{WOOD}"/>'
             f'<line x1="136" y1="332" x2="136" y2="236" stroke="{WOOD_D}" stroke-width="8"/>'
             f'<polygon points="142,244 142,322 206,322" fill="{WHITE}"/></g>')
    # the great fish
    p.append(f'<path d="M736,420 L800,336 L788,420 L800,504 Z" fill="{TEAL_L}" '
             f'stroke="{DARK}" stroke-width="5"/>')
    p.append(f'<ellipse cx="502" cy="422" rx="244" ry="132" fill="{TEAL_L}" '
             f'stroke="{DARK}" stroke-width="6"/>')
    p.append(f'<path d="M470,300 Q520,258 578,296 Q520,300 470,300 Z" fill="{TEAL_L}" '
             f'stroke="{DARK}" stroke-width="5"/>')
    p.append(f'<path d="M312,344 Q252,422 312,500 L358,422 Z" fill="{NIGHT_D}" '
             f'stroke="{DARK}" stroke-width="5"/>')
    for i in range(4):
        p.append(f'<polygon points="{300+i*4},{358+i*34} {326},{368+i*34} {300+i*4},{382+i*34}" '
                 f'fill="{WHITE}"/>')
    p.append(f'<circle cx="404" cy="374" r="18" fill="{WHITE}"/>'
             f'<circle cx="408" cy="374" r="9" fill="{DARK}"/>')
    for a, x, y in ((-24, 292, 342), (16, 316, 330)):
        p.append(f'<rect x="{x}" y="{y}" width="15" height="52" rx="7" fill="{DARK}" '
                 f'transform="rotate({a} {x} {y})"/>')
    p.append(waves(340, n=5, seed=9, op=0.3))
    return frame("\n".join(p))


def daniel():
    p = [f'<rect width="800" height="600" fill="{NIGHT}"/>']
    p.append(stars(70, 21, y1=300))
    p.append(f'<circle cx="662" cy="118" r="50" fill="{WHITE}" opacity="0.92"/>')
    p.append(f'<circle cx="642" cy="106" r="42" fill="{NIGHT}" opacity="0.85"/>')
    p.append(f'<path d="M108,440 L108,246 Q400,116 692,246 L692,440 Z" fill="{NIGHT_D}"/>')
    for i in range(9):
        a = math.pi - (math.pi / 8) * i
        x, y = 400 + 292 * math.cos(a), 250 + 150 * math.sin(a)
        p.append(f'<rect x="{x-26:.0f}" y="{y-22:.0f}" width="52" height="40" rx="6" '
                 f'fill="{STONE_D}" stroke="{NIGHT_D}" stroke-width="4"/>')
    p.append(f'<rect y="436" width="800" height="164" fill="{STONE_D}"/>')
    for i in range(7):
        p.append(f'<rect x="{-40 + i*126}" y="480" width="118" height="52" rx="6" '
                 f'fill="{STONE}" stroke="{STONE_D}" stroke-width="4"/>')

    def lion(cx, cy, s):
        return (f'<ellipse cx="{cx+30*s:.0f}" cy="{cy+82*s:.0f}" rx="{96*s:.0f}" '
                f'ry="{54*s:.0f}" fill="{GOLD_D}"/>'
                f'<path d="M{cx+120*s:.0f},{cy+70*s:.0f} q{50*s:.0f},{10*s:.0f} '
                f'{34*s:.0f},{-52*s:.0f}" fill="none" stroke="{GOLD_D}" '
                f'stroke-width="{11*s:.0f}" stroke-linecap="round"/>'
                f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{68*s:.0f}" fill="{GOLD_D}"/>'
                f'<circle cx="{cx-46*s:.0f}" cy="{cy-42*s:.0f}" r="{14*s:.0f}" fill="{GOLD_D}"/>'
                f'<circle cx="{cx+46*s:.0f}" cy="{cy-42*s:.0f}" r="{14*s:.0f}" fill="{GOLD_D}"/>'
                f'<circle cx="{cx:.0f}" cy="{cy+4*s:.0f}" r="{48*s:.0f}" fill="{GOLD}"/>'
                f'<circle cx="{cx-18*s:.0f}" cy="{cy-8*s:.0f}" r="{6*s:.0f}" fill="{DARK}"/>'
                f'<circle cx="{cx+18*s:.0f}" cy="{cy-8*s:.0f}" r="{6*s:.0f}" fill="{DARK}"/>'
                f'<ellipse cx="{cx:.0f}" cy="{cy+24*s:.0f}" rx="{26*s:.0f}" '
                f'ry="{17*s:.0f}" fill="{SAND}"/>'
                f'<polygon points="{cx-8*s:.0f},{cy+16*s:.0f} {cx+8*s:.0f},{cy+16*s:.0f} '
                f'{cx:.0f},{cy+26*s:.0f}" fill="{DARK}"/>')

    p.append(lion(292, 396, 1.0))
    p.append(lion(556, 424, 0.82))
    return frame("\n".join(p))


def samson():
    p = [f'<rect width="800" height="600" fill="{SAND}"/>']
    p.append(f'<rect y="470" width="800" height="130" fill="{STONE_D}"/>')
    p.append(f'<rect x="80" y="104" width="640" height="64" rx="6" fill="{STONE_D}"/>')
    p.append(f'<rect x="96" y="168" width="608" height="20" fill="{STONE}"/>')
    for x in (170, 550):
        p.append(f'<rect x="{x-14}" y="188" width="108" height="26" rx="6" fill="{STONE_D}"/>')
        p.append(f'<rect x="{x}" y="214" width="80" height="266" fill="{STONE}"/>')
        p.append(f'<rect x="{x-14}" y="464" width="108" height="26" rx="6" fill="{STONE_D}"/>')
        p.append(f'<path d="M{x+18},240 l24,42 l-18,34 l26,48 l-20,40 l22,32" fill="none" '
                 f'stroke="{DARK}" stroke-width="6" opacity="0.55" stroke-linejoin="round"/>')
    for i, dx in enumerate((-40, 0, 40)):
        p.append(f'<path d="M{400+dx},214 q{22 if i%2==0 else -22},70 0,140 '
                 f'q{-22 if i%2==0 else 22},70 0,120" fill="none" stroke="{WOOD_D}" '
                 f'stroke-width="15" stroke-linecap="round"/>')
    # shears
    p.append(f'<g transform="translate(628 254) rotate(24)">'
             f'<path d="M0,0 L96,52 M0,52 L96,0" stroke="{STONE_D}" stroke-width="11" '
             f'stroke-linecap="round"/>'
             f'<circle cx="-14" cy="-8" r="17" fill="none" stroke="{DARK}" stroke-width="9"/>'
             f'<circle cx="-14" cy="60" r="17" fill="none" stroke="{DARK}" stroke-width="9"/></g>')
    return frame("\n".join(p))


def joseph():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(f'<circle cx="120" cy="104" r="40" fill="{GOLD}"/>')
    p.append(rays(120, 104, 12, 48, 78, GOLD, 0.6, 0.09))
    p.append(f'<circle cx="686" cy="104" r="40" fill="{WHITE}"/>'
             f'<circle cx="668" cy="94" r="34" fill="{SKY}"/>')
    rnd = random.Random(7)
    for _ in range(11):
        p.append(star4(rnd.uniform(230, 590), rnd.uniform(56, 168), rnd.uniform(9, 15)))
    stripes = "".join(
        f'<rect x="250" y="{176 + i*26}" width="300" height="26" fill="{c}"/>'
        for i, c in enumerate([RED, GOLD, GREEN, PURPLE, SKY_D, FIRE,
                               RED, GOLD, GREEN, PURPLE, SKY_D, FIRE]))
    coat = ("M338,206 L462,206 L516,238 L500,320 L474,306 L482,494 "
            "L318,494 L326,306 L300,320 L284,238 Z")
    p.append(f'<defs><clipPath id="coat"><path d="{coat}"/></clipPath></defs>')
    p.append(f'<path d="{coat}" fill="{CREAM}"/>')
    p.append(f'<g clip-path="url(#coat)">{stripes}</g>')
    p.append(f'<path d="{coat}" fill="none" stroke="{DARK}" stroke-width="6" '
             f'stroke-linejoin="round"/>')
    p.append(f'<path d="M338,206 L400,262 L462,206 Z" fill="{CREAM}" stroke="{DARK}" '
             f'stroke-width="5"/>')
    p.append(f'<line x1="400" y1="262" x2="400" y2="494" stroke="{DARK}" '
             f'stroke-width="5" opacity="0.7"/>')
    return frame("\n".join(p))


def abraham():
    p = [f'<rect width="800" height="600" fill="{NIGHT}"/>']
    p.append(stars(120, 5, y1=430))
    p.append(star4(408, 128, 34, WHITE))
    p.append(rays(408, 128, 10, 40, 86, WHITE, 0.30, 0.07))
    # a bright cluster of stars, the ones being counted
    rnd = random.Random(17)
    for _ in range(14):
        p.append(star4(rnd.uniform(120, 700), rnd.uniform(70, 280),
                       rnd.uniform(7, 13), WHITE, 0.9))
    p.append(f'<rect y="452" width="800" height="148" fill="#4A3D2E"/>')
    p.append(f'<path d="M0,452 Q200,438 400,452 Q600,466 800,452 L800,478 L0,478 Z" '
             f'fill="#5C4C39"/>')
    # the tent
    p.append(f'<path d="M150,456 L360,236 L570,456 Z" fill="{SAND_D}"/>')
    p.append(f'<path d="M360,236 L570,456 L462,456 Z" fill="{WOOD_D}" opacity="0.5"/>')
    p.append(f'<path d="M318,456 Q360,344 402,456 Z" fill="{NIGHT_D}"/>')
    for dx in (-1, 1):
        p.append(f'<line x1="{360 + dx*216}" y1="456" x2="{360 + dx*264}" y2="456" '
                 f'stroke="{WOOD_D}" stroke-width="7" stroke-linecap="round"/>')
    # campfire, giving the scene a warm anchor
    p.append(f'<circle cx="646" cy="470" r="82" fill="{FIRE}" opacity="0.20"/>')
    p.append(f'<line x1="616" y1="486" x2="678" y2="474" stroke="{WOOD_D}" '
             f'stroke-width="11" stroke-linecap="round"/>')
    p.append(f'<line x1="622" y1="474" x2="672" y2="488" stroke="{WOOD_D}" '
             f'stroke-width="11" stroke-linecap="round"/>')
    p.append(flame(646, 474, 30, 66, FIRE_D))
    p.append(flame(646, 472, 20, 46, GOLD, 0.95))
    # the figure, looking up and counting
    p.append(figure(206, 452, scale=1.28, col="#1A2233", staff=True))
    p.append(f'<circle cx="206" cy="322" r="20" fill="#1A2233"/>')
    p.append(f'<path d="M188,306 L150,258" stroke="#1A2233" stroke-width="15" '
             f'stroke-linecap="round"/>')
    # sheep, settled for the night
    for i in range(3):
        x, y = 468 + i * 54, 512 + (i % 2) * 16
        p.append(f'<ellipse cx="{x}" cy="{y}" rx="26" ry="17" fill="#6E6252"/>'
                 f'<circle cx="{x-24}" cy="{y-8}" r="11" fill="#4A4238"/>')
    return frame("\n".join(p))


def esther():
    p = [f'<rect width="800" height="600" fill="{PURPLE_D}"/>']
    for i in range(9):
        x = i * 100
        p.append(f'<path d="M{x},0 q26,300 0,600 L{x+50},600 q-26,-300 0,-600 Z" '
                 f'fill="{PURPLE}" opacity="0.55"/>')
    p.append(f'<rect y="470" width="800" height="130" fill="#3D2E5C"/>')
    p.append(f'<path d="M232,470 Q400,414 568,470 Q400,506 232,470 Z" fill="{RED}"/>')
    p.append(crown(400, 300, w=250, h=150))
    p.append(rays(400, 300, 14, 150, 210, GOLD, 0.18, 0.06))
    p.append(f'<g transform="rotate(-32 660 400)">'
             f'<rect x="646" y="286" width="16" height="200" rx="8" fill="{GOLD}"/>'
             f'<circle cx="654" cy="272" r="26" fill="{GOLD}"/>'
             f'<circle cx="654" cy="272" r="11" fill="{RED}"/></g>')
    p.append(f'<g transform="rotate(8 150 462)">'
             f'<rect x="86" y="428" width="180" height="68" rx="10" fill="{CREAM}"/>'
             f'<rect x="76" y="418" width="24" height="88" rx="12" fill="{WOOD}"/>'
             f'<rect x="252" y="418" width="24" height="88" rx="12" fill="{WOOD}"/>')
    for i in range(3):
        p.append(f'<rect x="108" y="{444 + i*16}" width="136" height="6" rx="3" '
                 f'fill="{DARK}" opacity="0.35"/>')
    p.append('</g>')
    return frame("\n".join(p))


def ruth():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(f'<circle cx="676" cy="112" r="46" fill="{GOLD}" opacity="0.85"/>')
    p.append(f'<path d="M0,392 Q400,352 800,392 L800,600 L0,600 Z" fill="{GOLD_D}"/>')
    rnd = random.Random(11)
    for i in range(22):
        x = 14 + i * 37 + rnd.uniform(-8, 8)
        p.append(wheat(x, 470 + rnd.uniform(-6, 30), hgt=rnd.uniform(74, 106),
                       tilt=rnd.uniform(-0.12, 0.12)))
    # bound sheaf
    for i, t in enumerate((-0.20, -0.10, 0.0, 0.10, 0.20)):
        p.append(wheat(400 + i * 4 - 8, 560, hgt=176, tilt=t))
    p.append(f'<rect x="336" y="480" width="132" height="26" rx="13" fill="{WOOD_D}"/>')
    # sickle
    p.append(f'<path d="M576,536 Q712,520 690,404" fill="none" stroke="{STONE}" '
             f'stroke-width="17" stroke-linecap="round"/>')
    p.append(f'<rect x="536" y="522" width="60" height="24" rx="12" fill="{WOOD}" '
             f'transform="rotate(-8 566 534)"/>')
    # basket
    p.append(f'<path d="M96,510 L232,510 L214,578 L114,578 Z" fill="{WOOD}"/>')
    for i in range(3):
        p.append(f'<line x1="{102 + i*2}" y1="{528 + i*17}" x2="{226 - i*2}" '
                 f'y2="{528 + i*17}" stroke="{WOOD_D}" stroke-width="5"/>')
    return frame("\n".join(p))


def baptist():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(rays(400, 40, 16, 40, 340, GOLD, 0.22, 0.05))
    p.append(f'<rect y="392" width="800" height="208" fill="{WATER}"/>')
    p.append(f'<path d="M0,392 Q200,368 400,392 Q600,416 800,392 L800,420 L0,420 Z" '
             f'fill="{WATER_D}" opacity="0.5"/>')
    p.append(waves(400, n=6, seed=4, op=0.4))
    # descending dove
    p.append(dove(392, 250, s=1.15))
    # near bank, so the honey and locust sit on land and not in the river
    p.append(f'<path d="M0,500 Q200,478 400,494 Q600,510 800,486 L800,600 L0,600 Z" '
             f'fill="{SAND}"/>')
    # honeycomb
    for i in range(6):
        cx = 96 + (i % 3) * 52 + (26 if i > 2 else 0)
        cy = 528 + (i // 3) * 46
        pts = " ".join(
            f"{cx + 28*math.cos(math.radians(60*k)):.0f},{cy + 28*math.sin(math.radians(60*k)):.0f}"
            for k in range(6))
        p.append(f'<polygon points="{pts}" fill="{GOLD}" stroke="{GOLD_D}" stroke-width="4"/>')
    # locust
    p.append(f'<g transform="translate(628 548) rotate(-10)">'
             f'<path d="M-6,10 L28,54 L2,58" fill="none" stroke="{GREEN_D}" '
             f'stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
             f'<path d="M-22,8 L-14,44 M6,8 L14,42" stroke="{GREEN_D}" '
             f'stroke-width="6" stroke-linecap="round"/>'
             f'<ellipse cx="0" cy="-4" rx="54" ry="19" fill="{GREEN_D}"/>'
             f'<path d="M-30,-18 Q16,-34 56,-14 Q14,-4 -30,-18 Z" fill="{GREEN}"/>'
             f'<circle cx="-54" cy="-12" r="17" fill="{GREEN_D}"/>'
             f'<circle cx="-60" cy="-16" r="4" fill="{DARK}"/>'
             f'<path d="M-66,-24 L-92,-52 M-64,-16 L-96,-34" stroke="{GREEN_D}" '
             f'stroke-width="4" stroke-linecap="round"/></g>')
    return frame("\n".join(p))


def peter():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(f'<rect y="420" width="800" height="180" fill="{WATER}"/>')
    p.append(waves(430, n=4, seed=6, op=0.35))
    # net
    p.append(f'<defs><clipPath id="net">'
             f'<path d="M180,166 Q470,132 610,268 Q660,432 400,470 Q160,438 148,300 Z"/>'
             f'</clipPath></defs>')
    p.append(f'<path d="M180,166 Q470,132 610,268 Q660,432 400,470 Q160,438 148,300 Z" '
             f'fill="{CREAM}" opacity="0.55"/>')
    p.append('<g clip-path="url(#net)">')
    for i in range(-6, 20):
        p.append(f'<line x1="{i*46}" y1="80" x2="{i*46 + 460}" y2="540" '
                 f'stroke="{STONE_D}" stroke-width="4"/>')
        p.append(f'<line x1="{i*46}" y1="540" x2="{i*46 + 460}" y2="80" '
                 f'stroke="{STONE_D}" stroke-width="4"/>')
    p.append('</g>')
    p.append(f'<path d="M180,166 Q470,132 610,268 Q660,432 400,470 Q160,438 148,300 Z" '
             f'fill="none" stroke="{WOOD_D}" stroke-width="9"/>')
    for cx, cy, s in ((300, 292, 1.0), (430, 372, 0.78)):
        p.append(f'<g transform="translate({cx} {cy}) scale({s})">'
                 f'<ellipse cx="0" cy="0" rx="72" ry="38" fill="{TEAL_L}" '
                 f'stroke="{DARK}" stroke-width="5"/>'
                 f'<path d="M66,0 L118,-34 L108,0 L118,34 Z" fill="{TEAL_L}" '
                 f'stroke="{DARK}" stroke-width="5"/>'
                 f'<circle cx="-42" cy="-8" r="8" fill="{WHITE}"/>'
                 f'<circle cx="-42" cy="-8" r="4" fill="{DARK}"/></g>')
    # rooster
    p.append(f'<g transform="translate(660 168)">'
             f'<path d="M-4,54 q-58,-16 -74,-64 q34,10 46,-2 q-8,-34 24,-42 q30,-8 40,20 Z" '
             f'fill="{WHITE}" stroke="{DARK}" stroke-width="5"/>'
             f'<circle cx="34" cy="-32" r="24" fill="{WHITE}" stroke="{DARK}" stroke-width="5"/>'
             f'<path d="M20,-54 q6,-20 16,-8 q10,-18 16,0 q12,-12 12,10 Z" fill="{RED}"/>'
             f'<polygon points="56,-30 80,-24 56,-18" fill="{GOLD}"/>'
             f'<path d="M30,-10 q-6,20 8,18 q12,-2 6,-18 Z" fill="{RED}"/>'
             f'<circle cx="40" cy="-36" r="3.5" fill="{DARK}"/>'
             f'<path d="M-70,-10 q-40,-40 -18,-70 M-58,-4 q-52,-24 -46,-62" fill="none" '
             f'stroke="{DARK}" stroke-width="7" stroke-linecap="round"/></g>')
    # crossed keys
    for a in (-28, 28):
        p.append(f'<g transform="translate(150 516) rotate({a})">'
                 f'<circle cx="0" cy="0" r="22" fill="none" stroke="{GOLD}" stroke-width="11"/>'
                 f'<rect x="20" y="-6" width="104" height="12" rx="6" fill="{GOLD}"/>'
                 f'<rect x="96" y="-24" width="12" height="20" fill="{GOLD}"/>'
                 f'<rect x="114" y="-24" width="12" height="20" fill="{GOLD}"/></g>')
    return frame("\n".join(p))


def paul():
    p = [f'<rect width="800" height="600" fill="{SKY_D}"/>']
    p.append(f'<rect y="356" width="800" height="244" fill="{SAND_D}"/>')
    p.append(f'<path d="M330,356 L470,356 L640,600 L96,600 Z" fill="{SAND}"/>')
    for i in range(5):
        y = 386 + i * 46
        w = 18 + i * 9
        p.append(f'<rect x="{400 - w/2:.0f}" y="{y}" width="{w}" height="16" rx="8" '
                 f'fill="{CREAM}" opacity="0.75"/>')
    p.append(rays(400, 176, 20, 60, 400, WHITE, 0.30, 0.045))
    p.append(f'<circle cx="400" cy="176" r="118" fill="{GOLD}" opacity="0.35"/>')
    p.append(f'<circle cx="400" cy="176" r="76" fill="{WHITE}" opacity="0.85"/>')
    p.append(f'<circle cx="400" cy="176" r="44" fill="{WHITE}"/>')
    # struck down on the road, shielding his eyes from the light
    p.append(f'<g transform="translate(292 486)">'
             f'<ellipse cx="10" cy="46" rx="130" ry="18" fill="{SAND_D}" opacity="0.5"/>'
             f'<path d="M-58,36 Q-64,-10 -18,-18 L52,-24 Q96,-20 100,14 '
             f'Q104,40 66,42 L-30,44 Q-56,44 -58,36 Z" fill="{DARK}"/>'
             f'<path d="M62,10 L128,26 L124,42 L58,34 Z" fill="{DARK}"/>'
             f'<path d="M96,30 L150,18" stroke="{DARK}" stroke-width="17" '
             f'stroke-linecap="round"/>'
             f'<circle cx="-76" cy="-6" r="32" fill="{DARK}"/>'
             f'<path d="M-96,-30 Q-104,-58 -84,-62 Q-70,-64 -70,-44" fill="{DARK}"/>'
             f'<path d="M-30,-16 L-4,-84" stroke="{DARK}" stroke-width="19" '
             f'stroke-linecap="round"/>'
             f'<path d="M-4,-84 L26,-108" stroke="{DARK}" stroke-width="17" '
             f'stroke-linecap="round"/>'
             f'<path d="M6,-8 L46,-62" stroke="{DARK}" stroke-width="16" '
             f'stroke-linecap="round"/></g>')
    # letters / scrolls
    for i, (x, y) in enumerate(((640, 500), (676, 540), (612, 552))):
        p.append(f'<g transform="translate({x} {y}) rotate({-14 + i*16})">'
                 f'<rect x="-58" y="-20" width="116" height="40" rx="8" fill="{CREAM}"/>'
                 f'<rect x="-70" y="-26" width="20" height="52" rx="10" fill="{WOOD}"/>'
                 f'<rect x="50" y="-26" width="20" height="52" rx="10" fill="{WOOD}"/></g>')
    return frame("\n".join(p))


def solomon():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(f'<rect y="500" width="800" height="100" fill="{SAND_D}"/>')
    p.append(f'<rect x="128" y="252" width="544" height="26" fill="{GOLD_D}"/>')
    p.append(f'<polygon points="112,252 688,252 400,140" fill="{STONE_D}"/>')
    p.append(f'<polygon points="152,246 648,246 400,164" fill="{GOLD}" opacity="0.55"/>')
    for i in range(5):
        x = 158 + i * 116
        p.append(f'<rect x="{x-8}" y="278" width="76" height="20" rx="5" fill="{STONE_D}"/>')
        p.append(f'<rect x="{x}" y="298" width="60" height="188" fill="{STONE}"/>')
        for k in range(3):
            p.append(f'<line x1="{x + 14 + k*16}" y1="304" x2="{x + 14 + k*16}" y2="480" '
                     f'stroke="{STONE_D}" stroke-width="4"/>')
        p.append(f'<rect x="{x-8}" y="486" width="76" height="20" rx="5" fill="{STONE_D}"/>')
    p.append(crown(400, 86, w=150, h=86))
    # scales of judgement
    p.append(f'<g transform="translate(400 0)">'
             f'<rect x="-9" y="330" width="18" height="188" rx="9" fill="{GOLD_D}"/>'
             f'<rect x="-150" y="322" width="300" height="15" rx="7" fill="{GOLD}"/>'
             f'<circle cx="0" cy="318" r="17" fill="{GOLD}"/>'
             f'<path d="M-140,336 L-140,382 M-100,336 L-140,382 M-180,382 L-140,382" '
             f'fill="none" stroke="{GOLD_D}" stroke-width="5"/>'
             f'<path d="M140,336 L140,382 M100,336 L140,382 M180,382 L140,382" '
             f'fill="none" stroke="{GOLD_D}" stroke-width="5"/>'
             f'<path d="M-190,382 L-90,382 L-120,424 L-160,424 Z" fill="{GOLD}"/>'
             f'<path d="M90,382 L190,382 L160,424 L120,424 Z" fill="{GOLD}"/>'
             f'<rect x="-40" y="500" width="80" height="26" rx="13" fill="{GOLD_D}"/></g>')
    return frame("\n".join(p))


def zacchaeus():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(f'<circle cx="128" cy="110" r="44" fill="{GOLD}" opacity="0.8"/>')
    p.append(f'<rect y="470" width="800" height="130" fill="{SAND}"/>')
    p.append(f'<path d="M0,470 L800,470 L800,510 L0,510 Z" fill="{SAND_D}" opacity="0.5"/>')
    # tree
    p.append(f'<path d="M498,478 L498,300 Q498,282 520,280 L560,278" fill="none" '
             f'stroke="{WOOD_D}" stroke-width="42" stroke-linecap="round"/>')
    p.append(f'<path d="M508,340 L400,296 M508,376 L610,330" fill="none" stroke="{WOOD_D}" '
             f'stroke-width="20" stroke-linecap="round"/>')
    for cx, cy, r in ((404, 250, 84), (520, 208, 96), (630, 258, 80),
                      (470, 176, 68), (582, 152, 62), (330, 296, 58), (668, 330, 54)):
        p.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{GREEN}"/>')
    for cx, cy, r in ((430, 226, 44), (548, 196, 50), (630, 252, 38), (486, 168, 30)):
        p.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{GREEN_D}" opacity="0.55"/>')
    # small man up the tree
    p.append(f'<g transform="translate(0 0)">'
             f'<path d="M382,296 Q404,254 434,262 Q452,268 448,300 Z" fill="{DARK}"/>'
             f'<circle cx="410" cy="238" r="21" fill="{DARK}"/>'
             f'<path d="M400,300 L392,344 M424,300 L432,344" stroke="{DARK}" '
             f'stroke-width="12" stroke-linecap="round"/>'
             f'<path d="M440,272 L474,262" stroke="{DARK}" stroke-width="11" '
             f'stroke-linecap="round"/></g>')
    # crowd along the road
    for i, x in enumerate((70, 130, 192, 250, 700, 758)):
        p.append(figure(x, 512, scale=0.62 + (i % 3) * 0.06,
                        col="#3B4252" if i % 2 else DARK))
    return frame("\n".join(p))


def elijah():
    p = [f'<rect width="800" height="600" fill="#33253F"/>']
    p.append(stars(55, 33, y1=300))
    p.append(f'<rect y="500" width="800" height="100" fill="#221830"/>')
    p.append(f'<circle cx="420" cy="360" r="270" fill="{FIRE_D}" opacity="0.22"/>')
    p.append(f'<circle cx="420" cy="360" r="170" fill="{FIRE}" opacity="0.22"/>')
    # a wall of flame rising behind the chariot
    for cx, w, h, col, op in ((300, 92, 330, FIRE_D, 0.9), (420, 108, 396, FIRE_D, 0.85),
                              (540, 88, 300, FIRE_D, 0.9), (356, 70, 268, FIRE, 0.9),
                              (486, 76, 300, FIRE, 0.9), (420, 58, 340, GOLD, 0.85)):
        p.append(flame(cx, 470, w, h, col, op))
    # horses of fire, out front
    for cx, s, col in ((214, 1.0, FIRE), (286, 0.84, FIRE_D)):
        p.append(f'<g transform="translate({cx} 398) scale({s})">'
                 # legs
                 f'<path d="M-18,18 L-30,74 M2,20 L-6,76 M30,14 L42,72 M46,8 L62,66" '
                 f'stroke="{col}" stroke-width="11" stroke-linecap="round"/>'
                 # body
                 f'<ellipse cx="14" cy="4" rx="50" ry="29" fill="{col}"/>'
                 # neck
                 f'<path d="M-26,6 L-52,-58 L-24,-68 L4,-8 Z" fill="{col}"/>'
                 # head
                 f'<ellipse cx="-58" cy="-72" rx="24" ry="14" fill="{col}" '
                 f'transform="rotate(-38 -58 -72)"/>'
                 f'<polygon points="-40,-84 -34,-102 -26,-82" fill="{col}"/>'
                 f'<circle cx="-56" cy="-80" r="4" fill="{DARK}"/>'
                 # mane and tail, as flame
                 f'<path d="M-28,-66 q-14,-34 12,-46 q-4,24 14,30 q-10,14 -26,16 Z" fill="{GOLD}"/>'
                 f'<path d="M62,-10 q40,-6 44,34 q-24,-20 -46,-6 Z" fill="{GOLD}"/></g>')
    # the chariot
    p.append(f'<path d="M356,336 L620,336 L636,452 L340,452 Z" fill="{GOLD_D}"/>')
    p.append(f'<path d="M378,358 L600,358 L610,430 L368,430 Z" fill="{GOLD}"/>')
    for i in range(4):
        p.append(f'<rect x="{392 + i*54}" y="366" width="30" height="56" rx="6" '
                 f'fill="{GOLD_D}" opacity="0.6"/>')
    p.append(f'<path d="M340,392 L232,404" stroke="{GOLD_D}" stroke-width="12" '
             f'stroke-linecap="round"/>')
    for cx, r in ((418, 62), (576, 62)):
        p.append(f'<circle cx="{cx}" cy="466" r="{r}" fill="none" stroke="{FIRE}" '
                 f'stroke-width="15"/>')
        for k in range(8):
            a = math.radians(45 * k + 12)
            p.append(f'<line x1="{cx}" y1="466" x2="{cx + (r-8)*math.cos(a):.0f}" '
                     f'y2="{466 + (r-8)*math.sin(a):.0f}" stroke="{GOLD}" stroke-width="6"/>')
        p.append(f'<circle cx="{cx}" cy="466" r="14" fill="{GOLD_D}"/>')
    # the mantle, left behind
    p.append(f'<path d="M676,384 q66,30 48,98 q-16,58 -78,70 q30,-60 4,-98 '
             f'q-24,-34 26,-70 Z" fill="{RED}"/>')
    p.append(f'<path d="M690,404 q34,34 22,86" fill="none" stroke="{DARK}" '
             f'stroke-width="5" opacity="0.35"/>')
    # ravens
    for x, y, s in ((122, 132, 1.0), (206, 190, 0.72), (74, 226, 0.58)):
        p.append(f'<g transform="translate({x} {y}) scale({s})">'
                 f'<path d="M-52,0 q26,-34 52,-8 q26,-26 52,8 q-28,12 -52,4 '
                 f'q-24,8 -52,-4 Z" fill="#171320"/></g>')
    return frame("\n".join(p))


def lazarus():
    p = [f'<rect width="800" height="600" fill="{SKY}"/>']
    p.append(rays(760, 40, 14, 40, 460, GOLD, 0.24, 0.05))
    p.append(f'<path d="M0,600 L0,240 Q160,150 400,166 Q640,182 800,262 L800,600 Z" '
             f'fill="{STONE_D}"/>')
    p.append(f'<path d="M60,600 L60,300 Q200,224 380,240 L380,600 Z" fill="{STONE}" '
             f'opacity="0.4"/>')
    p.append(f'<rect y="524" width="800" height="76" fill="{SAND_D}"/>')
    # tomb opening
    p.append(f'<path d="M226,530 L226,352 Q330,262 434,352 L434,530 Z" fill="{NIGHT_D}"/>')
    p.append(f'<path d="M226,352 Q330,262 434,352" fill="none" stroke="{STONE}" '
             f'stroke-width="14"/>')
    # the stone, rolled aside
    p.append(f'<circle cx="592" cy="424" r="112" fill="{STONE}" stroke="{STONE_D}" '
             f'stroke-width="12"/>')
    p.append(f'<circle cx="592" cy="424" r="72" fill="none" stroke="{STONE_D}" '
             f'stroke-width="8" opacity="0.7"/>')
    for k in range(6):
        a = math.radians(60 * k + 18)
        p.append(f'<ellipse cx="{592 + 88*math.cos(a):.0f}" cy="{424 + 88*math.sin(a):.0f}" '
                 f'rx="15" ry="9" fill="{STONE_D}" opacity="0.6" '
                 f'transform="rotate({60*k} {592 + 88*math.cos(a):.0f} {424 + 88*math.sin(a):.0f})"/>')
    p.append(f'<path d="M470,470 q40,26 96,18" fill="none" stroke="{SAND}" '
             f'stroke-width="10" opacity="0.6" stroke-dasharray="18 14"/>')
    # linen wrappings, set down
    for i, (x, y, a) in enumerate(((300, 560, -6), (352, 578, 8), (256, 582, 14))):
        p.append(f'<rect x="{x}" y="{y}" width="150" height="24" rx="12" fill="{WHITE}" '
                 f'transform="rotate({a} {x} {y})" opacity="0.95"/>')
    return frame("\n".join(p))


SCENES = {
    "noah": noah, "moses": moses, "david": david, "goliath": goliath,
    "jonah": jonah, "daniel": daniel, "samson": samson, "joseph": joseph,
    "abraham": abraham, "esther": esther, "ruth": ruth, "baptist": baptist,
    "peter": peter, "paul": paul, "solomon": solomon,
    "zacchaeus": zacchaeus, "elijah": elijah, "lazarus": lazarus,
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, fn in SCENES.items():
        path = os.path.join(OUT, f"{name}.svg")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(fn())
        print(f"  wrote {name}.svg  ({os.path.getsize(path)} bytes)")
    print(f"\n{len(SCENES)} illustrations -> {os.path.normpath(OUT)}")
