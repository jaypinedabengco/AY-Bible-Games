/*
 * runner.js - the shared game engine.
 *
 * Every game here is the same shape underneath: a list of items, each revealed
 * in a few stages, driven by one hand on a laptop. That logic lives here once
 * so a new game only has to supply its data and how to draw a card.
 *
 * Plain script, no modules: ES modules are blocked on file:// URLs, so an
 * import-based build would work on GitHub Pages and then fail from a USB stick.
 */
(function (global) {
  'use strict';

  /* Fisher-Yates. Returns a new array; does not touch the caller's. */
  function shuffled(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  function requestFullscreen(el) {
    var fn = el.requestFullscreen || el.webkitRequestFullscreen ||
             el.msRequestFullscreen;
    if (fn) { try { fn.call(el); } catch (e) { /* user gesture required */ } }
  }

  function exitFullscreen() {
    var fn = document.exitFullscreen || document.webkitExitFullscreen ||
             document.msExitFullscreen;
    if (fn) { try { fn.call(document); } catch (e) { /* ignore */ } }
  }

  function inFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
              document.msFullscreenElement);
  }

  /**
   * create(options)
   *   items    Array           the deck. Required, may be empty.
   *   stages   Number          reveal steps per item beyond the initial view.
   *                            2 means: puzzle -> working -> answer.
   *   stage    HTMLElement     where cards are drawn.
   *   render   fn(item, stage) returns HTML for one item at one stage.
   *   onChange fn(state)       called after every change, for the progress
   *                            readout and anything else outside the stage.
   *   preload  fn(item)        optional; returns image URLs to warm up.
   */
  function create(options) {
    var items    = options.items || [];
    var maxStage = options.stages == null ? 1 : options.stages;
    var host     = options.stage;
    var order    = items.slice();
    var index    = 0;
    var stage    = 0;

    function state() {
      return {
        index: index,
        stage: stage,
        total: order.length,
        item: order[index] || null,
        atEnd: index >= order.length - 1 && stage >= maxStage,
      };
    }

    /* Warm the next item's images so a slow disk never stalls the reveal. */
    function preloadNext() {
      if (!options.preload) return;
      var next = order[index + 1];
      if (!next) return;
      (options.preload(next) || []).forEach(function (url) {
        var img = new Image();
        img.src = url;
      });
    }

    function draw() {
      if (!order.length) {
        host.innerHTML =
          '<p class="empty">This deck is empty. Add puzzles to ' +
          '<code>deck.js</code> and reload.</p>';
        return;
      }
      host.innerHTML = options.render(order[index], stage);
      // Mark cards whose artwork failed, so a missing file is obvious.
      Array.prototype.forEach.call(host.querySelectorAll('.clue img'),
        function (img) {
          if (img.complete && img.naturalWidth === 0) {
            img.parentNode.classList.add('missing');
          }
          img.addEventListener('error', function () {
            img.parentNode.classList.add('missing');
          });
        });
      preloadNext();
      if (options.onChange) options.onChange(state());
    }

    var api = {
      /* One step forward: reveal the next stage, or move to the next item. */
      advance: function () {
        if (!order.length) return;
        if (stage < maxStage) { stage++; }
        else if (index < order.length - 1) { index++; stage = 0; }
        else { return; }            // parked on the last answer, not looping
        draw();
      },
      back: function () {
        if (!order.length) return;
        if (stage > 0) { stage = 0; }
        else if (index > 0) { index--; stage = 0; }
        else { return; }
        draw();
      },
      next: function () {
        if (index < order.length - 1) { index++; stage = 0; draw(); }
      },
      restart: function () { index = 0; stage = 0; draw(); },
      shuffle: function () { order = shuffled(items); index = 0; stage = 0; draw(); },
      resetOrder: function () { order = items.slice(); index = 0; stage = 0; draw(); },
      toggleFullscreen: function () {
        if (inFullscreen()) exitFullscreen();
        else requestFullscreen(document.documentElement);
      },
      state: state,
      draw: draw,
    };

    /* ------------------------------------------------------- input ------ */
    host.addEventListener('click', function () { api.advance(); });

    host.setAttribute('tabindex', '0');
    host.setAttribute('role', 'button');
    host.setAttribute('aria-label', 'Reveal, then go to the next puzzle');

    document.addEventListener('keydown', function (e) {
      if (e.repeat) return;                       // holding a key must not race
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case ' ': case 'Spacebar': case 'Enter':
        case 'ArrowRight': case 'PageDown':
          e.preventDefault(); api.advance(); break;
        case 'ArrowLeft': case 'PageUp':
          e.preventDefault(); api.back(); break;
        case 'r': case 'R':
          e.preventDefault(); api.shuffle(); break;
        case 'f': case 'F':
          e.preventDefault(); api.toggleFullscreen(); break;
        case 'Home':
          e.preventDefault(); api.restart(); break;
        default: break;
      }
    });

    draw();
    return api;
  }

  global.Runner = { create: create, shuffled: shuffled };
}(window));
