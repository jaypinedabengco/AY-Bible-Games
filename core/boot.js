/*
 * Putting a session together.
 *
 * buildSession holds all the rules and no DOM, so it can be tested. start()
 * is the thin browser wrapper: real image probing, machine, painter, keys.
 *
 * Every image is resolved up front. That is what makes variant eligibility
 * decidable (a variant is only eligible if its pictures exist) and makes
 * everything after it synchronous, so a reveal never waits on a decode.
 */
(function (root) {
  'use strict';

  var BG = root.BibleGames;

  function imageNames(variant) {
    if (variant.clues) {
      return variant.clues.map(function (c) { return c.img; });
    }
    return variant.img ? [variant.img] : [];
  }

  function buildSession(deck, resolve, rng) {
    var normalized = BG.normalize.normalizeDeck(deck);
    var pool = normalized.puzzles.filter(function (p) {
      return normalized.languages.indexOf(p.lang) !== -1;
    });

    var wanted = [];
    pool.forEach(function (p) {
      p.variants.forEach(function (v) {
        imageNames(v).forEach(function (n) {
          if (wanted.indexOf(n) === -1) { wanted.push(n); }
        });
      });
    });

    return Promise.all(wanted.map(resolve)).then(function (urls) {
      var resolved = {};
      wanted.forEach(function (name, i) { resolved[name] = urls[i]; });

      function srcFor(name) {
        return Object.prototype.hasOwnProperty.call(resolved, name)
          ? resolved[name] : null;
      }

      function available(variant) {
        var names = imageNames(variant);
        if (!names.length) { return true; }   // text and order need no picture
        return names.every(function (n) { return srcFor(n) !== null; });
      }

      var playable = [];
      pool.forEach(function (p) {
        var options = BG.variants.eligible(p, available);
        // If nothing resolved, keep the first variant anyway so the card
        // renders a loud placeholder. Dropping the puzzle would hide a
        // missing file, and this site is published - a silent gap online is
        // far harder to notice than a red question mark.
        var chosen = options.length ? BG.variants.pick(options, rng) : p.variants[0];
        playable.push({ puzzle: p, variant: chosen });
      });

      // buildOrder reads slot and difficulty off the objects it is given, but
      // slot belongs to the puzzle and difficulty to the variant - so hand it
      // a carrier exposing both, then map back to the pair.
      var carriers = playable.map(function (pair) {
        return {
          slot: pair.puzzle.slot,
          difficulty: pair.variant.difficulty,
          pair: pair,
        };
      });

      var ordered = BG.order.buildOrder(carriers, {
        rng: rng,
        shuffle: normalized.shuffle,
        sessionSize: normalized.sessionSize,
      });

      return {
        deck: normalized,
        items: ordered.map(function (c) { return c.pair; }),
        srcFor: srcFor,
      };
    });
  }

  function start(deck, host) {
    var resolver = BG.images.makeResolver(
      (deck.imageDirs || ['images/']),
      BG.images.browserLoad
    );
    var rng = Math.random;

    return buildSession(deck, resolver, rng).then(function (session) {
      var items = session.items;
      var machine = BG.machine.createMachine(items, BG.views.stagesForItem);

      function draw() {
        var s = machine.state();
        BG.paint.render(host, BG.views.viewForItem(s.item, s.stage), session.srcFor, {
          position: s.index + 1,
          total: items.length,
          showBadge: session.deck.languages.length > 1,
        });
      }

      function rebuild(shuffle) {
        var d = Object.assign({}, deck, { shuffle: shuffle });
        return buildSession(d, resolver, rng).then(function (next) {
          items = next.items;
          machine = BG.machine.createMachine(items, BG.views.stagesForItem);
          session.srcFor = next.srcFor;
          draw();
        });
      }

      // The keys are useless if nobody knows they exist, but a permanent
      // legend is clutter the ROOM reads rather than the host. So: show it at
      // the start, fade it out, and let "?" bring it back.
      var legend = document.createElement('div');
      legend.className = 'legend';
      [['Space', 'reveal'], ['\u2190', 'back'], ['R', 'shuffle'],
       ['O', 'deck order'], ['F', 'fullscreen'], ['Home', 'restart'],
       ['?', 'this']].forEach(function (pair) {
        var item = document.createElement('span');
        var k = document.createElement('kbd');
        k.textContent = pair[0];
        item.appendChild(k);
        item.appendChild(document.createTextNode(' ' + pair[1]));
        legend.appendChild(item);
      });
      document.body.appendChild(legend);

      var fadeTimer = null;
      function showLegend(ms) {
        legend.classList.remove('faded');
        if (fadeTimer) { clearTimeout(fadeTimer); }
        fadeTimer = setTimeout(function () { legend.classList.add('faded'); }, ms);
      }
      showLegend(7000);

      BG.controls.attach(host, {
        help: function () {
          if (legend.classList.contains('faded')) { showLegend(7000); }
          else { legend.classList.add('faded'); }
        },
        advance: function () { machine.advance(); draw(); },
        back: function () { machine.back(); draw(); },
        restart: function () { machine.restart(); draw(); },
        reshuffle: function () { rebuild(true); },
        originalOrder: function () { rebuild(false); },
        fullscreen: function () { BG.controls.toggleFullscreen(document.body); },
      });

      draw();
    });
  }

  BG.boot = { buildSession: buildSession, start: start };
})(typeof globalThis !== 'undefined' ? globalThis : window);
