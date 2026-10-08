'use strict';
// The one random number in this project that is deliberately NOT reproducible.
// Every other test here asserts that a rebuild gives an identical result; this
// one asserts the opposite, because "nobody can anticipate the stop" is the
// whole mechanic and a seeded delay is one a room can learn.
const test = require('node:test');
const assert = require('node:assert/strict');
const util = require('node:util');
const SOUND = require.resolve('../core/sound.js');
require(SOUND);
const { delayMs } = globalThis.BibleGames.sound;

// The HIGHEST value Math.random can meaningfully return short of 1. Used to
// reach the top of a range exactly.
const HIGH = 1 - 1e-12;

// Values in this file are chosen so that the right answer and each plausible
// wrong answer print as different numbers. The default range is 6-20 seconds,
// so any test about a supplied range uses [10, 30] instead: a version that
// ignored the range and used the default would otherwise pass by coincidence.
// Malformed inputs are the one place the default is the expected answer.

function draws(range, n) {
  const out = [];
  for (let i = 0; i < n; i += 1) { out.push(delayMs(range)); }
  return out;
}

// Replaces Math.random with a fixed sequence (the last value repeats once the
// sequence runs out), restoring the real one however fn ends. Returns the
// result of fn and how many times Math.random was consulted.
function withRandom(sequence, fn) {
  const real = Math.random;
  let calls = 0;
  Math.random = () => {
    const v = sequence[Math.min(calls, sequence.length - 1)];
    calls += 1;
    return v;
  };
  try {
    return { result: fn(), calls };
  } finally {
    Math.random = real;
  }
}

// The module caches its AudioContext and its ticker in closure variables, so
// one test's fake would otherwise leak into the next. Every test that touches
// play() or stop() loads a fresh copy of the module: deleting it from
// require.cache makes the next require run the IIFE again, with empty state.
// The previous copy's ticker is stopped by each test's own finally.
function freshSound() {
  delete require.cache[SOUND];
  require(SOUND);
  return globalThis.BibleGames.sound;
}

const GLOBAL_NAMES = ['AudioContext', 'webkitAudioContext', 'setInterval', 'clearInterval'];

function saveGlobals() {
  const saved = { random: Math.random };
  GLOBAL_NAMES.forEach((name) => { saved[name] = globalThis[name]; });
  return saved;
}

function restoreGlobals(saved) {
  Math.random = saved.random;
  GLOBAL_NAMES.forEach((name) => {
    if (saved[name] === undefined) { delete globalThis[name]; } else { globalThis[name] = saved[name]; }
  });
}

// A stand-in for the Web Audio API that records everything the module does.
// failAt makes the N-th operation (createGain, createOscillator or start) throw,
// so a test can stop play() at every point in the graph build. Pass -1 for no
// failure. log.ops counts operations, so a run with no failure gives the total.
function fakeAudio(failAt) {
  const log = { nodes: [], ops: 0 };
  function op() {
    log.ops += 1;
    if (log.ops === failAt) { throw new Error('fake audio failed at operation ' + log.ops); }
  }
  function param(value) {
    return {
      value,
      scheduled: [],
      setValueAtTime(v, t) { this.value = v; this.scheduled.push([v, t]); },
      cancelScheduledValues() {},
      exponentialRampToValueAtTime() {},
    };
  }
  function node(kind) {
    const n = {
      kind,
      started: false,
      stopped: false,
      disconnected: false,
      connect() {},
      disconnect() { n.disconnected = true; },
    };
    log.nodes.push(n);
    return n;
  }
  function FakeAudioContext() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = node('destination');
  }
  FakeAudioContext.prototype.createGain = function () {
    op();
    const n = node('gain');
    n.gain = param(1);
    return n;
  };
  FakeAudioContext.prototype.createOscillator = function () {
    op();
    const n = node('oscillator');
    n.type = 'sine';
    n.frequency = param(440); // what a real oscillator starts at
    n.start = function () {
      op();
      n.started = true;
    };
    n.stop = function () {
      if (!n.started) { throw new Error('stop() before start()'); }
      n.stopped = true;
    };
    return n;
  };
  return { FakeAudioContext, log };
}

// Intervals are recorded, not run, so a test controls when a tick happens.
function fakeTimers(log) {
  log.intervals = new Map();
  let next = 1;
  globalThis.setInterval = function (fn) {
    const id = next;
    next += 1;
    log.intervals.set(id, fn);
    return id;
  };
  globalThis.clearInterval = function (id) { log.intervals.delete(id); };
}

