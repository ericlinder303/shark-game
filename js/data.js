/* =========================================================================
 * data.js — All game content lives here.
 * This is the file to edit when balancing the game or adding content.
 * ========================================================================= */

/* ---------------------------------------------------------------------------
 * CHARACTERS — player picks one and names it. Each has a small perk hook.
 * ------------------------------------------------------------------------- */
const CHARACTERS = [
  { id: "marina", title: "Marina the Marine Biologist", sprite: "char_marina",
    blurb: "Studies the sea for a living. Knows where the big ones hide.",
    perk: { id: "rare_luck", label: "+chance of rare fish" } },
  { id: "jack", title: "Captain Jack", sprite: "char_jack",
    blurb: "Salt-crusted veteran. Steady hands on the reel.",
    perk: { id: "tension_grace", label: "Line tolerates +10% tension" } },
  { id: "kai", title: "Kai the Adventurer", sprite: "char_kai",
    blurb: "Young, fearless, and fast on the reel.",
    perk: { id: "fast_reel", label: "+12% reel speed" } },
];

/* ---------------------------------------------------------------------------
 * CAGES — bought with coins. `maxDifficulty` gates which fish can be hooked.
 * A bigger cage relative to the fish also makes the reel-in a little easier.
 * Tiers line up with the fish difficulty bands: 2 / 4 / 6 / 8 / 10.
 * ------------------------------------------------------------------------- */
const CAGES = [
  { id: "wire",     name: "Wire Basket",           sprite: "cage_wire",     maxDifficulty: 2,  cost: 0,    desc: "A flimsy starter basket. Good for bait fish." },
  { id: "reinf",    name: "Reinforced Cage",       sprite: "cage_reinf",    maxDifficulty: 4,  cost: 180,  desc: "Welded square mesh that holds mid-size catches." },
  { id: "steel",    name: "Steel Cage",            sprite: "cage_steel",    maxDifficulty: 6,  cost: 750,  desc: "Heavy riveted steel bars. Trusted for tuna and small sharks." },
  { id: "shark",    name: "Shark Cage",            sprite: "cage_shark",    maxDifficulty: 8,  cost: 2600, desc: "Diver-grade cage with cross-bracing, built to hold predators." },
  { id: "titanium", name: "Titanium Abyssal Cage", sprite: "cage_titanium", maxDifficulty: 10, cost: 8000, desc: "A sleek high-tech rig. Nothing in the sea breaks out." },
];

/* ---------------------------------------------------------------------------
 * FISH — the roster. Tuning fields:
 *   points     : coins + XP earned on catch (also the headline "value")
 *   difficulty : 1..10. Drives minigame hardness AND the cage needed.
 *   rarity     : relative spawn weight within a location (higher = common)
 *   sprite     : art template in sprites.js;  color : its tint
 * Rule of thumb: more points => harder to catch.
 * ------------------------------------------------------------------------- */
