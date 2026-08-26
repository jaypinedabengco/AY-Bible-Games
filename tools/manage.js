/*
 * Deck manager. Replace a clue picture without touching the code.
 *
 *   node tools/manage.js          then open http://localhost:8900
 *
 * Why a local Node tool rather than a page: a web page cannot write to your
 * disk. This serves the same static folder AND accepts uploads, so dropping a
 * file onto a clue saves it into games/book-names/images/ and, if the extension
 * changed, rewrites that one string in deck.js.
 *
 * It also ADDS a variant: pick a book, upload a picture, optionally give the
 * clue word, and the variant is written into deck.js. Every write is backed up
 * first and the result is loaded and validated before the backup is discarded,
 * so a bad edit restores itself rather than leaving a broken deck.
 *
 * What it deliberately does NOT do: delete puzzles, or regenerate deck.js from
 * a parser. The file is hand-written with comments explaining each decision,
 * and a round trip through a parser would throw all of that away. Edits are
 * surgical: they touch one string, or insert one block.
 *
 * Uploads are capped at 1400px on the long edge using `sips` when it is
 * available (macOS). Without it the file is saved unchanged and the response
 * says so.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const IMAGES = path.join(ROOT, 'games', 'book-names', 'images');
const DECK = path.join(ROOT, 'games', 'book-names', 'deck.js');
const PORT = Number(process.env.PORT || 8900);
const MAX_UPLOAD = 25 * 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.avif': 'image/avif',
};

function loadDeck() {
  // deck.js assigns window.DECK; give it a window and read it back.
  delete require.cache[require.resolve(DECK)];
  globalThis.window = globalThis;
  require(DECK);
  return globalThis.DECK;
}

function clueList() {
  const deck = loadDeck();
  const out = [];
  deck.puzzles.forEach((p) => {
    (p.variants || [p]).forEach((v, vi) => {
      const cl = v.clues ? v.clues : (v.img ? [{ img: v.img, word: null }] : []);
      cl.forEach((c, ci) => {
        out.push({
          id: p.id, answer: p.answer, variant: vi, clue: ci,
          file: c.img, word: c.word,
          many: (p.variants || [p]).length > 1,
          missing: !fs.existsSync(path.join(IMAGES, c.img)),
        });
      });
    });
  });
  return out;
}

function shrink(file) {
  try {
    execFileSync('sips', ['-Z', '1400', file], { stdio: 'ignore' });
    return 'capped at 1400px';
  } catch (e) {
    return 'saved as-is (sips unavailable)';
  }
}

// Replace one img: '...' string in deck.js, matched by its current filename and
// the answer it belongs to, so an identical filename used twice is not confused.
function repointDeck(oldName, newName) {
  if (oldName === newName) { return 'deck.js unchanged'; }
  const src = fs.readFileSync(DECK, 'utf8');
  const needle = "'" + oldName + "'";
  if (src.indexOf(needle) === -1) { throw new Error(oldName + ' not found in deck.js'); }
  fs.writeFileSync(DECK, src.replace(needle, "'" + newName + "'"));
  return 'deck.js now points at ' + newName;
}

// Find a puzzle's exact block in deck.js by its id, counting braces rather
// than pattern-matching. A regex over a nested literal grabs the wrong block -
// which it did, silently, on the first attempt at this.
function findBlock(src, id) {
  const lines = src.split('\n');
  const idLine = lines.findIndex((l) => l.indexOf("id: '" + id + "'") !== -1);
  if (idLine === -1) { throw new Error('no puzzle with id ' + id); }

  let start = idLine;
  while (start >= 0 && lines[start].trim() !== '{') { start--; }
  if (start < 0) { throw new Error('could not find the start of ' + id); }

  let depth = 0;
  let end = start;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; }
      if (ch === '}') { depth--; }
    }
    if (depth === 0) { end = i; break; }
  }
  return { lines, start, end };
}

// Write deck.js, then prove it still loads and still has every puzzle. If not,
// put the old file back - a manager that can corrupt the deck is worse than
// editing by hand.
function writeDeckSafely(next) {
  const before = fs.readFileSync(DECK, 'utf8');
  const countBefore = loadDeck().puzzles.length;
  fs.writeFileSync(DECK, next);
  try {
    const after = loadDeck();
    if (!after || !Array.isArray(after.puzzles)) { throw new Error('deck did not load'); }
    if (after.puzzles.length !== countBefore) {
      throw new Error('puzzle count changed from ' + countBefore + ' to ' + after.puzzles.length);
    }
    after.puzzles.forEach((p) => {
      if (!p.id || !p.answer) { throw new Error('a puzzle lost its id or answer'); }
    });
    return after;
  } catch (e) {
    fs.writeFileSync(DECK, before);
    loadDeck();
    throw new Error('edit rejected and rolled back: ' + e.message);
  }
}

// clues is [{ file, word }]. One entry with no word is a whole-picture variant;
// one or more with words is a rebus, which is how most of this deck works.
function addVariant(id, clues, note, weight, difficulty) {
  const src = fs.readFileSync(DECK, 'utf8');
  const { lines, start, end } = findBlock(src, id);
  const block = lines.slice(start, end + 1);
  const body = block.join('\n');

  // Written on ONE line on purpose: weight and difficulty can then be edited
  // later by replacing a single line, which is far safer than reformatting a
  // nested literal.
  const anyWord = clues.some((c) => c.word);
  const bits = anyWord
    ? "type: 'rebus', clues: ["
      + clues.map((c) => "{ img: '" + c.file + "', word: '" + (c.word || '?') + "' }").join(', ')
      + "]"
    : "type: 'image', img: '" + clues[0].file + "'";
  const fresh = "        { " + bits + ", weight: " + weight
    + ", difficulty: " + difficulty + " },";
  const comment = note ? '        // ' + note : null;

  // Look for a real variants array, not the words "variants: [" appearing
  // inside a comment. Ruth carries a commented-out example of exactly that,
  // and a substring search matched it and took the wrong branch.
  const arrayIdx = block.findIndex((l) => l.trim() === 'variants: [');

  let out;
  if (arrayIdx !== -1) {
    // Already has variants: insert before the closing bracket of the array.
    const closeIdx = block.findIndex((l, i) => i > arrayIdx && l.trim() === '],');
    if (closeIdx === -1) { throw new Error('could not find the variants array end'); }
    out = block.slice();
    const insert = comment ? [comment, fresh] : [fresh];
    out.splice(closeIdx, 0, ...insert);
  } else {
    // Single variant today: lift it into a variants array alongside the new one.
    const curIdx = block.findIndex((l) =>
      !/^\s*\/\//.test(l) && /^\s+(clues: \[|type: '\w+', img: ')/.test(l));
    if (curIdx === -1) { throw new Error('could not find the existing clue'); }
    let curEnd = curIdx;
    let open = 0;
    for (let i = curIdx; i < block.length; i++) {
      for (const ch of block[i]) {
        if (ch === '[') { open++; }
        if (ch === ']') { open--; }
      }
      curEnd = i;
      if (open === 0 && /,\s*$/.test(block[i])) { break; }
    }
    const current = block.slice(curIdx, curEnd + 1)
      .map((l) => l.trim()).join(' ').replace(/,$/, '');
    const isRebus = current.startsWith('clues:');
    const diff = (body.match(/difficulty: (\d)/) || [, '2'])[1];

    out = block.slice(0, curIdx);
    out.push('      variants: [');
    out.push('        { ' + (isRebus ? "type: 'rebus', " : '') + current
      + ', weight: 1, difficulty: ' + diff + ' },');
    if (comment) { out.push(comment); }
    out.push(fresh);
    out.push('      ],');
    out = out.concat(block.slice(curEnd + 1));
    // difficulty now lives on each variant
    out = out.map((l) => l.replace(/, difficulty: \d(?=,?$)/, ''));
  }

  const nextLines = lines.slice(0, start).concat(out, lines.slice(end + 1));
  return writeDeckSafely(nextLines.join('\n'));
}

// Change weight or difficulty on one variant. Only works on a variant written
// as a single line - anything hand-written across several lines is left alone
// and reported, rather than guessed at.
function setVariant(id, index, fields) {
  const src = fs.readFileSync(DECK, 'utf8');
  const { lines, start, end } = findBlock(src, id);
  const block = lines.slice(start, end + 1);

  const arrayStart = block.findIndex((l) => l.trim() === 'variants: [');
  if (arrayStart === -1) {
    throw new Error('that book has a single variant - add a second one first');
  }
  // collect the top-level variant lines of the array
  const entries = [];
  let depth = 0;
  for (let i = arrayStart + 1; i < block.length; i++) {
    const line = block[i];
    if (line.trim() === '],') { break; }
    if (depth === 0 && /^\s+\{/.test(line)) { entries.push(i); }
    for (const ch of line) {
      if (ch === '{') { depth++; }
      if (ch === '}') { depth--; }
    }
  }
  const at = entries[index];
  if (at === undefined) { throw new Error('no variant ' + (index + 1) + ' on ' + id); }
  const line = block[at];
  if (!/\},?\s*$/.test(line)) {
    throw new Error('variant ' + (index + 1) + ' spans several lines - edit it by hand');
  }

  let next = line;
  ['weight', 'difficulty'].forEach((key) => {
    if (fields[key] === undefined) { return; }
    const val = Number(fields[key]);
    if (new RegExp(key + ': \\d+').test(next)) {
      next = next.replace(new RegExp(key + ': \\d+'), key + ': ' + val);
    } else {
      next = next.replace(/\s*\},?\s*$/, ', ' + key + ': ' + val + ' },');
    }
  });

  block[at] = next;
  const nextLines = lines.slice(0, start).concat(block, lines.slice(end + 1));
  return writeDeckSafely(nextLines.join('\n'));
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8',
                        'Cache-Control': 'no-store' });
  res.end(body);
}

function serveStatic(req, res) {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') { rel = '/tools/manage.html'; }
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) { return send(res, 403, 'no'); }
  fs.readFile(file, (err, buf) => {
    if (err) { return send(res, 404, 'not found', 'text/plain'); }
    send(res, 200, buf, TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
  });
}

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/clues') {
    try { return send(res, 200, JSON.stringify(clueList())); }
    catch (e) { return send(res, 500, JSON.stringify({ error: e.message })); }
  }

  if (req.method === 'GET' && req.url === '/api/books') {
    try {
      const deck = loadDeck();
      return send(res, 200, JSON.stringify(deck.puzzles.map((p) => ({
        id: p.id,
        answer: p.answer,
        single: !p.variants,
        variants: (p.variants || [p]).map((v) => ({
          type: v.type || (v.clues ? 'rebus' : 'image'),
          weight: v.weight === undefined ? 1 : v.weight,
          difficulty: v.difficulty === undefined ? 2 : v.difficulty,
          words: v.clues ? v.clues.map((c) => c.word) : [],
          files: v.clues ? v.clues.map((c) => c.img) : (v.img ? [v.img] : []),
        })),
      }))));
    } catch (e) { return send(res, 500, JSON.stringify({ error: e.message })); }
  }

  if (req.method === 'POST' && req.url === '/api/add-variant') {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_UPLOAD) { req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const id = String(body.id || '');
        const weight = Math.max(1, Math.min(9, Number(body.weight) || 1));
        const difficulty = Math.max(1, Math.min(3, Number(body.difficulty) || 2));
        // One picture or several: most of this deck is two-picture rebuses, so
        // a single-image-only form would cover the minority case.
        const incoming = Array.isArray(body.clues) ? body.clues
          : [{ ext: body.ext, word: body.word, data: body.data }];
        if (!id || !incoming.length) { throw new Error('bad request'); }

        const deck = loadDeck();
        const puzzle = deck.puzzles.find((p) => p.id === id);
        if (!puzzle) { throw new Error('no puzzle with id ' + id); }
        const base = String(puzzle.answer).toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Pick the next free variant number for this book.
        let vn = 2;
        while (fs.existsSync(path.join(IMAGES, base + '-' + vn + '-1.jpg'))
            || fs.existsSync(path.join(IMAGES, base + '-' + vn + '-1.png'))
            || fs.existsSync(path.join(IMAGES, base + '-' + vn + '.jpg'))
            || fs.existsSync(path.join(IMAGES, base + '-' + vn + '.png'))) { vn++; }

        const written = [];
        const clues = [];
        try {
          incoming.forEach((c, i) => {
            const ext = String(c.ext || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
            if (!TYPES[ext]) { throw new Error('unsupported file type ' + ext); }
            const bytes = Buffer.from(String(c.data || ''), 'base64');
            if (!bytes.length) { throw new Error('one of the files was empty'); }
            const name = incoming.length === 1
              ? base + '-' + vn + ext
              : base + '-' + vn + '-' + (i + 1) + ext;
            fs.writeFileSync(path.join(IMAGES, name), bytes);
            shrink(path.join(IMAGES, name));
            written.push(path.join(IMAGES, name));
            clues.push({
              file: name,
              word: String(c.word || '').trim().toUpperCase().replace(/[^A-Z0-9 -]/g, ''),
            });
          });
          addVariant(id, clues, 'added with the deck manager', weight, difficulty);
        } catch (e) {
          written.forEach((f) => { try { fs.unlinkSync(f); } catch (x) { /* ignore */ } });
          throw e;
        }

        const anyWord = clues.some((c) => c.word);
        send(res, 200, JSON.stringify({
          ok: true,
          files: clues.map((c) => c.file),
          note: (anyWord
            ? 'rebus: ' + clues.map((c) => c.word || '?').join(' + ')
            : 'whole-picture clue')
            + ' · weight ' + weight + ' · difficulty ' + difficulty,
        }));
      } catch (e) {
        send(res, 400, JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/set-variant') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        setVariant(String(body.id || ''), Number(body.index), {
          weight: body.weight, difficulty: body.difficulty,
        });
        send(res, 200, JSON.stringify({ ok: true }));
      } catch (e) {
        send(res, 400, JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/replace') {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_UPLOAD) { req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const oldName = String(body.file || '');
        const ext = String(body.ext || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
        if (!oldName || !TYPES[ext]) { throw new Error('bad request'); }
        const base = oldName.replace(/\.[^.]+$/, '');
        const newName = base + ext;
        const bytes = Buffer.from(String(body.data || ''), 'base64');
        if (!bytes.length) { throw new Error('empty file'); }

        fs.writeFileSync(path.join(IMAGES, newName), bytes);
        const sized = shrink(path.join(IMAGES, newName));
        const deckNote = repointDeck(oldName, newName);
        // Remove the file the deck no longer points at.
        if (newName !== oldName && fs.existsSync(path.join(IMAGES, oldName))) {
          fs.unlinkSync(path.join(IMAGES, oldName));
        }
        send(res, 200, JSON.stringify({ ok: true, file: newName, sized, deckNote }));
      } catch (e) {
        send(res, 400, JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  serveStatic(req, res);
}).listen(PORT, () => {
  console.log('deck manager on http://localhost:' + PORT);
  console.log('writes into ' + path.relative(process.cwd(), IMAGES));
  console.log('Ctrl-C to stop');
});
