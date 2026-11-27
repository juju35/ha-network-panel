/*
 * Network panel for Home Assistant
 * https://github.com/juju35/ha-network-panel
 *
 * A sidebar panel over the integrations of the home network: the internet box (Freebox, Livebox, FRITZ!Box…), the
 * routers, firewalls, mesh nodes and access points (UniFi, Omada, Deco, OPNsense…), the switches and their ports, the
 * Wi-Fi networks, the devices connected (router device trackers), the DNS filter (AdGuard Home, Pi-hole), the speed
 * tests (Speedtest.net, Fast.com) and a reverse proxy. It reads the states of their entities and acts through their
 * switches and buttons; the integration's own command (network_panel/inventory) only says which entity is which.
 * The cards' illustrated header as its top bar, then seven tabs: Overview, Devices, Wi-Fi, DNS, Speed, Proxy, Settings.
 * English is built in; the other languages are loaded on demand from /network_panel/i18n/<lang>.json.
 */

export const NETWORK_PANEL_VERSION = "1.0.2";
export const NETWORK_TABS = ["overview", "devices", "wifi", "dns", "speed", "proxy", "settings"];
// Tabs shown only when their source is there (the inventory key that brings them)
export const NETWORK_TAB_SOURCE = { dns: "dns", speed: "speed", proxy: "proxy" };

export const NETWORK_PANEL_EN = {
  title: "Network",
  tab_overview: "Overview",
  tab_devices: "Devices",
  tab_wifi: "Wi-Fi & switches",
  tab_dns: "DNS",
  tab_speed: "Speed",
  tab_proxy: "Proxy",
  tab_settings: "Settings",
  refresh: "Refresh",
  loading: "Loading…",
  denied: "This panel is for administrators.",
  error: "Error: {error}",
  retry: "Retry",
  nothing: "No network integration found yet. Add the integration of your internet box, router, switches, DNS filter or speed test: this panel shows what they offer.",
  open_integrations: "Integrations",
  pill_online: "Online",
  pill_offline: "Internet down",
  pill_nobox: "No internet box",
  sub_devices: "{n} devices connected",
  internet: "Internet",
  online_since: "online · {time}",
  online: "online",
  offline: "offline",
  down_up: "↓ {down} · ↑ {up}",
  ports_active: "{n} ports · {active} active",
  wifi_devices: "Wi-Fi · {n} devices",
  wifi_on: "{on} / {n} Wi-Fi networks on",
  speed_7d: "Speed · 7 days",
  speed_30d: "{name} · 30 days",
  last_test: "Last test",
  download: "Download",
  upload: "Upload",
  ping: "Ping",
  run_test: "Run a test",
  right_now: "Right now",
  no_test: "No test yet.",
  proxy: "Reverse proxy",
  hosts: "Hosts",
  hosts_ok: "{ok} / {n} OK",
  in_error: "In error",
  proxy_running: "Running",
  proxy_stopped: "Stopped",
  rules_active: "Active rules",
  certs_expiring: "Expiring certificates",
  not_checked: "not monitored",
  cert_expires: "certificate expires {when}",
  cert_expired: "certificate expired",
  wifi_networks: "Wi-Fi networks",
  state_on: "on",
  state_off: "off",
  turn_on: "Turn on",
  turn_off: "Turn off",
  confirm_off: "Turn off {name}?",
  confirm: "Confirm",
  cancel: "Cancel",
  devices: "Devices",
  connected: "Connected",
  away: "Away",
  all: "All",
  latest: "Latest arrivals",
  search: "Search",
  col_name: "Device",
  col_ip: "IP",
  col_mac: "MAC",
  col_conn: "Connection",
  col_seen: "Seen",
  wired: "Wired",
  no_devices: "No device tracker from a router yet.",
  no_match: "No result.",
  more: "+ {n} devices",
  dns_filter: "DNS filtering",
  protection_on: "Protection on",
  protection_off: "Protection off",
  queries: "Queries",
  blocked: "Blocked",
  ratio: "Blocked ratio",
  avg_time: "Average time",
  protections: "Protections",
  access_points: "Routers and access points",
  clients_n: "{n} devices",
  switches: "Switches",
  port_n: "Port {n}",
  sources: "Sources",
  loaded: "connected",
  not_loaded: "not loaded",
  sources_hint: "The integrations read and the devices shown as switches are chosen in the integration's options.",
  options: "Options",
  display: "Display",
  set_show_away: "Show away devices",
  set_confirm: "Ask before turning a Wi-Fi network or a protection off",
  empty_wifi: "No Wi-Fi switch found.",
  empty_switches: "No switch found. Switches are recognised by their model; others can be added in the integration's options.",
  empty_proxy: "No host found.",
  external_ip: "External IP",
  open_admin: "Admin page",
};

/** Escapes text for HTML (content and attribute values). */
export const networkEsc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Languages with a file in /network_panel/i18n/ (English is built in)
export const NETWORK_LANGS = ["fr", "de", "es", "it", "nl", "pt", "pl", "sr", "sr-Latn", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];

