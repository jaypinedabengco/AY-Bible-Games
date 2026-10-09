/*
 * The music for Hot Potato, and the one random number in this project that is
 * deliberately NOT reproducible.
 *
 * Everywhere else here, randomness is seeded so a rebuild produces an
 * identical deck: a mistyped fact is only wrong once, on a projector, in front
 * of a room. Here reproducibility is the bug. "Nobody can anticipate the stop"
 * is the whole mechanic, and a seeded delay is one that a teenager who has
 * played twice can learn. So: Math.random, re-rolled every round.
 *
 * No audio FILES. A hymn being public domain does not make a RECORDING of it
 * public domain, and nothing here should need carrying on the USB stick. The
 * loop is built from oscillators instead.
 *
 * Audio NEVER blocks play. If AudioContext is missing, blocked, or throws, the
 * game runs silently and every timer still fires. A church laptop with its
 * output muted must still be able to play this game, so every path through
 * this file returns rather than raising.
 */
(function (root) {
  'use strict';

  var DEFAULT_RANGE = [6, 20];   // seconds
  var MIN_SECONDS = 1;
  var MAX_SECONDS = 60;

  // null for anything that is not a usable number of seconds, so the caller
  // decides what a bad endpoint means for the pair as a whole.
  function seconds(value) {
    var n = Number(value);
    if (!isFinite(n) || n < MIN_SECONDS || n > MAX_SECONDS) { return null; }
    return n;
  }

  // Milliseconds to wait before the music stops. Every input is treated as
  // suspect: the range comes from a hand-written deck, where a mistake is a
  // reversed pair or a missing field rather than a crash, and a NaN delay is a
  // timer that never fires and a game that stops dead in front of a room.
  function delayMs(range) {
    var raw = range || [];
    var lo = seconds(raw[0]);
    var hi = seconds(raw[1]);
    // One bad endpoint discards the whole pair. Patching a single endpoint
    // with a default would turn [NaN, 5] into a 5-6 second window that nobody
    // wrote.
    if (lo === null || hi === null) { lo = DEFAULT_RANGE[0]; hi = DEFAULT_RANGE[1]; }
    if (hi < lo) { var swap = lo; lo = hi; hi = swap; }
    return Math.round((lo + Math.random() * (hi - lo)) * 1000);
  }

  // ---------------------------------------------------------------------
  // The tune. Original, in C major, 134 BPM, eight bars of 4/4 that last about
  // fourteen seconds before they repeat. Rounds run 6 to 20 seconds, so most
  // rounds end before the tune comes round again.
  //
  // The grid is sixteenth notes (one STEP). A note is [start step in the bar,
  // MIDI pitch, length in steps]; a gap between notes is a rest. Every lead
  // note ends before the next begins, which is what lets each one be a plain
  // envelope with no cancelling of earlier automation.
  //
  //   bar  1    2    3    4    5    6    7    8
  //        C    G    Am   F    C    Em   F    G7      I V vi IV I iii IV V7
  //
  // Bars 1-4 are a question: the lead climbs, the bass walks down and back
  // (C G A F). Bars 5-8 are the answer: the lead repeats a note and then leaps,
  // the bass climbs (C E F G) so the second half lifts, and the last bar runs
  // down the scale with a snare roll, which is the tension that pushes into the
  // repeat. Every note is in C major, and the notes on beats 1 and 3 are chord
  // tones, so nothing sours however the bars are joined.
  // ---------------------------------------------------------------------
  var STEP_MS = 112;                 // one sixteenth note
  var STEP_S = STEP_MS / 1000;
  var BAR_STEPS = 16;

  var LEAD_BARS = [
    [[0, 72, 2], [2, 76, 2], [4, 79, 3], [7, 76, 1], [8, 79, 2], [10, 84, 5]],
    [[0, 83, 2], [2, 79, 2], [4, 74, 3], [7, 79, 1], [8, 83, 4], [12, 81, 2], [14, 79, 1]],
    [[2, 76, 2], [4, 81, 2], [6, 84, 2], [8, 84, 3], [11, 83, 1], [12, 81, 4]],
    [[0, 77, 2], [2, 81, 2], [4, 84, 3], [7, 81, 1], [8, 77, 2], [10, 76, 2], [12, 74, 2]],
    [[0, 79, 1], [1, 79, 1], [2, 79, 2], [4, 84, 3], [7, 79, 1], [8, 76, 2], [10, 79, 2], [12, 72, 3]],
    [[0, 76, 1], [1, 76, 1], [2, 76, 2], [4, 83, 3], [7, 79, 1], [8, 76, 2], [10, 79, 2], [12, 83, 3]],
    [[0, 77, 1], [1, 77, 1], [2, 77, 2], [4, 84, 3], [7, 81, 1], [8, 77, 2], [10, 81, 2], [12, 84, 3]],
    [[0, 83, 2], [2, 81, 2], [4, 79, 2], [6, 77, 2], [8, 74, 4], [12, 71, 2], [14, 74, 2]]
  ];

  // One entry per bar. bass is the root; arp is the voicing the arpeggio walks
  // through; pitchClasses (0 = C) is what counts as a chord tone in that bar.
  var CHORDS = [
    { name: 'C',  pitchClasses: [0, 4, 7],     bass: 48, arp: [60, 64, 67] },
    { name: 'G',  pitchClasses: [7, 11, 2],    bass: 43, arp: [59, 62, 67] },
    { name: 'Am', pitchClasses: [9, 0, 4],     bass: 45, arp: [60, 64, 69] },
    { name: 'F',  pitchClasses: [5, 9, 0],     bass: 41, arp: [60, 65, 69] },
    { name: 'C',  pitchClasses: [0, 4, 7],     bass: 48, arp: [60, 64, 67] },
    { name: 'Em', pitchClasses: [4, 7, 11],    bass: 52, arp: [59, 64, 67] },
    { name: 'F',  pitchClasses: [5, 9, 0],     bass: 53, arp: [60, 65, 69] },
    { name: 'G7', pitchClasses: [7, 11, 2, 5], bass: 55, arp: [59, 62, 65] }
  ];

  // [start step, semitones above the root, length]. Root, root, fifth, root,
  // root, fifth: x..x..x.x..x..x. is a syncopated bounce rather than a march.
  var BASS_PATTERN = [[0, 0, 2], [3, 0, 2], [6, 7, 2], [8, 0, 2], [11, 0, 2], [14, 7, 2]];
  // Which chord tone the arpeggio plays on each eighth note of a bar.
  var ARP_PATTERN = [0, 2, 1, 2, 0, 2, 1, 2];

  var BARS = LEAD_BARS.length;
  var LOOP_STEPS = BARS * BAR_STEPS;

  // The song flattened to one lookup per step, built once at load, so playing
  // a step is an array read.
  function buildSteps() {
    var steps = [];
    var lead = [];
    var i;
    for (i = 0; i < LOOP_STEPS; i += 1) { steps.push({}); }
    LEAD_BARS.forEach(function (bar, b) {
      var chord = CHORDS[b];
      bar.forEach(function (n) {
        var at = b * BAR_STEPS + n[0];
        steps[at].lead = { midi: n[1], len: n[2] };
        lead.push({ step: at, midi: n[1], len: n[2] });
      });
      BASS_PATTERN.forEach(function (n) {
        steps[b * BAR_STEPS + n[0]].bass = { midi: chord.bass + n[1], len: n[2] };
      });
      for (i = 0; i < BAR_STEPS; i += 2) {
        steps[b * BAR_STEPS + i].arp = {
          midi: chord.arp[ARP_PATTERN[i / 2]],
          accent: i % 4 === 2   // the off-beat eighths carry the bounce
        };
      }
      for (i = 0; i < BAR_STEPS; i += 1) {
        var s = steps[b * BAR_STEPS + i];
        var lifted = b >= 4;
        var last = b === BARS - 1;
        // Kick: beats 1 and 3, a pickup on odd bars; the second half goes to
        // four on the floor.
        if (lifted ? i % 4 === 0 : (i === 0 || i === 8 || (i === 10 && b % 2 === 1))) { s.kick = 1; }
        // Snare on 2 and 4; the last bar rolls into the repeat.
        if (last && i >= 12) { s.snare = 0.5 + (i - 12) * 0.2; }
        else if (i === 4 || i === 12) { s.snare = 0.8; }
        // Hat on every eighth, the off-beats stronger; ghost sixteenths in the
        // second half.
        if (i % 2 === 0) { s.hat = i % 4 === 2 ? 1 : 0.55; }
        else if (lifted) { s.hat = 0.3; }
      }
    });
    return { steps: steps, lead: lead };
  }

  var BUILT = buildSteps();
  var STEPS = BUILT.steps;

  // Read-only description of the tune, for the tests and for anyone checking it
  // without a speaker to hand.
  var SONG = {
    stepMs: STEP_MS,
    barSteps: BAR_STEPS,
    steps: LOOP_STEPS,
    chords: CHORDS,
    lead: BUILT.lead
  };

  // ---------------------------------------------------------------------
  // Playing it. Five voices, all made of oscillators and one looping noise
  // buffer, all running for the life of a round; a note is only a change of
  // pitch and an envelope on the gain in front of its voice.
  // ---------------------------------------------------------------------
  var TICK_MS = 50;      // how often the scheduler wakes
  var AHEAD_S = 0.3;     // how far ahead of the audio clock it schedules
  var MASTER = 0.16;
  var SILENT = 0.0001;   // exponential ramps cannot reach 0

  var ctx = null;
  var parts = null;   // { nodes: every node created for the current play() }
  var ticker = null;

  function context() {
    if (ctx) { return ctx; }
    var Ctor = root.AudioContext || root.webkitAudioContext;
    if (!Ctor) { return null; }
    try { ctx = new Ctor(); } catch (e) { ctx = null; }
    return ctx;
  }

  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  // Each node is recorded the moment it exists, so a throw partway through
  // building the graph still leaves stop() able to reach everything that was
  // created. The alternative, assigning parts only once the graph is complete,
  // left a started oscillator running for the life of the context.
  function track(graph, node) {
    graph.nodes.push(node);
    return node;
  }

  // oscillator -> (optional low-pass) -> gain -> out. The gain starts at 0 so
  // a voice is silent until its first note rather than sounding at the
  // oscillator's default 440 Hz.
  function voice(c, graph, out, type, filterHz) {
    var osc = track(graph, c.createOscillator());
    var amp = track(graph, c.createGain());
    var filter = null;
    osc.type = type;
    amp.gain.value = 0;
    amp.connect(out);
    if (filterHz) {
      filter = track(graph, c.createBiquadFilter());
      filter.type = 'lowpass';
      filter.frequency.value = filterHz;
      osc.connect(filter);
      filter.connect(amp);
    } else {
      osc.connect(amp);
    }
    osc.start();
    return { osc: osc, amp: amp, filter: filter };
  }

  // A second of white noise on a loop. Filled from a small deterministic
  // generator rather than Math.random: this file's one unseeded random number
  // is the stop delay, and nothing else should draw from it.
  function noiseSource(c, graph) {
    var rate = c.sampleRate || 44100;
    var buffer = c.createBuffer(1, rate, rate);
    var data = buffer.getChannelData(0);
    var seed = 12345;
    for (var i = 0; i < data.length; i += 1) {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      data[i] = seed / 2147483648 - 1;
    }
    var src = track(graph, c.createBufferSource());
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  function filteredNoise(c, graph, src, out, type, freq, q) {
    var filter = track(graph, c.createBiquadFilter());
    var amp = track(graph, c.createGain());
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    amp.gain.value = 0;
    src.connect(filter);
    filter.connect(amp);
    amp.connect(out);
    return amp;
  }

  // A short attack and an exponential fall to near silence over `seconds`.
  function envelope(param, t, peak, seconds) {
    param.setValueAtTime(SILENT, t);
    param.linearRampToValueAtTime(peak, t + 0.008);
    param.exponentialRampToValueAtTime(SILENT, t + seconds);
  }

  // Everything that sounds at one step, starting at audio time t.
  function playStep(g, step, t) {
    var s = STEPS[step % LOOP_STEPS];
    var e;
    if (s.lead) {
      e = s.lead;
      var len = e.len * STEP_S;
      g.lead.osc.frequency.setValueAtTime(hz(e.midi), t);
      // Bright at the pluck, mellower as it dies: a marimba-ish tone, not a buzz.
      g.lead.filter.frequency.setValueAtTime(3800, t);
      g.lead.filter.frequency.exponentialRampToValueAtTime(1100, t + len * 0.9);
      envelope(g.lead.amp.gain, t, step % 4 === 0 ? 0.42 : 0.32, len * 0.92);
    }
    if (s.arp) {
      g.arp.osc.frequency.setValueAtTime(hz(s.arp.midi), t);
      envelope(g.arp.amp.gain, t, s.arp.accent ? 0.2 : 0.1, STEP_S * 1.6);
    }
    if (s.bass) {
      g.bass.osc.frequency.setValueAtTime(hz(s.bass.midi), t);
      envelope(g.bass.amp.gain, t, 0.55, s.bass.len * STEP_S * 0.95);
    }
    if (s.kick) {
      g.kick.osc.frequency.setValueAtTime(150, t);
      g.kick.osc.frequency.exponentialRampToValueAtTime(48, t + 0.08);
      envelope(g.kick.amp.gain, t, 0.9, 0.2);
    }
    if (s.snare) { envelope(g.snare.gain, t, 0.3 * s.snare, 0.13); }
    if (s.hat) { envelope(g.hat.gain, t, 0.1 * s.hat, 0.045); }
  }

  function play() {
    stop();
    var c = context();
    if (!c) { return false; }
    var graph = { nodes: [] };
    parts = graph;
    try {
      // Browsers suspend a context created outside a gesture. The spacebar
      // that starts the round IS the gesture, so this resume is the one that
      // matters and a rejected promise is not a reason to fail.
      if (c.state === 'suspended' && c.resume) {
        var resumed = c.resume();
        if (resumed && resumed.catch) { resumed.catch(function () {}); }
      }
      var master = track(graph, c.createGain());
      master.gain.value = MASTER;
      master.connect(c.destination);
      graph.lead = voice(c, graph, master, 'square', 3800);
      graph.arp = voice(c, graph, master, 'sine', 0);
      graph.bass = voice(c, graph, master, 'triangle', 0);
      graph.kick = voice(c, graph, master, 'sine', 0);
      var noise = noiseSource(c, graph);
      graph.hat = filteredNoise(c, graph, noise, master, 'highpass', 7500, 0.7);
      graph.snare = filteredNoise(c, graph, noise, master, 'bandpass', 1900, 0.8);
      noise.start();

      // Steps are scheduled against the audio clock, a little ahead of it,
      // rather than played when a timer happens to fire: a timer on a busy
      // page is late by tens of milliseconds, which turns a rhythm into a
      // stumble, and the audio clock is not late.
      var step = 0;
      var next = c.currentTime + 0.02;
      var schedule = function () {
        var limit = c.currentTime + AHEAD_S;
        // A timer that was held up must not be answered with a burst of
        // notes in the past.
        if (next < c.currentTime) { next = c.currentTime; }
        while (next < limit) {
          playStep(graph, step, next);
          step += 1;
          next += STEP_S;
        }
      };
      // Called once synchronously, before the interval is armed, so the first
      // notes are already scheduled. Without that, every oscillator sits at its
      // default 440 Hz until the first tick.
      schedule();
      ticker = setInterval(function () {
        try { schedule(); } catch (e) { stop(); }
      }, TICK_MS);
      return true;
    } catch (e) {
      stop();
      return false;
    }
  }

  // Safe to call when nothing is playing, and safe to call twice. boot.js
  // calls it on every redraw, which is the only reason the music cannot
  // outlive the screen that started it.
  function stop() {
    if (ticker) { clearInterval(ticker); ticker = null; }
    if (!parts) { return; }
    var dead = parts;
    parts = null;
    dead.nodes.forEach(function (node) {
      // Oscillators that never reached start() throw here. That is expected.
      try { if (typeof node.stop === 'function') { node.stop(); } } catch (e) { /* never started */ }
      try { node.disconnect(); } catch (e) { /* already gone */ }
    });
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.sound = { delayMs: delayMs, play: play, stop: stop, song: SONG };
})(typeof globalThis !== 'undefined' ? globalThis : window);
