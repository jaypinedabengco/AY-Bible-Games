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
    } else if (view.kind === 'quote') {
      body.appendChild(el('div', 'quote', '\u201c' + view.quote + '\u201d'));
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
    } else if (view.kind === 'order') {
      var list = el('div', 'order-list');
      (view.correct || view.items).forEach(function (item, i) {
        list.appendChild(el('div', 'order-item', (i + 1) + '. ' + item));
      });
      body.appendChild(list);
    }

    if (view.answered && view.kind !== 'binary') {
      body.appendChild(answerBlock(view.answered));
    } else if (view.answered && view.kind === 'binary') {
      if (view.answered.ref) { body.appendChild(el('div', 'ref', view.answered.ref)); }
    }

    host.appendChild(body);
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.paint = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : window);
