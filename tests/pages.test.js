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

test('a page whose deck has a map loads the atlas, and loads it BEFORE the deck', () => {
  // The atlas is a set of plain <script> tags with no build step to notice one
  // going missing. Drop a tag, or move the block after deck.js, and the suite
  // would otherwise stay green while the page painted a black rectangle in
  // front of the room. Order is half the requirement: presence alone would
  // pass a page that loads them too late.
  const files = ['atlas-holyland.js', 'atlas-bibleworld.js', 'atlas.js'];
  const problems = [];
  let checked = 0;
  fs.readdirSync(path.join(ROOT, 'games')).forEach((slug) => {
    const page = path.join(ROOT, 'games', slug, 'index.html');
    const deck = path.join(ROOT, 'games', slug, 'deck.js');
    if (!fs.existsSync(page) || !fs.existsSync(deck)) { return; }
    if (!/type:\s*['"]map['"]/.test(fs.readFileSync(deck, 'utf8'))) { return; }
    checked += 1;
    const src = fs.readFileSync(page, 'utf8');
    const deckAt = src.search(/<script[^>]*src="deck\.js"/);
    if (deckAt === -1) { problems.push(slug + ' does not load deck.js'); }
    files.forEach((f) => {
      const at = src.search(new RegExp('<script[^>]*src="\\.\\./\\.\\./core/' + f.replace('.', '\\.') + '"'));
      if (at === -1) { problems.push(slug + ' does not load ' + f); }
      else if (deckAt !== -1 && at > deckAt) {
        problems.push(slug + ' loads ' + f + ' after deck.js');
      }
    });
  });
  assert.ok(checked > 0, 'no map deck found - the test is not looking at anything');
  assert.deepEqual(problems, [], problems.join('\n'));
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

// A LEADING SLASH BREAKS GITHUB PAGES. It means "the server root", which is
// right only when the site is served from the root of a domain. This site is
// published under a project subpath, and is also opened straight off a USB
// stick over file://, where a leading slash points at the root of the disk.
// Either way the page loads without its stylesheet and nobody is told.
//
// tools/manage.html carried the only one in the repository - href="/core/
// theme.css" - and it worked on the author's machine because the manager is
// served from the repository root.
test('no page reaches for an absolute path', () => {
  const absolute = [];
  pages().forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    // // is a protocol-relative URL, not a root-relative path, so it is left
    // alone; nothing here uses one, and it would be a separate argument.
    const patterns = [/\b(?:src|href)\s*=\s*"\/(?!\/)/g, /\burl\(\s*["']?\/(?!\/)/g];
    patterns.forEach((re) => {
      let m;
      while ((m = re.exec(src)) !== null) {
        const line = src.slice(0, m.index).split('\n').length;
        absolute.push(path.relative(ROOT, file) + ':' + line + '  ' + m[0]);
      }
    });
  });
  assert.deepEqual(absolute, [], 'a leading slash breaks GitHub Pages and file://:\n'
    + absolute.join('\n'));
});

// ES5 SYNTAX in core/ and in every inline page script. There is no build step
// and no transpiler: whatever is written here is what the church laptop parses.
// `new Function` on this version of Node accepts let, const, arrows, template
// literals and classes quite happily, so parsing proves nothing and only a
// reading of the source catches it.
//
// Comments and string literals are stripped first, crudely, so that the word
// "const" in a comment is not a failure. If this ever produces a false
// positive, fix the stripper - do not weaken the check.
test('core and every inline page script stay ES5 syntax', () => {
  const strip = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^\\:])\/\/[^\n]*/g, '$1')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
  const BANNED = [
    [/\blet\s/, 'let'], [/\bconst\s/, 'const'], [/=>/, 'an arrow function'],
    [/`/, 'a template literal'], [/\bclass\s+[A-Za-z_$]/, 'a class declaration'],
    [/\bclass\s*\{/, 'a class expression'],
  ];
  const sources = [];
  fs.readdirSync(path.join(ROOT, 'core')).filter((f) => f.endsWith('.js'))
    .forEach((f) => sources.push(['core/' + f,
      fs.readFileSync(path.join(ROOT, 'core', f), 'utf8')]));
  pages().forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    (src.match(/<script>[\s\S]*?<\/script>/g) || []).forEach((block, i) => {
      sources.push([path.relative(ROOT, file) + ' block ' + (i + 1),
        block.replace(/^<script>/, '').replace(/<\/script>$/, '')]);
    });
  });
  assert.ok(sources.length > 20, 'the test is not looking at anything');

  const bad = [];
  sources.forEach(([name, src]) => {
    strip(src).split('\n').forEach((line, i) => {
      BANNED.forEach(([re, what]) => {
        if (re.test(line)) { bad.push(name + ':' + (i + 1) + ' uses ' + what); }
      });
    });
  });
  assert.deepEqual(bad, [], 'these must run unbuilt on an old church laptop:\n'
    + bad.join('\n'));
});
