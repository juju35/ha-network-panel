// The illustrated banner: a 560 × 90 scene at the right of the top bar, drawn from its bottom right corner. A mast,
// the internet box with its Wi-Fi waves (on when a Wi-Fi network is on), the switches stacked in a small rack, then
// the main router, all linked by a dotted cable on the ground strip. The left of the picture is open sky, under the
// title. Night when Home Assistant's theme is dark (moon and stars), day otherwise (sun and clouds).
import { networkEsc } from "./core.js";
import { networkChassisSvg } from "./switch.js";

export const NETWORK_SCENE = {
  day: { sky: "#E7ECFB", hill1: "#D5DEF6", hill2: "#C9D4F2", floor: "#A9B8DF", mast: "#8EA3D6", link: "#A9B9E6", rack: "#FFFFFF", rackEdge: "#B8C6EA" },
  night: { sky: "#1B1E3A", hill1: "#252A4D", hill2: "#2D3359", floor: "#3A4170", mast: "#5D6BA8", link: "#5D6BA8", rack: "#262B4B", rackEdge: "#4A5488" },
};

/** Moves a whole SVG document into a box of the scene (its own viewBox kept, fitted at the bottom). */
export const networkPlace = (svg, x, y, w, h) =>
  svg.replace(/^<svg\b([^>]*?)viewBox="([^"]+)"[^>]*>/, (_m, attrs, vb) => {
    const cls = attrs.match(/class="([^"]+)"/);
    return `<svg${cls ? ` class="${cls[1]}"` : ""} x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMax meet">`;
  });

/**
 * The banner picture. `night`: dark theme; `box`: the box picture (data: URI) or ""; `switches`: one list of ports
 * ({ label, state }) per switch (three drawn at most); `router`: the router picture or ""; `wifi`: a Wi-Fi network is
 * on; `online`: the internet link is up (the cable's colour).
 */
export const networkSceneSvg = ({ night, box, switches, router, wifi, online }) => {
  const c = night ? NETWORK_SCENE.night : NETWORK_SCENE.day;
  let s = `<rect width="560" height="90" fill="${c.sky}"/>`;
  if (night) {
    s += `<g fill="#FFFFFF" opacity=".85">${[
      [40, 18],
      [96, 34],
      [150, 12],
      [230, 26],
      [300, 14],
      [372, 30],
      [440, 10],
      [520, 22],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1"/>`)
      .join("")}</g><circle cx="120" cy="24" r="12" fill="#F4E7C4"/><circle cx="126" cy="19" r="10" fill="${c.sky}"/>`;
  } else {
    s += `<g fill="#FFFFFF" opacity=".9"><ellipse cx="40" cy="24" rx="30" ry="8"/><ellipse cx="64" cy="18" rx="17" ry="7"/><ellipse cx="300" cy="30" rx="22" ry="6"/></g><circle cx="120" cy="24" r="13" fill="#FFD772"/><circle cx="120" cy="24" r="20" fill="#FFD772" opacity=".25"/>`;
  }
  s += `<path d="M0 66 Q140 50 280 62 T560 54 V90 H0Z" fill="${c.hill1}"/><path d="M0 74 Q150 64 300 72 T560 70 V90 H0Z" fill="${c.hill2}"/>`;
  // Mast with its radio light
  s += `<g transform="translate(176 6)"><path d="M14 74 22 10h4l8 64" fill="none" stroke="${c.mast}" stroke-width="2.5"/><path d="M16 56h16M18 40h12M20 26h8" stroke="${c.mast}" stroke-width="2"/><circle cx="24" cy="8" r="4" fill="${online ? "#2F6FDE" : "#9AA3AE"}"/></g>`;
  s += `<path d="M216 77H548" stroke="${online ? c.link : "#E5484D"}" stroke-width="2.5" stroke-dasharray="1 6" stroke-linecap="round"/>`;
  // The box and its Wi-Fi waves
  if (box) {
    if (wifi) s += `<g fill="none" stroke="#2F6FDE" stroke-width="2.5" stroke-linecap="round"><path d="M268 38a20 20 0 0 1 28 0" opacity=".55"/><path d="M261 30a30 30 0 0 1 42 0" opacity=".3"/></g>`;
    s += `<image href="${networkEsc(box)}" x="236" y="42" width="92" height="38" preserveAspectRatio="xMidYMax meet"/>`;
  }
  // The switches, stacked in a rack
  const drawn = switches.slice(0, 3);
  if (drawn.length) {
    const h = 15;
    const top = 80 - 6 - drawn.length * (h + 3);
    s += `<rect x="338" y="${top - 3}" width="104" height="${80 - top + 3}" rx="3" fill="${c.rack}" stroke="${c.rackEdge}" stroke-width="1.5"/>`;
    drawn.forEach((ports, i) => {
      s += networkPlace(networkChassisSvg(ports, `scene${i}`), 342, top + i * (h + 3), 96, h);
    });
  }
  if (router) s += `<image href="${networkEsc(router)}" x="446" y="26" width="104" height="54" preserveAspectRatio="xMidYMax meet"/>`;
  s += `<rect y="80" width="560" height="10" fill="${c.floor}"/>`;
  return `<svg class="scene" viewBox="0 0 560 90" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">${s}</svg>`;
};
