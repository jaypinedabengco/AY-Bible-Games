#!/usr/bin/env python3
"""
Generates the rebus clue icons for game 2 (Bible Names).

Each icon must evoke exactly ONE word. That constraint is the whole game:
a clue that could be read two ways makes the puzzle unsolvable, so these are
deliberately plain and iconic rather than pretty or scenic.

Canvas is 400x400 with a transparent background - the page supplies the card.

Run:  python3 tools/gen_clues.py
Out:  games/names/clues/*.svg
"""

import math
import os

from common import *  # palette + shared svg/star4/rays/glyph helpers

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "games", "names", "clues")

S = 400  # square canvas


def card(inner):
    return svg(inner, S, S)


# ------------------------------------------------------------------ icons ---
def done():
    return card(
        f'<circle cx="200" cy="200" r="150" fill="{GREEN_D}"/>'
        f'<circle cx="200" cy="200" r="128" fill="{GREEN}"/>'
        f'<path d="M126,206 L176,258 L282,146" fill="none" stroke="{WHITE}" '
        f'stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>')


def yell():
    p = []
    for s in (-1, 1):
        for i in range(3):
            r = 150 + i * 30
            p.append(f'<path d="M{200 + s*r},{130 + i*10} '
                     f'a{r*0.4:.0f},{r*0.4:.0f} 0 0 {1 if s>0 else 0} '
                     f'0,{r*0.72:.0f}" fill="none" stroke="{DARK}" '
                     f'stroke-width="11" stroke-linecap="round" '
                     f'opacity="{0.7 - i*0.2:.2f}"/>')
    p.append(f'<circle cx="200" cy="196" r="132" fill="{SKIN}"/>')
    # eyes screwed shut
    for x in (152, 248):
        p.append(f'<path d="M{x-26},142 L{x+2},160 L{x-26},178" fill="none" '
                 f'stroke="{DARK}" stroke-width="12" stroke-linecap="round" '
                 f'stroke-linejoin="round" transform="scale({1 if x<200 else -1} 1) '
                 f'translate({0 if x<200 else -400} 0)"/>')
    # brows, angled in
    p.append(f'<path d="M110,112 L170,128 M290,112 L230,128" stroke="{DARK}" '
             f'stroke-width="13" stroke-linecap="round"/>')
    # wide open mouth
    p.append(f'<ellipse cx="200" cy="268" rx="66" ry="58" fill="{NIGHT_D}"/>')
    p.append(f'<path d="M156,300 Q200,338 244,300 Q200,282 156,300 Z" fill="{RED}"/>')
    return card("".join(p))


def letter_a():
    return card(glyph("A"))


def letter_s():
    return card(glyph("S"))


def ampersand():
    return card(glyph("&amp;"))


def dam():
    # Side cross-section: water held HIGH on one side and LOW on the other is
    # the only reading that reliably says "dam" rather than "pool" or "basin".
    p = [f'<rect x="40" y="56" width="320" height="300" rx="18" fill="{SKY}"/>']
    p.append(f'<defs><clipPath id="d"><rect x="40" y="56" width="320" height="300" '
             f'rx="18"/></clipPath></defs>')
    p.append('<g clip-path="url(#d)">')
    # upstream reservoir, held high
    p.append(f'<rect x="40" y="132" width="150" height="224" fill="{WATER}"/>')
    p.append(f'<path d="M40,146 q36,-16 72,0 q36,16 72,0 L184,132 L40,132 Z" '
             f'fill="{WATER_D}" opacity="0.5"/>')
    # downstream: dry canyon floor with a shallow river
    p.append(f'<rect x="184" y="286" width="176" height="70" fill="{SAND_D}"/>')
    p.append(f'<rect x="184" y="316" width="176" height="40" fill="{WATER}"/>')
    # the wall, a concrete wedge thickening towards its base
    p.append(f'<path d="M176,112 L232,112 L292,356 L176,356 Z" fill="{STONE}"/>')
    p.append(f'<path d="M232,112 L292,356 L262,356 L214,112 Z" fill="{STONE_D}"/>')
    for i in range(6):
        y = 148 + i * 34
        p.append(f'<path d="M178,{y} L{236 + i*10},{y}" stroke="{STONE_D}" '
                 f'stroke-width="4" opacity="0.45"/>')
    # crest walkway
    p.append(f'<rect x="166" y="100" width="76" height="16" rx="6" fill="{DARK}"/>')
    # water pouring over the crest, down the face
    p.append(f'<path d="M190,118 Q214,116 226,124 Q262,220 288,320 L232,330 '
             f'Q206,222 190,118 Z" fill="{WHITE}" opacity="0.92"/>')
    for cx, r in ((252, 20), (286, 26), (316, 18)):
        p.append(f'<circle cx="{cx}" cy="322" r="{r}" fill="{WHITE}" opacity="0.85"/>')
    p.append('</g>')
    p.append(f'<rect x="40" y="56" width="320" height="300" rx="18" fill="none" '
             f'stroke="{DARK}" stroke-width="9"/>')
    return card("".join(p))


