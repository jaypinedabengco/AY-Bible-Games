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
  // "Tagalog", not "Filipino": it is what the start screen's picker says and
  // what the room calls it.
  var BADGES = { en: 'English', fil: 'Tagalog' };

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

  // The same person's name in the OTHER language, when it differs. A bilingual
  // room half-knows one form and half the other, so showing both at the reveal
  // saves anyone wondering whether they were right. Derived from the sibling
  // variants rather than stored twice.
  function otherName(puzzle, variant) {
    var shown = variant.answer || puzzle.answer;
    var lang = variant.lang || puzzle.lang || 'en';
    var names = [];
    (puzzle.variants || []).forEach(function (other) {
      var otherLang = other.lang || puzzle.lang || 'en';
      if (otherLang === lang) { return; }
      var name = other.answer || puzzle.answer;
      if (name && name !== shown && names.indexOf(name) === -1) { names.push(name); }
    });
    if (!names.length) { return null; }
    // The pairing is the PERSON's two names, so the puzzle's own answer wins
    // over a name set on one quote. Otherwise the Damascus-road quote, whose
    // answer was SAUL, made a Tagalog reveal read "PABLO / SAUL" - as though
    // Saul were the English for Pablo, and colliding with Saul the king.
    if (names.indexOf(puzzle.answer) !== -1) { return puzzle.answer; }
    return names[0];
  }

  function revealStage(variant) {
    return 1 + (variant.verse ? 1 : 0) + (variant.clue ? 1 : 0);
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
    quote: {
      // Four screens by default - quote, verse, clue, answer - but a puzzle
      // that holds its verse back or has no clue written yet simply has fewer.
      // The machine asks the variant, so nothing here is special-cased there.
      stages: function (variant) { return revealStage(variant); },
      view: function (puzzle, variant, stage) {
        var v = base('quote', puzzle);
        // Language lives on the VARIANT here, so the badge has to read it from
        // there - taking it off the puzzle labelled a Tagalog round ENGLISH.
        var lang = variant.lang || puzzle.lang || 'en';
        v.badge = badgeFor(lang);
        var clueAt = variant.verse ? 2 : 1;
        v.quote = variant.quote;
        // Dropped again at the reveal: the answer block prints the verse
        // under the name, and showing it twice on one screen reads as a
        // mistake from the back of a hall.
        v.verse = (variant.verse && stage >= 1 && stage < revealStage(variant))
          ? variant.verse : null;
        v.clue = (variant.clue && stage >= clueAt) ? variant.clue : null;
        // The verse belongs to the QUOTE, not to the person: Peter's two lines
        // are in different chapters. And the answer can differ by language -
        // PEDRO, not PETER - so the variant's wins when it has one.
        v.answered = stage >= revealStage(variant)
          ? {
              answer: variant.answer || puzzle.answer,
              alt: otherName(puzzle, variant),
              ref: variant.verse || null,
            }
          : null;
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
