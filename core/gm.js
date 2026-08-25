/*
 * The Game Master view's data and its gate.
 *
 * The room watches the projector; whoever runs the game needs the answers on
 * their own phone. Every puzzle carries a stable id which the projector prints
 * in a corner, so the GM looks up one row and never needs to know the running
 * order. Reshuffling costs nothing and they can join halfway through.
 */
(function (root) {
  'use strict';

  var BG = root.BibleGames;

  // FNV-1a, 32-bit. NOT cryptographic and not pretending to be: knowing the
  // code is the whole gate, and the threat model is a curious teenager with a
  // phone. The hash exists so the code is not sitting in plain text in a public
  // repository, which would defeat the one purpose it has.
  function hashCode(text) {
    var s = String(text == null ? '' : text).trim().toLowerCase();
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function clean(v) { return String(v == null ? '' : v).trim(); }

  // The two fields are hashed TOGETHER, so the stored number reveals nothing
  // about either one on its own and the fields cannot be swapped.
  function credentials(user, pass) {
    return hashCode(clean(user) + '\u0000' + clean(pass));
  }

  function matchesLogin(user, pass, hash) {
    // A blank field must never open the answers, even if someone stores the
    // hash of two blanks - otherwise a bare Enter is the password.
    if (!clean(user) || !clean(pass)) { return false; }
    return credentials(user, pass) === hash;
  }

  function workingOf(variant) {
    if (!variant.clues) { return null; }
    return variant.clues.map(function (c) { return c.word; }).join(' + ');
  }

  function rows(deck) {
    var normalized = BG.normalize.normalizeDeck(deck);
    return normalized.puzzles.map(function (p) {
      var flags = [];
      p.variants.forEach(function (v) {
        if (v.flag && flags.indexOf(v.flag) === -1) { flags.push(v.flag); }
      });
      // The projector draws ONE variant and the GM cannot know which, so carry
      // every working a puzzle might ask.
      var workings = p.variants.map(workingOf).filter(Boolean);
      return {
        id: p.id,
        answer: p.answer,
        ref: BG.views.formatRef(p.ref),
        working: workings.length ? workings[0] : null,
        workings: workings,
        pictures: p.variants.map(function (v) {
          return v.clues ? v.clues.map(function (c) { return c.img; }) : (v.img ? [v.img] : []);
        }),
        flags: flags,
      };
    }).sort(function (a, b) {
      return String(a.id) < String(b.id) ? -1 : (String(a.id) > String(b.id) ? 1 : 0);
    });
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.gm = {
    hashCode: hashCode,
    credentials: credentials,
    matchesLogin: matchesLogin,
    rows: rows,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
