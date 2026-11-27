// The <network-panel> element: the banner, the tabs, and the content of the tab shown, rendered as one HTML string
// from the inventory (network_panel/inventory) and the states. Clicks are handled once on the shadow root through
// data-act attributes; the search box keeps its focus across renders.
import {
  NETWORK_PANEL_VERSION,
  NETWORK_TAB_SOURCE,
  NETWORK_TABS,
  networkAgo,
  networkBits,
  networkDuration,
  networkEsc,
  networkLang,
  networkLoadStrings,
  networkNum,
  networkOn,
  networkRate,
  networkT,
  networkUptime,
  networkValue,
} from "./core.js";
import { NETWORK_DNS_ART } from "./dns-art.js";
import { networkBoxModel, networkBoxPicture, networkRouterPicture } from "./models.js";
import { networkSceneSvg } from "./scene.js";
import { NETWORK_PANEL_STYLE } from "./styles.js";
import { networkChassisSvg, networkPortState, networkPortsByName } from "./switch.js";

// Material Design icon paths (mdi:lan, refresh, menu, web, chevron)
const NETWORK_ICONS = {
  lan: "M10,2C8.89,2 8,2.89 8,4V7C8,8.11 8.89,9 10,9H11V11H2V13H6V15H5C3.89,15 3,15.89 3,17V20C3,21.11 3.89,22 5,22H9C10.11,22 11,21.11 11,20V17C11,15.89 10.11,15 9,15H8V13H16V15H15C13.89,15 13,15.89 13,17V20C13,21.11 13.89,22 15,22H19C20.11,22 21,21.11 21,20V17C21,15.89 20.11,15 19,15H18V13H22V11H13V9H14C15.11,9 16,8.11 16,7V4C16,2.89 15.11,2 14,2H10M10,4H14V7H10V4M5,17H9V20H5V17M15,17H19V20H15V17Z",
  refresh: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
  menu: "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z",
  web: "M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
};
const networkIcon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${NETWORK_ICONS[name]}"/></svg>`;
const NETWORK_CHEVRON = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

// Display names of the source integrations (Settings tab)
export const NETWORK_SOURCE_NAMES = {
  freebox: "Freebox", livebox: "Livebox", sfr_box: "SFR Box", bbox: "Bbox", fritz: "FRITZ!Box", vodafone_station: "Vodafone Station",
  huawei_lte: "Huawei LTE", starlink: "Starlink", swisscom: "Swisscom Internet-Box", sagemcom_fast: "Sagemcom F@st", zte_hyperbox: "ZTE Hyperbox",
  unifi: "UniFi Network", tplink_omada: "TP-Link Omada", tplink_deco: "TP-Link Deco", opnsense: "OPNsense", pfsense: "pfSense",
  asuswrt: "ASUSWRT", netgear: "NETGEAR", mikrotik: "MikroTik", keenetic_ndms2: "Keenetic", firewalla: "Firewalla", openwrt: "OpenWrt",
  luci: "OpenWrt (LuCI)", ubus: "OpenWrt (ubus)", eero: "eero", glinet: "GL.iNet", adguard: "AdGuard Home", pi_hole: "Pi-hole",
  speedtestdotcom: "Speedtest.net", fastdotcom: "Fast.com", reverse_proxy: "Reverse Proxy", nginx_proxy_manager: "Nginx Proxy Manager", npm: "Nginx Proxy Manager",
};

const NETWORK_HOST_OK = /^(on|ok|online|up|connected|running|available|true|home)$/i;
const NETWORK_HOST_BAD = /^(off|offline|down|error|disconnected|unavailable|false|problem)$/i;

/** A proxy host's state: ok, bad or idle (a numeric status: 2xx / 3xx ok, others bad). */
export const networkHostState = (st) => {
  if (!st) return "idle";
  const n = Number(st.state);
  if (Number.isFinite(n) && n >= 100 && n < 600) return n < 400 ? "ok" : "bad";
  if (NETWORK_HOST_OK.test(st.state)) return "ok";
  if (NETWORK_HOST_BAD.test(st.state)) return "bad";
  return "idle";
};

/**
 * A proxy host's state from its inventory entry: a problem sensor (Reverse Proxy's upstream check) is bad when on, ok
 * when off and idle (not monitored) otherwise; any other entity reads as networkHostState.
 */
export const networkProxyHostState = (host, st) => {
  if (!host.problem) return networkHostState(st);
  if (st?.state === "on") return "bad";
  return st?.state === "off" ? "ok" : "idle";
};

/** The device trackers of routers (the connected devices), connected first then by name. */
export const networkTrackers = (states) =>
  Object.values(states || {})
    .filter((s) => s.entity_id.startsWith("device_tracker.") && s.attributes?.source_type === "router")
    .sort((a, b) => (a.state === "home") !== (b.state === "home") ? (a.state === "home" ? -1 : 1) : networkName(a).localeCompare(networkName(b)));

/** Whether a link may be opened: http(s) addresses only (a device's configuration URL can be anything). */
export const networkHttp = (url) => /^https?:\/\//i.test(String(url || ""));

/** The name of an entity: its friendly name, else its object id. */
export const networkName = (st) => st?.attributes?.friendly_name || st?.entity_id?.split(".")[1] || "";

