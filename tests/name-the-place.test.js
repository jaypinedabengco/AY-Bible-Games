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

// An INDEPENDENT record of where each place is, written from the world and not
// copied out of places.json. "Is this point on some land" is a weaker claim than
// "is this point where it should be": Mount Carmel with its coordinates swapped
// lands on Cyprus, which is real land, and a region is never checked against
// land at all. This asks the second question, with no geometry involved.
const EXPECTED = {
  'jerusalem':      [35.21, 31.77],
  'bethlehem':      [35.20, 31.70],
  'jericho':        [35.46, 31.87],
  'nazareth':       [35.30, 32.70],
  'sea-of-galilee': [35.59, 32.82],
  'dead-sea':       [35.47, 31.50],
  'joppa':          [34.75, 32.05],
  'mount-carmel':   [35.04, 32.73],
  'egypt-goshen':   [31.90, 30.70],
  'babylon':        [44.42, 32.54],
  'nineveh':        [43.15, 36.36],
  'ur':             [46.10, 30.96],
  'hebron':         [35.10, 31.53],
  'shechem':        [35.28, 32.21],
  'bethel':         [35.24, 31.94],
  'shiloh':         [35.29, 32.06],
  'beersheba':      [34.79, 31.25],
  'gaza':           [34.46, 31.50],
  'ashdod':         [34.65, 31.80],
  'lachish':        [34.85, 31.56],
  'megiddo':        [35.18, 32.58],
  'samaria':        [35.20, 32.28],
  'dan':            [35.65, 33.25],
  'tyre':           [35.20, 33.27],
  'sidon':          [35.37, 33.56],
  'mount-hermon':   [35.85, 33.41],
  'caesarea':       [34.90, 32.50],
  'damascus':       [36.30, 33.51],
  'mount-tabor':    [35.40, 32.69],
  'mount-gilboa':   [35.41, 32.47],
  'mount-nebo':     [35.72, 31.77],
  'dothan':         [35.24, 32.42],
  'capernaum':      [35.575, 32.88],
  'rabbah':         [35.93, 31.95],
  'beth-shan':      [35.50, 32.50],
  'rome':           [12.49, 41.89],
  'athens':         [23.73, 37.98],
  'corinth':        [22.88, 37.91],
  'ephesus':        [27.34, 37.94],
  'philippi':       [24.29, 41.01],
  'thessalonica':   [22.94, 40.64],
  'berea':          [22.20, 40.52],
  'troas':          [26.14, 39.76],
  'antioch-syria':  [36.16, 36.20],
  'antioch-pisidia': [31.19, 38.31],
  'tarsus':         [34.89, 36.92],
  'lystra':         [32.45, 37.58],
  'patmos':         [26.55, 37.31],
  'malta':          [14.51, 35.90],
  'paphos':         [32.41, 34.76],
  'memphis':        [31.25, 29.85],
  'haran':          [39.03, 36.86],
  'ararat':         [44.30, 39.70],
};
const TOLERANCE = 0.5;   // degrees, each axis

