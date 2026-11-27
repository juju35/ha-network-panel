// Front panel of a switch, drawn as in ha-switch-card (chassisSvg, duplicated): vents and the power light on the left,
// then the ports, up to 12 on one row, beyond that odd ports on top and even ports below. A port is green when its
// link is up, grey when down, light grey when unknown. The panel's stylesheet colours the hs-* classes (day / night).
import { networkEsc } from "./core.js";

export const NETWORK_PORT_COLORS = {
  up: ["#43a047", "#1b5e20"],
  down: ["#9e9e9e", "#555555"],
  unknown: ["#cfd3d8", "#8a9099"],
};

/** The link state of a port entity: up, down or unknown. */
export const networkPortState = (st) => {
  if (!st || st.state === "unavailable" || st.state === "unknown") return "unknown";
  if (st.state === "on" || st.state === "connected" || st.state === "up") return "up";
  const n = Number(st.state);
  if (Number.isFinite(n)) return n > 0 ? "up" : "down";
  return "down";
};

/**
 * The switch's front panel. `ports`: [{ label, state, title }], `uid` keeps the gradient of several switches apart,
 * `powerColor` the power light (green when the switch is reachable).
 */
export const networkChassisSvg = (ports, uid, powerColor = "#43a047") => {
  const list = ports.length ? ports : Array.from({ length: 8 }, (_, i) => ({ label: String(i + 1), state: "unknown" }));
  const rows = list.length > 12 ? 2 : 1;
  const perRow = Math.ceil(list.length / rows);
  const PW = 50;
  const X0 = 176;
  const W = X0 + perRow * PW + 18;
  const H = rows === 1 ? 112 : 172;
  const rowY = rows === 1 ? [30] : [26, 86];
  const vents = Array.from({ length: 6 }, (_, i) => `<rect x="${22 + i * 14}" y="${H / 2 - 22}" width="6" height="44" rx="3" class="hs-vent"/>`).join("");
  const slots = list
    .map((p, i) => {
      const [col, dark] = NETWORK_PORT_COLORS[p.state] || NETWORK_PORT_COLORS.unknown;
      const row = rows === 2 ? i % 2 : 0;
      const colIdx = rows === 2 ? Math.floor(i / 2) : i;
      const x = X0 + colIdx * PW;
      const y = rowY[row];
      const contacts = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<rect x="${x + 8 + k * 3.6}" y="${y + 9}" width="1.8" height="7" style="fill:${dark}" opacity="0.75"/>`).join("");
      const labelY = rows === 2 && row === 0 ? y - 6 : y + 52;
      return `<g>${p.title ? `<title>${networkEsc(p.title)}</title>` : ""}<rect x="${x - 2}" y="${y - 2}" width="44" height="40" rx="4" class="hs-slot"/><path d="M${x} ${y + 6} h10 v-6 h20 v6 h10 v28 h-40 z" style="fill:${col}"/>${contacts}<rect x="${x + 4}" y="${y + 26}" width="8" height="4" rx="1" style="fill:${dark}" opacity="0.8"/><rect x="${x + 28}" y="${y + 26}" width="8" height="4" rx="1" style="fill:${dark}" opacity="0.8"/><text x="${x + 20}" y="${labelY}" text-anchor="middle" font-size="11" class="hs-label">${networkEsc(p.label)}</text></g>`;
    })
    .join("");
  return `<svg class="chassis" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="hs-body-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="hs-top"/><stop offset="1" class="hs-bottom"/></linearGradient></defs><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="1" fill="url(#hs-body-${uid})" class="hs-edge" stroke-width="2"/><rect x="6" y="5" width="${W - 12}" height="2" rx="1" fill="#ffffff" opacity="0.08"/>${vents}<circle cx="132" cy="${H / 2 - 6}" r="5" style="fill:${powerColor}"/><circle cx="132" cy="${H / 2 - 6}" r="9" style="fill:${powerColor}" opacity="0.25"/><text x="132" y="${H / 2 + 18}" text-anchor="middle" font-size="10" class="hs-label">PWR</text><rect x="156" y="14" width="1.5" height="${H - 28}" class="hs-divider"/>${slots}</svg>`;
};
