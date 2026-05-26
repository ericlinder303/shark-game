# 🦈 Cage & Tide

A 2D cage-fishing game. Lower a cage off your boat, reel in a tug-of-war against
the fish, and work your way up from sardines to the great white shark across ten
real-world fishing destinations.

This is an **MVP** built to iterate on. Everything is plain HTML/CSS/JS — no build
step, no dependencies.

## Run it

Just open `index.html` in a browser (double-click it, or drag it into Chrome/Safari).

For the smoothest experience (and to mimic how it'll behave when wrapped for iOS),
serve it locally instead:

```bash
cd Shark_Game
python3 -m http.server 8000
# then visit http://localhost:8000
```

Progress saves automatically to the browser's `localStorage`.

## How to play

1. **Choose an angler** and name them. Each has a small perk.
2. **Aim and drop the cage.** Fish swim around the scene. Move the cage (mouse, or drag on touch) over a fish — the ring turns **green** when a catchable fish is in range, **red** if it's too big for your current cage — then **release** to drop. Miss, and the cage comes up empty; drop on something too big and it won't hold.
3. **Reel it up (the tug-of-war):** press and hold to reel; release to ease tension.
   - You gain line **only while reeling in the calm**, and even the calm steadily raises **LINE TENSION** — so you must **pulse** the reel, not just hold it. Holding continuously will snap the line on anything bigger than an anchovy.
   - The fish briefly telegraphs a run ("⚠ it's about to run…"), then **SURGES** (red "LET GO!"). Reeling through a surge spikes tension and snaps the line almost instantly. **Release** during surges and let it run; tension falls quickly so you can resume in the next calm.
   - Harder fish surge more often, run longer, and give less warning. A great white is ~20 seconds of constant pulse-and-release; a sardine is forgiving.
   - Even with perfect play, a fish can occasionally **throw the hook and get away** during a run — rare for small fish, up to ~1 in 5 for a great white, and never once it's almost landed. Tuned in `escapeBase` in `configureFight()` (`js/fishing.js`).
4. **Catch card** shows the species, description, difficulty, length, and points earned.
5. Spend **coins** on bigger **cages** (🛒) to hold bigger fish; earn **XP** to unlock new **locations** (🗺️). Your **catch log** (📖) tracks every species.

A **first-time tutorial** runs automatically on a brand-new game: a welcome card, then contextual coach callouts that guide your first cast and first fight (with an urgent "LET GO!" cue on the first surge). It only triggers on a fresh save, is fully skippable, and can be replayed anytime via the menu's **❓ How to Play**.

The **☰ menu** (top-left of the scene) pauses to: Resume, How to Play, Change Angler, return to Title, or start a New Game (with a confirmation, since it erases the save). Progress is saved continuously, so "Back to Title" → "Continue" always resumes where you left off.

Sound effects (reel, snap, splash, catch fanfare, coins) are synthesized in `js/audio.js` — no audio files. Toggle them with the 🔊 button (top-right of the scene); the setting is saved. Catches pop a floating "+points" and a line snap shakes the screen.

**Goals (🏆)** — 22 achievements with progress bars and coin rewards (e.g. "Shark Wrangler", "The Legend", "Seven Seas"), plus personal records (biggest catch, species discovered, locations unlocked). Unlocking one slides in a banner. Rewards are coins only, so the XP unlock grind is unchanged. Achievements are defined in `ACHIEVEMENTS` in `js/data.js` — each has a `metric(c)` over derived stats (see `achCtx()` in `js/game.js`) and a `target`.

## Project layout

```
index.html          # shell; loads scripts in order
css/styles.css       # all styling (ocean theme, mobile-first, iOS safe-areas)
js/data.js           # ALL game content — characters, cages, fish, levels. Tune here.
js/sprites.js        # SVG sprite art (fish, sharks, boats, cages, characters)
js/audio.js          # synthesized sound effects (Web Audio API) — window.Sfx
js/fishing.js        # canvas scene + the reeling tug-of-war minigame + splash particles
js/game.js           # state, save/load, screens, and UI glue
```

## Where to tweak things (`js/data.js`)

- **Fish balance:** edit a fish's `points` (value) and `difficulty` (1–10, drives how
  hard the reel-in is *and* which cage is needed). Rule of thumb: more points = harder.
- **Add a fish:** add an entry to `FISH`, then list its `id` in one or more `LEVELS[].fish` pools.
- **Add a level (e.g. an 11th):** append to `LEVELS` with an `xpToUnlock`, a `boat`, a `fish`
  pool, and a `palette`. Nothing else needs to change — progression is open-ended.
- **Cages:** edit `CAGES` (`maxDifficulty` gates catchable fish; `cost` is in coins).
- **Characters:** edit `CHARACTERS` (perk ids are wired in `js/fishing.js` / `js/game.js`).

## Content in this build

**Characters:** Marina (rare-fish luck), Captain Jack (tension grace), Kai (reel speed).

**Boats by rank:** small craft (Jon/Bass Boat) → center consoles & bay boats → cabin cruisers
→ sportfishers → convertibles → trawler → super yacht → sport yacht → power catamaran →
expedition vessel → and finally a deep-sea **submersible** for the Mariana Trench.

**Locations (20 levels):** Florida Keys → Outer Banks → Cabo San Lucas → Great Barrier Reef →
Montauk → Azores → Cape Town → Guadalupe Island → Northern Norway → Tonga → Kona →
Bay of Islands → Madeira → Bazaruto → Galápagos → Andaman Sea → Seychelles → Aleutian
Islands → Cocos Island → Mariana Trench.

**Fish:** 77 species from the Anchovy (4 pts, diff 1) up to the Great White Shark (850 pts, diff 10) —
baitfish, panfish, reef fish, tuna, mahi, billfish (marlin/swordfish/sailfish), tarpon, flatfish,
eels, pufferfish, sunfish, squid, rays, manta, a dozen distinct sharks, plus deep-sea oddities
(coelacanth, oarfish, colossal squid, goblin/megamouth/frilled sharks). Each species has its own
sprite silhouette (see `js/sprites.js`).

## Swapping in real sprite art later

The sprites are authored as SVG in `js/sprites.js` and loaded as images, so you can drop
in PNG/raster art without touching game logic: replace a sprite function so it returns an
`<svg>...<image href="assets/sprites/yourfile.png"/></svg>`, or change `makeImage()` to build
the image from a file path. Keep the same viewBox proportions (creatures face right; the
renderer flips them).

## Deploying (Vercel / any static host)

This is a **pure static site with no build step**, so deploy it as static files:

- **Framework Preset:** Other
- **Build Command:** none (leave empty)
- **Output Directory:** none (serves the repo root)
- **Root Directory:** `./`
- **Do _not_ add a `vercel.json`** — `cleanUrls`/`trailingSlash` crash `vercel build`
  ("Cannot read properties of undefined (reading 'fsPath')") on a no-build project,
  and clean URLs add nothing for a single `index.html`.

Connected to Git, every push auto-deploys. The quickest one-off deploy is the CLI from
this folder: `vercel --prod` (accept the defaults). Each player's progress is stored in
their own browser (localStorage); there's no backend.

## Path to an iOS app

The game is built to be wrappable with **Capacitor** (or Cordova) with no rewrite:
pointer events cover touch, the layout respects iOS safe-areas, and there's no server
dependency. When ready: `npm init`, add `@capacitor/core` + `@capacitor/ios`, point the
web root at this folder, and `npx cap add ios`.
