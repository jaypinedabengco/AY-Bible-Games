/*
 * Deck validator.
 *
 *   node tools/validate.js games/book-names/deck.js
 *
 * Errors fail the deck. Notices print and pass: a pun flagged risky is a
 * decision rather than a defect, but it should be in front of you on every
 * run, because nobody has playtested these yet.
 */
(function (root) {
  'use strict';

  var TYPES = ['rebus', 'image', 'text', 'binary', 'order', 'quote', 'trail', 'map'];
  var LANGS = ['en', 'fil'];
  var SLOTS = ['early', 'middle', 'late', 'anywhere'];

  function sortedCopy(list) { return list.slice().sort(); }

  function checkVariant(p, v, i, errors) {
    var where = '"' + p.answer + '" variant ' + (i + 1);
    if (TYPES.indexOf(v.type) === -1) {
      errors.push(where + ': unknown type "' + v.type + '"');
      return;
    }
    if ([1, 2, 3].indexOf(v.difficulty) === -1) {
      errors.push(where + ': difficulty must be 1, 2 or 3 (got ' + v.difficulty + ')');
    }
    // A weight of 0 would make pick() degenerate silently: total is 0, the
    // cumulative subtraction never goes negative, and the floating-point
    // backstop returns the last variant every time regardless of the draw.
    // Catch it here, where deck-authoring mistakes belong, rather than
    // guarding the hot path.
    if (typeof v.weight !== 'number' || !(v.weight > 0)) {
      errors.push(where + ': weight must be a positive number (got ' + v.weight + ')');
    }
    if (v.type === 'rebus') {
      if (!v.clues || !v.clues.length) {
        errors.push(where + ': rebus needs a non-empty clues array');
      } else {
        v.clues.forEach(function (c, j) {
          if (!c.img) { errors.push(where + ' clue ' + (j + 1) + ': missing img'); }
          if (!c.word) { errors.push(where + ' clue ' + (j + 1) + ': missing word'); }
        });
      }
    }
    if (v.type === 'image' && !v.img) {
      errors.push(where + ': image needs img');
    }
    if (v.type === 'text' && !v.prompt) {
      errors.push(where + ': text needs prompt');
    }
    if (v.type === 'binary') {
      if (!v.prompt && !v.img) { errors.push(where + ': binary needs prompt or img'); }
      // Two options for a bet, three for a guess. The renderer always drew any
      // number of them - this check was the only thing insisting on two, and
      // it was written before anything used the type at all.
      if (!v.options || v.options.length < 2) {
        errors.push(where + ': binary needs at least 2 options');
      } else {
        // The VARIANT's answer where it has one. The options are per-variant
        // too - LONGER/SHORTER against MAS MAHABA/MAS MAIKLI - so checking a
        // puzzle-level answer against them fails on every bilingual deck.
        var ans = v.answer || p.answer;
        if (v.options.indexOf(ans) === -1) {
          errors.push(where + ': answer "' + ans + '" is not one of its options');
        }
        var dupes = v.options.filter(function (o, i) {
          return v.options.indexOf(o) !== i;
        });
        if (dupes.length) {
          errors.push(where + ': the same option twice (' + dupes[0] + ')');
        }
      }
    }
    if (v.type === 'quote') {
      // A quote with no text is DORMANT, not broken - it is a scaffold waiting
      // for a line to be pasted in, the same way a variant whose picture is
      // missing waits for its file. It is only an error when there is nothing
      // to identify it by either.
      if (!v.quote && !v.verse) {
        errors.push(where + ': a quote variant needs its text, or at least a '
          + 'verse if it is a scaffold waiting for one');
      }
    }

    if (v.type === 'trail') {
      var steps = v.items || [];
      if (steps.length < 2) {
        errors.push(where + ': a trail needs at least two steps');
      }
      steps.forEach(function (step, si) {
        var pics = (step.pictures || []);
        if (!pics.length) {
          errors.push(where + ' step ' + (si + 1) + ': no objects');
        }
        if (pics.length > 3) {
          errors.push(where + ' step ' + (si + 1) + ': more than three objects in one step');
        }
        pics.forEach(function (pic) {
          // A picture is OPTIONAL - the trail is written in words first and
          // plays that way. A word is not: without it the step is blank.
          if (!pic.word) {
            errors.push(where + ' step ' + (si + 1) + ': an object with no word');
          }
        });
      });
    }

    if (v.type === 'map') {
      var atlas = root.BibleGames && root.BibleGames.atlas;
      if (!v.extent) {
        errors.push(where + ': map needs an extent');
      } else if (atlas && atlas.extents && !atlas.extents[v.extent]) {
        // Only checkable where the atlas is loaded (the CLI loads it). The name
        // is looked up rather than listed here so the two cannot drift.
        errors.push(where + ': unknown map extent "' + v.extent + '"');
      }
      if (!v.at || v.at.length !== 2) {
        errors.push(where + ': map needs at [lon, lat]');
      } else if (typeof v.at[0] !== 'number' || typeof v.at[1] !== 'number'
          || !isFinite(v.at[0]) || !isFinite(v.at[1])) {
        errors.push(where + ': map at must be two finite numbers (got ' +
          JSON.stringify(v.at) + ')');
      }
    }

    if (v.type === 'order') {
      if (!v.items || !v.correct) {
        errors.push(where + ': order needs items and correct');
      } else {
        // An entry is a label with a date, or a bare label. Compare on the
        // label: an item missing from the answer, or an answer inventing one,
        // is a puzzle that cannot be got right.
        var labels = v.correct.map(function (c) {
          return typeof c === 'string' ? c : c.label;
        });
        if (String(sortedCopy(v.items)) !== String(sortedCopy(labels))) {
          errors.push(where + ': correct is not a permutation of items');
        }
        // Showing the answer and asking for it gives the game away.
        if (String(v.items) === String(labels)) {
          errors.push(where + ': the scramble IS the answer');
        }
        // Two rows printing the same date, with numbers beside them claiming
        // an order, read from the back of a hall as a mistake.
        var shown = v.correct.map(function (c) {
          return typeof c === 'string' ? null : c.when;
        }).filter(Boolean);
        if (shown.length && sortedCopy(shown).some(function (w, i, a) {
          return i > 0 && a[i - 1] === w;
        })) {
          errors.push(where + ': two items show the same date');
        }
      }
    }
  }

  function validate(deck) {
    var BG = root.BibleGames;
    var normalized = BG.normalize.normalizeDeck(deck);
    var errors = [];
    var notices = [];
    var seen = {};

    // Structural checks run over EVERY puzzle; playability checks run over the
    // ones this session would actually play.
    //
    // The distinction matters. A typo'd lang like 'es' silently drops a puzzle
    // out of the pool, so validating only the pool would hide exactly the
    // mistake most worth catching: the author sees a deck that passes and a
    // puzzle that never appears. A deliberate 'fil' puzzle in an English-only
    // deck is a different thing - uncounted, not unchecked.
    var pool = normalized.puzzles.filter(function (p) {
      return normalized.languages.indexOf(p.lang) !== -1;
    });

    var seenIds = {};

    normalized.puzzles.forEach(function (p) {
      if (!p.answer) { errors.push('a puzzle is missing its answer'); return; }
      if (!p.id) {
        errors.push('"' + p.answer + '": missing id');
      } else {
        if (seenIds[p.id]) { errors.push('duplicate id "' + p.id + '"'); }
        seenIds[p.id] = true;
        // The id is displayed on a projector in front of the room, so an id
        // that contains its own answer hands the answer over. See spec 16.
        if (p.id.toLowerCase().indexOf(String(p.answer).toLowerCase()) !== -1) {
          errors.push('id "' + p.id + '" contains its own answer "' + p.answer +
                      '" and would leak it on screen');
        }
      }
      if (LANGS.indexOf(p.lang) === -1) {
        errors.push('"' + p.answer + '": unknown lang "' + p.lang + '"');
      }
      if (SLOTS.indexOf(p.slot) === -1) {
        errors.push('"' + p.answer + '": unknown slot "' + p.slot + '"');
      }
      if ([1, 2, 3].indexOf(p.difficulty) === -1) {
        errors.push('"' + p.answer + '": difficulty must be 1, 2 or 3');
      }
      var key = p.lang + '::' + p.answer;
      if (seen[key]) {
        errors.push('duplicate answer "' + p.answer + '" in ' + p.lang);
      }
      seen[key] = true;

      p.variants.forEach(function (v, i) { checkVariant(p, v, i, errors); });

      p.variants.forEach(function (v) {
        if (v.flag === 'risky') {
          notices.push('"' + p.answer + '" is flagged risky - playtest before a service');
        }
      });
    });

    // Drafted scripture is not checked scripture, and a half-translated deck
    // is a normal state to be in. Both are notices rather than errors: nobody
    // should have to remember how far through either job they are, and neither
    // stops the deck playing.
    var quotes = 0;
    var unverified = 0;
    var waiting = 0;
    pool.forEach(function (p) {
      p.variants.forEach(function (v) {
        if (v.type !== 'quote') { return; }
        quotes++;
        if (v.flag === 'unverified') { unverified++; }
        if (!v.quote) { waiting++; }
      });
    });
    // What "unverified" means depends on where the words came from. In Who
    // Said It? the line IS scripture, so the whole sentence has to be checked.
    // In Who Did It? the sentence is ours and only the reference is a claim
    // about the Bible - a far smaller job, and saying so stops it looking
    // like the same mountain of work.
    if (unverified) {
      notices.push(unverified + ' of ' + quotes + ' ' + (deck.quoteNoun || 'quotes')
        + ' still unverified - '
        + (deck.verifyJob || 'check the wording against the Bible before a service'));
    }
    if (waiting) {
      notices.push(waiting + ' quotes waiting for their text - dormant until '
        + 'the line is pasted in, so they are never drawn');
    }

    // From here down the session is what matters, so these use the pool.
    var playable = pool.length;
    var size = normalized.sessionSize || playable;
    if (normalized.sessionSize && normalized.sessionSize > playable) {
      errors.push('sessionSize ' + normalized.sessionSize +
                  ' exceeds ' + playable + ' playable puzzles');
    }

    SLOTS.forEach(function (zone) {
      if (zone === 'anywhere') { return; }
      var pinned = pool.filter(function (p) { return p.slot === zone; }).length;
      if (!pinned) { return; }
      var range = BG.order.zoneRange(zone, Math.min(size, playable));
      var room = range[1] - range[0];
      if (pinned > room) {
        errors.push('zone "' + zone + '" over-subscribed: ' + pinned +
                    ' puzzles for ' + room + ' slots at session size ' + size);
      }
    });

    return { errors: errors, notices: notices, playable: playable };
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.validate = { validate: validate };
})(typeof globalThis !== 'undefined' ? globalThis : window);

// --- CLI -------------------------------------------------------------------
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  (function () {
    'use strict';
    var path = require('path');
    var fs = require('fs');
    var target = process.argv[2];
    if (!target) {
      console.error('usage: node tools/validate.js <deck.js> [--files <imageDir>]');
      process.exit(2);
    }
    require(path.resolve(__dirname, '../core/normalize.js'));
    require(path.resolve(__dirname, '../core/order.js'));
    globalThis.window = globalThis;          // deck.js assigns window.DECK
    // Loaded so a map's extent can be checked against the names the atlas
    // actually has. Drawing needs a document; nothing here draws.
    ['atlas-holyland', 'atlas-bibleworld', 'atlas'].forEach(function (f) {
      require(path.resolve(__dirname, '../core/' + f + '.js'));
    });
    require(path.resolve(process.cwd(), target));

    var result = globalThis.BibleGames.validate.validate(globalThis.DECK);
    console.log('playable puzzles: ' + result.playable);
    result.notices.forEach(function (n) { console.log('notice: ' + n); });

    var filesFlag = process.argv.indexOf('--files');
    if (filesFlag !== -1 && process.argv[filesFlag + 1]) {
      var dir = process.argv[filesFlag + 1];
      var missing = [];
      globalThis.DECK.puzzles.forEach(function (p) {
        (p.variants || [p]).forEach(function (v) {
          var names = v.clues ? v.clues.map(function (c) { return c.img; })
                              : (v.img ? [v.img] : []);
          names.forEach(function (n) {
            if (!/^(https?:|data:)/i.test(n) && !fs.existsSync(path.join(dir, n))) {
              missing.push(n);
            }
          });
        });
      });
      if (missing.length) {
        console.log('images not yet in ' + dir + ': ' + missing.join(', '));
      }
    }

    if (result.errors.length) {
      result.errors.forEach(function (e) { console.error('error: ' + e); });
      process.exit(1);
    }
    console.log('deck OK');
  })();
}
