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

  function answered(puzzle, stage, revealAt, variant) {
    if (stage < revealAt) { return null; }
    // The VARIANT's answer wins where it has one, for the same reason the
    // badge reads the variant: in a bilingual deck the answer is a different
    // word in each language. It matters more here than it looks - the binary
    // renderer marks the correct option by comparing this string against the
    // options, which are also per-variant, so an answer taken off the puzzle
    // matches nothing and the reveal highlights NOTHING at all.
    return {
      answer: (variant && variant.answer) || puzzle.answer,
      ref: formatRef((variant && variant.ref) || puzzle.ref),
    };
  }

  function base(kind, puzzle, variant) {
    // `id` rides on every view because the projector prints it in a corner:
    // it is how the Game Master finds this puzzle's answer on their phone
    // without needing to know the running order at all (spec 16).
    //
    // The badge reads the VARIANT's language first. Language lives on the
    // variant in every bilingual game - PEDRO and PETER are one puzzle - so
    // taking it off the puzzle labelled a Tagalog round ENGLISH. That was
    // fixed once inside the quote renderer alone, and came straight back the
    // next time a bilingual game was built on a different one. It belongs
    // here, where no renderer can forget it.
    return {
      kind: kind,
      id: puzzle.id,
      badge: badgeFor((variant && variant.lang) || puzzle.lang),
    };
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

  // The first letter of each SPACE-SEPARATED word, every other LETTER an
  // underscore. A hyphen deliberately does NOT start a new word - BETH-SHAN
  // masks to B___-____, not B___-S___ - because the second half of a compound
  // name is usually the half that gives it away. The count is part of the hint,
  // so runs are not collapsed; spaces, apostrophes and hyphens stay as they
  // are. A letter is anything with a case, which is how to say so without a
  // Unicode-aware regex in code that has to run in ES5.
  function maskAnswer(answer) {
    if (!answer) { return null; }
    return String(answer).split(' ').map(function (word) {
      return word.split('').map(function (ch, i) {
        var letter = ch.toLowerCase() !== ch.toUpperCase();
        return (i === 0 || !letter) ? ch : '_';
      }).join('');
    }).join(' ');
  }

  // The masked beat, or null when there is no point in having one. UR masks to
  // U_ and AI to A_: half the name, handed over for free, on a beat that is
  // supposed to be a hint held back. Three letters or fewer and the beat is
  // skipped altogether - one beat FEWER, exactly as a place with no clue
  // written yet already produces, rather than a beat that does nothing.
  //
  // Counting LETTERS, not characters, so a name with a hyphen or an apostrophe
  // is judged on the part that gets hidden.
  var MIN_MASKABLE = 4;
  function maskBeat(puzzle, variant) {
    // The VARIANT's answer where it has one, as everywhere else: JERICO masks
    // as J_____ and not as JERICHO.
    var answer = (variant && variant.answer) || (puzzle && puzzle.answer);
    if (!answer) { return null; }
    var letters = 0;
    String(answer).split('').forEach(function (ch) {
      if (ch.toLowerCase() !== ch.toUpperCase()) { letters += 1; }
    });
    return letters >= MIN_MASKABLE ? maskAnswer(answer) : null;
  }

  var byType = {
    rebus: {
      stages: function () { return 2; },
      view: function (puzzle, variant, stage) {
        var v = base('rebus', puzzle, variant);
        var words = variant.clues.map(function (c) { return c.word; });
        v.clues = variant.clues.map(function (c) {
          return { img: c.img, word: stage >= 1 ? c.word : null };
        });
        v.working = stage >= 1 ? words.join(' + ') : null;
        v.answered = answered(puzzle, stage, 2, variant);
        return v;
      },
    },
    image: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('image', puzzle, variant);
        v.img = variant.img;
        v.answered = answered(puzzle, stage, 1, variant);
        return v;
      },
    },
    text: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('text', puzzle, variant);
        v.prompt = variant.prompt;
        v.answered = answered(puzzle, stage, 1, variant);
        return v;
      },
    },
    quote: {
      // Four screens by default - quote, verse, clue, answer - but a puzzle
      // that holds its verse back or has no clue written yet simply has fewer.
      // The machine asks the variant, so nothing here is special-cased there.
      stages: function (variant) { return revealStage(variant); },
      view: function (puzzle, variant, stage) {
        var v = base('quote', puzzle, variant);
        // Language lives on the VARIANT here, so the badge has to read it from
        // there - taking it off the puzzle labelled a Tagalog round ENGLISH.
        var lang = variant.lang || puzzle.lang || 'en';
        var clueAt = variant.verse ? 2 : 1;
        v.quote = variant.quote;
        // Whether to put quotation marks round it - see `spoken` in
        // normalize.js. A deed is our own sentence, not a quotation.
        v.spoken = variant.spoken !== false;
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
        var v = base('binary', puzzle, variant);
        v.prompt = variant.prompt;
        v.img = variant.img;
        v.options = variant.options;
        v.answered = answered(puzzle, stage, 1, variant);
        return v;
      },
    },
    // The object trail. Objects from one story, a step at a time, getting
    // easier - and a step is a ROW of pictures, because one object alone is
    // usually ambiguous. Honey is vague; a lion is Daniel or David; honey
    // beside a lion is exactly one story, and neither picture names him.
    //
    // Not a rebus, though it renders like one: a rebus picture is a PUN and
    // stands for a sound, whereas a trail picture is a THING from the story.
    // Honey means honey, which is why any clear picture of honey will do.
    trail: {
      stages: function (variant) { return (variant.items || []).length; },
      view: function (puzzle, variant, stage) {
        var v = base('trail', puzzle, variant);
        var steps = variant.items || [];
        var done = stage >= steps.length;

        // Every step up to and including this one, so the trail accumulates
        // on screen rather than replacing itself.
        v.steps = steps.slice(0, Math.min(stage + 1, steps.length)).map(function (s) {
          return {
            pictures: (s.pictures || []).map(function (pic) {
              return { word: pic.word || null, img: pic.img || null };
            }),
          };
        });

        // Where each object came from - held back until the answer. A
        // reference beside step one names the book, and the book is very
        // nearly the answer: a room that knows Judges knows who the strong
        // man is.
        v.sources = done
          ? steps.filter(function (s) { return s.verse; }).map(function (s) {
              return {
                verse: s.verse,
                words: (s.pictures || []).map(function (pic) { return pic.word; })
                  .filter(Boolean).join(' + '),
              };
            })
          : null;

        v.answered = answered(puzzle, stage, steps.length, variant);
        return v;
      },
    },
    // Three things on the screen; the room shouts which order they go in. Two
    // beats: the scramble, then the sequence with its dates.
    //
    // Chosen over a two-way "before or after" because a binary question is a
    // coin flip - half a hall shouts each way and somebody is always right by
    // luck, so there is never the moment where the room converges and KNOWS.
    // Three items have six orderings, which cannot be flukes.
    order: {
      stages: function () { return 1; },
      view: function (puzzle, variant, stage) {
        var v = base('order', puzzle, variant);
        var done = stage >= 1;
        // Without this the screen is three words and no task.
        v.prompt = variant.prompt || null;
        v.items = variant.items;
        // Numbering the SCRAMBLE would assert an order, and the order it
        // asserts is the wrong one. The numbers arrive with the answer.
        v.numbered = done;
        v.correct = done ? (variant.correct || []).map(orderRow) : null;
        // No answer block. The ordered list is the answer; puzzle.answer
        // exists only to give the game master page a row label, and printing
        // it underneath at projector size would say the same thing worse.
        v.answered = null;
        return v;
      },
    },
    // Name the Place. A pin drops on the map and the room shouts where it is.
    // Five beats at most - pin, verse, clue, the first letter with the rest
    // hidden, then the name - and the map is on screen for all of them,
    // because the pin IS the question and the room is still looking at it
    // when the answer lands.
    //
    // A place with no clue written yet has one beat FEWER, not one blank one:
    // the count comes from revealStage, exactly as the quote games do it. The
    // masked beat needs nothing from the deck - it is derived from the answer -
    // so it is there for every name long enough to be worth masking. See
    // maskBeat: UR would mask to U_, and that is not a beat.
    //
    // stages() takes the PUZZLE as well, because in a bilingual deck the
    // English variant carries no answer of its own and the length of the name
    // is what decides the count.
    map: {
      stages: function (variant, puzzle) {
        return revealStage(variant) + (maskBeat(puzzle, variant) ? 1 : 0);
      },
      view: function (puzzle, variant, stage) {
        var v = base('map', puzzle, variant);
        var mask = maskBeat(puzzle, variant);
        var maskAt = mask ? revealStage(variant) : -1;
        var reveal = revealStage(variant) + (mask ? 1 : 0);
        var clueAt = variant.verse ? 2 : 1;
        v.extent = variant.extent;
        v.at = variant.at;
        // The map names its own water in the language being played.
        v.lang = variant.lang || puzzle.lang || 'en';
        // Dropped at the reveal, as on the quote games: the answer block
        // prints it under the name, and twice on one screen reads as a mistake.
        v.verse = (variant.verse && stage >= 1 && stage < reveal) ? variant.verse : null;
        v.clue = (variant.clue && stage >= clueAt) ? variant.clue : null;
        // On its own beat only. Earlier it would give the answer's shape away
        // for free; at the reveal the answer itself has replaced it.
        v.masked = stage === maskAt ? mask : null;
        v.answered = answered(puzzle, stage, reveal, variant);
        if (v.answered) {
          // JERICHO / JERICO for free, and the verse moves down here.
          v.answered.alt = otherName(puzzle, variant);
          v.answered.ref = v.answered.ref || variant.verse || null;
        }
        return v;
      },
    },
  };

  // An ordered item is a label and, usually, a date. A plain string is still
  // accepted: it is an item with no date, not a crash.
  function orderRow(entry) {
    return typeof entry === 'string'
      ? { label: entry, when: null }
      : { label: entry.label, when: entry.when || null };
  }

  function stagesForItem(item) {
    // The puzzle goes too: a bilingual deck keeps the answer on the puzzle for
    // the language it was written in, and Name the Place's beat count depends
    // on how long that answer is. Every other type ignores the second argument.
    return byType[item.variant.type].stages(item.variant, item.puzzle);
  }

  function viewForItem(item, stage) {
    return byType[item.variant.type].view(item.puzzle, item.variant, stage);
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.views = {
    formatRef: formatRef,
    badgeFor: badgeFor,
    byType: byType,
    maskAnswer: maskAnswer,
    stagesForItem: stagesForItem,
    viewForItem: viewForItem,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
