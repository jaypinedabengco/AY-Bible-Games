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

  // A cheerful pentatonic loop over a walking bass. Deliberately plain: this
  // plays under a room talking and laughing, and its only real job is to stop.
  var STEP_MS = 180;
  var LEAD = [523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880.00, 783.99];
  var BASS = [130.81, 130.81, 164.81, 164.81, 146.83, 146.83, 174.61, 174.61];

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

  // Each node is recorded the moment it exists, so a throw partway through
  // building the graph still leaves stop() able to reach everything that was
  // created. The alternative, assigning parts only once the graph is complete,
  // left a started oscillator running for the life of the context.
  function track(graph, node) {
    graph.nodes.push(node);
    return node;
  }

  function voice(c, graph, out, type, gain) {
    var osc = track(graph, c.createOscillator());
    var amp = track(graph, c.createGain());
    osc.type = type;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(out);
    osc.start();
    return { osc: osc, amp: amp };
  }

  // One note of the loop. Called once synchronously from play(), before the
  // interval is armed, so the first note is already scheduled. Without that,
  // both oscillators sit at their default 440 Hz until the first tick, and a
  // 440 Hz blip goes through the hall PA at the start of every round.
  function pluck(c, lead, bass, step) {
    var now = c.currentTime;
    lead.osc.frequency.setValueAtTime(LEAD[step % LEAD.length], now);
    bass.osc.frequency.setValueAtTime(BASS[step % BASS.length], now);
    // A plucked envelope rather than a held tone, so eight notes read as
    // eight notes from the back of a hall.
    lead.amp.gain.cancelScheduledValues(now);
    lead.amp.gain.setValueAtTime(0.5, now);
    lead.amp.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
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
      master.gain.value = 0.09;
      master.connect(c.destination);
      var lead = voice(c, graph, master, 'triangle', 0.0);
      var bass = voice(c, graph, master, 'sine', 0.35);

      var step = 0;
      pluck(c, lead, bass, step);
      step += 1;
      ticker = setInterval(function () {
        try {
          pluck(c, lead, bass, step);
          step += 1;
        } catch (e) {
          stop();
        }
      }, STEP_MS);
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
  root.BibleGames.sound = { delayMs: delayMs, play: play, stop: stop };
})(typeof globalThis !== 'undefined' ? globalThis : window);
