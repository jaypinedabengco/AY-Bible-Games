/*
 * Turning a puzzle into a description of what belongs on screen.
 *
 * Pure functions, no DOM. paint.js draws whatever these return, which is
 * what lets every renderer be unit-tested without a browser.
 *
 * Every view carries a `badge` naming the language being asked. That is not
 * decoration: a crown is KINGS in English and HARI in Filipino, so a room
 * shouting the right answer to the wrong question would be a bug we had
 * designed in.
 */
(function (root) {
  'use strict';

  var BOOKS_IN_BIBLE = 66;
  var BADGES = { en: 'English', fil: 'Filipino' };

  function formatRef(ref) {
    if (!ref) { return null; }
    if (typeof ref === 'string') { return ref; }
    var bits = [];
    if (ref.testament) { bits.push(ref.testament + ' Testament'); }
    if (ref.division) { bits.push(ref.division); }
    if (ref.position) {
      bits.push('book ' + ref.position + ' of ' + BOOKS_IN_BIBLE);
    }
    return bits.length ? bits.join(' · ') : null;
  }

  function badgeFor(lang) { return BADGES[lang] || BADGES.en; }

  function answered(puzzle, stage, revealAt) {
    if (stage < revealAt) { return null; }
    return {
      answer: puzzle.answer,
      ref: formatRef(puzzle.ref),
    };
  }

  function base(kind, puzzle) {
    // `id` rides on every view because the projector prints it in a corner:
    // it is how the Game Master finds this puzzle's answer on their phone
    // without needing to know the running order at all (spec 16).
    return { kind: kind, id: puzzle.id, badge: badgeFor(puzzle.lang) };
  }

  var byType = {
    rebus: {
      stages: function () { return 2; },
      view: function (puzzle, variant, stage) {
        var v = base('rebus', puzzle);
        var words = variant.clues.map(function (c) { return c.word; });
        v.clues = variant.clues.map(function (c) {
          return { img: c.img, word: stage >= 1 ? c.word : null };
        });
        v.working = stage >= 1 ? words.join(' + ') : null;
        v.answered = answered(puzzle, stage, 2);
        return v;
      },
    },
    image: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('image', puzzle);
        v.img = variant.img;
        v.answered = answered(puzzle, stage, 1);
        return v;
      },
    },
    text: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('text', puzzle);
        v.prompt = variant.prompt;
        v.answered = answered(puzzle, stage, 1);
        return v;
      },
    },
    binary: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('binary', puzzle);
        v.prompt = variant.prompt;
        v.img = variant.img;
        v.options = variant.options;
        v.answered = answered(puzzle, stage, 1);
        return v;
      },
    },
    order: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('order', puzzle);
        v.items = variant.items;
        v.correct = stage >= 1 ? variant.correct : null;
        v.answered = answered(puzzle, stage, 1);
        return v;
      },
    },
  };

  function stagesForItem(item) {
    return byType[item.variant.type].stages(item.variant);
  }

  function viewForItem(item, stage) {
    return byType[item.variant.type].view(item.puzzle, item.variant, stage);
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.views = {
    formatRef: formatRef,
    badgeFor: badgeFor,
    byType: byType,
    stagesForItem: stagesForItem,
    viewForItem: viewForItem,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