const FISH = [
  // --- tiny baitfish (diff 1) ---
  { id: "anchovy",   name: "Anchovy",         points: 4,  difficulty: 1, rarity: 12, sprite: "minnow",  color: "#a9bcc9", length: '4"',  desc: "A glinting speck of a fish. It barely tugs the line." },
  { id: "sardine",   name: "Sardine",         points: 6,  difficulty: 1, rarity: 11, sprite: "minnow",  color: "#9fb8c9", length: '6"',  desc: "Travels in dense silver clouds. Easy pickings." },
  { id: "herring",   name: "Herring",         points: 9,  difficulty: 1, rarity: 10, sprite: "minnow",  color: "#a9c4d4", length: '10"', desc: "A shimmering schooling fish and classic baitfish." },
  { id: "pinfish",   name: "Pinfish",         points: 10, difficulty: 1, rarity: 9,  sprite: "panfish", color: "#b9b066", length: '5"',  desc: "A scrappy little reef nibbler with sharp spines." },

  // --- small inshore (diff 2) ---
  { id: "mullet",    name: "Striped Mullet",  points: 14, difficulty: 2, rarity: 8, sprite: "roundfish", color: "#9aa6ac", length: '16"', desc: "Leaps clear of the water for no clear reason at all." },
  { id: "mackerel",  name: "Mackerel",        points: 16, difficulty: 2, rarity: 8, sprite: "torpedo",   color: "#5f9aa6", length: '14"', desc: "Fast, striped, and feisty for its size." },
  { id: "perch",     name: "Ocean Perch",     points: 18, difficulty: 2, rarity: 7, sprite: "panfish",   color: "#7d8a4a", length: '12"', desc: "A handsome banded panfish of cool inshore water." },
  { id: "pufferfish",name: "Pufferfish",      points: 22, difficulty: 2, rarity: 6, sprite: "puffer",    color: "#c7a24a", length: '12"', desc: "Balloons into a spiky orb when it feels cornered." },
  { id: "seatrout",  name: "Sea Trout",       points: 24, difficulty: 2, rarity: 7, sprite: "roundfish", color: "#8a9a86", length: '20"', desc: "A spotted estuary favorite with a soft mouth." },
  { id: "seabass",   name: "Sea Bass",        points: 26, difficulty: 2, rarity: 7, sprite: "roundfish", color: "#7d8a6a", length: '18"', desc: "A reliable reef dweller with a stubborn little tug." },

  // --- mid-small (diff 3) ---
  { id: "grunt",     name: "Bluestripe Grunt",points: 28, difficulty: 3, rarity: 6, sprite: "panfish",   color: "#c2b25a", length: '10"', desc: "Named for the grunting sound it makes when landed." },
  { id: "snapper",   name: "Red Snapper",     points: 34, difficulty: 3, rarity: 6, sprite: "roundfish", color: "#d2674f", length: '24"', desc: "Prized reef fish in a bright crimson coat." },
  { id: "pompano",   name: "Pompano",         points: 38, difficulty: 3, rarity: 5, sprite: "deepbody",  color: "#ccd0c4", length: '18"', desc: "A flashy disc of a fish that fights above its weight." },
  { id: "flounder",  name: "Flounder",        points: 36, difficulty: 3, rarity: 5, sprite: "flatfish",  color: "#9a8f6a", length: '20"', desc: "A flat ambush predator with both eyes on top." },
  { id: "cod",       name: "Atlantic Cod",    points: 40, difficulty: 3, rarity: 6, sprite: "roundfish", color: "#b6a36e", length: '3 ft', desc: "A cold-water heavyweight of the northern seas." },
  { id: "squid",     name: "Reef Squid",      points: 44, difficulty: 3, rarity: 4, sprite: "squid",     color: "#c98a8a", length: '2 ft', desc: "Jets backward in a cloud of ink when threatened." },
  { id: "bonito",    name: "Bonito",          points: 48, difficulty: 3, rarity: 5, sprite: "torpedo",   color: "#4f7f9a", length: '2.5 ft', desc: "A small tuna cousin that hits bait at full speed." },
  { id: "bluefish",  name: "Bluefish",        points: 52, difficulty: 3, rarity: 5, sprite: "slim",      color: "#5a8fb0", length: '3 ft', desc: "Razor-toothed brawler that fights all the way in." },

  // --- medium (diff 4) ---
  { id: "mahimahi",  name: "Mahi-Mahi",       points: 70, difficulty: 4, rarity: 5, sprite: "mahi",      color: "#e0c64a", length: '4 ft', desc: "Dazzling gold-and-blue. Famous for acrobatic runs." },
  { id: "redfish",   name: "Redfish",         points: 66, difficulty: 4, rarity: 4, sprite: "roundfish", color: "#c46a44", length: '3 ft', desc: "Copper-scaled red drum with a signature tail spot." },
  { id: "moray",     name: "Moray Eel",       points: 60, difficulty: 4, rarity: 4, sprite: "eel",       color: "#7c8a3f", length: '5 ft', desc: "Lurks in reef crevices and refuses to let go." },
  { id: "kingfish",  name: "King Mackerel",   points: 80, difficulty: 4, rarity: 4, sprite: "slim",      color: "#9fb0bb", length: '5 ft', desc: "A long, fast 'smoker' that screams line off the reel." },
  { id: "amberjack", name: "Amberjack",       points: 84, difficulty: 4, rarity: 4, sprite: "deepbody",  color: "#c2b58a", length: '4 ft', desc: "A bulldog of the deep — pure pulling power." },
  { id: "grouper",   name: "Grouper",         points: 92, difficulty: 4, rarity: 4, sprite: "roundfish", color: "#7a6a4a", length: '4 ft', desc: "Dives for its hole the instant it's hooked." },
  { id: "barracuda", name: "Barracuda",       points: 88, difficulty: 4, rarity: 4, sprite: "slim",      color: "#9aa7ad", length: '5 ft', desc: "All teeth and speed. Strikes like lightning." },
  { id: "stripedbass",name:"Striped Bass",    points: 76, difficulty: 4, rarity: 4, sprite: "torpedo",   color: "#8f9aa3", length: '4 ft', desc: "A powerful coastal game fish with bold dark stripes." },

  // --- large (diff 5) ---
  { id: "yellowfin", name: "Yellowfin Tuna",  points: 120, difficulty: 5, rarity: 4, sprite: "torpedo",  color: "#3f6f8f", length: '6 ft', desc: "A torpedo of muscle. Long, punishing runs." },
  { id: "wahoo",     name: "Wahoo",           points: 130, difficulty: 5, rarity: 3, sprite: "slim",     color: "#3b6a86", length: '6 ft', desc: "Possibly the fastest fish in the sea. Blistering strikes." },
  { id: "tarpon",    name: "Tarpon",          points: 140, difficulty: 5, rarity: 3, sprite: "tarpon",   color: "#aeb9c0", length: '6 ft', desc: "The 'Silver King' — huge scales and sky-high leaps." },
  { id: "permit",    name: "Permit",          points: 110, difficulty: 5, rarity: 3, sprite: "deepbody", color: "#c2ccd2", length: '4 ft', desc: "A wary flats prize that tests every knot you tie." },
  { id: "cobia",     name: "Cobia",           points: 105, difficulty: 5, rarity: 3, sprite: "slim",     color: "#6a5f4a", length: '5 ft', desc: "Curious and stubborn, often mistaken for a shark." },
  { id: "trevally",  name: "Giant Trevally",  points: 125, difficulty: 5, rarity: 3, sprite: "deepbody", color: "#9fb0b8", length: '4 ft', desc: "The 'GT' — a brutal reef bruiser that never quits." },
  { id: "reefshark", name: "Reef Shark",      points: 130, difficulty: 5, rarity: 4, sprite: "shark",        color: "#8a9aa6", length: '6 ft', desc: "A sleek reef patroller. Curious and quick." },
  { id: "nurseshark",name: "Nurse Shark",     points: 115, difficulty: 5, rarity: 3, sprite: "shark_stocky", color: "#9a8458", length: '8 ft', desc: "A slow, heavy bottom-dweller — dead weight on the line." },

  // --- big game / sharks (diff 6) ---
  { id: "swordfish", name: "Swordfish",       points: 200, difficulty: 6, rarity: 3, sprite: "billfish",     color: "#54657a", length: '10 ft', desc: "Deep-water gladiator armed with a sword-like bill." },
  { id: "sailfish",  name: "Sailfish",        points: 220, difficulty: 6, rarity: 2, sprite: "sailfish",     color: "#2f6f9a", length: '9 ft',  desc: "Raises a huge sail and tail-walks across the surface." },
  { id: "bluefin",   name: "Bluefin Tuna",    points: 240, difficulty: 6, rarity: 2, sprite: "torpedo",      color: "#33597a", length: '8 ft',  desc: "A giant of the tuna world. Dives deep and pulls hard." },
  { id: "halibut",   name: "Giant Halibut",   points: 180, difficulty: 6, rarity: 3, sprite: "flatfish",     color: "#6b7d74", length: '7 ft',  desc: "An enormous flatfish that fights like a barn door." },
  { id: "blacktip",  name: "Blacktip Shark",  points: 160, difficulty: 6, rarity: 3, sprite: "shark",        color: "#7e8d99", length: '6 ft',  desc: "Known for spinning leaps when it strikes bait." },
  { id: "blueshark", name: "Blue Shark",      points: 185, difficulty: 6, rarity: 3, sprite: "shark_slim",   color: "#3f6fae", length: '9 ft',  desc: "A slender, electric-blue ocean wanderer." },
  { id: "lemonshark",name: "Lemon Shark",     points: 175, difficulty: 6, rarity: 3, sprite: "shark",        color: "#b8a96a", length: '10 ft', desc: "A yellow-tinged coastal shark that hugs the bottom." },
  { id: "bronze",    name: "Bronze Whaler",   points: 210, difficulty: 6, rarity: 2, sprite: "shark_stocky", color: "#a98a5f", length: '9 ft',  desc: "A coppery coastal shark with serious shoulders." },

  // --- very hard (diff 7) ---
  { id: "marlin",    name: "Blue Marlin",     points: 300, difficulty: 7, rarity: 2, sprite: "billfish",     color: "#2f5fa0", length: '12 ft', desc: "The ocean's prizefighter. Endless, screaming runs." },
  { id: "blackmarlin",name:"Black Marlin",    points: 340, difficulty: 7, rarity: 1, sprite: "billfish",     color: "#2a3a4a", length: '14 ft', desc: "Heaviest of the billfish. A true blue-water trophy." },
  { id: "bull",      name: "Bull Shark",      points: 340, difficulty: 7, rarity: 2, sprite: "shark_stocky", color: "#9aa0a3", length: '11 ft', desc: "Stocky, aggressive, and astonishingly strong." },
  { id: "thresher",  name: "Thresher Shark",  points: 300, difficulty: 7, rarity: 2, sprite: "thresher",     color: "#5f7f9c", length: '18 ft', desc: "Stuns prey with a scythe-like tail half its length." },
  { id: "sandbar",   name: "Sandbar Shark",   points: 260, difficulty: 7, rarity: 2, sprite: "shark",        color: "#8b9499", length: '7 ft',  desc: "A tall-finned requiem shark with relentless stamina." },
  { id: "sawfish",   name: "Sawfish",         points: 320, difficulty: 7, rarity: 1, sprite: "sawfish",      color: "#9a9a7a", length: '16 ft', desc: "Wields a tooth-studded saw and thrashes wildly." },
  { id: "mola",      name: "Ocean Sunfish",   points: 280, difficulty: 7, rarity: 1, sprite: "mola",         color: "#9aa6ac", length: '10 ft', desc: "A massive, bizarre disc of a fish. Dead-weight heavy." },
  { id: "stingray",  name: "Stingray",        points: 250, difficulty: 7, rarity: 2, sprite: "ray",          color: "#8a7f6a", length: '6 ft',  desc: "Glides like a kite, then anchors itself to the seabed." },

  // --- brutal (diff 8) ---
  { id: "mako",      name: "Shortfin Mako",   points: 420, difficulty: 8, rarity: 2, sprite: "shark_slim",   color: "#3f6f9c", length: '12 ft', desc: "The fastest shark alive. Explosive, leaping runs." },
  { id: "hammerhead",name: "Great Hammerhead",points: 480, difficulty: 8, rarity: 2, sprite: "hammerhead",   color: "#8b9499", length: '15 ft', desc: "Unmistakable hammer head. A relentless fighter." },
  { id: "manta",     name: "Manta Ray",       points: 440, difficulty: 8, rarity: 1, sprite: "manta",        color: "#3a4a5a", length: '20 ft', desc: "A gentle giant whose wingspan turns the line to a kite." },
  { id: "sandtiger", name: "Sand Tiger Shark",points: 380, difficulty: 8, rarity: 2, sprite: "shark",        color: "#a99a7a", length: '10 ft', desc: "Snaggle-toothed and menacing, yet oddly placid." },
  { id: "goliath",   name: "Goliath Grouper", points: 460, difficulty: 8, rarity: 1, sprite: "roundfish",    color: "#5f5a3a", length: '8 ft',  desc: "A car-sized grouper that can swallow prey whole." },

  // --- savage (diff 9) ---
  { id: "tiger",     name: "Tiger Shark",     points: 580, difficulty: 9, rarity: 1, sprite: "tigershark",   color: "#6e7a66", length: '16 ft', desc: "Striped apex hunter that eats almost anything." },
  { id: "greenland", name: "Greenland Shark", points: 540, difficulty: 9, rarity: 1, sprite: "shark_stocky", color: "#5b6770", length: '18 ft', desc: "Ancient and impossibly heavy. Centuries old." },
  { id: "whaleshark",name: "Whale Shark",     points: 640, difficulty: 9, rarity: 1, sprite: "whaleshark",   color: "#4d6c84", length: '30 ft', desc: "The largest fish on Earth. Gentle, but a true test." },

  // --- expansion species (worldwide levels 11-20), all within difficulty 1-10 ---
  { id: "blackdrum",   name: "Black Drum",         points: 68,  difficulty: 4, rarity: 4, sprite: "deepbody",     color: "#6b7280", length: '3 ft',  desc: "A deep-bodied drummer that booms like a foghorn when landed." },
  { id: "roosterfish", name: "Roosterfish",        points: 112, difficulty: 5, rarity: 3, sprite: "torpedo",      color: "#8fa0ad", length: '4 ft',  desc: "Named for the seven-spined 'comb' it raises when it charges." },
  { id: "opah",        name: "Opah",               points: 200, difficulty: 6, rarity: 2, sprite: "deepbody",     color: "#c4564f", length: '5 ft',  desc: "A round, warm-blooded silver-and-red disc flecked with white." },
  { id: "cubera",      name: "Cubera Snapper",     points: 210, difficulty: 6, rarity: 2, sprite: "roundfish",    color: "#7a5a52", length: '4 ft',  desc: "The largest snapper, armed with bone-crushing jaws." },
  { id: "dogtooth",    name: "Dogtooth Tuna",      points: 300, difficulty: 7, rarity: 2, sprite: "torpedo",      color: "#46606f", length: '6 ft',  desc: "A reef-bound tuna with fangs and pure bulldog power." },
  { id: "wrasse",      name: "Humphead Wrasse",    points: 290, difficulty: 7, rarity: 2, sprite: "deepbody",     color: "#2f7e74", length: '6 ft',  desc: "A giant emerald reef fish with a bulging forehead." },
  { id: "lancetfish",  name: "Lancetfish",         points: 280, difficulty: 7, rarity: 2, sprite: "sailfish",     color: "#9aa6b0", length: '7 ft',  desc: "A fanged deep-sea ribbon crowned with a tall sail-like fin." },
  { id: "porbeagle",   name: "Porbeagle Shark",    points: 300, difficulty: 7, rarity: 2, sprite: "shark_slim",   color: "#4a5e6e", length: '8 ft',  desc: "A cold-water cousin of the mako, stocky and tireless." },
  { id: "giantgrouper",name: "Giant Grouper",      points: 470, difficulty: 8, rarity: 1, sprite: "roundfish",    color: "#5a5440", length: '9 ft',  desc: "A Queensland giant said to swallow small sharks whole." },
  { id: "sixgill",     name: "Bluntnose Sixgill",  points: 440, difficulty: 8, rarity: 1, sprite: "shark_stocky", color: "#4f5a52", length: '16 ft', desc: "A primeval deep-water shark with six gill slits." },
  { id: "basking",     name: "Basking Shark",      points: 430, difficulty: 8, rarity: 1, sprite: "shark",        color: "#5e5a52", length: '26 ft', desc: "A gentle filter-feeder cruising with a cavernous gaping mouth." },
  { id: "frilled",     name: "Frilled Shark",      points: 400, difficulty: 8, rarity: 1, sprite: "eel",          color: "#6a5240", length: '6 ft',  desc: "A living-fossil 'eel shark' from the lightless deep." },
  { id: "goblin",      name: "Goblin Shark",       points: 560, difficulty: 9, rarity: 1, sprite: "shark_slim",   color: "#c98a94", length: '12 ft', desc: "A pink, long-snouted phantom with jutting, spring-loaded jaws." },
  { id: "megamouth",   name: "Megamouth Shark",    points: 600, difficulty: 9, rarity: 1, sprite: "shark_stocky", color: "#3a4450", length: '16 ft', desc: "An ultra-rare deep shark with an enormous luminous mouth." },
  { id: "coelacanth",  name: "Coelacanth",         points: 580, difficulty: 9, rarity: 1, sprite: "deepbody",     color: "#2f4a6a", length: '6 ft',  desc: "A lobe-finned 'living fossil' thought extinct for 65 million years." },
  { id: "oarfish",     name: "Giant Oarfish",      points: 600, difficulty: 9, rarity: 1, sprite: "eel",          color: "#b9bfc4", length: '30 ft', desc: "The serpentine 'sea dragon' — the longest bony fish alive." },
  { id: "colossal",    name: "Colossal Squid",     points: 620, difficulty: 9, rarity: 1, sprite: "squid",        color: "#7a3f48", length: '14 ft', desc: "An abyssal monster with hooked arms and dinner-plate eyes." },
  { id: "beluga",      name: "Beluga Sturgeon",    points: 540, difficulty: 9, rarity: 1, sprite: "slim",         color: "#8a8f7a", length: '18 ft', desc: "An ancient armored giant of cold seas, often a century old." },

  // --- legendary (diff 10) ---
  { id: "greatwhite",name: "Great White Shark",points: 850, difficulty: 10, rarity: 1, sprite: "greatwhite", color: "#9099a0", length: '20 ft', desc: "The legend. The ultimate catch. Pure power and menace." },
];

