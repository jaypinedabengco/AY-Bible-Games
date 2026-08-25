'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('../core/images.js');
const { candidates, makeResolver } = globalThis.BibleGames.images;

const DIRS = ['override/', 'images/'];   // generic: the resolver takes any ordered list

test('a bare filename becomes one candidate per directory, in order', () => {
  assert.deepEqual(candidates('jerry.png', DIRS),
    ['override/jerry.png', 'images/jerry.png']);
});

test('a full URL or data URI is its own only candidate', () => {
  assert.deepEqual(candidates('https://example.com/a.jpg', DIRS),
    ['https://example.com/a.jpg']);
  assert.deepEqual(candidates('data:image/png;base64,AAA', DIRS),
    ['data:image/png;base64,AAA']);
});

test('the earlier directory wins when both exist', async () => {
  const resolve = makeResolver(DIRS, () => Promise.resolve(true));
  assert.equal(await resolve('jerry.png'), 'override/jerry.png');
});

test('resolution falls through to the committed directory', async () => {
  const load = (url) => Promise.resolve(url.startsWith('images/'));
  const resolve = makeResolver(DIRS, load);
  assert.equal(await resolve('root.jpg'), 'images/root.jpg');
});

test('a name in no directory resolves to null', async () => {
  const resolve = makeResolver(DIRS, () => Promise.resolve(false));
  assert.equal(await resolve('missing.jpg'), null);
});

test('resolution is memoised so the chain is probed once', async () => {
  let calls = 0;
  const load = (url) => { calls++; return Promise.resolve(url.startsWith('images/')); };
  const resolve = makeResolver(DIRS, load);
  await resolve('root.jpg');
  const after = calls;
  await resolve('root.jpg');
  assert.equal(calls, after, 'second call re-probed');
});

test('candidates are tried in order, not in parallel', async () => {
  const seen = [];
  const load = (url) => { seen.push(url); return Promise.resolve(url.startsWith('images/')); };
  await makeResolver(DIRS, load)('root.jpg');
  assert.deepEqual(seen, ['override/root.jpg', 'images/root.jpg']);
});
