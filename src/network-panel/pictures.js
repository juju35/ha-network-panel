// Device drawings, duplicated from the ha-* cards (the repositories stay independent):
// - the internet boxes of ha-internet-box-card (src/core.js): the Freebox, Livebox, SFR Box and Bbox models drawn,
//   and generic form factors (router, hub, tower, mobile, dish) tinted in the provider's colour;
// - the routers, firewalls, mesh nodes and access points of ha-router-card (src/pictures.js).
// Each drawing is a whole SVG document, used as a data: URI picture (<image> in the banner, <img> in the tiles).

// Freebox pictures, drawn: rounded boxes as an extruded top shape (plan flattened by the view angle), square boxes
// in parallel projection (each face drawn flat and placed with shared axes).
export const FONT = 'font-family="Arial, Helvetica, sans-serif"';
// Extrusion of a convex top shape: the shape `top(dy)` drawn at dy = h (bottom), a band between its left / right
// extremes (x0, x1 at height yExt), then the shape at dy = 0 (top).
export const extrude = (top, x0, x1, yExt, h, side, cap) =>
  `<path d="${top(h)}" fill="${side}"/><rect x="${x0}" y="${yExt}" width="${x1 - x0}" height="${h}" fill="${side}"/><path d="${top(0)}" fill="${cap}"/>`;
