/*
 * Build core/atlas-holyland.js and core/atlas-bibleworld.js from
 * tools/atlas-source/*.json.
 *
 *     node tools/make-atlas.js
 *
 * Geometry from Natural Earth (public domain); judgement from us. The
 * coastline, the lakes and the rivers are survey data and are generated. The
 * mountains, the ridges and the furniture labels are editorial - deciding that
 * Carmel matters and Meron does not is not cartography - and are written here
 * by hand.
 *
 * TWO STANDING RULES
 *
 * NO BORDERS, EVER. They differ by era, so any line drawn would be wrong for
 * most of the Bible; and political lines on the modern Levant are not
 * something a church projector should assert.
 *
 * WHERE THE MODERN LANDSCAPE DIFFERS FROM THE ANCIENT ONE, SAY SO. The Dead
 * Sea arrives from Natural Earth as two polygons because the lake split in the
 * 1970s and is still shrinking. It is merged back into one body below, because
 * a map of the Bible world showing a 1990s lake is drawing the wrong century.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(__dirname, 'atlas-source');

// Degrees. The close map keeps about 400 m of detail; the wide one cannot show
// that and the file would be an order of magnitude larger for nothing.
const TOLERANCE = { holyland: 0.004, bibleworld: 0.05 };
// How far apart two river segments may be and still be the same river.
// Measured real joins are 0.001 (holyland) and 0.004 (bibleworld) degrees, so
// 0.05 is over ten times the largest gap that is genuinely one river.
const JOIN = { holyland: 0.05, bibleworld: 0.05 };

const FURNITURE = {
  holyland: [
    { label: 'THE GREAT SEA', label_fil: 'ANG MALAKING DAGAT', at: [34.05, 32.20] },
    { label: 'THE JORDAN', label_fil: 'ILOG JORDAN', at: [35.9, 32.6] },
  ],
  bibleworld: [
    { label: 'THE GREAT SEA', label_fil: 'ANG MALAKING DAGAT', at: [18.0, 34.5] },
    { label: 'THE NILE', label_fil: 'ILOG NILO', at: [31.0, 27.5] },
    { label: 'THE EUPHRATES', label_fil: 'ILOG EUFRATES', at: [40.7, 31.5] },
  ],
};

// Mountains that matter in the Bible, at their real coordinates. Natural Earth
// knows the peaks here only under modern names - Hermon is Jabal ash Shaykh -
// so this list is written rather than derived. Close map only: on the wide one
// they would be specks.
const PEAKS = {
  holyland: [
    { label: 'HERMON', label_fil: 'HERMON', at: [35.85, 33.42], m: 2814 },
    { label: 'CARMEL', label_fil: 'CARMELO', at: [35.05, 32.73], m: 546 },
    { label: 'TABOR', label_fil: 'TABOR', at: [35.39, 32.69], m: 575 },
    { label: 'GILBOA', label_fil: 'GILBOA', at: [35.40, 32.50], m: 536 },
    { label: 'GERIZIM', label_fil: 'GERIZIM', at: [35.27, 32.20], m: 881 },
    { label: 'NEBO', label_fil: 'NEBO', at: [35.73, 31.77], m: 817 },
  ],
  bibleworld: [],
};

// The central hill country as a few strokes. An impression, not relief data,
// and the header says so rather than letting it look like a survey.
const RIDGES = {
  holyland: [
    [[35.30, 32.90], [35.25, 32.60], [35.28, 32.30], [35.20, 32.00],
     [35.15, 31.70], [35.10, 31.35]],
    [[35.80, 32.50], [35.82, 32.20], [35.83, 31.90]],
  ],
  bibleworld: [],
};

const LOCATOR = { holyland: null, bibleworld: 'holyland' };

function perp(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) { return Math.hypot(p[0] - a[0], p[1] - a[1]); }
  const t = Math.max(0, Math.min(1,
    ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function simplify(pts, tol) {
  if (pts.length < 3) { return pts.slice(); }
  let worst = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perp(pts[i], pts[0], pts[pts.length - 1]);
    if (d > worst) { worst = d; idx = i; }
  }
  if (worst <= tol) { return [pts[0], pts[pts.length - 1]]; }
  return simplify(pts.slice(0, idx + 1), tol).slice(0, -1)
    .concat(simplify(pts.slice(idx), tol));
}

// Shoelace. The ring need not be closed; the last edge wraps to the first.
function area(r) {
  let sum = 0;
  for (let i = 0; i < r.length; i++) {
    const q = r[(i + 1) % r.length];
    sum += r[i][0] * q[1] - q[0] * r[i][1];
  }
  return Math.abs(sum / 2);
}

function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

// Natural Earth splits a river into named segments, so the Jordan arrives as
// several runs. Chain them by nearest endpoints, and STOP rather than join
// anything further apart than the tolerance - welding two unrelated stretches
// together would draw a watercourse that does not exist.
//
// Land does not need this: it comes from polygons.
//
// Those rings are NOT all closed, though the obvious assumption is that they
// are. A ring wholly inside the window keeps its GeoJSON closing point; a ring
// the window CUT comes back open, because the clip replaced that point with
// crossing points. Everything downstream must cope with both - `simplify`
// does, and the renderer closes with 'Z' rather than relying on the data.
function chain(runs, tol, label) {
  const pool = runs.filter(function (r) { return r.length > 2; })
    .map(function (r) { return r.slice(); });
  // Runs of two points or fewer are stubs and are discarded up front; count
  // them so they are as visible as a run that failed to join.
  let dropped = runs.length - pool.length;
  if (!pool.length) { return []; }
  let best = 0;
  pool.forEach(function (r, i) { if (r.length > pool[best].length) { best = i; } });
  let out = pool.splice(best, 1)[0];
  let joined = true;
  while (joined && pool.length) {
    joined = false;
    let pick = null;
    pool.forEach(function (r, i) {
      [[dist(out[out.length - 1], r[0]), i, r, 'end'],
       [dist(out[out.length - 1], r[r.length - 1]), i, r.slice().reverse(), 'end'],
       [dist(out[0], r[r.length - 1]), i, r, 'front'],
       [dist(out[0], r[0]), i, r.slice().reverse(), 'front']]
        .forEach(function (cand) {
          if (!pick || cand[0] < pick[0]) { pick = cand; }
        });
    });
    if (pick && pick[0] <= tol) {
      pool.splice(pick[1], 1);
      out = pick[3] === 'end' ? out.concat(pick[2]) : pick[2].concat(out);
      joined = true;
    }
  }
  // Anything still in the pool could not be joined within tolerance. Say so:
  // a truncated river would otherwise be invisible.
  dropped += pool.length;
  if (dropped) {
    process.stderr.write('warning: ' + (label || 'river') + ': ' + dropped
      + ' of ' + runs.length + ' run(s) dropped (stubs of 2 points or fewer, or'
      + ' further than ' + tol + ' degrees from the chain)\n');
  }
  return out;
}

function hull(pts) {
  const s = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  if (s.length < 3) { return s; }
  const half = function (ps) {
    const out = [];
    ps.forEach(function (p) {
      while (out.length > 1
        && (out[out.length - 1][0] - out[out.length - 2][0]) * (p[1] - out[out.length - 2][1])
         - (out[out.length - 1][1] - out[out.length - 2][1]) * (p[0] - out[out.length - 2][0]) <= 0) {
        out.pop();
      }
      out.push(p);
    });
    return out;
  };
  return half(s).slice(0, -1).concat(half(s.slice().reverse()).slice(0, -1));
}

function build(name) {
  const src = JSON.parse(fs.readFileSync(path.join(SOURCE, name + '.json'), 'utf8'));
  const tol = TOLERANCE[name];
  const win = src.window;

  // Land arrives already clipped to the window, as one ring per land mass and
  // island. Simplify each. A small island can collapse at the extent tolerance
  // to [A,B,A] - three points, zero area - which fills as nothing, and losing
  // it silently would lose Malta (Acts 28). A 0.005 square-degree island is
  // below the simplifier's resolution but not below the game's, so a collapsed
  // ring is retried at a much finer tolerance and dropped only if it is STILL
  // degenerate.
  const land = [];
  src.land.forEach(function (ring) {
    let out = simplify(ring, tol);
    if (out.length < 3 || area(out) === 0) { out = simplify(ring, tol / 20); }
    if (out.length >= 3 && area(out) > 0) { land.push(out); }
  });

  const lakes = [];
  const named = {};
  src.lakes.forEach(function (l) {
    (named[l.name] = named[l.name] || []).push(l.ring);
  });
  Object.keys(named).forEach(function (nm) {
    const rings = named[nm];
    // The Dead Sea's two modern basins become one ancient body. Anything else
    // that arrives in pieces keeps its largest ring.
    if (nm === 'Dead Sea' && rings.length > 1) {
      lakes.push(simplify(hull([].concat.apply([], rings)), tol));
    } else {
      // NB: 'largest' by point count, not area. Fine for every lake today; a
      // multi-piece lake with a detailed islet would need area instead.
      let biggest = rings[0];
      rings.forEach(function (r) { if (r.length > biggest.length) { biggest = r; } });
      lakes.push(simplify(biggest, tol));
    }
  });

  // Natural Earth names a river by COUNTRY, so one river arrives under
  // several names: the Euphrates is Al Furat in Iraq and Firat in Turkey, and
  // the Tigris is Dicle. Matching the English name alone would have drawn the
  // Iraqi Euphrates and stopped at the Syrian border - a river ending in
  // mid-air, on the map where those rivers are the only orientation there is.
  const ALIASES = {
    Jordan: ['Jordan'],
    Nile: ['Nile', 'Bahr el Nil', 'An Nil'],
    Euphrates: ['Euphrates', 'Al Furat', 'Firat'],
    Tigris: ['Tigris', 'Dicle'],
    // The delta branches are separate entries, NOT aliases of the Nile. The
    // delta is two channels that diverge from the apex; chaining them into the
    // Nile would join Rosetta to Damietta by nearest endpoints and weld them
    // into one zigzag river that does not exist.
    'Rosetta Branch': ['Rosetta Branch'],
    'Damietta Branch': ['Damietta Branch'],
  };
  const WANT = { holyland: ['Jordan'], bibleworld: ['Nile', 'Rosetta Branch', 'Damietta Branch', 'Euphrates', 'Tigris'] };
  const rivers = [];
  WANT[name].forEach(function (want) {
    const names = ALIASES[want];
    const runs = src.rivers
      .filter(function (r) { return names.indexOf(r.name) !== -1; })
      .map(function (r) { return r.line; });
    const line = chain(runs, JOIN[name], want);
    if (line.length > 1) { rivers.push(simplify(line, tol)); }
  });

  return {
    window: win,
    land: land,
    lakes: lakes,
    rivers: rivers,
    furniture: FURNITURE[name],
    peaks: PEAKS[name],
    ridges: RIDGES[name],
    locator: LOCATOR[name],
  };
}

function round(v) { return Number(v.toFixed(3)); }
function line(pts) {
  return '[' + pts.map(function (p) {
    return '[' + round(p[0]) + ',' + round(p[1]) + ']';
  }).join(',') + ']';
}

function render(name, data, header) {
  const L = [header,
    "(function (root) {",
    "  var BG = root.BibleGames = root.BibleGames || {};",
    "  BG.atlas = BG.atlas || { extents: {} };",
    "  BG.atlas.extents = BG.atlas.extents || {};",
    "  BG.atlas.extents['" + name + "'] = {",
    '    window: [' + data.window.join(', ') + '],',
    '    land: [' + data.land.map(line).join(',\n           ') + '],',
    '    lakes: [' + data.lakes.map(line).join(',\n            ') + '],',
    '    rivers: [' + data.rivers.map(line).join(',\n             ') + '],',
    '    furniture: ' + JSON.stringify(data.furniture) + ',',
    '    peaks: ' + JSON.stringify(data.peaks) + ',',
    '    ridges: [' + data.ridges.map(line).join(',\n             ') + '],',
    '    locator: ' + JSON.stringify(data.locator) + ',',
    '  };',
    "})(typeof globalThis !== 'undefined' ? globalThis : window);"];
  return L.join('\n') + '\n';
}

function headerFor(name) {
  return '/*\n'
    + ' * ' + name + ' - generated map geometry. Do not edit by hand: run\n'
    + ' *\n'
    + ' *     node tools/make-atlas.js\n'
    + ' *\n'
    + ' * Coastline, lakes and rivers from Natural Earth, which is public domain\n'
    + ' * and asks for no attribution. Credited anyway.\n'
    + ' *\n'
    + ' * The Dead Sea is drawn as ONE body. Natural Earth gives two, because the\n'
    + ' * lake split in the 1970s and is still shrinking - which is the right map\n'
    + ' * of today and the wrong map of the Bible.\n'
    + ' *\n'
    + ' * No borders. They differ by era, and this is a church projector.\n'
    + ' */';
}

if (require.main === module) {
  ['holyland', 'bibleworld'].forEach(function (name) {
    const data = build(name);
    const file = path.join(ROOT, 'core', 'atlas-' + name + '.js');
    fs.writeFileSync(file, render(name, data, headerFor(name)));
    console.log(name + ': ' + data.land.length + ' land rings, '
      + data.lakes.length + ' lakes, ' + data.rivers.length + ' rivers — '
      + Math.round(fs.statSync(file).size / 1024) + ' KB');
  });
}

module.exports = { build, render, headerFor, chain, simplify, hull };