def eye():
    return card(
        f'<path d="M40,200 Q200,84 360,200 Q200,316 40,200 Z" fill="{WHITE}" '
        f'stroke="{DARK}" stroke-width="11"/>'
        f'<circle cx="200" cy="200" r="66" fill="{WATER}"/>'
        f'<circle cx="200" cy="200" r="32" fill="{DARK}"/>'
        f'<circle cx="222" cy="178" r="13" fill="{WHITE}"/>'
        f'<path d="M64,146 L38,110 M200,84 L200,44 M336,146 L362,110" '
        f'stroke="{DARK}" stroke-width="11" stroke-linecap="round"/>')


def sack():
    p = [f'<path d="M112,356 Q92,224 132,168 L268,168 Q308,224 288,356 Z" '
         f'fill="{SAND_D}"/>']
    p.append(f'<path d="M132,168 Q200,140 268,168 L268,182 Q200,154 132,182 Z" '
             f'fill="{SAND}"/>')
    for x in (140, 176, 212, 248):
        p.append(f'<path d="M{x},156 Q{x+8},116 {x+18},154 Z" fill="{SAND_D}"/>')
    p.append(f'<rect x="120" y="150" width="160" height="26" rx="13" fill="{WOOD_D}"/>')
    for y in (240, 288):
        p.append(f'<path d="M126,{y} Q200,{y+14} 274,{y}" fill="none" '
                 f'stroke="{WOOD_D}" stroke-width="6" opacity="0.4"/>')
    return card("".join(p))


def calendar():
    p = [f'<rect x="54" y="96" width="292" height="252" rx="22" fill="{WHITE}" '
         f'stroke="{DARK}" stroke-width="9"/>']
    p.append(f'<path d="M54,118 a22,22 0 0 1 22,-22 L324,96 a22,22 0 0 1 22,22 '
             f'L346,168 L54,168 Z" fill="{RED}"/>')
    for x in (120, 280):
        p.append(f'<rect x="{x-11}" y="64" width="22" height="56" rx="11" fill="{STONE_D}"/>')
    for r in range(3):
        for c in range(4):
            x, y = 84 + c * 62, 192 + r * 52
            p.append(f'<rect x="{x}" y="{y}" width="44" height="36" rx="7" '
                     f'fill="{SKY}" opacity="0.75"/>')
    p.append(f'<circle cx="230" cy="262" r="34" fill="none" stroke="{RED}" '
             f'stroke-width="10"/>')
    return card("".join(p))


def video():
    p = [f'<rect x="56" y="146" width="212" height="134" rx="20" fill="{DARK}"/>']
    p.append(f'<path d="M268,180 L346,146 L346,282 L268,248 Z" fill="{DARK}"/>')
    p.append(f'<rect x="126" y="120" width="88" height="28" rx="14" fill="{NIGHT_D}"/>')
    p.append(f'<circle cx="132" cy="214" r="50" fill="{STONE_D}"/>')
    p.append(f'<circle cx="132" cy="214" r="34" fill="{WATER_D}"/>')
    p.append(f'<circle cx="132" cy="214" r="15" fill="{NIGHT_D}"/>')
    p.append(f'<circle cx="145" cy="200" r="7" fill="{WHITE}" opacity="0.8"/>')
    p.append(f'<circle cx="228" cy="176" r="11" fill="{RED}"/>')
    p.append(f'<rect x="196" y="228" width="56" height="34" rx="7" fill="{STONE_D}" '
             f'opacity="0.5"/>')
    return card("".join(p))


