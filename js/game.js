// QWOP Trekking: a wobbly walking sim of Ryan's Annapurna trek.
(function () {
  "use strict";

  // ---------- Tuning ----------
  // Real metres per game metre. One scale for every day, so a ~15 km day takes ~15 minutes.
  // Elevation uses the same compression, so slopes stay as steep as the real trail.
  const H_SCALE = 20;
  const V_EXAG = 1.3;     // vertical exaggeration so the climbs look as hard as they felt
  const BASE_STRIDE = 1.25;
  const FALL_ANGLE = 1.1; // radians of lean before Ryan topples
  const THIGH = 0.5, SHIN = 0.5, TORSO = 0.6;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const controlsEl = document.getElementById("controls");
  const muteBtn = document.getElementById("mute");

  let W = 0, H = 0, DPR = 1, S = 50; // S = pixels per game metre
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    S = Math.max(28, Math.min(W / 13, H / 8.5));
  }
  window.addEventListener("resize", resize);
  resize();

  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Optional face photo: drop a square, front-on photo at assets/ryan-face.png
  const faceImg = new Image();
  let faceReady = false;
  faceImg.onload = () => { faceReady = true; };
  faceImg.src = "assets/ryan-face.png";

  // ---------- Level / terrain ----------
  let L, END_X, BASE_ELEV;
  const kmToX = (km) => km * 1000 / H_SCALE;
  const xToKm = (x) => x * H_SCALE / 1000;

  function elevAt(km) {
    const p = L.profile;
    if (km <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) {
      if (km <= p[i][0]) {
        const a = p[i - 1], b = p[i];
        const t = (km - a[0]) / (b[0] - a[0]);
        const s = t * t * (3 - 2 * t) * 0.5 + t * 0.5; // slightly smoothed
        return a[1] + (b[1] - a[1]) * s;
      }
    }
    return p[p.length - 1][1];
  }
  function bumps(x) { return Math.sin(x * 0.9) * 0.08 + Math.sin(x * 2.3 + 1) * 0.04 + Math.sin(x * 0.21) * 0.25; }
  function baseGround(x) {
    x = Math.max(-40, Math.min(END_X + 40, x));
    return (elevAt(xToKm(x)) - BASE_ELEV) / H_SCALE * V_EXAG + bumps(x);
  }
  // Suspension bridge: a sagging, bouncing deck between two anchors
  const bridge = { a: 0, b: 0, amp: 0, on: false };
  function inBridge(x) { return L.bridge && x > bridge.a && x < bridge.b; }
  function bridgeY(x) {
    const u = (x - bridge.a) / (bridge.b - bridge.a);
    const ya = baseGround(bridge.a), yb = baseGround(bridge.b);
    return ya + (yb - ya) * u - Math.sin(Math.PI * u) * 1.1 + Math.sin(Math.PI * u) * Math.sin(t * 5.5) * bridge.amp;
  }
  function groundY(x) { return inBridge(x) ? bridgeY(x) : baseGround(x); }
  function gorgeY(x) {
    if (!inBridge(x)) return baseGround(x);
    const u = (x - bridge.a) / (bridge.b - bridge.a);
    return Math.min(baseGround(x), groundY(x)) - Math.pow(Math.sin(Math.PI * u), 0.3) * 30;
  }
  function onWet(x) { return inZone(L.wet || [], x); }
  function inZone(zones, x) {
    const km = xToKm(x);
    for (const z of zones) if (km >= z[0] && km <= z[1]) return true;
    return false;
  }
  const STEP_W = 0.55;
  function onStairs(x) { return !inBridge(x) && inZone(L.stairs, x); }
  function footY(x) {
    if (!onStairs(x)) return groundY(x);
    const xs = Math.floor(x / STEP_W) * STEP_W;
    return groundY(xs + STEP_W);
  }
  function grade(x) { return (groundY(x + 1.5) - groundY(x - 1.5)) / 3; }
  function weatherAt(x) {
    const km = xToKm(x);
    for (const w of L.weather) if (km >= w.from && km <= w.to) return w.type;
    return null;
  }

  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  // ---------- Game state ----------
  let state = "title"; // title | play | fallen | finished
  let t = 0, playTime = 0;
  let P; // player
  let snacks, friends, popups, gust, weatherIntensity, rainDrops;
  let porters, ghost, stats, donkeyTrains, donkeys, dust, shake = 0, nextMutter = 6, mutter = null;
  const input = { poles: false, fwd: false, back: false };

  function newGame() {
    L = window.LEVELS[0];
    BASE_ELEV = L.profile[0][1];
    END_X = kmToX(L.lengthKm);
    if (L.bridge) { bridge.a = kmToX(L.bridge[0]); bridge.b = kmToX(L.bridge[1]); }
    bridge.amp = 0; bridge.on = false;
    porters = (L.porters || []).map((km, i) => ({ triggerX: kmToX(km), x: null, phase: 0, done: false, hit: false, load: i % 3, sayT: 0 }));
    buildGhost();
    const x0 = 2;
    P = {
      x: x0, targetX: x0, lean: 0, leanVel: 0, stamina: 100,
      lastLeg: -1, lastStepT: -10, phase: 0,
      feet: [mkFoot(x0 - 0.15), mkFoot(x0 + 0.15)],
      fall: null, armSwing: 0
    };
    snacks = L.snacks.map((s) => ({ x: kmToX(s.km), type: s.type, taken: false }));
    friends = L.friends.map((f, i) => ({ triggerX: kmToX(f.km), say: f.say, x: null, phase: 0, idx: i, done: false, sayT: 0 }));
    popups = [];
    gust = { t: 0, next: 3, force: 0 };
    weatherIntensity = { drizzle: 0, wind: 0 };
    rainDrops = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 0.6 }));
    stats = { steps: 0, falls: 0, snacks: 0, bonks: 0 };
    donkeyTrains = (L.donkeys || []).map((km) => ({ x: kmToX(km), started: false }));
    donkeys = []; dust = []; shake = 0; nextMutter = 6; mutter = null;
    playTime = 0;
  }
  function mkFoot(x) { return { x, y: 0, fromX: x, toX: x, t: 1 }; }
  newGame();
  for (const f of P.feet) f.y = footY(f.x);

  function popup(text, color, big) {
    if (!big && popups.some((p) => !p.big && p.t < 0.8)) return;
    popups.push({ text, color: color || "#fff", t: 0, big: !!big });
  }

  // ---------- Input ----------
  function startOrStep(leg) {
    Sound.init();
    if (state === "title") { state = "play"; controlsEl.classList.toggle("show", isTouch); popup(L.title, "#fff", true); return; }
    if (state === "finished") { if (t - stats.finishT > 1.5) { newGame(); for (const f of P.feet) f.y = footY(f.x); state = "play"; } return; }
    if (state === "play" && leg >= 0) step(leg);
  }

  window.addEventListener("keydown", (e) => {
    if (e.repeat) { if (["Space", "ArrowDown", "ArrowUp", "KeyS", "KeyW"].includes(e.code)) e.preventDefault(); return; }
    const k = e.code;
    if (k === "KeyA" || k === "ArrowLeft" || k === "KeyQ") { startOrStep(0); e.preventDefault(); }
    else if (k === "KeyD" || k === "ArrowRight" || k === "KeyP") { startOrStep(1); e.preventDefault(); }
    else if (k === "Space") { input.poles = true; if (state !== "play") startOrStep(-1); e.preventDefault(); }
    else if (k === "KeyW" || k === "ArrowUp") { input.fwd = true; if (state !== "play") startOrStep(-1); e.preventDefault(); }
    else if (k === "KeyS" || k === "ArrowDown") { input.back = true; if (state !== "play") startOrStep(-1); e.preventDefault(); }
    else if (k === "KeyM") toggleMute();
    else if (state !== "play") startOrStep(-1);
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") input.poles = false;
    if (e.code === "KeyW" || e.code === "ArrowUp") input.fwd = false;
    if (e.code === "KeyS" || e.code === "ArrowDown") input.back = false;
  });

  canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); if (state !== "play") startOrStep(-1); });

  for (const b of controlsEl.querySelectorAll(".btn")) {
    const act = b.dataset.act;
    const down = (e) => {
      e.preventDefault(); b.classList.add("down");
      if (act === "P" || act === "F" || act === "B") {
        input[act === "P" ? "poles" : act === "F" ? "fwd" : "back"] = true;
        if (state !== "play") startOrStep(-1);
      } else startOrStep(act === "L" ? 0 : 1);
    };
    const up = (e) => { e.preventDefault(); b.classList.remove("down");
      if (act === "P") input.poles = false; if (act === "F") input.fwd = false; if (act === "B") input.back = false; };
    b.addEventListener("pointerdown", down);
    b.addEventListener("pointerup", up);
    b.addEventListener("pointercancel", up);
    b.addEventListener("pointerleave", up);
  }
  function toggleMute() { Sound.init(); const m = Sound.toggleMute(); muteBtn.textContent = m ? "×" : "♪"; muteBtn.style.opacity = m ? 0.6 : 1; }
  muteBtn.addEventListener("pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); toggleMute(); });
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  // ---------- Mechanics ----------
  function altFactor() { return Math.max(0, Math.min(1, (elevAt(xToKm(P.x)) - 1400) / 3200)); }

  function step(leg) {
    if (P.fall) return;
    const g = grade(P.x);
    const since = t - P.lastStepT;
    const foot = P.feet[leg];
    let stride;

    if (leg === P.lastLeg) {
      // Same leg twice: an awkward little shuffle
      stride = 0.12;
      P.leanVel += (Math.random() - 0.5) * 1.4;
      Sound.shuffle();
      if (Math.random() < 0.25) popup(["shuffle shuffle", "other leg, Ryan", "hop?"][Math.random() * 3 | 0], "#ffe28a");
    } else {
      const idealLean = Math.max(-0.35, Math.min(0.35, g * 0.6));
      const quality = Math.max(0.25, 1 - Math.abs(P.lean - idealLean) * 1.3);
      const staminaF = P.stamina <= 0 ? 0.3 : 0.55 + 0.45 * Math.min(1, P.stamina / 60);
      const slopeF = g > 0 ? Math.max(0.35, 1 - g * 0.7) : 1 + Math.min(0.5, -g * 0.5);
      stride = BASE_STRIDE * quality * staminaF * slopeF * (1 - altFactor() * 0.3) * (input.poles ? 0.75 : 1);
      if (since < 0.13) { // mashing
        stride *= 0.5;
        P.leanVel += 0.9;
        popup("too fast!", "#ffb08a");
      }
      P.leanVel += 0.55 * (stride / BASE_STRIDE) + Math.max(0, -g) * 0.7;
      if (onWet(P.x) && !input.poles && Math.random() < 0.4) {
        // foot skates on wet stone
        P.leanVel += (Math.random() < 0.5 ? -1 : 1) * (1.0 + Math.random() * 0.8);
        stride *= 0.4;
        popup(["slippery!", "whoa whoa whoa", "wet rock!"][Math.random() * 3 | 0], "#9fd8ff");
        Sound.shuffle();
      }
      if (inBridge(P.x)) bridge.amp = Math.min(0.55, bridge.amp + (input.poles ? 0.03 : 0.08));
      Sound.step();
    }
    P.stamina = Math.max(0, P.stamina - (0.22 + Math.max(0, g) * 1.7));
    P.targetX = Math.max(P.targetX, P.x) + stride;
    foot.fromX = foot.x;
    foot.toX = Math.max(foot.x, P.targetX + stride * 0.3);
    foot.t = 0;
    for (let i = 0; i < 4; i++) dust.push({ x: foot.toX + (Math.random() - 0.5) * 0.3, y: footY(foot.toX) + 0.05, vx: (Math.random() - 0.5) * 1.2, vy: Math.random() * 0.8, t: 0 });
    P.lastLeg = leg;
    P.lastStepT = t;
    stats.steps++;
  }

  function startFall(dir) {
    const g = grade(P.x);
    let slide = g > 0.03 ? -1 : g < -0.03 ? 1 : 0;
    const dist = 1.5 + Math.random() * 2.5 + Math.abs(g) * 4;
    P.fall = { t: 0, dir, slide, dist, startX: P.x, rot: 0 };
    stats.falls++;
    shake = 0.5;
    P.stamina = Math.max(0, P.stamina - 6);
    Sound.fall();
    const quips = [
      "Ryan has become one with the mountain.",
      "Knees: 0. Nepal: 1.",
      "That was on purpose. Rest stop.",
      "A porter carrying a fridge just overtook you.",
      "Bistaarai! (slowly, slowly)",
      "The Keens did not grip.",
      "Strava will call that a 'pause'.",
      "Gravity: still working."
    ];
    popup(quips[stats.falls % quips.length], "#fff", true);
    state = "fallen";
  }

  function updateFall(dt) {
    const f = P.fall;
    f.t += dt;
    const slideT = 1.6;
    if (f.t < slideT) {
      const k = f.t / slideT;
      const ease = 1 - Math.pow(1 - k, 2);
      P.x = Math.max(1, f.startX + f.slide * f.dist * ease);
      f.rot = f.dir * Math.min(1, f.t / 0.35) * Math.PI / 2 + (f.slide !== 0 ? -f.slide * f.dist * ease / 0.45 : 0);
    } else if (f.t < slideT + 0.6) {
      // lying there, contemplating life choices
      const r = f.dir * Math.PI / 2;
      const full = Math.round((f.rot - r) / (Math.PI * 2)) * Math.PI * 2 + r;
      f.rot += (full - f.rot) * Math.min(1, dt * 10);
    } else if (f.t < slideT + 1.3) {
      const k = (f.t - slideT - 0.6) / 0.7;
      const r = Math.round(f.rot / (Math.PI / 2)) * Math.PI / 2;
      f.rot = r * (1 - k);
    } else {
      P.fall = null;
      P.lean = 0; P.leanVel = 0;
      P.targetX = P.x;
      P.feet = [mkFoot(P.x - 0.15), mkFoot(P.x + 0.15)];
      for (const ft of P.feet) ft.y = footY(ft.x);
      P.lastLeg = -1;
      state = "play";
    }
  }

  function update(dt) {
    t += dt;
    for (const p of popups) p.t += dt;
    popups = popups.filter((p) => p.t < (p.big ? 3 : 1.2));

    // Weather blending
    const w = weatherAt(P.x);
    weatherIntensity.drizzle += ((w === "drizzle" ? 1 : 0) - weatherIntensity.drizzle) * Math.min(1, dt * 0.8);
    weatherIntensity.wind += ((w === "wind" ? 1 : 0) - weatherIntensity.wind) * Math.min(1, dt * 0.8);

    if (state === "title") { idleFriends(dt); return; }
    if (state === "finished") return;

    playTime += dt;

    for (const d of dust) { d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; }
    dust = dust.filter((d) => d.t < 0.6);
    if (state === "fallen") { updateFall(dt); updateFriends(dt); updateDonkeys(dt); return; }

    // Gusts
    gust.next -= dt;
    if (gust.t > 0) gust.t -= dt; else gust.force = 0;
    if (weatherIntensity.wind > 0.5 && gust.next <= 0) {
      gust.t = 1.1; gust.next = 3 + Math.random() * 3;
      gust.force = (Math.random() < 0.65 ? -1 : 1) * (1.2 + Math.random() * 1.2);
      popup(gust.force < 0 ? "headwind!" : "tailwind!", "#cfe8ff");
      Sound.gust();
    }

    // Balance: an inverted pendulum with a helping hand (auto-balance), more help with poles
    const g = grade(P.x);
    const alt = altFactor();
    const slopeTorque = g > 0 ? -g * 1.3 : -g * 1.7;
    const wobbleAmp = 0.5 + alt * 1.5 + (P.stamina < 20 ? 0.9 : 0) + weatherIntensity.drizzle * 0.5;
    const wobble = (Math.sin(t * 1.3) + Math.sin(t * 2.7 + 1) * 0.6 + Math.sin(t * 4.3 + 2) * 0.3) / 1.9 * wobbleAmp;
    const auto = input.poles ? 11 : 3.9;
    const damp = input.poles ? 4.5 : 1.6;
    const leanInput = (input.fwd ? 1 : 0) - (input.back ? 1 : 0);
    // bridge bounce and sway
    bridge.amp = Math.max(0, bridge.amp - dt * 0.12);
    const onB = inBridge(P.x);
    if (onB && !bridge.on) { popup("Suspension bridge! Don't look down.", "#fff", true); bridge.amp = 0.15; }
    bridge.on = onB;
    const bridgeSway = onB ? Math.sin(t * 2.8) * (0.6 + bridge.amp * 4) : 0;
    const wetWobble = onWet(P.x) ? Math.sin(t * 7.3) * 0.5 : 0;
    let acc = bridgeSway + wetWobble + 3.0 * P.lean - auto * P.lean - damp * P.leanVel + slopeTorque + wobble + gust.force + leanInput * 5;
    if (leanInput) acc -= P.leanVel * 1.2; // a bit of extra control while actively leaning
    if (shake > 0) shake -= dt;
    P.leanVel += acc * dt;
    P.lean += P.leanVel * dt;

    // Movement
    P.x += (P.targetX - P.x) * Math.min(1, dt * 7);
    for (const f of P.feet) {
      if (f.t < 1) {
        f.t = Math.min(1, f.t + dt / 0.2);
        const k = f.t;
        f.x = f.fromX + (f.toX - f.fromX) * k;
        const lift = onStairs(f.x) ? 0.3 : 0.18;
        f.y = footY(f.fromX) + (footY(f.toX) - footY(f.fromX)) * k + Math.sin(Math.PI * k) * lift;
      } else f.y = footY(f.x);
      // Don't leave a foot impossibly far behind
      if (P.x - f.x > 0.9 && f.t >= 1) { f.fromX = f.x; f.toX = P.x - 0.2; f.t = 0; }
    }
    P.armSwing += (P.x - (P.prevX || P.x)) * 2.2;
    P.prevX = P.x;

    // Stamina recovers while resting
    const rest = t - P.lastStepT > 0.7 ? (input.poles ? 10 : 7) : 1.2;
    P.stamina = Math.min(100, P.stamina + dt * rest);

    // Snacks
    for (const s of snacks) {
      if (!s.taken && Math.abs(P.x - s.x) < 0.9) {
        s.taken = true; stats.snacks++;
        const info = SNACKS[s.type];
        P.stamina = Math.min(100, P.stamina + info.value);
        popup(info.msg + "  +" + info.value, "#ffe28a", true);
        Sound.snack();
      }
    }

    updateFriends(dt);
    updateDonkeys(dt);
    updatePorters(dt);
    updateMutter(dt, g);

    if (Math.abs(P.lean) > FALL_ANGLE) startFall(Math.sign(P.lean));

    if (P.x >= END_X - 1) {
      state = "finished";
      stats.finishT = t;
      stats.time = playTime;
      controlsEl.classList.remove("show");
      Sound.finish();
    }
  }

  const SNACKS = {
    dalbhat: { value: 60, msg: "Dal bhat power, 24 hour!" },
    snickers: { value: 25, msg: "Snickers. Not yourself when hungry." },
    tea: { value: 35, msg: "Masala tea break" }
  };

  // Friends stroll past effortlessly
  function updateFriends(dt) {
    for (const f of friends) {
      if (f.done) continue;
      if (f.x === null && P.x > f.triggerX) f.x = P.x - 9;
      if (f.x !== null) {
        f.x += dt * 1.9;
        f.phase += dt * 1.9 / 0.55;
        if (Math.abs(f.x - P.x) < 1.5 && !f.sayT) f.sayT = t;
        if (f.x > P.x + 16) f.done = true;
      }
    }
  }
  function idleFriends() {}

  // Porters with absurd loads overtake you. They nudge you if you don't make way (poles).
  function updatePorters(dt) {
    for (const p of porters) {
      if (p.done) continue;
      if (p.x === null && P.x > p.triggerX) { p.x = P.x - 12; popup("Porter coming through!", "#ffd34d"); }
      if (p.x === null) continue;
      p.x += dt * 1.45;
      p.phase += dt * 1.45 / 0.4;
      if (!p.hit && !P.fall && Math.abs(p.x - P.x) < 0.4) {
        p.hit = true; p.sayT = t;
        if (!input.poles) { P.leanVel += 1.4; shake = 0.15; popup("nudged by a porter", "#ffb08a"); }
      }
      if (p.x > P.x + 25) p.done = true;
    }
  }

  // Ghost Ryan: walks the trail at a steady 'Ryan pace', slowing on the climbs

  function buildGhost() {
    const total = END_X / 1.2; // Ryan pace: game metres per second, scaled with the trail
    const xs = [], ts = [];
    let acc = 0;
    for (let x = 0; x <= END_X; x += 1) {
      const g = Math.max(0, grade(x));
      xs.push(x); ts.push(acc);
      acc += 1 + g * 4; // slower uphill
    }
    const k = total / acc;
    ghost = { xs, ts: ts.map((v) => v * k), total, phase: 0 };
  }
  function ghostX(time) {
    const ts = ghost.ts;
    if (time >= ts[ts.length - 1]) return END_X;
    let lo = 0, hi = ts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= time) lo = m; else hi = m; }
    return ghost.xs[lo] + (time - ts[lo]) / (ts[hi] - ts[lo]);
  }
  function ghostTimeAt(x) { const i = Math.max(0, Math.min(ghost.ts.length - 1, Math.floor(x))); return ghost.ts[i]; }

  function drawPorters() {
    for (const p of porters) {
      if (p.x === null || p.done) continue;
      const look = { skin: "#b07a52", hair: "#1a1a1a", shirt: "#4a5a7a", shorts: "#333", boot: "#222", pack: "#a07a3a", packTop: "#a07a3a", cap: "#c95", glasses: false };
      const ph = p.phase * Math.PI;
      const feet = [0, 1].map((i) => { const q = ph + i * Math.PI; const fx = p.x + Math.cos(q) * 0.28; return { x: fx, y: footY(fx) + Math.max(0, Math.sin(q)) * 0.12 }; });
      const hy = groundY(p.x) + 0.85;
      const lean = 0.45;
      // the load: doko basket with something ridiculous on top
      ctx.save(); ctx.translate(p.x, hy); ctx.rotate(-lean);
      ctx.fillStyle = "#a9864a"; ctx.fillRect(-0.62, 0.0, 0.5, 0.75);
      ctx.strokeStyle = "rgba(80,50,20,0.6)"; ctx.lineWidth = 0.03;
      for (let i = 0.1; i < 0.75; i += 0.12) { ctx.beginPath(); ctx.moveTo(-0.62, i); ctx.lineTo(-0.12, i); ctx.stroke(); }
      if (p.load === 0) { // a fridge
        ctx.fillStyle = "#e8e8e8"; ctx.fillRect(-0.7, 0.7, 0.66, 1.4);
        ctx.fillStyle = "#999"; ctx.fillRect(-0.12, 1.2, 0.04, 0.4); ctx.fillRect(-0.7, 1.55, 0.66, 0.02);
      } else if (p.load === 1) { // stacked crates of beer
        const cs = ["#c0392b", "#2f6fd6", "#27ae60", "#e3a81f", "#c0392b"];
        cs.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-0.68, 0.72 + i * 0.3, 0.6, 0.28); });
      } else { // gas cylinders and a chicken
        ctx.fillStyle = "#b73b2f"; for (let i = 0; i < 3; i++) { roundRect(-0.66 + i * 0.18, 0.72, 0.16, 0.8, 0.06); ctx.fill(); }
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-0.4, 1.68, 0.16, 0.12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d33"; ctx.fillRect(-0.3, 1.78, 0.05, 0.06);
      }
      ctx.restore();
      drawHiker(look, p.x, hy, feet, lean, { arms: [[p.x + 0.1, hy + 0.2], [p.x + 0.2, hy + 0.25]], noPack: true });
      // tumpline strap over the forehead
      const hx = p.x + Math.sin(lean) * 0.77, hyy = hy + Math.cos(lean) * 0.77;
      ctx.strokeStyle = "#6b4a2a"; ctx.lineWidth = 0.04;
      ctx.beginPath(); ctx.moveTo(hx + 0.05, hyy + 0.08); ctx.lineTo(p.x - 0.3, hy + 0.55); ctx.stroke();
      if (p.sayT && t - p.sayT < 2.2) wText(["Namaste!", "Bistaarai!", "Excuse me, sir"][p.load], p.x, hy + 2.6, 0.3, "#fff", "center", true);
    }
  }

  function drawGhost() {
    if (state !== "play" && state !== "fallen") return;
    const gx = ghostX(playTime);
    if (Math.abs(gx - camX) > W / S) return;
    const ph = gx / 0.55 * Math.PI;
    const feet = [0, 1].map((i) => { const q = ph + i * Math.PI; const fx = gx + Math.cos(q) * 0.33; return { x: fx, y: footY(fx) + Math.max(0, Math.sin(q)) * 0.14 }; });
    const hy = groundY(gx) + 0.92;
    ctx.globalAlpha = 0.35;
    drawHiker(RYAN, gx, hy, feet, Math.max(0, grade(gx)) * 0.4, { arms: [[gx - Math.sin(ph) * 0.2, hy + 0.05], [gx + Math.sin(ph) * 0.2, hy + 0.05]] });
    ctx.globalAlpha = 1;
    wText("Ghost Ryan", gx, hy + 1.4, 0.26, "#fff", "center", true);
  }

  function drawBridge() {
    if (!L.bridge) return;
    const [x0, x1] = viewRange();
    if (bridge.b < x0 || bridge.a > x1) return;
    // shadowy gorge beneath the deck
    const bottom = camY - H / S - 2;
    const grd = ctx.createLinearGradient(0, baseGround(bridge.a), 0, bottom);
    grd.addColorStop(0, "rgba(40,60,45,0.85)"); grd.addColorStop(1, "rgba(15,25,20,0.95)");
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.moveTo(bridge.a, baseGround(bridge.a));
    for (let x = bridge.a; x <= bridge.b; x += 0.25) ctx.lineTo(x, Math.min(baseGround(x), groundY(x)) - 0.2);
    ctx.lineTo(bridge.b, baseGround(bridge.b)); ctx.lineTo(bridge.b, bottom); ctx.lineTo(bridge.a, bottom); ctx.closePath(); ctx.fill();
    // rock walls
    ctx.fillStyle = "#6b5a48";
    for (const [ex, dir] of [[bridge.a, 1], [bridge.b, -1]]) {
      ctx.beginPath(); ctx.moveTo(ex, baseGround(ex)); ctx.lineTo(ex + dir * 1.5, bottom); ctx.lineTo(ex - dir * 0.5, bottom); ctx.lineTo(ex - dir * 0.5, baseGround(ex)); ctx.fill();
    }
    // river in the gorge
    const midX = (bridge.a + bridge.b) / 2;
    ctx.fillStyle = "#6fa9c0";
    ctx.fillRect(midX - 4, gorgeY(midX) - 0.2, 8, 1.2);
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 0.06;
    for (let i = 0; i < 6; i++) { const rx = midX - 3.5 + ((i * 1.3 + t * 2) % 7); ctx.beginPath(); ctx.moveTo(rx, gorgeY(midX) + 0.5); ctx.lineTo(rx + 0.6, gorgeY(midX) + 0.5); ctx.stroke(); }
    // towers
    for (const ex of [bridge.a, bridge.b]) {
      const y = baseGround(ex);
      ctx.fillStyle = "#777"; ctx.fillRect(ex - 0.15, y, 0.3, 2.2);
    }
    // hand cables
    ctx.strokeStyle = "#555"; ctx.lineWidth = 0.05;
    ctx.beginPath();
    for (let x = bridge.a; x <= bridge.b; x += 0.25) { const y = groundY(x) + 1.1; x === bridge.a ? ctx.moveTo(x, baseGround(x) + 2.2) : ctx.lineTo(x, y); }
    ctx.lineTo(bridge.b, baseGround(bridge.b) + 2.2); ctx.stroke();
    // deck + hangers
    ctx.strokeStyle = "#4a4a4a"; ctx.lineWidth = 0.025;
    for (let x = bridge.a + 0.5; x < bridge.b; x += 0.8) { ctx.beginPath(); ctx.moveTo(x, groundY(x)); ctx.lineTo(x, groundY(x) + 1.1); ctx.stroke(); }
    ctx.strokeStyle = "#8d6e4f"; ctx.lineWidth = 0.14;
    ctx.beginPath();
    for (let x = bridge.a; x <= bridge.b; x += 0.25) { x === bridge.a ? ctx.moveTo(x, groundY(x) - 0.05) : ctx.lineTo(x, groundY(x) - 0.05); }
    ctx.stroke();
    // prayer flags on the cable
    const cols = ["#2f6fd6", "#f5f5f5", "#d63a2f", "#2f9a4a", "#f2c22f"];
    let i = 0;
    for (let x = bridge.a + 0.3; x < bridge.b; x += 0.45, i++) {
      const y = groundY(x) + 1.1;
      ctx.fillStyle = cols[i % 5];
      ctx.beginPath(); ctx.moveTo(x - 0.15, y); ctx.lineTo(x + 0.15, y); ctx.lineTo(x + Math.sin(t * 4 + i) * 0.05, y - 0.35); ctx.fill();
    }
  }
  function drawWet() {
    const [x0, x1] = viewRange();
    for (const z of L.wet || []) {
      const a = Math.max(x0, kmToX(z[0])), b = Math.min(x1, kmToX(z[1]));
      if (a >= b) continue;
      ctx.strokeStyle = "rgba(170,220,255,0.75)"; ctx.lineWidth = 0.1;
      ctx.beginPath();
      for (let x = a; x <= b; x += 0.1) { x === a ? ctx.moveTo(x, footY(x) + 0.02) : ctx.lineTo(x, footY(x) + 0.02); }
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      for (let x = Math.ceil(a); x < b; x += 1.3) {
        const k = (Math.sin(t * 3 + x * 7) + 1) / 2;
        if (k > 0.8) { ctx.beginPath(); ctx.arc(x, footY(x) + 0.06, 0.05, 0, Math.PI * 2); ctx.fill(); }
      }
    }
  }

  // Donkey trains come down the trail. Hold POLES to brace against the wall or get bonked.
  function updateDonkeys(dt) {
    for (const tr of donkeyTrains) {
      if (!tr.started && P.x > tr.x - 22) {
        tr.started = true;
        const n = 3 + (Math.random() * 2 | 0);
        for (let i = 0; i < n; i++) donkeys.push({ x: P.x + 20 + i * 2.3, phase: Math.random() * 6, hit: false, load: i % 3 });
        popup("DONKEY TRAIN! Hold POLES to brace!", "#ffd34d", true);
        Sound.bells();
      }
    }
    for (const d of donkeys) {
      d.x -= dt * 2.4;
      d.phase += dt * 9;
      if (!d.hit && !P.fall && Math.abs(d.x - P.x) < 0.45) {
        d.hit = true;
        if (input.poles) { popup("braced!", "#bfffbf"); }
        else { P.leanVel -= 2.2; P.targetX = Math.max(1, P.targetX - 0.4); stats.bonks++; shake = 0.25; popup("BONK!", "#ffb08a"); Sound.shuffle(); }
      }
    }
    donkeys = donkeys.filter((d) => d.x > P.x - 25);
  }

  const MUTTERS = {
    up: ["up up up", "whose idea was this", "more stairs?!", "my calves...", "one more step", "is that the teahouse? no."],
    flat: ["lovely", "this is fine", "namaste!", "smells like dal bhat"],
    down: ["knees, hold on", "wheee", "careful now"],
    tired: ["*wheeze*", "need... Snickers", "sit down? just for a sec"]
  };
  function updateMutter(dt, g) {
    nextMutter -= dt;
    if (mutter && t - mutter.t > 2.2) mutter = null;
    if (nextMutter <= 0) {
      nextMutter = 7 + Math.random() * 7;
      const set = P.stamina < 25 ? MUTTERS.tired : g > 0.12 ? MUTTERS.up : g < -0.08 ? MUTTERS.down : MUTTERS.flat;
      mutter = { text: set[Math.random() * set.length | 0], t };
    }
  }

  function drawDonkeys() {
    for (const d of donkeys) {
      const x = d.x, gy = groundY(x);
      const bob = Math.abs(Math.sin(d.phase)) * 0.04;
      const by = gy + 0.75 + bob;
      // legs
      ctx.strokeStyle = "#5a4636"; ctx.lineWidth = 0.08; ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        const lx = x + (i < 2 ? -0.35 : 0.3) + (i % 2) * 0.1;
        const sw = Math.sin(d.phase + i * 1.6) * 0.12;
        ctx.beginPath(); ctx.moveTo(lx, by - 0.1); ctx.lineTo(lx + sw, footY(lx + sw) + 0.02); ctx.stroke();
      }
      // body
      ctx.fillStyle = "#8a7360";
      ctx.beginPath(); ctx.ellipse(x, by, 0.55, 0.25, 0, 0, Math.PI * 2); ctx.fill();
      // neck + head (facing left, walking downhill toward Ryan)
      ctx.beginPath(); ctx.moveTo(x - 0.4, by + 0.05); ctx.lineTo(x - 0.65, by + 0.45); ctx.lineTo(x - 0.5, by + 0.5); ctx.lineTo(x - 0.25, by + 0.15); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x - 0.75, by + 0.45, 0.2, 0.1, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#6b5646";
      ctx.beginPath(); ctx.ellipse(x - 0.55, by + 0.66, 0.04, 0.12, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x - 0.62, by + 0.66, 0.04, 0.12, -0.1, 0, Math.PI * 2); ctx.fill();
      // load: colourful saddle bags
      ctx.fillStyle = ["#c0392b", "#2f6fd6", "#e3a81f"][d.load];
      ctx.fillRect(x - 0.3, by + 0.05, 0.6, 0.35);
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fillRect(x - 0.3, by + 0.2, 0.6, 0.05);
      // bell
      ctx.fillStyle = "#d4af37"; ctx.beginPath(); ctx.arc(x - 0.5, by - 0.02, 0.06, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawDust() {
    for (const d of dust) {
      ctx.fillStyle = `rgba(190,165,120,${0.5 * (1 - d.t / 0.6)})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, 0.06 + d.t * 0.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---------- Drawing helpers ----------
  let camX = 0, camY = 0;
  function worldTransform(sway) {
    const tx = W / 2 - camX * S, ty = H * GF() + camY * S;
    ctx.setTransform(DPR * S, 0, 0, -DPR * S, DPR * tx, DPR * ty);
    if (sway) { ctx.translate(camX, camY); ctx.rotate(sway); ctx.translate(-camX, -camY); }
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 0.6, (Math.random() - 0.5) * shake * 0.6);
  }
  function screenTransform() { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  function GF() { return isTouch ? 0.48 : 0.6; }
  function toScreen(x, y) { return [W / 2 + (x - camX) * S, H * GF() - (y - camY) * S]; }
  const worldTexts = [];
  function wText(str, x, y, size, color, align, bold) { worldTexts.push({ str, x, y, size, color, align, bold }); }

  function ik(hx, hy, fx, fy, l1, l2, bend) {
    let dx = fx - hx, dy = fy - hy;
    let d = Math.hypot(dx, dy);
    const maxD = l1 + l2 - 0.001;
    if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; fx = hx + dx; fy = hy + dy; }
    const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
    const base = Math.atan2(dy, dx);
    const ang = base + a * bend;
    return [hx + Math.cos(ang) * l1, hy + Math.sin(ang) * l1, fx, fy];
  }
  function limb(x1, y1, x2, y2, w, color) {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  const RYAN = {
    skin: "#e2ad87", hair: "#3a2a1e", shirt: "#b3322f", check1: "rgba(255,240,235,0.55)", check2: "rgba(30,30,60,0.45)",
    shorts: "#6e6b5c", boot: "#5b4232", pack: "#6c7a63", packTop: "#2f5d8a", glasses: true, stubble: true
  };
  const FRIEND_LOOKS = [
    { skin: "#e6b896", hair: "#6b4a2b", shirt: "#3b3b3b", shorts: "#2b2b2b", boot: "#333", pack: "#b6d33a", packTop: "#93ad2a", glasses: false, cap: "#d23" },
    { skin: "#d9a07a", hair: "#222", shirt: "#c43a3a", shorts: "#3a3a3a", boot: "#444", pack: "#8a8f96", packTop: "#5c6168", glasses: true, cap: null }
  ];

  // Draws a hiker. hip=(hx,hy); feet world positions; lean in radians (+ = forward)
  function drawHiker(look, hx, hy, feet, lean, opts) {
    opts = opts || {};
    const sinL = Math.sin(lean), cosL = Math.cos(lean);
    const topX = hx + sinL * TORSO, topY = hy + cosL * TORSO;
    const shX = hx + sinL * (TORSO - 0.08), shY = hy + cosL * (TORSO - 0.08);

    // Back leg & arm first
    const order = feet[0].x < feet[1].x ? [0, 1] : [1, 0];
    const legs = order.map((i) => ik(hx, hy, feet[i].x, feet[i].y + 0.06, THIGH, SHIN, 1));
    const shade = (c, i) => (i === 0 ? darken(c) : c);

    // Back arm
    const arms = opts.arms || [[shX - 0.15, shY - 0.55], [shX + 0.15, shY - 0.55]];
    const a0 = ik(shX, shY, arms[0][0], arms[0][1], 0.3, 0.3, -1);
    limb(shX, shY, a0[0], a0[1], 0.1, darken(look.shirt));
    limb(a0[0], a0[1], a0[2], a0[3], 0.08, darken(look.skin));
    if (opts.poles) drawPole(a0[2], a0[3], opts.poles[0]);

    legs.forEach((lg, i) => {
      limb(hx, hy, lg[0], lg[1], 0.17, shade(look.shorts, i));
      limb(lg[0], lg[1], lg[2], lg[3], 0.12, shade(look.skin, i));
      // boot
      ctx.fillStyle = shade(look.boot, i);
      ctx.beginPath();
      ctx.ellipse(lg[2] + 0.07, lg[3] - 0.03, 0.15, 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Torso (rotated frame)
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-lean);
    // backpack
    if (!opts.noPack) {
      ctx.fillStyle = look.pack;
      roundRect(-0.36, 0.0, 0.26, 0.66, 0.07); ctx.fill();
      ctx.fillStyle = look.packTop;
      roundRect(-0.38, 0.5, 0.3, 0.2, 0.06); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(-0.34, 0.18, 0.22, 0.04);
    }
    // shirt
    ctx.fillStyle = look.shirt;
    roundRect(-0.14, -0.04, 0.28, 0.66, 0.08); ctx.fill();
    if (look.check1) {
      ctx.save();
      roundRect(-0.14, -0.04, 0.28, 0.66, 0.08); ctx.clip();
      ctx.lineWidth = 0.025;
      for (let i = -0.14; i < 0.16; i += 0.07) { ctx.strokeStyle = look.check1; ctx.beginPath(); ctx.moveTo(i, -0.05); ctx.lineTo(i, 0.63); ctx.stroke(); }
      for (let j = -0.02; j < 0.63; j += 0.07) { ctx.strokeStyle = look.check2; ctx.beginPath(); ctx.moveTo(-0.15, j); ctx.lineTo(0.15, j); ctx.stroke(); }
      ctx.restore();
    }
    // pack strap
    ctx.strokeStyle = "rgba(20,20,20,0.6)"; ctx.lineWidth = 0.04;
    ctx.beginPath(); ctx.moveTo(-0.08, 0.58); ctx.quadraticCurveTo(0.08, 0.3, -0.04, 0.05); ctx.stroke();
    // head
    ctx.translate(0, TORSO + 0.17);
    ctx.rotate(opts.headTilt || 0);
    drawHead(look, opts.face);
    ctx.restore();

    // Front arm
    const a1 = ik(shX, shY, arms[1][0], arms[1][1], 0.3, 0.3, -1);
    limb(shX, shY, a1[0], a1[1], 0.1, look.shirt);
    limb(a1[0], a1[1], a1[2], a1[3], 0.08, look.skin);
    if (opts.poles) drawPole(a1[2], a1[3], opts.poles[1]);
    void topX; void topY;
  }

  function drawPole(hx, hy, tip) {
    limb(hx, hy + 0.08, tip[0], tip[1], 0.035, "#9aa3ad");
    ctx.fillStyle = "#222"; ctx.fillRect(hx - 0.03, hy - 0.02, 0.06, 0.14);
  }

  function drawHead(look, face) {
    const r = 0.15;
    // neck
    ctx.fillStyle = look.skin; ctx.fillRect(-0.04, -0.17, 0.08, 0.06);
    if (face && faceReady) {
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
      ctx.scale(1, -1);
      ctx.drawImage(faceImg, -r, -r, r * 2, r * 2);
      ctx.restore();
      return;
    }
    ctx.fillStyle = look.skin;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r, 0, 0, Math.PI * 2); ctx.fill();
    // nose
    ctx.beginPath(); ctx.moveTo(r * 0.85, 0.02); ctx.lineTo(r * 1.15, -0.03); ctx.lineTo(r * 0.85, -0.05); ctx.fill();
    // ear
    ctx.fillStyle = darken(look.skin);
    ctx.beginPath(); ctx.ellipse(-0.03, 0, 0.03, 0.045, 0, 0, Math.PI * 2); ctx.fill();
    // stubble
    if (look.stubble) {
      ctx.fillStyle = "rgba(60,40,30,0.35)";
      ctx.beginPath(); ctx.ellipse(0.04, -0.08, 0.1, 0.06, -0.2, 0, Math.PI * 2); ctx.fill();
    }
    // mouth (a determined grin)
    ctx.strokeStyle = "#6a3a2a"; ctx.lineWidth = 0.015;
    ctx.beginPath(); ctx.moveTo(0.06, -0.07); ctx.quadraticCurveTo(0.1, -0.09, 0.13, -0.06); ctx.stroke();
    // hair
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.ellipse(-0.02, 0.06, r * 0.98, r * 0.62, 0.15, Math.PI * 0.02, Math.PI * 1.05);
    ctx.fill();
    ctx.fillRect(-r * 0.95, -0.02, 0.07, 0.09);
    if (look.cap) {
      ctx.fillStyle = look.cap;
      ctx.beginPath(); ctx.ellipse(0, 0.07, r, r * 0.6, 0, 0, Math.PI); ctx.fill();
      ctx.fillRect(0, 0.06, r * 1.4, 0.03);
    }
    // sunglasses
    if (look.glasses) {
      ctx.fillStyle = "#151515";
      roundRect(0.03, 0.0, 0.13, 0.055, 0.02); ctx.fill();
      ctx.fillStyle = "rgba(120,170,255,0.5)";
      ctx.fillRect(0.09, 0.03, 0.05, 0.012);
      ctx.strokeStyle = "#151515"; ctx.lineWidth = 0.015;
      ctx.beginPath(); ctx.moveTo(0.03, 0.035); ctx.lineTo(-0.04, 0.03); ctx.stroke();
    } else {
      ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(0.09, 0.025, 0.015, 0, Math.PI * 2); ctx.fill();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function darken(c) {
    if (c[0] !== "#") return c;
    const n = parseInt(c.length === 4 ? c.slice(1).split("").map((h) => h + h).join("") : c.slice(1), 16);
    const r = (n >> 16) * 0.75, g = ((n >> 8) & 255) * 0.75, b = (n & 255) * 0.75;
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }

  // ---------- Scene ----------
  function drawSky() {
    screenTransform();
    const d = weatherIntensity.drizzle;
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, mix("#4f97d6", "#7d8b99", d));
    grd.addColorStop(1, mix("#cfe6f5", "#c4ccd2", d));
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // Far snowy range with a fishtail peak (Machhapuchhre) in the middle distance
    const rise = Math.min(1, camY / 200);
    const baseY = H * (0.62 - rise * 0.18);
    const off = camX * S * 0.03;
    ctx.fillStyle = mix("#b9c9dc", "#a9b2bb", d);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let sx = 0; sx <= W + 10; sx += 10) {
      const u = (sx + off) / 260;
      let y = baseY - (Math.abs(Math.sin(u)) * 0.6 + Math.abs(Math.sin(u * 2.3 + 1)) * 0.4) * H * 0.28;
      const fp = (sx + off) % 2600 - 1300; // fishtail
      if (Math.abs(fp) < 160) y = Math.min(y, baseY - H * 0.42 + Math.abs(Math.abs(fp) - 25) * 1.4);
      ctx.lineTo(sx, y);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    // snow caps
    ctx.save(); ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillRect(0, 0, W, baseY - H * 0.2);
    ctx.restore();

    // Mid hills (green, terraced)
    hills(0.12, "#5f8f5a", 0.7 - rise * 0.1, 0.16, 180, d);
    hills(0.28, "#4c7d48", 0.8 - rise * 0.05, 0.14, 120, d);
  }
  function hills(par, color, yFrac, amp, wl, d) {
    const off = camX * S * par;
    ctx.fillStyle = mix(color, "#8a9a90", d * 0.6);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let sx = 0; sx <= W + 10; sx += 8) {
      const u = (sx + off) / wl;
      ctx.lineTo(sx, H * yFrac - (Math.sin(u) * 0.5 + Math.sin(u * 0.37 + 2) * 0.5 + 1) * H * amp * 0.5);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  function mix(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = ((pa >> 16) * (1 - k) + (pb >> 16) * k) | 0;
    const g = (((pa >> 8) & 255) * (1 - k) + ((pb >> 8) & 255) * k) | 0;
    const bl = ((pa & 255) * (1 - k) + (pb & 255) * k) | 0;
    return `rgb(${r},${g},${bl})`;
  }

  function viewRange() { const half = W / S / 2 + 3; return [camX - half, camX + half]; }

  function drawWorldBack() {
    const [x0, x1] = viewRange();
    // River at the start, down in the valley
    if (x0 < 30) {
      ctx.fillStyle = "#7fb0c4";
      ctx.fillRect(-60, groundY(0) - 6, 90, 4.4);
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 0.06;
      for (let i = 0; i < 14; i++) {
        const rx = -55 + ((i * 7 + t * 2.5) % 90);
        ctx.beginPath(); ctx.moveTo(rx, groundY(0) - 2.8 - (i % 3) * 0.9); ctx.lineTo(rx + 1.2, groundY(0) - 2.8 - (i % 3) * 0.9); ctx.stroke();
      }
    }
    // Scenery behind the path
    for (const s of L.scenery) {
      const sx = kmToX(s.km);
      if (sx < x0 - 12 || sx > x1 + 12) continue;
      if (s.type === "waterfall") drawWaterfall(sx);
      if (s.type === "village") drawVillage(sx);
      if (s.type === "teahouse") drawTeahouse(sx);
    }
    // Trees
    const start = Math.floor(x0 / 2.2), end = Math.ceil(x1 / 2.2);
    for (let i = start; i <= end; i++) {
      const h = hash(i);
      if (h > 0.45) continue;
      const tx = i * 2.2 + hash(i + 9) * 1.5;
      if (inVillage(tx) || (L.bridge && tx > bridge.a - 2 && tx < bridge.b + 2)) continue;
      drawTree(tx, groundY(tx) - 0.2, 1.6 + hash(i + 3) * 2.2, h);
    }
  }
  function inVillage(x) {
    for (const s of L.scenery) if ((s.type === "village" || s.type === "teahouse") && Math.abs(kmToX(s.km) - x) < 9) return true;
    return false;
  }
  function drawTree(x, y, h, k) {
    ctx.fillStyle = "#5a4330"; ctx.fillRect(x - 0.08, y, 0.16, h * 0.4);
    ctx.fillStyle = k < 0.15 ? "#2f6b3a" : k < 0.3 ? "#3d7d43" : "#4b8a3e";
    ctx.beginPath(); ctx.ellipse(x, y + h * 0.6, h * 0.38, h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - h * 0.2, y + h * 0.45, h * 0.25, h * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawWaterfall(x) {
    const y = groundY(x);
    ctx.fillStyle = "#6c6f68";
    ctx.beginPath(); ctx.moveTo(x - 4, y - 0.5); ctx.lineTo(x - 3, y + 9); ctx.lineTo(x + 3.5, y + 10); ctx.lineTo(x + 4, y - 0.5); ctx.fill();
    ctx.fillStyle = "#3e7a3f";
    ctx.beginPath(); ctx.ellipse(x - 3.2, y + 8, 2, 1.6, 0, 0, Math.PI * 2); ctx.ellipse(x + 3.2, y + 9, 2, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(235,248,255,0.9)";
    ctx.fillRect(x - 0.8, y - 0.3, 1.6, 9.8);
    ctx.strokeStyle = "rgba(160,200,225,0.9)"; ctx.lineWidth = 0.08;
    for (let i = 0; i < 6; i++) {
      const lx = x - 0.65 + i * 0.26;
      const off = (t * 6 + i * 1.7) % 3;
      for (let j = -1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(lx, y + 9.5 - off - j * 3); ctx.lineTo(lx, y + 8.7 - off - j * 3); ctx.stroke(); }
    }
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath(); ctx.ellipse(x, y, 1.6, 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawHouse(x, y, w, h, wall, trim, roof) {
    ctx.fillStyle = "#8b8a80"; ctx.fillRect(x - w / 2, y - 1, w, 1.4); // stone base
    ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y + 0.4, w, h);
    ctx.fillStyle = trim;
    const floors = Math.max(1, Math.round(h / 1.6));
    for (let f = 0; f < floors; f++) {
      const fy = y + 0.4 + f * (h / floors);
      ctx.fillRect(x - w / 2 - 0.2, fy + h / floors - 0.12, w + 0.4, 0.12); // balcony
      for (let wx = x - w / 2 + 0.5; wx < x + w / 2 - 0.4; wx += 1.1) {
        ctx.fillStyle = "#2b3b4f"; ctx.fillRect(wx, fy + 0.45, 0.55, 0.7);
        ctx.fillStyle = trim;
      }
    }
    ctx.fillStyle = roof;
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 0.5, y + 0.4 + h); ctx.lineTo(x, y + 1.4 + h); ctx.lineTo(x + w / 2 + 0.5, y + 0.4 + h); ctx.fill();
  }
  function drawVillage(x) {
    drawHouse(x - 5, groundY(x - 5) + 1.2, 4, 3.2, "#3f6fb2", "#d8d0c0", "#5a6b7a");
    drawHouse(x + 3, groundY(x + 3) + 1.6, 5, 4.8, "#f2efe6", "#2d6fb7", "#4f5f6f");
    drawFlags(x - 7, x + 7, 6.5);
    // terraced field
    ctx.fillStyle = "#d8b54a";
    ctx.fillRect(x - 12, groundY(x - 12) + 0.6, 4, 0.8);
  }
  function drawTeahouse(x) {
    const y = groundY(x) + 0.6;
    drawHouse(x + 2, y, 7, 8, "#e48f8f", "#f3f0ea", "#c45a5a");
    ctx.fillStyle = "#f5e9a8"; ctx.fillRect(x - 1.2, y + 1.3, 3.2, 0.7);
    wText("TEAHOUSE", x + 0.4, y + 1.65, 0.38, "#7a2d2d", "center", true);
    // finish banner
    ctx.strokeStyle = "#555"; ctx.lineWidth = 0.08;
    ctx.beginPath(); ctx.moveTo(x - 3.5, footY(x - 3.5)); ctx.lineTo(x - 3.5, footY(x - 3.5) + 3.2); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.fillRect(x - 3.5, footY(x - 3.5) + 2.4, 2.2, 0.8);
    wText("FINISH", x - 2.4, footY(x - 3.5) + 2.8, 0.4, "#c0392b", "center", true);
  }
  function drawFlags(xa, xb, hgt) {
    const ya = groundY(xa) + hgt, yb = groundY(xb) + hgt;
    const cols = ["#2f6fd6", "#f5f5f5", "#d63a2f", "#2f9a4a", "#f2c22f"];
    ctx.strokeStyle = "#444"; ctx.lineWidth = 0.03;
    ctx.beginPath(); ctx.moveTo(xa, ya); ctx.quadraticCurveTo((xa + xb) / 2, (ya + yb) / 2 - 1, xb, yb); ctx.stroke();
    const n = Math.floor((xb - xa) / 0.5);
    for (let i = 1; i < n; i++) {
      const k = i / n;
      const fx = xa + (xb - xa) * k;
      const fy = (1 - k) * (1 - k) * ya + 2 * (1 - k) * k * ((ya + yb) / 2 - 1) + k * k * yb;
      const flap = Math.sin(t * 4 + i) * 0.05 * (1 + weatherIntensity.wind * 3);
      ctx.fillStyle = cols[i % 5];
      ctx.beginPath(); ctx.moveTo(fx - 0.15, fy); ctx.lineTo(fx + 0.15, fy); ctx.lineTo(fx + flap, fy - 0.4); ctx.fill();
    }
  }
  function drawCheckpoint(x) {
    const y = footY(x);
    ctx.fillStyle = "#555"; ctx.fillRect(x - 0.05, y, 0.1, 1.6); ctx.fillRect(x + 2.35, y, 0.1, 1.6);
    ctx.fillStyle = "#1e2e4a"; ctx.fillRect(x - 0.2, y + 1.3, 2.8, 1.7);
    wText("ACA CHECKPOINT", x + 1.2, y + 2.55, 0.26, "#f4c430", "center", true);
    wText("& INFORMATION CENTRE", x + 1.2, y + 2.2, 0.18, "#f4c430", "center", true);
    wText("← GHANDRUK 13 KM   GHOREPANI 16 KM →", x + 1.2, y + 1.6, 0.13, "#f4c430", "center", false);
  }

  function drawTerrain() {
    const [x0, x1] = viewRange();
    const bottom = camY - H / S;
    // soil
    ctx.fillStyle = "#7a5a3c";
    ctx.beginPath(); ctx.moveTo(x0, bottom);
    for (let x = x0; x <= x1; x += 0.1) ctx.lineTo(x, inBridge(x) ? gorgeY(x) : footY(x));
    ctx.lineTo(x1, bottom); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for (let i = Math.floor(x0); i < x1; i++) {
      if (hash(i * 3.1) < 0.4) { ctx.beginPath(); ctx.ellipse(i + 0.5, groundY(i) - 0.8 - hash(i) * 2, 0.25, 0.15, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    // grass edge / stone steps
    for (let x = Math.floor(x0 / STEP_W) * STEP_W; x <= x1; x += STEP_W) {
      if (onStairs(x)) {
        const y = footY(x + 0.01);
        ctx.fillStyle = hash(x * 7) < 0.5 ? "#9a9a92" : "#86867e";
        ctx.fillRect(x, y - 0.22, STEP_W + 0.02, 0.22);
        ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(x, y - 0.03, STEP_W, 0.03);
      }
    }
    ctx.strokeStyle = "#5c9b3c"; ctx.lineWidth = 0.14;
    ctx.beginPath();
    let pen = false;
    for (let x = x0; x <= x1; x += 0.1) {
      if (onStairs(x) || inBridge(x)) { pen = false; continue; }
      const y = groundY(x);
      if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // path dust
    ctx.strokeStyle = "rgba(200,170,120,0.5)"; ctx.lineWidth = 0.05;
    ctx.beginPath(); pen = false;
    for (let x = x0; x <= x1; x += 0.1) {
      if (onStairs(x) || inBridge(x)) { pen = false; continue; }
      const y = groundY(x) - 0.08;
      if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function drawFront() {
    const [x0, x1] = viewRange();
    for (const s of L.scenery) {
      const sx = kmToX(s.km);
      if (sx < x0 - 8 || sx > x1 + 8) continue;
      if (s.type === "checkpoint") drawCheckpoint(sx + 4);
      if (s.type === "flags") drawFlags(sx - 6, sx + 6, 4.5);
    }
    // snacks
    for (const s of snacks) {
      if (s.taken || s.x < x0 || s.x > x1) continue;
      const y = footY(s.x) + 0.9 + Math.sin(t * 3 + s.x) * 0.12;
      drawSnack(s.type, s.x, y);
    }
  }
  function drawSnack(type, x, y) {
    ctx.fillStyle = "rgba(255,240,150,0.35)";
    ctx.beginPath(); ctx.arc(x, y, 0.45, 0, Math.PI * 2); ctx.fill();
    if (type === "dalbhat") {
      ctx.fillStyle = "#c9ccd0"; ctx.beginPath(); ctx.ellipse(x, y, 0.38, 0.14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x - 0.08, y + 0.07, 0.17, 0.11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e0a82e"; ctx.beginPath(); ctx.ellipse(x + 0.17, y + 0.04, 0.1, 0.07, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4f8f3a"; ctx.beginPath(); ctx.ellipse(x - 0.22, y + 0.03, 0.07, 0.05, 0, 0, Math.PI * 2); ctx.fill();
    } else if (type === "snickers") {
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.3);
      ctx.fillStyle = "#4a2a18"; ctx.fillRect(-0.32, -0.08, 0.64, 0.16);
      ctx.fillStyle = "#2a5fb0"; ctx.fillRect(-0.12, -0.06, 0.24, 0.12);
      ctx.restore();
    } else {
      ctx.fillStyle = "#f2f2f2"; ctx.fillRect(x - 0.15, y - 0.18, 0.3, 0.32);
      ctx.fillStyle = "#c48b55"; ctx.fillRect(x - 0.13, y + 0.06, 0.26, 0.06);
      ctx.strokeStyle = "#f2f2f2"; ctx.lineWidth = 0.05;
      ctx.beginPath(); ctx.arc(x + 0.17, y - 0.02, 0.08, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 0.03;
      ctx.beginPath(); ctx.moveTo(x, y + 0.2); ctx.quadraticCurveTo(x + 0.08, y + 0.32, x, y + 0.44); ctx.stroke();
    }
  }

  function drawFriends() {
    for (const f of friends) {
      if (f.x === null || f.done) continue;
      const look = FRIEND_LOOKS[f.idx % FRIEND_LOOKS.length];
      const ph = f.phase * Math.PI;
      const feet = [0, 1].map((i) => {
        const p = ph + i * Math.PI;
        const fx = f.x + Math.cos(p) * 0.35;
        return { x: fx, y: footY(fx) + Math.max(0, Math.sin(p)) * 0.15 };
      });
      const hy = groundY(f.x) + 0.92 + Math.abs(Math.sin(ph)) * 0.03;
      const sw = Math.sin(ph) * 0.2;
      drawHiker(look, f.x, hy, feet, Math.max(0, grade(f.x)) * 0.4, {
        arms: [[f.x - sw, hy + 0.05], [f.x + sw, hy + 0.05]]
      });
      if (f.sayT && t - f.sayT < 2.5) wText(f.say, f.x, hy + 1.35, 0.32, "#fff", "center", true);
    }
  }

  function drawPlayer() {
    if (P.fall) {
      const f = P.fall;
      const cx = P.x, cy = groundY(P.x) + 0.45;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-f.rot);
      // draw in local frame: hip at (0,-0.1)
      const fl = Math.sin(t * 18) * 0.15;
      const feet = [{ x: -0.2 + fl, y: -0.9 }, { x: 0.25 - fl, y: -0.85 }];
      drawHiker(RYAN, 0, -0.05, feet, 0, {
        arms: [[-0.45, 0.7 + fl], [0.5, 0.65 - fl]], face: true, headTilt: 0.3
      });
      ctx.restore();
      return;
    }
    const baseHip = groundY(P.x) + 0.93 + Math.sin(t * 2.2) * 0.01;
    let hy = baseHip;
    for (const f of P.feet) {
      const dx = f.x - P.x;
      if (Math.abs(dx) < 0.97) hy = Math.min(hy, f.y + 0.06 + Math.sqrt(0.97 * 0.97 - dx * dx));
    }
    const lean = P.lean;
    const shX = P.x + Math.sin(lean) * (TORSO - 0.08), shY = hy + Math.cos(lean) * (TORSO - 0.08);
    let arms, poles = null;
    if (input.poles) {
      const tips = [P.x + 0.35, P.x + 0.75].map((x) => [x, footY(x)]);
      arms = [[shX + 0.3, shY - 0.35], [shX + 0.42, shY - 0.3]];
      poles = tips;
    } else {
      const sw = Math.sin(P.armSwing) * 0.22;
      arms = [[shX - sw, shY - 0.55], [shX + sw, shY - 0.55]];
    }
    drawHiker(RYAN, P.x, hy, P.feet, lean, { arms, poles, face: true });
    // sweat drops when tired
    if (P.stamina < 25) {
      ctx.fillStyle = "rgba(120,190,255,0.85)";
      const k = (t * 1.5) % 1;
      ctx.beginPath(); ctx.arc(shX - 0.25, shY + 0.45 - k * 0.4, 0.04, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawWeather() {
    screenTransform();
    const d = weatherIntensity.drizzle;
    if (d > 0.02) {
      ctx.strokeStyle = `rgba(220,230,240,${0.5 * d})`; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const r of rainDrops) {
        r.y += 0.016 * r.s * 1.4; if (r.y > 1) { r.y -= 1; r.x = Math.random(); }
        const x = r.x * W - (camX * S * 0.6) % W, y = r.y * H;
        const xx = ((x % W) + W) % W;
        ctx.moveTo(xx, y); ctx.lineTo(xx - 3, y + 12 * r.s);
      }
      ctx.stroke();
      ctx.fillStyle = `rgba(210,220,228,${0.25 * d})`; ctx.fillRect(0, 0, W, H);
    }
    const wv = weatherIntensity.wind;
    if (wv > 0.05 && gust.t > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * wv * Math.min(1, gust.t)})`; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const y = (hash(i) * H * 0.8 + 20);
        const x = ((hash(i + 5) * W + (gust.force < 0 ? -1 : 1) * t * 900) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y + Math.sin(i) * 4); ctx.stroke();
      }
    }
  }

  function flushWorldTexts() {
    screenTransform();
    for (const tx of worldTexts) {
      const [sx, sy] = toScreen(tx.x, tx.y);
      ctx.font = `${tx.bold ? "bold " : ""}${Math.max(8, tx.size * S)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = tx.align || "center"; ctx.textBaseline = "middle";
      if (tx.color === "#fff") { ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.strokeText(tx.str, sx, sy); }
      ctx.fillStyle = tx.color; ctx.fillText(tx.str, sx, sy);
    }
    worldTexts.length = 0;
  }

  // ---------- HUD ----------
  function fmtTime(s) {
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(sec).padStart(2, "0");
  }
  function panel(x, y, w, h) {
    ctx.fillStyle = "rgba(10,20,30,0.45)";
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 10) : ctx.rect(x, y, w, h); ctx.fill();
  }
  function drawHUD() {
    screenTransform();
    const sm = W < 600;
    const pad = 10, top = 10;
    const km = Math.min(L.lengthKm, Math.max(0, xToKm(P.x)));
    const elev = Math.round(elevAt(km));

    // Left panel: progress + stats
    const pw = sm ? 170 : 230;
    panel(pad, top, pw, sm ? 92 : 104);
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = `bold ${sm ? 13 : 15}px "Trebuchet MS", sans-serif`;
    ctx.fillText(L.title, pad + 10, top + 8);
    ctx.font = `${sm ? 12 : 13}px "Trebuchet MS", sans-serif`;
    ctx.fillText(`${km.toFixed(2)} / ${L.lengthKm} km   ${fmtTime(playTime)}`, pad + 10, top + (sm ? 28 : 31));
    const gap = playTime - ghostTimeAt(P.x);
    ctx.fillText(`Falls ${stats.falls}   Ghost `, pad + 10, top + (sm ? 45 : 50));
    const lw = ctx.measureText(`Falls ${stats.falls}   Ghost `).width;
    ctx.fillStyle = gap > 0 ? "#ffb08a" : "#9fef9f";
    ctx.fillText((gap > 0 ? "+" : "-") + fmtTime(Math.abs(gap)), pad + 10 + lw, top + (sm ? 45 : 50));
    ctx.fillStyle = "#fff";
    // progress bar
    const by = top + (sm ? 66 : 74), bw = pw - 20;
    ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(pad + 10, by, bw, 6);
    ctx.fillStyle = "#ffd34d"; ctx.fillRect(pad + 10, by, bw * km / L.lengthKm, 6);
    // stamina
    const sy = by + 12;
    ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(pad + 10, sy, bw, 8);
    ctx.fillStyle = P.stamina > 40 ? "#6ad16a" : P.stamina > 15 ? "#f0b030" : "#e04a3a";
    ctx.fillRect(pad + 10, sy, bw * P.stamina / 100, 8);
    ctx.font = "10px sans-serif"; ctx.fillStyle = "#fff"; ctx.textBaseline = "middle";
    ctx.fillText("stamina", pad + 14, sy + 4);

    // Altimeter (right side)
    const ax = W - (sm ? 44 : 56), ay = top + 84, ah = Math.min(sm ? 110 : 150, H * 0.3);
    panel(ax - 8, ay - 22, sm ? 44 : 52, ah + 44);
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(ax, ay, 8, ah);
    const minE = L.profile[0][1], maxE = L.profile[L.profile.length - 1][1];
    const k = (elev - minE) / (maxE - minE);
    ctx.fillStyle = "#7fd0ff"; ctx.fillRect(ax, ay + ah * (1 - k), 8, ah * k);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ax + 4, ay + ah * (1 - k), 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = `bold ${sm ? 10 : 12}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(elev + "m", ax + 4, ay - 8);
    ctx.font = "9px sans-serif";
    ctx.fillText("ALT", ax + 4, ay + ah + 14);

    // Balance gauge (top centre)
    const gx = W / 2, gy = top + (sm ? 112 : 46), gr = sm ? 34 : 42;
    ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.strokeStyle = "rgba(120,220,120,0.8)";
    ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI * 1.4, Math.PI * 1.6); ctx.stroke();
    const ang = -Math.PI / 2 + Math.max(-1.2, Math.min(1.2, P.lean)) * (0.35 * Math.PI / FALL_ANGLE);
    const danger = Math.abs(P.lean) / FALL_ANGLE;
    ctx.strokeStyle = danger > 0.7 ? "#ff5040" : "#fff"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(ang) * (gr + 4), gy + Math.sin(ang) * (gr + 4)); ctx.stroke();
    ctx.font = "10px sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.fillText("BALANCE", gx, gy + 12);
    if (danger > 0.55) {
      ctx.font = "bold 13px sans-serif"; ctx.fillStyle = "#ffd34d";
      ctx.fillText(P.lean > 0 ? (isTouch ? "◀ LEAN BACK!" : "S: LEAN BACK!") : (isTouch ? "LEAN FWD! ▶" : "W: LEAN FORWARD!"), gx, gy + 28);
    }

    // Popups
    let pyBig = H * 0.3, pySmall = H * 0.42;
    for (const p of popups) {
      const life = p.big ? 3 : 1.2;
      const a = Math.min(1, (life - p.t) * 2);
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = `bold ${p.big ? (sm ? 17 : 24) : (sm ? 14 : 17)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const y = p.big ? pyBig : pySmall - p.t * 30;
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.strokeText(p.text, W / 2, y);
      ctx.fillStyle = p.color; ctx.fillText(p.text, W / 2, y);
      if (p.big) pyBig += 32; else pySmall -= 22;
      ctx.globalAlpha = 1;
    }

    if (!isTouch && state === "play" && playTime < 12) {
      ctx.globalAlpha = Math.min(1, (12 - playTime) / 2);
      ctx.font = "15px sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
      ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,0.5)";
      const msg = "A / D: alternate legs  ·  W / S: lean forward / back  ·  SPACE: poles";
      ctx.strokeText(msg, W / 2, H - 30); ctx.fillText(msg, W / 2, H - 30);
      ctx.globalAlpha = 1;
    }
  }

  function centerCard(lines, sub) {
    screenTransform();
    ctx.fillStyle = "rgba(10,20,35,0.55)"; ctx.fillRect(0, 0, W, H);
    const sm = W < 600;
    let k = sm ? 0.68 : 1;
    const total = lines.reduce((a, l) => a + l[1] * 1.45, 0) + 50;
    k = Math.min(k, (H * 0.88) / total);
    let y = Math.max(H * 0.06, (H - total * k) / 2) + 20 * k;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const [txt, size, color] of lines) {
      const fs = size * k;
      ctx.font = `bold ${fs}px "Trebuchet MS", sans-serif`;
      ctx.fillStyle = color || "#fff";
      ctx.fillText(txt, W / 2, y);
      y += fs * 1.45;
    }
    if (sub) {
      ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
      ctx.font = `bold ${sm ? 16 : 20}px "Trebuchet MS", sans-serif`;
      ctx.fillStyle = "#ffd34d";
      ctx.fillText(sub, W / 2, Math.min(H - 20, y + 10));
      ctx.globalAlpha = 1;
    }
  }

  function drawTitle() {
    centerCard([
      ["QWOP TREKKING", 54, "#ffd34d"],
      ["Ryan's Annapurna Base Camp trek", 24],
      [" ", 10],
      [L.title + "   (" + L.date + ")", 22],
      [L.subtitle + " · 3.62 km · +684 m", 18, "#cfe6ff"],
      [" ", 10],
      [isTouch ? "Tap LEFT and RIGHT in turn to walk" : "A / D or ← / →: alternate legs", 18],
      [isTouch ? "Hold ◀ BACK / FWD ▶ to lean" : "Hold W / S or ↑ / ↓: lean forward / back", 18],
      [isTouch ? "Hold POLES to steady yourself and brace" : "Hold SPACE: trekking poles (steadier, slower)", 18],
      ["Keep the balance needle in the green. Lean into the hill!", 16, "#cfe6ff"],
      ["Brace with poles for donkeys, porters and wet rock. Race Ghost Ryan!", 16, "#cfe6ff"]
    ], isTouch ? "Tap to start" : "Press any key to start");
  }

  function drawFinish() {
    const r = L.ryan;
    const ratio = stats.steps ? (r.steps / stats.steps) : 0;
    centerCard([
      ["Checked in to the teahouse!", 40, "#ffd34d"],
      [L.title, 22],
      [" ", 8],
      [`Your time: ${fmtTime(stats.time)}   ·   Ghost Ryan: ${fmtTime(ghost.total)}`, 18],
      [stats.time < ghost.total ? "You beat Ghost Ryan!" : `Ghost Ryan got there ${fmtTime(stats.time - ghost.total)} earlier. (Real Ryan: ${r.moving} moving.)`, 15, stats.time < ghost.total ? "#9fef9f" : "#cfe6ff"],
      [`Your steps: ${stats.steps}   ·   Ryan's steps: ${r.steps.toLocaleString()}`, 18],
      [ratio > 1 ? `(each of your steps is worth ${ratio.toFixed(1)} Ryan steps. Giant.)` : " ", 15, "#cfe6ff"],
      [`Falls: ${stats.falls}   ·   Donkey bonks: ${stats.bonks}   ·   Snacks: ${stats.snacks}/${snacks.length}`, 18],
      [stats.falls === 0 ? "Not a single tumble. Sherpa-grade." : stats.falls < 4 ? "A few tumbles. Very authentic." : "The mountain won a few rounds.", 18, "#cfe6ff"],
      ["Day 2 coming soon...", 16, "#aaa"]
    ], isTouch ? "Tap to hike it again" : "Press any key to hike it again");
  }

  // ---------- Main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);

    // Camera
    const tx = P.x + 1.5, ty = groundY(P.x) + 1.4;
    camX += (tx - camX) * Math.min(1, dt * 4);
    camY += (ty - camY) * Math.min(1, dt * 3);
    if (Math.abs(camX - tx) > 30) { camX = tx; camY = ty; }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawSky();
    const sway = Math.sin(t * 0.9) * altFactor() * 0.02;
    worldTransform(sway);
    drawWorldBack();
    drawTerrain();
    drawBridge();
    drawWet();
    drawGhost();
    drawFriends();
    drawPorters();
    drawFront();
    drawDonkeys();
    drawPlayer();
    drawDust();
    if (mutter && state === "play") wText(mutter.text, P.x, groundY(P.x) + 2.25, 0.3, "#fff", "center", true);
    flushWorldTexts();
    drawWeather();
    if (state === "title") drawTitle();
    else if (state === "finished") drawFinish();
    else drawHUD();

    requestAnimationFrame(frame);
  }
  camX = P.x + 1.5; camY = groundY(P.x) + 1.4;
  requestAnimationFrame(frame);

  // Exposed for testing in the console
  window.__game = { get P() { return P; }, get state() { return state; }, step: (l) => startOrStep(l), get stats() { return stats; }, END_X: () => END_X };
})();
