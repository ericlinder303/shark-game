/* =========================================================================
 * fishing.js — The 2D side-view scene, the aim-and-drop cast, and the
 * reeling tug-of-war minigame.
 *
 * Flow:
 *   AIM   — fish swim around; move the cage over one and release to drop.
 *   HOOK  — the targeted fish is snared; brief grab animation.
 *   FIGHT — HOLD to reel it UP (cage rises with progress). Reeling raises
 *           tension; you must pulse-release to keep it down even in the calm.
 *           The fish SURGES with little warning — hold through a surge and the
 *           line snaps. Release to let it run.
 *   LANDING/DONE — resolve.
 * ========================================================================= */

(function () {
  const D = window.GAME_DATA;
  const { makeImage, aspect } = window.SpriteKit;
  const sfx = (name, ...a) => { const S = window.Sfx; if (S && S[name]) S[name](...a); };

  const PHASE = { AIM: "aim", HOOK: "hook", FIGHT: "fight", LANDING: "landing", DONE: "done" };

  const CATCH_R = 52;     // how close the cage center must be to a fish to snag it
  const WATER_TOP_F = 0.3; // fraction of height that is sky

  const F = {
    canvas: null, ctx: null, dpr: 1, W: 0, H: 0,
    scene: { level: null, cage: null },
    perks: {}, cb: {},
    phase: PHASE.AIM,

    // aim state
    school: [],            // swimming fish to target
    cageAimX: 0, cageAimY: 0,
    dropX: 0, dropY: 0,

    // current catch
    fish: null, fishImg: null, boatImg: null,
    hookTimer: 0, hookFromX: 0, hookFromY: 0,

    // fight state
    progress: 0, tension: 0, tensionLimit: 100,
    reeling: false, mode: "calm", modeTimer: 0, surging: false,
    // per-cast tuning
    calmReelGain: 22, calmReelTension: 10, surgeReelTension: 50,
    surgeReleaseLoss: 4, recovery: 24, calmDecay: 1,
    calmDur: 2, surgeDur: 1, tellDur: 0.3,

    landTimer: 0,
    t: 0, last: 0, bubbles: [], shakeUntil: 0,
    particles: [], landed: false,
  };

  // splash droplets at (x,y)
  function splashAt(x, y, n, power) {
    power = power || 1;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
      const sp = (45 + Math.random() * 90) * power;
      F.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 0.45 + Math.random() * 0.35, r: 1.5 + Math.random() * 2.6 });
    }
  }

  // ---- setup ------------------------------------------------------------
  function evXY(e) {
    const r = F.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function clampAim(x, y) {
    const top = F.H * WATER_TOP_F + 44;
    F.cageAimX = Math.max(46, Math.min(F.W - 46, x));
    F.cageAimY = Math.max(top, Math.min(F.H - 40, y));
  }
  function onMove(e) { if (F.phase === PHASE.AIM) { const p = evXY(e); clampAim(p.x, p.y); } }
  function onDown(e) {
    if (F.phase === PHASE.AIM) { const p = evXY(e); clampAim(p.x, p.y); e.preventDefault(); }
    else if (F.phase === PHASE.FIGHT) { F.reeling = true; sfx("startReel"); e.preventDefault(); }
  }
  function onUp() {
    if (F.phase === PHASE.AIM) dropCage();
    else { F.reeling = false; sfx("stopReel"); }
  }

  let wired = false;
  function init(canvas) {
    F.canvas = canvas;
    F.ctx = canvas.getContext("2d");
    resize();
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointercancel", onUp);
    if (!wired) {
      window.addEventListener("resize", resize);
      window.addEventListener("pointerup", onUp);
      for (let i = 0; i < 22; i++) F.bubbles.push(newBubble(true));
      F.last = performance.now();
      requestAnimationFrame(loop);
      wired = true;
    }
  }

  function resize() {
    const rect = F.canvas.getBoundingClientRect();
    F.dpr = Math.min(window.devicePixelRatio || 1, 2);
    F.W = rect.width; F.H = rect.height;
    F.canvas.width = Math.round(F.W * F.dpr);
    F.canvas.height = Math.round(F.H * F.dpr);
    F.ctx.setTransform(F.dpr, 0, 0, F.dpr, 0, 0);
    if (!F.cageAimX) { F.cageAimX = F.W / 2; F.cageAimY = F.H * 0.6; }
  }

  function newBubble(spread) {
    const waterTop = F.H * WATER_TOP_F;
    return { x: Math.random() * F.W, y: spread ? waterTop + Math.random() * (F.H - waterTop) : F.H,
             r: 1 + Math.random() * 3, sp: 8 + Math.random() * 24 };
  }

  // ---- scene / config ---------------------------------------------------
  function setScene({ level, cage }) {
    F.scene.level = level;
    F.scene.cage = cage;
    F.boatImg = makeImage(level.boat.sprite, level.boat.color);
    if (cage) makeImage(cage.sprite); // preload so the cage isn't blank for a frame
  }

  // Called once to wire callbacks + perks, then begins aiming.
  function start({ level, cage, perks, onPhase, onTick, onResult, onMiss }) {
    setScene({ level, cage });
    F.perks = perks || {};
    F.cb = { onPhase, onTick, onResult, onMiss };
    beginAim();
  }

  function setPhase(p) { F.phase = p; if (F.cb.onPhase) F.cb.onPhase(p); }

  // Build a fresh school of swimming fish from the current location pool.
  function beginAim() {
    const level = F.scene.level, cage = F.scene.cage;
    const pool = level.fish.map((id) => D.FISH_BY_ID[id]).filter(Boolean);
    const catchable = pool.filter((f) => f.difficulty <= cage.maxDifficulty);

    const n = 5 + Math.floor(Math.random() * 2); // 5–6 fish
    const picked = [];
    for (let i = 0; i < n; i++) picked.push(weightedPick(pool));
    // guarantee the player always has at least 3 catchable targets on screen
    if (catchable.length) {
      let have = picked.filter((f) => f.difficulty <= cage.maxDifficulty).length;
      for (let i = 0; have < Math.min(3, n) && i < picked.length; i++) {
        if (picked[i].difficulty > cage.maxDifficulty) { picked[i] = weightedPick(catchable); have++; }
      }
    }

    const waterTop = F.H * WATER_TOP_F;
    F.school = picked.map((f) => ({
      f,
      x: Math.random() * F.W,
      y: waterTop + 56 + Math.random() * Math.max(40, F.H - waterTop - 100),
      dir: Math.random() < 0.5 ? -1 : 1,
      speed: 16 + Math.random() * 30,
      bob: Math.random() * Math.PI * 2,
      w: Math.min(60 + f.difficulty * 6, 150),
    }));
    F.fish = null;
    F.reeling = false;
    setPhase(PHASE.AIM);
  }

  function weightedPick(pool) {
    let p = pool;
    if (F.perks.rare_luck && Math.random() < 0.2) {
      const minR = Math.min(...pool.map((f) => f.rarity));
      const rares = pool.filter((f) => f.rarity <= minR + 1);
      if (rares.length) p = rares;
    }
    const total = p.reduce((s, f) => s + f.rarity, 0);
    let r = Math.random() * total;
    for (const f of p) if ((r -= f.rarity) <= 0) return f;
    return p[p.length - 1];
  }

  // Nearest school fish within the cage's catch radius (or null).
  function findTarget() {
    let best = null, bestD = CATCH_R;
    for (const s of F.school) {
      const d = Math.hypot(s.x - F.cageAimX, s.y - F.cageAimY);
      if (d < bestD) { best = s; bestD = d; }
    }
    return best;
  }

  // Drop the cage at the current aim position.
  function dropCage() {
    const target = findTarget();
    F.dropX = F.cageAimX; F.dropY = F.cageAimY;
    splashAt(F.dropX, F.dropY, 8, 0.7);
    if (!target) { sfx("splash", 0.4); if (F.cb.onMiss) F.cb.onMiss({ reason: "empty" }); return; }
    if (target.f.difficulty > F.scene.cage.maxDifficulty) {
      sfx("splash", 0.5); if (F.cb.onMiss) F.cb.onMiss({ reason: "toobig", fish: target.f });
      return;
    }
    // hook it
    sfx("bite");
    F.fish = target.f;
    F.fishImg = makeImage(target.f.sprite, target.f.color);
    F.hookFromX = target.x; F.hookFromY = target.y;
    F.school = F.school.filter((s) => s !== target);
    F.hookTimer = 0.55;
    configureFight(target.f);
    setPhase(PHASE.HOOK);
  }

  function configureFight(fish) {
    const d = fish.difficulty;
    const margin = Math.max(0, F.scene.cage.maxDifficulty - d);

    // You only gain line in the calm — and even the calm builds real tension,
    // so you must pulse-release; just holding snaps the line on any fish past
    // an anchovy. Surges spike tension hard with little warning. Tuned via a
    // sim so skilled play scales ~6s (easy) to ~20s (great white).
    F.calmReelGain = (24 / (1 + d * 0.10)) * (1 + margin * 0.06) * (F.perks.fast_reel ? 1.12 : 1);
    F.calmReelTension = 6 + d * 1.0;             // can't just hold through the calm
    F.surgeReelTension = 46 + d * 10;            // holding through a surge snaps fast
    F.surgeReleaseLoss = 1.0 + d * 0.25;         // a surge steals a little line as it runs
    F.recovery = 26;                              // releasing recovers tension
    F.calmDecay = 1.0;
    F.calmDur = Math.max(1.0, 2.5 - d * 0.11);    // harder fish surge more often
    F.surgeDur = 0.55 + d * 0.05;                 // ...and run a little longer
    F.tellDur = Math.max(0.12, 0.34 - d * 0.022); // ...with less and less warning
    F.tensionLimit = 100 * (F.perks.tension_grace ? 1.10 : 1);

    F.progress = 0; F.tension = 0; F.reeling = false;
    F.mode = "calm"; F.modeTimer = 0.8; F.surging = false;
  }

  // ---- update -----------------------------------------------------------
  function loop(now) {
    const dt = Math.min((now - F.last) / 1000, 0.05);
    F.last = now; F.t += dt;
    update(dt); render();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    for (const b of F.bubbles) { b.y -= b.sp * dt; if (b.y < F.H * WATER_TOP_F) Object.assign(b, newBubble(false)); }
    for (let i = F.particles.length - 1; i >= 0; i--) {
      const p = F.particles[i];
      p.age += dt; p.vy += 320 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.age >= p.life) F.particles.splice(i, 1);
    }

    if (F.phase === PHASE.AIM) {
      const waterTop = F.H * WATER_TOP_F;
      for (const s of F.school) {
        s.x += s.dir * s.speed * dt;
        s.bob += dt * 1.6;
        if (s.x < -120) { s.x = F.W + 120; s.y = waterTop + 56 + Math.random() * Math.max(40, F.H - waterTop - 100); }
        if (s.x > F.W + 120) { s.x = -120; s.y = waterTop + 56 + Math.random() * Math.max(40, F.H - waterTop - 100); }
      }
    } else if (F.phase === PHASE.HOOK) {
      F.hookTimer -= dt;
      if (F.hookTimer <= 0) { F.mode = "calm"; F.modeTimer = 0.8; setPhase(PHASE.FIGHT); }
    } else if (F.phase === PHASE.FIGHT) {
      stepFight(dt);
    } else if (F.phase === PHASE.LANDING) {
      F.landTimer -= dt;
      if (F.landTimer <= 0) { setPhase(PHASE.DONE); if (F.cb.onResult) F.cb.onResult({ caught: true, fish: F.fish }); }
    }
  }

  function stepFight(dt) {
    // mode machine: calm -> tell (brief) -> surge -> calm
    F.modeTimer -= dt;
    if (F.modeTimer <= 0) {
      if (F.mode === "calm") { F.mode = "tell"; F.modeTimer = F.tellDur; F.shakeUntil = F.t + F.tellDur + 0.1; }
      else if (F.mode === "tell") { F.mode = "surge"; F.modeTimer = F.surgeDur * (0.8 + Math.random() * 0.5); sfx("surge"); }
      else { F.mode = "calm"; F.modeTimer = F.calmDur * (0.65 + Math.random() * 0.6); }
    }
    F.surging = F.mode === "surge";

    if (F.surging) {
      if (F.reeling) { F.tension += F.surgeReelTension * dt; }       // reeling into a run = snap
      else { F.tension -= F.recovery * dt; F.progress -= F.surgeReleaseLoss * dt; }
    } else { // calm or tell
      if (F.reeling) { F.progress += F.calmReelGain * dt; F.tension += F.calmReelTension * dt; }
      else { F.tension -= F.recovery * dt; F.progress -= F.calmDecay * dt; }
    }
    F.progress = Math.max(0, Math.min(100, F.progress));
    F.tension = Math.max(0, F.tension);

    if (F.cb.onTick) F.cb.onTick({ progress: F.progress, tension: Math.min(100, (F.tension / F.tensionLimit) * 100), mode: F.mode });

    const surfaceY = F.H * WATER_TOP_F + 34;
    if (F.tension >= F.tensionLimit) {
      F.reeling = false; sfx("stopReel"); sfx("snap");
      splashAt(F.W * 0.5, surfaceY, 10, 0.9);
      setPhase(PHASE.DONE);
      if (F.cb.onResult) F.cb.onResult({ caught: false, fish: F.fish });
      return;
    }
    if (F.progress >= 100) {
      F.reeling = false; sfx("stopReel"); sfx("splash", 1.3);
      splashAt(F.W * 0.5, surfaceY, 20, 1.3);
      F.landTimer = 0.7; setPhase(PHASE.LANDING);
    }
  }

  // ---- render -----------------------------------------------------------
  function render() {
    const ctx = F.ctx, W = F.W, H = F.H, waterTop = H * WATER_TOP_F;
    const level = F.scene.level;
    const pal = level ? level.palette : { top: "#6fc6d6", bottom: "#0c5870" };
    ctx.clearRect(0, 0, W, H);

    const sky = ctx.createLinearGradient(0, 0, 0, waterTop);
    sky.addColorStop(0, "#cfeaf2"); sky.addColorStop(1, "#eaf7fa");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, waterTop);
    ctx.fillStyle = "rgba(255,244,214,0.9)";
    ctx.beginPath(); ctx.arc(W * 0.82, waterTop * 0.42, 26, 0, Math.PI * 2); ctx.fill();

    const water = ctx.createLinearGradient(0, waterTop, 0, H);
    water.addColorStop(0, pal.top); water.addColorStop(1, pal.bottom);
    ctx.fillStyle = water; ctx.fillRect(0, waterTop, W, H - waterTop);

    ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = "#fff";
    for (let i = 0; i < 4; i++) { const x = W * (0.2 + i * 0.2);
      ctx.beginPath(); ctx.moveTo(x, waterTop); ctx.lineTo(x + 40, H); ctx.lineTo(x - 30, H); ctx.closePath(); ctx.fill(); }
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    for (const b of F.bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }

    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= W; x += 12) { const y = waterTop + Math.sin(x * 0.05 + F.t * 1.5) * 2; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();

    const bob = Math.sin(F.t * 1.6) * 3;
    const rock = Math.sin(F.t * 1.05) * 0.022; // gentle rocking, radians
    const boatW = Math.min(260, W * 0.5), boatH = boatW * (140 / 240);
    const pivotX = W * 0.5, pivotY = waterTop + bob; // rock about the waterline
    const img = F.boatImg;
    if (img && img.complete) {
      // faint reflection on the water (clipped below the surface)
      ctx.save();
      ctx.beginPath(); ctx.rect(0, waterTop, W, H - waterTop); ctx.clip();
      ctx.globalAlpha = 0.13;
      ctx.translate(pivotX, pivotY); ctx.rotate(-rock); ctx.scale(1, -0.55);
      ctx.drawImage(img, -boatW / 2, -boatH * 0.66, boatW, boatH);
      ctx.restore();
      // the boat, bobbing and rocking
      ctx.save();
      ctx.translate(pivotX, pivotY); ctx.rotate(rock);
      ctx.drawImage(img, -boatW / 2, -boatH * 0.66, boatW, boatH);
      ctx.restore();
    }

    // bow & stern wake foam riding the waterline
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (const off of [-0.32, 0.34]) {
      const wx = W * 0.5 + boatW * off;
      const wob = Math.sin(F.t * 4 + off * 10) * 1.5;
      ctx.beginPath(); ctx.ellipse(wx, pivotY + 3 + wob, 16, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    const lineTopX = W * 0.5 + boatW * 0.12, lineTopY = waterTop + bob;
    const surfaceY = waterTop + 34;

    // figure out cage position + draw the appropriate scene per phase
    if (F.phase === PHASE.AIM) {
      // swimming school
      for (const s of F.school) {
        const catchable = s.f.difficulty <= F.scene.cage.maxDifficulty;
        drawCreature(ctx, makeImage(s.f.sprite, s.f.color), s.x, s.y + Math.sin(s.bob) * 4, s.w, aspect(s.f.sprite), s.dir, catchable ? 1 : 0.92);
      }
      const target = findTarget();
      // aiming line from the boat down to the cage
      ctx.strokeStyle = "rgba(20,30,30,0.5)"; ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(lineTopX, lineTopY); ctx.lineTo(F.cageAimX, F.cageAimY); ctx.stroke(); ctx.setLineDash([]);
      const ring = target ? (target.f.difficulty <= F.scene.cage.maxDifficulty ? "#46d18a" : "#ff5a5a") : "rgba(255,255,255,0.55)";
      if (target) { // highlight the fish in range
        ctx.strokeStyle = ring; ctx.lineWidth = 3; ctx.beginPath();
        ctx.arc(target.x, target.y, target.w * 0.5 + 8, 0, Math.PI * 2); ctx.stroke();
      }
      // catch-zone ring around the cage (green=catchable, red=too big, white=none)
      ctx.save(); ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = ring; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(F.cageAimX, F.cageAimY, CATCH_R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      drawCageSprite(ctx, F.cageAimX, F.cageAimY, 0.95, target ? 1 : 0.82);
    } else {
      // HOOK / FIGHT / LANDING: the catch travels from the drop point up and
      // across to the boat as progress climbs — and grows a little as it nears
      // the surface — so you see it actually being reeled in.
      const targetX = lineTopX, targetY = surfaceY;
      let cageX, cageY, scale;
      if (F.phase === PHASE.HOOK) {
        cageX = F.dropX; cageY = F.dropY; scale = 0.8;
      } else if (F.phase === PHASE.FIGHT) {
        const k = F.progress / 100;
        cageX = F.dropX + (targetX - F.dropX) * k;
        cageY = F.dropY + (targetY - F.dropY) * k;
        scale = 0.8 + 0.25 * k;                       // nearer the boat = larger
      } else { // LANDING — lift it clear of the water up to the boat
        const k = 1 - F.landTimer / 0.7;
        cageX = targetX;
        cageY = targetY - k * (targetY - (lineTopY + 4));
        scale = 1.05;
      }

      const tNorm = F.phase === PHASE.FIGHT ? Math.min(1, F.tension / F.tensionLimit) : 0;
      ctx.strokeStyle = `rgb(${Math.round(40 + tNorm * 200)},${Math.round(70 - tNorm * 50)},${Math.round(80 - tNorm * 60)})`;
      ctx.lineWidth = 2 + tNorm * 2.5;
      ctx.beginPath(); ctx.moveTo(lineTopX, lineTopY); ctx.lineTo(cageX, cageY); ctx.stroke();

      drawFightFish(ctx, cageX, cageY, scale);
      drawCageSprite(ctx, cageX, cageY, scale, 1);
    }

    // splash droplets, drawn on top
    if (F.particles.length) {
      ctx.save(); ctx.fillStyle = "#eaf7fb";
      for (const p of F.particles) {
        ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawCreature(ctx, img, x, y, w, asp, dir, alpha) {
    if (!img || !img.complete) return;
    const h = w / asp;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(x, y);
    if (dir === -1) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawFightFish(ctx, cageX, cageY, scale) {
    if (!F.fishImg || !F.fishImg.complete || !F.fish) return;
    const asp = aspect(F.fish.sprite);
    const fw = Math.min(90 + F.fish.difficulty * 9, F.W * 0.42) * (scale || 1);

    let fx, fy;
    if (F.phase === PHASE.HOOK) {
      const k = 1 - F.hookTimer / 0.55;
      fx = F.hookFromX + (cageX - F.hookFromX) * k;
      fy = F.hookFromY + (cageY - F.hookFromY) * k;
    } else {
      const shake = (F.t < F.shakeUntil || F.surging) ? 9 : 3;
      fx = cageX + Math.sin(F.t * 18) * shake * (F.surging ? 1.5 : 0.6);
      fy = cageY + Math.sin(F.t * 9) * shake * (F.surging ? 1.2 : 0.6);
    }
    drawCreature(ctx, F.fishImg, fx, fy, fw, asp, F.fish && F.hookFromX > cageX ? -1 : 1, 1);
  }

  // Draws the equipped cage's sprite (transparent interior shows the catch).
  function drawCageSprite(ctx, x, y, scale, alpha) {
    const cage = F.scene.cage;
    const w = 84 * (scale || 1), h = 92 * (scale || 1);
    const img = cage ? makeImage(cage.sprite) : null;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    if (img && img.complete) {
      ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
    } else { // fallback box until the sprite finishes loading
      ctx.strokeStyle = "rgba(225,235,240,0.9)"; ctx.lineWidth = 3;
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    }
    ctx.restore();
  }

  window.Fishing = { init, setScene, start, beginAim, PHASE, get phase() { return F.phase; } };
})();
