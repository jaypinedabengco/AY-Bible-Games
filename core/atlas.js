/*
 * The map. One component, two extents, and it does not know what a puzzle is.
 *
 * It draws a map and projects coordinates onto it. That is the whole
 * interface, and it is what lets the pin game append a dot and - later - the
 * journey game append legs, without either of them touching this file.
 *
 * WHY SVG AND NOT CANVAS. Every size in this project is in vmin because nobody
 * knows the projector's resolution; SVG scales and canvas would need a redraw
 * loop. The map is styled by the same CSS custom properties as every game,
 * where canvas colours would live in JavaScript outside the stylesheet. And
 * hit-testing, if a click-the-place variant is ever wanted, is free.
 *
 * NO BORDERS, EVER. They differ by era, so any line would be wrong for most of
 * the Bible, and political lines on the modern Levant are not something a
 * church projector should assert. There is no code here that could draw one.
 */
(function (root) {
  var BG = root.BibleGames = root.BibleGames || {};
  var atlas = BG.atlas = BG.atlas || { extents: {} };
  var NS = 'http://www.w3.org/2000/svg';

  // The viewBox is always this wide; height follows from the window's shape, so
  // a map is never stretched. CSS decides how big it appears.
  var WIDTH = 1000;

  function squeeze(win) {
    // Equirectangular, with longitude squeezed by cos(midLat) so the shapes are
    // not stretched sideways. Exact enough at these scales and trivially
    // invertible.
    return Math.cos(((win[2] + win[3]) / 2) * Math.PI / 180);
  }

  // The one place an unknown extent name is turned into a useful error.
  // fits() returns null for a place off the map, and a caller that forwards
  // that straight into draw() or project() should be told what happened, not
  // handed "cannot read properties of undefined".
  function extent(name) {
    if (!Object.prototype.hasOwnProperty.call(atlas.extents, name)) {
      throw new Error('atlas: no extent named ' + JSON.stringify(name)
        + ' (known: ' + Object.keys(atlas.extents).join(', ') + ')');
    }
    return atlas.extents[name];
  }

  function height(name) {
    var win = extent(name).window;
    var lonSpan = (win[1] - win[0]) * squeeze(win);
    return Math.round(WIDTH * (win[3] - win[2]) / lonSpan);
  }

  // EVERY in-map size is a fraction of the viewBox HEIGHT. On a wide screen the
  // map is fitted by height (the box is short, not narrow), so the height is
  // what decides how many screen pixels one viewBox unit is: a size that is a
  // fixed number of units is a different size on screen on each map. The close
  // map is 1000x1249 (portrait, in a landscape box) and the wide one is
  // 1000x539, so a fixed 17-unit label came out about 5 px on the first and 12
  // on the second, on a projector - unreadable exactly where the map is most
  // zoomed. As a fraction of height, a label is the same share of the screen
  // on both, and 0.030 of a 700 px box is about 13 px.
  //
  // The pin lives in paint.js but takes its size from here, so that there is
  // one place a size is decided and they cannot drift apart.
  var FRACTION = {
    furniture: 0.030,     // water and region names
    peakLabel: 0.026,
    peakSmall: 0.016,     // half-width of a peak triangle
    peakTall: 0.022,      // ... and of one over 2000 m
    halo: 0.010,          // the page-coloured outline that keeps a label legible
    river: 0.0035,
    lake: 0.0025,
    locator: 0.003,
    pinDot: 0.030,
    pinHalo: 0.045,
    pinRing: 0.006,       // the page-coloured ring round the dot
  };

  function sizes(name) {
    var h = height(name);
    var out = {};
    Object.keys(FRACTION).forEach(function (k) {
      out[k] = Math.round(FRACTION[k] * h * 100) / 100;
    });
    return out;
  }

  function project(name, lon, lat) {
    var win = extent(name).window;
    return {
      x: (lon - win[0]) / (win[1] - win[0]) * WIDTH,
      y: (win[3] - lat) / (win[3] - win[2]) * height(name),
    };
  }

  function unproject(name, x, y) {
    var win = extent(name).window;
    return {
      lon: win[0] + (x / WIDTH) * (win[1] - win[0]),
      lat: win[3] - (y / height(name)) * (win[3] - win[2]),
    };
  }

  function area(name) {
    var w = atlas.extents[name].window;
    return (w[1] - w[0]) * (w[3] - w[2]);
  }

  // The ONLY place the tightest-map rule lives. The deck generator calls it to
  // assign each place its map and a test calls it to check the assignment;
  // nothing else needs to know the rule exists.
  //
  // A point exactly ON a boundary counts as inside. Otherwise a place at the
  // window's edge would fall through to the wide map, where it is a speck -
  // and which side of the line a float lands on is not a decision anybody
  // should be making.
  //
  // Anything that is not a finite number fits nowhere. Every comparison with
  // NaN is false, so testing for "outside" lets garbage fall through to "the
  // close map"; and a string like '35' would coerce and pass. A place with a
  // missing or garbled coordinate must come back null and fail loudly, not
  // quietly get a pin somewhere arbitrary.
  function fits(lon, lat) {
    if (typeof lon !== 'number' || typeof lat !== 'number') { return null; }
    var best = null;
    Object.keys(atlas.extents).forEach(function (name) {
      var w = atlas.extents[name].window;
      if (!(lon >= w[0] && lon <= w[1] && lat >= w[2] && lat <= w[3])) { return; }
      if (best === null || area(name) < area(best)) { best = name; }
    });
    return best;
  }

  function node(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function pathOf(name, pts, close) {
    var d = pts.map(function (p, i) {
      var q = project(name, p[0], p[1]);
      return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    }).join(' ');
    return close ? d + ' Z' : d;
  }

  function group(cls, children) {
    var g = node('g', { 'class': cls });
    children.forEach(function (c) { g.appendChild(c); });
    return g;
  }

  function draw(name, lang) {
    var e = extent(name);
    var h = height(name);
    var z = sizes(name);
    var svg = node('svg', {
      viewBox: '0 0 ' + WIDTH + ' ' + h,
      // Letterbox rather than stretch: a distorted coastline is a wrong map.
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
    });

    svg.appendChild(node('rect',
      { x: 0, y: 0, width: WIDTH, height: h, 'class': 'sea' }));
    // One path per ring: continents, islands, and whatever the window cut out
    // of them. The coastline is these rings' own boundary - there is no
    // separate coast layer, and so no way for the two to disagree.
    svg.appendChild(group('land', e.land.map(function (ring) {
      return node('path', { d: pathOf(name, ring, true) });
    })));
    var lakes = group('lakes', e.lakes.map(function (l) {
      return node('path', { d: pathOf(name, l, true) });
    }));
    lakes.setAttribute('stroke-width', z.lake);
    svg.appendChild(lakes);
    var rivers = group('rivers', e.rivers.map(function (r) {
      return node('path', { d: pathOf(name, r, false) });
    }));
    rivers.setAttribute('stroke-width', z.river);
    svg.appendChild(rivers);

    svg.appendChild(group('peaks', e.peaks.map(function (pk) {
      var q = project(name, pk.at[0], pk.at[1]);
      var s = pk.m > 2000 ? z.peakTall : z.peakSmall;
      var g = node('g', {});
      g.appendChild(node('path', { d: 'M' + (q.x - s).toFixed(1) + ' ' + q.y.toFixed(1)
        + ' L' + q.x.toFixed(1) + ' ' + (q.y - s).toFixed(1)
        + ' L' + (q.x + s).toFixed(1) + ' ' + q.y.toFixed(1) + ' Z' }));
      var t = node('text', {
        x: q.x, y: q.y + s + z.peakLabel * 0.3, 'text-anchor': 'middle',
        'font-size': z.peakLabel, 'stroke-width': z.halo,
      });
      t.textContent = (lang === 'fil' && pk.label_fil) ? pk.label_fil : pk.label;
      g.appendChild(t);
      return g;
    })));

    // The locator: where the close map sits, so the two read as one world at
    // two zooms rather than two unrelated pictures.
    if (e.locator && atlas.extents[e.locator]) {
      var w = atlas.extents[e.locator].window;
      var a = project(name, w[0], w[3]);
      var b = project(name, w[1], w[2]);
      svg.appendChild(node('rect', {
        x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y, 'class': 'locator',
        'stroke-width': z.locator,
        'stroke-dasharray': (z.locator * 4) + ' ' + (z.locator * 3),
      }));
    }

    svg.appendChild(group('furniture', e.furniture.map(function (f) {
      var q = project(name, f.at[0], f.at[1]);
      var t = node('text', {
        x: q.x, y: q.y, 'text-anchor': 'middle',
        'font-size': z.furniture, 'stroke-width': z.halo,
      });
      t.textContent = (lang === 'fil' && f.label_fil) ? f.label_fil : f.label;
      return t;
    })));

    // Empty on purpose. The caller fills it; the atlas never does.
    svg.appendChild(node('g', { 'class': 'pins' }));
    return svg;
  }

  atlas.project = project;
  atlas.unproject = unproject;
  atlas.height = height;
  atlas.sizes = sizes;
  atlas.fits = fits;
  atlas.draw = draw;
})(typeof globalThis !== 'undefined' ? globalThis : window);