def sea():
    p = [f'<defs><clipPath id="c"><rect x="42" y="70" width="316" height="290" rx="26"/>'
         f'</clipPath></defs>']
    p.append(f'<g clip-path="url(#c)">')
    p.append(f'<rect x="42" y="70" width="316" height="290" fill="{SKY}"/>')
    p.append(f'<path d="M42,196 Q120,168 200,196 Q280,224 358,192 L358,360 L42,360 Z" '
             f'fill="{WATER}"/>')
    p.append(f'<path d="M42,250 Q120,222 200,250 Q280,278 358,246 L358,360 L42,360 Z" '
             f'fill="{WATER_D}" opacity="0.55"/>')
    for i, (x, y) in enumerate(((70, 300), (170, 330), (250, 296), (60, 226))):
        p.append(f'<path d="M{x},{y} q18,-12 36,0 q18,12 36,0" fill="none" '
                 f'stroke="{WHITE}" stroke-width="8" stroke-linecap="round" '
                 f'opacity="0.55"/>')
    p.append('</g>')
    p.append(f'<rect x="42" y="70" width="316" height="290" rx="26" fill="none" '
             f'stroke="{DARK}" stroke-width="9"/>')
    return card("".join(p))


def moon():
    p = [f'<path d="M214,58 A146,146 0 1 0 214,342 A116,116 0 1 1 214,58 Z" '
         f'fill="{GOLD}"/>']
    for cx, cy, r in ((312, 118, 15), (338, 208, 11), (296, 296, 13)):
        p.append(star4(cx, cy, r, GOLD_D))
    return card("".join(p))


def fill():
    p = [f'<rect x="150" y="52" width="130" height="30" rx="10" fill="{STONE_D}"/>']
    p.append(f'<rect x="252" y="52" width="30" height="74" rx="8" fill="{STONE_D}"/>')
    p.append(f'<rect x="236" y="112" width="62" height="22" rx="8" fill="{STONE}"/>')
    p.append(f'<rect x="256" y="134" width="22" height="86" fill="{WATER}" opacity="0.85"/>')
    glass = "M150,206 L292,206 L272,352 L170,352 Z"
    p.append(f'<defs><clipPath id="g"><path d="{glass}"/></clipPath></defs>')
    p.append(f'<path d="{glass}" fill="{SKY}" opacity="0.35"/>')
    p.append(f'<g clip-path="url(#g)"><rect x="140" y="270" width="170" height="100" '
             f'fill="{WATER}"/>'
             f'<path d="M140,274 q34,-14 68,0 q34,14 68,0 L310,268 L310,258 L140,258 Z" '
             f'fill="{WATER}" opacity="0.6"/></g>')
    p.append(f'<path d="{glass}" fill="none" stroke="{STONE}" stroke-width="10" '
             f'stroke-linejoin="round"/>')
    return card("".join(p))


def lips():
    return card(
        f'<path d="M52,192 Q118,120 200,178 Q282,120 348,192 L200,214 Z" fill="{RED}"/>'
        f'<path d="M52,192 Q200,322 348,192 Q200,240 52,192 Z" fill="{RED_D}"/>'
        f'<path d="M52,192 Q200,224 348,192" fill="none" stroke="{NIGHT_D}" '
        f'stroke-width="7" opacity="0.5"/>'
        f'<ellipse cx="150" cy="242" rx="30" ry="12" fill="{WHITE}" opacity="0.25"/>')


def draw():
    p = [f'<rect x="48" y="66" width="304" height="268" rx="14" fill="{WHITE}" '
         f'stroke="{STONE}" stroke-width="8"/>']
    p.append(f'<path d="M96,264 Q148,146 200,232 Q252,314 300,176" fill="none" '
             f'stroke="{WATER}" stroke-width="15" stroke-linecap="round"/>')
    p.append(f'<g transform="translate(286 196) rotate(42)">'
             f'<polygon points="-16,0 16,0 16,150 -16,150" fill="{GOLD}"/>'
             f'<polygon points="-16,150 16,150 0,196" fill="{PINK_L}"/>'
             f'<polygon points="-6,178 6,178 0,196" fill="{DARK}"/>'
             f'<rect x="-16" y="-40" width="32" height="40" rx="6" fill="{RED}"/>'
             f'<rect x="-16" y="-4" width="32" height="12" fill="{STONE_D}"/></g>')
    return card("".join(p))




