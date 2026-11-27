import { DRAWINGS, modelPic, svgUri } from "./pictures.js";

// Which drawing goes with which device: the internet box by its integration and model (the model tables of
// ha-internet-box-card, trimmed to what picks a picture), the routers by their kind and integration.

// Box integrations: name, accent colour (generic drawings are tinted with it) and models, tried in order on the
// device's model and name. A box whose model is unknown gets its integration's default drawing.
export const NETWORK_BOXES = {
  freebox: {
    name: "Freebox",
    color: "#cd1e25",
    models: [
      { id: "ultra", name: "Freebox Ultra", re: /fbxgw9|v9\b|ultra/i },
      { id: "pop", name: "Freebox Pop", re: /fbxgw8|v8\b|pop/i },
      { id: "delta", name: "Freebox Delta", re: /fbxgw7|v7\b|delta/i },
      { id: "revolution", name: "Freebox Revolution", re: /fbxgw-r|v6\b|revolution/i },
      { id: "mini_4k", name: "Freebox mini 4K", re: /fbxgw2|mini/i },
    ],
    fallback: "ultra",
  },
  livebox: {
    name: "Livebox",
    color: "#ff7900",
    models: [
      { id: "livebox_7", name: "Livebox 7", re: /livebox\s*7|lb7/i },
      { id: "livebox_6", name: "Livebox 6", re: /livebox\s*6|lb6/i },
      { id: "livebox_5", name: "Livebox 5", re: /livebox\s*5|lb5|arcadyanlbfibre|fast\s*5656/i },
      { id: "livebox_4", name: "Livebox 4", re: /livebox\s*4|lb4/i },
      { id: "livebox_s", name: "Livebox S", re: /livebox\s*s\b|lbs\b/i },
      { id: "kpn_box_12", name: "KPN Box 12", re: /kpn|box\s*12\b/i, pic: "generic_hub" },
    ],
    fallback: "livebox_6",
  },
  sfr_box: {
    name: "SFR Box",
    color: "#e2001a",
    models: [
      { id: "sfr_box_8", name: "SFR Box 8", re: /box\s*8|nb8|fast\s*5[0-9]/i },
      { id: "sfr_box_7", name: "SFR Box 7", re: /box\s*7|nb7/i },
      { id: "sfr_nb6vac", name: "SFR Box", re: /nb6vac|box\s*(plus|power|fibre|thd)/i },
    ],
    fallback: "sfr_box_8",
  },
  bbox: {
    name: "Bbox",
    color: "#1246a0",
    models: [
      { id: "bbox_wifi7", name: "Bbox Wi-Fi 7", re: /wi-?fi\s*7|5696/i, pic: "generic_router" },
      { id: "bbox_fibre", name: "Bbox Fibre", re: /fibre|fiber/i },
      { id: "bbox_ultym", name: "Bbox Ultym", re: /ultym/i },
      { id: "bbox_miami", name: "Bbox Miami", re: /miami/i },
    ],
    fallback: "bbox_fibre",
  },
  fritz: {
    name: "FRITZ!Box",
    color: "#1f6fd1",
    models: [{ id: "fritz_box_cable", name: "FRITZ!Box Cable", re: /fritz!?\s*box\s*6\d{3}/i, pic: "generic_tower" }],
    fallback: "generic_router",
  },
  vodafone_station: { name: "Vodafone Station", color: "#e60000", models: [], fallback: "generic_tower" },
  huawei_lte: { name: "Huawei LTE", color: "#c7000b", models: [], fallback: "generic_mobile" },
  zte_hyperbox: { name: "ZTE Hyperbox", color: "#0068b7", models: [], fallback: "generic_mobile" },
  starlink: { name: "Starlink", color: "#3c4a5c", models: [], fallback: "generic_dish" },
  swisscom: { name: "Swisscom Internet-Box", color: "#1b2f78", models: [], fallback: "generic_hub" },
  sagemcom_fast: { name: "Sagemcom F@st", color: "#00838f", models: [], fallback: "generic_router" },
};

/** The box's model ({ id, name, pic }) from its integration and device model / name; null for no box. */
export const networkBoxModel = (box) => {
  if (!box) return null;
  const brand = NETWORK_BOXES[box.platform];
  if (!brand) return { id: "generic_router", name: box.model || box.name, pic: "generic_router" };
  const text = `${box.model || ""} ${box.name || ""}`;
  const m = brand.models.find((x) => x.re.test(text));
  if (m) return m;
  return { id: brand.fallback, name: box.model || brand.name };
};

/** The box picture (a data: URI): its model's drawing, a generic one tinted in the provider's colour. */
export const networkBoxPicture = (box) => {
  const m = networkBoxModel(box);
  if (!m) return "";
  return modelPic(m, NETWORK_BOXES[box.platform]?.color);
};

// Integrations whose routers are firewalls or mesh systems: drawn as such, whatever their model.
export const NETWORK_FIREWALLS = new Set(["opnsense", "pfsense", "firewalla"]);
export const NETWORK_MESH = new Set(["tplink_deco", "eero"]);

/** The drawing kind of a router of the inventory: firewall, mesh, ap or router. */
export const networkRouterKind = (r) => {
  if (r.kind === "ap") return NETWORK_MESH.has(r.platform) ? "mesh" : "ap";
  if (NETWORK_FIREWALLS.has(r.platform)) return "firewall";
  if (NETWORK_MESH.has(r.platform)) return "mesh";
  return "router";
};

const NETWORK_PIC_CACHE = new Map();
/** The picture of a router of the inventory (a data: URI), built once per kind. */
export const networkRouterPicture = (r) => {
  const kind = r ? networkRouterKind(r) : "router";
  if (!NETWORK_PIC_CACHE.has(kind)) NETWORK_PIC_CACHE.set(kind, svgUri(DRAWINGS[kind]({})));
  return NETWORK_PIC_CACHE.get(kind);
};