const FISH_BY_ID = Object.fromEntries(FISH.map((f) => [f.id, f]));

/* ---------------------------------------------------------------------------
 * LEVELS — one popular real-world fishing location per level, easy -> hard.
 * To add an 11th level, just append an entry. Progression is open-ended.
 * ------------------------------------------------------------------------- */
const LEVELS = [
  { n: 1, location: "Florida Keys, USA", xpToUnlock: 0,
    boat: { sprite: "boat_small", name: "Jon Boat", color: "#4f7a52" },
    fish: ["anchovy","sardine","herring","pinfish","pufferfish","mullet","mackerel","seabass","snapper","grunt"],
    palette: { top: "#7fd3e0", bottom: "#0e5f7a" },
    tagline: "Calm turquoise flats. The perfect place to learn the reel." },

  { n: 2, location: "Outer Banks, North Carolina, USA", xpToUnlock: 120,
    boat: { sprite: "boat_small", name: "Bass Boat", color: "#b23a3a" },
    fish: ["mackerel","perch","seatrout","mullet","cod","seabass","flounder","snapper","bluefish","pompano","herring"],
    palette: { top: "#73c2cf", bottom: "#0c5670" },
    tagline: "Where the warm Gulf Stream meets cold northern water." },

  { n: 3, location: "Cabo San Lucas, Mexico", xpToUnlock: 380,
    boat: { sprite: "boat_console", name: "Center Console", color: "#2f6f9f" },
    fish: ["snapper","bonito","squid","mahimahi","barracuda","yellowfin","sailfish","kingfish","wahoo"],
    palette: { top: "#5fb6d0", bottom: "#0a4a66" },
    tagline: "The Marlin Capital of the World. Bigger game starts here." },

  { n: 4, location: "Great Barrier Reef, Australia", xpToUnlock: 800,
    boat: { sprite: "boat_console", name: "Bay Boat", color: "#1f8f7a" },
    fish: ["snapper","grouper","mahimahi","barracuda","reefshark","redfish","trevally","moray","stingray","tarpon","permit","nurseshark"],
    palette: { top: "#56c8c0", bottom: "#0a5a66" },
    tagline: "The world's largest reef. Sharks now patrol your cage." },

  { n: 5, location: "Montauk, New York, USA", xpToUnlock: 1500,
    boat: { sprite: "boat_cruiser", name: "Walkaround Cabin", color: "#4a5a6a" },
    fish: ["cod","stripedbass","bluefish","blacktip","flounder","amberjack","sandbar","bluefin","bonito","cobia","tarpon"],
    palette: { top: "#5a93a8", bottom: "#0c3f55" },
    tagline: "The fishing capital of the Northeast. Rougher water." },

  { n: 6, location: "Azores, Portugal", xpToUnlock: 2600,
    boat: { sprite: "boat_cruiser", name: "Cabin Cruiser", color: "#34506a" },
    fish: ["yellowfin","swordfish","sailfish","bluefin","blueshark","bronze","wahoo","mola","mako","halibut"],
    palette: { top: "#3f86a0", bottom: "#082f48" },
    tagline: "Deep blue Atlantic seamounts. Big-game territory." },

  { n: 7, location: "Cape Town, South Africa", xpToUnlock: 4200,
    boat: { sprite: "boat_sportfisher", name: "Sportfisher Express", color: "#7a3f5a" },
    fish: ["bronze","blacktip","bull","mako","blueshark","sandbar","thresher","sailfish","lemonshark","stingray"],
    palette: { top: "#3a7892", bottom: "#072838" },
    tagline: "Shark central. Strong currents and stronger predators." },

  { n: 8, location: "Guadalupe Island, Mexico", xpToUnlock: 6500,
    boat: { sprite: "boat_sportfisher", name: "Convertible Sportfisher", color: "#2f4f6f" },
    fish: ["mako","bull","tiger","hammerhead","greatwhite","manta","sandtiger","blueshark","goliath"],
    palette: { top: "#2f6f88", bottom: "#06212f" },
    tagline: "Crystal-clear waters famous for great white sharks." },

  { n: 9, location: "Northern Norway", xpToUnlock: 9500,
    boat: { sprite: "boat_trawler", name: "Commercial Trawler", color: "#5a6470" },
    fish: ["cod","halibut","greenland","mako","bull","thresher","sawfish","sandbar"],
    palette: { top: "#33697d", bottom: "#04202c" },
    tagline: "Frigid arctic fjords hiding ancient, monstrous fish." },

  { n: 10, location: "Tonga, South Pacific", xpToUnlock: 14000,
    boat: { sprite: "boat_yacht", name: "Super Sportfishing Yacht", color: "#caa84a" },
    fish: ["marlin","blackmarlin","tiger","hammerhead","whaleshark","greatwhite","manta","sailfish","trevally","mako"],
    palette: { top: "#2a7a98", bottom: "#031d2a" },
    tagline: "Untouched Pacific deep water. Only legends swim here." },

  { n: 11, location: "Kona, Hawaii, USA", xpToUnlock: 19000,
    boat: { sprite: "boat_sportfisher", name: "Hatteras Sportfisher", color: "#214a63" },
    fish: ["marlin","blackmarlin","yellowfin","mahimahi","wahoo","mako","sailfish","opah"],
    palette: { top: "#3f9fc0", bottom: "#06405e" },
    tagline: "Volcanic blue-water dropoffs — the Pacific's marlin throne." },

  { n: 12, location: "Bay of Islands, New Zealand", xpToUnlock: 25000,
    boat: { sprite: "boat_cruiser", name: "Riviera Flybridge", color: "#3a4a5a" },
    fish: ["marlin","blackmarlin","mako","yellowfin","thresher","kingfish","bronze","porbeagle"],
    palette: { top: "#4aa0b0", bottom: "#0a4250" },
    tagline: "Where Zane Grey chased giant marlin a century ago." },

  { n: 13, location: "Madeira, Portugal", xpToUnlock: 32000,
    boat: { sprite: "boat_sportyacht", name: "Sport Yacht", color: "#5a3f6a" },
    fish: ["marlin","bluefin","swordfish","wahoo","mako","blueshark","bronze","lancetfish"],
    palette: { top: "#357f9c", bottom: "#062c42" },
    tagline: "Sheer volcanic walls hiding grander-class blue marlin." },

  { n: 14, location: "Bazaruto Archipelago, Mozambique", xpToUnlock: 41000,
    boat: { sprite: "boat_catamaran", name: "Power Catamaran", color: "#1f7a6a" },
    fish: ["marlin","blackmarlin","dogtooth","trevally","sailfish","wahoo","bull","cubera"],
    palette: { top: "#43b0b8", bottom: "#0a4a52" },
    tagline: "Indian Ocean sand islands teeming with billfish." },

  { n: 15, location: "Galápagos Islands, Ecuador", xpToUnlock: 52000,
    boat: { sprite: "boat_expedition", name: "Expedition Vessel", color: "#4a5a52" },
    fish: ["hammerhead","trevally","yellowfin","mako","manta","blacktip","wahoo","sailfish"],
    palette: { top: "#3a93a0", bottom: "#063840" },
    tagline: "Cold, rich currents and walls of scalloped hammerheads." },

  { n: 16, location: "Andaman Sea, Thailand", xpToUnlock: 66000,
    boat: { sprite: "boat_console", name: "Bluewater Center Console", color: "#2f7f8f" },
    fish: ["dogtooth","trevally","wahoo","barracuda","reefshark","cubera","sailfish","blacktip"],
    palette: { top: "#3fb0a0", bottom: "#08443e" },
    tagline: "Emerald limestone islands and hard-pulling dogtooth tuna." },

  { n: 17, location: "Seychelles Flats", xpToUnlock: 83000,
    boat: { sprite: "boat_catamaran", name: "Flats Catamaran", color: "#2f8f86" },
    fish: ["trevally","wrasse","barracuda","reefshark","blacktip","sailfish","dogtooth","grouper"],
    palette: { top: "#52c4c0", bottom: "#0a5258" },
    tagline: "Gin-clear atolls ruled by the mighty giant trevally." },

  { n: 18, location: "Aleutian Islands, Alaska, USA", xpToUnlock: 104000,
    boat: { sprite: "boat_trawler", name: "Aluminum Trawler", color: "#4a5560" },
    fish: ["halibut","cod","sixgill","porbeagle","greenland","mako","basking"],
    palette: { top: "#5e7e88", bottom: "#06222c" },
    tagline: "Brutal cold seas hiding barn-door halibut and sixgills." },

  { n: 19, location: "Cocos Island, Costa Rica", xpToUnlock: 130000,
    boat: { sprite: "boat_expedition", name: "Dive Liveaboard", color: "#2f5a6a" },
    fish: ["hammerhead","tiger","trevally","manta","mako","sailfish","bull","sandbar"],
    palette: { top: "#2f7a8c", bottom: "#04303c" },
    tagline: "A remote shark sanctuary swirling with hundreds of hammerheads." },

  { n: 20, location: "Mariana Trench, Pacific", xpToUnlock: 162000,
    boat: { sprite: "boat_submarine", name: "Deep-Sea Submersible", color: "#e8c34a" },
    fish: ["oarfish","colossal","megamouth","goblin","frilled","sixgill","coelacanth","greenland","beluga","whaleshark"],
    palette: { top: "#12303a", bottom: "#01080d" },
    tagline: "The deepest place on Earth. Lower into the crushing black." },
];

