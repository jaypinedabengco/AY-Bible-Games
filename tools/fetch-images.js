/*
 * Source clue pictures from Wikimedia Commons.
 *
 *   node tools/fetch-images.js                # everything still missing
 *   node tools/fetch-images.js whale.jpg ham.jpg   # just these
 *   node tools/fetch-images.js --list         # what is missing, no downloads
 *
 * Only freely licensed files are accepted, and every download appends a row to
 * CREDITS.md with its source, author and licence. A file already on disk is
 * never re-fetched, so re-running this is safe and picks up where it stopped.
 *
 * Three files are deliberately NOT here - jerry.png, levis-logo.jpg and
 * xo.jpg are brand imagery and are added by hand. See spec 8.
 */
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const IMAGES = path.join(__dirname, '..', 'games', 'book-names', 'images');
const CREDITS = path.join(__dirname, '..', 'CREDITS.md');
const BY_HAND = ['jerry.png', 'levis-logo.jpg', 'xo.jpg'];

// Licences we will commit. Anything else is skipped and reported.
const OK_LICENCE = /public domain|^cc0|^cc[ -]by|^pd|no restrictions/i;

// filename -> what to search Commons for. Phrasing matters more than it looks:
// "single object white background" pulls clean product-style shots, which read
// far better on a projector than a busy scene.
const QUERIES = require('./image-queries.json');

const UA = { 'User-Agent': 'AY-Bible-Games/1.0 (church game; dev@worldready.ai)' };

function fetchText(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: UA }, r => {
      if (r.statusCode >= 300 && r.headers.location) {
        r.resume(); return fetchText(r.headers.location).then(res, rej);
      }
      let d = ''; r.setEncoding('utf8');
      r.on('data', c => { d += c; }); r.on('end', () => res(d));
    }).on('error', rej);
  });
}

function fetchBinary(url, dest) {
  return new Promise((res, rej) => {
    https.get(url, { headers: UA }, r => {
      if (r.statusCode >= 300 && r.headers.location) {
        r.resume(); return fetchBinary(r.headers.location, dest).then(res, rej);
      }
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      const out = fs.createWriteStream(dest);
      r.pipe(out);
      out.on('finish', () => res(fs.statSync(dest).size));
      out.on('error', rej);
    }).on('error', rej);
  });
}

function meta(v) { return (v && v.value ? String(v.value) : '').replace(/<[^>]*>/g, '').trim(); }

async function candidates(query) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json'
    // filetype:bitmap is essential - Commons full-text search otherwise
    // returns scanned PDFs whose PAGES contain the words.
    + '&generator=search&gsrsearch=' + encodeURIComponent(query + ' filetype:bitmap')
    + '&gsrnamespace=6&gsrlimit=8&prop=imageinfo'
    + '&iiprop=url|extmetadata|size&iiurlwidth=1400';
  const data = JSON.parse(await fetchText(url));
  if (!data.query || !data.query.pages) { return []; }
  return Object.values(data.query.pages).map(p => {
    const ii = (p.imageinfo || [])[0] || {};
    const em = ii.extmetadata || {};
    return {
      title: p.title.replace(/^File:/, ''),
      url: ii.thumburl || ii.url,
      page: ii.descriptionurl,
      licence: meta(em.LicenseShortName) || 'unknown',
      author: meta(em.Artist) || 'unknown',
      width: ii.thumbwidth || ii.width || 0,
    };
  }).filter(c => {
    // Commons appends tracking parameters to thumbnail URLs, so test the path
    // rather than the whole string or every candidate is discarded.
    if (!c.url) { return false; }
    try { return /\.(jpe?g|png)$/i.test(new URL(c.url).pathname); }
    catch (e) { return false; }
  });
}

async function one(name) {
  const query = QUERIES[name];
  if (!query) { return { name, status: 'no query defined' }; }
  const dest = path.join(IMAGES, name);
  if (fs.existsSync(dest)) { return { name, status: 'already present' }; }
  // Commons may hand back a PNG for a name ending .jpg. Saving it under the
  // wrong extension works in a browser, which sniffs content, but it is a lie
  // on disk and confuses anyone looking at the folder.
  const wantExt = path.extname(name).toLowerCase();

  let list;
  try { list = await candidates(query); }
  catch (e) { return { name, status: 'search failed: ' + e.message }; }

  const usable = list.filter(c => OK_LICENCE.test(c.licence) && c.width >= 600);
  if (!usable.length) {
    return { name, status: 'no freely licensed result (' + list.length + ' seen)' };
  }
  const pick = usable.find(c => path.extname(new URL(c.url).pathname).toLowerCase() === wantExt)
    || usable[0];
  try {
    const bytes = await fetchBinary(pick.url, dest);
    if (bytes < 4000) { fs.unlinkSync(dest); return { name, status: 'file too small' }; }
    return { name, status: 'ok', bytes, pick };
  } catch (e) { return { name, status: 'download failed: ' + e.message }; }
}

(async () => {
  const args = process.argv.slice(2);
  const listOnly = args.includes('--list');
  const wanted = args.filter(a => !a.startsWith('--'));
  const names = (wanted.length ? wanted : Object.keys(QUERIES))
    .filter(n => BY_HAND.indexOf(n) === -1)
    .filter(n => listOnly || !fs.existsSync(path.join(IMAGES, n)));

  if (listOnly) {
    const missing = names.filter(n => !fs.existsSync(path.join(IMAGES, n)));
    console.log(missing.length + ' still to fetch');
    console.log('by hand, not fetched here: ' + BY_HAND.join(', '));
    return;
  }

  const rows = [];
  let ok = 0, failed = 0;
  for (const name of names) {
    const r = await one(name);
    if (r.status === 'ok') {
      ok++;
      console.log('  ok    ' + name.padEnd(20) + (r.bytes / 1024).toFixed(0) + 'kB  ' + r.pick.licence);
      rows.push('| `' + name + '` | [' + r.pick.title.replace(/\|/g, '') + '](' + r.pick.page
        + ') | ' + r.pick.author.replace(/\|/g, '').slice(0, 60) + ' | ' + r.pick.licence + ' |');
    } else {
      failed++;
      console.log('  MISS  ' + name.padEnd(20) + r.status);
    }
  }
  if (rows.length) { fs.appendFileSync(CREDITS, rows.join('\n') + '\n'); }
  console.log('\nfetched ' + ok + ', missing ' + failed);
})();
