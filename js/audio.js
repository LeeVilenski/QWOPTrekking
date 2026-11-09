// Light generative music and sound effects using the Web Audio API (no audio files needed).
window.Sound = (function () {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let muted = false, timer = null, nextNote = 0, beat = 0;
  // D major pentatonic, two octaves
  const scale = [62, 64, 66, 69, 71, 74, 76, 78, 81];
  const bass = [38, 38, 43, 45];
  let melodyIdx = 4;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.13; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.35; sfxGain.connect(master);
    nextNote = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 100);
  }

  function pluck(time, midi, dur, vol, type) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "triangle";
    o.frequency.value = mtof(midi);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o.connect(g); g.connect(musicGain);
    o.start(time); o.stop(time + dur + 0.05);
  }

  function schedule() {
    const step = 0.3; // seconds per eighth note
    while (nextNote < ctx.currentTime + 0.4) {
      const t = nextNote;
      if (beat % 8 === 0) pluck(t, bass[(beat / 8) % bass.length], 2.2, 0.5, "sine");
      if (beat % 8 === 4) pluck(t, bass[(beat / 8 | 0) % bass.length] + 7, 1.2, 0.25, "sine");
      if (Math.random() < 0.55) {
        melodyIdx = Math.max(0, Math.min(scale.length - 1, melodyIdx + [-2, -1, -1, 1, 1, 2][Math.random() * 6 | 0]));
        pluck(t, scale[melodyIdx], 0.8, 0.35);
        if (Math.random() < 0.15) pluck(t, scale[melodyIdx] + 12, 0.5, 0.12, "sine");
      }
      nextNote += step; beat++;
    }
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  return {
    init,
    step() { tone(90 + Math.random() * 30, 0.08, "sine", 0.5, 50); },
    shuffle() { tone(200, 0.06, "square", 0.08, 150); },
    fall() { tone(320, 0.6, "sawtooth", 0.2, 70); setTimeout(() => tone(80, 0.3, "sine", 0.6, 40), 450); },
    snack() { tone(660, 0.12, "triangle", 0.3); setTimeout(() => tone(990, 0.2, "triangle", 0.3), 90); },
    bells() { for (let i = 0; i < 6; i++) setTimeout(() => tone(1400 + Math.random() * 300, 0.25, "triangle", 0.12), i * 220 + Math.random() * 80); },
    engine() {
      // jeep rumbles into life and pulls away
      tone(55, 1.6, "sawtooth", 0.12, 110);
      setTimeout(() => tone(70, 2.2, "sawtooth", 0.1, 160), 500);
      setTimeout(() => { tone(600, 0.15, "square", 0.05); setTimeout(() => tone(600, 0.25, "square", 0.05), 200); }, 900); // beep beep
    },
    gust() { tone(500, 0.5, "sine", 0.05, 300); },
    finish() { [0, 150, 300, 500].forEach((d, i) => setTimeout(() => tone([587, 740, 880, 1175][i], 0.4, "triangle", 0.3), d)); },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.8;
      return muted;
    },
    get muted() { return muted; }
  };
})();
