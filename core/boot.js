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

  function variantKey(puzzle, index) { return puzzle.id + '#' + index; }

  // The dropdown on the start screen. Round numbers only, never more than the
  // deck can actually fill, and always an "all" option so a small deck is
  // playable end to end. A deck of 3 offers only "All (3)": offering 5 when
  // there are 3 would give a round of 3 anyway and look like a bug.
  var SIZE_STEPS = [5, 10, 15, 20, 25, 30];

  function sizeOptions(playable) {
    if (playable <= 0) { return []; }
    var out = [];
    SIZE_STEPS.forEach(function (n) {
      if (n < playable) { out.push({ value: n, label: String(n) }); }
    });
    out.push({ value: playable, label: 'All (' + playable + ')' });
    return out;
  }

  // Only offer a language there is something to play in. A deck whose Tagalog
  // quotes are all still waiting for their text offers English alone, rather
  // than a choice that leads to an empty round.
  var LANG_NAMES = { en: 'English', fil: 'Tagalog' };

  function langOptions(languages, playableByLang) {
    var live = (languages || []).filter(function (l) {
      return (playableByLang[l] || 0) > 0;
    });
    if (live.length < 2) { return []; }
    return live.map(function (l) {
      return { value: l, label: (LANG_NAMES[l] || l) + ' (' + playableByLang[l] + ')' };
    });
  }

  // Language is asked of the VARIANT, falling back to the puzzle's, which
  // falls back to English. That keeps the two picture games - whose puzzles
  // carry lang and whose variants do not - working exactly as before.
  function langOf(puzzle, variant) { return variant.lang || puzzle.lang || 'en'; }

  function buildSession(deck, resolve, rng, opts) {
    var seen = (opts && opts.seen) || null;
    var normalized = BG.normalize.normalizeDeck(deck);
    var want = (opts && opts.lang) || null;
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
        // A quote with no text yet is DORMANT, exactly as a variant whose
        // picture is missing is: it waits, and is never drawn. Without this it
        // gets picked and paints the word "null" on the projector - which it
        // did, in front of a test round.
        if (variant.type === 'quote' && !variant.quote) { return false; }
        var names = imageNames(variant);
        if (!names.length) { return true; }   // text and order need no picture
        return names.every(function (n) { return srcFor(n) !== null; });
      }

      var playable = [];
      pool.forEach(function (p) {
        // Language first: a puzzle with nothing in the chosen language is not
        // in this round at all. That is different from a puzzle whose pictures
        // are missing, which IS kept below so the gap is visible - a person
        // whose Tagalog line has not been written yet is not a fault to show,
        // it is simply not part of a Tagalog round.
        var inLang = p.variants.filter(function (v) {
          return !want || langOf(p, v) === want;
        });
        if (!inLang.length) { return; }

        var options = BG.variants.eligible(p, available).filter(function (v) {
          return inLang.indexOf(v) !== -1;
        });
        if (want && !options.length) { return; }

        // Rounds: prefer a variant this evening has not shown yet. Only
        // RESOLVABLE variants are considered, so a placeholder waiting for its
        // picture never drags its book into a later round just to be dropped.
        var chosen;
        if (seen) {
          var fresh = options.filter(function (v) {
            return !seen.has(variantKey(p, p.variants.indexOf(v)));
          });
          if (!fresh.length) { return; }          // nothing new to show
          chosen = BG.variants.pick(fresh, rng);
        } else {
          // If nothing resolved, keep the first variant anyway so the card
          // renders a loud placeholder. Dropping the puzzle would hide a
          // missing file, and this site is published - a silent gap online is
          // far harder to notice than a red question mark.
          chosen = options.length ? BG.variants.pick(options, rng) : inLang[0];
        }
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

      if (!carriers.length) {
        return { deck: normalized, items: [], keys: [], srcFor: srcFor };
      }

      var ordered = BG.order.buildOrder(carriers, {
        rng: rng,
        shuffle: normalized.shuffle,
        // The start screen's choice wins over the deck's own default.
        sessionSize: (opts && opts.sessionSize) || normalized.sessionSize,
      });

      var items = ordered.map(function (c) { return c.pair; });
      return {
        deck: normalized,
        items: items,
        // What this round used, so the caller can exclude it from the next one.
        keys: items.map(function (pair) {
          return variantKey(pair.puzzle, pair.puzzle.variants.indexOf(pair.variant));
        }),
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

    // An evening is a series of rounds. Each one draws only books the earlier
    // rounds did not show, so the deck is walked through without a repeat, and
    // the host is told where they are rather than left guessing.
    var seen = new Set();
    var round = 0;

    return buildSession(deck, resolver, rng, { seen: seen }).then(function (session) {
      var items = session.items;
      round = 1;
      session.keys.forEach(function (k) { seen.add(k); });
      var machine = BG.machine.createMachine(items, BG.views.stagesForItem);

      // When the deck runs out, say so. Clamping silently at the last card
      // leaves the host pressing space at a screen that never changes,
      // wondering whether the game has frozen in front of everyone.
      var finished = false;
      var deckEmpty = false;

      function drawDone(nextCount) {
        finished = true;
        host.innerHTML = '';
        var box = document.createElement('div');
        box.className = 'done';
        var h = document.createElement('div');
        h.className = 'done-title';
        var n = document.createElement('div');
        n.className = 'done-count';
        var hint = document.createElement('div');
        hint.className = 'done-hint';

        if (nextCount > 0) {
          h.textContent = 'Round ' + round + ' done';
          n.textContent = nextCount + ' book' + (nextCount === 1 ? '' : 's')
            + ' still to come';
          hint.textContent = 'Space for round ' + (round + 1);
        } else {
          deckEmpty = true;
          h.textContent = 'All ' + seen.size + ' played';
          n.textContent = 'the whole deck, no repeats';
          hint.textContent = 'R for a fresh set  \u00b7  Home to replay this round';
        }
        box.appendChild(h); box.appendChild(n); box.appendChild(hint);
        host.appendChild(box);
      }

      // How many books could still fill another round.
      function remaining() {
        var count = 0;
        session.deck.puzzles.forEach(function (p) {
          var anyFresh = p.variants.some(function (v, i) {
            var names = v.clues ? v.clues.map(function (c) { return c.img; })
                                : (v.img ? [v.img] : []);
            var resolvable = !names.length
              || names.every(function (nm) { return session.srcFor(nm) !== null; });
            return resolvable && !seen.has(p.id + '#' + i);
          });
          if (anyFresh) { count++; }
        });
        return count;
      }

      function nextRound() {
        return buildSession(deck, resolver, rng, { seen: seen }).then(function (next) {
          if (!next.items.length) { drawDone(0); return; }
          round++;
          next.keys.forEach(function (k) { seen.add(k); });
          items = next.items;
          session.srcFor = next.srcFor;
          machine = BG.machine.createMachine(items, BG.views.stagesForItem);
          finished = false;
          draw();
        });
      }

      function draw() {
        finished = false;
        var s = machine.state();
        BG.paint.render(host, BG.views.viewForItem(s.item, s.stage), session.srcFor, {
          position: s.index + 1,
          total: items.length,
          round: round,
          showBadge: session.deck.languages.length > 1,
        });
      }

      function rebuild(shuffle) {
        var d = Object.assign({}, deck, { shuffle: shuffle });
        // A reshuffle starts the evening over: everything is unseen again.
        seen.clear();
        round = 1;
        deckEmpty = false;
        return buildSession(d, resolver, rng, { seen: seen }).then(function (next) {
          next.keys.forEach(function (k) { seen.add(k); });
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

      // A way back to the front page. Sits OUTSIDE the host element on purpose:
      // the host's click handler advances the puzzle, and a link inside it
      // would reveal the answer on the way out. Dim like the id stamp, because
      // the room should not be reading it.
      var back = document.createElement('a');
      back.className = 'back-link';
      back.href = '../../index.html';
      back.textContent = '\u2190 all games';
      document.body.appendChild(back);

      // It stays until the game actually starts. A timer was wrong: the host
      // is still plugging in the projector while it counts down, looks up, and
      // the legend has already gone. Fading on the first reveal means they get
      // it for exactly as long as they need it.
      var fadeTimer = null;
      function showLegend(ms) {
        legend.classList.remove('faded');
        if (fadeTimer) { clearTimeout(fadeTimer); }
        if (ms) {
          fadeTimer = setTimeout(function () { legend.classList.add('faded'); }, ms);
        }
      }
      function hideLegend() {
        if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
        legend.classList.add('faded');
      }
      showLegend(0);

      BG.controls.attach(host, {
        help: function () {
          if (legend.classList.contains('faded')) { showLegend(0); }
          else { hideLegend(); }
        },
        advance: function () {
          hideLegend();
          if (finished) {
            // On the round-done card, space starts the next round. On the
            // deck-empty card it does nothing - R is the way out, which the
            // card says.
            if (!deckEmpty) { nextRound(); }
            return;
          }
          if (machine.state().atEnd) { drawDone(remaining()); return; }
          machine.advance();
          draw();
        },
        back: function () { machine.back(); draw(); },
        restart: function () { machine.restart(); draw(); },
        reshuffle: function () { rebuild(true); },
        originalOrder: function () { rebuild(false); },
        fullscreen: function () { BG.controls.toggleFullscreen(document.body); },
      });

      draw();
    });
  }

  BG.boot = {
    buildSession: buildSession,
    sizeOptions: sizeOptions,
    langOptions: langOptions,
    start: start,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
