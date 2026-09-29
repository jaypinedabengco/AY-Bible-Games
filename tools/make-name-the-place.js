/*
 * Build games/name-the-place/deck.js from tools/places.json.
 *
 *     node tools/make-name-the-place.js
 *
 * Generated for the same reason the chronology and the numbers are: the
 * content is FACTS. A transposed latitude and longitude puts Jericho in the
 * Mediterranean, and it looks perfectly fine on the page.
 *
 * Which map a place is asked on is NOT in places.json and is not in the deck
 * by hand. It comes from atlas.fits, which returns the tightest extent
 * containing the coordinate. A place tagged by hand could disagree with its
 * own coordinates, and the result is a map drawn with no pin visible on it.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'tools', 'places.json');
const TARGET = path.join(ROOT, 'games', 'name-the-place', 'deck.js');

// Shadows globalThis as well as window - see the note in tests/atlas.test.js.
function loadAtlas() {
  const g = { BibleGames: { atlas: { extents: {} } } };
  g.window = g;
  g.document = { createElementNS: () => ({
    setAttribute() {}, appendChild(c) { return c; }, children: [] }) };
  ['atlas-holyland', 'atlas-bibleworld', 'atlas'].forEach((f) => {
    new Function('window', 'document', 'globalThis', fs.readFileSync(
      path.join(ROOT, 'core', f + '.js'), 'utf8')).call(g, g, g.document, g);
  });
  return g.BibleGames.atlas;
}

function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

function build() {
  const atlas = loadAtlas();
  const src = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  return src.places.map(function (pl) {
    const extent = atlas.fits(pl.at[0], pl.at[1]);
    if (!extent) {
      throw new Error(pl.id + ' at ' + pl.at + ' is outside both maps');
    }
    return { place: pl, extent: extent };
  });
}

function render(rows, header) {
  const L = [header, 'window.DECK = {',
    "  id: 'name-the-place',",
    "  title: 'Name the Place',",
    "  idPrefix: 'np',   // shown on the projector, so it must never hint the answer",
    '  shuffle: true,',
    // Capped at the list: the validator rejects a session longer than the
    // number of playable puzzles, and the starter set is only twelve.
    '  sessionSize: ' + Math.min(15, rows.length) + ',',
    "  languages: ['en', 'fil'],",
    '  howToPlay: [',
    "    'A dot appears on the map. The room says what place it is.',",
    "    'Stuck? The next click gives the verse, then a clue.',",
    '  ],',
    '  // No credits and no versions: nothing here is quoted. The clues are ours',
    '  // in both languages, and a coastline belongs to nobody.',
    '  puzzles: ['];

  rows.forEach(function (row, i) {
    const p = row.place;
    const id = 'np-' + String(i + 1).padStart(2, '0');
    L.push('    {');
    L.push("      id: '" + id + "', answer: '" + esc(p.label)
      + "', difficulty: " + p.difficulty + ',');
    L.push('      variants: [');
    [['en', p.label, p.clue, null], ['fil', p.label_fil, p.clue_fil, 'fil']]
      .forEach(function (lang) {
        L.push("        { type: 'map', difficulty: " + p.difficulty + ','
          + (lang[3] ? " lang: '" + lang[3] + "'," : ''));
        if (lang[3]) { L.push("          answer: '" + esc(lang[1]) + "',"); }
        L.push("          extent: '" + row.extent + "', at: ["
          + p.at[0] + ', ' + p.at[1] + '],');
        L.push("          verse: '" + esc(p.verse) + "',");
        L.push("          clue: '" + esc(lang[2]) + "' },");
      });
    L.push('      ],');
    L.push('    },');
  });

  L.push('  ],');
  L.push('};');
  return L.join('\n') + '\n';
}

const HEADER = `/*
 * Name the Place - the deck.
 *
 * GENERATED. Do not edit by hand: run
 *
 *     node tools/make-name-the-place.js
 *
 * after changing tools/places.json, which is the one hand-written thing behind
 * this game and the only place a coordinate should ever be corrected.
 *
 * THE GAME. A dot pulses on a map of the Bible world; the room shouts what
 * place it is. Four beats: the pin, the verse, a clue, the name.
 *
 * WHICH MAP. Each place is asked on the TIGHTEST map that contains it, which
 * the generator reads off the coordinates. Jerusalem is only ever asked
 * close-up, where it is a distinct dot; Babylon is only ever asked on the wide
 * map. There is deliberately no hand-written extent field: it would be a
 * second source of truth for something the coordinates already decide, and
 * the failure it invites is a map drawn with no pin visible on it.
 *
 * THE ACCURACY RULE. The location must not be seriously disputed. Mount Sinai,
 * Cana, Emmaus, Bethsaida and Ai are all left out on exactly that basis - see
 * tools/places.json for the list and the reasons.
 */`;

if (require.main === module) {
  const rows = build();
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, render(rows, HEADER));
  const by = {};
  rows.forEach(function (r) { by[r.extent] = (by[r.extent] || 0) + 1; });
  console.log('wrote ' + rows.length + ' puzzles to '
    + path.relative(ROOT, TARGET) + '  ' + JSON.stringify(by));
}

module.exports = { build, render };
