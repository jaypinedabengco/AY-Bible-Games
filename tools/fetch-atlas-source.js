/*
 * Download Natural Earth and clip it to the two map windows.
 *
 *   node tools/fetch-atlas-source.js
 *
 * THE ONLY ONLINE STEP IN THE BUILD, and it is run by hand, rarely. Its output
 * is committed so that make-atlas.js - and therefore the test that the atlas
 * matches its generator - works offline like everything else here.
 *
 * The raw files are about 20 MB, which does not belong in a church repository.
 * Clipped to the two windows they are a small fraction of that, and nothing
 * outside the windows was ever going to be drawn.
 *
 * Natural Earth is public domain and requires no attribution. It is credited in
 * the generated files anyway.
 *
 * Resolution is per window: 10m for the close map, where the Carmel headland
 * and the Sea of Galilee have to be recognisable, and 50m for the wide one,
 * where a metre of coastline is far below one screen pixel.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';

// Clip a polygon ring to the window. Sutherland-Hodgman, one edge at a time.
// Needed because land arrives as whole continents and only the window is drawn.
function clipRing(ring, win) {
  const [W, E, S, N] = win;
  const edges = [
    function (p) { return p[0] >= W; }, function (p) { return p[0] <= E; },
    function (p) { return p[1] >= S; }, function (p) { return p[1] <= N; },
  ];
  const cross = [
    function (a, b) { return [W, a[1] + (b[1] - a[1]) * (W - a[0]) / (b[0] - a[0])]; },
    function (a, b) { return [E, a[1] + (b[1] - a[1]) * (E - a[0]) / (b[0] - a[0])]; },
    function (a, b) { return [a[0] + (b[0] - a[0]) * (S - a[1]) / (b[1] - a[1]), S]; },
    function (a, b) { return [a[0] + (b[0] - a[0]) * (N - a[1]) / (b[1] - a[1]), N]; },
  ];
  let out = ring.slice();
  for (let e = 0; e < 4 && out.length; e++) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i], prev = input[(i + input.length - 1) % input.length];
      const curIn = edges[e](cur), prevIn = edges[e](prev);
      if (curIn) {
        if (!prevIn) { out.push(cross[e](prev, cur)); }
        out.push(cur);
      } else if (prevIn) {
        out.push(cross[e](prev, cur));
      }
    }
  }
  return out;
}
const OUT = path.join(__dirname, 'atlas-source');

const WINDOWS = {
  holyland:   { window: [33.4, 36.9, 30.3, 34.0], resolution: '10m' },
  bibleworld: { window: [11.5, 47.5, 26.5, 42.5], resolution: '50m' },
};

function get(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      if (res.statusCode !== 200) {
        reject(new Error(url + ' -> HTTP ' + res.statusCode));
        return;
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', function (c) { body += c; });
      res.on('end', function () { resolve(JSON.parse(body)); });
    }).on('error', reject);
  });
}

function linesOf(geom) {
  if (geom.type === 'LineString') { return [geom.coordinates]; }
  if (geom.type === 'MultiLineString') { return geom.coordinates; }
  return [];
}

function ringsOf(geom) {
  if (geom.type === 'Polygon') { return [geom.coordinates[0]]; }
  if (geom.type === 'MultiPolygon') { return geom.coordinates.map(function (p) { return p[0]; }); }
  return [];
}

// Keep the runs that fall inside the window, plus the point either side, so a
// clipped coast still reaches the edge instead of stopping short of it.
function clip(line, win) {
  const [W, E, S, N] = win;
  const inside = function (p) { return p[0] >= W && p[0] <= E && p[1] >= S && p[1] <= N; };
  const runs = [];
  let cur = [];
  for (let i = 0; i < line.length; i++) {
    if (inside(line[i])) {
      if (!cur.length && i > 0) { cur.push(line[i - 1]); }
      cur.push(line[i]);
    } else {
      if (cur.length) { cur.push(line[i]); }
      if (cur.length > 1) { runs.push(cur); }
      cur = [];
    }
  }
  if (cur.length > 1) { runs.push(cur); }
  return runs;
}

async function build(name) {
  const cfg = WINDOWS[name];
  const r = cfg.resolution;
  const [landFc, lakeFc, riverFc] = await Promise.all([
    get(BASE + 'ne_' + r + '_land.geojson'),
    get(BASE + 'ne_' + r + '_lakes.geojson'),
    get(BASE + 'ne_' + r + '_rivers_lake_centerlines.geojson'),
  ]);

  const out = { window: cfg.window, resolution: r, land: [], lakes: [], rivers: [] };

  // Whole continents in, one window's worth out. A ring that clips to fewer
  // than three points does not enclose anything and is dropped.
  landFc.features.forEach(function (f) {
    ringsOf(f.geometry).forEach(function (ring) {
      const clipped = clipRing(ring, cfg.window);
      if (clipped.length >= 3) { out.land.push(clipped); }
    });
  });

  lakeFc.features.forEach(function (f) {
    const nm = (f.properties.name || '').trim();
    ringsOf(f.geometry).forEach(function (ring) {
      const [W, E, S, N] = cfg.window;
      const any = ring.some(function (p) {
        return p[0] >= W && p[0] <= E && p[1] >= S && p[1] <= N;
      });
      if (any) { out.lakes.push({ name: nm, ring: ring }); }
    });
  });

  riverFc.features.forEach(function (f) {
    const nm = (f.properties.name || '').trim();
    linesOf(f.geometry).forEach(function (line) {
      clip(line, cfg.window).forEach(function (run) {
        out.rivers.push({ name: nm, line: run });
      });
    });
  });

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, name + '.json');
  fs.writeFileSync(file, JSON.stringify(out));
  const kb = Math.round(fs.statSync(file).size / 1024);
  console.log(name + ' (' + r + '): ' + out.land.length + ' land rings, '
    + out.lakes.length + ' lakes, ' + out.rivers.length + ' rivers - ' + kb + ' KB');
}

(async function () {
  for (const name of Object.keys(WINDOWS)) { await build(name); }
})().catch(function (err) { console.error(err.message); process.exit(1); });
