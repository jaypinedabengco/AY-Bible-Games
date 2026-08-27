/*
 * Deck and puzzle defaults.
 *
 * Everything downstream assumes normalized shapes: every puzzle has a
 * variants array with at least one entry, and every key is present even
 * when empty. One code path, no undefined checks scattered about.
 */
(function (root) {
  'use strict';

  var VARIANT_KEYS = ['type', 'clues', 'img', 'prompt', 'options', 'items',
                      'correct', 'quote', 'verse', 'clue',
                      'lang', 'answer', 'flag', 'weight', 'difficulty'];

  function normalizeVariant(v, puzzleDifficulty) {
    return {
      type: v.type || 'rebus',
      clues: v.clues || null,
      img: v.img || null,
      prompt: v.prompt || null,
      options: v.options || null,
      items: v.items || null,
      correct: v.correct || null,
      quote: v.quote || null,
      verse: v.verse || null,
      clue: v.clue || null,
      // Language and answer sit on the VARIANT for the quote game: PEDRO and
      // PETER are the same person, so they are one puzzle. Both fall back to
      // the puzzle's own values, so every existing deck is unaffected.
      lang: v.lang || null,
      answer: v.answer || null,
      flag: v.flag || null,
      weight: v.weight === undefined ? 1 : v.weight,
      difficulty: v.difficulty || puzzleDifficulty || 2,
    };
  }

  function normalizePuzzle(p) {
    var variants = p.variants;
    if (!variants || !variants.length) {
      // A bare puzzle is a puzzle with exactly one variant: lift the
      // variant-shaped keys off it and wrap them.
      var lifted = {};
      VARIANT_KEYS.forEach(function (k) {
        if (p[k] !== undefined) { lifted[k] = p[k]; }
      });
      variants = [lifted];
    }
    var difficulty = p.difficulty || 2;
    return {
      id: p.id || null,
      answer: p.answer,
      lang: p.lang || 'en',
      ref: p.ref === undefined ? null : p.ref,
      slot: p.slot || 'anywhere',
      difficulty: difficulty,
      variants: variants.map(function (v) {
        return normalizeVariant(v, difficulty);
      }),
    };
  }

  function normalizeDeck(deck) {
    var d = deck || {};
    return {
      id: d.id || null,
      title: d.title || '',
      imageDirs: d.imageDirs || ['images/'],
      shuffle: d.shuffle !== false,
      sessionSize: d.sessionSize || null,
      languages: d.languages || ['en'],
      howToPlay: d.howToPlay || [],
      credits: d.credits || null,
      versions: d.versions || null,
      puzzles: (d.puzzles || []).map(normalizePuzzle),
    };
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.normalize = {
    normalizePuzzle: normalizePuzzle,
    normalizeDeck: normalizeDeck,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
