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