def barn():
    p = [f'<rect x="42" y="336" width="316" height="24" fill="{GREEN_D}"/>']
    p.append(f'<rect x="286" y="152" width="64" height="184" fill="{STONE}"/>')
    p.append(f'<path d="M286,152 q32,-34 64,0 Z" fill="{STONE_D}"/>')
    p.append(f'<rect x="72" y="186" width="216" height="150" fill="{RED}"/>')
    p.append(f'<path d="M54,190 L180,96 L306,190 Z" fill="{RED_D}"/>')
    p.append(f'<rect x="150" y="240" width="76" height="96" fill="{WOOD_D}"/>')
    p.append(f'<path d="M150,240 L226,336 M226,240 L150,336" stroke="{WHITE}" '
             f'stroke-width="9"/>')
    p.append(f'<rect x="164" y="196" width="48" height="34" rx="4" fill="{WHITE}" '
             f'opacity="0.85"/>')
    return card("".join(p))


def bus():
    p = [f'<rect x="42" y="140" width="316" height="150" rx="28" fill="{GOLD}"/>']
    for i in range(4):
        p.append(f'<rect x="{62 + i*58}" y="164" width="46" height="46" rx="8" '
                 f'fill="{SKY}"/>')
    p.append(f'<rect x="296" y="164" width="46" height="76" rx="8" fill="{SKY_D}"/>')
    p.append(f'<rect x="42" y="234" width="316" height="18" fill="{RED}"/>')
    p.append(f'<circle cx="128" cy="298" r="38" fill="{DARK}"/>')
    p.append(f'<circle cx="128" cy="298" r="16" fill="{STONE}"/>')
    p.append(f'<circle cx="282" cy="298" r="38" fill="{DARK}"/>')
    p.append(f'<circle cx="282" cy="298" r="16" fill="{STONE}"/>')
    p.append(f'<circle cx="348" cy="264" r="12" fill="{WHITE}"/>')
    return card("".join(p))


def toe():
    # A footprint, not a foot: separated toe pads are far more readable, and
    # ringing the big one makes the clue TOE rather than FOOT.
    toes = ((150, 146, 24), (198, 130, 19), (234, 134, 16), (262, 148, 13),
            (286, 166, 11))
    p = []
    for x, y, r in toes:
        p.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{SKIN}"/>')
    # ball of the foot
    p.append(f'<path d="M146,196 Q152,176 200,176 Q262,176 268,206 '
             f'Q272,240 236,250 Q186,258 156,240 Q138,224 146,196 Z" fill="{SKIN}"/>')
    # arch and heel
    p.append(f'<path d="M232,248 Q262,268 258,300 Q252,336 208,338 '
             f'Q170,336 166,306 Q162,278 186,262 Z" fill="{SKIN}"/>')
    p.append(f'<circle cx="150" cy="146" r="46" fill="none" stroke="{RED}" '
             f'stroke-width="10" stroke-dasharray="15 12"/>')
    return card("".join(p))


def sum_():
    # An actual addition, so it reads SUM rather than merely "plus".
    p = [f'<rect x="44" y="96" width="312" height="208" rx="20" fill="{NIGHT_D}"/>']
    p.append(f'<rect x="60" y="112" width="280" height="176" rx="12" fill="none" '
             f'stroke="{STONE_D}" stroke-width="5" opacity="0.5"/>')
    p.append(f'<text x="200" y="232" text-anchor="middle" font-family="{FONT}" '
             f'font-size="74" font-weight="bold" fill="{WHITE}">2+2=4</text>')
    p.append(f'<rect x="36" y="304" width="328" height="22" rx="11" fill="{WOOD_D}"/>')
    p.append(f'<rect x="250" y="286" width="60" height="16" rx="8" fill="{CREAM}"/>')
    return card("".join(p))


