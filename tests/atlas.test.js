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

// A DOM stub small enough to sit here. The atlas builds SVG with
// createElementNS and appendChild and nothing else, so this is the whole
// surface it touches - and testing it means the layer order is pinned.
function domStub() {
  function el(tag) {
    return {
      tagName: tag, children: [], attrs: {}, textContent: '',
      setAttribute: function (k, v) { this.attrs[k] = String(v); },
      appendChild: function (c) { this.children.push(c); return c; },
    };
  }
  return { createElementNS: function (ns, tag) { return el(tag); } };
}

function loadAtlas() {
  const g = { BibleGames: { atlas: { extents: {} } } };
  g.window = g;
  g.document = domStub();
  ['atlas-holyland', 'atlas-bibleworld', 'atlas'].forEach((f) => {
    new Function('window', 'document', 'globalThis', fs.readFileSync(
      path.join(ROOT, 'core', f + '.js'), 'utf8')).call(g, g, g.document, g);
  });
  return g.BibleGames.atlas;
}

test('project puts a known place where it belongs on the close map', () => {
  const a = loadAtlas();
  // Jerusalem: west of the Dead Sea, a little below the middle of the window.
  const p = a.project('holyland', 35.23, 31.78);
  assert.ok(p.x > 0 && p.x < 1000, 'x inside the viewBox');
  assert.ok(p.y > 0 && p.y < a.height('holyland'), 'y inside the viewBox');
  // Joppa is west of Jerusalem and north of it.
  const j = a.project('holyland', 34.75, 32.05);
  assert.ok(j.x < p.x, 'Joppa is west of Jerusalem');
  assert.ok(j.y < p.y, 'Joppa is north of Jerusalem, so higher on screen');
});

test('project round-trips through unproject within a pixel', () => {
  const a = loadAtlas();
  [['holyland', 35.23, 31.78], ['bibleworld', 44.42, 32.54]].forEach((c) => {
    const p = a.project(c[0], c[1], c[2]);
    const back = a.unproject(c[0], p.x, p.y);
    assert.ok(Math.abs(back.lon - c[1]) < 0.01, c[0] + ' lon round-trip');
    assert.ok(Math.abs(back.lat - c[2]) < 0.01, c[0] + ' lat round-trip');
  });
});

test('fits returns the tightest extent that contains a place', () => {
  const a = loadAtlas();
  assert.equal(a.fits(35.23, 31.78), 'holyland', 'Jerusalem is close-up');
  assert.equal(a.fits(44.42, 32.54), 'bibleworld', 'Babylon is wide');
  assert.equal(a.fits(12.50, 41.90), 'bibleworld', 'Rome is wide');
  assert.equal(a.fits(-60, 0), null, 'nowhere in the Bible world');
});

// REVIEW FOCUS 1. A place exactly on a boundary must resolve the same way
// every time, not flap on a floating-point comparison.
test('a place exactly on an extent boundary resolves deterministically', () => {
  const a = loadAtlas();
  const hl = a.extents.holyland.window;
  [[hl[0], 32.0], [hl[1], 32.0], [35.0, hl[2]], [35.0, hl[3]]].forEach((c) => {
    const first = a.fits(c[0], c[1]);
    assert.equal(a.fits(c[0], c[1]), first, 'same answer twice for ' + c);
    assert.equal(first, 'holyland',
      'a point ON the close boundary is inside it, not pushed out to the wide map');
  });
});

test('draw builds its layers in order and ends with an empty pins group', () => {
  const a = loadAtlas();
  const svg = a.draw('holyland');
  const classes = svg.children.map((c) => c.attrs['class']);
  assert.deepEqual(classes.slice(0, 4), ['sea', 'land', 'ridges', 'lakes'],
    'sea under land under ridges under water');
  const last = svg.children[svg.children.length - 1];
  assert.equal(last.attrs['class'], 'pins');
  assert.equal(last.children.length, 0, 'the caller fills this, not the atlas');
});

// REVIEW FOCUS 2. holyland has no locator; draw must not reach for one.
test('draw works on an extent with no locator, and draws one when there is', () => {
  const a = loadAtlas();
  assert.doesNotThrow(() => a.draw('holyland'));
  const wide = a.draw('bibleworld');
  const locator = wide.children.filter((c) => c.attrs['class'] === 'locator');
  assert.equal(locator.length, 1, 'the wide map shows where the close map sits');
  assert.equal(a.draw('holyland').children
    .filter((c) => c.attrs['class'] === 'locator').length, 0);
});

test('the locator rectangle is actually where the close map is', () => {
  const a = loadAtlas();
  const rect = a.draw('bibleworld').children
    .filter((c) => c.attrs['class'] === 'locator')[0];
  const w = a.extents.holyland.window;
  const topLeft = a.project('bibleworld', w[0], w[3]);
  const botRight = a.project('bibleworld', w[1], w[2]);
  assert.ok(Math.abs(Number(rect.attrs.x) - topLeft.x) < 0.5, 'left edge');
  assert.ok(Math.abs(Number(rect.attrs.y) - topLeft.y) < 0.5, 'top edge');
  assert.ok(Math.abs(Number(rect.attrs.width) - (botRight.x - topLeft.x)) < 0.5, 'width');
  assert.ok(Math.abs(Number(rect.attrs.height) - (botRight.y - topLeft.y)) < 0.5, 'height');
});