test('every place is where the world says it is', () => {
  const wrong = [];
  const ids = src.places.map((pl) => pl.id);
  Object.keys(EXPECTED).forEach((id) => {
    if (ids.indexOf(id) === -1) { wrong.push(id + ' is in the fixture but not in places.json'); }
  });
  src.places.forEach((pl) => {
    const want = EXPECTED[pl.id];
    if (!want) {
      wrong.push(pl.id + ' has no expected coordinate: add it to EXPECTED, from a map');
      return;
    }
    if (Math.abs(pl.at[0] - want[0]) > TOLERANCE || Math.abs(pl.at[1] - want[1]) > TOLERANCE) {
      wrong.push(pl.id + ' is at [' + pl.at + '], expected about [' + want + ']'
        + ' - longitude comes FIRST');
    }
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

// Distance from a point to the nearest edge of a ring, in degrees.
function edgeDistance(ring, pt) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = ring[j][0], ay = ring[j][1], bx = ring[i][0], by = ring[i][1];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(pt[0] - (ax + t * dx), pt[1] - (ay + t * dy)));
  }
  return best;
}
const near = (rings, pt) => rings.reduce((m, r) => Math.min(m, edgeDistance(r, pt)), Infinity);

// The question this asks is "is the place where a room would expect it", NOT
// "does it fall inside a polygon we simplified for drawing". Each shoreline is
// simplified, so a coastal or island place can sit a little off the drawn
// coast while its coordinate is exactly right; moving the coordinate to please
// the polygon would put the pin somewhere the place is not. So a place counts
// as on land - or on a lake shore - if it is inside the ring OR within the
// simplification band of that extent's data:
//   holyland    10m data, close to the true shoreline; the tightest genuine
//               margin is Joppa at 0.007 degrees
//   bibleworld  50m data at this scale; Paphos, Malta, Troas and Patmos sit
//               0.04 to 0.41 degrees from the drawn coast, and are correct
// This is a gross-error detector (a city in the mid-Mediterranean, a mountain
// in the Arabian desert). Swapped coordinates are caught by the EXPECTED
// fixture above, which is the check that matters for those.
const LAND_TOLERANCE = { holyland: 0.05, bibleworld: 0.5 };   // degrees

test('a city is on land, and a lake is in water', () => {
  const atlas = loadAtlas();
  const wrong = [];
  src.places.forEach((pl) => {
    const name = atlas.fits(pl.at[0], pl.at[1]);
    if (name === null) {
      wrong.push(pl.id + ' at [' + pl.at + '] is outside BOTH maps');
      return;
    }
    // Against the place's OWN extent, with that extent's tolerance.
    const e = atlas.extents[name];
    const tol = LAND_TOLERANCE[name];
    const onLand = e.land.some((ring) => inside(ring, pl.at)) || near(e.land, pl.at) <= tol;
    const inLake = e.lakes.some((ring) => inside(ring, pl.at)) || near(e.lakes, pl.at) <= tol;
    if (pl.kind === 'city' || pl.kind === 'mountain') {
      if (!onLand) { wrong.push(pl.id + ' (' + pl.kind + ') is not on land'); }
      // Lakes are not carved out of land, so a city in the Sea of Galilee is
      // inside a land ring AND a lake ring and would otherwise pass. A city
      // ON the shore (Capernaum) is within the band of the lake edge and is
      // fine; one well out in the water is not.
      const deep = e.lakes.some((ring) => inside(ring, pl.at)) && near(e.lakes, pl.at) > tol;
      if (deep) { wrong.push(pl.id + ' (' + pl.kind + ') is in a lake'); }
    } else if (pl.kind === 'water') {
      if (!inLake) { wrong.push(pl.id + ' is a water place but not inside any lake'); }
    }
  });
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('nothing on screen gives the place away, in either language', () => {
  const stop = { THE: 1, OF: 1, MOUNT: 1, SEA: 1, ANG: 1, NG: 1, SA: 1, DAGAT: 1, BUNDOK: 1 };
  const words = (s) => {
    const all = s.split(/[ ,]+/).map((w) => w.replace(/[^A-Za-z]/g, ''))
      .filter((w) => w && !stop[w.toUpperCase()]);
    const long = all.filter((w) => w.length > 3);
    // A short word is ignored inside a longer name ("ANG", "NG") but a name
    // that IS short - UR, and one day AI - must still be caught.
    return long.length ? long : all;
  };
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
  // Allowing a pair is a deliberate act: name it here, with the reason. There
  // are none today - Jerusalem and Bethlehem are 28 units apart on the Holy
  // Land map, clear of the 20 a pin needs.
  const ALLOWED = [];
  const surprise = close.filter((c) => ALLOWED.indexOf(c.split(':')[0]) === -1);
  assert.deepEqual(surprise, [], 'pins too close to tell apart:\n' + surprise.join('\n'));
});

test('the committed deck is what the generator produces', () => {
  const { build, render } = require('../tools/make-name-the-place.js');
  const file = fs.readFileSync(
    path.join(ROOT, 'games', 'name-the-place', 'deck.js'), 'utf8');
  const header = file.slice(0, file.indexOf('*/') + 2);
  assert.equal(render(build(), header), file,
    'run: node tools/make-name-the-place.js');
});