def well():
    p = [f'<rect x="126" y="118" width="20" height="146" fill="{WOOD_D}"/>']
    p.append(f'<rect x="254" y="118" width="20" height="146" fill="{WOOD_D}"/>')
    p.append(f'<path d="M92,124 L308,124 L200,52 Z" fill="{RED}"/>')
    p.append(f'<path d="M200,52 L308,124 L262,124 Z" fill="{RED_D}"/>')
    p.append(f'<rect x="132" y="140" width="136" height="14" rx="7" fill="{WOOD}"/>')
    # stone shaft
    p.append(f'<rect x="118" y="252" width="164" height="106" fill="{STONE}"/>')
    for r in range(3):
        for c in range(4):
            x = 122 + c * 42 + (21 if r % 2 else 0)
            p.append(f'<rect x="{x}" y="{258 + r*34}" width="36" height="26" rx="4" '
                     f'fill="{STONE_D}" opacity="0.55"/>')
    p.append(f'<ellipse cx="200" cy="252" rx="82" ry="24" fill="{STONE_D}"/>')
    p.append(f'<ellipse cx="200" cy="252" rx="62" ry="16" fill="{NIGHT_D}"/>')
    # rope and bucket
    p.append(f'<line x1="200" y1="154" x2="200" y2="196" stroke="{CREAM}" '
             f'stroke-width="5"/>')
    p.append(f'<path d="M172,200 Q200,178 228,200" fill="none" stroke="{STONE_D}" '
             f'stroke-width="5"/>')
    p.append(f'<path d="M170,202 L230,202 L220,248 L180,248 Z" fill="{WOOD}"/>')
    p.append(f'<rect x="170" y="202" width="60" height="10" fill="{WOOD_D}"/>')
    return card("".join(p))


def mass():
    p = [rays(200, 106, 14, 62, 108, GOLD, 0.30, 0.06)]
    p.append(f'<circle cx="200" cy="106" r="54" fill="{WHITE}" stroke="{GOLD_D}" '
             f'stroke-width="7"/>')
    p.append(f'<path d="M200,74 L200,138 M172,106 L228,106" stroke="{GOLD_D}" '
             f'stroke-width="9" stroke-linecap="round"/>')
    p.append(f'<path d="M136,186 Q136,254 200,266 Q264,254 264,186 Z" fill="{GOLD}"/>')
    p.append(f'<path d="M148,192 Q150,240 200,252" fill="none" stroke="{WHITE}" '
             f'stroke-width="8" opacity="0.4"/>')
    p.append(f'<rect x="190" y="264" width="20" height="66" fill="{GOLD_D}"/>')
    p.append(f'<ellipse cx="200" cy="336" rx="62" ry="18" fill="{GOLD_D}"/>')
    return card("".join(p))


def abra():
    p = [star4(96, 108, 26, GOLD), star4(320, 92, 20, GOLD),
         star4(300, 176, 15, GOLD_D), star4(120, 62, 14, GOLD_D)]
    p.append(f'<rect x="126" y="128" width="148" height="164" fill="{DARK}"/>')
    p.append(f'<rect x="126" y="248" width="148" height="32" fill="{RED}"/>')
    p.append(f'<ellipse cx="200" cy="294" rx="136" ry="30" fill="{NIGHT_D}"/>')
    p.append(f'<ellipse cx="200" cy="288" rx="136" ry="28" fill="{DARK}"/>')
    p.append(f'<g transform="translate(292 300) rotate(-36)">'
             f'<rect x="-12" y="-124" width="24" height="150" rx="10" fill="{NIGHT_D}"/>'
             f'<rect x="-12" y="-124" width="24" height="42" rx="10" fill="{WHITE}"/></g>')
    return card("".join(p))


