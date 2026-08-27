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
// The games this manages. Both use the same engine and the same deck shape, so
// the manager is the same tool pointed at a different folder. A game with a
// `canon` gets a dropdown of what is missing from it; one without takes a
// typed-in name, because there is no closed list of Bible characters.
const GAMES = [
  { slug: 'book-names', title: 'Bible Book Names', canon: 'books', kind: 'pictures' },
  { slug: 'character-names', title: 'Bible Character Names', canon: null, kind: 'pictures' },
  { slug: 'who-said-it', title: 'Who Said It?', canon: null, kind: 'quotes' },
];

function pickGame(slug) {
  const g = GAMES.find((x) => x.slug === slug) || GAMES[0];
  return {
    slug: g.slug,
    title: g.title,
    canon: g.canon,
    kind: g.kind || 'pictures',
    images: path.join(ROOT, 'games', g.slug, 'images'),
    deck: path.join(ROOT, 'games', g.slug, 'deck.js'),
  };
}
const PORT = Number(process.env.PORT || 8900);
const MAX_UPLOAD = 25 * 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.avif': 'image/avif',
};

function loadDeck(g) {
  // deck.js assigns window.DECK; give it a window and read it back.
  delete require.cache[require.resolve(g.deck)];
  globalThis.window = globalThis;
  require(g.deck);
  return globalThis.DECK;
}

