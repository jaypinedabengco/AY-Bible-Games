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
// failAt makes the N-th operation (any create* call, or start of an oscillator
// or buffer source) throw, so a test can stop play() at every point in the
// graph build. Pass -1 for no
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
      linearRampToValueAtTime(v, t) { this.ramps.push(['linear', v, t]); },
      exponentialRampToValueAtTime(v, t) { this.ramps.push(['exp', v, t]); },
      ramps: [],
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
    this.sampleRate = 8000; // small, so building the noise buffer is cheap
    this.destination = node('destination');
    log.ctx = this;
  }
  FakeAudioContext.prototype.createGain = function () {
    op();
    const n = node('gain');
    n.gain = param(1);
    return n;
  };
  FakeAudioContext.prototype.createBiquadFilter = function () {
    op();
    const n = node('filter');
    n.type = 'lowpass';
    n.frequency = param(350);
    n.Q = param(1);
    return n;
  };
  FakeAudioContext.prototype.createBuffer = function (channels, length) {
    op();
    return { getChannelData() { return new Float32Array(length); } };
  };
  FakeAudioContext.prototype.createBufferSource = function () {
    op();
    const n = node('bufferSource');
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

// Sources (oscillators and the noise buffer) that were started and never
// stopped: the leak the teardown must prevent.
function runningOscillators(log) {
  return log.nodes.filter((n) => (n.kind === 'oscillator' || n.kind === 'bufferSource')
    && n.started && !n.stopped);
}

// The four oscillators, in the order play() creates them: lead, arp, bass, kick.
function voices(log) {
  const [lead, arp, bass, kick] = log.nodes.filter((n) => n.kind === 'oscillator');
  return { lead, arp, bass, kick };
}

// Frequency of a MIDI note, written out here rather than imported so the tests
// do not share a mistake with the module.
function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

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
      assert.equal(started.length, 8, 'two plays start four oscillators each');
      // Four oscillators and the noise source from the second play only.
      assert.equal(runningOscillators(fake.log).length, 5, 'only the second play may still run');
    } finally { sound.stop(); }
    assert.equal(fake.log.intervals.size, 0);
    assert.equal(runningOscillators(fake.log).length, 0);
  } finally { restoreGlobals(saved); }
});

test('the first notes are scheduled before any tick, not left at the 440 Hz default', () => {
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);   // the tick is armed but never run in this test
    const sound = freshSound();
    try {
      assert.equal(sound.play(), true);
      assert.equal(fake.log.intervals.size, 1, 'the tick should be armed, not yet fired');
      const v = voices(fake.log);
      // Step 0 of the tune: lead C5, arpeggio C4, bass C3, and a kick.
      const first = (osc) => osc.frequency.scheduled[0];
      assert.ok(Math.abs(first(v.lead)[0] - 523.25) < 0.01, 'lead should open on C5');
      assert.ok(Math.abs(first(v.arp)[0] - 261.63) < 0.01, 'arpeggio should open on C4');
      assert.ok(Math.abs(first(v.bass)[0] - 130.81) < 0.01, 'bass should open on C3');
      assert.equal(first(v.kick)[0], 150, 'the kick should start from its own pitch');
      [v.lead, v.arp, v.bass, v.kick].forEach((osc) => {
        assert.ok(first(osc)[1] >= 0, 'a note must not be scheduled in the past');
        assert.notEqual(first(osc)[0], 440, 'an oscillator was left at its default pitch');
      });
    } finally { sound.stop(); }
  } finally { restoreGlobals(saved); }
});

test('every voice starts silent, so nothing sounds before its first note', () => {
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);
    const sound = freshSound();
    try {
      assert.equal(sound.play(), true);
      // The fake's gains start at 1. A voice or drum gain that play() forgot to
      // zero would still be at 1 here; the master is set well below that and every
      // other gain to 0, so nothing may be left above 0.5.
      const loud = fake.log.nodes.filter((n) => n.kind === 'gain' && n.gain.scheduled.length === 0
        && n.gain.value > 0.5);
      assert.equal(loud.length, 0, 'a gain was left at its default of 1');
    } finally { sound.stop(); }
  } finally { restoreGlobals(saved); }
});

