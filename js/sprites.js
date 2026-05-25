/* =========================================================================
 * sprites.js — Polished vector (SVG) sprite art.
 *
 * Each sprite is a function (color, P) -> SVG string. `P` is a unique id
 * prefix injected per render so gradient ids never collide when several
 * sprites are shown in the same DOM (e.g. the catch log).
 *
 * Creatures face RIGHT (head right, tail left); the renderer flips them when
 * swimming left. Each sprite declares its width:height aspect in META so the
 * canvas renderer sizes it correctly.
 *
 * Style kit (shared): a 4-stop vertical BODY gradient (dark dorsal -> base ->
 * light belly), a soft radial SHEEN highlight, finned membranes with ray
 * lines, gill plates, lateral lines, and an eye with a catchlight.
 *
 * SWAPPING IN RASTER ART LATER: replace a sprite fn with one returning an
 * <svg> (same viewBox) wrapping <image href="assets/sprites/<id>.png"/>.
 * ========================================================================= */

(function () {
  const META = {
    minnow: 2.4, panfish: 1.5, roundfish: 2.0, deepbody: 1.45, torpedo: 2.0,
    slim: 2.5, mahi: 1.7, tarpon: 2.0, flatfish: 1.6, eel: 2.7, puffer: 1.25,
    mola: 1.05, billfish: 2.3, sailfish: 1.85, squid: 1.4, ray: 1.45, manta: 1.7,
    shark: 2.0, shark_stocky: 2.0, shark_slim: 2.5, tigershark: 2.0,
    thresher: 2.0, hammerhead: 2.0, greatwhite: 2.0, whaleshark: 2.0, sawfish: 2.6,
  };
  const H = (id) => Math.round(200 / META[id]);
  const svg = (h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 ${h}">${inner}</svg>`;

  function shade(hex, amt) {
    const c = hex.replace("#", "");
    const num = parseInt(c.length === 3 ? c.replace(/(.)/g, "$1$1") : c, 16);
    let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  // 4-stop dorsal->belly gradient
  const bodyGrad = (id, c) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="${shade(c, -0.42)}"/>
       <stop offset="0.4" stop-color="${c}"/>
       <stop offset="0.72" stop-color="${shade(c, 0.22)}"/>
       <stop offset="1" stop-color="${shade(c, 0.52)}"/>
     </linearGradient>`;
  // soft top-light highlight
  const sheenGrad = (id) =>
    `<radialGradient id="${id}" cx="0.4" cy="0.26" r="0.75">
       <stop offset="0" stop-color="#fff" stop-opacity="0.5"/>
       <stop offset="0.55" stop-color="#fff" stop-opacity="0.06"/>
       <stop offset="1" stop-color="#fff" stop-opacity="0"/>
     </radialGradient>`;
  const eye = (cx, cy, r, iris) =>
    `<circle cx="${cx}" cy="${cy}" r="${r + 1.2}" fill="#0a1216"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${iris || "#c9a24a"}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.5}" fill="#05080a"/>` +
    `<circle cx="${cx - r * 0.32}" cy="${cy - r * 0.34}" r="${r * 0.24}" fill="#fff" fill-opacity="0.92"/>`;

  // Build body+sheen via <use> so the long body path isn't repeated.
  // `pathD` is the body outline; returns defs + the two stacked fills.
  function shell(P, c, pathD, strokeW) {
    const d = shade(c, -0.5);
    return {
      defs: `<defs>${bodyGrad(P + "b", c)}${sheenGrad(P + "s")}<path id="${P}p" d="${pathD}"/></defs>`,
      fill: `<use href="#${P}p" fill="url(#${P}b)" stroke="${d}" stroke-width="${strokeW || 2}"/>` +
            `<use href="#${P}p" fill="url(#${P}s)"/>`,
      d,
    };
  }

  // ---- boat helpers ------------------------------------------------------
  // 3-stop hull gradient (bright sheer -> base -> dark waterline)
  const hull3 = (id, c) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="${shade(c, 0.45)}"/>
       <stop offset="0.45" stop-color="${c}"/>
       <stop offset="1" stop-color="${shade(c, -0.3)}"/></linearGradient>`;
  // glass gradient used by cabin windows
  const glassB = (id) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#dceff6"/><stop offset="0.5" stop-color="#9cc0d1"/>
       <stop offset="1" stop-color="#5b8496"/></linearGradient>`;
  // a window with a diagonal glint (expects a gradient with id `${P}gl`)
  const winR = (P, x, y, w, h, r) => {
    r = r == null ? 2 : r;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${P}gl)" stroke="#3a5562" stroke-width="0.8"/>` +
      `<path d="M${x + 1.5} ${y + h - 1.5} L${x + w * 0.5} ${y + 1.5} L${x + w * 0.5 + 3} ${y + 1.5} L${x + 4.5} ${y + h - 1.5} Z" fill="#fff" opacity="0.32"/>`;
  };
  // a horizontal safety rail with vertical posts
  const railing = (x1, x2, y, h, stroke) => {
    let p = `<line x1="${x1}" y1="${y - h}" x2="${x2}" y2="${y - h}" stroke="${stroke}" stroke-width="1.4"/>`;
    const n = Math.max(2, Math.round((x2 - x1) / 13));
    for (let i = 0; i <= n; i++) { const x = (x1 + (x2 - x1) * i / n).toFixed(1); p += `<line x1="${x}" y1="${y - h}" x2="${x}" y2="${y}" stroke="${stroke}" stroke-width="1"/>`; }
    return p;
  };

  const SPRITES = {
    // ---- baitfish --------------------------------------------------------
    minnow(c, P) {
      const h = H("minnow"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M42 ${m} C72 ${m - 15} 150 ${m - 12} 176 ${m} C150 ${m + 12} 72 ${m + 15} 42 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M44 ${m} L14 ${m - 13} L26 ${m} L14 ${m + 13} Z" fill="${shade(c,0.1)}" stroke="${d}" stroke-width="1.6"/>` + // tail
        `<path d="M86 ${m - 12} q12 -7 30 -1 l-2 5 q-14 -5 -28 1Z" fill="${shade(c,-0.1)}" opacity="0.9"/>` + // dorsal
        s.fill +
        `<path d="M70 ${m} Q120 ${m - 2} 158 ${m}" stroke="#eaf6ff" stroke-width="2.4" opacity="0.7" fill="none"/>` + // silver lateral
        `<path d="M150 ${m - 8} q5 8 0 16" stroke="${d}" stroke-width="1.2" fill="none" opacity="0.5"/>` + // gill
        eye(160, m - 1, 5, "#1a2b33"));
    },

    panfish(c, P) {
      const h = H("panfish"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M54 ${m} C66 ${m - 42} 120 ${m - 40} 162 ${m - 16} C176 ${m - 6} 180 ${m + 6} 162 ${m + 16} C120 ${m + 40} 66 ${m + 42} 54 ${m} Z`);
      let bars = "";
      for (let i = 0; i < 4; i++) bars += `<path d="M${82 + i * 20} ${m - 30} q4 30 0 60" stroke="${d}" stroke-width="3" opacity="0.28" fill="none"/>`;
      return svg(h,
        s.defs +
        `<path d="M56 ${m} L16 ${m - 24} L30 ${m} L16 ${m + 24} Z" fill="${shade(c,0.1)}" stroke="${d}" stroke-width="1.6"/>` +
        `<path d="M84 ${m - 40} q22 -10 56 -2 l-3 7 q-26 -7 -52 2Z" fill="${shade(c,-0.12)}"/>` + // spiny dorsal
        s.fill + bars +
        `<path d="M70 ${m + 8} q14 22 30 14 l-4 -7 q-12 4 -22 -10Z" fill="${shade(c,-0.05)}" opacity="0.85"/>` + // pelvic
        `<path d="M148 ${m - 14} q7 14 0 28" stroke="${d}" stroke-width="1.4" fill="none" opacity="0.5"/>` +
        eye(150, m - 7, 6, "#caa24a"));
    },

    roundfish(c, P) {
      const h = H("roundfish"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M32 ${m} C64 12 150 22 182 ${m} C150 78 64 88 32 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M34 ${m} L6 26 L20 ${m} L6 74 Z" fill="${shade(c,0.08)}" stroke="${d}" stroke-width="1.6"/>` +
        `<path d="M80 16 q24 -10 56 0 l-4 8 q-26 -8 -50 0Z" fill="${shade(c,-0.12)}"/>` + // dorsal
        s.fill +
        `<path d="M70 84 q22 8 40 -2 l-4 -7 q-18 6 -34 0Z" fill="${shade(c,-0.05)}" opacity="0.8"/>` + // anal
        `<path d="M132 ${m - 2} q18 6 16 22 q-12 -8 -16 -22Z" fill="${shade(c,0.1)}" stroke="${d}" stroke-width="1.2"/>` + // pectoral
        `<path d="M66 ${m} Q120 ${m - 4} 156 ${m}" stroke="${shade(c,0.5)}" stroke-width="2.2" opacity="0.5" fill="none"/>` +
        `<path d="M150 30 q-10 ${m - 30} 0 ${(m - 30) * 2}" stroke="${d}" stroke-width="1.4" fill="none" opacity="0.45"/>` + // gill plate
        eye(152, 46, 6, "#caa24a"));
    },

    deepbody(c, P) {
      const h = H("deepbody"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M46 ${m} C58 ${m - 50} 118 ${m - 46} 162 ${m - 12} C176 ${m - 2} 178 ${m + 2} 162 ${m + 12} C118 ${m + 46} 58 ${m + 50} 46 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M48 ${m} L10 ${m - 22} L26 ${m} L10 ${m + 22} Z" fill="${shade(c,0.1)}" stroke="${d}" stroke-width="1.6"/>` +
        `<path d="M96 ${m - 48} q26 -8 50 4 l-4 7 q-22 -10 -44 -3Z" fill="${shade(c,-0.12)}"/>` +
        s.fill +
        `<path d="M96 ${m + 46} q22 8 44 -2 l-4 -7 q-20 8 -38 1Z" fill="${shade(c,-0.05)}" opacity="0.85"/>` +
        `<path d="M138 ${m - 2} q20 8 16 26 q-12 -10 -16 -26Z" fill="${shade(c,0.12)}" stroke="${d}" stroke-width="1.2"/>` +
        `<path d="M72 ${m - 30} L72 ${m + 30}" stroke="${shade(c,0.4)}" stroke-width="2" opacity="0.3"/>` +
        eye(150, m - 9, 6, "#1a2b33"));
    },

    // ---- pelagic ---------------------------------------------------------
    torpedo(c, P) {
      const h = H("torpedo"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M24 ${m} C66 16 150 28 182 ${m} C150 72 66 84 24 ${m} Z`);
      let finlets = "";
      for (let i = 0; i < 3; i++) { finlets += `<path d="M${118 + i * 12} 38 l5 1 l-4 3Z" fill="${d}"/>`; finlets += `<path d="M${118 + i * 12} ${h - 38} l5 -1 l-4 -3Z" fill="${d}"/>`; }
      return svg(h,
        s.defs +
        `<path d="M28 ${m} L2 ${m - 22} Q16 ${m} 2 ${m + 22} Z" fill="${shade(c,0.06)}" stroke="${d}" stroke-width="1.6"/>` + // crescent tail
        `<path d="M92 24 L122 6 L120 30 Z" fill="${shade(c,-0.12)}"/>` + // tall dorsal
        `<path d="M88 ${h - 22} L72 ${h - 6} L100 ${h - 26} Z" fill="${shade(c,-0.08)}"/>` + // anal
        s.fill + finlets +
        `<path d="M132 ${m + 2} q22 8 20 26 q-14 -10 -20 -26Z" fill="${shade(c,0.08)}" stroke="${d}" stroke-width="1.2"/>` + // pectoral
        `<path d="M70 ${m} Q120 ${m - 3} 156 ${m}" stroke="${shade(c,0.4)}" stroke-width="2" opacity="0.45" fill="none"/>` +
        `<path d="M150 32 q-9 ${m - 32} 0 ${(m - 32) * 2}" stroke="${d}" stroke-width="1.4" fill="none" opacity="0.45"/>` +
        eye(155, 48, 6, "#1a2b33"));
    },

    slim(c, P) {
      const h = H("slim"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M30 ${m} C70 ${m - 15} 158 ${m - 9} 182 ${m - 1} L192 ${m} L182 ${m + 1} C158 ${m + 9} 70 ${m + 15} 30 ${m} Z`);
      let bars = "";
      for (let i = 0; i < 7; i++) bars += `<path d="M${66 + i * 16} ${m - 12} q4 12 0 24" stroke="${d}" stroke-width="2.4" opacity="0.4" fill="none"/>`;
      return svg(h,
        s.defs +
        `<path d="M32 ${m} L4 ${m - 14} Q16 ${m} 4 ${m + 14} Z" fill="${shade(c,0.06)}" stroke="${d}" stroke-width="1.6"/>` +
        `<path d="M76 ${m - 10} q26 -7 54 -2 l-2 5 q-26 -5 -50 1Z" fill="${shade(c,-0.12)}"/>` + // long dorsal
        s.fill + bars +
        `<path d="M181 ${m + 2} q7 1 11 3 q-6 2 -11 1Z" fill="${shade(c,-0.1)}"/>` + // snout/jaw
        `<path d="M150 ${m - 7} q5 7 0 14" stroke="${d}" stroke-width="1.2" fill="none" opacity="0.5"/>` +
        eye(168, m - 2, 4.5, "#caa24a"));
    },

    mahi(c, P) {
      const h = H("mahi"), m = h / 2, d = shade(c, -0.5), accent = shade(c, -0.18);
      const s = shell(P, c, `M30 ${m + 6} C58 ${m - 42} 120 ${m - 28} 168 ${m - 2} C176 ${m + 6} 172 ${m + 14} 150 ${m + 22} C100 ${m + 38} 56 ${m + 36} 30 ${m + 6} Z`);
      let spots = "";
      for (const [x, y] of [[78, m - 4], [98, m + 4], [70, m + 8], [110, m - 2], [90, m + 12]]) spots += `<circle cx="${x}" cy="${y}" r="2.4" fill="${shade(c, 0.55)}" opacity="0.8"/>`;
      return svg(h,
        s.defs +
        `<path d="M30 ${m + 6} L4 ${m - 12} L18 ${m + 6} L4 ${m + 24} Z" fill="${shade(c,0.06)}" stroke="${d}" stroke-width="1.6"/>` +
        `<path d="M58 ${m - 36} Q96 ${m - 56} 120 ${m - 30} C150 ${m - 18} 166 ${m - 6} 168 ${m - 2} Q120 ${m - 22} 60 ${m - 26}Z" fill="${accent}"/>` + // long dorsal sail
        s.fill + spots +
        `<path d="M120 ${m + 8} q18 18 30 10 l-4 -7 q-10 4 -22 -10Z" fill="${accent}" opacity="0.85"/>` + // anal
        `<path d="M52 ${m - 34} q34 -16 66 -2 l-3 6 q-30 -12 -60 1Z" stroke="${d}" stroke-width="1" fill="none" opacity="0.5"/>` +
        eye(150, m - 6, 6, "#1a2b33"));
    },

    tarpon(c, P) {
      const h = H("tarpon"), m = h / 2, d = shade(c, -0.4);
      const s = shell(P, c, `M28 ${m} C70 12 150 22 184 ${m} C150 78 70 88 28 ${m} Z`);
      let scales = "";
      for (let r = 0; r < 3; r++) for (let ci = 0; ci < 6; ci++) scales += `<path d="M${66 + ci * 16} ${m - 14 + r * 12} a5 5 0 0 1 10 0" fill="none" stroke="${shade(c,0.45)}" stroke-width="1.3" opacity="0.55"/>`;
      return svg(h,
        s.defs +
        `<path d="M30 ${m} L2 24 L18 ${m} L2 76 Z" fill="${shade(c,0.08)}" stroke="${d}" stroke-width="1.6"/>` +
        `<path d="M118 28 q14 -2 22 16 l-8 2 q-8 -14 -18 -12Z" fill="${shade(c,-0.1)}"/>` + // single ray dorsal
        s.fill + scales +
        `<path d="M150 ${m + 2} q-8 -16 6 -26" stroke="${d}" stroke-width="2" fill="none" opacity="0.6"/>` + // upturned jaw
        `<path d="M150 34 q-9 ${m - 34} 0 ${(m - 34) * 2}" stroke="${d}" stroke-width="1.4" fill="none" opacity="0.5"/>` +
        eye(150, 44, 7, "#d9d2b0"));
    },

    flatfish(c, P) {
      const h = H("flatfish"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M30 ${m + 4} C70 ${m - 42} 142 ${m - 22} 178 ${m + 4} C148 ${m + 40} 86 ${m + 44} 50 ${m + 42} C40 ${m + 40} 30 ${m + 22} 30 ${m + 4} Z`);
      let fringe = "", spots = "";
      for (let i = 0; i < 12; i++) fringe += `<path d="M${50 + i * 10} ${m - 28 + Math.sin(i) * 6} l-1 -7" stroke="${shade(c,-0.1)}" stroke-width="2"/>`;
      for (const [x, y] of [[72, m - 8], [102, m + 6], [124, m - 4], [88, m + 14], [144, m + 4]]) spots += `<circle cx="${x}" cy="${y}" r="4" fill="${shade(c,-0.25)}" opacity="0.5"/>`;
      return svg(h,
        s.defs +
        `<path d="M30 ${m + 4} L6 ${m - 10} L18 ${m + 6} L6 ${m + 22} Z" fill="${shade(c,0.06)}" stroke="${d}" stroke-width="1.6"/>` +
        s.fill + fringe + spots +
        `<path d="M55 ${m - 26} Q110 ${m - 42} 170 ${m}" stroke="${shade(c,0.3)}" stroke-width="1.6" opacity="0.4" fill="none"/>` +
        eye(150, m - 14, 5, "#caa24a") + eye(162, m - 9, 5, "#caa24a"));
    },

    eel(c, P) {
      const h = H("eel"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M186 ${m} Q150 ${m - 18} 110 ${m + 12} Q70 ${m + 32} 40 ${m + 8} Q18 ${m - 8} 12 ${m} Q20 ${m - 24} 42 ${m - 10} Q80 ${m + 8} 116 ${m - 12} Q150 ${m - 28} 186 ${m} Z`, 2);
      return svg(h,
        s.defs +
        `<path d="M150 ${m - 24} Q110 ${m + 6} 60 ${m + 26}" stroke="${shade(c,-0.15)}" stroke-width="4" fill="none" opacity="0.6"/>` + // dorsal fin ridge
        s.fill +
        `<path d="M150 ${m - 20} Q116 ${m + 4} 70 ${m + 22}" stroke="${shade(c,0.3)}" stroke-width="2" fill="none" opacity="0.4"/>` +
        `<path d="M183 ${m + 3} q5 4 2 9 q-6 -2 -9 -7Z" fill="${d}"/>` + // lower jaw
        `<path d="M178 ${m + 4} l-2 5 m5 -4 l-2 6 m5 -5 l-2 6" stroke="#fff" stroke-width="1.3"/>` + // teeth
        eye(176, m - 5, 4.2, "#caa24a"));
    },

    puffer(c, P) {
      const h = H("puffer"), m = h / 2, d = shade(c, -0.5);
      let spikes = "";
      for (let a = 0; a < 18; a++) { const ang = (a / 18) * Math.PI * 2; const x1 = 104 + Math.cos(ang) * 50, y1 = m + Math.sin(ang) * 50, x2 = 104 + Math.cos(ang) * 62, y2 = m + Math.sin(ang) * 62; spikes += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${shade(c,-0.2)}" stroke-width="3" stroke-linecap="round"/>`; }
      return svg(h,
        `<defs>${bodyGrad(P + "b", c)}<radialGradient id="${P}s" cx="0.4" cy="0.32" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.6" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>` +
        spikes +
        `<path d="M150 ${m} q24 -12 32 0 q-8 12 -32 0Z" fill="${shade(c,0.05)}" stroke="${d}" stroke-width="1.6"/>` + // tail
        `<circle cx="104" cy="${m}" r="50" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` +
        `<circle cx="104" cy="${m}" r="50" fill="url(#${P}s)"/>` +
        `<path d="M122 ${m + 8} q22 6 18 24 q-12 -10 -18 -24Z" fill="${shade(c,0.1)}" stroke="${d}" stroke-width="1.2"/>` + // pectoral
        `<path d="M86 ${m + 20} q14 12 30 0" stroke="${d}" stroke-width="3" fill="none"/>` + // mouth
        `<circle cx="56" cy="${m + 18} " r="3" fill="${shade(c,-0.2)}" opacity="0.5"/>` +
        eye(132, m - 12, 9, "#caa24a"));
    },

    mola(c, P) {
      const h = H("mola"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M72 ${m} C72 28 112 24 150 30 C166 ${m - 14} 176 ${m - 6} 184 ${m} C176 ${m + 6} 166 ${m + 14} 150 ${h - 30} C112 ${h - 24} 72 ${h - 28} 72 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M112 26 L104 4 Q120 6 132 26Z" fill="${shade(c,-0.15)}"/>` + // top fin
        `<path d="M112 ${h - 26} L104 ${h - 4} Q120 ${h - 6} 132 ${h - 26}Z" fill="${shade(c,-0.1)}"/>` + // bottom fin
        s.fill +
        `<path d="M72 ${m} L48 ${m - 12} Q60 ${m} 48 ${m + 12} Z" fill="${shade(c,0.08)}" stroke="${d}" stroke-width="1.4"/>` +
        `<path d="M150 ${m + 6} q8 5 16 0" stroke="${d}" stroke-width="2.4" fill="none"/>` +
        eye(150, m - 12, 6, "#1a2b33"));
    },

    // ---- billfish --------------------------------------------------------
    billfish(c, P) {
      const h = H("billfish"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M20 ${m} C60 ${m - 30} 116 ${m - 13} 138 ${m} C116 ${m + 17} 60 ${m + 33} 20 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M116 ${m - 4} L198 ${m - 8} L120 ${m + 2} Z" fill="${shade(c,-0.05)}" stroke="${d}" stroke-width="1.2"/>` + // bill
        `<path d="M20 ${m} L0 ${m - 22} Q12 ${m} 0 ${m + 22} Z" fill="${shade(c,0.06)}" stroke="${d}" stroke-width="1.6"/>` +
        `<path d="M48 ${m - 20} Q86 ${m - 30} 110 ${m - 13} L106 ${m - 6} Q86 ${m - 20} 52 ${m - 12}Z" fill="${shade(c,-0.12)}"/>` + // dorsal
        s.fill +
        `<path d="M70 ${m + 12} q16 18 30 8 l-4 -7 q-10 4 -22 -10Z" fill="${shade(c,-0.06)}" opacity="0.8"/>` +
        `<path d="M60 ${m} Q100 ${m - 3} 120 ${m}" stroke="${shade(c,0.35)}" stroke-width="1.8" opacity="0.4" fill="none"/>` +
        eye(120, m - 2, 5.5, "#1a2b33"));
    },

    sailfish(c, P) {
      const h = H("sailfish"), m = h / 2, d = shade(c, -0.5);
      let rays = "";
      for (let i = 0; i < 8; i++) rays += `<path d="M${54 + i * 11} ${m - 12} L${56 + i * 11} ${m - 48}" stroke="${shade(c,-0.2)}" stroke-width="1.4" opacity="0.7"/>`;
      const s = shell(P, c, `M22 ${m} C60 ${m - 22} 116 ${m - 11} 138 ${m} C116 ${m + 15} 60 ${m + 30} 22 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M50 ${m - 12} Q92 ${m - 56} 128 ${m - 12} Q90 ${m - 30} 50 ${m - 12}Z" fill="${shade(c,-0.16)}"/>` + // big sail
        rays +
        `<path d="M116 ${m - 2} L196 ${m - 6} L120 ${m + 4} Z" fill="${shade(c,-0.05)}" stroke="${d}" stroke-width="1.2"/>` +
        `<path d="M22 ${m} L2 ${m - 18} Q12 ${m} 2 ${m + 18} Z" fill="${shade(c,0.06)}" stroke="${d}" stroke-width="1.6"/>` +
        s.fill +
        eye(120, m, 5, "#1a2b33"));
    },

    // ---- cephalopods / rays ---------------------------------------------
    squid(c, P) {
      const h = H("squid"), m = h / 2, d = shade(c, -0.5);
      let arms = "";
      for (let i = 0; i < 6; i++) arms += `<path d="M64 ${m - 14 + i * 6} q-30 ${-10 + i * 4} -56 ${-6 + i * 3}" stroke="${shade(c, 0.12)}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
      const s = shell(P, c, `M70 ${m} C90 ${m - 30} 150 ${m - 26} 178 ${m - 4} L186 ${m} L178 ${m + 4} C150 ${m + 26} 90 ${m + 30} 70 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M150 ${m - 26} L190 ${m - 12} L184 ${m} L190 ${m + 12} L150 ${m + 26} Z" fill="${shade(c,-0.05)}" stroke="${d}" stroke-width="1.4"/>` + // mantle fins
        arms +
        `<path d="M64 ${m - 4} q-44 6 -68 28 M64 ${m + 4} q-44 -2 -66 24" stroke="${shade(c,0.05)}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` + // long tentacles
        s.fill +
        `<circle cx="118" cy="${m - 1}" r="9" fill="#0a1216"/><circle cx="118" cy="${m - 1}" r="6" fill="#1a2b33"/><circle cx="115" cy="${m - 3}" r="2.4" fill="#fff" fill-opacity="0.9"/>` +
        `<circle cx="98" cy="${m + 4}" r="2" fill="${shade(c,-0.2)}" opacity="0.5"/><circle cx="116" cy="${m + 8}" r="2" fill="${shade(c,-0.2)}" opacity="0.5"/>`);
    },

    ray(c, P) {
      const h = H("ray"), m = h / 2, d = shade(c, -0.5);
      const s = shell(P, c, `M60 ${m} C70 ${m - 46} 120 ${m - 38} 165 ${m - 12} C178 ${m - 4} 178 ${m + 4} 165 ${m + 12} C120 ${m + 38} 70 ${m + 46} 60 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M60 ${m} Q26 ${m} 4 ${m + 3}" stroke="${d}" stroke-width="3" fill="none"/>` + // whip tail
        `<path d="M40 ${m + 2} l8 -2 l-1 5Z" fill="${d}"/>` + // barb
        s.fill +
        `<path d="M120 ${m - 30} Q120 ${m} 120 ${m + 30}" stroke="${shade(c,0.3)}" stroke-width="1.6" opacity="0.35" fill="none"/>` +
        `<circle cx="100" cy="${m + 18}" r="2.4" fill="${shade(c,-0.2)}" opacity="0.4"/><circle cx="128" cy="${m + 16}" r="2.4" fill="${shade(c,-0.2)}" opacity="0.4"/>` +
        eye(150, m - 13, 4.2, "#caa24a") + eye(150, m + 13, 4.2, "#caa24a"));
    },

    manta(c, P) {
      const h = H("manta"), m = h / 2, d = shade(c, -0.5), belly = shade(c, 0.55);
      const s = shell(P, c, `M58 ${m} C60 ${m - 50} 96 ${m - 46} 120 ${m - 30} L150 ${m - 44} C176 ${m - 30} 176 ${m + 30} 150 ${m + 44} L120 ${m + 30} C96 ${m + 46} 60 ${m + 50} 58 ${m} Z`);
      return svg(h,
        s.defs + s.fill +
        `<path d="M120 ${m - 30} q-20 5 -28 20 q15 -9 28 -7Z" fill="${belly}"/>` + // white head patch
        `<path d="M119 ${m - 30} q-15 -16 -3 -32 M133 ${m - 30} q15 -16 3 -32" stroke="${shade(c,-0.1)}" stroke-width="6" fill="none" stroke-linecap="round"/>` + // cephalic fins
        `<path d="M58 ${m} Q26 ${m} 4 ${m + 2}" stroke="${d}" stroke-width="2.4" fill="none"/>` +
        `<path d="M96 ${m - 44} Q130 ${m} 96 ${m + 44}" stroke="${shade(c,0.3)}" stroke-width="1.6" opacity="0.3" fill="none"/>` +
        eye(110, m - 8, 3.6, "#1a2b33"));
    },

    // ---- sharks ----------------------------------------------------------
    shark(c, P) {
      const h = H("shark"), m = h / 2, d = shade(c, -0.5), belly = shade(c, 0.55);
      const s = shell(P, c, `M18 ${m + 4} C70 18 150 36 190 ${m + 2} C172 ${m + 7} 150 ${m + 16} 18 ${m + 4} Z`);
      return svg(h,
        s.defs +
        `<path d="M150 38 C178 30 196 18 196 18 C186 44 150 ${m + 16} 150 ${m + 16} C170 ${m} 150 38 150 38 Z" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` + // crescent tail
        `<path d="M78 26 L100 1 L106 32 Z" fill="${shade(c,-0.15)}"/>` + // dorsal
        s.fill +
        `<path d="M40 ${m + 10} Q90 ${m + 20} 150 ${m + 12} Q90 80 40 ${m + 10} Z" fill="${belly}" opacity="0.8"/>` + // belly counter-shade
        `<path d="M70 ${m + 16} L58 88 L88 ${m + 20} Z" fill="${shade(c,-0.1)}"/>` + // pectoral
        `<path d="M120 ${m + 14} L112 80 L132 ${m + 18} Z" fill="${shade(c,-0.05)}"/>` + // pelvic
        `<path d="M155 ${m + 7} q14 2 26 4 M153 ${m + 11} q12 1 22 3" stroke="${d}" stroke-width="1.3" opacity="0.45" fill="none"/>` + // gills
        `<path d="M160 ${m + 9} q14 0 28 -3 q-15 6 -28 6Z" fill="${shade(c,0.5)}"/>` + // mouth
        eye(150, m, 4.6, "#1a2b33"));
    },

    shark_stocky(c, P) {
      const h = H("shark_stocky"), m = h / 2, d = shade(c, -0.5), belly = shade(c, 0.55);
      const s = shell(P, c, `M22 ${m} C58 14 145 34 184 ${m} C172 ${m + 7} 145 ${m + 18} 22 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M145 36 C172 28 190 18 190 18 C182 42 145 ${m + 18} 145 ${m + 18} C166 ${m} 145 36 145 36 Z" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` +
        `<path d="M82 24 L100 3 L108 30 Z" fill="${shade(c,-0.15)}"/>` +
        s.fill +
        `<path d="M40 ${m + 12} Q90 ${m + 26} 145 ${m + 16} Q90 ${m + 38} 40 ${m + 12} Z" fill="${belly}" opacity="0.8"/>` +
        `<path d="M66 ${m + 20} L56 ${m + 42} L86 ${m + 24} Z" fill="${shade(c,-0.1)}"/>` +
        `<path d="M155 ${m + 6} q12 2 22 4" stroke="${d}" stroke-width="1.3" opacity="0.45" fill="none"/>` +
        `<path d="M178 ${m} q12 -3 18 0 q-8 6 -18 4Z" fill="${shade(c,0.5)}"/>` +
        eye(150, m - 6, 4.4, "#1a2b33"));
    },

    shark_slim(c, P) {
      const h = H("shark_slim"), m = h / 2, d = shade(c, -0.5), belly = shade(c, 0.55);
      const s = shell(P, c, `M16 ${m} C70 ${m - 22} 150 ${m - 14} 188 ${m} C150 ${m + 16} 70 ${m + 24} 16 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M150 ${m - 14} C176 ${m - 24} 196 ${m - 32} 196 ${m - 32} C190 ${m} 150 ${m + 16} 150 ${m + 16} C172 ${m} 150 ${m - 14} 150 ${m - 14} Z" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` +
        `<path d="M84 ${m - 16} L98 ${m - 38} L108 ${m - 12} Z" fill="${shade(c,-0.15)}"/>` +
        s.fill +
        `<path d="M40 ${m + 8} Q90 ${m + 16} 150 ${m + 10} Q90 ${m + 22} 40 ${m + 8} Z" fill="${belly}" opacity="0.8"/>` +
        `<path d="M72 ${m + 14} L64 ${m + 32} L88 ${m + 16} Z" fill="${shade(c,-0.1)}"/>` +
        `<path d="M156 ${m - 4} q12 1 22 0" stroke="${d}" stroke-width="1.3" opacity="0.4" fill="none"/>` +
        `<path d="M184 ${m - 2} q8 -2 14 0 q-7 5 -14 4Z" fill="${shade(c,-0.1)}"/>` + // pointed snout
        eye(160, m - 2, 4, "#1a2b33"));
    },

    tigershark(c, P) {
      const h = H("tigershark"), m = h / 2, d = shade(c, -0.5), belly = shade(c, 0.58);
      let stripes = "";
      for (let i = 0; i < 7; i++) stripes += `<path d="M${64 + i * 15} ${m - 14} q4 16 0 30" stroke="${shade(c,-0.3)}" stroke-width="3.4" opacity="0.6" fill="none"/>`;
      const s = shell(P, c, `M18 ${m + 2} C70 18 150 38 190 ${m} C172 ${m + 7} 150 ${m + 16} 18 ${m + 2} Z`);
      return svg(h,
        s.defs +
        `<path d="M150 38 C178 30 196 18 196 18 C186 44 150 ${m + 16} 150 ${m + 16} C170 ${m} 150 38 150 38 Z" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` +
        `<path d="M80 24 L98 1 L106 30 Z" fill="${shade(c,-0.2)}"/>` +
        s.fill + stripes +
        `<path d="M40 ${m + 12} Q90 ${m + 24} 150 ${m + 14} Q90 82 40 ${m + 12} Z" fill="${belly}" opacity="0.7"/>` +
        `<path d="M70 ${m + 18} L60 ${m + 38} L88 ${m + 22} Z" fill="${shade(c,-0.15)}"/>` +
        eye(152, m - 2, 5, "#1a2b33"));
    },

    thresher(c, P) {
      const h = H("thresher"), m = h / 2, d = shade(c, -0.5), belly = shade(c, 0.55);
      const s = shell(P, c, `M30 ${m} C70 ${m - 22} 150 ${m - 10} 178 ${m} C150 ${m + 14} 70 ${m + 24} 30 ${m} Z`);
      return svg(h,
        s.defs +
        `<path d="M150 ${m - 4} C176 ${m - 40} 198 ${m - 60} 198 ${m - 60} C180 ${m - 22} 168 ${m + 2} 168 ${m + 2} Z" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` + // huge upper tail
        `<path d="M82 ${m - 12} L96 ${m - 32} L106 ${m - 8} Z" fill="${shade(c,-0.15)}"/>` +
        s.fill +
        `<path d="M40 ${m + 8} Q90 ${m + 16} 150 ${m + 10} Q90 ${m + 22} 40 ${m + 8} Z" fill="${belly}" opacity="0.8"/>` +
        `<path d="M72 ${m + 14} L64 ${m + 30} L88 ${m + 16} Z" fill="${shade(c,-0.1)}"/>` +
        `<path d="M30 ${m} L8 ${m - 14} Q18 ${m} 8 ${m + 14} Z" fill="${shade(c,0.06)}" stroke="${d}" stroke-width="1.6"/>` +
        eye(158, m - 4, 4.6, "#1a2b33"));
    },

    hammerhead(c, P) {
      const h = H("hammerhead"), m = h / 2, d = shade(c, -0.5), belly = shade(c, 0.55);
      const s = shell(P, c, `M22 ${m + 2} C70 24 145 38 188 ${m} C170 ${m + 5} 145 ${m + 10} 22 ${m + 2} Z`);
      return svg(h,
        s.defs +
        `<path d="M145 38 C172 30 190 20 190 20 C182 44 145 ${m + 10} 145 ${m + 10} C164 ${m} 145 38 145 38 Z" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` +
        `<path d="M80 28 L98 6 L106 32 Z" fill="${shade(c,-0.15)}"/>` +
        s.fill +
        `<path d="M40 ${m + 6} Q90 ${m + 18} 140 ${m + 8} Q90 ${m + 24} 40 ${m + 6} Z" fill="${belly}" opacity="0.8"/>` +
        `<rect x="150" y="${m - 17}" width="44" height="15" rx="7.5" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` + // hammer head
        `<path d="M70 ${m + 12} L60 ${m + 32} L86 ${m + 14} Z" fill="${shade(c,-0.1)}"/>` +
        eye(190, m - 13, 4, "#1a2b33") + eye(190, m - 6, 4, "#1a2b33"));
    },

    greatwhite(c, P) {
      const h = H("greatwhite"), m = h / 2, d = shade(c, -0.5), belly = "#eef3f4";
      const s = shell(P, c, `M14 ${m + 6} C70 18 150 36 192 ${m + 2} C172 ${m + 8} 150 ${m + 16} 14 ${m + 6} Z`);
      return svg(h,
        s.defs +
        `<path d="M150 36 C180 26 198 12 198 12 C190 44 150 ${m + 16} 150 ${m + 16} C172 ${m} 150 36 150 36 Z" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` +
        `<path d="M80 24 L102 -2 L108 30 Z" fill="${shade(c,-0.18)}"/>` +
        s.fill +
        `<path d="M28 ${m + 12} Q90 ${m + 30} 152 ${m + 14} Q90 92 28 ${m + 12} Z" fill="${belly}"/>` + // hard counter-shade line
        `<path d="M66 ${m + 18} L54 ${m + 44} L88 ${m + 22} Z" fill="${shade(c,-0.12)}"/>` +
        `<path d="M124 ${m + 16} L116 ${m + 36} L138 ${m + 20} Z" fill="${shade(c,-0.06)}"/>` +
        `<path d="M150 ${m + 8} q18 1 38 -3 q-19 10 -38 9Z" fill="#fff" stroke="${d}" stroke-width="1"/>` + // jaw
        `<path d="M154 ${m + 6} l4 7 l4 -7 l4 7 l4 -7 l4 7 l4 -7 l4 7 l4 -7 l4 7" stroke="${d}" stroke-width="1.4" fill="none"/>` + // teeth
        `<path d="M156 ${m + 4} q14 2 26 4" stroke="${d}" stroke-width="1.3" opacity="0.4" fill="none"/>` +
        eye(150, m + 1, 4.4, "#0c0c0c"));
    },

    whaleshark(c, P) {
      const h = H("whaleshark"), m = h / 2, d = shade(c, -0.5);
      let spots = "", lines = "";
      for (const [x, y] of [[60, m - 8], [80, m + 8], [100, m - 10], [118, m + 10], [136, m - 6], [74, m + 22], [110, m + 24], [150, m + 6], [92, m - 2], [128, m + 2]]) spots += `<circle cx="${x}" cy="${y}" r="3.6" fill="#e3eef3" opacity="0.85"/>`;
      for (let i = 0; i < 3; i++) lines += `<path d="M60 ${m - 6 + i * 8} Q110 ${m - 4 + i * 8} 150 ${m + i * 8}" stroke="#cfe0e8" stroke-width="1.4" opacity="0.4" fill="none"/>`;
      const s = shell(P, c, `M20 ${m + 2} C60 16 150 34 190 ${m + 2} C172 ${m + 10} 150 ${m + 20} 20 ${m + 2} Z`);
      return svg(h,
        s.defs +
        `<path d="M150 34 C176 26 194 14 194 14 C186 46 150 ${m + 20} 150 ${m + 20} C170 ${m} 150 34 150 34 Z" fill="url(#${P}b)" stroke="${d}" stroke-width="2"/>` +
        `<path d="M84 20 L100 -1 L108 26 Z" fill="${shade(c,-0.15)}"/>` +
        s.fill + lines + spots +
        `<path d="M70 ${m + 20} L58 90 L88 ${m + 22} Z" fill="${shade(c,-0.1)}"/>` +
        `<path d="M156 ${m + 6} q18 1 30 0 q-14 6 -30 5Z" fill="${shade(c,0.4)}"/>` + // wide mouth
        eye(166, m - 4, 5, "#1a2b33"));
    },

    sawfish(c, P) {
      const h = H("sawfish"), m = h / 2, d = shade(c, -0.5);
      let teeth = "";
      for (let i = 0; i < 9; i++) { teeth += `<path d="M${128 + i * 7.5} ${m - 3} l0 -8" stroke="${shade(c,-0.2)}" stroke-width="2"/>`; teeth += `<path d="M${128 + i * 7.5} ${m + 3} l0 8" stroke="${shade(c,-0.2)}" stroke-width="2"/>`; }
      const s = shell(P, c, `M26 ${m} C60 ${m - 24} 124 ${m - 9} 150 ${m} C124 ${m + 13} 60 ${m + 26} 26 ${m} Z`);
      return svg(h,
        s.defs +
        `<rect x="124" y="${m - 3}" width="72" height="6" rx="3" fill="${shade(c,-0.08)}" stroke="${d}" stroke-width="1"/>` + // rostrum
        teeth +
        `<path d="M26 ${m} L4 ${m - 16} Q14 ${m} 4 ${m + 16} Z" fill="${shade(c,0.06)}" stroke="${d}" stroke-width="1.6"/>` +
        `<path d="M70 ${m - 16} L86 ${m - 30} L96 ${m - 12} Z" fill="${shade(c,-0.12)}"/>` +
        s.fill +
        `<path d="M70 ${m + 12} L62 ${m + 28} L88 ${m + 14} Z" fill="${shade(c,-0.08)}"/>` +
        eye(126, m - 3, 4, "#1a2b33"));
    },

    // ---- CAGES (viewBox 0 0 100 112; transparent interior so the catch
    //            shows through the bars when drawn over a fish) ---------------
    cage_wire(c, P) {
      let wires = "";
      for (let i = 0; i < 7; i++) { const x = (22 + i * 9.3).toFixed(1); wires += `<line x1="${x}" y1="20" x2="${x}" y2="99"/>`; }
      let hoops = ""; for (const y of [38, 58, 78]) hoops += `<line x1="16" y1="${y}" x2="84" y2="${y}"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112">
        <defs><clipPath id="${P}c"><path d="M16 20 H84 V82 Q84 100 50 100 Q16 100 16 82 Z"/></clipPath></defs>
        <circle cx="50" cy="9" r="5" fill="none" stroke="#cdd9df" stroke-width="2.4"/>
        <line x1="50" y1="14" x2="50" y2="20" stroke="#cdd9df" stroke-width="2.4"/>
        <g clip-path="url(#${P}c)" stroke="#dbe6ec" stroke-width="1.4" opacity="0.8" fill="none">${wires}${hoops}</g>
        <path d="M16 20 V82 Q16 100 50 100 Q84 100 84 82 V20" fill="none" stroke="#eef5f8" stroke-width="2.8" stroke-linejoin="round"/>
        <ellipse cx="50" cy="20" rx="34" ry="6.5" fill="none" stroke="#eef5f8" stroke-width="2.6"/></svg>`;
    },

    cage_reinf(c, P) {
      let grid = "";
      for (const x of [37, 59]) grid += `<line x1="${x}" y1="20" x2="${x}" y2="98"/>`;
      for (const y of [42, 64, 86]) grid += `<line x1="15" y1="${y}" x2="85" y2="${y}"/>`;
      let bolts = "";
      for (const [x, y] of [[18, 23], [82, 23], [18, 95], [82, 95]]) bolts += `<circle cx="${x}" cy="${y}" r="3.4" fill="#d6e2e8" stroke="#5d7079" stroke-width="1.4"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112">
        <defs><clipPath id="${P}c"><rect x="15" y="20" width="70" height="78" rx="5"/></clipPath>
          <linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9cad2"/><stop offset="1" stop-color="#7e939c"/></linearGradient></defs>
        <circle cx="50" cy="9" r="5" fill="none" stroke="#9fb4be" stroke-width="3"/>
        <line x1="50" y1="13" x2="50" y2="20" stroke="#9fb4be" stroke-width="3"/>
        <g clip-path="url(#${P}c)" stroke="#aebfc8" stroke-width="2.6" fill="none">${grid}</g>
        <rect x="15" y="20" width="70" height="78" rx="5" fill="none" stroke="url(#${P}g)" stroke-width="4.5"/>${bolts}</svg>`;
    },

    cage_steel(c, P) {
      let bars = ""; for (let i = 0; i < 5; i++) { const x = 22 + i * 14; bars += `<line x1="${x}" y1="22" x2="${x}" y2="98"/>`; }
      let bands = ""; for (const y of [44, 76]) bands += `<line x1="14" y1="${y}" x2="86" y2="${y}"/>`;
      let rivets = ""; for (const y of [44, 76]) for (let i = 0; i < 5; i++) rivets += `<circle cx="${22 + i * 14}" cy="${y}" r="2.3" fill="#cdd6da"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112">
        <defs><clipPath id="${P}c"><rect x="14" y="20" width="72" height="80" rx="4"/></clipPath>
          <linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa7ad"/><stop offset="1" stop-color="#5f6e75"/></linearGradient></defs>
        <circle cx="50" cy="8" r="5.5" fill="none" stroke="#7d8c93" stroke-width="3.4"/>
        <rect x="30" y="13" width="40" height="7" rx="3" fill="url(#${P}g)" stroke="#4f5d63" stroke-width="1.4"/>
        <g clip-path="url(#${P}c)" fill="none">
          <g stroke="#869399" stroke-width="4.5" stroke-linecap="round">${bars}</g>
          <g stroke="#6f7d83" stroke-width="5.5">${bands}</g></g>
        <rect x="14" y="20" width="72" height="80" rx="4" fill="none" stroke="url(#${P}g)" stroke-width="5"/>${rivets}</svg>`;
    },

    cage_shark(c, P) {
      let bars = ""; for (let i = 0; i < 4; i++) { const x = 26 + i * 16; bars += `<line x1="${x}" y1="30" x2="${x}" y2="98"/>`; }
      let hazard = ""; for (let i = 0; i < 7; i++) hazard += `<rect x="${16 + i * 10}" y="22" width="10" height="7" fill="${i % 2 ? "#1c232a" : "#e8c34a"}"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112">
        <defs><clipPath id="${P}c"><rect x="14" y="29" width="72" height="71" rx="4"/></clipPath>
          <linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2cace"/><stop offset="1" stop-color="#7f8d93"/></linearGradient></defs>
        <circle cx="50" cy="8" r="5.5" fill="none" stroke="#8a979d" stroke-width="3.4"/>
        <line x1="50" y1="12" x2="50" y2="22" stroke="#8a979d" stroke-width="3.4"/>
        <g clip-path="url(#${P}c)" fill="none">
          <g stroke="#9aa7ad" stroke-width="4" stroke-linecap="round">${bars}</g>
          <path d="M14 29 L86 100 M86 29 L14 100" stroke="#aab6bb" stroke-width="3" opacity="0.8"/></g>
        <rect x="14" y="29" width="72" height="71" rx="4" fill="none" stroke="url(#${P}g)" stroke-width="5.5"/>
        <g>${hazard}</g>
        <rect x="16" y="22" width="68" height="7" fill="none" stroke="#5d6b71" stroke-width="1.2"/>
        <rect x="38" y="30" width="24" height="9" rx="2" fill="none" stroke="#5d6b71" stroke-width="1.6"/></svg>`;
    },

    cage_titanium(c, P) {
      let bars = "";
      for (let i = 0; i < 5; i++) { const x = 22 + i * 14; bars += `<line x1="${x}" y1="22" x2="${x}" y2="98" stroke="#1d6f78" stroke-width="5" opacity="0.5"/><line x1="${x}" y1="22" x2="${x}" y2="98" stroke="#5ff0f0" stroke-width="1.6"/>`; }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112">
        <defs><clipPath id="${P}c"><rect x="14" y="20" width="72" height="80" rx="8"/></clipPath>
          <linearGradient id="${P}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4a57"/><stop offset="1" stop-color="#1c2730"/></linearGradient></defs>
        <circle cx="50" cy="8" r="5.5" fill="none" stroke="#5ff0f0" stroke-width="2.8"/>
        <line x1="50" y1="12" x2="50" y2="20" stroke="#5ff0f0" stroke-width="2.6"/>
        <g clip-path="url(#${P}c)" fill="none">${bars}</g>
        <rect x="14" y="20" width="72" height="80" rx="8" fill="none" stroke="url(#${P}g)" stroke-width="6"/>
        <rect x="14" y="20" width="72" height="80" rx="8" fill="none" stroke="#5ff0f0" stroke-width="1.6" opacity="0.85"/>
        <path d="M50 51 L58 55.5 L58 64.5 L50 69 L42 64.5 L42 55.5 Z" fill="none" stroke="#5ff0f0" stroke-width="1.8"/>
        <path d="M20 26 h8 M20 26 v8 M80 26 h-8 M80 26 v8 M20 94 h8 M20 94 v-8 M80 94 h-8 M80 94 v-8" stroke="#5ff0f0" stroke-width="2.2" opacity="0.9"/></svg>`;
    },

    // ---- BOATS (viewBox 0 0 240 140, hull near y=95) ----------------------
    boat_small(c, P) {
      const d = shade(c, -0.4), rib = shade(c, 0.6), boot = shade(c, -0.32), deck = shade(c, 0.28);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <rect x="20" y="82" width="15" height="24" rx="3" fill="#3a4045" stroke="#23282c" stroke-width="1.5"/>
        <rect x="25" y="105" width="6" height="13" fill="#2a2f33"/><path d="M22 118 l11 0 l-3 8 l-5 0Z" fill="#23282c"/>
        <path d="M38 90 L204 90 L190 120 L54 120Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M38 90 L204 90 L202 95 L40 95Z" fill="${rib}"/>
        <rect x="44" y="110" width="150" height="4.5" fill="${boot}" opacity="0.7"/>
        <rect x="150" y="83" width="48" height="9" rx="2" fill="${deck}" stroke="${d}" stroke-width="1"/>
        <rect x="58" y="83" width="34" height="9" rx="2" fill="${deck}" stroke="${d}" stroke-width="1"/>
        <path d="M198 83 l8 -5 M202 78 l0 -8" stroke="#2a2f33" stroke-width="2.4"/>
        <rect x="110" y="73" width="11" height="8" rx="2" fill="#33373b"/><rect x="114" y="66" width="4" height="8" fill="#33373b"/>
        <path d="M122 83 L122 65 L138 65 L142 83Z" fill="#eef3f5" stroke="${d}" stroke-width="1.2"/>
        ${winR(P, 125, 68, 12, 9)}</svg>`;
    },
    boat_console(c, P) {
      const d = shade(c, -0.4), rib = shade(c, 0.6), boot = shade(c, -0.32), tt = "#2f3338";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <rect x="20" y="84" width="13" height="22" rx="3" fill="#3a4045" stroke="#23282c" stroke-width="1.4"/>
        <rect x="35" y="84" width="13" height="22" rx="3" fill="#3a4045" stroke="#23282c" stroke-width="1.4"/>
        <rect x="27" y="106" width="6" height="12" fill="#2a2f33"/><rect x="42" y="106" width="6" height="12" fill="#2a2f33"/>
        <path d="M30 88 L214 88 L198 120 L48 120Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M30 88 L214 88 L212 93 L32 93Z" fill="${rib}"/>
        <rect x="50" y="110" width="152" height="4.5" fill="${boot}" opacity="0.7"/>
        <rect x="98" y="58" width="30" height="30" rx="3" fill="#eef3f5" stroke="${d}" stroke-width="1.4"/>
        ${winR(P, 102, 63, 22, 11)}
        <rect x="84" y="40" width="62" height="5" rx="2" fill="${tt}"/>
        <line x1="92" y1="45" x2="92" y2="58" stroke="${tt}" stroke-width="2.4"/><line x1="138" y1="45" x2="138" y2="58" stroke="${tt}" stroke-width="2.4"/>
        <line x1="140" y1="40" x2="140" y2="26" stroke="#5d6b71" stroke-width="1.6"/>
        ${railing(150, 204, 88, 11, rib)}</svg>`;
    },
    boat_cruiser(c, P) {
      const d = shade(c, -0.4), rib = shade(c, 0.6), boot = shade(c, -0.3), white = "#eef3f5", wsh = "#cdd8dd";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <path d="M18 86 L222 86 L204 124 L38 124Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M18 86 L222 86 L220 92 L20 92Z" fill="${rib}"/>
        <rect x="40" y="114" width="168" height="5" fill="${boot}" opacity="0.7"/>
        <path d="M64 50 Q40 48 40 86" fill="none" stroke="#8a979d" stroke-width="3"/>
        <path d="M66 86 L80 48 L150 48 L168 86Z" fill="${white}" stroke="${d}" stroke-width="1.6"/>
        <path d="M150 48 L168 86 L158 86 L146 52Z" fill="${wsh}"/>
        ${winR(P, 86, 54, 22, 15)}${winR(P, 114, 54, 22, 15)}
        <rect x="150" y="30" width="5" height="18" fill="${d}"/>
        ${railing(40, 64, 86, 9, rib)}</svg>`;
    },
    boat_sportfisher(c, P) {
      const d = shade(c, -0.4), rib = shade(c, 0.6), boot = shade(c, -0.3), white = "#eef3f5", tower = "#8a979d";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <path d="M14 88 L226 88 L206 126 L34 126Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M14 88 L226 88 L224 94 L16 94Z" fill="${rib}"/>
        <rect x="36" y="115" width="174" height="5" fill="${boot}" opacity="0.7"/>
        <path d="M70 88 L84 44 L150 44 L170 88Z" fill="${white}" stroke="${d}" stroke-width="1.6"/>
        ${winR(P, 90, 50, 20, 16)}${winR(P, 116, 50, 20, 16)}
        <rect x="92" y="20" width="46" height="24" fill="none" stroke="${tower}" stroke-width="2"/>
        <line x1="92" y1="32" x2="138" y2="32" stroke="${tower}" stroke-width="1.6"/>
        <rect x="104" y="6" width="22" height="14" fill="none" stroke="${tower}" stroke-width="2"/>
        <line x1="100" y1="44" x2="62" y2="10" stroke="${d}" stroke-width="2"/><line x1="130" y1="44" x2="170" y2="10" stroke="${d}" stroke-width="2"/>
        ${railing(36, 70, 88, 9, rib)}</svg>`;
    },
    boat_trawler(c, P) {
      const d = shade(c, -0.4), rib = shade(c, 0.6), boot = shade(c, -0.3), white = "#e7eef0", mast = "#6f7d83";
      let fenders = ""; for (const x of [60, 90, 120, 150, 180]) fenders += `<circle cx="${x}" cy="104" r="5" fill="${shade(c, -0.18)}" stroke="${d}" stroke-width="1"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <path d="M16 84 L224 84 L210 128 L30 128Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M16 84 L224 84 L222 91 L18 91Z" fill="${rib}"/>
        ${fenders}
        <rect x="40" y="116" width="172" height="5" fill="${boot}" opacity="0.7"/>
        <rect x="150" y="44" width="58" height="40" fill="${white}" stroke="${d}" stroke-width="1.6"/>
        ${winR(P, 158, 52, 18, 14)}${winR(P, 182, 52, 18, 14)}
        <rect x="196" y="28" width="10" height="16" fill="${shade(c, -0.15)}" stroke="${d}" stroke-width="1.2"/>
        <rect x="96" y="30" width="7" height="54" fill="${mast}"/>
        <line x1="99" y1="34" x2="40" y2="84" stroke="${mast}" stroke-width="2.4"/><line x1="99" y1="34" x2="150" y2="62" stroke="${mast}" stroke-width="2"/>
        <line x1="99" y1="44" x2="150" y2="50" stroke="${mast}" stroke-width="1.4"/></svg>`;
    },
    boat_yacht(c, P) {
      const d = shade(c, -0.4), boot = shade(c, -0.28), white = "#f1f5f6", gold = "#d8b24a", tower = "#9aa6ac";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <path d="M8 88 L232 88 L210 130 L30 130Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M8 88 L232 88 L230 94 L10 94Z" fill="${gold}"/>
        <rect x="32" y="118" width="184" height="5" fill="${boot}" opacity="0.7"/>
        <path d="M52 88 L62 56 L150 56 L176 88Z" fill="${white}" stroke="${d}" stroke-width="1.6"/>
        <path d="M64 56 L72 36 L150 36 L150 56Z" fill="${white}" stroke="${d}" stroke-width="1.6"/>
        ${winR(P, 70, 42, 22, 12)}${winR(P, 96, 42, 22, 12)}${winR(P, 122, 42, 22, 12)}
        ${winR(P, 70, 62, 18, 16)}${winR(P, 94, 62, 18, 16)}${winR(P, 118, 62, 18, 16)}${winR(P, 142, 62, 16, 16)}
        <rect x="96" y="14" width="40" height="22" fill="none" stroke="${tower}" stroke-width="2"/>
        <rect x="106" y="2" width="20" height="12" fill="none" stroke="${tower}" stroke-width="2"/>
        <line x1="104" y1="36" x2="64" y2="6" stroke="${d}" stroke-width="2"/><line x1="128" y1="36" x2="170" y2="6" stroke="${d}" stroke-width="2"/></svg>`;
    },

    boat_sportyacht(c, P) {
      const d = shade(c, -0.4), rib = shade(c, 0.62), boot = shade(c, -0.28), white = "#f1f5f6", arch = "#9aa6ac";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <path d="M10 86 L214 86 L232 96 L208 128 L34 128Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M10 86 L214 86 L213 92 L12 92Z" fill="${rib}"/>
        <rect x="34" y="116" width="178" height="5" fill="${boot}" opacity="0.7"/>
        <path d="M48 86 L66 46 L150 46 L182 86Z" fill="${white}" stroke="${d}" stroke-width="1.6"/>
        <path d="M70 50 L150 50 L176 82 L70 82Z" fill="url(#${P}gl)" stroke="#3a5562" stroke-width="1"/>
        <path d="M72 52 L120 52 L120 80 Z" fill="#fff" opacity="0.16"/>
        <path d="M66 46 q26 0 30 -22" fill="none" stroke="${arch}" stroke-width="3"/>
        <rect x="92" y="20" width="5" height="6" fill="${d}"/></svg>`;
    },
    boat_catamaran(c, P) {
      const d = shade(c, -0.4), rib = shade(c, 0.6), boot = shade(c, -0.3), white = "#eef3f5";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <rect x="30" y="84" width="12" height="20" rx="3" fill="#3a4045" stroke="#23282c" stroke-width="1.3"/>
        <rect x="200" y="84" width="12" height="20" rx="3" fill="#3a4045" stroke="#23282c" stroke-width="1.3"/>
        <path d="M24 92 L96 92 L86 120 L42 120Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M144 92 L216 92 L198 120 L154 120Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <rect x="24" y="84" width="192" height="10" rx="3" fill="${rib}" stroke="${d}" stroke-width="1.2"/>
        <rect x="40" y="113" width="46" height="4" fill="${boot}" opacity="0.7"/><rect x="156" y="113" width="44" height="4" fill="${boot}" opacity="0.7"/>
        <rect x="88" y="48" width="64" height="36" rx="4" fill="${white}" stroke="${d}" stroke-width="1.6"/>
        ${winR(P, 96, 54, 22, 14)}${winR(P, 122, 54, 22, 14)}
        <rect x="82" y="42" width="76" height="6" rx="3" fill="#cdd8dd" stroke="${d}" stroke-width="1"/>
        <rect x="116" y="24" width="5" height="18" fill="${d}"/>
        ${railing(40, 200, 84, 9, rib)}</svg>`;
    },
    boat_expedition(c, P) {
      const d = shade(c, -0.4), rib = shade(c, 0.6), boot = shade(c, -0.3), white = "#e7eef0", steel = "#7f8d93";
      let fenders = ""; for (const x of [66, 96, 126]) fenders += `<circle cx="${x}" cy="104" r="5" fill="${shade(c, -0.18)}" stroke="${d}" stroke-width="1"/>`;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <path d="M14 84 L226 84 L210 128 L30 128Z" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M14 84 L226 84 L224 91 L16 91Z" fill="${rib}"/>
        <line x1="20" y1="99" x2="220" y2="99" stroke="${shade(c, -0.2)}" stroke-width="1" opacity="0.5"/>
        ${fenders}
        <rect x="40" y="116" width="172" height="5" fill="${boot}" opacity="0.7"/>
        <rect x="148" y="38" width="58" height="46" fill="${white}" stroke="${d}" stroke-width="1.6"/>
        ${winR(P, 158, 46, 18, 13)}${winR(P, 182, 46, 18, 13)}
        <rect x="170" y="14" width="5" height="24" fill="${steel}"/><line x1="172" y1="15" x2="200" y2="30" stroke="${steel}" stroke-width="1.4"/><circle cx="174" cy="12" r="3" fill="none" stroke="${steel}" stroke-width="1.4"/>
        <path d="M40 84 L54 46 L72 84" fill="none" stroke="${steel}" stroke-width="3"/><line x1="54" y1="46" x2="16" y2="58" stroke="${steel}" stroke-width="3"/>
        <rect x="94" y="64" width="46" height="20" fill="${shade(c, 0.1)}" stroke="${d}" stroke-width="1.4"/><line x1="94" y1="74" x2="140" y2="74" stroke="${d}" stroke-width="0.8" opacity="0.5"/></svg>`;
    },
    boat_submarine(c, P) {
      const d = shade(c, -0.4), rib = shade(c, 0.5), steel = "#5d6b71";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140"><defs>${hull3(P + "h", c)}${glassB(P + "gl")}</defs>
        <path d="M30 95 L6 78 L6 112Z" fill="${shade(c, -0.12)}" stroke="${d}" stroke-width="2"/>
        <circle cx="9" cy="95" r="7" fill="none" stroke="${steel}" stroke-width="2"/><line x1="9" y1="88" x2="9" y2="102" stroke="${steel}" stroke-width="2"/><line x1="2" y1="95" x2="16" y2="95" stroke="${steel}" stroke-width="2"/>
        <rect x="22" y="80" width="198" height="34" rx="17" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <path d="M30 84 q92 -6 184 0" fill="none" stroke="${rib}" stroke-width="2" opacity="0.7"/>
        <line x1="70" y1="80" x2="70" y2="114" stroke="${shade(c, -0.18)}" stroke-width="1" opacity="0.5"/><line x1="150" y1="80" x2="150" y2="114" stroke="${shade(c, -0.18)}" stroke-width="1" opacity="0.5"/>
        <path d="M214 84 q12 11 0 26" fill="${shade(c, 0.55)}" stroke="${d}" stroke-width="1.5"/>
        <rect x="100" y="48" width="40" height="34" rx="8" fill="url(#${P}h)" stroke="${d}" stroke-width="2.5"/>
        <line x1="108" y1="40" x2="108" y2="48" stroke="${steel}" stroke-width="3"/><circle cx="108" cy="38" r="3" fill="${steel}"/>
        ${railing(102, 138, 48, 7, steel)}
        <circle cx="120" cy="63" r="6" fill="url(#${P}gl)" stroke="${d}" stroke-width="1.6"/>
        <circle cx="58" cy="97" r="9" fill="url(#${P}gl)" stroke="${d}" stroke-width="2.5"/><circle cx="55" cy="94" r="2.6" fill="#fff" opacity="0.5"/>
        <circle cx="160" cy="97" r="7" fill="url(#${P}gl)" stroke="${d}" stroke-width="2"/>
        <circle cx="210" cy="97" r="4" fill="#ffe9a8" stroke="${d}" stroke-width="1"/></svg>`;
    },

    // ---- CHARACTER AVATARS (viewBox 0 0 120 120) --------------------------
    char_marina() {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="#0c5f7a"/>
        <circle cx="60" cy="50" r="26" fill="#f0c9a4"/><path d="M34 50 Q36 18 60 18 Q84 18 86 50 Q86 30 60 28 Q34 30 34 50Z" fill="#5b3a29"/>
        <path d="M34 52 q-2 22 6 30 M86 52 q2 22 -6 30" stroke="#5b3a29" stroke-width="6" fill="none"/>
        <circle cx="50" cy="50" r="4" fill="#1a2b33"/><circle cx="70" cy="50" r="4" fill="#1a2b33"/>
        <path d="M52 62 q8 6 16 0" stroke="#9b5b45" stroke-width="3" fill="none"/><path d="M30 120 q30 -34 60 0Z" fill="#1f8f7a"/></svg>`;
    },
    char_jack() {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="#264a63"/>
        <circle cx="60" cy="52" r="26" fill="#e6b48c"/><path d="M28 40 q32 -16 64 0 l6 -2 q-38 -22 -76 0Z" fill="#1a2b3a"/><rect x="24" y="36" width="72" height="8" rx="4" fill="#11202c"/>
        <path d="M40 70 q20 18 40 0 l0 14 q-20 12 -40 0Z" fill="#dfe6ea"/><circle cx="50" cy="50" r="4" fill="#1a2b33"/><circle cx="70" cy="50" r="4" fill="#1a2b33"/>
        <path d="M30 120 q30 -34 60 0Z" fill="#c9a24a"/></svg>`;
    },
    char_kai() {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="#7a3f5a"/>
        <circle cx="60" cy="52" r="26" fill="#d9a06e"/><path d="M34 48 Q34 22 60 22 Q86 22 86 48 L80 44 Q60 34 40 44Z" fill="#22343f"/>
        <circle cx="50" cy="52" r="4" fill="#1a2b33"/><circle cx="70" cy="52" r="4" fill="#1a2b33"/>
        <path d="M52 64 q8 5 16 0" stroke="#8a4a36" stroke-width="3" fill="none"/><path d="M30 120 q30 -34 60 0Z" fill="#e0743f"/></svg>`;
    },
  };

  function svgToDataUri(s) { return "data:image/svg+xml;charset=utf8," + encodeURIComponent(s); }

  let UID = 0;
  const nextP = () => "g" + (UID++).toString(36);

  const imgCache = {};
  function makeImage(spriteId, color) {
    const key = spriteId + "|" + (color || "");
    if (imgCache[key]) return imgCache[key];
    const fn = SPRITES[spriteId];
    if (!fn) throw new Error("Unknown sprite: " + spriteId);
    const img = new Image();
    img.src = svgToDataUri(fn(color, nextP()));
    imgCache[key] = img;
    return img;
  }
  function svgMarkup(spriteId, color) { return SPRITES[spriteId](color, nextP()); }
  function aspect(spriteId) { return META[spriteId] || 2.0; }

  window.SPRITES = SPRITES;
  window.SpriteKit = { makeImage, svgMarkup, svgToDataUri, shade, aspect };
})();
