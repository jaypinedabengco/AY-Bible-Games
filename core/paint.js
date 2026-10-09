/*
 * Drawing a view object into the DOM.
 *
 * Deliberately stupid: no game rules live here. Everything this function
 * draws was decided by views.js, which is unit-tested. If you are about to
 * write an `if` about how a game works, it belongs there, not here.
 */
(function (root) {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) { node.className = cls; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  // The ring of people the potato is passed round. Eight small figures, a head
  // and shoulders each, set evenly on a circle (percentages of the ring box, so
  // the geometry lives in one place and the CSS sizes it). The potato rides a
  // container that steps between eight positions; see .hp-orbit in theme.css.
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var PEOPLE = 8;

  function svgNode(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function personSvg() {
    var svg = svgNode('svg', { viewBox: '0 0 24 32', 'aria-hidden': 'true',
                               focusable: 'false' });
    svg.appendChild(svgNode('circle', { cx: '12', cy: '8', r: '6' }));
    svg.appendChild(svgNode('path',
      { d: 'M1 32 C1 21 5 16.5 12 16.5 C19 16.5 23 21 23 32 Z' }));
    return svg;
  }

  // A lumpy oval with a few eyes. Brown on the dark ground with a thin gold rim
  // so it stays the brightest thing on screen from the back of the hall.
  function potatoSvg() {
    var svg = svgNode('svg', { viewBox: '0 0 40 28', 'aria-hidden': 'true',
                               focusable: 'false' });
    svg.appendChild(svgNode('path', { 'class': 'hp-skin',
      stroke: 'currentColor', 'stroke-width': '1.2', 'stroke-linejoin': 'round',
      d: 'M5 15 C3 8 11 2.5 19 4 C25 1.5 34 4.5 35.5 12.5 C37.5 20 30.5 26.5 21 25 ' +
         'C14 27.5 6.5 23 5 15 Z' }));
    [[13, 11.5, 1.8, 1.2], [25, 8.5, 1.5, 1], [28, 17.5, 1.7, 1.1],
     [17.5, 19, 1.3, 0.9], [9.5, 17, 1.1, 0.8]].forEach(function (s) {
      svg.appendChild(svgNode('ellipse', { 'class': 'hp-eye',
        cx: String(s[0]), cy: String(s[1]), rx: String(s[2]), ry: String(s[3]) }));
    });
    return svg;
  }

  // Three wisps of steam: it is a HOT potato. Drawn as lines so they read as
  // vapour, and given their rim colour by CSS (stroke="currentColor"). Each
  // fades in and out slowly on its own delay; see .hp-wisp in theme.css.
  function steamSvg() {
    var svg = svgNode('svg', { 'class': 'hp-steam', viewBox: '0 0 30 20',
                               'aria-hidden': 'true', focusable: 'false' });
    [[7, 0], [15, 1], [23, 2]].forEach(function (w) {
      var x = w[0];
      svg.appendChild(svgNode('path', { 'class': 'hp-wisp hp-wisp-' + w[1],
        d: 'M' + x + ' 19 C' + (x - 4) + ' 14 ' + (x + 4) + ' 10 ' + x + ' 5 ' +
           'C' + (x - 2) + ' 3 ' + x + ' 1 ' + x + ' 0',
        fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8',
        'stroke-linecap': 'round' }));
    });
    return svg;
  }

  function passingRing() {
    var ring = el('div', 'hp-ring');
    var i, angle, person;
    for (i = 0; i < PEOPLE; i++) {
      angle = (i * 2 * Math.PI) / PEOPLE;
      person = el('div', 'hp-person');
      person.style.left = (50 + 38 * Math.sin(angle)).toFixed(2) + '%';
      person.style.top = (50 - 38 * Math.cos(angle)).toFixed(2) + '%';
      person.appendChild(personSvg());
      ring.appendChild(person);
    }
    // The potato rides three nested boxes. .hp-orbit steps round the ring;
    // .hp-hand is a zero-size anchor at the top figure; .hp-turn turns back the
    // other way in the same steps, so everything inside stays upright and its
    // offsets are in screen terms; .hp-hop is the toss, straight up the screen.
    // The steam is inside .hp-hop so it rises with the potato.
    var orbit = el('div', 'hp-orbit');
    var hand = el('div', 'hp-hand');
    var turn = el('div', 'hp-turn');
    var hop = el('div', 'hp-hop');
    hop.appendChild(steamSvg());
    hop.appendChild(potatoSvg());
    turn.appendChild(hop);
    hand.appendChild(turn);
    orbit.appendChild(hand);
    ring.appendChild(orbit);
    return ring;
  }

  function clueCard(name, word, srcFor) {
    var card = el('div', 'clue');
    var src = srcFor(name);
    if (src) {
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      card.appendChild(img);
    } else {
      // Loud on purpose: caught at setup rather than mid-service.
      card.appendChild(el('div', 'clue-missing', '?'));
    }
    if (word) { card.appendChild(el('div', 'clue-word', word)); }
    return card;
  }

  // A trail step: a row of objects. Unlike a rebus clue, a missing picture is
  // NOT an error here - the trail is written in words first and grows pictures
  // later, so an object with no image yet simply shows its word, larger. The
  // word is shown either way: it is not a secret, it IS the clue, and it stops
  // the room arguing about whether that is honey or oil.
  function trailRow(step, srcFor) {
    var pictures = step.pictures || [];
    var row = el('div', 'trail-row clues-' + Math.min(pictures.length, 4));
    pictures.forEach(function (pic, i) {
      if (i > 0) { row.appendChild(el('div', 'plus', '+')); }
      var card = el('div', 'trail-object');
      var src = pic.img ? srcFor(pic.img) : null;
      if (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = '';
        card.appendChild(img);
      } else {
        card.classList.add('wordsonly');
      }
      if (pic.word) { card.appendChild(el('div', 'trail-word', pic.word)); }
      row.appendChild(card);
    });
    return row;
  }

  function clueRow(clues, srcFor) {
    // The count drives the size: one picture should fill a projector, four
    // must still fit side by side. CSS cannot count siblings, so say it here.
    var row = el('div', 'clue-row clues-' + Math.min(clues.length, 4));
    clues.forEach(function (c, i) {
      if (i > 0) { row.appendChild(el('div', 'plus', '+')); }
      row.appendChild(clueCard(c.img, c.word, srcFor));
    });
    return row;
  }

  function answerBlock(a) {
    var block = el('div', 'answer-block');
    block.appendChild(el('div', 'answer', a.answer));
    // The same name in the other language, where the two differ. Small, because
    // the answer is the one in the language being played.
    if (a.alt) { block.appendChild(el('div', 'answer-alt', a.alt)); }
    if (a.ref) { block.appendChild(el('div', 'ref', a.ref)); }
    return block;
  }

  function render(host, view, srcFor, meta) {
    host.innerHTML = '';
    // Only worth showing when the deck actually asks in more than one
    // language. With a single language it is the same word on every card -
    // clutter on a projector, and it tells the room nothing.
    if (!meta || meta.showBadge !== false) {
      host.appendChild(el('div', 'badge', view.badge));
    }

    // The stamp is how the Game Master finds this puzzle on their phone: the
    // id names one puzzle no matter how the deck was shuffled, so nothing has
    // to be synchronised between the projector and the phone (spec 16).
    // Small and dim on purpose - the room should not be reading it.
    if (view.id || meta) {
      var stamp = el('div', 'stamp');
      if (view.id) { stamp.appendChild(el('span', 'stamp-id', '#' + view.id)); }
      // How far through this puzzle's own reveal we are. "3 / 3" means the next
      // press is the answer, which is the thing the person driving cannot
      // otherwise tell - a trail of two steps and a trail of four look
      // identical on the first screen. Dropped once the answer is up, because
      // the answer itself says so.
      if (meta && meta.stages > 1 && meta.stage < meta.stages) {
        stamp.appendChild(el('span', 'stamp-stage',
          (meta.stage + 1) + ' / ' + meta.stages));
      }
      if (meta && meta.total) {
        stamp.appendChild(el('span', 'stamp-pos',
          (meta.round > 1 ? 'R' + meta.round + '  ' : '')
          + meta.position + ' / ' + meta.total));
      }
      host.appendChild(stamp);
    }

    var body = el('div', 'body');

    if (view.kind === 'rebus') {
      body.appendChild(clueRow(view.clues, srcFor));
      if (view.working) { body.appendChild(el('div', 'working', view.working)); }
    } else if (view.kind === 'image') {
      body.appendChild(clueRow([{ img: view.img, word: null }], srcFor));
    } else if (view.kind === 'text') {
      body.appendChild(el('div', 'prompt', view.prompt));
    } else if (view.kind === 'card') {
      if (view.phase === 'playing') {
        // An object going round, with no abrupt change in brightness. A dark
        // hall, a projector at full output and a room full of young people is
        // not a place to put a strobe.
        body.appendChild(passingRing());
      } else if (view.phase === 'stop') {
        body.appendChild(el('div', 'hp-stop', 'STOP'));
      } else {
        body.appendChild(el('div', 'hp-card', view.prompt));
      }
    } else if (view.kind === 'trail') {
      // The count drives the size, the same way the rebus row does it: one step
      // can fill a projector, four have to share it with the answer and the
      // references underneath. CSS cannot count children, so say it here.
      var trail = el('div', 'trail steps-' + Math.min(view.steps.length, 4)
        + (view.answered ? ' answered' : ''));
      view.steps.forEach(function (step) {
        trail.appendChild(trailRow(step, srcFor));
      });
      body.appendChild(trail);
    } else if (view.kind === 'quote') {
      // Quotation marks are a claim that somebody said this. A deed is our
      // own sentence, so it gets none - see `spoken` in normalize.js.
      body.appendChild(view.spoken === false
        ? el('div', 'quote narrated', view.quote)
        : el('div', 'quote', '\u201c' + view.quote + '\u201d'));
      if (view.verse) { body.appendChild(el('div', 'verse', view.verse)); }
      if (view.clue) { body.appendChild(el('div', 'clue-text', view.clue)); }
    } else if (view.kind === 'binary') {
      if (view.img) { body.appendChild(clueRow([{ img: view.img, word: null }], srcFor)); }
      if (view.prompt) { body.appendChild(el('div', 'prompt', view.prompt)); }
      var opts = el('div', 'options');
      view.options.forEach(function (o) {
        var chosen = view.answered && view.answered.answer === o;
        opts.appendChild(el('div', chosen ? 'option option-correct' : 'option', o));
      });
      body.appendChild(opts);
    } else if (view.kind === 'map') {
      // A fixed-height body, so the map holds still while the verse, clue and
      // answer arrive beneath it - see .body-map in theme.css.
      body.className = 'body body-map';
      // hideLabelAt is the answer-protection rule: the map must not print the
      // name of the place under the pin. Five of the six named peaks ARE
      // puzzles, so without this the answer was on screen from beat one. See
      // hiddenLabels in atlas.js.
      var map = BibleGames.atlas.draw(view.extent, view.lang,
        { hideLabelAt: view.at });
      var wrap = el('div', 'mapwrap');
      wrap.appendChild(map);
      body.appendChild(wrap);
      // The pin goes in the group the atlas left empty for exactly this. The
      // guard is not paranoia: host.innerHTML has already been cleared by the
      // time we get here, so a throw leaves a black rectangle on a projector
      // mid-round. A map with no pin is a lesser failure than no map at all.
      var pins = map.querySelector && map.querySelector('.pins');
      var at = BibleGames.atlas.project(view.extent, view.at[0], view.at[1]);
      var z = BibleGames.atlas.sizes(view.extent);
      if (pins) {
        // The halo pulses. It is drawn at the origin of a group TRANSLATED to
        // the pin rather than at cx/cy, so the scale in the keyframes has the
        // pin as its origin without needing transform-box: fill-box - which an
        // older church laptop may not honour, and whose fallback scales the
        // halo about the middle of the whole map, forever, on a loop.
        var anchor = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        anchor.setAttribute('class', 'pin');
        anchor.setAttribute('transform', 'translate(' + at.x + ',' + at.y + ')');
        pins.appendChild(anchor);
        ['pin-halo', 'pin-dot'].forEach(function (cls) {
          var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', 0);
          c.setAttribute('cy', 0);
          // In viewBox units, from the atlas: a fraction of the map's HEIGHT, so
          // the pin is the same size on screen on both maps. The pin is the
          // question, and it has to be seen from the back of a hall. A fixed
          // radius was 13 px on a projector on the close map (portrait, so it
          // is fitted by height and drawn small) and twice that on the wide one.
          c.setAttribute('r', cls === 'pin-halo' ? z.pinHalo : z.pinDot);
          if (cls === 'pin-dot') { c.setAttribute('stroke-width', z.pinRing); }
          c.setAttribute('class', cls);
          anchor.appendChild(c);
        });
      }
      if (view.verse) { body.appendChild(el('div', 'verse', view.verse)); }
      if (view.clue) { body.appendChild(el('div', 'clue-text', view.clue)); }
      // The first letter and a slot for each of the rest.
      if (view.masked) { body.appendChild(el('div', 'masked', view.masked)); }
    } else if (view.kind === 'order') {
      if (view.prompt) { body.appendChild(el('div', 'prompt', view.prompt)); }
      if (view.correct) {
        var list = el('div', 'order-list');
        view.correct.forEach(function (row, i) {
          var line = el('div', 'order-item');
          line.appendChild(el('span', 'order-rank', String(i + 1)));
          line.appendChild(el('span', 'order-label', row.label));
          // A date is optional: an ordering can be worth showing without one.
          line.appendChild(el('span', 'order-when', row.when || ''));
          list.appendChild(line);
        });
        body.appendChild(list);
      } else {
        // The scramble. A ROW rather than a list, and with no numbers at all -
        // a numbered column reads as an answer, and this one would be wrong.
        var scramble = el('div', 'order-scramble');
        (view.items || []).forEach(function (item) {
          scramble.appendChild(el('div', 'order-chip', item));
        });
        body.appendChild(scramble);
      }
    }

    if (view.answered && view.kind !== 'binary') {
      body.appendChild(answerBlock(view.answered));
      // Where each object came from - after the answer, because the answer is
      // what the room is waiting for and this is the bit they read afterwards.
      if (view.kind === 'trail' && view.sources && view.sources.length) {
        var sources = el('div', 'sources');
        view.sources.forEach(function (src) {
          var line = el('div', 'source');
          line.appendChild(el('span', 'source-words', src.words));
          line.appendChild(el('span', 'source-verse', src.verse));
          sources.appendChild(line);
        });
        body.appendChild(sources);
      }
    } else if (view.answered && view.kind === 'binary') {
      if (view.answered.ref) { body.appendChild(el('div', 'ref', view.answered.ref)); }
    }

    host.appendChild(body);
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.paint = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : window);