test('each tick advances the tune: no note is repeated and none is skipped', () => {
  // Time is moved by hand. The first play() schedules a little way ahead of the
  // clock; ticks then schedule only what the clock has caught up to. A first
  // note that played twice would show as a repeated time, and a skipped note as
  // a lead frequency missing from the song's own order.
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);
    const sound = freshSound();
    try {
      assert.equal(sound.play(), true);
      const [tick] = [...fake.log.intervals.values()];
      const song = sound.song;
      const stepS = song.stepMs / 1000;
      const lead = voices(fake.log).lead;

      tick();
      tick();
      const beforeTime = lead.frequency.scheduled.length;
      // Ten seconds on, more than a whole loop, in the 50 ms steps of a timer.
      assert.doesNotThrow(() => {
        for (let ms = 50; ms <= 10000; ms += 50) {
          fake.log.ctx.currentTime = ms / 1000;
          tick();
        }
      });
      assert.ok(lead.frequency.scheduled.length > beforeTime, 'time moved on and nothing was scheduled');

      const scheduled = lead.frequency.scheduled;
      for (let i = 1; i < scheduled.length; i += 1) {
        assert.ok(scheduled[i][1] > scheduled[i - 1][1],
          'lead note ' + i + ' is not later than the one before it');
      }
      // The sequence of pitches is the song's lead line, in order, from the start.
      scheduled.forEach((entry, i) => {
        const expected = song.lead[i % song.lead.length];
        assert.ok(Math.abs(entry[0] - midiHz(expected.midi)) < 1e-6,
          'lead note ' + i + ' should be MIDI ' + expected.midi + ', got ' + entry[0] + ' Hz');
      });
      // Timing: each note sits on the sixteenth-note grid from the first one.
      const t0 = scheduled[0][1];
      scheduled.forEach((entry, i) => {
        const wantStep = song.lead[i % song.lead.length].step
          + Math.floor(i / song.lead.length) * song.steps;
        assert.ok(Math.abs(entry[1] - (t0 + wantStep * stepS)) < 1e-9,
          'lead note ' + i + ' is off the grid');
      });
    } finally { sound.stop(); }
  } finally { restoreGlobals(saved); }
});

test('a timer that was held up does not answer with a burst of notes in the past', () => {
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);
    const sound = freshSound();
    try {
      assert.equal(sound.play(), true);
      const [tick] = [...fake.log.intervals.values()];
      const lead = voices(fake.log).lead;
      fake.log.ctx.currentTime = 600;   // a laptop that slept for ten minutes
      tick();
      const late = lead.frequency.scheduled.filter((e) => e[1] < 600);
      assert.equal(late.length, lead.frequency.scheduled.filter((e) => e[1] < 1).length,
        'notes were scheduled in the past after a stall');
    } finally { sound.stop(); }
  } finally { restoreGlobals(saved); }
});

test('a failure inside a tick stops the music and does not throw into the page', () => {
  const saved = saveGlobals();
  try {
    const fake = fakeAudio(-1);
    globalThis.AudioContext = fake.FakeAudioContext;
    fakeTimers(fake.log);
    const sound = freshSound();
    try {
      assert.equal(sound.play(), true);
      const [tick] = [...fake.log.intervals.values()];
      voices(fake.log).lead.frequency.setValueAtTime = () => { throw new Error('context lost'); };
      fake.log.ctx.currentTime = 5;
      assert.doesNotThrow(() => tick());
      assert.equal(fake.log.intervals.size, 0, 'the ticker survived a failed tick');
      assert.equal(runningOscillators(fake.log).length, 0, 'a failed tick left a source running');
    } finally { sound.stop(); }
  } finally { restoreGlobals(saved); }
});

