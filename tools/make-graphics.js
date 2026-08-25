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
