/*
 * Draw the single-letter and single-digit clue tiles.
 *
 *   node tools/make-letters.js
 *
 * These are NOT fetched. Searching an image archive for "letter A" returns
 * correspondence, not the character - and a drawn glyph is perfectly legible
 * at any projector size, weighs nothing, and raises no licence question.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'games', 'book-names', 'images');
const TILES = { 'letter-a.svg': 'A', 'letter-s.svg': 'S', 'numeral-1.svg': '1',
                'letters-ra.svg': 'RA', 'sum.svg': '1+1' };

const BG = '#1b202b', FG = '#f7f3e8';

Object.keys(TILES).forEach(name => {
  const ch = TILES[name];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" rx="36" fill="${BG}"/>
  <text x="200" y="200" fill="${FG}" font-family="Helvetica, Arial, sans-serif"
        font-size="${ch.length > 2 ? 130 : ch.length > 1 ? 200 : 300}" font-weight="700" text-anchor="middle"
        dominant-baseline="central">${ch}</text>
</svg>
`;
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log('  drew ' + name + '  (' + ch + ')');
});