def ham():
    # Rounded-triangle leg of ham with the bone clearly protruding at the apex.
    p = [f'<rect x="182" y="40" width="38" height="112" rx="19" fill="{WHITE}" '
         f'stroke="{STONE_D}" stroke-width="5"/>']
    for cx in (182, 220):
        p.append(f'<circle cx="{cx}" cy="52" r="23" fill="{WHITE}" '
                 f'stroke="{STONE_D}" stroke-width="5"/>')
    meat = ("M200,132 L172,182 Q116,242 120,298 Q126,346 188,356 "
            "Q254,366 296,330 Q328,296 310,246 Q286,192 226,180 Z")
    p.append(f'<defs><clipPath id="h"><path d="{meat}"/></clipPath></defs>')
    p.append(f'<path d="{meat}" fill="{PINK}"/>')
    p.append(f'<g clip-path="url(#h)">')
    p.append(f'<path d="M110,306 Q170,372 258,352 Q322,332 320,272 L340,376 L96,378 Z" '
             f'fill="{PINK_L}"/>')
    for i in range(-2, 7):
        p.append(f'<path d="M{92 + i*44},120 L{28 + i*44},372" stroke="{RED_D}" '
                 f'stroke-width="5" opacity="0.26"/>')
        p.append(f'<path d="M{40 + i*44},120 L{112 + i*44},372" stroke="{RED_D}" '
                 f'stroke-width="5" opacity="0.26"/>')
    p.append('</g>')
    p.append(f'<path d="{meat}" fill="none" stroke="{RED_D}" stroke-width="7" '
             f'opacity="0.55" stroke-linejoin="round"/>')
    return card("".join(p))


def solo():
    p = [f'<path d="M200,40 L104,344 L296,344 Z" fill="{GOLD}" opacity="0.28"/>']
    p.append(f'<ellipse cx="200" cy="344" rx="86" ry="18" fill="{GOLD}" opacity="0.35"/>')
    p.append(f'<path d="M158,338 Q162,232 178,208 L222,208 Q238,232 242,338 Z" '
             f'fill="{DARK}"/>')
    p.append(f'<circle cx="200" cy="176" r="38" fill="{DARK}"/>')
    p.append(f'<path d="M172,214 L146,296 M228,214 L254,296" stroke="{DARK}" '
             f'stroke-width="22" stroke-linecap="round"/>')
    return card("".join(p))


def root():
    p = [f'<rect x="40" y="212" width="320" height="148" fill="{SOIL}"/>']
    p.append(f'<rect x="40" y="204" width="320" height="18" fill="{SAND_D}"/>')
    p.append(f'<path d="M200,204 L200,132" stroke="{GREEN_D}" stroke-width="14" '
             f'stroke-linecap="round"/>')
    p.append(f'<path d="M200,158 Q152,132 146,90 Q196,96 200,146 Z" fill="{GREEN}"/>')
    p.append(f'<path d="M200,142 Q248,116 254,74 Q204,80 200,130 Z" fill="{GREEN}"/>')
    p.append(f'<path d="M200,212 L200,300" stroke="{WOOD_D}" stroke-width="20" '
             f'stroke-linecap="round"/>')
    for x1, y1, x2, y2, w in ((196, 246, 118, 306, 13), (204, 258, 288, 312, 13),
                             (198, 292, 156, 348, 10), (202, 294, 250, 350, 10),
                             (194, 232, 138, 254, 9), (206, 236, 264, 256, 9)):
        p.append(f'<path d="M{x1},{y1} Q{(x1+x2)/2:.0f},{y2-16} {x2},{y2}" fill="none" '
                 f'stroke="{WOOD_D}" stroke-width="{w}" stroke-linecap="round"/>')
    return card("".join(p))


def tear():
    return card(
        f'<path d="M200,52 Q118,196 118,244 A82,82 0 0 0 282,244 Q282,196 200,52 Z" '
        f'fill="{WATER}" stroke="{WATER_D}" stroke-width="8"/>'
        f'<ellipse cx="168" cy="242" rx="22" ry="34" fill="{WHITE}" opacity="0.35" '
        f'transform="rotate(-16 168 242)"/>')


def mouse():
    p = [f'<path d="M296,254 q66,10 58,-56 q-4,-32 -34,-36" fill="none" '
         f'stroke="{GREY_D}" stroke-width="13" stroke-linecap="round"/>']
    p.append(f'<ellipse cx="212" cy="248" rx="108" ry="80" fill="{GREY}"/>')
    for cx, cy in ((116, 154), (176, 140)):
        p.append(f'<circle cx="{cx}" cy="{cy}" r="40" fill="{GREY}"/>')
        p.append(f'<circle cx="{cx}" cy="{cy}" r="24" fill="{PINK}"/>')
    p.append(f'<circle cx="126" cy="220" r="60" fill="{GREY}"/>')
    p.append(f'<circle cx="106" cy="208" r="9" fill="{DARK}"/>')
    p.append(f'<ellipse cx="70" cy="234" rx="15" ry="12" fill="{PINK}"/>')
    p.append(f'<path d="M60,246 L18,262 M62,232 L16,228 M64,220 L22,198" '
             f'stroke="{DARK}" stroke-width="5" stroke-linecap="round" opacity="0.75"/>')
    for cx in (176, 258):
        p.append(f'<ellipse cx="{cx}" cy="322" rx="30" ry="16" fill="{GREY_D}"/>')
    return card("".join(p))


