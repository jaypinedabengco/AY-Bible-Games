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

  function seconds(value, fallback) {
    var n = Number(value);
    if (!isFinite(n) || n < MIN_SECONDS || n > MAX_SECONDS) { return fallback; }
    return n;
  }

  // Milliseconds to wait before the music stops. Every input is treated as
  // suspect: the range comes from a hand-written deck, where a mistake is a
  // reversed pair or a missing field rather than a crash, and a NaN delay is a
  // timer that never fires and a game that stops dead in front of a room.
  function delayMs(range) {
    var raw = range || [];
    var lo = seconds(raw[0], DEFAULT_RANGE[0]);
    var hi = seconds(raw[1], DEFAULT_RANGE[1]);
    if (hi < lo) { var swap = lo; lo = hi; hi = swap; }
    return Math.round((lo + Math.random() * (hi - lo)) * 1000);
  }

  // A cheerful pentatonic loop over a walking bass. Deliberately plain: this
  // plays under a room talking and laughing, and its only real job is to stop.
  var STEP_MS = 180;
  var LEAD = [523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880.00, 783.99];
  var BASS = [130.81, 130.81, 164.81, 164.81, 146.83, 146.83, 174.61, 174.61];

  var ctx = null;
  var parts = null;
  var ticker = null;

  function context() {
    if (ctx) { return ctx; }
    var Ctor = root.AudioContext || root.webkitAudioContext;
    if (!Ctor) { return null; }
    try { ctx = new Ctor(); } catch (e) { ctx = null; }
    return ctx;
  }

  function voice(c, out, type, gain) {
    var osc = c.createOscillator();
    var amp = c.createGain();
    osc.type = type;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(out);
    osc.start();
    return { osc: osc, amp: amp };
  }

  function play() {
    stop();
    var c = context();
    if (!c) { return false; }
    try {
      // Browsers suspend a context created outside a gesture. The spacebar
      // that starts the round IS the gesture, so this resume is the one that
      // matters and a rejected promise is not a reason to fail.
      if (c.state === 'suspended' && c.resume) {
        var resumed = c.resume();
        if (resumed && resumed.catch) { resumed.catch(function () {}); }
      }
      var master = c.createGain();
      master.gain.value = 0.09;
      master.connect(c.destination);
      var lead = voice(c, master, 'triangle', 0.0);
      var bass = voice(c, master, 'sine', 0.35);
      parts = { master: master, lead: lead, bass: bass };

      var step = 0;
      ticker = setInterval(function () {
        if (!parts) { return; }
        var now = c.currentTime;
        parts.lead.osc.frequency.setValueAtTime(LEAD[step % LEAD.length], now);
        parts.bass.osc.frequency.setValueAtTime(BASS[step % BASS.length], now);
        // A plucked envelope rather than a held tone, so eight notes read as
        // eight notes from the back of a hall.
        parts.lead.amp.gain.cancelScheduledValues(now);
        parts.lead.amp.gain.setValueAtTime(0.5, now);
        parts.lead.amp.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        step += 1;
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
    try {
      [dead.lead, dead.bass].forEach(function (v) {
        try { v.osc.stop(); } catch (e) { /* already stopped */ }
        try { v.osc.disconnect(); } catch (e) { /* already gone */ }
        try { v.amp.disconnect(); } catch (e) { /* already gone */ }
      });
      dead.master.disconnect();
    } catch (e) { /* tearing down a dead graph is not a failure */ }
  }

  root.BibleGames = root.BibleGames || {};
  root.BibleGames.sound = { delayMs: delayMs, play: play, stop: stop };
})(typeof globalThis !== 'undefined' ? globalThis : window);