// What the owner asked for, pinned as structure. These do not prove the tune
// sounds good; they prove it cannot quietly go back to eight identical notes.
test('the tune is a long phrase with real rhythm: varied lengths, rests, no overlaps', () => {
  const { song } = freshSound();
  const loopSeconds = song.steps * song.stepMs / 1000;
  assert.ok(loopSeconds >= 12, 'the loop repeats after ' + loopSeconds + ' s; it should outlast most rounds');
  assert.ok(song.lead.length >= 40, 'too few lead notes for a phrase this long');

  const lengths = new Set(song.lead.map((n) => n.len));
  assert.ok(lengths.size >= 4, 'only ' + lengths.size + ' distinct note lengths: it is a stream again');

  const pitches = new Set(song.lead.map((n) => n.midi));
  assert.ok(pitches.size >= 8, 'too few distinct pitches');

  let rests = 0;
  song.lead.forEach((n, i) => {
    const next = song.lead[(i + 1) % song.lead.length];
    const nextStart = next.step + (i + 1 === song.lead.length ? song.steps : 0);
    assert.ok(n.step + n.len <= nextStart, 'note at step ' + n.step + ' runs into the next');
    if (n.step + n.len < nextStart) { rests += 1; }
  });
  assert.ok(rests >= 6, 'only ' + rests + ' rests');
});

test('the tune is bright and in key: major scale only, chord tones on beats 1 and 3', () => {
  const { song } = freshSound();
  const C_MAJOR = [0, 2, 4, 5, 7, 9, 11];
  song.lead.forEach((n) => {
    assert.ok(C_MAJOR.includes(n.midi % 12), 'MIDI ' + n.midi + ' at step ' + n.step + ' is out of C major');
    assert.ok(n.midi >= 67 && n.midi <= 84, 'MIDI ' + n.midi + ' is outside a comfortable range');
    const inBar = n.step % song.barSteps;
    if (inBar === 0 || inBar === 8) {
      const chord = song.chords[Math.floor(n.step / song.barSteps)];
      assert.ok(chord.pitchClasses.includes(n.midi % 12),
        'step ' + n.step + ' (' + chord.name + ') lands on a note that is not in the chord');
    }
  });
  const key = (c) => c.name;
  assert.equal(song.chords.length * song.barSteps, song.steps);
  assert.ok(new Set(song.chords.map(key)).size >= 5, 'the harmony barely moves');
  assert.ok(song.chords.some((c) => c.name === 'C') && song.chords.some((c) => c.name === 'G'));
});

test('the bass and arpeggio follow the chords, and the bass has a bar-length pattern', () => {
  const { song } = freshSound();
  song.chords.forEach((c, b) => {
    assert.equal(c.bass % 12, c.pitchClasses[0], 'bar ' + (b + 1) + ' bass is not the chord root');
    assert.ok(c.bass >= 38 && c.bass <= 57, 'bar ' + (b + 1) + ' bass is out of range');
    c.arp.forEach((m) => assert.ok(c.pitchClasses.includes(m % 12),
      'bar ' + (b + 1) + ' arpeggio plays a note outside ' + c.name));
  });
});

test('a graph that fails at any point while being built leaves nothing running', () => {
  // The module builds the graph in order, so a failure at operation k leaves
  // k-1 operations' worth of nodes behind. Before the fix, a failure after the
  // lead oscillator had started (while building a later voice) left that
  // oscillator playing for the life of the context. Every create* call and
  // every start() counts, including the noise buffer and its filters.
  const saved = saveGlobals();
  try {
    const dry = fakeAudio(-1);
    globalThis.AudioContext = dry.FakeAudioContext;
    fakeTimers(dry.log);
    const dryRun = freshSound();
    assert.equal(dryRun.play(), true, 'the unbroken build should succeed');
    dryRun.stop();
    const total = dry.log.ops;
    assert.ok(total >= 20, 'expected the whole graph (four oscillators, noise, filters, gains), saw ' + total);

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