function clueList(g) {
  const deck = loadDeck(g);
  const out = [];
  deck.puzzles.forEach((p) => {
    (p.variants || [p]).forEach((v, vi) => {
      const cl = v.clues ? v.clues : (v.img ? [{ img: v.img, word: null }] : []);
      cl.forEach((c, ci) => {
        out.push({
          id: p.id, answer: p.answer, variant: vi, clue: ci,
          file: c.img, word: c.word,
          many: (p.variants || [p]).length > 1,
          missing: !fs.existsSync(path.join(g.images, c.img)),
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
function repointDeck(g, oldName, newName) {
  if (oldName === newName) { return 'deck.js unchanged'; }
  const src = fs.readFileSync(g.deck, 'utf8');
  const needle = "'" + oldName + "'";
  if (src.indexOf(needle) === -1) { throw new Error(oldName + ' not found in deck.js'); }
  fs.writeFileSync(g.deck, src.replace(needle, "'" + newName + "'"));
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
function writeDeckSafely(g, next, expectCount) {
  const before = fs.readFileSync(g.deck, 'utf8');
  const countBefore = expectCount === undefined ? loadDeck(g).puzzles.length : expectCount;
  fs.writeFileSync(g.deck, next);
  try {
    const after = loadDeck(g);
    if (!after || !Array.isArray(after.puzzles)) { throw new Error('deck did not load'); }
    if (after.puzzles.length !== countBefore) {
      throw new Error('puzzle count changed from ' + countBefore + ' to ' + after.puzzles.length);
    }
    after.puzzles.forEach((p) => {
      if (!p.id || !p.answer) { throw new Error('a puzzle lost its id or answer'); }
    });
    return after;
  } catch (e) {
    fs.writeFileSync(g.deck, before);
    loadDeck(g);
    throw new Error('edit rejected and rolled back: ' + e.message);
  }
}

// clues is [{ file, word }]. One entry with no word is a whole-picture variant;
// one or more with words is a rebus, which is how most of this deck works.
function addVariant(g, id, clues, note, weight, difficulty) {
  const src = fs.readFileSync(g.deck, 'utf8');
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
  return writeDeckSafely(g, nextLines.join('\n'));
}

// Change weight or difficulty on one variant. Only works on a variant written
// as a single line - anything hand-written across several lines is left alone
// and reported, rather than guessed at.
// Clue words arrive from a text field, so they are checked before they reach
// the file: a stray quote or backslash would break deck.js on the next load and
// the whole game would come up blank.
function wordLiteral(word) {
  const w = String(word === null || word === undefined ? '' : word).trim().toUpperCase();
  if (!w) { return 'null'; }
  if (!/^[A-Z0-9 +&.!?-]{1,24}$/.test(w)) {
    throw new Error('"' + w + '" will not do as a clue word - letters, numbers, spaces and + - & . ! ? only');
  }
  return "'" + w + "'";
}

// Clearing the word of a lone picture means "the picture IS the clue" - which
// is a DIFFERENT variant type, not a rebus with a null word. Writing the null
// and stopping there produced a deck that failed to validate: a rebus clue
// must have a word. So the variant is rewritten as an image instead.
function blankToImage(text, words) {
  var slots = (text.match(/word:\s*(?:'[^']*'|null)/g) || []).length;
  var clearing = words.length === 1 && !String(words[0] || '').trim();
  if (!(slots === 1 && clearing)) { return null; }
  var img = (text.match(/img:\s*'([^']*)'/) || [])[1];
  if (!img) { return null; }
  return text.replace(/type:\s*'rebus',\s*clues:\s*\[[^\]]*\]/,
                      "type: 'image', img: '" + img + "'")
             .replace(/clues:\s*\[[^\]]*\],/, "type: 'image', img: '" + img + "',");
}

// Rewrite the clue words across a run of lines, in reading order. A clue list
// can span several lines (Malachi's does), so this walks the run rather than a
// single line. Only the positions the caller supplied change.
function applyWords(lines, from, to, words) {
  // A rebus of two or more pictures needs a word on every one of them: the
  // working line is what the pictures add up to, and a gap in it reads as a
  // mistake on the projector.
  var slots = 0;
  for (var c = from; c <= to; c++) {
    slots += (lines[c].match(/word:\s*(?:'[^']*'|null)/g) || []).length;
  }
  if (slots > 1 && words.some(function (w) { return !String(w || '').trim(); })) {
    throw new Error('a rebus of ' + slots + ' pictures needs a word on each one - '
      + 'to make the picture itself the clue, it has to be the only picture');
  }
  if (slots === 1 && from === to) {
    var swapped = blankToImage(lines[from], words);
    if (swapped) { lines[from] = swapped; return lines; }
  }
  let seen = -1;
  for (let n = from; n <= to; n++) {
    lines[n] = lines[n].replace(/word:\s*(?:'[^']*'|null)/g, (hit) => {
      seen++;
      if (words[seen] === undefined) { return hit; }
      return 'word: ' + wordLiteral(words[seen]);
    });
  }
  if (words.length > seen + 1) {
    throw new Error('that clue has ' + (seen + 1) + ' picture(s), so it cannot take '
      + words.length + ' words');
  }
  return lines;
}

// Where the clue list of a single-variant book starts and ends. Commented-out
// example lines are skipped - Ruth carries one, and matching it would edit a
// comment and leave the real clue untouched.
function clueSpan(block) {
  const from = block.findIndex((l) => !l.trim().startsWith('//') && /clues: \[/.test(l));
  if (from === -1) { return null; }
  let to = from;
  while (to < block.length && !/\],\s*$/.test(block[to])) { to++; }
  if (to >= block.length) { return null; }
  return { from, to };
}

function setVariant(g, id, index, fields) {
  const src = fs.readFileSync(g.deck, 'utf8');
  const { lines, start, end } = findBlock(src, id);
  const block = lines.slice(start, end + 1);

  const arrayStart = block.findIndex((l) => l.trim() === 'variants: [');

  if (arrayStart === -1) {
    // A single-variant book has no variants array: its difficulty and its clue
    // words sit on the puzzle's own lines. Weight is refused rather than
    // written, because with nothing to compete against it would do nothing and
    // still look like it had been set.
    if (index) { throw new Error('no variant ' + (index + 1) + ' on ' + id); }
    if (fields.weight !== undefined) {
      throw new Error('weight only counts once a book has a second variant');
    }
    if (fields.difficulty !== undefined) {
      const d = Number(fields.difficulty);
      if (!(d >= 1 && d <= 3)) { throw new Error('difficulty is 1, 2 or 3'); }
      const at = block.findIndex((l) => /difficulty: \d+/.test(l));
      if (at !== -1) {
        block[at] = block[at].replace(/difficulty: \d+/, 'difficulty: ' + d);
      } else {
        const idAt = block.findIndex((l) => /id: '/.test(l));
        block[idAt] = block[idAt].replace(/,?\s*$/, ', difficulty: ' + d + ',');
      }
    }
    if (fields.words && fields.words.length) {
      const span = clueSpan(block);
      if (!span) {
        throw new Error('that book shows a whole picture rather than word clues, so there is '
          + 'nothing to word - replace the picture instead');
      }
      applyWords(block, span.from, span.to, fields.words);
    }
    const nextLines = lines.slice(0, start).concat(block, lines.slice(end + 1));
    return writeDeckSafely(g, nextLines.join('\n'));
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
  if (fields.words && fields.words.length) {
    applyWords(block, at, at, fields.words);
  }
  const nextLines = lines.slice(0, start).concat(block, lines.slice(end + 1));
  return writeDeckSafely(g, nextLines.join('\n'));
}


// The 66 books, so adding one fills in its own reference rather than asking you
// to look up which division Zephaniah is in. Positions match the deck's
// existing entries: a grouped book takes the position of its first part, so
// Samuel is 9 and Kings is 11.
const CANON = [
  ['GENESIS', 'Old', 'Law', 1], ['EXODUS', 'Old', 'Law', 2],
  ['LEVITICUS', 'Old', 'Law', 3], ['NUMBERS', 'Old', 'Law', 4],
  ['DEUTERONOMY', 'Old', 'Law', 5],
  ['JOSHUA', 'Old', 'Historical', 6], ['JUDGES', 'Old', 'Historical', 7],
  ['RUTH', 'Old', 'Historical', 8], ['SAMUEL', 'Old', 'Historical', 9],
  ['KINGS', 'Old', 'Historical', 11], ['CHRONICLES', 'Old', 'Historical', 13],
  ['EZRA', 'Old', 'Historical', 15], ['NEHEMIAH', 'Old', 'Historical', 16],
  ['ESTHER', 'Old', 'Historical', 17],
  ['JOB', 'Old', 'Poetry', 18], ['PSALMS', 'Old', 'Poetry', 19],
  ['PROVERBS', 'Old', 'Poetry', 20], ['ECCLESIASTES', 'Old', 'Poetry', 21],
  ['SONG OF SOLOMON', 'Old', 'Poetry', 22],
  ['ISAIAH', 'Old', 'Major Prophets', 23], ['JEREMIAH', 'Old', 'Major Prophets', 24],
  ['LAMENTATIONS', 'Old', 'Major Prophets', 25], ['EZEKIEL', 'Old', 'Major Prophets', 26],
  ['DANIEL', 'Old', 'Major Prophets', 27],
  ['HOSEA', 'Old', 'Minor Prophets', 28], ['JOEL', 'Old', 'Minor Prophets', 29],
  ['AMOS', 'Old', 'Minor Prophets', 30], ['OBADIAH', 'Old', 'Minor Prophets', 31],
  ['JONAH', 'Old', 'Minor Prophets', 32], ['MICAH', 'Old', 'Minor Prophets', 33],
  ['NAHUM', 'Old', 'Minor Prophets', 34], ['HABAKKUK', 'Old', 'Minor Prophets', 35],
  ['ZEPHANIAH', 'Old', 'Minor Prophets', 36], ['HAGGAI', 'Old', 'Minor Prophets', 37],
  ['ZECHARIAH', 'Old', 'Minor Prophets', 38], ['MALACHI', 'Old', 'Minor Prophets', 39],
  ['MATTHEW', 'New', 'Gospels', 40], ['MARK', 'New', 'Gospels', 41],
  ['LUKE', 'New', 'Gospels', 42], ['JOHN', 'New', 'Gospels', 43],
  ['ACTS', 'New', 'History', 44],
  ['ROMANS', 'New', 'Epistles', 45], ['CORINTHIANS', 'New', 'Epistles', 46],
  ['GALATIANS', 'New', 'Epistles', 48], ['EPHESIANS', 'New', 'Epistles', 49],
  ['PHILIPPIANS', 'New', 'Epistles', 50], ['COLOSSIANS', 'New', 'Epistles', 51],
  ['THESSALONIANS', 'New', 'Epistles', 52], ['TIMOTHY', 'New', 'Epistles', 54],
  ['TITUS', 'New', 'Epistles', 56], ['PHILEMON', 'New', 'Epistles', 57],
  ['HEBREWS', 'New', 'General Epistles', 58], ['JAMES', 'New', 'General Epistles', 59],
  ['PETER', 'New', 'General Epistles', 60], ['JUDE', 'New', 'General Epistles', 65],
  ['REVELATION', 'New', 'Prophecy', 66],
];

// Append a new book to the puzzles array. Appended rather than slotted into
// canon order: play order is shuffled anyway, and inserting into the middle
// would mean guessing which of the division comments it belongs under.
function addBook(g, answer, clues, weight, difficulty, ref) {
  // Books come from the canon, so their reference is looked up and cannot be
  // wrong. Characters have no closed list: the name is typed, and the note
  // beside it is whatever the game master wants the room to be told after the
  // reveal - so it is checked for shape only.
  const entry = g.canon === 'books' ? CANON.find((c) => c[0] === answer) : null;
  if (g.canon === 'books' && !entry) {
    throw new Error(answer + ' is not one of the 66 books');
  }
  if (!g.canon && !/^[A-Z][A-Z0-9 '.-]{1,28}$/.test(answer)) {
    throw new Error('"' + answer + '" will not do as a name - letters, numbers, spaces and \' . - only');
  }
  // An apostrophe is fine in a name or a note - "Abraham's servant" - but it
  // would close the single-quoted literal it is written into, so it is escaped
  // on the way in rather than banned.
  const quoted = (t) => String(t).replace(/'/g, "\\'");
  const note = String(ref === null || ref === undefined ? '' : ref).trim();
  if (note && !/^[A-Za-z0-9 ,.;:'()&\u00b7-]{1,60}$/.test(note)) {
    throw new Error('that note has characters that would break the deck file');
  }

  const deck = loadDeck(g);
  if (deck.puzzles.some((p) => String(p.answer).toUpperCase() === answer)) {
    throw new Error(answer + ' is already in the deck');
  }

  // next free id, in the deck's own prefix
  const prefix = deck.idPrefix || 'bn';
  let n = 1;
  const used = new Set(deck.puzzles.map((p) => p.id));
  while (used.has(prefix + '-' + String(n).padStart(2, '0'))) { n++; }
  const id = prefix + '-' + String(n).padStart(2, '0');

  const anyWord = clues.some((c) => c.word);
  const clueBits = anyWord
    ? "      clues: ["
      + clues.map((c) => "{ img: '" + c.file + "', word: '" + (c.word || '?') + "' }").join(', ')
      + "],"
    : "      type: 'image', img: '" + clues[0].file + "',";

  const block = [
    '    {',
    '      // added with the deck manager',
    "      id: '" + id + "', answer: '" + quoted(answer) + "', difficulty: " + difficulty + ","
      + (weight > 1 ? ' weight: ' + weight + ',' : ''),
    entry
      ? "      ref: { testament: '" + entry[1] + "', division: '" + entry[2]
        + "', position: " + entry[3] + ' },'
      : (note ? "      ref: '" + quoted(note) + "'," : null),
    clueBits,
    '    },',
  ].filter((l) => l !== null);

  const src = fs.readFileSync(g.deck, 'utf8');
  const lines = src.split('\n');
  // the puzzles array closes with a line that is exactly "  ],"
  const close = lines.findIndex((l) => l === '  ],');
  if (close === -1) { throw new Error('could not find the end of the puzzles array'); }

  const next = lines.slice(0, close).concat(block, lines.slice(close));
  const after = writeDeckSafely(g, next.join('\n'), deck.puzzles.length + 1);
  return { id: id, answer: answer, total: after.puzzles.length };
}

// ---- quote decks ----------------------------------------------------------

// A quote is full of apostrophes - "brother's keeper" - and every one of them
// would close the single-quoted literal it is written into, so they are
// escaped on the way in. Backslashes and line breaks are refused outright:
// neither belongs in a line read aloud from a screen.
function quoteText(t, what) {
  const v = String(t === null || t === undefined ? '' : t).trim();
  if (/[\\\n\r]/.test(v)) {
    throw new Error('a ' + what + ' cannot contain a backslash or a line break');
  }
  if (v.length > 200) {
    throw new Error('that ' + what + ' is too long to read from the back of a hall');
  }
  return v;
}

function quoteRows(g) {
  const deck = loadDeck(g);
  return deck.puzzles.map((p) => ({
    id: p.id,
    answer: p.answer,
    difficulty: p.difficulty || 2,
    variants: (p.variants || [p]).map((v) => ({
      quote: v.quote || null,
      verse: v.verse || null,
      clue: v.clue || null,
      lang: v.lang || p.lang || 'en',
      answer: v.answer || null,
      difficulty: v.difficulty === undefined ? (p.difficulty || 2) : v.difficulty,
      unverified: v.flag === 'unverified',
      waiting: !v.quote,
    })),
  }));
}

// Find the lines of one variant inside a puzzle block. A quote variant is
// written over four lines - the head and quote/verse/clue - so unlike the
// picture decks this cannot edit a single line in place. Brace counting again:
// a regex over a nested literal grabs the wrong block, which it did once.
function variantSpan(block, index) {
  const arrayStart = block.findIndex((l) => l.trim() === 'variants: [');
  if (arrayStart === -1) { throw new Error('that puzzle has no variants array'); }
  const starts = [];
  let depth = 0;
  for (let i = arrayStart + 1; i < block.length; i++) {
    if (block[i].trim() === '],' && depth === 0) { break; }
    if (depth === 0 && /^\s+\{/.test(block[i])) { starts.push(i); }
    for (const ch of block[i]) {
      if (ch === '{') { depth++; }
      if (ch === '}') { depth--; }
    }
  }
  const from = starts[index];
  if (from === undefined) { throw new Error('no variant ' + (index + 1) + ' on that puzzle'); }
  let to = from;
  let open = 0;
  for (let i = from; i < block.length; i++) {
    for (const ch of block[i]) {
      if (ch === '{') { open++; }
      if (ch === '}') { open--; }
    }
    to = i;
    if (open === 0) { break; }
  }
  return { from, to };
}

function setQuote(g, id, index, fields) {
  const src = fs.readFileSync(g.deck, 'utf8');
  const { lines, start, end } = findBlock(src, id);
  const block = lines.slice(start, end + 1);
  const span = variantSpan(block, index);
  const text = block.slice(span.from, span.to + 1).join('\n');

  let next = text;
  const swap = (key, value) => {
    const lit = value === null ? 'null' : "'" + String(value).replace(/'/g, "\\'") + "'";
    const re = new RegExp(key + ":\\s*(?:'(?:[^'\\\\]|\\\\.)*'|null)");
    if (!re.test(next)) { throw new Error('cannot find ' + key + ' on that variant'); }
    next = next.replace(re, key + ': ' + lit);
  };

  if (fields.quote !== undefined) {
    const v = quoteText(fields.quote, 'quote');
    swap('quote', v || null);
  }
  if (fields.verse !== undefined) { swap('verse', quoteText(fields.verse, 'verse') || null); }
  if (fields.clue !== undefined) { swap('clue', quoteText(fields.clue, 'clue') || null); }
  if (fields.answer !== undefined) {
    const a = quoteText(fields.answer, 'name').toUpperCase();
    if (/answer: '/.test(next)) { swap('answer', a || null); }
    else if (a) { next = next.replace("type: 'quote',", "type: 'quote', answer: '" + a.replace(/'/g, "\\'") + "',"); }
  }
  if (fields.difficulty !== undefined) {
    const d = Number(fields.difficulty);
    if (!(d >= 1 && d <= 3)) { throw new Error('difficulty is 1, 2 or 3'); }
    if (/difficulty: \d/.test(next)) { next = next.replace(/difficulty: \d/, 'difficulty: ' + d); }
    else { next = next.replace("type: 'quote',", "type: 'quote', difficulty: " + d + ','); }
  }
  if (fields.verified !== undefined) {
    const done = fields.verified === true;
    const has = /flag: 'unverified',?\s?/.test(next);
    if (done && has) { next = next.replace(/flag: 'unverified',\s?/, ''); }
    if (!done && !has) { next = next.replace("type: 'quote',", "type: 'quote', flag: 'unverified',"); }
  }

  const out = block.slice(0, span.from)
    .concat(next.split('\n'))
    .concat(block.slice(span.to + 1));
  const nextLines = lines.slice(0, start).concat(out, lines.slice(end + 1));
  return writeDeckSafely(g, nextLines.join('\n'));
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
  // Resolved once, here, and closed over by the body callbacks below: if a
  // later request switched a shared variable mid-upload, one game's picture
  // could land in the other game's deck.
  const route = req.url.split('?')[0];
  const query = new URLSearchParams(req.url.split('?')[1] || '');
  const g = pickGame(query.get('game'));

  if (req.method === 'GET' && route === '/api/games') {
    return send(res, 200, JSON.stringify(GAMES.map((x) => ({
      slug: x.slug, title: x.title, canon: x.canon, kind: x.kind || 'pictures',
      exists: fs.existsSync(path.join(ROOT, 'games', x.slug, 'deck.js')),
    }))));
  }

  if (req.method === 'GET' && route === '/api/clues') {
    try { return send(res, 200, JSON.stringify(clueList(g))); }
    catch (e) { return send(res, 500, JSON.stringify({ error: e.message })); }
  }

  if (req.method === 'GET' && route === '/api/missing-books') {
    try {
      if (g.canon !== 'books') { return send(res, 200, JSON.stringify([])); }
      const have = new Set(loadDeck(g).puzzles.map((p) => String(p.answer).toUpperCase()));
      return send(res, 200, JSON.stringify(CANON
        .filter((c) => !have.has(c[0]))
        .map((c) => ({ answer: c[0], testament: c[1], division: c[2], position: c[3] }))));
    } catch (e) { return send(res, 500, JSON.stringify({ error: e.message })); }
  }

  if (req.method === 'POST' && route === '/api/add-book') {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_UPLOAD) { req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const written = [];
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const answer = String(body.answer || '').trim().toUpperCase();
        const weight = Math.max(1, Math.min(9, Number(body.weight) || 1));
        const difficulty = Math.max(1, Math.min(3, Number(body.difficulty) || 2));
        const incoming = Array.isArray(body.clues) ? body.clues : [];
        if (!answer || !incoming.length) { throw new Error('pick a book and a picture'); }

        const base = answer.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const clues = [];
        incoming.forEach((c, i) => {
          const ext = String(c.ext || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
          if (!TYPES[ext]) { throw new Error('unsupported file type ' + ext); }
          const bytes = Buffer.from(String(c.data || ''), 'base64');
          if (!bytes.length) { throw new Error('one of the files was empty'); }
          let name = incoming.length === 1 ? base + ext : base + '-' + (i + 1) + ext;
          let k = 1;
          while (fs.existsSync(path.join(g.images, name))) {
            k++;
            name = base + '-' + (i + 1) + '-' + k + ext;
          }
          fs.writeFileSync(path.join(g.images, name), bytes);
          shrink(path.join(g.images, name));
          written.push(path.join(g.images, name));
          clues.push({
            file: name,
            word: String(c.word || '').trim().toUpperCase().replace(/[^A-Z0-9 -]/g, ''),
          });
        });

        const out = addBook(g, answer, clues, weight, difficulty, body.note);
        send(res, 200, JSON.stringify({
          ok: true, id: out.id, answer: out.answer, total: out.total,
          files: clues.map((c) => c.file),
        }));
      } catch (e) {
        written.forEach((f) => { try { fs.unlinkSync(f); } catch (x) { /* ignore */ } });
        send(res, 400, JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && route === '/api/quotes') {
    try { return send(res, 200, JSON.stringify(quoteRows(g))); }
    catch (e) { return send(res, 500, JSON.stringify({ error: e.message })); }
  }

  if (req.method === 'POST' && route === '/api/set-quote') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        setQuote(g, String(body.id || ''), Number(body.index), body);
        send(res, 200, JSON.stringify({ ok: true }));
      } catch (e) {
        send(res, 400, JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && route === '/api/books') {
    try {
      const deck = loadDeck(g);
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

  if (req.method === 'POST' && route === '/api/add-variant') {
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

        const deck = loadDeck(g);
        const puzzle = deck.puzzles.find((p) => p.id === id);
        if (!puzzle) { throw new Error('no puzzle with id ' + id); }
        const base = String(puzzle.answer).toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Pick the next free variant number for this book.
        let vn = 2;
        while (fs.existsSync(path.join(g.images, base + '-' + vn + '-1.jpg'))
            || fs.existsSync(path.join(g.images, base + '-' + vn + '-1.png'))
            || fs.existsSync(path.join(g.images, base + '-' + vn + '.jpg'))
            || fs.existsSync(path.join(g.images, base + '-' + vn + '.png'))) { vn++; }

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
            fs.writeFileSync(path.join(g.images, name), bytes);
            shrink(path.join(g.images, name));
            written.push(path.join(g.images, name));
            clues.push({
              file: name,
              word: String(c.word || '').trim().toUpperCase().replace(/[^A-Z0-9 -]/g, ''),
            });
          });
          addVariant(g, id, clues, 'added with the deck manager', weight, difficulty);
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

  if (req.method === 'POST' && route === '/api/set-variant') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        setVariant(g, String(body.id || ''), Number(body.index), {
          weight: body.weight, difficulty: body.difficulty,
          words: Array.isArray(body.words) ? body.words : undefined,
        });
        send(res, 200, JSON.stringify({ ok: true }));
      } catch (e) {
        send(res, 400, JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && route === '/api/replace') {
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

        fs.writeFileSync(path.join(g.images, newName), bytes);
        const sized = shrink(path.join(g.images, newName));
        const deckNote = repointDeck(g, oldName, newName);
        // Remove the file the deck no longer points at.
        if (newName !== oldName && fs.existsSync(path.join(g.images, oldName))) {
          fs.unlinkSync(path.join(g.images, oldName));
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
  console.log('managing: ' + GAMES.map((x) => x.title).join(', '));
  console.log('Ctrl-C to stop');
});