function xpForNextBeyondLast() {
  const last = LEVELS[LEVELS.length - 1];
  return Math.round(last.xpToUnlock * 1.6);
}

function difficultyLabel(d) {
  if (d <= 1) return "Trivial";
  if (d <= 2) return "Easy";
  if (d <= 3) return "Light";
  if (d <= 4) return "Moderate";
  if (d <= 5) return "Tough";
  if (d <= 6) return "Hard";
  if (d <= 7) return "Very Hard";
  if (d <= 8) return "Brutal";
  if (d <= 9) return "Savage";
  return "Legendary";
}

/* ---------------------------------------------------------------------------
 * ACHIEVEMENTS — goals that run off stats derived from the save (see achCtx()
 * in game.js for the `c` context). `metric(c)` returns a number; the goal is
 * met when it reaches `target` (a number, or a function of `c` for dynamic
 * totals). Rewards are COINS only — they never grant XP, so the long endgame
 * unlock grind is unaffected. Add/tweak freely.
 * ------------------------------------------------------------------------- */
const ACHIEVEMENTS = [
  { id: "first",     icon: "🎣", name: "First Catch",           desc: "Land your very first fish.",                metric: (c) => c.totalCaught,  target: 1,    reward: 50 },
  { id: "catch10",   icon: "🐟", name: "Getting the Hang of It", desc: "Catch 10 fish in total.",                  metric: (c) => c.totalCaught,  target: 10,   reward: 80 },
  { id: "catch50",   icon: "🎏", name: "Seasoned Angler",        desc: "Catch 50 fish in total.",                  metric: (c) => c.totalCaught,  target: 50,   reward: 250 },
  { id: "catch250",  icon: "⚓",  name: "Master Fisher",          desc: "Catch 250 fish in total.",                 metric: (c) => c.totalCaught,  target: 250,  reward: 1000 },
  { id: "catch1000", icon: "🏅", name: "Living Legend",          desc: "Catch 1,000 fish in total.",               metric: (c) => c.totalCaught,  target: 1000, reward: 5000 },

  { id: "species10", icon: "📖", name: "Collector",              desc: "Discover 10 different species.",            metric: (c) => c.speciesCaught, target: 10,  reward: 150 },
  { id: "species25", icon: "📚", name: "Naturalist",             desc: "Discover 25 different species.",            metric: (c) => c.speciesCaught, target: 25,  reward: 400 },
  { id: "species50", icon: "🔬", name: "Ichthyologist",          desc: "Discover 50 different species.",            metric: (c) => c.speciesCaught, target: 50,  reward: 1200 },
  { id: "speciesAll",icon: "🌊", name: "Gotta Catch 'Em All",    desc: "Discover every species in the sea.",        metric: (c) => c.speciesCaught, target: (c) => c.totalSpecies, reward: 8000 },

  { id: "sharks",    icon: "🦈", name: "Shark Wrangler",         desc: "Catch every species of shark.",             metric: (c) => c.caughtSharks, target: (c) => c.sharkTotal, reward: 3000 },
  { id: "bills",     icon: "🗡️", name: "Billfish Slam",          desc: "Catch every billfish & swordfish.",         metric: (c) => c.caughtBills,  target: (c) => c.billTotal,  reward: 1500 },

  { id: "big5",      icon: "💪", name: "Big Game",               desc: "Land a fish of difficulty 5 or higher.",    metric: (c) => (c.bestDifficulty >= 5 ? 1 : 0), target: 1, reward: 120 },
  { id: "big8",      icon: "🔥", name: "Apex Hunter",            desc: "Land a fish of difficulty 8 or higher.",    metric: (c) => (c.bestDifficulty >= 8 ? 1 : 0), target: 1, reward: 600 },
  { id: "gw",        icon: "👑", name: "The Legend",             desc: "Land the Great White Shark.",               metric: (c) => (c.hasGW ? 1 : 0), target: 1, reward: 2500 },
  { id: "abyss",     icon: "🌑", name: "Into the Abyss",         desc: "Catch a creature from the deep-sea trench.",metric: (c) => (c.abyssCaught > 0 ? 1 : 0), target: 1, reward: 1500 },

  { id: "travel5",   icon: "🗺️", name: "World Traveler",         desc: "Unlock 5 fishing locations.",               metric: (c) => c.unlocked, target: 5,  reward: 300 },
  { id: "travel10",  icon: "🧭", name: "Globetrotter",           desc: "Unlock 10 fishing locations.",              metric: (c) => c.unlocked, target: 10, reward: 800 },
  { id: "travelAll", icon: "🌎", name: "Seven Seas",             desc: "Unlock every fishing location.",            metric: (c) => c.unlocked, target: (c) => c.totalLevels, reward: 6000 },

  { id: "cageSteel", icon: "🧰", name: "Tooled Up",              desc: "Own the Steel Cage or better.",             metric: (c) => (c.hasSteel ? 1 : 0), target: 1, reward: 200 },
  { id: "cageTitan", icon: "🛡️", name: "Unbreakable",            desc: "Own the Titanium Abyssal Cage.",            metric: (c) => (c.hasTitanium ? 1 : 0), target: 1, reward: 1000 },

  { id: "rich",      icon: "🪙", name: "Deep Pockets",           desc: "Hold 3,000 coins at once.",                 metric: (c) => c.coins,    target: 3000, reward: 500 },
  { id: "escapes",   icon: "💨", name: "The One That Got Away",  desc: "Let 10 fish snap the line and escape.",     metric: (c) => c.escapes,  target: 10,   reward: 100 },
];

window.GAME_DATA = {
  CHARACTERS, CAGES, FISH, FISH_BY_ID, LEVELS, ACHIEVEMENTS,
  xpForNextBeyondLast, difficultyLabel,
};