// Oscillators that were started and never stopped: the leak the teardown must prevent.
function runningOscillators(log) {
  return log.nodes.filter((n) => n.kind === 'oscillator' && n.started && !n.stopped);
}

test('the delay stays inside the range it was given', () => {
  const out = draws([10, 30], 500);
  const bad = out.filter((ms) => ms < 10000 || ms > 30000);
  assert.deepEqual(bad, [], 'drew outside 10-30s: ' + bad.join(', '));
});

test('the delay is drawn fresh: 500 draws are not a handful of values', () => {
  // This is a sanity check on the output. It cannot prove there is no seed,
  // because a seeded PRNG also gives many distinct values. The stub test below
  // is the one that proves the source.
  assert.ok(new Set(draws([10, 30], 500)).size > 50,
    'the delay repeats itself - it must be drawn fresh every round');
});

test('delayMs reads Math.random fresh on every call', () => {
  // A seeded implementation has its own generator and never consults
  // Math.random, so it cannot produce these three values in this order.
  const { result, calls } = withRandom([0, 0.5, HIGH],
    () => [delayMs([10, 30]), delayMs([10, 30]), delayMs([10, 30])]);
  assert.equal(calls, 3, 'Math.random was not consulted once per call');
  assert.deepEqual(result, [10000, 20000, 30000]);
});

test('Math.random at 0 gives the low bound exactly, and near 1 the high bound', () => {
  assert.equal(withRandom([0], () => delayMs([10, 30])).result, 10000);
  assert.equal(withRandom([HIGH], () => delayMs([10, 30])).result, 30000);
  assert.equal(withRandom([0.25], () => delayMs([10, 30])).result, 15000);
});

test('the delay uses the whole range, not a corner of it', () => {
  const out = draws([10, 30], 500);
  assert.ok(Math.min(...out) < 15000, 'never draws near the short end');
  assert.ok(Math.max(...out) > 25000, 'never draws near the long end');
});

test('a malformed range falls back to the 6-20 second default, at both ends', () => {
  // These come from a hand-written deck, where a mistake is a missing field or
  // a value that is not a number - not a crash. A NaN delay never fires and the
  // game stops dead in front of a room. A range patched endpoint by endpoint
  // ([10] becoming 10-20 s) gives a wrong answer at the low end, so both ends
  // are checked. A reversed pair is not malformed; it is tested separately.
  const bad = [undefined, null, [], [0, 0], ['a', 'b'], [NaN, 5], [30, 90], [10]];
  bad.forEach((range) => {
    const low = withRandom([0], () => delayMs(range)).result;
    const high = withRandom([HIGH], () => delayMs(range)).result;
    assert.equal(low, 6000, util.inspect(range) + ' did not fall back to 6s');
    assert.equal(high, 20000, util.inspect(range) + ' did not fall back to 20s');
  });
});

test('a reversed pair with two valid ends is swapped, not defaulted', () => {
  // [30, 10] is chosen because its swapped answer (10-30 s) matches neither the
  // default (6-20 s) nor the unswapped pair. Without the swap, the low stub
  // gives 30000 rather than 10000. With a default fallback, it gives 6000.
  // Each wrong behaviour prints a visibly different number at one end or the other.
  const low = withRandom([0], () => delayMs([30, 10])).result;
  const high = withRandom([HIGH], () => delayMs([30, 10])).result;
  assert.equal(low, 10000, 'the low end should be 10 s, the swapped lower bound');
  assert.equal(high, 30000, 'the high end should be 30 s, the swapped upper bound');
});

test('no AudioContext in the environment: play() says so and does not throw', () => {
  const saved = saveGlobals();
  try {
    delete globalThis.AudioContext;
    delete globalThis.webkitAudioContext;
    const sound = freshSound();
    try {
      assert.equal(sound.play(), false);
      assert.doesNotThrow(() => sound.stop());
    } finally { sound.stop(); }
  } finally { restoreGlobals(saved); }
});

test('an AudioContext whose constructor throws makes play() return false', () => {
  const saved = saveGlobals();
  try {
    globalThis.AudioContext = function () { throw new Error('blocked by the browser'); };
    const sound = freshSound();
    try {
      assert.equal(sound.play(), false);
      assert.doesNotThrow(() => sound.stop());
    } finally { sound.stop(); }
  } finally { restoreGlobals(saved); }
});

test('stop() is safe with nothing playing, and safe to call twice', () => {
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);
    const sound = freshSound();
    assert.doesNotThrow(() => sound.stop());
    assert.equal(sound.play(), true);
    assert.doesNotThrow(() => { sound.stop(); sound.stop(); });
    assert.equal(fake.log.intervals.size, 0);
    assert.equal(runningOscillators(fake.log).length, 0);
  } finally { restoreGlobals(saved); }
});

