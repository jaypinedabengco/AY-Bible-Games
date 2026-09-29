'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'places.json'), 'utf8'));

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

function deck() {
  const g = { window: {} };
  g.window = g;
  new Function('window', fs.readFileSync(
    path.join(ROOT, 'games', 'name-the-place', 'deck.js'), 'utf8'))(g);
  return g.DECK;
}

// Ray casting. A city in the sea is the one error nothing else would notice -
// not the validator, not a reader, not a glance at the deck file.
function inside(ring, pt) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1])
      && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) { hit = !hit; }
  }
  return hit;
}

test('every place is on the tightest map that contains it', () => {
  const atlas = loadAtlas();
  const wrong = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => {
      const want = atlas.fits(v.at[0], v.at[1]);
      if (want === null) {
        wrong.push(p.id + ': ' + v.at + ' is outside BOTH maps — the puzzle is unreachable');
      } else if (v.extent !== want) {
        wrong.push(p.id + ': on ' + v.extent + ', should be ' + want);
      }
    });
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('a city is on land, and a lake is in water', () => {
  const atlas = loadAtlas();
  const wrong = [];
  src.places.forEach((pl) => {
    // Against the place's OWN extent: the wide coastline is simplified far
    // more coarsely, so a coastal city can sit a pixel out to sea there while
    // being correctly inland on the map it is actually drawn on.
    const e = atlas.extents[atlas.fits(pl.at[0], pl.at[1])];
    const onLand = e.land.some((ring) => inside(ring, pl.at));
    const inLake = e.lakes.some((ring) => inside(ring, pl.at));
    if (pl.kind === 'city' || pl.kind === 'mountain') {
      if (!onLand) { wrong.push(pl.id + ' (' + pl.kind + ') is not on land'); }
    } else if (pl.kind === 'water') {
      if (!inLake) { wrong.push(pl.id + ' is a water place but not inside any lake'); }
    }
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('nothing on screen gives the place away, in either language', () => {
  const stop = { THE: 1, OF: 1, MOUNT: 1, SEA: 1, ANG: 1, NG: 1, SA: 1, DAGAT: 1, BUNDOK: 1 };
  const words = (s) => s.split(/[ ,]+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ''))
    .filter((w) => w.length > 3 && !stop[w.toUpperCase()]);
  const all = [];
  deck().puzzles.forEach((p) => {
    p.variants.forEach((v) => { all.push(v.answer || p.answer); });
  });
  const leaks = [];
  deck().puzzles.forEach((p) => {
    const own = [p.answer].concat(p.variants.map((v) => v.answer).filter(Boolean));
    p.variants.forEach((v, i) => {
      const shown = ((v.clue || '') + ' ' + (v.verse || '')).toLowerCase();
      own.forEach((name) => words(name).forEach((w) => {
        if (new RegExp('\\b' + w.toLowerCase() + '\\b').test(shown)) {
          leaks.push(p.id + ' #' + i + ': says "' + w + '"');
        }
      }));
      all.forEach((other) => {
        if (own.indexOf(other) !== -1) { return; }
        words(other).forEach((w) => {
          if (new RegExp('\\b' + w.toLowerCase() + '\\b').test(shown)) {
            leaks.push(p.id + ' #' + i + ': names "' + other + '"');
          }
        });
      });
    });
  });
  assert.deepEqual(leaks, [], leaks.join('\n'));
});

// REVIEW FOCUS 5. UR is UR in both languages; the reveal must print it once.
test('a name identical in both languages is printed once', () => {
  const p = deck().puzzles.filter((x) => x.answer === 'UR')[0];
  assert.ok(p, 'the starter set includes UR');
  const fil = p.variants.filter((v) => v.lang === 'fil')[0];
  assert.equal(fil.answer, 'UR');
  // otherName suppresses an alt identical to the answer, as it does for JESUS
  // in Who Did It?. Exercised through the real view, not asserted about data.
  ['../core/normalize.js', '../core/views.js'].forEach((m) => require(m));
  const { normalizeDeck } = globalThis.BibleGames.normalize;
  const norm = normalizeDeck(deck());
  const np = norm.puzzles.filter((x) => x.answer === 'UR')[0];
  const nv = np.variants.filter((v) => v.lang === 'fil')[0];
  const view = globalThis.BibleGames.views.byType.map.view(np, nv, 9);
  assert.equal(view.answered.alt, null,
    'UR and UR are one word; printing it twice reads as a mistake');
});

test('pin separation is measured, and close pairs are named', () => {
  const atlas = loadAtlas();
  const close = [];
  const byExtent = {};
  src.places.forEach((pl) => {
    const e = atlas.fits(pl.at[0], pl.at[1]);
    (byExtent[e] = byExtent[e] || []).push(pl);
  });
  Object.keys(byExtent).forEach((e) => {
    const list = byExtent[e];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = atlas.project(e, list[i].at[0], list[i].at[1]);
        const b = atlas.project(e, list[j].at[0], list[j].at[1]);
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        // A pin is about 18 viewBox units across. Closer than 20 and the room
        // is being shown a distinction it cannot see.
        if (d < 20) { close.push(list[i].id + ' / ' + list[j].id + ': ' + d.toFixed(1)); }
      }
    }
  });
  // Reported, not rejected: Jerusalem and Bethlehem are both too good to lose
  // and their clues stand alone. This exists so the NEXT close pair is a
  // decision somebody makes rather than one that happens quietly.
  if (close.length) { console.log('  close pins:\n    ' + close.join('\n    ')); }
  assert.ok(close.length <= 2, 'more close pairs than expected:\n' + close.join('\n'));
});

test('the committed deck is what the generator produces', () => {
  const { build, render } = require('../tools/make-name-the-place.js');
  const file = fs.readFileSync(
    path.join(ROOT, 'games', 'name-the-place', 'deck.js'), 'utf8');
  const header = file.slice(0, file.indexOf('*/') + 2);
  assert.equal(render(build(), header), file,
    'run: node tools/make-name-the-place.js');
});
