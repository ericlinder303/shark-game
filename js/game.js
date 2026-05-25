/* =========================================================================
 * game.js — Game state, persistence, screen flow, and all DOM UI.
 *
 * Screens: title -> character select -> game (the dock). Overlays for the
 * catch card, the world map (locations), and the cage shop.
 * ========================================================================= */

(function () {
  const D = window.GAME_DATA;
  const { svgMarkup } = window.SpriteKit;
  const SAVE_KEY = "shark_game_save_v1";
  const sfx = (n, ...a) => { const S = window.Sfx; if (S && S[n]) S[n](...a); };

  // ---- tiny DOM helpers -------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else if (v != null) n.setAttribute(k, v);
    }
    for (const kid of kids) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(kid));
    return n;
  }

  // ---- state ------------------------------------------------------------
  let state = null;

  function defaultState() {
    return {
      character: null,            // { id, name, perkId }
      coins: 0,
      xp: 0,
      currentLevelIndex: 0,       // which location is being fished (0-based)
      cageId: "wire",
      ownedCages: ["wire"],
      caught: {},                 // fishId -> count
      escapes: 0,
      achievements: {},           // achievementId -> true once unlocked
      tutorialDone: false,        // first-run tutorial seen
    };
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ---- derived helpers --------------------------------------------------
  const cage = () => D.CAGES.find((c) => c.id === state.cageId);
  const character = () => D.CHARACTERS.find((c) => c.id === state.character.id);
  const level = () => D.LEVELS[state.currentLevelIndex];

  function unlockedCount() {
    let n = 0;
    for (const lv of D.LEVELS) if (state.xp >= lv.xpToUnlock) n++;
    return Math.max(1, n);
  }
  function isUnlocked(i) { return state.xp >= D.LEVELS[i].xpToUnlock; }

  function nextUnlock() {
    for (let i = 0; i < D.LEVELS.length; i++) {
      if (!isUnlocked(i)) return { index: i, xp: D.LEVELS[i].xpToUnlock };
    }
    return { index: null, xp: D.xpForNextBeyondLast() };
  }

  function perks() {
    const c = character();
    const p = {};
    if (c && c.perk) p[c.perk.id] = true;
    return p;
  }

  // ---- achievements -----------------------------------------------------
  const SHARK_SPRITES = ["shark", "shark_stocky", "shark_slim", "tigershark", "thresher", "hammerhead", "greatwhite", "whaleshark"];
  const BILL_SPRITES = ["billfish", "sailfish"];
  const ABYSS_IDS = ["oarfish", "colossal", "megamouth", "goblin", "frilled", "coelacanth", "beluga"];

  // Build the derived stat context that achievement metrics read.
  function achCtx() {
    const caughtIds = Object.keys(state.caught);
    const sharkTotal = D.FISH.filter((f) => SHARK_SPRITES.includes(f.sprite)).length;
    const billTotal = D.FISH.filter((f) => BILL_SPRITES.includes(f.sprite)).length;
    return {
      totalCaught: Object.values(state.caught).reduce((a, b) => a + b, 0),
      speciesCaught: caughtIds.length,
      totalSpecies: D.FISH.length,
      caughtSharks: caughtIds.filter((id) => SHARK_SPRITES.includes(D.FISH_BY_ID[id].sprite)).length,
      sharkTotal,
      caughtBills: caughtIds.filter((id) => BILL_SPRITES.includes(D.FISH_BY_ID[id].sprite)).length,
      billTotal,
      bestDifficulty: caughtIds.reduce((m, id) => Math.max(m, D.FISH_BY_ID[id].difficulty), 0),
      hasGW: !!state.caught["greatwhite"],
      abyssCaught: ABYSS_IDS.filter((id) => state.caught[id]).length,
      unlocked: unlockedCount(),
      totalLevels: D.LEVELS.length,
      hasSteel: ["steel", "shark", "titanium"].some((id) => state.ownedCages.includes(id)),
      hasTitanium: state.ownedCages.includes("titanium"),
      coins: state.coins,
      escapes: state.escapes || 0,
    };
  }
  const achTarget = (a, ctx) => (typeof a.target === "function" ? a.target(ctx) : a.target);
  const achDone = (a, ctx) => a.metric(ctx) >= achTarget(a, ctx);

  // Check for newly-met achievements. `silent` marks them without reward/banner
  // (used once on load so pre-existing saves don't spam toasts retroactively).
  function checkAchievements(silent) {
    const ctx = achCtx();
    if (!state.achievements) state.achievements = {};
    let changed = false;
    for (const a of D.ACHIEVEMENTS) {
      if (state.achievements[a.id]) continue;
      if (achDone(a, ctx)) {
        state.achievements[a.id] = true;
        changed = true;
        if (!silent) { state.coins += a.reward || 0; notifyAchievement(a); }
      }
    }
    if (changed) { save(); if (!silent) renderHUD(); }
  }

  // sliding achievement banner (queued, shown above everything)
  let achQueue = [], achShowing = false;
  function notifyAchievement(a) { achQueue.push(a); if (!achShowing) showNextAch(); }
  function showNextAch() {
    if (!achQueue.length) { achShowing = false; return; }
    achShowing = true;
    const a = achQueue.shift();
    const banner = el("div", { class: "ach-banner" },
      el("div", { class: "ach-icon" }, a.icon),
      el("div", { class: "ach-text" },
        el("div", { class: "ach-head" }, "🏆 Achievement Unlocked"),
        el("div", { class: "ach-name" }, a.name),
        a.reward ? el("div", { class: "ach-reward" }, "+" + a.reward + " 🪙") : null));
    $("#app").append(banner);
    sfx("achievement");
    requestAnimationFrame(() => banner.classList.add("show"));
    setTimeout(() => { banner.classList.remove("show"); setTimeout(() => { banner.remove(); showNextAch(); }, 360); }, 2600);
  }

  // =======================================================================
  // SCREEN: TITLE
  // =======================================================================
  function showTitle() {
    const saved = load();
    const root = $("#app");
    root.innerHTML = "";
    root.append(
      el("div", { class: "screen title-screen" },
        el("div", { class: "title-art", html: titleWaves() }),
        el("h1", { class: "title" }, "CAGE & TIDE"),
        el("p", { class: "subtitle" }, "A cage-fishing adventure — from baitfish to the great white."),
        el("div", { class: "title-buttons" },
          saved
            ? el("button", { class: "btn btn-primary", onclick: () => { state = Object.assign(defaultState(), saved); enterGame(); } },
                `Continue as ${saved.character ? saved.character.name : "Angler"}`)
            : null,
          el("button", { class: "btn " + (saved ? "btn-ghost" : "btn-primary"), onclick: saved ? confirmNewGame : startNew }, saved ? "New Game" : "Start Fishing"),
        ),
        el("p", { class: "hint" }, "Hold to reel · release during a surge so the line doesn't snap")
      )
    );
  }

  function startNew() {
    state = defaultState();
    showCharacterSelect();
  }

  // In-game pause menu (opened by the ☰ button on the scene).
  function showMenu() {
    overlay(el("div", { class: "card menu-card" },
      el("h2", { class: "panel-title" }, "⏸ Menu"),
      el("div", { class: "menu-list" },
        el("button", { class: "btn btn-primary wide", onclick: () => { sfx("click"); closeOverlay(); } }, "Resume"),
        el("button", { class: "btn btn-ghost wide", onclick: () => { sfx("click"); closeOverlay(); Tut.start(); } }, "❓ How to Play"),
        el("button", { class: "btn btn-ghost wide", onclick: () => { sfx("click"); closeOverlay(); showCharacterSelect(); } }, "🎭 Change Angler"),
        el("button", { class: "btn btn-ghost wide", onclick: () => { sfx("click"); save(); closeOverlay(); showTitle(); } }, "🏠 Back to Title"),
        el("button", { class: "btn btn-ghost wide danger-btn", onclick: () => { sfx("click"); confirmNewGame(); } }, "🔄 New Game")
      )
    ));
  }

  function confirmNewGame() {
    overlay(el("div", { class: "card menu-card" },
      el("div", { class: "card-banner" }, "⚠ Start a New Game?"),
      el("p", { class: "card-desc" }, "This permanently erases your current progress — coins, XP, catches, and achievements."),
      el("div", { class: "row-center" },
        el("button", { class: "btn btn-ghost", onclick: () => { sfx("click"); closeOverlay(); } }, "Cancel"),
        el("button", { class: "btn btn-primary danger-btn", onclick: () => { sfx("click"); doNewGame(); } }, "Erase & Start")
      )
    ));
  }

  function doNewGame() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    state = defaultState();
    closeOverlay();
    showCharacterSelect();
  }

  // =======================================================================
  // FIRST-RUN TUTORIAL — contextual coach callouts driven by game phases.
  // Auto-starts on a fresh game; replayable from the menu; fully skippable.
  // =======================================================================
  const Tut = {
    active: false, step: null, el: null, success: false, retry: false,

    // a non-blocking coach callout in the scene (canvas stays interactive)
    coach(html, opts) {
      opts = opts || {};
      if (!dom.scene) return;
      if (!this.el) { this.el = el("div", { class: "coach" }); dom.scene.append(this.el); }
      this.el.className = "coach" + (opts.urgent ? " urgent" : "");
      this.el.innerHTML = "";
      this.el.append(el("div", { class: "coach-text", html }));
      const row = el("div", { class: "coach-actions" });
      if (opts.primary) row.append(el("button", { class: "btn btn-primary btn-small", onclick: opts.primary.onclick }, opts.primary.label));
      if (opts.skip !== false) row.append(el("button", { class: "coach-skip", onclick: () => { sfx("click"); Tut.finish(); } }, "Skip tutorial"));
      this.el.append(row);
    },

    start() {
      this.active = true; this.success = false; this.retry = false; this.step = "welcome"; this.el = null;
      overlay(el("div", { class: "card menu-card" },
        el("div", { class: "card-banner" }, "👋 WELCOME, ANGLER"),
        el("p", { class: "card-desc" }, "Let's land your first fish: lower the cage onto a fish, then reel it up without snapping the line."),
        el("div", { class: "row-center" },
          el("button", { class: "btn btn-ghost", onclick: () => { sfx("click"); Tut.finish(); } }, "Skip"),
          el("button", { class: "btn btn-primary", onclick: () => { sfx("click"); closeOverlay(); Tut.aim(); } }, "Let's go!")
        )
      ));
    },
    aim() {
      this.step = "aim";
      this.coach(this.retry
        ? "💥 Snapped! That happens when you reel <b>through a surge</b>. Drop the cage on a fish and try again — let go the moment it runs."
        : "👆 <b>Move the cage</b> over a fish until its ring turns <b style='color:#46d18a'>green</b>, then <b>release</b> to drop it.");
    },
    reel() {
      this.step = "reel";
      this.coach("✊ <b>Press and hold</b> anywhere to reel it up. But watch the red <b>TENSION</b> bar — don't let it fill!");
    },
    surge() {
      this.step = "surge";
      this.coach("⚠ It's <b>running</b>! <b>LET GO NOW</b> — reeling during a surge snaps the line. Reel again once it calms.", { urgent: true });
    },
    finalTip() {
      this.step = "final";
      this.coach("🎉 <b>You did it!</b> Earn <b>coins</b> for bigger cages (🛒) and <b>XP</b> to unlock new waters (🗺️). Tight lines!",
        { skip: false, primary: { label: "Got it!", onclick: () => { sfx("click"); Tut.finish(); } } });
    },

    onPhase(p) {
      if (!this.active) return;
      const P = window.Fishing.PHASE;
      if (p === P.AIM) { this.success ? this.finalTip() : this.aim(); }
      else if (p === P.FIGHT) { if (!this.success && this.step !== "surge") this.reel(); }
    },
    onTick(mode) { if (this.active && mode === "surge" && this.step === "reel") this.surge(); },
    onMiss(reason) {
      if (!this.active || this.step !== "aim") return;
      this.coach(reason === "toobig"
        ? "🚫 Too big for your starter cage — aim at a <b>smaller</b> fish (green ring)."
        : "🎯 Missed — line the cage up <b>right over</b> a fish until the ring turns green, then release.");
    },
    onResult(caught) {
      if (!this.active) return;
      if (caught) this.success = true; else { this.retry = true; this.step = "aim"; }
    },
    finish() {
      this.active = false; this.step = null;
      if (this.el) { this.el.remove(); this.el = null; }
      state.tutorialDone = true; save();
    },
  };

  function maybeStartTutorial() {
    const fresh = Object.keys(state.caught).length === 0 && state.xp === 0 && (state.escapes || 0) === 0;
    if (!state.tutorialDone && fresh) Tut.start();
  }

  // =======================================================================
  // SCREEN: CHARACTER SELECT
  // =======================================================================
  function showCharacterSelect() {
    let chosen = (state.character && state.character.id) || D.CHARACTERS[0].id;
    const root = $("#app");
    root.innerHTML = "";

    const nameInput = el("input", { class: "name-input", type: "text", maxlength: "16", placeholder: "Name your angler", value: (state.character && state.character.name) || "" });

    const cards = el("div", { class: "char-grid" });
    function renderCards() {
      cards.innerHTML = "";
      for (const c of D.CHARACTERS) {
        const selected = c.id === chosen;
        cards.append(
          el("button", { class: "char-card" + (selected ? " selected" : ""), onclick: () => { chosen = c.id; renderCards(); } },
            el("div", { class: "char-art", html: svgMarkup(c.sprite) }),
            el("div", { class: "char-name" }, c.title),
            el("div", { class: "char-blurb" }, c.blurb),
            el("div", { class: "char-perk" }, "⚡ " + c.perk.label)
          )
        );
      }
    }
    renderCards();

    root.append(
      el("div", { class: "screen select-screen" },
        el("h2", { class: "screen-title" }, "Choose your angler"),
        cards,
        el("div", { class: "name-row" }, nameInput),
        el("div", { class: "row-center" },
          el("button", { class: "btn btn-ghost", onclick: showTitle }, "Back"),
          el("button", { class: "btn btn-primary", onclick: () => {
            const c = D.CHARACTERS.find((x) => x.id === chosen);
            const name = (nameInput.value || "").trim() || c.title.split(" ")[0];
            state.character = { id: c.id, name, perkId: c.perk.id };
            save();
            enterGame();
          } }, "Set Sail →")
        )
      )
    );
  }

  // =======================================================================
  // SCREEN: GAME (the dock)
  // =======================================================================
  let dom = {}; // cached references to live game-screen elements

  function enterGame() {
    // default to the highest unlocked location on entry
    state.currentLevelIndex = Math.min(state.currentLevelIndex, unlockedCount() - 1);
    if (!isUnlocked(state.currentLevelIndex)) state.currentLevelIndex = unlockedCount() - 1;
    checkAchievements(true); // silent sync so pre-existing progress doesn't spam banners
    save();
    buildGameScreen();
    maybeStartTutorial();
  }

  function buildGameScreen() {
    const root = $("#app");
    root.innerHTML = "";

    const canvas = el("canvas", { id: "scene-canvas", class: "scene-canvas" });

    // fight overlay (bars + prompt) — hidden until a fish is on
    const tensionFill = el("div", { class: "bar-fill tension-fill" });
    const progressFill = el("div", { class: "bar-fill progress-fill" });
    const fightPrompt = el("div", { class: "fight-prompt" }, "FISH ON!");
    const fightUI = el("div", { class: "fight-ui hidden" },
      el("div", { class: "bar-wrap" },
        el("div", { class: "bar-label" }, "LINE TENSION"),
        el("div", { class: "bar tension-bar" }, tensionFill)
      ),
      el("div", { class: "bar-wrap" },
        el("div", { class: "bar-label" }, "REELED IN"),
        el("div", { class: "bar progress-bar" }, progressFill)
      ),
      fightPrompt
    );

    // aim hint / transient status
    const aimHint = el("div", { class: "aim-hint" }, "Move the cage over a fish, then release to drop it");
    const statusMsg = el("div", { class: "status-msg" }, "");
    const castBar = el("div", { class: "cast-bar" }, aimHint, statusMsg);

    const muteBtn = el("button", { class: "mute-btn", title: "Sound on/off",
      onclick: () => { const m = window.Sfx ? window.Sfx.toggleMute() : true; muteBtn.textContent = m ? "🔇" : "🔊"; } },
      (window.Sfx && window.Sfx.isMuted()) ? "🔇" : "🔊");

    const menuBtn = el("button", { class: "menu-btn", title: "Menu", onclick: () => { sfx("click"); showMenu(); } }, "☰");

    const scene = el("div", { class: "scene" }, canvas, fightUI, castBar, muteBtn, menuBtn);

    // HUD top bar
    const hud = el("div", { class: "hud" });

    // bottom actions
    const actions = el("div", { class: "actions" },
      el("button", { class: "btn btn-ghost", onclick: showLocations }, "🗺️ Map"),
      el("button", { class: "btn btn-ghost", onclick: showShop }, "🛒 Cages"),
      el("button", { class: "btn btn-ghost", onclick: showCollection }, "📖 Log"),
      el("button", { class: "btn btn-ghost", onclick: showGoals }, "🏆 Goals")
    );

    root.append(el("div", { class: "screen game-screen" }, hud, scene, actions));

    dom = { canvas, scene, fightUI, tensionFill, progressFill, fightPrompt, aimHint, statusMsg, hud };

    // (re)bind the canvas engine and start aiming
    window.Fishing.init(canvas);
    window.Fishing.start({ level: level(), cage: cage(), perks: perks(), onPhase, onTick, onResult, onMiss });
    renderHUD();
  }

  function renderHUD() {
    const lv = level();
    const uc = unlockedCount();
    const nxt = nextUnlock();
    const c = character();

    // xp bar toward next unlock
    const prevReq = uc > 0 && uc <= D.LEVELS.length ? D.LEVELS[Math.max(0, uc - 1)].xpToUnlock : 0;
    const span = Math.max(1, nxt.xp - prevReq);
    const pct = Math.max(0, Math.min(100, ((state.xp - prevReq) / span) * 100));

    dom.hud.innerHTML = "";
    dom.hud.append(
      el("div", { class: "hud-left" },
        el("div", { class: "hud-avatar", html: svgMarkup(c.sprite) }),
        el("div", {},
          el("div", { class: "hud-name" }, state.character.name),
          el("div", { class: "hud-sub" }, `Rank ${uc} · ${lv.boat.name}`)
        )
      ),
      el("div", { class: "hud-center" },
        el("div", { class: "hud-loc" }, "📍 " + lv.location),
        el("div", { class: "xp-bar" }, el("div", { class: "xp-fill", style: `width:${pct}%` })),
        el("div", { class: "hud-xp" }, nxt.index != null
          ? `${state.xp} XP · ${nxt.xp - state.xp} to ${D.LEVELS[nxt.index].location.split(",")[0]}`
          : `${state.xp} XP · all waters unlocked!`)
      ),
      el("div", { class: "hud-right" },
        el("div", { class: "coins" }, "🪙 " + state.coins),
        el("div", { class: "hud-cage" },
          el("span", { class: "hud-cage-icon", html: svgMarkup(cage().sprite) }),
          cage().name)
      )
    );
  }

  // ---- the aim-and-drop + fight flow ------------------------------------
  let statusTimer = null;
  function flashStatus(msg) {
    dom.statusMsg.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { dom.statusMsg.textContent = ""; }, 2200);
  }

  function onPhase(p) {
    const P = window.Fishing.PHASE;
    if (p === P.AIM) {
      dom.fightUI.classList.add("hidden");
      dom.aimHint.classList.remove("hidden");
    } else if (p === P.HOOK) {
      dom.aimHint.classList.add("hidden");
      flashStatus("Hooked! Press and hold to reel it up.");
    } else if (p === P.FIGHT) {
      dom.fightUI.classList.remove("hidden");
      dom.fightPrompt.textContent = "Hold to reel";
      dom.fightPrompt.className = "fight-prompt";
    } else if (p === P.LANDING) {
      dom.fightPrompt.textContent = "LANDED!";
    }
    Tut.onPhase(p);
  }

  function onMiss({ reason, fish }) {
    if (reason === "toobig") flashStatus(`Your cage is too small for the ${fish.name}! Buy a bigger cage. 🛒`);
    else flashStatus("The cage came up empty — line it up on a fish.");
    Tut.onMiss(reason);
  }

  function onTick({ progress, tension, mode }) {
    dom.tensionFill.style.width = tension + "%";
    dom.progressFill.style.width = progress + "%";
    dom.tensionFill.classList.toggle("danger", tension > 70);
    if (mode === "surge") {
      dom.fightPrompt.textContent = "⚠ SURGING — LET GO!";
      dom.fightPrompt.className = "fight-prompt warn";
    } else if (mode === "tell") {
      dom.fightPrompt.textContent = "⚠ it's about to run…";
      dom.fightPrompt.className = "fight-prompt tell";
    } else {
      dom.fightPrompt.textContent = "Hold to reel";
      dom.fightPrompt.className = "fight-prompt";
    }
    Tut.onTick(mode);
  }

  function onResult({ caught, fish }) {
    dom.fightUI.classList.add("hidden");

    const beforeUnlocked = unlockedCount();
    if (caught) {
      state.coins += fish.points;
      state.xp += fish.points;
      state.caught[fish.id] = (state.caught[fish.id] || 0) + 1;
      sfx("fanfare", fish.difficulty >= 8);
      setTimeout(() => sfx("coin"), 220);
      floatPoints("+" + fish.points + " 🪙");
    } else {
      state.escapes += 1;
      sfx("escape");
      shakeScene();
    }
    save();
    renderHUD();
    checkAchievements(false); // award + banner any newly-earned goals
    Tut.onResult(caught);

    showCatchCard(caught, fish, unlockedCount() > beforeUnlocked);
  }

  // floating "+points" text that drifts up and fades
  function floatPoints(txt) {
    if (!dom.scene) return;
    const n = el("div", { class: "float-points" }, txt);
    dom.scene.append(n);
    setTimeout(() => n.remove(), 1200);
  }
  // brief screen shake on the scene canvas
  function shakeScene() {
    if (!dom.canvas) return;
    dom.canvas.classList.remove("shake");
    void dom.canvas.offsetWidth; // force reflow so the animation restarts
    dom.canvas.classList.add("shake");
  }

  // =======================================================================
  // OVERLAY: CATCH CARD
  // =======================================================================
  function overlay(contentNode, { onClose } = {}) {
    closeOverlay();
    const ov = el("div", { class: "overlay", onclick: (e) => { if (e.target === ov) { closeOverlay(); onClose && onClose(); } } },
      contentNode);
    ov.id = "overlay";
    $("#app").append(ov);
    return ov;
  }
  function closeOverlay() { const o = $("#overlay"); if (o) o.remove(); }

  // Resume aiming with a fresh school (after a catch card / navigation).
  function resume() { window.Fishing.beginAim(); }

  function showCatchCard(caught, fish, newlyUnlocked) {
    const isNew = caught && state.caught[fish.id] === 1;
    const card = el("div", { class: "card catch-card " + (caught ? "win" : "lose") },
      el("div", { class: "card-banner" }, caught ? (fish.difficulty >= 9 ? "🏆 LEGENDARY CATCH!" : "✅ CATCH!") : "💨 It got away!"),
      caught
        ? el("div", { class: "card-art", html: svgMarkup(fish.sprite, fish.color) })
        : el("div", { class: "card-art faded", html: svgMarkup(fish.sprite, fish.color) }),
      el("h2", { class: "card-title" }, fish.name, isNew ? el("span", { class: "new-tag" }, "NEW!") : null),
      el("div", { class: "card-stats" },
        statChip("Difficulty", D.difficultyLabel(fish.difficulty) + ` (${fish.difficulty}/10)`),
        statChip("Length", fish.length),
        statChip(caught ? "Earned" : "Worth", "🪙 " + fish.points)
      ),
      el("p", { class: "card-desc" }, fish.desc),
      !caught ? el("p", { class: "card-tip" }, "Tip: stop reeling the instant it surges — even brief holds through a run snap the line.") : null,
      el("button", { class: "btn btn-primary", onclick: () => { sfx("click"); closeOverlay(); if (newlyUnlocked) showUnlockToast(); else resume(); } }, "Continue")
    );
    overlay(card, { onClose: () => { if (!newlyUnlocked) resume(); } });
  }

  function statChip(label, val) {
    return el("div", { class: "stat-chip" }, el("span", { class: "chip-label" }, label), el("span", { class: "chip-val" }, val));
  }

  function showUnlockToast() {
    const nextIdx = unlockedCount() - 1;
    const lv = D.LEVELS[nextIdx];
    const card = el("div", { class: "card unlock-card" },
      el("div", { class: "card-banner" }, "🌊 NEW WATERS UNLOCKED"),
      el("h2", { class: "card-title" }, lv.location),
      el("div", { class: "card-art-boat", html: svgMarkup(lv.boat.sprite, lv.boat.color) }),
      el("p", { class: "card-desc" }, lv.tagline),
      el("p", { class: "card-tip" }, `New boat available: ${lv.boat.name}`),
      el("div", { class: "row-center" },
        el("button", { class: "btn btn-ghost", onclick: () => { closeOverlay(); resume(); } }, "Stay here"),
        el("button", { class: "btn btn-primary", onclick: () => { state.currentLevelIndex = nextIdx; save(); closeOverlay(); window.Fishing.setScene({ level: level(), cage: cage() }); renderHUD(); resume(); } }, "Sail there →")
      )
    );
    overlay(card, { onClose: resume });
  }

  // =======================================================================
  // OVERLAY: LOCATIONS / MAP
  // =======================================================================
  function showLocations() {
    const list = el("div", { class: "loc-list" });
    D.LEVELS.forEach((lv, i) => {
      const unlocked = isUnlocked(i);
      const current = i === state.currentLevelIndex;
      list.append(
        el("button", {
          class: "loc-row" + (current ? " current" : "") + (unlocked ? "" : " locked"),
          onclick: () => {
            if (!unlocked) return;
            state.currentLevelIndex = i; save();
            window.Fishing.setScene({ level: level(), cage: cage() });
            renderHUD(); closeOverlay(); resume();
          },
        },
          el("div", { class: "loc-num" }, unlocked ? String(lv.n) : "🔒"),
          el("div", { class: "loc-body" },
            el("div", { class: "loc-name" }, lv.location),
            el("div", { class: "loc-tag" }, unlocked ? lv.tagline : `Reach ${lv.xpToUnlock} XP to unlock`),
            el("div", { class: "loc-boat" }, "⛵ " + lv.boat.name)
          ),
          current ? el("div", { class: "loc-here" }, "HERE") : null
        )
      );
    });
    overlay(el("div", { class: "card panel" },
      el("h2", { class: "panel-title" }, "🗺️ Fishing Locations"),
      list,
      el("button", { class: "btn btn-ghost wide", onclick: closeOverlay }, "Close")
    ));
  }

  // =======================================================================
  // OVERLAY: SHOP (cages)
  // =======================================================================
  function showShop() {
    const list = el("div", { class: "shop-list" });
    function rebuild() {
      list.innerHTML = "";
      D.CAGES.forEach((cg) => {
        const owned = state.ownedCages.includes(cg.id);
        const equipped = state.cageId === cg.id;
        const canAfford = state.coins >= cg.cost;
        let btn;
        if (equipped) btn = el("button", { class: "btn btn-small btn-equipped", disabled: "" }, "Equipped");
        else if (owned) btn = el("button", { class: "btn btn-small", onclick: () => { sfx("click"); state.cageId = cg.id; save(); window.Fishing.setScene({ level: level(), cage: cage() }); renderHUD(); rebuild(); resume(); } }, "Equip");
        else btn = el("button", { class: "btn btn-small " + (canAfford ? "btn-primary" : ""), disabled: canAfford ? null : "", onclick: () => {
            if (state.coins < cg.cost) return;
            state.coins -= cg.cost; state.ownedCages.push(cg.id); state.cageId = cg.id; save(); sfx("coin");
            window.Fishing.setScene({ level: level(), cage: cage() }); renderHUD(); rebuild(); resume(); checkAchievements(false);
          } }, canAfford ? `Buy 🪙${cg.cost}` : `🪙${cg.cost}`);

        list.append(
          el("div", { class: "shop-row" + (equipped ? " equipped" : "") },
            el("div", { class: "shop-art", html: svgMarkup(cg.sprite) }),
            el("div", { class: "shop-body" },
              el("div", { class: "shop-name" }, cg.name),
              el("div", { class: "shop-desc" }, cg.desc),
              el("div", { class: "shop-max" }, `Holds fish up to difficulty ${cg.maxDifficulty}/10`)
            ),
            btn
          )
        );
      });
    }
    rebuild();
    overlay(el("div", { class: "card panel" },
      el("h2", { class: "panel-title" }, "🛒 Cages"),
      el("div", { class: "panel-sub" }, "🪙 " + state.coins + " available · bigger cages hold bigger fish"),
      list,
      el("button", { class: "btn btn-ghost wide", onclick: closeOverlay }, "Close")
    ));
  }

  // =======================================================================
  // OVERLAY: COLLECTION LOG
  // =======================================================================
  function showCollection() {
    const grid = el("div", { class: "log-grid" });
    const totalCaught = Object.values(state.caught).reduce((a, b) => a + b, 0);
    D.FISH.forEach((f) => {
      const count = state.caught[f.id] || 0;
      const seen = count > 0;
      grid.append(
        el("div", { class: "log-cell" + (seen ? "" : " unseen") },
          el("div", { class: "log-art", html: svgMarkup(f.sprite, seen ? f.color : "#33454f") }),
          el("div", { class: "log-name" }, seen ? f.name : "???"),
          el("div", { class: "log-meta" }, seen ? `×${count} · 🪙${f.points}` : `diff ${f.difficulty}/10`)
        )
      );
    });
    overlay(el("div", { class: "card panel" },
      el("h2", { class: "panel-title" }, "📖 Catch Log"),
      el("div", { class: "panel-sub" }, `${Object.keys(state.caught).length}/${D.FISH.length} species · ${totalCaught} caught · ${state.escapes} got away`),
      grid,
      el("button", { class: "btn btn-ghost wide", onclick: closeOverlay }, "Close")
    ));
  }

  // =======================================================================
  // OVERLAY: GOALS / ACHIEVEMENTS
  // =======================================================================
  function showGoals() {
    const ctx = achCtx();
    const earned = D.ACHIEVEMENTS.filter((a) => state.achievements && state.achievements[a.id]).length;

    // personal records
    let best = null;
    for (const id of Object.keys(state.caught)) { const f = D.FISH_BY_ID[id]; if (!best || f.points > best.points) best = f; }
    const records = el("div", { class: "records" },
      statChip("Biggest catch", best ? `${best.name}` : "—"),
      statChip("Species", `${ctx.speciesCaught}/${ctx.totalSpecies}`),
      statChip("Total caught", String(ctx.totalCaught)),
      statChip("Locations", `${ctx.unlocked}/${ctx.totalLevels}`),
      statChip("Lifetime pts", String(state.xp)),
      statChip("Got away", String(ctx.escapes))
    );

    const list = el("div", { class: "goal-list" });
    D.ACHIEVEMENTS.forEach((a) => {
      const done = !!(state.achievements && state.achievements[a.id]);
      const tgt = achTarget(a, ctx);
      const cur = Math.min(a.metric(ctx), tgt);
      const pct = Math.max(0, Math.min(100, (cur / tgt) * 100));
      list.append(
        el("div", { class: "goal-row" + (done ? " done" : "") },
          el("div", { class: "goal-icon" }, done ? a.icon : "🔒"),
          el("div", { class: "goal-body" },
            el("div", { class: "goal-name" }, a.name, done ? el("span", { class: "goal-check" }, "✓") : null),
            el("div", { class: "goal-desc" }, a.desc),
            el("div", { class: "goal-bar" }, el("div", { class: "goal-fill", style: `width:${pct}%` })),
            tgt > 1 ? el("div", { class: "goal-prog" }, `${cur} / ${tgt}`) : null
          ),
          el("div", { class: "goal-reward" + (done ? " claimed" : "") }, `🪙 ${a.reward}`)
        )
      );
    });

    overlay(el("div", { class: "card panel" },
      el("h2", { class: "panel-title" }, "🏆 Goals"),
      el("div", { class: "panel-sub" }, `${earned}/${D.ACHIEVEMENTS.length} achievements unlocked`),
      records,
      list,
      el("button", { class: "btn btn-ghost wide", onclick: closeOverlay }, "Close")
    ));
  }

  // ---- decorative title waves ------------------------------------------
  function titleWaves() {
    return `<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 70 Q50 50 100 70 T200 70 T300 70 T400 70 V120 H0Z" fill="#0c5f7a" opacity="0.7"/>
      <path d="M0 84 Q50 64 100 84 T200 84 T300 84 T400 84 V120 H0Z" fill="#08475c"/>
      <text x="200" y="46" text-anchor="middle" font-size="44">🦈</text>
    </svg>`;
  }

  // ---- boot -------------------------------------------------------------
  window.addEventListener("DOMContentLoaded", showTitle);
})();
