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
    // A trail keeps its pictures inside its steps, not at the top of the
    // variant. Leaving them out here meant they were never resolved, so
    // uploaded pictures sat in the folder while the game went on showing
    // words - with nothing to say anything was wrong.
    if (variant.items) {
      var names = [];
      variant.items.forEach(function (step) {
        (step.pictures || []).forEach(function (pic) {
          if (pic.img) { names.push(pic.img); }
        });
      });
      return names;
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

  // What has already been asked, remembered between sessions.
  //
  // The in-memory set only ever lasted one evening, so reloading the page - or
  // running the game a fortnight later - started the whole deck again. A
  // programme that meets weekly wants the deck walked through over weeks, so
  // this is written to localStorage and read back on start. All three accessors
  // are wrapped: a private window throws on the first touch.
  // The key is shared with the game master page, which is where the record can
  // be CLEARED. Clearing throws away weeks of a programme's progress, so it
  // sits behind the sign-in rather than one click away on a projector in a room
  // full of people.
  function askedKey(deckId) { return 'asked:' + (deckId || 'deck'); }

  // Most decks here are CONSUMED by being played: Who Said It? holds 322
  // quotes and the room should work through them rather than hear the same
  // one twice, so what has been asked is remembered across evenings.
  //
  // An EVERGREEN deck is the opposite. Hot Potato's cards are performances -
  // "give two verses that have helped you" is a different answer every time
  // because it is a different person - so remembering them does not prevent a
  // repeat, it just empties the deck. After 162 cards the game would report
  // itself finished and stop, which is exactly wrong for a game whose whole
  // point is that it never runs out. Such a deck sets `remembers: false`.
  function remembers(deck) { return !deck || deck.remembers !== false; }

  function loadAsked(deckId) {
    try {
      var raw = localStorage.getItem(askedKey(deckId));
      var list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list : []);
    } catch (e) { return new Set(); }
  }

  function saveAsked(deckId, seen) {
    try {
      var list = [];
      seen.forEach(function (k) { list.push(k); });
      localStorage.setItem(askedKey(deckId), JSON.stringify(list));
    } catch (e) { /* private window: the record just does not persist */ }
  }

  function forgetAsked(deckId) {
    try { localStorage.removeItem(askedKey(deckId)); }
    catch (e) { /* nothing to do; the caller clears its own copy anyway */ }
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
        // A trail is the opposite case, and the distinction matters: it is
        // written in words and GROWS pictures, so a missing one is expected
        // rather than broken. Requiring them would make every unfinished trail
        // vanish from the deck.
        if (variant.type === 'trail') { return (variant.items || []).length > 0; }
        // A map with no extent or no pin is dormant for the same reason. This
        // one is not reachable from the generated deck - the extent is derived
        // and the coordinate is checked - but the deck manager can hand-author
        // a map puzzle, and the failure is ugly: paint.js throws AFTER
        // host.innerHTML has been cleared, and draw() has no try/catch, so the
        // room gets a black rectangle in the middle of a round.
        if (variant.type === 'map') { return !!(variant.extent && variant.at); }
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

  // Whether this screen is one that moves on its own, and for how long.
  // Pure, and deliberately OUTSIDE draw(): draw is a closure inside play()
  // that no test in this project can reach, and "only a view that asks gets
  // a clock" is the behaviour all seven existing games depend on. That is
  // worth one exported function to be able to assert by running it.
  function autoDelayMs(view, deck) {
    if (!view || !view.autoAdvance) { return null; }
    // core/sound.js is loaded by ONE page. Without it the game runs silently
    // and still advances - audio never blocks play.
    var snd = root.BibleGames && root.BibleGames.sound;
    return snd ? snd.delayMs(deck && deck.musicSeconds) : 12000;
  }

  // Playing one evening: the rounds, the painting, the keys. Split out of
  // start() because start() now has a job before this one - showing the start
  // screen and asking how long the round should be and in which language.
  function play(deck, host, resolver, rng, choice, toStart) {
    var deckId = (deck && deck.id) || 'deck';
    var seen = remembers(deck) ? loadAsked(deckId) : new Set();
    var round = 0;

    return buildSession(deck, resolver, rng, {
      seen: seen, sessionSize: choice.size, lang: choice.lang,
    }).then(function (session) {
    var items = session.items;
    round = 1;
    var machine = BG.machine.createMachine(items, BG.views.stagesForItem);

    // When the deck runs out, say so. Clamping silently at the last card
    // leaves the host pressing space at a screen that never changes,
    // wondering whether the game has frozen in front of everyone.
    var finished = false;
    var deckEmpty = false;

    // The only timer in this project. It belongs to whichever screen is up,
    // and dies with it: a timer that outlives its screen fires into a room
    // that has already moved on.
    var autoTimer = null;

    function clearAuto() {
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
      // Guarded because core/sound.js is loaded by ONE page. Every other game
      // would throw on its first draw if this reached for it unconditionally.
      if (BG.sound) { BG.sound.stop(); }
    }

    function drawDone(nextCount) {
      clearAuto();
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
        // No noun: three games about different things show this card, and it
        // said "books" in the one about people. The count is of puzzles that
        // could still be drawn - which includes a person who has another line
        // the room has not heard.
        n.textContent = nextCount + ' more still to come';
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

    // How much could still fill another round. It ASKS buildSession rather
    // than re-deriving the rules, because the copy that lived here drifted:
    // it only checked pictures, so every dormant Tagalog quote counted as
    // still to come and the card promised all 71 when 67 could be drawn.
    function remaining() {
      return buildSession(deck, resolver, rng, {
        seen: seen, sessionSize: 9999, lang: choice.lang,
      }).then(function (rest) { return rest.items.length; });
    }

    // One deal, with one retry for a deck that does not remember. Such a deck
    // is meant to be played forever, so running out WITHIN an evening is the
    // same false promise as running out between them: the in-memory `seen`
    // still fills up as cards are shown. When it empties the deck, forget it
    // and deal again rather than telling a room of 162 cards that there are
    // none left. A deck that DOES remember keeps its ending, which is the
    // point of remembering.
    function dealing(d) {
      return buildSession(d || deck, resolver, rng, {
        seen: seen, sessionSize: choice.size, lang: choice.lang,
      }).then(function (next) {
        if (next.items.length || remembers(deck)) { return next; }
        seen.clear();
        return buildSession(d || deck, resolver, rng, {
          seen: seen, sessionSize: choice.size, lang: choice.lang,
        });
      });
    }

    function nextRound() {
      // The choice made on the start screen holds for the evening, so every
      // round after the first is the length the host asked for - not the
      // deck's own default, which is what round 2 quietly reverted to.
      return dealing().then(function (next) {
        if (!next.items.length) { drawDone(0); return; }
        round++;
        items = next.items;
        session.srcFor = next.srcFor;
        machine = BG.machine.createMachine(items, BG.views.stagesForItem);
        finished = false;
        draw();
      });
    }

    function draw() {
      clearAuto();
      finished = false;
      var s = machine.state();

      // Marked when it REACHES THE SCREEN, not when the round is drawn. Drawing
      // marked all twenty at once, so starting a round of twenty and playing one
      // puzzle burned the other nineteen for good - which is exactly what it
      // looked like: a count jumping by a round instead of by one.
      var key = s.item.puzzle.id + '#' + s.item.puzzle.variants.indexOf(s.item.variant);
      if (!seen.has(key)) {
        seen.add(key);
        // Still tracked WITHIN the evening, so one round does not show the
        // same card twice - only not written down for the next one.
        if (remembers(deck)) { saveAsked(deckId, seen); }
      }

      var view = BG.views.viewForItem(s.item, s.stage);
      BG.paint.render(host, view, session.srcFor, {
        position: s.index + 1,
        total: items.length,
        round: round,
        stage: s.stage,
        stages: s.stages,
        showBadge: session.deck.languages.length > 1,
      });

      // The one screen that moves without a keypress. The view says only THAT
      // it wants a clock; the length is drawn here, where the deck is in
      // scope, and is re-rolled every single time this runs - including when
      // ArrowLeft brings the room back to it. A driver who backs up has
      // usually done so because the round went wrong, and replaying the same
      // interval would be worse than no interval at all.
      var wait = autoDelayMs(view, deck);
      if (wait !== null) {
        if (BG.sound) { BG.sound.play(); }
        autoTimer = setTimeout(function () {
          autoTimer = null;
          if (BG.sound) { BG.sound.stop(); }
          machine.advance();
          draw();
        }, wait);
      }
    }

    function rebuild(shuffle) {
      var d = Object.assign({}, deck, { shuffle: shuffle });
      // R draws a different set from whatever is still unasked. It does not
      // hand anything back, because only the puzzles actually SHOWN are
      // recorded - the ones this round had not reached were never marked.
      deckEmpty = false;
      return dealing(d).then(function (next) {
        // Nothing left to deal. Say so instead of building a round out of an
        // empty list - which crashed on the next keypress, and was reached by
        // pressing the very key the deck-empty card tells you to press.
        if (!next.items.length) { drawDone(0); return; }
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
     ['S', 'start screen'], ['?', 'this']].forEach(function (pair) {
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
    var back = document.createElement('div');
    back.className = 'back-link';

    // Back to THIS game's own start screen. "All games" was the only way out,
    // which meant leaving the game entirely just to change the round length or
    // the language - and then finding the card again on the front page.
    var toSetup = document.createElement('a');
    toSetup.href = '#';
    toSetup.textContent = '\u2190 start screen';
    toSetup.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      hideLegend();
      legend.remove();
      back.remove();
      toStart();
    });
    back.appendChild(toSetup);

    back.appendChild(document.createTextNode(' \u00b7 '));

    var toIndex = document.createElement('a');
    toIndex.href = '../../index.html';
    toIndex.textContent = 'all games';
    back.appendChild(toIndex);

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
        if (machine.state().atEnd) { remaining().then(drawDone); return; }
        machine.advance();
        draw();
      },
      back: function () { machine.back(); draw(); },
      restart: function () { machine.restart(); draw(); },
      reshuffle: function () { rebuild(true); },
      originalOrder: function () { rebuild(false); },
      fullscreen: function () { BG.controls.toggleFullscreen(document.body); },
      // Back to the start screen to change the round length or the language.
      // It starts the evening over rather than resuming: a round of a
      // different length, or in another language, is a different round.
      setup: function () {
        clearAuto();
        hideLegend();
        legend.remove();
        back.remove();
        toStart();
      },
    });

    draw();
    });
  }

  function start(deck, host) {
    var resolver = BG.images.makeResolver(
      (deck.imageDirs || ['images/']),
      BG.images.browserLoad
    );
    var rng = Math.random;
    var normalized = BG.normalize.normalizeDeck(deck);

    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) { n.className = cls; }
      if (text !== undefined && text !== null) { n.textContent = text; }
      return n;
    }

    function remembered(key, fallback) {
      try {
        var raw = localStorage.getItem(key + ':' + normalized.id);
        return raw === null ? fallback : raw;
      } catch (e) { return fallback; }   // private window
    }

    function remember(key, value) {
      try { localStorage.setItem(key + ':' + normalized.id, String(value)); }
      catch (e) { /* private window: the choice just does not persist */ }
    }

    // How many puzzles each language could actually field. Counted by building
    // a throwaway session per language rather than by inspecting the deck,
    // because "playable" means pictures resolved and quotes written - which is
    // exactly what buildSession already decides.
    function countByLang(seen) {
      var langs = normalized.languages.length > 1 ? normalized.languages : [null];
      return Promise.all(langs.map(function (l) {
        return Promise.all([
          buildSession(deck, resolver, rng, { lang: l, sessionSize: 9999, seen: seen })
            .then(function (s) { return s.items.length; }),
          buildSession(deck, resolver, rng, { lang: l, sessionSize: 9999 })
            .then(function (s) { return s.items.length; }),
        ]);
      })).then(function (pairs) {
        var left = {};
        var all = {};
        langs.forEach(function (l, i) {
          var k = l === null ? 'en' : l;
          left[k] = pairs[i][0];
          all[k] = pairs[i][1];
        });
        return { left: left, all: all };
      });
    }

    // The scripture permission notice for the language being played. It is a
    // requirement on the page rather than something the room reads, so it is
    // tiny, dim, and fixed to the bottom.
    var creditEl = null;
    function showCredit(lang) {
      var text = (normalized.credits || {})[lang || 'en'] || null;
      if (!text) { if (creditEl) { creditEl.remove(); creditEl = null; } return; }
      if (!creditEl) {
        creditEl = el('p', 'credit');
        document.body.appendChild(creditEl);
      }
      creditEl.textContent = text;
    }

    function drawStart(counts) {
      var byLang = counts.left;
      var everything = counts.all;
      // Read everything BEFORE clearing the screen. This function once threw
      // between the clear and the redraw, and the result was a black
      // rectangle in front of a room. Anything that throws up here now leaves
      // the previous screen standing, which is always the better failure.
      var langs = langOptions(normalized.languages, byLang);
      host.innerHTML = '';
      var card = el('div', 'startcard');
      card.appendChild(el('div', 'start-church', 'San Fernando Adventist Church'));
      card.appendChild(el('div', 'start-title', normalized.title || 'Bible game'));
      normalized.howToPlay.forEach(function (line) {
        card.appendChild(el('div', 'start-how', line));
      });

      var lang = langs.length
        ? remembered('round-lang', langs[0].value)
        : (normalized.languages.length > 1 ? normalized.languages[0] : null);
      if (langs.length && !langs.some(function (o) { return o.value === lang; })) {
        lang = langs[0].value;
      }
      showCredit(lang);

      var playable = byLang[lang || 'en'] || 0;
      var total = everything[lang || 'en'] || 0;
      var asked = total - playable;

      if (!playable) {
        // Two different nothings, and telling them apart matters: an empty deck
        // needs puzzles adding, whereas a deck that has all been asked needs
        // the record clearing - and saying "no puzzles yet" to someone holding
        // a full deck would send them looking for a fault that is not there.
        if (total) {
          card.appendChild(el('div', 'start-empty',
            'All ' + total + ' have been asked already. Clear the record from '
            + 'the Game Master page to ask them again.'));
        } else {
          card.appendChild(el('div', 'start-empty',
            'This deck has no puzzles yet. Add some with the deck manager.'));
        }
        host.appendChild(card);
        return null;
      }

      var langSel = null;
      if (langs.length) {
        var lrow = el('div', 'start-row');
        lrow.appendChild(el('label', 'start-label', 'Language'));
        langSel = document.createElement('select');
        langSel.className = 'start-pick';
        langs.forEach(function (o) {
          var node = document.createElement('option');
          node.value = o.value;
          node.textContent = o.label;
          if (o.value === lang) { node.selected = true; }
          langSel.appendChild(node);
        });
        // The host element advances the game on click, so a click meant for
        // the dropdown must stop there.
        langSel.addEventListener('click', function (e) { e.stopPropagation(); });
        langSel.addEventListener('change', function () {
          remember('round-lang', langSel.value);
          // A different language means a different count, so the size dropdown
          // is rebuilt rather than left showing a stale one.
          //
          // `counts`, not `byLang`: byLang is one FIELD of counts, and passing
          // it meant the redraw read counts.left off a plain map, got
          // undefined, and threw - after the screen had already been cleared.
          // Changing the language blanked the projector.
          chosen = drawStart(counts);
        });
        lrow.appendChild(langSel);
        card.appendChild(lrow);
      }

      // Which translation the room is about to hear. The notice at the foot of
      // the screen is the legal one - small and dim on purpose - so the person
      // starting the game should not have to squint at it to find out.
      var version = (normalized.versions || {})[lang || 'en'];
      if (version) {
        card.appendChild(el('div', 'start-version', version));
      }

      var opts = sizeOptions(playable);
      var wantSize = Number(remembered('round-size', normalized.sessionSize || playable));
      var srow = el('div', 'start-row');
      srow.appendChild(el('label', 'start-label', 'Puzzles this round'));
      var sizeSel = document.createElement('select');
      sizeSel.className = 'start-pick';
      opts.forEach(function (o) {
        var node = document.createElement('option');
        node.value = String(o.value);
        node.textContent = o.label;
        if (o.value === wantSize) { node.selected = true; }
        sizeSel.appendChild(node);
      });
      sizeSel.addEventListener('click', function (e) { e.stopPropagation(); });
      srow.appendChild(sizeSel);
      card.appendChild(srow);

      // A button, not the whole screen. The host element advances the game on
      // click, and inheriting that here meant a stray tap on a projector
      // started the round before anyone was ready.
      var go = document.createElement('button');
      go.type = 'button';
      go.className = 'start-button';
      go.textContent = 'Start';
      go.addEventListener('click', function (e) { e.stopPropagation(); begin(); });
      card.appendChild(go);
      card.appendChild(el('div', 'start-go', 'or press Space'));

      // Nothing to say about a deck that does not remember: none of its cards
      // is ever "not coming back".
      if (asked > 0 && remembers(deck)) {
        card.appendChild(el('div', 'start-asked',
          asked + ' of ' + total + ' already asked, and not coming back.'));
      }

      host.appendChild(card);

      // The same way back the game itself has. Outside the card, because the
      // card's click starts the round and a link inside it would start a game
      // on the way out.
      if (!document.querySelector('.back-link')) {
        var back = document.createElement('a');
        back.className = 'back-link';
        back.href = '../../index.html';
        back.textContent = '\u2190 all games';
        back.addEventListener('click', function (e) { e.stopPropagation(); });
        document.body.appendChild(back);
      }

      return function () {
        return {
          size: Number(sizeSel.value),
          lang: langSel ? langSel.value : (normalized.languages.length > 1 ? lang : null),
        };
      };
    }

    var chosen = null;
    // Set once the start screen is listening, so its button can reach the same
    // code the spacebar does.
    var begin = function () {};

    function toStart() {
      return countByLang(remembers(deck) ? loadAsked(normalized.id) : new Set()).then(function (counts) {
        chosen = drawStart(counts);
        if (!chosen) { return null; }   // nothing to play; the card says so
        return new Promise(function (resolve) {
          function start() {
            var choice = chosen();
            // play() puts up its own back link; drop this one so they do not
            // stack up every time S is pressed.
            var stale = document.querySelector('.back-link');
            if (stale) { stale.remove(); }
            remember('round-size', choice.size);
            if (choice.lang) { remember('round-lang', choice.lang); }
            showCredit(choice.lang);
            document.removeEventListener('keydown', onKey);
            begin = function () {};
            resolve(play(deck, host, resolver, rng, choice, toStart));
          }
          function onKey(e) {
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); start(); }
          }
          document.addEventListener('keydown', onKey);
          begin = start;
        });
      });
    }

    return toStart();
  }

  BG.boot = {
    buildSession: buildSession,
    autoDelayMs: autoDelayMs,
    sizeOptions: sizeOptions,
    langOptions: langOptions,
    start: start,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
