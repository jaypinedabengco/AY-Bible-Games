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

  var TYPES = ['rebus', 'image', 'text', 'binary', 'order'];
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
      if (!v.options || v.options.length !== 2) {
        errors.push(where + ': binary needs exactly 2 options');
      } else if (v.options.indexOf(p.answer) === -1) {
        errors.push(where + ': answer "' + p.answer + '" is not one of its options');
      }
    }
    if (v.type === 'order') {
      if (!v.items || !v.correct) {
        errors.push(where + ': order needs items and correct');
      } else if (String(sortedCopy(v.items)) !== String(sortedCopy(v.correct))) {
        errors.push(where + ': correct is not a permutation of items');
      }
    }
  }

  function validate(deck) {
    var BG = root.BibleGames;
    var normalized = BG.normalize.normalizeDeck(deck);
    var errors = [];
    var notices = [];
    var seen = {};

    var pool = normalized.puzzles.filter(function (p) {
      return normalized.languages.indexOf(p.lang) !== -1;
    });

    pool.forEach(function (p) {
      if (!p.answer) { errors.push('a puzzle is missing its answer'); return; }
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
