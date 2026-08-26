/*
 * One hand on a laptop, in front of a room.
 *
 * Space/click advance - ArrowLeft back - R reshuffle - O original order
 * F fullscreen - Home restart - ? show the key legend again.
 *
 * Nothing else is bound. Every extra binding is a chance to derail a service
 * by leaning on the keyboard. Escape is deliberately absent: browsers already
 * leave fullscreen on it, and binding it would only fight them.
 *
 * The key-to-action table is pure so it can be unit-tested; the DOM wiring
 * below it cannot be, so the table does all the deciding.
 */
(function (root) {
  'use strict';

  var KEYS = {
    ' ': 'advance',
    'arrowleft': 'back',
    'r': 'reshuffle',
    'o': 'originalOrder',
    'f': 'fullscreen',
    'home': 'restart',
    '?': 'help',
  };

  function actionFor(key) {
    if (key === ' ') { return KEYS[' ']; }
    // Case-insensitive so caps lock cannot break the game mid-service.
    var found = KEYS[String(key).toLowerCase()];
    return found || null;
  }

  function toggleFullscreen(el) {
    var doc = document;
    var active = doc.fullscreenElement || doc.webkitFullscreenElement;
    if (active) {
      (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  }

  function attach(host, actions) {
    host.addEventListener('click', function () { actions.advance(); });
    document.addEventListener('keydown', function (e) {
      var name = actionFor(e.key);
      if (!name || !actions[name]) { return; }
      e.preventDefault();
      actions[name]();
    });
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.controls = {
    actionFor: actionFor,
    attach: attach,
    toggleFullscreen: toggleFullscreen,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