def maya():
    # The bird Filipinos actually call "maya": the Eurasian tree sparrow -
    # chestnut crown, black cheek patch, streaked wing, stubby conical beak.
    BUFF = "#D9C39E"
    p = [f'<rect x="40" y="330" width="320" height="24" rx="12" fill="{WOOD_D}"/>']
    p.append(f'<path d="M46,338 q40,-10 80,0" fill="none" stroke="{WOOD}" '
             f'stroke-width="6" opacity="0.6"/>')
    # tail
    p.append(f'<path d="M268,244 L360,232 L352,258 L358,282 L264,272 Z" '
             f'fill="{BROWN_D}"/>')
    p.append(f'<path d="M300,240 L348,236 M300,262 L352,266" stroke="{DARK}" '
             f'stroke-width="4" opacity="0.55"/>')
    # body
    p.append(f'<ellipse cx="204" cy="236" rx="86" ry="70" fill="{BUFF}"/>')
    # folded wing, streaked
    p.append(f'<path d="M150,196 Q232,180 282,232 Q272,286 198,290 '
             f'Q142,282 132,240 Z" fill="{BROWN}"/>')
    for i in range(5):
        p.append(f'<path d="M{158 + i*26},{200 + i*7} q14,26 6,58" fill="none" '
                 f'stroke="{DARK}" stroke-width="6" opacity="0.45"/>')
    p.append(f'<path d="M158,206 Q236,192 278,236" fill="none" stroke="{BROWN_D}" '
             f'stroke-width="9"/>')
    # head: chestnut crown over a pale cheek
    p.append(f'<circle cx="136" cy="178" r="54" fill="{BUFF}"/>')
    p.append(f'<path d="M86,168 Q100,116 152,124 Q192,132 188,178 '
             f'Q150,150 86,168 Z" fill="{BROWN_D}"/>')
    p.append(f'<path d="M96,206 Q136,220 176,206 Q136,232 96,206 Z" fill="{DARK}"/>')
    p.append(f'<circle cx="104" cy="190" r="15" fill="{DARK}"/>')
    p.append(f'<circle cx="126" cy="170" r="10" fill="{DARK}"/>')
    p.append(f'<circle cx="129" cy="167" r="3.5" fill="{WHITE}"/>')
    # short conical beak
    p.append(f'<polygon points="88,178 40,190 88,202" fill="{STONE_D}"/>')
    p.append(f'<path d="M88,190 L44,190" stroke="{DARK}" stroke-width="3" opacity="0.7"/>')
    # legs
    for x in (186, 232):
        p.append(f'<path d="M{x},300 L{x-4},330" stroke="{GOLD_D}" stroke-width="8" '
                 f'stroke-linecap="round"/>')
        p.append(f'<path d="M{x-16},336 L{x-4},330 L{x+12},336" fill="none" '
                 f'stroke="{GOLD_D}" stroke-width="7" stroke-linecap="round"/>')
    return card("".join(p))


CLUES = {
    "done": done, "yell": yell, "letter-a": letter_a, "letter-s": letter_s,
    "ampersand": ampersand, "dam": dam, "eye": eye, "sack": sack,
    "calendar": calendar, "video": video, "sea": sea, "moon": moon,
    "fill": fill, "lips": lips, "draw": draw,
    "barn": barn, "bus": bus, "toe": toe,
    "mass": mass, "abra": abra, "ham": ham, "solo": solo, "root": root,
    "tear": tear, "mouse": mouse, "maya": maya,
    "sum": sum_, "well": well,
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, fn in CLUES.items():
        with open(os.path.join(OUT, f"{name}.svg"), "w", encoding="utf-8") as fh:
            fh.write(fn())
    print(f"{len(CLUES)} clue icons -> {os.path.normpath(OUT)}")