/** Daily peaks of a history ([{ t, v }]) over the last `days` days, oldest first (null for a day without value). */
export const networkDailyPeaks = (points, days, now = Date.now()) => {
  const out = Array.from({ length: days }, () => null);
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  for (const p of points) {
    const i = days - 1 - Math.floor((end.getTime() - p.t) / 86400000);
    if (i >= 0 && i < days && (out[i] === null || p.v > out[i])) out[i] = p.v;
  }
  return out;
};

export class NetworkPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._inv = null;
    this._err = null;
    this._strings = null;
    this._lang = "en";
    this._tab = "overview";
    this._filter = "all";
    this._search = "";
    this._ask = null;
    this._history = null;
    this._sig = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    this.shadowRoot.addEventListener("input", (ev) => this._onInput(ev));
    this.shadowRoot.addEventListener("change", (ev) => this._onChange(ev));
  }

  set panel(p) {
    this._panel = p;
  }

  set narrow(n) {
    this._narrow = n;
    this._render();
  }

  set route(r) {
    const tab = (r?.path || "").split("/").filter(Boolean)[0];
    if (tab && NETWORK_TABS.includes(tab)) this._tab = tab;
    this._render();
  }

  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    const lang = networkLang(h);
    if (first || lang !== this._lang) {
      this._lang = lang;
      networkLoadStrings(lang).then((s) => {
        this._strings = s;
        this._render(true);
      });
    }
    if (first) this._load();
    this.classList.toggle("night", !!h?.themes?.darkMode);
    this._render();
  }

  get hass() {
    return this._hass;
  }

  _t(key, vars) {
    return networkT(this._strings, key, vars);
  }

  _st(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }

  async _load() {
    this._err = null;
    try {
      this._inv = await this._hass.callWS({ type: "network_panel/inventory" });
      this._history = null;
      this._fetchHistory();
    } catch (err) {
      this._err = err?.code === "unauthorized" ? "denied" : err?.message || String(err);
    }
    this._render(true);
  }

  /** 30 days of the speed test sensors, for the Overview bars and the Speed chart. */
  async _fetchHistory() {
    const sp = this._inv?.speed?.entities || {};
    const ids = [sp.download, sp.upload].filter(Boolean);
    if (!ids.length) return;
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000);
    try {
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        entity_ids: ids,
        minimal_response: true,
        no_attributes: true,
      });
      const parse = (id) =>
        (res?.[id] || [])
          .map((p) => ({ t: (p.lu ?? p.lc ?? 0) * 1000, v: Number.parseFloat(p.s) }))
          .filter((p) => Number.isFinite(p.v));
      this._history = { download: parse(sp.download), upload: parse(sp.upload) };
    } catch (_err) {
      this._history = { download: [], upload: [] };
    }
    this._render(true);
  }

  // ----- actions -----

  _go(tab) {
    this._tab = tab;
    const base = this._panel?.url_path || "network";
    try {
      history.replaceState(null, "", `/${base}/${tab}`);
    } catch (_err) {
      // not in a browser (tests)
    }
    this._render(true);
  }

  _navigate(path) {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  _toggle(id, on) {
    const st = this._st(id);
    if (!on && this._inv?.settings?.confirm_actions !== false) {
      this._ask = { id, name: networkName(st) };
      this._render(true);
      return;
    }
    this._hass.callService("switch", on ? "turn_on" : "turn_off", { entity_id: id });
  }

  async _setting(key, value) {
    try {
      const res = await this._hass.callWS({ type: "network_panel/update_settings", [key]: value });
      if (res?.settings && this._inv) this._inv.settings = res.settings;
    } catch (err) {
      this._err = err?.message || String(err);
    }
    this._render(true);
  }

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n?.dataset?.act);
    if (!el) return;
    const { act, arg, on } = el.dataset;
    if (act === "tab") this._go(arg);
    else if (act === "refresh" || act === "retry") this._load();
    else if (act === "menu") this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
    else if (act === "filter") {
      this._filter = arg;
      this._render(true);
    } else if (act === "toggle") this._toggle(arg, on === "1");
    else if (act === "confirm") {
      const id = this._ask?.id;
      this._ask = null;
      if (id) this._hass.callService("switch", "turn_off", { entity_id: id });
      this._render(true);
    } else if (act === "cancel") {
      this._ask = null;
      this._render(true);
    } else if (act === "test") this._hass.callService("homeassistant", "update_entity", { entity_id: arg });
    else if (act === "options") this._navigate("/config/integrations/integration/network_panel");
    else if (act === "integrations") this._navigate("/config/integrations/dashboard");
  }

  _onInput(ev) {
    const el = ev.composedPath()[0];
    if (el?.dataset?.act !== "search") return;
    this._search = el.value;
    this._render(true);
  }

  _onChange(ev) {
    const el = ev.composedPath()[0];
    if (el?.dataset?.act === "setting") this._setting(el.dataset.arg, el.checked);
  }

  // ----- rendering -----

  /** The states the shown content depends on, so an unrelated state change does not re-render. */
  _signature() {
    const inv = this._inv;
    if (!inv || !this._hass) return "";
    const ids = [];
    const add = (o) => {
      for (const v of Object.values(o || {})) if (typeof v === "string") ids.push(v);
    };
    add(inv.box?.entities);
    for (const r of inv.routers) add(r.entities);
    for (const s of inv.switches) for (const p of this._portsOf(s)) ids.push(p.entity);
    ids.push(...inv.wifi);
    add(inv.dns?.entities);
    ids.push(...(inv.dns?.switches || []));
    add(inv.speed?.entities);
    for (const h of inv.proxy?.hosts || []) ids.push(...[h.upstream, h.cert, h.expiring].filter(Boolean));
    add(inv.proxy?.summary);
    const parts = ids.map((id) => this._st(id)?.last_updated || "-");
    for (const s of networkTrackers(this._hass.states)) parts.push(`${s.entity_id}:${s.state}:${s.last_changed}`);
    return parts.join("|");
  }

  _render(force = false) {
    if (!this._hass || !this.shadowRoot) return;
    const sig = `${this._tab}#${this._signature()}`;
    if (!force && sig === this._sig) return;
    this._sig = sig;
    const focused = this.shadowRoot.activeElement?.dataset?.act === "search";
    const caret = focused ? this.shadowRoot.activeElement.selectionStart : null;
    this.shadowRoot.innerHTML = `<style>${NETWORK_PANEL_STYLE}</style>${this._html()}`;
    if (focused) {
      const input = this.shadowRoot.querySelector('[data-act="search"]');
      input?.focus();
      if (caret !== null) input?.setSelectionRange?.(caret, caret);
    }
  }

  _tabs() {
    const inv = this._inv;
    return NETWORK_TABS.filter((tab) => !NETWORK_TAB_SOURCE[tab] || inv?.[NETWORK_TAB_SOURCE[tab]]);
  }

  _html() {
    const head = this._banner();
    if (this._err === "denied") return `${head}<div class="body"><div class="c empty">${networkEsc(this._t("denied"))}</div></div>`;
    if (this._err)
      return `${head}<div class="body"><div class="c empty">${networkEsc(this._t("error", { error: this._err }))}<br><br><button class="b" data-act="retry">${networkEsc(this._t("retry"))}</button></div></div>`;
    if (!this._inv) return `${head}<div class="body"><div class="c empty">${networkEsc(this._t("loading"))}</div></div>`;
    const tabs = this._tabs();
    if (!tabs.includes(this._tab)) this._tab = "overview";
    const bar = `<nav class="tabs">${tabs
      .map((tab) => `<button class="tab${tab === this._tab ? " on" : ""}" data-act="tab" data-arg="${tab}">${networkEsc(this._t(`tab_${tab}`))}</button>`)
      .join("")}</nav>`;
    const body = this[`_tab_${this._tab}`]();
    return `${head}${bar}<div class="body">${body}</div>${this._askHtml()}`;
  }

  _askHtml() {
    if (!this._ask) return "";
    return `<div class="ask"><div class="c" role="dialog" aria-modal="true"><div class="h">${networkEsc(this._t("confirm_off", { name: this._ask.name }))}</div><div class="chips"><button class="b" data-act="cancel">${networkEsc(this._t("cancel"))}</button><button class="b bad" data-act="confirm">${networkEsc(this._t("confirm"))}</button></div></div></div>`;
  }

  /** The internet link: true (up), false (down), null (no box). */
  _online() {
    const box = this._inv?.box;
    if (!box) return null;
    const wan = this._st(box.entities.wan);
    if (wan) return networkOn(wan);
    const down = this._st(box.entities.rate_down);
    if (down) return down.state !== "unavailable";
    return null;
  }

  _portsOf(sw) {
    return sw.ports.length ? sw.ports : networkPortsByName(this._hass?.states, sw.name);
  }

  _switchPorts(sw) {
    return this._portsOf(sw).map((p) => {
      const st = this._st(p.entity);
      return { label: String(p.n), state: networkPortState(st), title: p.label || this._t("port_n", { n: p.n }) };
    });
  }

  _banner() {
    const inv = this._inv;
    const online = this._online();
    const trackers = networkTrackers(this._hass.states);
    const home = trackers.filter((s) => s.state === "home").length;
    const box = inv?.box;
    const pill = !inv
      ? ""
      : online === null
        ? `<span class="pill idle"><span class="dot"></span>${networkEsc(this._t("pill_nobox"))}</span>`
        : online
          ? `<span class="pill ok"><span class="dot"></span>${networkEsc(this._t("pill_online"))}</span>`
          : `<span class="pill bad"><span class="dot"></span>${networkEsc(this._t("pill_offline"))}</span>`;
    const sub = [box ? networkBoxModel(box)?.name || box.name : "", inv ? this._t("sub_devices", { n: home }) : ""].filter(Boolean).join(" · ");
    const scene = networkSceneSvg({
      night: !!this._hass.themes?.darkMode,
      box: box ? networkBoxPicture(box) : "",
      switches: (inv?.switches || []).map((s) => this._switchPorts(s)),
      router: inv ? networkRouterPicture(inv.routers[0]) : "",
      wifi: (inv?.wifi || []).some((id) => networkOn(this._st(id))),
      online: online !== false,
    });
    return `<header class="banner">${scene}<div class="head">${this._narrow ? `<button class="menu" data-act="menu" aria-label="Menu">${networkIcon("menu")}</button>` : ""}<div class="ico">${networkIcon("lan")}</div><div class="htext"><div class="ttl">${networkEsc(this._t("title"))}${pill}</div><div class="sub">${networkEsc(sub)}</div></div><button class="hbtn" data-act="refresh" aria-label="${networkEsc(this._t("refresh"))}" title="${networkEsc(this._t("refresh"))}">${networkIcon("refresh")}</button></div></header>`;
  }

  _empty(key) {
    return `<div class="c empty">${networkEsc(this._t(key))}</div>`;
  }

  // ----- Overview -----

  _tab_overview() {
    const inv = this._inv;
    const nothing = !inv.box && !inv.routers.length && !inv.switches.length && !inv.dns && !inv.speed && !inv.proxy && !networkTrackers(this._hass.states).length;
    if (nothing)
      return `<div class="c empty">${networkEsc(this._t("nothing"))}<br><br><button class="b" data-act="integrations">${networkEsc(this._t("open_integrations"))}</button></div>`;
    const left = [this._speedCard(), this._proxyCard()].filter(Boolean);
    const mid = [this._wifiCard(), this._devicesCard()].filter(Boolean);
    const right = [this._dnsCard()].filter(Boolean);
    const cols = [left, mid, right].filter((c) => c.length).map((c) => `<div class="col">${c.join("")}</div>`);
    return `${this._topology()}<div class="grid3">${cols.join("")}</div>`;
  }

  _node(vis, name, status, cls = "") {
    return `<div class="node"><div class="vis${cls}">${vis}</div><div class="nm">${networkEsc(name)}</div><div class="st ${status[1] || ""}">${networkEsc(status[0])}</div></div>`;
  }

  _topology() {
    const inv = this._inv;
    const lang = this._lang;
    const nodes = [];
    const box = inv.box;
    if (box) {
      const online = this._online();
      const up = networkUptime(this._st(box.entities.uptime));
      const status = online === false ? [this._t("offline"), "bad"] : [up !== null ? this._t("online_since", { time: networkDuration(lang, up) }) : this._t("online"), "ok"];
      nodes.push(this._node(networkIcon("web"), this._t("internet"), status, online === false ? " globe down" : " globe"));
      const down = networkBits(this._st(box.entities.rate_down));
      const upr = networkBits(this._st(box.entities.rate_up));
      const rates = down !== null || upr !== null ? this._t("down_up", { down: networkRate(lang, down), up: networkRate(lang, upr) }) : box.model;
      nodes.push(this._node(`<img src="${networkEsc(networkBoxPicture(box))}" alt="">`, networkBoxModel(box)?.name || box.name, [rates]));
    }
    inv.switches.forEach((sw, i) => {
      const ports = this._switchPorts(sw);
      const active = ports.filter((p) => p.state === "up").length;
      nodes.push(this._node(networkChassisSvg(ports, `topo${i}`), sw.name, [ports.length ? this._t("ports_active", { n: ports.length, active }) : sw.model]));
    });
    const trackers = networkTrackers(this._hass.states);
    if (inv.routers.length || inv.wifi.length || trackers.length) {
      const home = trackers.filter((s) => s.state === "home").length;
      const wifiOn = inv.wifi.filter((id) => networkOn(this._st(id))).length;
      const status = inv.wifi.length ? this._t("wifi_on", { on: wifiOn, n: inv.wifi.length }) : inv.routers[0]?.name || "";
      nodes.push(this._node(`<img src="${networkEsc(networkRouterPicture(inv.routers[0]))}" alt="">`, this._t("wifi_devices", { n: home }), [status]));
    }
    if (!nodes.length) return "";
    return `<div class="topo">${nodes.join(NETWORK_CHEVRON)}</div>`;
  }

  _speedLast() {
    const sp = this._inv.speed;
    if (!sp) return null;
    return { down: networkBits(this._st(sp.entities.download)), up: networkBits(this._st(sp.entities.upload)), ping: networkValue(this._st(sp.entities.ping)) };
  }

  _speedCard() {
    const sp = this._inv.speed;
    if (!sp) return "";
    const lang = this._lang;
    const last = this._speedLast();
    const st = this._st(sp.entities.download);
    const factor = networkBits(st) !== null && networkValue(st) ? networkBits(st) / networkValue(st) : 1e6;
    const peaks = networkDailyPeaks(this._history?.download || [], 7).map((v) => (v === null ? null : v * factor));
    const max = Math.max(1, ...peaks.filter((v) => v !== null));
    const avg = peaks.filter((v) => v !== null).reduce((a, b, _i, arr) => a + b / arr.length, 0);
    const bars = peaks
      .map((v, i) => `<div class="${i === 6 ? "last" : v !== null && v < avg * 0.7 ? "low" : ""}" style="height:${v === null ? 0 : Math.max(3, Math.round((v / max) * 100))}%" title="${networkEsc(networkRate(lang, v))}"></div>`)
      .join("");
    const days = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString(lang, { weekday: "short" }));
    const line =
      last.down !== null
        ? `<b>${networkEsc(networkRate(lang, last.down))}</b> <span class="m">${last.ping !== null ? `· ${networkEsc(this._t("ping"))} ${networkEsc(networkNum(lang, last.ping, 0))} ms` : ""}</span>`
        : `<span class="m">${networkEsc(this._t("no_test"))}</span>`;
    return `<div class="c"><div class="h"><span>${networkEsc(this._t("speed_7d"))}</span><span class="s m">${networkEsc(sp.title)}</span></div><div class="bars">${bars}</div><div class="days">${days.map((d) => `<span>${networkEsc(d)}</span>`).join("")}</div><div class="r" style="margin-top:10px;font-size:12.5px"><span>${line}</span><button class="b" data-act="test" data-arg="${networkEsc(sp.entities.download || "")}">${networkEsc(this._t("run_test"))}</button></div></div>`;
  }

  /** The clock (a method, so the tests can set it). */
  _now() {
    return Date.now();
  }

  /** Each proxy host with its name (the rule domain), state, certificate expiry and expiring flag. */
  _proxyHosts() {
    const order = { bad: 0, warn: 1, ok: 2, idle: 3 };
    return (this._inv.proxy?.hosts || [])
      .map((h) => {
        const up = this._st(h.upstream);
        const cert = this._st(h.cert);
        const expiry = cert && !Number.isNaN(Date.parse(cert.state)) ? Date.parse(cert.state) : null;
        const expiring = this._st(h.expiring)?.state === "on" || (expiry !== null && expiry < this._now());
        const state = networkProxyHostState(h, up);
        const name = up?.attributes?.domain || cert?.attributes?.domain || h.name || String(h.id).replace(/_/g, ".");
        return { ...h, name, state, expiry, expiring, rank: state === "ok" && expiring ? order.warn : order[state] };
      })
      .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  }

  /** Counts for the proxy: hosts monitored and online, offline, certificates expiring, rules active. */
  _proxyCounts(hosts) {
    const sum = this._inv.proxy.summary || {};
    const val = (id) => networkValue(this._st(id));
    const monitored = hosts.filter((h) => h.state !== "idle");
    return {
      ok: monitored.filter((h) => h.state === "ok").length,
      monitored: monitored.length,
      bad: hosts.filter((h) => h.state === "bad").length,
      expiring: hosts.filter((h) => h.expiring).length,
      rules: val(sum.rules),
      active: val(sum.active),
      running: sum.running ? this._st(sum.running)?.state === "on" : null,
    };
  }

  _proxyKpis(c) {
    const kpi = (label, v, cls = "") => `<div class="t"><div class="s m">${networkEsc(this._t(label))}</div><b class="${cls}">${networkEsc(v)}</b></div>`;
    return [
      c.rules !== null ? kpi("rules_active", c.active !== null ? `${c.active} / ${c.rules}` : String(c.rules)) : "",
      kpi("hosts", this._t("hosts_ok", { ok: c.ok, n: c.monitored })),
      kpi("in_error", String(c.bad), c.bad ? "bad" : ""),
      kpi("certs_expiring", String(c.expiring), c.expiring ? "warn" : ""),
    ].join("");
  }

  _proxyPill(c) {
    if (c.running === null) return "";
    return `<span class="pill ${c.running ? "ok" : "bad"}"><span class="dot"></span>${networkEsc(this._t(c.running ? "proxy_running" : "proxy_stopped"))}</span>`;
  }

  _proxyCard() {
    const px = this._inv.proxy;
    if (!px) return "";
    const c = this._proxyCounts(this._proxyHosts());
    return `<div class="c"><div class="h"><span>${networkEsc(this._t("proxy"))}</span><span class="s m">${networkEsc(px.title)}</span></div><div class="kpis">${this._proxyKpis(c)}</div></div>`;
  }

  _wifiRow(id, withButton) {
    const st = this._st(id);
    const on = networkOn(st);
    const owner = [this._inv.box, ...this._inv.routers].find((d) => d?.wifi?.includes(id));
    const btn = withButton ? `<button class="b${on ? "" : " on"}" data-act="toggle" data-arg="${networkEsc(id)}" data-on="${on ? "0" : "1"}">${networkEsc(this._t(on ? "turn_off" : "turn_on"))}</button>` : "";
    return `<div class="wifi"><span class="d${on ? " on" : ""}"></span><div class="grow"><b>${networkEsc(networkName(st) || id)}</b><div class="s m">${networkEsc([owner?.name, this._t(on ? "state_on" : "state_off")].filter(Boolean).join(" · "))}</div></div>${btn}</div>`;
  }

  _wifiCard() {
    const wifi = this._inv.wifi;
    if (!wifi.length) return "";
    return `<div class="c"><div class="h"><span>${networkEsc(this._t("wifi_networks"))}</span></div><div class="list">${wifi.map((id) => this._wifiRow(id, false)).join("")}</div></div>`;
  }

  _devicesCard() {
    const trackers = networkTrackers(this._hass.states);
    if (!trackers.length) return "";
    const lang = this._lang;
    const home = trackers.filter((s) => s.state === "home");
    const latest = [...home].sort((a, b) => Date.parse(b.last_changed) - Date.parse(a.last_changed)).slice(0, 4);
    return `<div class="c"><div class="h"><span>${networkEsc(this._t("devices"))}</span></div><div class="kpis"><div class="t"><div class="s m">${networkEsc(this._t("connected"))}</div><b class="ok">${home.length}</b></div><div class="t"><div class="s m">${networkEsc(this._t("away"))}</div><b>${trackers.length - home.length}</b></div></div><div class="s m" style="margin:12px 0 6px">${networkEsc(this._t("latest"))}</div><div class="list">${latest
      .map((s) => `<div class="r"><span>${networkEsc(networkName(s))}</span><span class="s m">${networkEsc(networkAgo(lang, s.last_changed))}</span></div>`)
      .join("")}</div></div>`;
  }

  _dnsRing(ratio) {
    const r = 38;
    const len = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(100, ratio ?? 0));
    return `<svg class="ring" viewBox="0 0 92 92" role="img" aria-label="${networkEsc(this._t("ratio"))}"><circle class="bg" cx="46" cy="46" r="${r}" fill="none" stroke-width="10"/><circle class="fg" cx="46" cy="46" r="${r}" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="${((v / 100) * len).toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 46 46)"/><text x="46" y="52" text-anchor="middle">${networkEsc(networkNum(this._lang, v, 1))} %</text></svg>`;
  }

  _dnsProtected() {
    const dns = this._inv.dns;
    if (!dns?.switches.length) return null;
    return networkOn(this._st(dns.switches[0]));
  }

  _dnsCard() {
    const dns = this._inv.dns;
    if (!dns) return "";
    const lang = this._lang;
    const e = dns.entities;
    const q = networkValue(this._st(e.queries));
    const b = networkValue(this._st(e.blocked));
    const ratio = networkValue(this._st(e.ratio)) ?? (q ? ((b ?? 0) / q) * 100 : null);
    const prot = this._dnsProtected();
    const pill = prot === null ? "" : `<span class="pill ${prot ? "ok" : "warn"}">${networkEsc(this._t(prot ? "protection_on" : "protection_off"))}</span>`;
    return `<div class="c"><div class="dnsart">${NETWORK_DNS_ART}</div><div class="h"><span>${networkEsc(this._t("dns_filter"))}</span>${pill}</div><div class="dev">${this._dnsRing(ratio)}<div class="list"><span><b>${q === null ? "-" : networkEsc(networkNum(lang, q))}</b> ${networkEsc(this._t("queries"))}</span><span><b class="bad">${b === null ? "-" : networkEsc(networkNum(lang, b))}</b> ${networkEsc(this._t("blocked"))}</span><span class="s m">${networkEsc(dns.title)}</span></div></div></div>`;
  }

  // ----- Devices -----

  _tab_devices() {
    const lang = this._lang;
    const all = networkTrackers(this._hass.states);
    if (!all.length) return this._empty("no_devices");
    const showAway = this._inv.settings?.show_away !== false;
    const home = all.filter((s) => s.state === "home");
    const pool = showAway ? all : home;
    const filter = showAway ? this._filter : "home";
    const q = this._search.trim().toLowerCase();
    const rows = pool
      .filter((s) => filter === "all" || (filter === "home" ? s.state === "home" : s.state !== "home"))
      .filter((s) => !q || [networkName(s), s.attributes.ip, s.attributes.mac, s.attributes.host_name].some((v) => String(v || "").toLowerCase().includes(q)));
    const chip = (arg, label, n) => `<button class="b${filter === arg ? " on" : ""}" data-act="filter" data-arg="${arg}">${networkEsc(label)} · ${n}</button>`;
    const chips = showAway ? [chip("all", this._t("all"), all.length), chip("home", this._t("connected"), home.length), chip("away", this._t("away"), all.length - home.length)].join("") : "";
    const conn = (s) => {
      const a = s.attributes;
      if (a.essid || a.ssid) return a.essid || a.ssid;
      if (a.is_wired === true) return this._t("wired");
      return "-";
    };
    const shown = rows.slice(0, 200);
    const table = rows.length
      ? `<div class="scroll"><table><thead><tr><th>${networkEsc(this._t("col_name"))}</th><th>${networkEsc(this._t("col_ip"))}</th><th>${networkEsc(this._t("col_mac"))}</th><th>${networkEsc(this._t("col_conn"))}</th><th>${networkEsc(this._t("col_seen"))}</th></tr></thead><tbody>${shown
          .map(
            (s) =>
              `<tr><td><b>${networkEsc(networkName(s))}</b></td><td>${networkEsc(s.attributes.ip || "-")}</td><td class="m">${networkEsc(s.attributes.mac || "-")}</td><td>${networkEsc(conn(s))}</td><td class="${s.state === "home" ? "ok" : "m"}">${networkEsc(s.state === "home" ? this._t("online") : networkAgo(lang, s.last_changed))}</td></tr>`,
          )
          .join("")}</tbody></table></div>${rows.length > shown.length ? `<div class="s m" style="margin-top:10px">${networkEsc(this._t("more", { n: rows.length - shown.length }))}</div>` : ""}`
      : `<div class="empty">${networkEsc(this._t("no_match"))}</div>`;
    return `<div class="r"><div class="chips">${chips}</div><input class="search" type="search" data-act="search" placeholder="${networkEsc(this._t("search"))}" aria-label="${networkEsc(this._t("search"))}" value="${networkEsc(this._search)}"></div><div class="c">${table}</div>`;
  }

  // ----- Wi-Fi -----

  _routerRow(r) {
    const clients = networkValue(this._st(r.entities.clients));
    const temp = this._st(r.entities.temperature);
    const extra = [r.model, clients !== null ? this._t("clients_n", { n: networkNum(this._lang, clients) }) : "", temp && networkValue(temp) !== null ? `${networkNum(this._lang, networkValue(temp), 0)} °C` : ""]
      .filter(Boolean)
      .join(" · ");
    return `<div class="dev t"><div class="pic"><img src="${networkEsc(networkRouterPicture(r))}" alt=""></div><div class="grow"><b>${networkEsc(r.name)}</b><div class="s m">${networkEsc(extra)}</div></div>${networkHttp(r.url) ? `<a class="b" href="${networkEsc(r.url)}" target="_blank" rel="noopener">${networkEsc(this._t("open_admin"))}</a>` : ""}</div>`;
  }

  _tab_wifi() {
    const inv = this._inv;
    const wifi = inv.wifi.length ? `<div class="list">${inv.wifi.map((id) => this._wifiRow(id, true)).join("")}</div>` : `<div class="empty">${networkEsc(this._t("empty_wifi"))}</div>`;
    const routers = inv.routers.length ? `<div class="c"><div class="h"><span>${networkEsc(this._t("access_points"))}</span></div><div class="list">${inv.routers.map((r) => this._routerRow(r)).join("")}</div></div>` : "";
    const switches = inv.switches.length
      ? inv.switches
          .map((sw, i) => {
            const ports = this._switchPorts(sw);
            const active = ports.filter((p) => p.state === "up").length;
            return `<div class="c swc"><div class="h"><span>${networkEsc(sw.name)}</span><span class="s m">${networkEsc(sw.model)}</span></div>${networkChassisSvg(ports, `tab${i}`)}<div class="s m">${networkEsc(ports.length ? this._t("ports_active", { n: ports.length, active }) : "")}</div></div>`;
          })
          .join("")
      : `<div class="c empty">${networkEsc(this._t("empty_switches"))}</div>`;
    return `<div class="grid2"><div class="col"><div class="c"><div class="h"><span>${networkEsc(this._t("wifi_networks"))}</span></div>${wifi}</div>${routers}</div><div class="col"><div class="h" style="margin:0">${networkEsc(this._t("switches"))}</div>${switches}</div></div>`;
  }

  // ----- DNS -----

  _tab_dns() {
    const dns = this._inv.dns;
    const lang = this._lang;
    const e = dns.entities;
    const val = (id) => networkValue(this._st(id));
    const q = val(e.queries);
    const b = val(e.blocked);
    const ratio = val(e.ratio) ?? (q ? ((b ?? 0) / q) * 100 : null);
    const speed = val(e.speed);
    const kpi = (label, v, cls = "") => `<div class="t"><div class="s m">${networkEsc(this._t(label))}</div><b class="${cls}">${networkEsc(v)}</b></div>`;
    const kpis = [
      kpi("queries", q === null ? "-" : networkNum(lang, q)),
      kpi("blocked", b === null ? "-" : networkNum(lang, b), "bad"),
      kpi("ratio", ratio === null ? "-" : `${networkNum(lang, ratio, 1)} %`),
      kpi("avg_time", speed === null ? "-" : `${networkNum(lang, speed, speed < 10 ? 1 : 0)} ms`),
    ].join("");
    const switches = dns.switches.length
      ? dns.switches.map((id) => this._wifiRow(id, true)).join("")
      : `<div class="empty">-</div>`;
    return `<div class="grid2"><div class="c"><div class="dnsart">${NETWORK_DNS_ART}</div><div class="h"><span>${networkEsc(this._t("dns_filter"))}</span><span class="s m">${networkEsc(dns.title)}</span></div><div class="dev">${this._dnsRing(ratio)}<div class="kpis" style="flex:1">${kpis}</div></div></div><div class="c"><div class="h"><span>${networkEsc(this._t("protections"))}</span></div><div class="list">${switches}</div></div></div>`;
  }

  // ----- Speed -----

  _chart(series) {
    const W = 600;
    const H = 180;
    const pts = series.flatMap((s) => s.points);
    if (!pts.length) return `<div class="empty">${networkEsc(this._t("no_test"))}</div>`;
    const t0 = Date.now() - 30 * 86400000;
    const t1 = Date.now();
    const max = Math.max(1, ...pts.map((p) => p.v));
    const x = (t) => (((t - t0) / (t1 - t0)) * W).toFixed(1);
    const y = (v) => (H - 10 - (v / max) * (H - 20)).toFixed(1);
    const grid = [0.25, 0.5, 0.75].map((f) => `<path class="grid" d="M0 ${(H - 10 - f * (H - 20)).toFixed(1)}H${W}"/>`).join("");
    const lines = series.map((s) => (s.points.length ? `<path class="${s.cls}" d="M${s.points.map((p) => `${x(p.t)} ${y(p.v)}`).join("L")}"/>` : "")).join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${grid}${lines}</svg>`;
  }

  _tab_speed() {
    const sp = this._inv.speed;
    const lang = this._lang;
    const last = this._speedLast();
    const st = this._st(sp.entities.download);
    const kpi = (label, v) => `<div class="t"><div class="s m">${networkEsc(this._t(label))}</div><b>${networkEsc(v)}</b></div>`;
    const box = this._inv.box;
    const now = box
      ? `<div class="c"><div class="h"><span>${networkEsc(this._t("right_now"))}</span><span class="s m">${networkEsc(box.name)}</span></div><div class="list"><div class="r"><span>${networkEsc(this._t("download"))}</span><b>${networkEsc(networkRate(lang, networkBits(this._st(box.entities.rate_down))))}</b></div><div class="r"><span>${networkEsc(this._t("upload"))}</span><b>${networkEsc(networkRate(lang, networkBits(this._st(box.entities.rate_up))))}</b></div>${
          box.entities.ip && this._st(box.entities.ip) ? `<div class="r"><span>${networkEsc(this._t("external_ip"))}</span><b>${networkEsc(this._st(box.entities.ip).state)}</b></div>` : ""
        }</div></div>`
      : "";
    const chart = this._chart([
      { cls: "dn", points: this._history?.download || [] },
      { cls: "up", points: this._history?.upload || [] },
    ]);
    return `<div class="c"><div class="h"><span>${networkEsc(this._t("speed_30d", { name: sp.title }))}</span><div class="legend"><span><i style="background:var(--nw-ok)"></i>${networkEsc(this._t("download"))}</span><span><i style="background:var(--nw-accent)"></i>${networkEsc(this._t("upload"))}</span></div></div>${chart}</div><div class="grid2"><div class="c"><div class="h"><span>${networkEsc(this._t("last_test"))}</span><span class="s m">${st ? networkEsc(networkAgo(lang, st.last_changed)) : ""}</span></div><div class="kpis">${kpi("download", networkRate(lang, last.down))}${kpi("upload", networkRate(lang, last.up))}${kpi("ping", last.ping === null ? "-" : `${networkNum(lang, last.ping, 0)} ms`)}</div><div style="margin-top:12px"><button class="b" data-act="test" data-arg="${networkEsc(sp.entities.download || "")}">${networkEsc(this._t("run_test"))}</button></div></div>${now}</div>`;
  }

  // ----- Proxy -----

  _tab_proxy() {
    const px = this._inv.proxy;
    const lang = this._lang;
    const hosts = this._proxyHosts();
    const c = this._proxyCounts(hosts);
    const title = px.title && px.title.toLowerCase() !== this._t("proxy").toLowerCase() ? `<span class="s m"> · ${networkEsc(px.title)}</span>` : "";
    const head = `<div class="c"><div class="h"><span>${networkEsc(this._t("proxy"))}${title}</span>${this._proxyPill(c)}</div><div class="kpis">${this._proxyKpis(c)}</div></div>`;
    if (!hosts.length) return `${head}${this._empty("empty_proxy")}`;
    const rel = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    const rows = hosts
      .map((h) => {
        const days = h.expiry !== null ? Math.round((h.expiry - this._now()) / 86400000) : null;
        const cert =
          days === null ? "" : days < 0 ? this._t("cert_expired") : this._t("cert_expires", { when: rel.format(days, "day") });
        const label = this._t(h.state === "bad" ? "offline" : h.state === "ok" ? "online" : "not_checked");
        const cls = h.state === "bad" ? "bad" : h.state === "ok" ? (h.expiring ? "warn" : "ok") : "idle";
        const link = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(h.name) ? ` href="https://${networkEsc(h.name)}" target="_blank" rel="noopener noreferrer"` : "";
        return `<div class="wifi host"><span class="d ${cls}"></span><div class="grow"><b>${link ? `<a${link}>${networkEsc(h.name)}</a>` : networkEsc(h.name)}</b><div class="s ${h.expiring ? "warn" : "m"}">${networkEsc(cert || "\u00a0")}</div></div><span class="s ${h.state === "bad" ? "bad" : h.state === "ok" ? "ok" : "m"}" style="font-weight:600">${networkEsc(label)}</span></div>`;
      })
      .join("");
    return `${head}<div class="c"><div class="h"><span>${networkEsc(this._t("hosts"))}</span><span class="s m">${hosts.length}</span></div><div class="hosts">${rows}</div></div>`;
  }

  // ----- Settings -----

  _tab_settings() {
    const inv = this._inv;
    const set = inv.settings || {};
    const sources = inv.sources.length
      ? inv.sources
          .map((s) => {
            const ok = s.state === "loaded";
            return `<div class="r"><span>${networkEsc(NETWORK_SOURCE_NAMES[s.platform] || s.platform)} <span class="s m">· ${networkEsc(s.title)}</span></span><span class="pill ${ok ? "ok" : "warn"}">${networkEsc(this._t(ok ? "loaded" : "not_loaded"))}</span></div>`;
          })
          .join("")
      : `<div class="empty">${networkEsc(this._t("nothing"))}</div>`;
    const box = (key, label) => `<label class="set"><input type="checkbox" data-act="setting" data-arg="${key}"${set[key] !== false ? " checked" : ""}> ${networkEsc(this._t(label))}</label>`;
    return `<div class="grid2"><div class="c"><div class="h"><span>${networkEsc(this._t("sources"))}</span></div><div class="list">${sources}</div><div class="s m" style="margin:14px 0 10px">${networkEsc(this._t("sources_hint"))}</div><button class="b" data-act="options">${networkEsc(this._t("options"))}</button></div><div class="c"><div class="h"><span>${networkEsc(this._t("display"))}</span></div>${box("show_away", "set_show_away")}${box("confirm_actions", "set_confirm")}<div class="s m" style="margin-top:12px">v${networkEsc(NETWORK_PANEL_VERSION)}</div></div></div>`;
  }
}

if (!customElements.get("network-panel")) customElements.define("network-panel", NetworkPanel);