test('calling play() twice leaves one ticker, and the first graph is torn down', () => {
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);
    const sound = freshSound();
    try {
      assert.equal(sound.play(), true);
      assert.equal(sound.play(), true);
      assert.equal(fake.log.intervals.size, 1, 'a second play() must not add a ticker');
      const started = fake.log.nodes.filter((n) => n.kind === 'oscillator' && n.started);
      assert.equal(started.length, 4, 'two plays start two oscillators each');
      assert.equal(runningOscillators(fake.log).length, 2, 'only the second play may still run');
    } finally { sound.stop(); }
    assert.equal(fake.log.intervals.size, 0);
    assert.equal(runningOscillators(fake.log).length, 0);
  } finally { restoreGlobals(saved); }
});

test('the first note is scheduled before any tick, not left at the 440 Hz default', () => {
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);   // the tick is armed but never run in this test
    const sound = freshSound();
    try {
      assert.equal(sound.play(), true);
      assert.equal(fake.log.intervals.size, 1, 'the tick should be armed, not yet fired');
      const oscs = fake.log.nodes.filter((n) => n.kind === 'oscillator');
      const lead = oscs.find((n) => n.type === 'triangle');
      const bass = oscs.find((n) => n.type === 'sine');
      assert.deepEqual(lead.frequency.scheduled[0], [523.25, 0]);
      assert.deepEqual(bass.frequency.scheduled[0], [130.81, 0]);
    } finally { sound.stop(); }
  } finally { restoreGlobals(saved); }
});

test('each tick advances the loop: a repeated first note cannot pass', () => {
  // The notes are chosen so a repeat is visible. LEAD[0] (523.25) and LEAD[1]
  // (659.25) differ, so the lead shows whether the first note was doubled. BASS[0]
  // and BASS[1] are both 130.81, so the bass cannot show that on its own: its
  // third note, BASS[2] = 164.81, is checked after a second tick instead.
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);
    const sound = freshSound();
    try {
      assert.equal(sound.play(), true);
      const [tick] = [...fake.log.intervals.values()];
      assert.doesNotThrow(() => { tick(); tick(); });
      const oscs = fake.log.nodes.filter((n) => n.kind === 'oscillator');
      const lead = oscs.find((n) => n.type === 'triangle');
      const bass = oscs.find((n) => n.type === 'sine');
      assert.deepEqual(lead.frequency.scheduled[1], [659.25, 0], 'after one tick, LEAD[1]');
      assert.deepEqual(lead.frequency.scheduled[2], [783.99, 0], 'after two ticks, LEAD[2]');
      assert.deepEqual(bass.frequency.scheduled[2], [164.81, 0], 'after two ticks, BASS[2]');
    } finally { sound.stop(); }
  } finally { restoreGlobals(saved); }
});

test('a graph that fails at any point while being built leaves nothing running', () => {
  // The module builds the graph in order, so a failure at operation k leaves
  // k-1 operations' worth of nodes behind. Before the fix, a failure after the
  // lead oscillator had started (operations 5-7, while building the bass) left
  // that oscillator playing for the life of the context.
  const saved = saveGlobals();
  try {
    const dry = fakeAudio(-1);
    globalThis.AudioContext = dry.FakeAudioContext;
    fakeTimers(dry.log);
    const dryRun = freshSound();
    assert.equal(dryRun.play(), true, 'the unbroken build should succeed');
    dryRun.stop();
    const total = dry.log.ops;
    assert.ok(total >= 7, 'expected at least 7 operations, saw ' + total);

    for (let k = 1; k <= total; k += 1) {
      const fake = fakeAudio(k);
      globalThis.AudioContext = fake.FakeAudioContext;
      fakeTimers(fake.log);
      const sound = freshSound();
      try {
        assert.equal(sound.play(), false, 'a failure at operation ' + k + ' must report no sound');
        assert.deepEqual(runningOscillators(fake.log).map((n) => n.type), [],
          'a failure at operation ' + k + ' left an oscillator running');
        assert.equal(fake.log.intervals.size, 0,
          'a failure at operation ' + k + ' left a ticker armed');
      } finally { sound.stop(); }
    }
  } finally { restoreGlobals(saved); }
});

test('a successful play() then stop() tears down every oscillator it started', () => {
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);
    const sound = freshSound();
    assert.equal(sound.play(), true);
    sound.stop();
    assert.equal(runningOscillators(fake.log).length, 0);
    assert.equal(fake.log.intervals.size, 0);
  } finally { restoreGlobals(saved); }
});
