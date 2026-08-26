/*
 * Draw the clue pictures that no search returns cleanly.
 *
 *   node tools/make-graphics.js
 *
 * An emoji axe does not read as an axe at hall distance, and "a guy" has no
 * emoji that is unmistakably a man rather than a gesture. Drawing them flat,
 * big and high-contrast beats hunting for a photo that will never be right.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'games', 'book-names', 'images');
const BG = '#1b202b';

function svg(name, inner) {
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" rx="36" fill="${BG}"/>
${inner}
</svg>
`;
  fs.writeFileSync(path.join(OUT, name), out);
  console.log('  drew ' + name);
}

// A woodsman's axe: long handle, wide steel head with a curved bit.
svg('axe.svg', `  <g transform="rotate(-18 200 200)">
    <rect x="186" y="120" width="28" height="230" rx="12" fill="#a2703f"/>
    <rect x="186" y="120" width="28" height="230" rx="12" fill="none" stroke="#6f4a25" stroke-width="4"/>
    <path d="M132 96 Q200 58 268 96 Q286 128 268 160 Q200 132 132 160 Q114 128 132 96 Z"
          fill="#cfd6e0" stroke="#8d97a6" stroke-width="6"/>
    <path d="M132 96 Q150 128 132 160 Q108 128 132 96 Z" fill="#eef2f7"/>
  </g>`);

// A guy: plain standing man, friendly and unmistakably a person.
svg('guy.svg', `  <circle cx="200" cy="126" r="52" fill="#f0c9a4" stroke="#c99a6d" stroke-width="5"/>
  <path d="M148 108 Q200 74 252 108 Q244 84 200 78 Q156 84 148 108 Z" fill="#4a3728"/>
  <circle cx="182" cy="130" r="6" fill="#3b2f27"/>
  <circle cx="218" cy="130" r="6" fill="#3b2f27"/>
  <path d="M184 152 Q200 164 216 152" stroke="#3b2f27" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M200 186 Q136 196 128 300 L272 300 Q264 196 200 186 Z" fill="#4f7fd4"/>
  <rect x="150" y="300" width="44" height="70" rx="14" fill="#2f3b52"/>
  <rect x="206" y="300" width="44" height="70" rx="14" fill="#2f3b52"/>`);

// Chewing: a clean profile with pursed lips and a big bubble growing from
// them. Three attempts got here. Head-on with teeth read as an EYE; a floating
// bubble beside a mouthless face read as a balloon; this one puts the bubble on
// the lips and keeps the face simple enough to read at hall distance.
svg('chew.svg', `  <circle cx="132" cy="252" r="86" fill="#f4a7c0"
           stroke="#d97fa0" stroke-width="8"/>
  <circle cx="104" cy="220" r="24" fill="#fbd3e0" opacity="0.9"/>
  <path d="M268 82
           Q188 78 168 158
           Q160 190 146 212
           Q138 226 156 232
           L174 238
           Q170 256 182 262
           Q180 292 194 308
           Q210 330 258 334
           L258 372 L330 372 L330 322
           Q356 296 358 224
           Q360 106 268 82 Z"
        fill="#f0c9a4" stroke="#c99a6d" stroke-width="7" stroke-linejoin="round"/>
  <path d="M268 82 Q188 78 168 158 Q214 116 278 128 Q322 122 352 178
           Q360 106 268 82 Z" fill="#5a4130"/>
  <path d="M204 152 Q228 142 250 154" stroke="#3b2f27" stroke-width="8"
        fill="none" stroke-linecap="round"/>
  <circle cx="226" cy="182" r="11" fill="#3b2f27"/>
  <path d="M300 224 q26 10 0 22" fill="none" stroke="#c99a6d" stroke-width="6"
        stroke-linecap="round"/>
  <path d="M176 248 Q196 240 210 246" stroke="#b8615c" stroke-width="10"
        fill="none" stroke-linecap="round"/>
  <path d="M176 276 Q196 284 210 276" stroke="#b8615c" stroke-width="10"
        fill="none" stroke-linecap="round"/>
`);

// A root: one plant, a soil line, and the roots doing the work underneath.
svg('root.svg', `  <rect x="0" y="196" width="400" height="204" rx="0" fill="#6b4a2f"/>
  <rect x="0" y="196" width="400" height="14" fill="#8a6238"/>
  <path d="M200 196 L200 118" stroke="#4f8f3a" stroke-width="14" stroke-linecap="round"/>
  <path d="M200 150 Q152 118 138 76 Q188 88 200 138 Z" fill="#5fa844"/>
  <path d="M200 150 Q248 118 262 76 Q212 88 200 138 Z" fill="#78c159"/>
  <g stroke="#f0e2c8" stroke-width="11" fill="none" stroke-linecap="round">
    <path d="M200 208 L200 300"/>
    <path d="M200 236 Q152 268 128 340"/>
    <path d="M200 236 Q248 268 272 340"/>
    <path d="M200 286 Q170 318 166 366"/>
    <path d="M200 286 Q230 318 234 366"/>
  </g>
  <g stroke="#f0e2c8" stroke-width="6" fill="none" stroke-linecap="round">
    <path d="M150 292 Q120 306 104 344"/>
    <path d="M250 292 Q280 306 296 344"/>
  </g>`);

// Yelling: a head in profile, mouth wide open, sound radiating from it. The
// emoji for this ("face screaming in fear") reads as WORRIED - hands on cheeks,
// eyes wide - which is a different word entirely.
//
// The profile faces LEFT, so the nose protrudes on the left, above the mouth.
// A first attempt left it floating at the wrong height and the face read badly.
svg('yell.svg', `  <path d="M252 54
           Q150 58 128 152
           Q120 186 104 214
           Q96 228 116 234
           L136 240
           Q132 262 144 268
           Q140 300 154 316
           Q168 340 214 348
           L214 372 L286 372 L286 330
           Q318 300 320 220
           Q322 96 252 54 Z"
        fill="#f0c9a4" stroke="#c99a6d" stroke-width="6" stroke-linejoin="round"/>
  <path d="M252 54 Q150 58 128 152 Q182 104 258 116 Q300 110 320 168
           Q322 96 252 54 Z" fill="#4a3728"/>
  <path d="M168 168 Q192 158 214 170" stroke="#3b2f27" stroke-width="9"
        fill="none" stroke-linecap="round"/>
  <circle cx="190" cy="196" r="11" fill="#3b2f27"/>
  <ellipse cx="176" cy="292" rx="40" ry="46" fill="#7a2b2b"
           stroke="#c99a6d" stroke-width="5"/>
  <ellipse cx="176" cy="310" rx="24" ry="19" fill="#d4646b"/>
  <path d="M268 232 q22 8 0 20" fill="none" stroke="#c99a6d" stroke-width="6"
        stroke-linecap="round"/>
  <g stroke="#e8b53c" stroke-width="10" fill="none" stroke-linecap="round">
    <path d="M92 268 Q64 296 92 326"/>
    <path d="M56 244 Q16 296 56 350"/>
  </g>`);

// A ham. The emoji for this is "meat on bone" and reads as barbecue; a search
// for a photograph returned a 1940s magazine advertisement. Drawn: a glazed
// joint with the bone showing and scored fat, which says ham and nothing else.
svg('ham.svg', `  <ellipse cx="196" cy="238" rx="132" ry="112" fill="#d4756b"
           stroke="#a34d47" stroke-width="7"/>
  <path d="M84 196 Q196 150 306 198 Q300 158 196 132 Q100 152 84 196 Z"
        fill="#f2d9c4" stroke="#c9a98f" stroke-width="6"/>
  <g stroke="#a34d47" stroke-width="4" opacity="0.55" fill="none">
    <path d="M120 244 Q196 214 274 244"/>
    <path d="M126 286 Q196 258 268 286"/>
    <path d="M150 202 L150 320"/><path d="M196 194 L196 348"/><path d="M242 202 L242 320"/>
  </g>
  <path d="M186 132 L186 74 Q186 52 208 52 Q230 52 230 74 L230 132 Z"
        fill="#f7f3e8" stroke="#cbbfae" stroke-width="6"/>
  <circle cx="196" cy="66" r="24" fill="#f7f3e8" stroke="#cbbfae" stroke-width="6"/>
  <circle cx="226" cy="70" r="20" fill="#f7f3e8" stroke="#cbbfae" stroke-width="6"/>`);

// Jewels. A photograph of gemstones read as plain stones - uncut, matte, grey.
// A drawn gem is all facets and sparkle, which is what makes it a jewel rather
// than a rock.
svg('jewel.svg', `  <g transform="translate(200 214)">
    <path d="M-96 -34 L-58 -92 L58 -92 L96 -34 L0 96 Z"
          fill="#4fc3d9" stroke="#1f7f96" stroke-width="7" stroke-linejoin="round"/>
    <path d="M-96 -34 L-58 -92 L-24 -34 Z" fill="#9ce4f2"/>
    <path d="M-24 -34 L-58 -92 L58 -92 L24 -34 Z" fill="#79d6ea"/>
    <path d="M24 -34 L58 -92 L96 -34 Z" fill="#39a9c4"/>
    <path d="M-96 -34 L-24 -34 L0 96 Z" fill="#63cde0"/>
    <path d="M-24 -34 L24 -34 L0 96 Z" fill="#8fdff0"/>
    <path d="M24 -34 L96 -34 L0 96 Z" fill="#2f97b3"/>
  </g>
  <g stroke="#f7f3e8" stroke-width="8" stroke-linecap="round">
    <path d="M312 96 L312 140"/><path d="M290 118 L334 118"/>
    <path d="M96 300 L96 330"/><path d="M81 315 L111 315"/>
  </g>
  <circle cx="326" cy="268" r="9" fill="#f7f3e8"/>`);
