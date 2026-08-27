'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Every page carries its logic in an inline <script>. There is no build step to
// catch a syntax error in one, and a broken script does not fail loudly - it
// leaves the page looking fine and doing nothing. That is exactly what happened
// to the Who Said It? game master page: an editing slip left a stray brace, the
// sign-in button silently stopped working, and nothing in this suite noticed.
const ROOT = path.join(__dirname, '..');

function pages() {
  const out = [path.join(ROOT, 'index.html')];
  out.push(path.join(ROOT, 'gm.html'));
  const games = path.join(ROOT, 'games');
  fs.readdirSync(games).forEach((slug) => {
    const p = path.join(games, slug, 'index.html');
    if (fs.existsSync(p)) { out.push(p); }
  });
  ['manage.html', 'review.html'].forEach((f) => {
    const p = path.join(ROOT, 'tools', f);
    if (fs.existsSync(p)) { out.push(p); }
  });
  return out;
}

test('every inline script on every page parses', () => {
  const broken = [];
  pages().forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    const blocks = src.match(/<script>[\s\S]*?<\/script>/g) || [];
    blocks.forEach((block, i) => {
      const js = block.replace(/^<script>/, '').replace(/<\/script>$/, '');
      try {
        new Function(js);
      } catch (e) {
        broken.push(path.relative(ROOT, file) + ' block ' + (i + 1) + ': ' + e.message);
      }
    });
  });
  assert.deepEqual(broken, [], broken.join('\n'));
});

test('every page that plays a game loads the whole engine', () => {
  const needed = ['normalize', 'variants', 'order', 'machine', 'views',
                  'images', 'paint', 'controls', 'boot'];
  const missing = [];
  fs.readdirSync(path.join(ROOT, 'games')).forEach((slug) => {
    const file = path.join(ROOT, 'games', slug, 'index.html');
    if (!fs.existsSync(file)) { return; }
    const src = fs.readFileSync(file, 'utf8');
    needed.forEach((m) => {
      if (!src.includes('core/' + m + '.js')) { missing.push(slug + ' is missing ' + m); }
    });
    if (!src.includes('deck.js')) { missing.push(slug + ' does not load its deck'); }
  });
  assert.deepEqual(missing, [], missing.join('\n'));
});

test('every game in the catalogue that is ready actually exists', () => {
  globalThis.window = globalThis;
  require(path.join(ROOT, 'games.js'));
  const missing = [];
  globalThis.GAMES.filter((g) => g.status === 'ready').forEach((g) => {
    const page = path.join(ROOT, g.href);
    if (!fs.existsSync(page)) { missing.push(g.title + ': no ' + g.href); }
  });
  assert.deepEqual(missing, [], missing.join('\n'));
});

test('the one game master page loads every deck there is', () => {
  // It is a single page now, so a new game is only reachable from it if its
  // deck is added here. Nothing else would notice the omission: the page would
  // simply never offer that game.
  const src = fs.readFileSync(path.join(ROOT, 'gm.html'), 'utf8');
  const missing = [];
  fs.readdirSync(path.join(ROOT, 'games')).forEach((slug) => {
    if (!fs.existsSync(path.join(ROOT, 'games', slug, 'deck.js'))) { return; }
    if (!src.includes('games/' + slug + '/deck.js')) {
      missing.push(slug + ' has a deck the game master page does not load');
    }
    if (!src.includes("slug: '" + slug + "'")) {
      missing.push(slug + ' is loaded but never registered in window.DECKS');
    }
  });
  assert.deepEqual(missing, [], missing.join('\n'));
});
