/*
 * Variant eligibility and selection.
 *
 * A puzzle can carry several pictures for one answer, and one is drawn per
 * session - which is what stops a deck feeling identical week to week.
 *
 * A variant is only eligible if every picture it names actually resolved, so
 * a puzzle with a working alternative uses it instead of showing a
 * placeholder. Deciding what to do when NOTHING resolves is boot.js's job,
 * not this module's: see Task 10.
 */
(function (root) {
  'use strict';

  function eligible(puzzle, isAvailable) {
    return puzzle.variants.filter(function (v) { return isAvailable(v); });
  }

  function pick(variants, rng) {
    if (!variants.length) { return null; }
    var total = variants.reduce(function (sum, v) { return sum + v.weight; }, 0);
    var r = rng() * total;
    for (var i = 0; i < variants.length; i++) {
      r -= variants[i].weight;
      if (r < 0) { return variants[i]; }
    }
    return variants[variants.length - 1];  // floating-point backstop
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.variants = { eligible: eligible, pick: pick };
})(typeof globalThis !== 'undefined' ? globalThis : window);