test('no extent draws a border, ever', () => {
  const a = loadAtlas();
  ['holyland', 'bibleworld'].forEach((name) => {
    const classes = a.draw(name).children.map((c) => c.attrs['class']).join(' ');
    assert.ok(!/border|country|admin/.test(classes),
      name + ' drew something border-shaped');
  });
});

test('the map names its water in the language being played', () => {
  const a = loadAtlas();
  const labels = (lang) => a.draw('holyland', lang).children
    .filter((c) => c.attrs['class'] === 'furniture')[0]
    .children.map((t) => t.textContent);
  assert.ok(labels('en').includes('THE GREAT SEA'));
  assert.ok(labels('fil').includes('ANG MALAKING DAGAT'));
});

test('the peaks are named in the language being played, too', () => {
  const a = loadAtlas();
  const peaks = (lang) => a.draw('holyland', lang).children
    .filter((c) => c.attrs['class'] === 'peaks')[0]
    .children.map((g) => g.children[1].textContent);
  assert.ok(peaks('en').includes('CARMEL'));
  assert.ok(peaks('fil').includes('CARMELO'), 'Carmel is Carmelo in Tagalog');
  assert.ok(!peaks('fil').includes('CARMEL'));
});

test('furniture labels are centred on their coordinate', () => {
  const a = loadAtlas();
  ['holyland', 'bibleworld'].forEach((name) => {
    a.draw(name).children.filter((c) => c.attrs['class'] === 'furniture')[0]
      .children.forEach((t) => assert.equal(t.attrs['text-anchor'], 'middle',
        name + ' ' + t.textContent + ' would extend right of its coordinate'));
  });
});

// fits() feeds the deck generator: a place with a missing or garbled coordinate
// must come back null and fail there, not be quietly given the close map.
test('fits refuses anything that is not a real coordinate', () => {
  const a = loadAtlas();
  assert.equal(a.fits(undefined, undefined), null, 'missing coordinates');
  assert.equal(a.fits(NaN, 0), null, 'NaN');
  assert.equal(a.fits(0, NaN), null, 'NaN latitude');
  // The other coordinate is inside the close window here, so only a
  // NaN-proof containment test returns null: with (NaN, 0) both are already
  // outside and the old comparison would have passed by accident.
  assert.equal(a.fits(NaN, 32), null, 'NaN longitude, latitude inside');
  assert.equal(a.fits(35, NaN), null, 'NaN latitude, longitude inside');
  assert.equal(a.fits('35', '32'), null,
    'strings would coerce in a comparison and pass, so they must be refused');
  assert.equal(a.fits(null, null), null, 'null');
  assert.equal(a.fits(Infinity, 32), null, 'infinity');
});

// Pinned directly: project and unproject both call height(), so a wrong height
// cancels in a round trip and only shows on screen as a stretched coastline.
test('the map is not stretched: height follows the window shape, squeezed for latitude', () => {
  const a = loadAtlas();
  ['holyland', 'bibleworld'].forEach((name) => {
    const [W, E, S, N] = a.extents[name].window;
    const expected = 1000 * (N - S) / ((E - W) * Math.cos((S + N) / 2 * Math.PI / 180));
    assert.ok(Math.abs(a.height(name) - expected) <= 1,
      name + ' is ' + a.height(name) + ' tall but should be about ' + Math.round(expected)
      + ': without the cos(latitude) squeeze the map would be stretched sideways');
  });
  assert.ok(Math.abs(a.height('holyland') - 1249) <= 2, 'holyland is about 1249 tall');
});

test('land and lakes are closed and filled; ridges and rivers are open lines', () => {
  const a = loadAtlas();
  ['holyland', 'bibleworld'].forEach((name) => {
    const groups = {};
    a.draw(name).children.forEach((c) => { groups[c.attrs['class']] = c; });
    ['land', 'lakes'].forEach((cls) => {
      assert.ok(groups[cls].children.length > 0, name + ' ' + cls + ' has paths');
      groups[cls].children.forEach((p) => assert.ok(/ Z$/.test(p.attrs.d),
        name + ' ' + cls + ' path is not closed: the data is not always closed, so the path must be'));
    });
    ['ridges', 'rivers'].forEach((cls) => groups[cls].children.forEach((p) =>
      assert.ok(!/Z$/.test(p.attrs.d), name + ' ' + cls + ' path must stay an open line')));
    // Stroking land would draw a faint frame along the window edge, which
    // reads as a border. Land is filled only.
    groups.land.children.forEach((p) => {
      assert.equal(p.attrs.stroke, undefined, name + ' land path has a stroke');
      assert.equal(p.attrs.style, undefined, name + ' land path has inline style');
    });
    assert.equal(groups.land.attrs.stroke, undefined, name + ' land group has a stroke');
  });
});

test('an unknown extent name is named in the error, not "reading window of undefined"', () => {
  const a = loadAtlas();
  ['draw', 'height'].forEach((fn) => assert.throws(() => a[fn]('nope'),
    /no extent named "nope".*known: holyland, bibleworld/, fn));
  assert.throws(() => a.project(null, 35, 32), /no extent named null/,
    'fits() returns null; forwarding it should say so');
  assert.throws(() => a.unproject('nope', 0, 0), /no extent named "nope"/);
});
