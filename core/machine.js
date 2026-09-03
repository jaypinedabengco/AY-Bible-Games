/*
 * Where we are in the deck: which puzzle, and how much of it is revealed.
 *
 * advance/back move by stage and cross into the neighbouring puzzle at the
 * ends. next/prev skip a whole puzzle. Both ends clamp rather than wrap -
 * a deck that silently loops back to the start mid-service is worse than
 * one that simply stops.
 */
(function (root) {
  'use strict';

  function createMachine(items, stagesFor) {
    var index = 0;
    var stage = 0;

    function lastStage() { return stagesFor(items[index]); }

    return {
      state: function () {
        return {
          index: index,
          stage: stage,
          // How many stages THIS item has, so whoever is driving can see
          // whether the next press is another step or the answer. The machine
          // always knew; it just never said.
          stages: lastStage(),
          item: items[index],
          atEnd: index === items.length - 1 && stage === lastStage(),
        };
      },
      advance: function () {
        if (stage < lastStage()) { stage++; return; }
        if (index < items.length - 1) { index++; stage = 0; }
      },
      back: function () {
        if (stage > 0) { stage--; return; }
        if (index > 0) { index--; stage = lastStage(); }
      },
      next: function () {
        if (index < items.length - 1) { index++; stage = 0; }
      },
      prev: function () {
        if (index > 0) { index--; stage = 0; }
      },
      restart: function () { index = 0; stage = 0; },
    };
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.machine = { createMachine: createMachine };
})(typeof globalThis !== 'undefined' ? globalThis : window);
