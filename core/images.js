/*
 * Finding a picture.
 *
 * `img: 'whale.jpg'` resolves through the deck's imageDirs in order, falling
 * through on load failure and ending at null:
 *
 *     images/whale.jpg  ->  null
 *
 * The shipped deck lists one directory, but the chain stays ordered and
 * generic because that costs nothing. A file that is in no directory
 * resolves to null, so paint.js shows a loud placeholder rather than a
 * blank card.
 *
 * `load` is injected rather than hard-wired to Image, which lets the whole
 * chain be tested under node with a fake loader.
 */
(function (root) {
  'use strict';

  var ABSOLUTE = /^(https?:|data:)/i;

  function candidates(name, dirs) {
    if (ABSOLUTE.test(name)) { return [name]; }
    return dirs.map(function (dir) { return dir + name; });
  }

  function makeResolver(dirs, load) {
    var memo = {};
    return function (name) {
      if (Object.prototype.hasOwnProperty.call(memo, name)) { return memo[name]; }
      var list = candidates(name, dirs);
      memo[name] = (function step(i) {
        if (i >= list.length) { return Promise.resolve(null); }
        return load(list[i]).then(function (ok) {
          return ok ? list[i] : step(i + 1);
        });
      })(0);
      return memo[name];
    };
  }

  function browserLoad(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = url;
    });
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.images = {
    candidates: candidates,
    makeResolver: makeResolver,
    browserLoad: browserLoad,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