export const svgDoc = (w, h, defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
export const grad = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
// Stadium (pill) outline centred on (cx, cy), half-sizes a × b, ends of radius b.
export const stadium = (cx, cy, a, b) => `M${cx - a + b} ${cy - b} H${cx + a - b} A${b} ${b} 0 0 1 ${cx + a - b} ${cy + b} H${cx - a + b} A${b} ${b} 0 0 1 ${cx - a + b} ${cy - b} Z`;
// Squircle-like rounded ellipse (Ultra): superellipse approximated with cubic curves.
export const roundEllipse = (cx, cy, a, b, k = 0.82) =>
  `M${cx} ${cy - b} C${cx + a * k} ${cy - b} ${cx + a} ${cy - b * k} ${cx + a} ${cy} C${cx + a} ${cy + b * k} ${cx + a * k} ${cy + b} ${cx} ${cy + b} C${cx - a * k} ${cy + b} ${cx - a} ${cy + b * k} ${cx - a} ${cy} C${cx - a} ${cy - b * k} ${cx - a * k} ${cy - b} ${cx} ${cy - b} Z`;

// Freebox Ultra: white rounded oval with the black "free" pill and its button on top.
export const ultraSvg = () => {
  const h = 46;
  const top = (dy) => roundEllipse(150, 46 + dy, 140, 40);
  const defs = grad("u-cap", [[0, "#ffffff"], [1, "#ebebe9"]]) + grad("u-side", [[0, "#f1f1ef"], [0.55, "#dededb"], [1, "#b9b9b5"]], 1, 0);
  let s = `<ellipse cx="150" cy="${46 + h + 37}" rx="136" ry="7" opacity=".25"/>`;
  s += extrude(top, 10, 290, 46, h, "url(#u-side)", "url(#u-cap)");
  s += `<path d="${stadium(158, 34, 40, 9)}" fill="#141517"/>`;
  s += `<text x="148" y="37.5" text-anchor="middle" font-size="11" font-style="italic" font-weight="700" fill="#fff" ${FONT}>free</text>`;
  s += `<circle cx="187" cy="34" r="5.5" fill="#2a2c30" stroke="#3d4045"/>`;
  return svgDoc(300, 140, defs, s);
};
// Freebox Pop: white puck, silver "free" pill with its dark button on top, LED on the front.
export const popSvg = () => {
  const h = 42;
  const top = (dy) => `M10 ${48 + dy} A140 38 0 0 1 290 ${48 + dy} A140 38 0 0 1 10 ${48 + dy} Z`;
  const defs = grad("p-cap", [[0, "#ffffff"], [1, "#e7e8e8"]]) + grad("p-side", [[0, "#f3f3f1"], [0.5, "#d9d9d6"], [1, "#a7a8a6"]], 1, 0) + grad("p-pill", [[0, "#d9dbdd"], [1, "#a9adb1"]]);
  let s = `<ellipse cx="150" cy="${48 + h + 34}" rx="136" ry="8" opacity=".25"/>`;
  s += extrude(top, 10, 290, 48, h, "url(#p-side)", "url(#p-cap)");
  s += `<path d="${stadium(185, 30, 38, 7)}" fill="url(#p-pill)"/>`;
  s += `<text x="174" y="33.5" text-anchor="middle" font-size="9" font-style="italic" font-weight="700" fill="#fff" ${FONT}>free</text>`;
  s += `<ellipse cx="210" cy="30" rx="11" ry="5.5" fill="#2a2c30"/>`;
  s += `<circle cx="150" cy="${48 + 38 + h * 0.5}" r="1.8" fill="#fff"/><circle cx="150" cy="${48 + 38 + h * 0.5}" r="4" fill="#fff" opacity=".3"/>`;
  return svgDoc(300, 136, defs, s);
};
// Dot-matrix glyphs (5 × 7) of the Delta clock.
export const DOTS = {
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  3: [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  ":": [".", ".", "#", ".", "#", ".", "."],
};
// "text" in glowing dots from (x, y), dot pitch p.
export const dotText = (text, x, y, p) => {
  let s = "";
  for (const ch of text) {
    const rows = DOTS[ch];
    for (const [j, row] of rows.entries()) {
      for (const [i, c] of [...row].entries()) {
        if (c === "#") s += `<circle cx="${(x + i * p).toFixed(1)}" cy="${(y + j * p).toFixed(1)}" r="${(p * 0.36).toFixed(2)}"/>`;
      }
    }
    x += (rows[0].length + 1) * p;
  }
  return `<g fill="#ffffff" filter="url(#d-glow)">${s}</g>`;
};
// Freebox Delta, seen from the front and low: white rounded-triangle top much foreshortened, tall curved front
// with its raised rim, dot-matrix clock with the up / down keys, "free" under it, slim base.
export const deltaSvg = () => {
  const defs =
    grad("d-cap", [[0, "#fdfdfd"], [1, "#e9e9e7"]]) +
    grad("d-front", [[0, "#e4e4e2"], [0.3, "#d6d6d4"], [0.7, "#cacac7"], [1, "#b9b9b6"]], 1, 0) +
    '<filter id="d-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  // One outline for the whole body, rounded at the corners; the top face shares its upper part and ends on the
  // curved rim; the slim base follows the curved bottom.
  const shoulders = "M6 72 C6 62 12 56 26 50 L98 13 C110 6 190 6 202 13 L274 50 C288 56 294 62 294 72";
  const rim = "C250 78 200 81 150 81 C100 81 50 78 6 72";
  let s = '<ellipse cx="150" cy="150" rx="140" ry="4" opacity=".25"/>';
  s += '<path d="M22 140 Q150 154 278 140 L276 145 Q150 158 24 145 Z" fill="#b9b9b6"/>';
  s += `<path d="${shoulders} V124 C294 136 286 142 270 143 Q150 151 30 143 C14 142 6 136 6 124 Z" fill="url(#d-front)"/>`;
  s += `<path d="${shoulders} ${rim} Z" fill="url(#d-cap)"/>`;
  s += '<path d="M6 72 C50 78 100 81 150 81 C200 81 250 78 294 72" fill="none" stroke="#ffffff" stroke-width="3"/>';
  s += '<path d="M7 76 C50 82 100 85 150 85 C200 85 250 82 293 76" fill="none" stroke="#bdbdba" stroke-width="1"/>';
  s += '<path d="M146 66 q2 -2 4 0 m-5 -2 q3 -3 6 0" fill="none" stroke="#b9b9b5" stroke-width=".9" stroke-linecap="round"/>';
  s += dotText("13:37", 122, 98, 3.6);
  s += '<path d="M101 99 l4 -4 l4 4 M101 124 l4 4 l4 -4" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#d-glow)"/>';
  s += `<text x="168" y="139" text-anchor="middle" font-size="9" font-style="italic" fill="#9b9b97" ${FONT}>free</text>`;
  return svgDoc(300, 156, defs, s);
};
// Yellow segmented "13 / 37" display of the Freebox player boxes, at (x, y), digit height dh.
export const display1337 = (x, y, dh, fill = "#d8c21a") =>
  `<text x="${x}" y="${y + dh}" font-size="${dh * 1.25}" font-weight="700" fill="${fill}" ${FONT} letter-spacing="1">13</text><text x="${x}" y="${y + 2.1 * dh}" font-size="${dh * 1.25}" font-weight="700" fill="${fill}" ${FONT} letter-spacing="1">37</text>`;
export const dpad = (cx, cy, r, col) =>
  `<path d="M${cx - 3} ${cy - r + 3} l3 -3 l3 3 M${cx - 3} ${cy + r - 3} l3 3 l3 -3 M${cx - r + 3} ${cy - 3} l-3 3 l3 3 M${cx + r - 3} ${cy - 3} l3 3 l-3 3" fill="none" stroke="${col}" stroke-width="1.3" stroke-linecap="round"/>`;
// Freebox mini 4K (photo): seen from above, brushed grey top, black front with the yellow display.
export const mini4kSvg = () => {
  const [X0, Y0] = [6, 54];
  const front = `matrix(1 0 0 1 ${X0} ${Y0})`;
  const top = `matrix(1 0 .06 -.42 ${X0} ${Y0})`;
  const defs = grad("m-top", [[0, "#7c7f83"], [0.5, "#a7aaae"], [1, "#6d7074"]], 1, 0);
  let s = `<rect x="${X0}" y="${Y0 + 60}" width="260" height="4" fill="#000" opacity=".35"/>`;
  s += `<g transform="${top}"><rect width="260" height="100" rx="2" fill="url(#m-top)"/></g>`;
  s += `<g transform="${front}"><rect width="266" height="60" rx="1.5" fill="#0b0b0c"/>`;
  s += display1337(10, 8, 18);
  s += `${dpad(102, 30, 13, "#9a9a9a")}<circle cx="134" cy="30" r="3" fill="none" stroke="#9a9a9a" stroke-width="1.2"/>`;
  s += `<text x="252" y="13" text-anchor="end" font-size="8" font-style="italic" fill="#c8c8c8" ${FONT}>freebox</text></g>`;
  return svgDoc(278, 120, defs, s);
};
// Freebox Revolution (photo): black box seen from the front left, yellow display and red tab on the front.
export const revolutionSvg = () => {
  const [X0, Y0] = [10, 52];
  const front = `matrix(1 .16 0 1 ${X0} ${Y0})`;
  const top = `matrix(1 .16 .5 -.26 ${X0} ${Y0})`;
  const side = `matrix(.5 -.26 0 1 ${X0 + 230} ${Y0 + 230 * 0.16})`;
  const defs = grad("r-top", [[0, "#2b2c2f"], [1, "#151618"]], 1, 0) + grad("r-front", [[0, "#1d1e21"], [1, "#0c0c0d"]]);
  let tex = "";
  for (let i = 0; i < 9; i++) tex += `<text x="${8 + (i % 3) * 70}" y="${16 + Math.floor(i / 3) * 30}" font-size="13" font-weight="700" fill="#2e3034" ${FONT}>FREEBOX</text>`;
  let s = `<ellipse cx="160" cy="${Y0 + 74}" rx="140" ry="7" opacity=".3"/>`;
  s += `<g transform="${top}"><rect width="230" height="100" rx="5" fill="url(#r-top)"/>${tex}</g>`;
  s += `<g transform="${side}"><rect width="100" height="30" rx="3" fill="#0e0f10"/><circle cx="72" cy="14" r="3" fill="#222"/></g>`;
  s += `<g transform="${front}"><rect width="230" height="30" rx="3" fill="url(#r-front)"/>`;
  s += display1337(8, 2, 12);
  s += `${dpad(58, 15, 11, "#c9b318")}<circle cx="84" cy="15" r="2.6" fill="none" stroke="#c9b318" stroke-width="1"/>`;
  s += `<rect x="6" y="26" width="20" height="13" rx="1.5" fill="#d61f1f"/><rect x="9" y="29" width="8" height="4" fill="#fff"/></g>`;
  return svgDoc(320, 136, defs, s);
};
// Orange Livebox: original stylised drawings of each model's form factor (no logo), with the brand orange used
// only as an accent. The Livebox 6 and 7 are dark anthracite upright boxes with a flat top, a fabric-effect
// finish, an orange status light line (the 7 adds a white dot) and a small front screen; the Livebox 5 is a
// light upright rounded box; the Livebox 4 a dark box with a rounded top and a front display; the Livebox S a
// small light box.
export const LB = "#ff7900";
// Dark upright box with a flat top (Livebox 6 / 7). `diode` adds the white dot under the orange status line.
export const liveboxDark = ({ w, h, diode }) => {
  const x = (300 - w) / 2;
  const bottom = 172;
  const top = bottom - h;
  const r = 14;
  const defs =
    grad("lbd", [[0, "#53555a"], [0.5, "#333539"], [1, "#1b1c1f"]], 1, 0) +
    '<filter id="lbd-g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>';
  let s = `<ellipse cx="150" cy="${bottom + 3}" rx="${Math.round(w * 0.5)}" ry="6" opacity=".3"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#lbd)"/>`;
  // Fabric-effect: faint vertical lines.
  for (let i = 1; i < 12; i++)
    s += `<line x1="${(x + (i * w) / 12).toFixed(1)}" y1="${top + 8}" x2="${(x + (i * w) / 12).toFixed(1)}" y2="${bottom - 8}" stroke="#000" stroke-opacity=".07"/>`;
  s += `<rect x="${x + 6}" y="${top + 12}" width="4" height="${h - 28}" rx="2" fill="#fff" opacity=".10"/>`;
  // Orange status light line near the top, with a soft glow.
  const ly = top + 22;
  s += `<rect x="${x + 16}" y="${ly - 2}" width="${w - 32}" height="7" rx="3.5" fill="${LB}" opacity=".5" filter="url(#lbd-g)"/>`;
  s += `<rect x="${x + 16}" y="${ly}" width="${w - 32}" height="3" rx="1.5" fill="${LB}"/>`;
  if (diode) s += `<circle cx="150" cy="${ly + 11}" r="1.8" fill="#fff"/>`;
  // Small front e-ink screen.
  s += `<rect x="${(300 - 44) / 2}" y="${bottom - 14 - 26}" width="44" height="26" rx="4" fill="#111214" stroke="#000" stroke-opacity=".35"/>`;
  return svgDoc(300, 182, defs, s);
};
export const livebox6Svg = () => liveboxDark({ w: 94, h: 116, diode: false });
export const livebox7Svg = () => liveboxDark({ w: 102, h: 128, diode: true });
// Light upright rounded box (Livebox 5).
// Low, wide black box with a diagonally ridged top (Livebox 5): a tall ridged top face and a front face with
// three vertical orange indicator bars over small icons on the left.
export const livebox5Svg = () => {
  const w = 252;
  const x = (300 - w) / 2;
  const yTop = 80;
  const topH = 34;
  const frontH = 42;
  const fy = yTop + topH;
  const defs = grad("lb5t", [[0, "#2d2d31"], [1, "#161618"]], 1, 0) + grad("lb5f", [[0, "#232326"], [0.5, "#17171a"], [1, "#101012"]]);
  const topShape = `M${x + 18} ${yTop} H${x + w - 10} L${x + w} ${fy} H${x} Z`;
  let s = `<ellipse cx="150" cy="${fy + frontH + 10}" rx="${Math.round(w * 0.5)}" ry="7" opacity=".32"/>`;
  s += `<path d="${topShape}" fill="url(#lb5t)"/>`;
  // Diagonal ridge texture over the top face.
  s += `<clipPath id="lb5clip"><path d="${topShape}"/></clipPath><g clip-path="url(#lb5clip)">`;
  for (let i = -4; i < 40; i++) s += `<line x1="${x + i * 8}" y1="${yTop - 6}" x2="${x + i * 8 + 44}" y2="${fy + 6}" stroke="#000" stroke-opacity=".3" stroke-width="2"/>`;
  s += "</g>";
  // Front face.
  s += `<rect x="${x}" y="${fy}" width="${w}" height="${frontH}" rx="4" fill="url(#lb5f)"/>`;
  // Three vertical orange indicator bars with small icons under them.
  const bx = x + 52;
  const gap = 22;
  for (let i = 0; i < 3; i++) s += `<rect x="${bx + i * gap}" y="${fy + 7}" width="4" height="15" rx="2" fill="${LB}"/>`;
  const iy = fy + frontH - 9;
  s += `<circle cx="${bx + 2}" cy="${iy}" r="3" fill="none" stroke="#9a9a9e" stroke-width="1"/><line x1="${bx - 1}" y1="${iy}" x2="${bx + 5}" y2="${iy}" stroke="#9a9a9e" stroke-width=".7"/>`;
  s += `<path d="M${bx + gap - 3} ${iy + 1} a5 5 0 0 1 10 0 M${bx + gap - 1} ${iy + 2.5} a3 3 0 0 1 6 0" fill="none" stroke="#9a9a9e" stroke-width="1" stroke-linecap="round"/>`;
  s += `<path d="M${bx + 2 * gap - 1} ${iy - 3} q0 6 6 6 l0 -2 -3 .6 q-.8 -2 -.8 -4.6 z" fill="#9a9a9e"/>`;
  return svgDoc(300, 170, defs, s);
};
// Low, wide black box seen from the front (Livebox 4): a short top face and a taller glossy front face carrying a
// strip of small orange indicator lights on the left and a few neutral touch marks on the right, with a corner nub.
export const livebox4Svg = () => {
  const w = 252;
  const x = (300 - w) / 2;
  const yTop = 86;
  const topH = 18;
  const frontH = 48;
  const fy = yTop + topH;
  const defs = grad("lb4t", [[0, "#2c2c30"], [1, "#171719"]], 1, 0) + grad("lb4f", [[0, "#242427"], [0.5, "#19191b"], [1, "#101012"]]);
  let s = `<ellipse cx="150" cy="${fy + frontH + 10}" rx="${Math.round(w * 0.5)}" ry="7" opacity=".32"/>`;
  // Top face (slight perspective) with an abstract criss-cross line pattern on the left and a soft sheen on the right.
  const lb4top = `M${x + 12} ${yTop} H${x + w - 12} L${x + w} ${fy} H${x} Z`;
  s += `<path d="${lb4top}" fill="url(#lb4t)"/>`;
  s += `<clipPath id="lb4clip"><path d="${lb4top}"/></clipPath><g clip-path="url(#lb4clip)" stroke="#5c5c62" stroke-opacity=".55" stroke-width="1.3" fill="none" stroke-linecap="round">`;
  s += `<path d="M${x + 18} ${fy - 2} L${x + 92} ${yTop + 2}"/><path d="M${x + 18} ${yTop + 3} L${x + 104} ${fy - 2}"/><path d="M${x + 50} ${fy - 2} L${x + 112} ${yTop + 4}"/><path d="M${x + 34} ${yTop + 2} L${x + 74} ${fy - 2}"/>`;
  s += "</g>";
  s += `<path d="M${Math.round(x + w * 0.52)} ${yTop + 5} H${x + w - 16} L${x + w - 8} ${fy - 4} H${Math.round(x + w * 0.48)} Z" fill="#ffffff" opacity=".04"/>`;
  // Front face.
  s += `<rect x="${x}" y="${fy}" width="${w}" height="${frontH}" rx="5" fill="url(#lb4f)"/>`;
  s += `<rect x="${x + 6}" y="${fy + 4}" width="${w - 12}" height="4" rx="2" fill="#ffffff" opacity=".05"/>`;
  // Orange indicator lights (abstract): a dot, Wi-Fi arcs, a phone tick, a small square — evenly spaced.
  const cy = fy + frontH / 2 + 2;
  const gx = x + 54;
  const gap = 26;
  s += `<circle cx="${gx}" cy="${cy}" r="3.4" fill="none" stroke="${LB}" stroke-width="1.6"/><circle cx="${gx}" cy="${cy}" r="1" fill="${LB}"/>`;
  s += `<path d="M${gx + gap - 5} ${cy + 1} a5 5 0 0 1 10 0 M${gx + gap - 3} ${cy + 2.5} a3 3 0 0 1 6 0" fill="none" stroke="${LB}" stroke-width="1.5" stroke-linecap="round"/><circle cx="${gx + gap}" cy="${cy + 4.5}" r="1" fill="${LB}"/>`;
  s += `<path d="M${gx + 2 * gap - 4} ${cy - 4} q0 8 8 8 l0 -3 -4 1 q-1 -3 -1 -6 z" fill="${LB}"/>`;
  s += `<rect x="${gx + 3 * gap - 4}" y="${cy - 4}" width="8" height="7" rx="1.5" fill="${LB}"/>`;
  // Right side: separator, two neutral touch marks and a corner antenna nub.
  s += `<rect x="${x + w - 88}" y="${fy + 8}" width="1.2" height="${frontH - 16}" fill="#3a3a3d"/>`;
  s += `<rect x="${x + w - 70}" y="${cy - 5}" width="2.4" height="10" rx="1.2" fill="#6a6a6e"/>`;
  s += `<path d="M${x + w - 54} ${cy + 3} a6 6 0 0 1 12 0 M${x + w - 51} ${cy + 1.5} a3 3 0 0 1 6 0" fill="none" stroke="#6a6a6e" stroke-width="1.4" stroke-linecap="round"/>`;
  s += `<rect x="${x + w - 30}" y="${cy - 4}" width="12" height="8" rx="1.5" fill="none" stroke="#6a6a6e" stroke-width="1.1"/>`;
  return svgDoc(300, 162, defs, s);
};
// Small light box (Livebox S).
// Dark upright box on feet, fabric-textured rounded top and a smooth lower half, with a central front screen
// showing a Wi-Fi glyph (Livebox S).
export const liveboxSSvg = () => {
  const w = 132;
  const x = (300 - w) / 2;
  const top = 26;
  const bodyH = 128;
  const bottom = top + bodyH;
  const r = 24;
  const split = top + 66;
  const defs = grad("lbs1", [[0, "#474a4f"], [1, "#2e3034"]], 1, 0) + grad("lbs2", [[0, "#3b3d41"], [1, "#282a2d"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 30}" rx="${Math.round(w * 0.5)}" ry="6" opacity=".28"/>`;
  // Feet.
  s += `<path d="M${x + 32} ${bottom - 6} L${x + 8} ${bottom + 26} M${x + w - 32} ${bottom - 6} L${x + w - 8} ${bottom + 26}" stroke="#303236" stroke-width="8" stroke-linecap="round"/>`;
  s += `<path d="M${x - 2} ${bottom + 24} h42 M${x + w - 40} ${bottom + 24} h42" stroke="#2b2d30" stroke-width="7" stroke-linecap="round"/>`;
  // Body (rounded rect), split into a fabric top and a smooth bottom by colour, with fabric dots clipped to it.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${bodyH}" rx="${r}" fill="url(#lbs2)"/>`;
  s += `<clipPath id="lbsc"><rect x="${x}" y="${top}" width="${w}" height="${bodyH}" rx="${r}"/></clipPath><g clip-path="url(#lbsc)">`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${split - top}" fill="url(#lbs1)"/>`;
  for (let yy = top + 9; yy < split - 4; yy += 6) for (let xx = x + 9; xx < x + w - 6; xx += 6) s += `<circle cx="${xx}" cy="${yy}" r=".8" fill="#000" fill-opacity=".18"/>`;
  s += `<rect x="${x + 7}" y="${top + r}" width="4" height="46" rx="2" fill="#fff" opacity=".07"/></g>`;
  // Central front screen with a status line and a Wi-Fi glyph.
  const pw = 46;
  const ph = 54;
  const px = 150 - pw / 2;
  const py = top + 34;
  s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="9" fill="#24262a" stroke="#1a1b1e"/>`;
  s += `<rect x="144" y="${py + 7}" width="12" height="2.4" rx="1.2" fill="#8d8d91"/>`;
  s += `<g stroke="#d2d2d5" stroke-width="2" fill="none" stroke-linecap="round"><path d="M142 ${py + 30} a10 10 0 0 1 16 0"/><path d="M145.5 ${py + 34} a5.5 5.5 0 0 1 9 0"/></g><circle cx="150" cy="${py + 39}" r="1.6" fill="#d2d2d5"/>`;
  return svgDoc(300, 200, defs, s);
};

// SFR Box: original stylised drawings. The Box 8 is a dark rounded cube with a glossy top and a mesh body; the
// Box 7 a tall slim upright black box with a mesh grille and a column of status lights, on a foot.
export const sfrBox8Svg = () => {
  const w = 128;
  const x = (300 - w) / 2;
  const top = 50;
  const h = 110;
  const bottom = top + h;
  const r = 28;
  const glossH = 30;
  const defs = grad("sfr8b", [[0, "#202124"], [1, "#0f1012"]], 1, 0) + grad("sfr8g", [[0, "#34353a"], [1, "#191a1d"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 8}" rx="${Math.round(w * 0.5)}" ry="8" opacity=".3"/>`;
  // Single rounded-cube body, clipped so the top band is glossy and the rest is a mesh grille.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#sfr8b)"/>`;
  s += `<clipPath id="sfr8c"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}"/></clipPath><g clip-path="url(#sfr8c)">`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${glossH}" fill="url(#sfr8g)"/>`;
  s += `<ellipse cx="${Math.round(x + w * 0.4)}" cy="${top + 9}" rx="${Math.round(w * 0.3)}" ry="4" fill="#fff" opacity=".07"/>`;
  for (let yy = top + glossH + 6; yy < bottom - 4; yy += 4) for (let xx = x + 8; xx < x + w - 6; xx += 4) s += `<circle cx="${xx}" cy="${yy}" r=".7" fill="#000" fill-opacity=".4"/>`;
  s += "</g>";
  s += `<circle cx="${x + w - 28}" cy="${top + 15}" r="2" fill="#7fb0e0"/>`;
  return svgDoc(300, 176, defs, s);
};
export const sfrBox7Svg = () => {
  const w = 72;
  const h = 138;
  const x = (300 - w) / 2;
  const top = 22;
  const bottom = top + h;
  const r = 10;
  const defs = grad("sfr7", [[0, "#242528"], [1, "#101113"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 14}" rx="46" ry="7" opacity=".3"/>`;
  // Foot.
  s += `<rect x="${150 - 4}" y="${bottom - 6}" width="8" height="12" fill="#17181a"/><rect x="${150 - 26}" y="${bottom + 2}" width="52" height="7" rx="3" fill="#1a1b1d"/>`;
  // Body.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#sfr7)"/>`;
  // Small ridges on the top-left.
  for (let i = 0; i < 5; i++) s += `<line x1="${x + 10 + i * 5}" y1="${top + 5}" x2="${x + 16 + i * 5}" y2="${top + 11}" stroke="#000" stroke-opacity=".3" stroke-width="1.4"/>`;
  // Column of small status lights on the left.
  for (let i = 0; i < 4; i++) s += `<circle cx="${x + 14}" cy="${top + 42 + i * 20}" r="2.6" fill="none" stroke="#b7b7bb" stroke-width="1"/>`;
  // Mesh grille (right).
  s += `<clipPath id="sfr7c"><rect x="${x + 26}" y="${top + 16}" width="${w - 34}" height="${h - 30}" rx="6"/></clipPath><g clip-path="url(#sfr7c)">`;
  for (let yy = top + 18; yy < bottom - 12; yy += 4) for (let xx = x + 28; xx < x + w - 6; xx += 4) s += `<circle cx="${xx}" cy="${yy}" r=".7" fill="#000" fill-opacity=".42"/>`;
  s += "</g>";
  return svgDoc(300, 180, defs, s);
};

// SFR NB6VAC (Box Plus / Power / Fibre): a low, wide, glossy black box seen from the front, with a column of
// status lights on the left (green at the bottom) and a ventilation grille on the right.
export const sfrNB6VACSvg = () => {
  const w = 236;
  const x = (300 - w) / 2;
  const yTop = 80;
  const topH = 20;
  const frontH = 50;
  const fy = yTop + topH;
  const bottom = fy + frontH;
  const defs = grad("nb6t", [[0, "#242427"], [0.5, "#131315"], [1, "#0c0c0e"]], 1, 0) + grad("nb6f", [[0, "#1b1b1e"], [1, "#0c0c0e"]]);
  let s = `<ellipse cx="150" cy="${bottom + 8}" rx="${Math.round(w * 0.5)}" ry="8" opacity=".32"/>`;
  // Glossy top face with a diagonal sheen.
  const topShape = `M${x + 14} ${yTop} H${x + w - 10} L${x + w} ${fy} H${x} Z`;
  s += `<path d="${topShape}" fill="url(#nb6t)"/>`;
  s += `<clipPath id="nb6c"><path d="${topShape}"/></clipPath><path clip-path="url(#nb6c)" d="M${x + 40} ${yTop} L${x + 128} ${yTop} L${x + 66} ${fy} L${x - 8} ${fy} Z" fill="#ffffff" opacity=".07"/>`;
  // Front face.
  s += `<rect x="${x}" y="${fy}" width="${w}" height="${frontH}" rx="4" fill="url(#nb6f)"/>`;
  // Status light column (green at the bottom).
  for (let i = 0; i < 5; i++) s += `<circle cx="${x + 12}" cy="${fy + 10 + i * 8}" r="2" fill="${i === 4 ? "#36c24a" : "#54545a"}"/>`;
  // Ventilation grille on the right.
  for (let i = 0; i < 9; i++) s += `<rect x="${x + w - 62 + i * 6}" y="${fy + 9}" width="2" height="${frontH - 18}" rx="1" fill="#000" fill-opacity=".45"/>`;
  // Small front flap.
  s += `<rect x="${Math.round(x + w * 0.52)}" y="${fy + 11}" width="16" height="${frontH - 22}" rx="2" fill="#141417" stroke="#000" stroke-opacity=".3"/>`;
  return svgDoc(300, 170, defs, s);
};

// Bbox (Bouygues): original stylised drawings. The Miami is a low, wide black box with stacked ventilation fins
// and a thin accent line; the Ultym a tall upright glossy tower with a round front dial; the Fibre a slim
// rounded matte tower with a column of green status lights and a bright central bar.
export const bboxMiamiSvg = () => {
  const w = 228;
  const x = (300 - w) / 2;
  const yTop = 78;
  const topH = 18;
  const frontH = 58;
  const fy = yTop + topH;
  const bottom = fy + frontH;
  const defs = grad("bbmt", [[0, "#26272b"], [0.5, "#141416"], [1, "#0d0d0f"]], 1, 0) + grad("bbmf", [[0, "#1c1c1f"], [1, "#0b0b0d"]]);
  let s = `<ellipse cx="150" cy="${bottom + 10}" rx="${Math.round(w * 0.5)}" ry="8" opacity=".3"/>`;
  // Feet.
  s += `<rect x="${x + 16}" y="${bottom - 2}" width="20" height="8" rx="3" fill="#141417"/><rect x="${x + w - 36}" y="${bottom - 2}" width="20" height="8" rx="3" fill="#141417"/>`;
  // Glossy top face with a diagonal sheen.
  const topShape = `M${x + 12} ${yTop} H${x + w - 8} L${x + w} ${fy} H${x} Z`;
  s += `<path d="${topShape}" fill="url(#bbmt)"/>`;
  s += `<clipPath id="bbmc"><path d="${topShape}"/></clipPath><path clip-path="url(#bbmc)" d="M${x + 36} ${yTop} L${x + 120} ${yTop} L${x + 60} ${fy} L${x - 6} ${fy} Z" fill="#fff" opacity=".07"/>`;
  // Front face with stacked ventilation fins.
  s += `<rect x="${x}" y="${fy}" width="${w}" height="${frontH}" rx="5" fill="url(#bbmf)"/>`;
  for (let i = 0; i < 4; i++) s += `<rect x="${x + 10}" y="${fy + 10 + i * 10}" width="${w - 20}" height="3" rx="1.5" fill="#000" fill-opacity=".38"/>`;
  // Thin blue accent line and a small status light.
  s += `<rect x="${x + 10}" y="${bottom - 7}" width="${w - 20}" height="2" rx="1" fill="#1f6fe0" opacity=".85"/>`;
  s += `<circle cx="${x + w - 18}" cy="${fy + 11}" r="2" fill="#36c24a"/>`;
  return svgDoc(300, 170, defs, s);
};
export const bboxUltymSvg = () => {
  const w = 104;
  const h = 150;
  const x = (300 - w) / 2;
  const top = 22;
  const bottom = top + h;
  const r = 20;
  const defs = grad("bbu1", [[0, "#2b2c30"], [1, "#101113"]], 1, 0) + grad("bbu2", [[0, "#3a3b40"], [1, "#1a1b1e"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 12}" rx="${Math.round(w * 0.5)}" ry="7" opacity=".3"/>`;
  // Feet.
  s += `<rect x="${x + 14}" y="${bottom - 4}" width="18" height="9" rx="3" fill="#141417"/><rect x="${x + w - 32}" y="${bottom - 4}" width="18" height="9" rx="3" fill="#141417"/>`;
  // Glossy upright body with a rounded top.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#bbu1)"/>`;
  s += `<clipPath id="bbuc"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}"/></clipPath><g clip-path="url(#bbuc)">`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="40" fill="url(#bbu2)"/>`;
  s += `<rect x="${x + 8}" y="${top + 8}" width="6" height="${h - 24}" rx="3" fill="#fff" opacity=".06"/></g>`;
  // Round front dial with a soft ring, and two small side buttons.
  s += `<circle cx="150" cy="${top + 74}" r="26" fill="#17181b" stroke="#000" stroke-opacity=".4"/>`;
  s += `<circle cx="150" cy="${top + 74}" r="26" fill="none" stroke="#1f6fe0" stroke-width="2" opacity=".55"/>`;
  s += `<circle cx="150" cy="${top + 74}" r="14" fill="#202226"/>`;
  s += `<circle cx="${x + 16}" cy="${top + 118}" r="2.2" fill="#54545a"/><circle cx="${x + w - 16}" cy="${top + 118}" r="2.2" fill="#36c24a"/>`;
  return svgDoc(300, 180, defs, s);
};
export const bboxFibreSvg = () => {
  const w = 86;
  const h = 150;
  const x = (300 - w) / 2;
  const top = 24;
  const bottom = top + h;
  const r = 30;
  const defs = grad("bbf", [[0, "#242529"], [1, "#0f1012"]], 1, 0);
  const G = "#3ad64f";
  let s = `<ellipse cx="150" cy="${bottom + 12}" rx="${Math.round(w * 0.5)}" ry="6" opacity=".28"/>`;
  // Slim matte tower with soft rounded corners.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#bbf)"/>`;
  s += `<clipPath id="bbfc"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}"/></clipPath>`;
  s += `<rect clip-path="url(#bbfc)" x="${x + 7}" y="${top + 14}" width="5" height="${h - 34}" rx="2.5" fill="#fff" opacity=".05"/>`;
  // Two status lights near the top, a bright central bar, two lights below.
  s += `<circle cx="${150 - 9}" cy="${top + 34}" r="3" fill="${G}"/><circle cx="${150 + 9}" cy="${top + 34}" r="3" fill="${G}"/>`;
  s += `<rect x="${150 - 26}" y="${top + 68}" width="52" height="7" rx="3.5" fill="${G}"/>`;
  s += `<rect x="${150 - 26}" y="${top + 68}" width="52" height="7" rx="3.5" fill="${G}" opacity=".35"/>`;
  s += `<circle cx="${150 - 9}" cy="${top + 104}" r="3" fill="${G}"/><circle cx="${150 + 9}" cy="${top + 104}" r="3" fill="${G}"/>`;
  return svgDoc(300, 182, defs, s);
};

// Generic form factors, shared by the boxes of the other integrations (FRITZ!Box, Vodafone Station, Swisscom,
// Sagemcom F@st, Huawei LTE, ZTE, Starlink): neutral drawings of a kind of device, not of a given product. Each takes
// an optional accent colour (the provider's), used for its status lights and a thin trim; without one, the lights
// keep the neutral green / blue of the README pictures.
// Wide desktop router with two antennas at the back.
// Wide desktop router body with antennas at the back (`ids`: its gradients, `antennas`: offsets from its left edge,
// a negative one from its right edge); shared by the generic box router and the router drawing.
const networkAntennaRouter = (ids, antennas, accent) => {
  const w = 176;
  const h = 34;
  const x = (300 - w) / 2;
  const top = 108;
  const bottom = top + h;
  const defs = grad(ids[0], [[0, "#2b2c30"], [1, "#141518"]]) + grad(ids[1], [[0, "#3a3b40"], [1, "#1c1d20"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 9}" rx="${Math.round(w * 0.52)}" ry="7" opacity=".28"/>`;
  for (const a of antennas) {
    const ax = a < 0 ? x + w + a : x + a;
    s += `<rect x="${ax - 4}" y="${top - 82}" width="8" height="86" rx="4" fill="url(#${ids[1]})"/>`;
  }
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="10" fill="url(#${ids[0]})"/>`;
  s += `<rect x="${x + 6}" y="${top + 3}" width="${w - 12}" height="3" rx="1.5" fill="#fff" opacity=".08"/>`;
  if (accent) s += `<rect x="${x + 12}" y="${bottom - 4}" width="${w - 24}" height="2" rx="1" fill="${accent}"/>`;
  for (let i = 0; i < 5; i++) s += `<circle cx="${x + 30 + i * 13}" cy="${top + 21}" r="2.4" fill="${accent || (i < 4 ? "#3ad64f" : "#4f8fe6")}"/>`;
  return svgDoc(300, 160, defs, s);
};
export const genRouterSvg = ({ accent } = {}) => networkAntennaRouter(["grtb", "grta"], [26, -26], accent);
// Low rounded hub without antennas, with a status light bar.
export const genHubSvg = ({ accent } = {}) => {
  const w = 150;
  const h = 46;
  const x = (300 - w) / 2;
  const top = 82;
  const bottom = top + h;
  const defs = grad("ghbb", [[0, "#f4f5f7"], [1, "#c9ccd2"]]);
  let s = `<ellipse cx="150" cy="${bottom + 9}" rx="${Math.round(w * 0.5)}" ry="7" opacity=".25"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#ghbb)" stroke="#000" stroke-opacity=".15"/>`;
  s += `<rect x="${x + 14}" y="${top + 5}" width="${w - 28}" height="4" rx="2" fill="#fff" opacity=".7"/>`;
  s += `<rect x="${150 - 24}" y="${top + h - 15}" width="48" height="5" rx="2.5" fill="${accent || "#3ad64f"}"/>`;
  return svgDoc(300, 150, defs, s);
};
// Slim upright tower on a foot, with a column of status lights.
export const genTowerSvg = ({ accent } = {}) => {
  const w = 64;
  const h = 132;
  const x = (300 - w) / 2;
  const top = 18;
  const bottom = top + h;
  const defs = grad("gtwb", [[0, "#2a2b2f"], [1, "#111214"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 14}" rx="44" ry="7" opacity=".28"/>`;
  s += `<rect x="${150 - 30}" y="${bottom + 2}" width="60" height="8" rx="4" fill="#1a1b1d"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="url(#gtwb)"/>`;
  s += `<rect x="${x + 6}" y="${top + 12}" width="4" height="${h - 24}" rx="2" fill="#fff" opacity=".06"/>`;
  if (accent) s += `<rect x="${150 - 30}" y="${bottom + 2}" width="60" height="2" rx="1" fill="${accent}"/>`;
  for (let i = 0; i < 4; i++) s += `<circle cx="150" cy="${top + 30 + i * 16}" r="2.6" fill="${accent || (i ? "#3ad64f" : "#4f8fe6")}"/>`;
  return svgDoc(300, 172, defs, s);
};
// Compact 4G / 5G cube with signal bars on its front.
export const genMobileSvg = ({ accent } = {}) => {
  const w = 104;
  const h = 120;
  const x = (300 - w) / 2;
  const top = 30;
  const bottom = top + h;
  const defs = grad("gmbb", [[0, "#fafbfc"], [1, "#d3d6dc"]], 1, 1);
  let s = `<ellipse cx="150" cy="${bottom + 9}" rx="${Math.round(w * 0.56)}" ry="7" opacity=".25"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="18" fill="url(#gmbb)" stroke="#000" stroke-opacity=".15"/>`;
  for (let i = 0; i < 4; i++) {
    const bh = 8 + i * 7;
    s += `<rect x="${150 - 22 + i * 12}" y="${top + 62 - bh}" width="8" height="${bh}" rx="2" fill="${i < 3 ? accent || "#2f7fe0" : "#b8bcc4"}"/>`;
  }
  s += `<rect x="${150 - 22}" y="${top + 84}" width="44" height="4" rx="2" fill="${accent || "#3ad64f"}"/>`;
  return svgDoc(300, 168, defs, s);
};
// Flat satellite dish on a mast.
export const genDishSvg = ({ accent } = {}) => {
  const defs = grad("gdsb", [[0, "#ffffff"], [1, "#cfd3d9"]], 1, 1);
  let s = `<ellipse cx="150" cy="164" rx="40" ry="6" opacity=".28"/>`;
  s += `<rect x="146" y="96" width="8" height="66" rx="3" fill="#8a8f98"/><rect x="128" y="156" width="44" height="7" rx="3" fill="#6b7078"/>`;
  if (accent) s += `<circle cx="150" cy="148" r="2.4" fill="${accent}"/>`;
  s += `<g transform="rotate(-18 150 66)"><rect x="96" y="20" width="108" height="92" rx="16" fill="url(#gdsb)" stroke="#000" stroke-opacity=".18"/>`;
  s += `<rect x="104" y="28" width="92" height="76" rx="11" fill="none" stroke="#000" stroke-opacity=".07"/></g>`;
  return svgDoc(300, 176, defs, s);
};
export const GENERIC = { generic_router: genRouterSvg, generic_hub: genHubSvg, generic_tower: genTowerSvg, generic_mobile: genMobileSvg, generic_dish: genDishSvg };

export const svgUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
// Pictures of the box models, by picture id: a model's `pic`, else its own id (Freebox, Livebox, SFR Box, Bbox drawings,
// then the generic form factors of the other integrations).
export const IMG_BOX = {
  ultra: svgUri(ultraSvg()),
  pop: svgUri(popSvg()),
  delta: svgUri(deltaSvg()),
  revolution: svgUri(revolutionSvg()),
  mini_4k: svgUri(mini4kSvg()),
  livebox_4: svgUri(livebox4Svg()),
  livebox_5: svgUri(livebox5Svg()),
  livebox_6: svgUri(livebox6Svg()),
  livebox_7: svgUri(livebox7Svg()),
  livebox_s: svgUri(liveboxSSvg()),
  sfr_box_8: svgUri(sfrBox8Svg()),
  sfr_box_7: svgUri(sfrBox7Svg()),
  sfr_nb6vac: svgUri(sfrNB6VACSvg()),
  bbox_miami: svgUri(bboxMiamiSvg()),
  bbox_ultym: svgUri(bboxUltymSvg()),
  bbox_fibre: svgUri(bboxFibreSvg()),
  generic_router: svgUri(genRouterSvg()),
  generic_hub: svgUri(genHubSvg()),
  generic_tower: svgUri(genTowerSvg()),
  generic_mobile: svgUri(genMobileSvg()),
  generic_dish: svgUri(genDishSvg()),
};
/** Picture of a model: its shared `pic` drawing, else the drawing named after it. A generic form factor is drawn in
 *  the provider's accent colour when one is given (status lights and trim), each variant built once. */
export const _tinted = new Map();
export const modelPic = (m, accent) => {
  if (!m) return undefined;
  const pic = m.pic ?? m.id;
  if (!accent || !GENERIC[pic]) return IMG_BOX[pic];
  const key = `${pic}|${accent}`;
  if (!_tinted.has(key)) _tinted.set(key, svgUri(GENERIC[pic]({ accent })));
  return _tinted.get(key);
};


// Firewall appliance: a low, wide dark box seen from the front and slightly above, a row of network ports, a column
// of status lights in the accent colour and a vented right side.
export const firewallSvg = ({ accent } = {}) => {
  const w = 236;
  const x = (300 - w) / 2;
  const yTop = 82;
  const topH = 16;
  const frontH = 46;
  const fy = yTop + topH;
  const bottom = fy + frontH;
  const led = accent || "#3ad64f";
  const defs = grad("fwt", [[0, "#5b6068"], [1, "#3c4046"]], 1, 0) + grad("fwf", [[0, "#43474e"], [1, "#2a2d32"]]);
  let s = `<ellipse cx="150" cy="${bottom + 8}" rx="${Math.round(w * 0.5)}" ry="7" opacity=".3"/>`;
  s += `<path d="M${x + 10} ${yTop} H${x + w - 10} L${x + w} ${fy} H${x} Z" fill="url(#fwt)"/>`;
  s += `<rect x="${x}" y="${fy}" width="${w}" height="${frontH}" rx="4" fill="url(#fwf)"/>`;
  s += `<rect x="${x + 6}" y="${fy + 3}" width="${w - 12}" height="2" rx="1" fill="#fff" opacity=".06"/>`;
  // Status lights.
  for (let i = 0; i < 3; i++) s += `<circle cx="${x + 14}" cy="${fy + 12 + i * 11}" r="2.2" fill="${i === 2 ? "#54575c" : led}"/>`;
  // Network ports: dark sockets with a light tab, the first two with a link light.
  for (let i = 0; i < 6; i++) {
    const px = x + 30 + i * 22;
    s += `<rect x="${px}" y="${fy + 13}" width="17" height="15" rx="1.5" fill="#0b0b0c" stroke="#45484d" stroke-width=".8"/>`;
    s += `<rect x="${px + 5}" y="${fy + 24}" width="7" height="4" fill="#45484d"/>`;
    if (i < 2) s += `<rect x="${px + 1}" y="${fy + 31}" width="5" height="2" rx="1" fill="${led}"/>`;
  }
  // Vents.
  for (let i = 0; i < 8; i++) s += `<rect x="${x + w - 64 + i * 7}" y="${fy + 10}" width="2.4" height="${frontH - 20}" rx="1.2" fill="#000" fill-opacity=".45"/>`;
  return svgDoc(300, 168, defs, s);
};

// Desktop router with three antennas at the back and a row of status lights.
export const routerSvg = ({ accent } = {}) => networkAntennaRouter(["rtb", "rta"], [22, 88, -22], accent);

// Mesh Wi-Fi unit: a light rounded cylinder seen slightly from above, with a light ring at its foot.
export const meshSvg = ({ accent } = {}) => {
  const w = 96;
  const x = (300 - w) / 2;
  const top = 30;
  const h = 120;
  const ry = 14;
  const ring = accent || "#3ad64f";
  const defs = grad("msb", [[0, "#d9dce1"], [0.45, "#f7f8fa"], [1, "#c3c7ce"]], 1, 0) + grad("mst", [[0, "#ffffff"], [1, "#eceef1"]]);
  let s = `<ellipse cx="150" cy="${top + h + ry + 6}" rx="${Math.round(w * 0.62)}" ry="8" opacity=".25"/>`;
  s += `<path d="M${x} ${top} V${top + h} A${w / 2} ${ry} 0 0 0 ${x + w} ${top + h} V${top} Z" fill="url(#msb)"/>`;
  s += `<ellipse cx="150" cy="${top}" rx="${w / 2}" ry="${ry}" fill="url(#mst)" stroke="#000" stroke-opacity=".08"/>`;
  // Vent ring on the top and the light at the foot.
  s += `<ellipse cx="150" cy="${top}" rx="${w / 2 - 14}" ry="${ry - 5}" fill="none" stroke="#000" stroke-opacity=".1" stroke-dasharray="2 3"/>`;
  s += `<path d="M${x + 18} ${top + h + 6} A${w / 2 - 6} ${ry - 4} 0 0 0 ${x + w - 18} ${top + h + 6}" fill="none" stroke="${ring}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<rect x="${x + 7}" y="${top + 14}" width="5" height="${h - 30}" rx="2.5" fill="#fff" opacity=".55"/>`;
  return svgDoc(300, 180, defs, s);
};

// Ceiling access point: a light flat disc seen from below at an angle, with a status light ring in the middle.
export const apSvg = ({ accent } = {}) => {
  const cx = 150;
  const cy = 86;
  const rx = 118;
  const ry = 40;
  const ring = accent || "#4f8fe6";
  const defs = grad("apb", [[0, "#f5f6f8"], [1, "#d3d6dc"]]) + grad("aps", [[0, "#c9ccd2"], [1, "#a9adb5"]]);
  let s = `<ellipse cx="${cx}" cy="${cy + ry + 22}" rx="${rx - 10}" ry="8" opacity=".22"/>`;
  s += `<ellipse cx="${cx}" cy="${cy + 10}" rx="${rx}" ry="${ry}" fill="url(#aps)"/>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#apb)" stroke="#000" stroke-opacity=".08"/>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="22" ry="7.5" fill="none" stroke="${ring}" stroke-width="3"/>`;
  s += `<ellipse cx="${cx - 40}" cy="${cy - 18}" rx="34" ry="6" fill="#fff" opacity=".6"/>`;
  return svgDoc(300, 160, defs, s);
};

export const DRAWINGS = { firewall: firewallSvg, router: routerSvg, mesh: meshSvg, ap: apSvg };
