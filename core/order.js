/*
 * Building the running order.
 *
 * Three things happen here and they pull against each other:
 *
 *   sessionSize  draw a subset, so a night is not the whole deck
 *   difficulty   ramp upward, so the room is not fried in the first minute
 *   slot         pin a puzzle to a third of the running order
 *
 * slot wins. It is a hard constraint: a pinned puzzle is always drawn and
 * always lands in its zone. The difficulty ramp then fills whatever slots
 * are left, which makes it best-effort by construction - a pinned puzzle
 * can leave the ramp slightly uneven, and that is the right trade. A cameo
 * fired at the wrong moment is a wasted moment; a bumpy ramp is not.
 */
(function (root) {
  'use strict';

  function zoneRange(zone, size) {
    if (size <= 0) { return [0, 0]; }
    var third = Math.ceil(size / 3);
    // Anchor `late` to the END of the order rather than measuring two thirds
    // forward from the start. Measuring forward overshoots: at size 4,
    // 2 * ceil(4/3) is 4, so `late` became the empty range [4,4) and a pinned
    // puzzle threw at startup - a blank projector in front of a room, which is
    // the exact failure this project exists to avoid. Anchoring backwards
    // guarantees `late` always holds at least the final slot.
    var lateStart = Math.max(0, size - third);
    var earlyEnd = Math.min(third, lateStart);
    if (zone === 'early') { return [0, earlyEnd]; }
    if (zone === 'middle') { return [earlyEnd, lateStart]; }
    if (zone === 'late') { return [lateStart, size]; }
    return [0, size];
  }

  function shuffle(list, rng) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function byDifficulty(list, rng, doShuffle) {
    var out = [];
    [1, 2, 3].forEach(function (d) {
      var band = list.filter(function (x) { return x.difficulty === d; });
      out = out.concat(doShuffle ? shuffle(band, rng) : band);
    });
    return out;
  }

  function isPinned(p) { return p.slot && p.slot !== 'anywhere'; }

  function buildOrder(puzzles, opts) {
    var rng = opts.rng;
    var doShuffle = opts.shuffle !== false;
    var pinned = puzzles.filter(isPinned);
    var free = puzzles.filter(function (p) { return !isPinned(p); });
    var size = Math.min(opts.sessionSize || puzzles.length, puzzles.length);

    if (pinned.length > size) {
      throw new Error('more pinned puzzles (' + pinned.length +
                      ') than session slots (' + size + ')');
    }

    // Pinned puzzles are always drawn; the random draw fills what is left.
    var fill = (doShuffle ? shuffle(free, rng) : free.slice())
      .slice(0, size - pinned.length);
    var ramp = byDifficulty(fill, rng, doShuffle);

    var slots = new Array(size);
    for (var i = 0; i < size; i++) { slots[i] = null; }

    (doShuffle ? shuffle(pinned, rng) : pinned).forEach(function (p) {
      var range = zoneRange(p.slot, size);
      var open = [];
      for (var i = range[0]; i < range[1]; i++) {
        if (slots[i] === null) { open.push(i); }
      }
      if (!open.length) {
        throw new Error('zone "' + p.slot + '" over-subscribed at size ' + size);
      }
      slots[open[Math.floor(rng() * open.length)]] = p;
    });

    var k = 0;
    for (var j = 0; j < size; j++) {
      if (slots[j] === null) { slots[j] = ramp[k++]; }
    }
    return slots;
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.order = {
    zoneRange: zoneRange,
    shuffle: shuffle,
    byDifficulty: byDifficulty,
    buildOrder: buildOrder,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
