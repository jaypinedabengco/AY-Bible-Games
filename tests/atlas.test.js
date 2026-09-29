'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function source(name) {
  return JSON.parse(fs.readFileSync(
    path.join(ROOT, 'tools', 'atlas-source', name + '.json'), 'utf8'));
}

// The windows are asserted here against the spec, once. Reading them out of the
// file under test would let a wrong window pass every containment check.
const SPEC_WINDOWS = {
  holyland: [33.4, 36.9, 30.3, 34.0],
  bibleworld: [11.5, 47.5, 26.5, 42.5],
};

test('each source window is the one the spec names', () => {
  Object.keys(SPEC_WINDOWS).forEach((name) => {
    assert.deepEqual(source(name).window, SPEC_WINDOWS[name], name);
  });
});

test('the clipped source lies inside its window, category by category', () => {
  const bad = [];
  // How far past the window a point sits, in degrees; 0 when inside.
  const past = (p, [W, E, S, N]) =>
    Math.max(0, W - p[0], p[0] - E, S - p[1], p[1] - N);
  Object.keys(SPEC_WINDOWS).forEach((name) => {
    const src = source(name);
    const win = SPEC_WINDOWS[name];
    const check = (label, pts, slack) => pts.forEach((p) => {
      if (past(p, win) > slack) {
        bad.push(name + ' ' + label + ': ' + p + ' is ' + past(p, win).toFixed(3)
          + ' degrees outside ' + win);
      }
    });
    // Land is cut to the window exactly. Any slack here would let a broken
    // polygon clipper leak land and still pass.
    src.land.forEach((ring) => check('land', ring, 1e-9));
    // A river run keeps the point either side of the window, so it reaches the
    // edge: only its two ENDS may sit outside. Interior points may not.
    src.rivers.forEach((r) => {
      check('river ' + r.name, r.line.slice(1, -1), 1e-9);
      check('river end ' + r.name, [r.line[0], r.line[r.line.length - 1]], 0.15);
    });
    // Lakes are kept whole when any vertex is inside, so one may overhang.
    src.lakes.forEach((l) => check('lake ' + l.name, l.ring, 0.15));
    // The actual rules behind those slacks. Lakes are kept whole when ANY
    // vertex is inside the window; a river run's end is the point that carried
    // it out, so the point NEXT to each end is inside.
    src.lakes.forEach((l) => {
      if (!l.ring.some((p) => past(p, win) === 0)) {
        bad.push(name + ' lake ' + l.name + ' has no vertex inside its window');
      }
    });
    src.rivers.forEach((r) => {
      const n = r.line.length;
      // [end, its neighbour] at each end. Only an end that IS outside needs an
      // inside neighbour; a two-point run has each end as the other's neighbour.
      [[r.line[0], r.line[1]], [r.line[n - 1], r.line[n - 2]]].forEach((pair) => {
        if (past(pair[0], win) > 1e-9 && past(pair[1], win) > 1e-9) {
          bad.push(name + ' river ' + r.name
            + ': an end is outside and so is the point beside it');
        }
      });
    });
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('each source has the features the map needs', () => {
  const hl = source('holyland');
  const names = hl.lakes.map((l) => l.name);
  assert.ok(names.includes('Sea of Galilee'), 'holyland needs the Sea of Galilee');
  assert.ok(names.includes('Dead Sea'), 'holyland needs the Dead Sea');
  assert.ok(hl.rivers.some((r) => r.name === 'Jordan'), 'holyland needs the Jordan');

  const bw = source('bibleworld');
  const rivers = bw.rivers.map((r) => r.name);
  assert.ok(rivers.includes('Nile'), 'bibleworld needs the Nile');
  assert.ok(rivers.includes('Euphrates'), 'bibleworld needs the Euphrates');
});

// `globalThis` MUST be shadowed, not just `window`. Every core module ends
// with `(typeof globalThis !== 'undefined' ? globalThis : window)`, and inside
// a new Function body `globalThis` is Node's REAL global - so without this the
// extent attaches to the real global and every assertion below runs against an
// empty stub and passes for the wrong reason.
function atlas(name) {
  const g = { BibleGames: { atlas: { extents: {} } } };
  g.window = g;
  new Function('window', 'globalThis', fs.readFileSync(
    path.join(ROOT, 'core', 'atlas-' + name + '.js'), 'utf8'))(g, g);
  return g.BibleGames.atlas.extents[name];
}

// Shoelace. A ring with no area fills as nothing, so an island whose ring
// collapsed to [A,B,A] has silently vanished from the map.
const areaOf = (r) => Math.abs(r.reduce((sum, p, i) => {
  const q = r[(i + 1) % r.length];
  return sum + (p[0] * q[1] - q[0] * p[1]);
}, 0) / 2);

test('land rings enclose an area', () => {
  ['holyland', 'bibleworld'].forEach((name) => {
    const e = atlas(name);
    assert.ok(e.land.length >= 1, name + ': no land at all');
    e.land.forEach((ring, i) => {
      assert.ok(ring.length >= 3,
        name + ' ring ' + i + ' has ' + ring.length + ' points and encloses nothing');
      assert.ok(areaOf(ring) > 0,
        name + ' ring ' + i + ' has zero area: an island has collapsed to a sliver');
    });
    // Real figures: holyland holds 8.66 of its 12.95 square degrees as land,
    // bibleworld 386 of 576 - about two thirds each. A collapse of the
    // simplifier would fall far below a third.
    const [W, E, S, N] = e.window;
    const total = e.land.reduce((s, r) => s + areaOf(r), 0);
    assert.ok(total > (E - W) * (N - S) / 3,
      name + ': total land area ' + total.toFixed(2) + ' square degrees is too small');
  });
});

test('the small islands the Bible names survive simplification', () => {
  const rings = atlas('bibleworld').land;
  const near = (lon, lat) => rings.some((r) => r.some(
    (p) => Math.abs(p[0] - lon) < 0.3 && Math.abs(p[1] - lat) < 0.3));
  assert.ok(near(14.31, 36.03), 'Malta (Acts 28) has vanished from the wide map');
  assert.ok(near(12.05, 36.76), 'Pantelleria has vanished');
});

test('each extent has exactly the keys the renderer reads', () => {
  ['holyland', 'bibleworld'].forEach((name) => {
    assert.deepEqual(Object.keys(atlas(name)),
      ['window', 'land', 'lakes', 'rivers', 'furniture', 'peaks', 'ridges', 'locator']);
  });
});

test('a river is chained into one line, with no invented stretches', () => {
  const e = atlas('holyland');
  assert.equal(e.rivers.length, 1, 'the Jordan');
  let worst = 0;
  e.rivers[0].forEach((p, i) => {
    if (i === 0) { return; }
    const d = Math.hypot(p[0] - e.rivers[0][i - 1][0], p[1] - e.rivers[0][i - 1][1]);
    if (d > worst) { worst = d; }
  });
  assert.ok(worst < 1.0,
    'a ' + worst.toFixed(2) + ' degree jump means two stretches were welded together');
});

test('the Dead Sea is one body, not the two modern basins', () => {
  const e = atlas('holyland');
  assert.equal(e.lakes.length, 2, 'the Sea of Galilee and one Dead Sea');
  const spans = e.lakes.map((ring) => {
    const lats = ring.map((p) => p[1]);
    return Math.max(...lats) - Math.min(...lats);
  }).sort((a, b) => b - a);
  assert.ok(spans[0] > 0.5,
    'the merged Dead Sea should span more than half a degree of latitude');
});

test('each extent declares exactly the furniture the spec allows', () => {
  assert.deepEqual(atlas('holyland').furniture.map((f) => f.label),
    ['THE GREAT SEA', 'THE JORDAN']);
  assert.deepEqual(atlas('bibleworld').furniture.map((f) => f.label),
    ['THE GREAT SEA', 'THE NILE', 'THE EUPHRATES']);
  atlas('holyland').furniture.concat(atlas('bibleworld').furniture)
    .forEach((f) => assert.ok(f.label_fil, f.label + ' has no Tagalog label'));
});

test('only the wide map carries a locator', () => {
  assert.equal(atlas('holyland').locator, null);
  assert.equal(atlas('bibleworld').locator, 'holyland');
});

test('the committed atlas is what the generator produces', () => {
  const { build, render, headerFor } = require('../tools/make-atlas.js');
  ['holyland', 'bibleworld'].forEach((name) => {
    const file = fs.readFileSync(path.join(ROOT, 'core', 'atlas-' + name + '.js'), 'utf8');
    // headerFor, not a header sliced out of the file: otherwise a hand-edited
    // header would pass.
    assert.equal(render(name, build(name), headerFor(name)), file,
      'run: node tools/make-atlas.js');
  });
});

test('the wide map rivers reach the sea, the Nile included', () => {
  const e = atlas('bibleworld');
  assert.equal(e.rivers.length, 5, 'Nile, two delta branches, Euphrates, Tigris');
  const north = Math.max.apply(null, [].concat.apply([], e.rivers).map((p) => p[1]));
  assert.ok(north >= 31.3,
    'the Nile stops short of the Mediterranean: the northernmost river point is '
    + north.toFixed(2) + ' N, but the delta meets the coast near 31.5 N');
});
