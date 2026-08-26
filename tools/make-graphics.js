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

// Chewing: a face in profile blowing a bubble. The first attempt drew a mouth
// with teeth head-on and it read as an EYE - the tooth rows looked like lids and
// the mouthful like a pupil, which would have collided with Isaiah's eye clue.
// A profile plus a pink bubble cannot be mistaken for anything but chewing.
svg('chew.svg', `  <path d="M232 74 Q120 74 108 190 Q100 268 150 300 L150 350 L246 350 L246 300
           Q272 286 274 240 L292 230 L274 214 Q276 108 232 74 Z"
        fill="#f0c9a4" stroke="#c99a6d" stroke-width="6"/>
  <path d="M232 74 Q120 74 108 176 Q150 130 232 138 Q262 128 274 176 Q276 96 232 74 Z"
        fill="#4a3728"/>
  <circle cx="196" cy="196" r="9" fill="#3b2f27"/>
  <path d="M110 244 Q140 258 168 248" stroke="#c07a6a" stroke-width="9"
        fill="none" stroke-linecap="round"/>
  <circle cx="72" cy="250" r="56" fill="#f4a7c0" stroke="#d97fa0" stroke-width="6"/>
  <circle cx="54" cy="232" r="14" fill="#fbd3e0"/>`);

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