/** The panel's language: Home Assistant's, when a file exists for it (sr-Latn, else its base language), else English. */
export const networkLang = (hass) => {
  const raw = hass?.locale?.language || hass?.language || "en";
  if (NETWORK_LANGS.includes(raw)) return raw;
  const base = raw.split("-")[0];
  return NETWORK_LANGS.includes(base) ? base : "en";
};

const NETWORK_STRINGS = new Map([["en", NETWORK_PANEL_EN]]);
/** The strings of a language (English underneath, for a key a file misses), loaded once. */
export const networkLoadStrings = async (lang) => {
  if (NETWORK_STRINGS.has(lang)) return NETWORK_STRINGS.get(lang);
  let loaded = {};
  try {
    const res = await fetch(`/network_panel/i18n/${lang}.json?v=${NETWORK_PANEL_VERSION}`);
    if (res.ok) loaded = await res.json();
  } catch (_err) {
    loaded = {};
  }
  const strings = { ...NETWORK_PANEL_EN, ...loaded };
  NETWORK_STRINGS.set(lang, strings);
  return strings;
};

/** A string with its {placeholders} filled in. */
export const networkT = (strings, key, vars = {}) =>
  String((strings || NETWORK_PANEL_EN)[key] ?? NETWORK_PANEL_EN[key] ?? key).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/** A number in the panel's language, `max` decimals at most. */
export const networkNum = (lang, v, max = 0) => new Intl.NumberFormat(lang, { maximumFractionDigits: max }).format(v);

/** The numeric state of an entity, or null (unavailable, unknown, not a number). */
export const networkValue = (st) => {
  if (!st) return null;
  const n = Number.parseFloat(st.state);
  return Number.isFinite(n) ? n : null;
};

// Data rate units of Home Assistant, in bit/s
export const NETWORK_RATE_UNITS = {
  "bit/s": 1,
  "kbit/s": 1e3,
  "Mbit/s": 1e6,
  "Gbit/s": 1e9,
  "B/s": 8,
  "kB/s": 8e3,
  "KB/s": 8e3,
  "KiB/s": 8192,
  "MB/s": 8e6,
  "MiB/s": 8388608,
  "GB/s": 8e9,
  "GiB/s": 8589934592,
};

/** The rate of a data rate entity in bit/s (its unit; Mbit/s when it has none), or null. */
export const networkBits = (st) => {
  const v = networkValue(st);
  if (v === null) return null;
  return v * (NETWORK_RATE_UNITS[st.attributes?.unit_of_measurement] ?? 1e6);
};

/** A rate in bit/s as text: 312 Mb/s, 1.2 Gb/s, 640 kb/s. */
export const networkRate = (lang, bps) => {
  if (bps === null || bps === undefined) return "-";
  if (bps >= 1e9) return `${networkNum(lang, bps / 1e9, 2)} Gb/s`;
  if (bps >= 1e6) return `${networkNum(lang, bps / 1e6, bps >= 1e8 ? 0 : 1)} Mb/s`;
  return `${networkNum(lang, bps / 1e3, 0)} kb/s`;
};

/** A duration in seconds as its largest unit: 21 d, 5 h, 12 min. */
export const networkDuration = (lang, seconds) => {
  const units = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units)
    if (seconds >= size) return new Intl.NumberFormat(lang, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: 0 }).format(Math.floor(seconds / size));
  return new Intl.NumberFormat(lang, { style: "unit", unit: "minute", unitDisplay: "short" }).format(0);
};

/** How long ago a date was, in words (5 min ago), from `now` (ms). */
export const networkAgo = (lang, iso, now = Date.now()) => {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "-";
  const s = Math.round((t - now) / 1000);
  const fmt = new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "short" });
  const a = Math.abs(s);
  if (a < 60) return fmt.format(0, "minute");
  if (a < 3600) return fmt.format(Math.round(s / 60), "minute");
  if (a < 86400) return fmt.format(Math.round(s / 3600), "hour");
  return fmt.format(Math.round(s / 86400), "day");
};

/** Seconds since the box started, from an uptime entity: a timestamp (boot date) or a duration (s, min, h, d). */
export const networkUptime = (st, now = Date.now()) => {
  if (!st || st.state === "unavailable" || st.state === "unknown") return null;
  if (st.attributes?.device_class === "timestamp" || /^\d{4}-\d\d-\d\dT/.test(st.state)) {
    const t = Date.parse(st.state);
    return Number.isFinite(t) ? Math.max(0, (now - t) / 1000) : null;
  }
  const v = networkValue(st);
  if (v === null) return null;
  const unit = st.attributes?.unit_of_measurement;
  return v * ({ min: 60, h: 3600, d: 86400 }[unit] ?? 1);
};

/** Whether an entity is on (a switch, a connectivity binary sensor). */
export const networkOn = (st) => !!st && st.state === "on";
