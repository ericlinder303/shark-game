/* =========================================================================
 * audio.js — All game sound, synthesized with the Web Audio API.
 *
 * No audio files: every sound is generated from oscillators + filtered noise,
 * so it works offline and adds zero assets. Exposed as window.Sfx.
 *
 * Browsers block audio until a user gesture, so the AudioContext is created
 * lazily and resumed on the first pointer/key event.
 * ========================================================================= */

(function () {
  let ctx = null, master = null;
  let muted = false;
  const SAVE = "shark_game_muted_v1";
  try { muted = localStorage.getItem(SAVE) === "1"; } catch (e) {}

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.85;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // unlock on first interaction
  const unlock = () => ensure();
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);

  // A single enveloped oscillator note.
  function tone(freq, opts) {
    opts = opts || {};
    if (!ensure() || muted) return;
    const { type = "sine", dur = 0.2, gain = 0.3, attack = 0.005, slideTo = null, when = 0 } = opts;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.03);
  }

  // A burst of filtered noise (splashes, snaps).
  function noise(dur, opts) {
    opts = opts || {};
    if (!ensure() || muted) return;
    const { type = "lowpass", freq = 1200, q = 0.8, gain = 0.4, when = 0, slideTo = null } = opts;
    const t = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.03);
  }

  // ---- the sound palette -------------------------------------------------
  function splash(strength) {
    const s = strength || 1;
    noise(0.22 * s + 0.08, { type: "bandpass", freq: 1500, slideTo: 380, q: 0.7, gain: 0.32 * s });
    tone(190, { type: "sine", dur: 0.18, gain: 0.18 * s, slideTo: 90 });
  }
  function bite() {
    splash(0.7);
    tone(150, { type: "sine", dur: 0.16, gain: 0.22, slideTo: 320 }); // upward "grab"
  }
  function snap() {
    noise(0.07, { type: "highpass", freq: 3200, gain: 0.5 });
    tone(880, { type: "square", dur: 0.12, gain: 0.22, slideTo: 180 });
    tone(120, { type: "sine", dur: 0.22, gain: 0.22, slideTo: 55, when: 0.02 });
  }
  function surge() {
    tone(430, { type: "sawtooth", dur: 0.11, gain: 0.16, slideTo: 650 });
    tone(650, { type: "sawtooth", dur: 0.11, gain: 0.14, when: 0.12 });
  }
  function fanfare(big) {
    const seq = big ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
    seq.forEach((f, i) => tone(f, { type: "triangle", dur: 0.2, gain: 0.2, when: i * 0.09 }));
  }
  function coin() {
    tone(988, { type: "square", dur: 0.07, gain: 0.14 });
    tone(1319, { type: "square", dur: 0.12, gain: 0.14, when: 0.07 });
  }
  function escape() {
    tone(440, { type: "triangle", dur: 0.18, gain: 0.18, slideTo: 330 });
    tone(300, { type: "triangle", dur: 0.3, gain: 0.16, slideTo: 200, when: 0.16 });
  }
  function click() { tone(420, { type: "square", dur: 0.04, gain: 0.09 }); }
  function achievement() {
    [784, 1047, 1319, 1568].forEach((f, i) => tone(f, { type: "triangle", dur: 0.16, gain: 0.16, when: i * 0.07 }));
  }

  // ratcheting reel — repeated ticks while reeling
  let reelTimer = null;
  function startReel() {
    if (reelTimer) return;
    const tick = () => tone(250 + Math.random() * 50, { type: "square", dur: 0.03, gain: 0.07, attack: 0.001 });
    tick();
    reelTimer = setInterval(tick, 95);
  }
  function stopReel() { if (reelTimer) { clearInterval(reelTimer); reelTimer = null; } }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(SAVE, muted ? "1" : "0"); } catch (e) {}
    if (master) master.gain.value = muted ? 0 : 0.85;
    if (muted) stopReel();
    if (!muted) ensure();
    return muted;
  }
  function isMuted() { return muted; }

  window.Sfx = { splash, bite, snap, surge, fanfare, coin, escape, click, achievement, startReel, stopReel, toggleMute, isMuted, ensure };
})();
