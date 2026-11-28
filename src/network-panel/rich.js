// The tabs at the level of the cards (ha-internet-box-card, ha-router-card, ha-switch-card, ha-dns-filter-card,
// ha-speedtest-card and the Reverse Proxy card), added to the panel's class: the overview drawn as a plan with what
// needs attention, the Internet tab (the box), the switches and access points, DNS, speed and proxy with their
// controls. Every value read from a state goes through networkEsc; the curves are the last 24 hours (recorder).
import { networkAgo, networkBits, networkDuration, networkEsc, networkNum, networkOn, networkRate, networkUptime, networkValue } from "./core.js";
import { networkBoxModel, networkBoxPicture, networkRouterPicture } from "./models.js";
import { NETWORK_DNS_ART } from "./dns-art.js";
import { NetworkPanel, networkHttp, networkIcon, networkName, networkTrackers } from "./panel.js";
import { networkChassisSvg } from "./switch.js";

/** A sparkline of the last 24 hours behind a tile, scaled on `max` (else the series' own maximum). */
export const networkSpark = (points, max = null, end = Date.now()) => {
  const start = end - 86400000;
  const pts = (points || []).filter((p) => p.t >= start);
  if (pts.length < 2) return "";
  const top = max ?? Math.max(...pts.map((p) => p.v), 1);
  const x = (t) => (((t - start) / 86400000) * 100).toFixed(2);
  const y = (v) => (38 - (Math.min(v, top) / top) * 34).toFixed(2);
  const line = pts.map((p) => `${x(p.t)},${y(p.v)}`).join(" ");
  const last = y(pts[pts.length - 1].v);
  return `<svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><polygon points="${x(pts[0].t)},40 ${line} 100,${last} 100,40"/><polyline points="${line} 100,${last}"/></svg>`;
};

/** Who is on which Wi-Fi: the guest networks by their name, the wired by the tracker's own flag. */
export const networkLinkOf = (st) => {
  const a = st?.attributes || {};
  const ssid = a.essid || a.ssid || "";
  if (a.is_guest === true || /guest|invit|gast|ospit/i.test(ssid)) return "guest";
  if (a.is_wired === true || (!ssid && a.is_wired !== false && (a.sw_mac || a.sw_port))) return "wired";
  return ssid || a.is_wired === false ? "wifi" : "wired";
};

const NETWORK_LEVEL = (v, warn, crit) => (v === null ? "" : v >= crit ? "bad" : v >= warn ? "warn" : "");

Object.assign(NetworkPanel.prototype, {
  // ----- shared -----

  /** A tile with its value and label, the last 24 hours behind it; a click opens the entity's more-info. */
  _gauge(id, label, value, cls = "", max = null, sub = "") {
    const curve = networkSpark(this._hist?.[id], max, this._now());
    return `<button class="g ${cls}" data-act="more" data-arg="${networkEsc(id || "")}"${id ? "" : " disabled"}>${curve}<span class="gl">${networkEsc(label)}</span><b>${networkEsc(value)}</b>${sub ? `<span class="gl">${networkEsc(sub)}</span>` : ""}</button>`;
  },

  /** A button: a button press, an update install, a switch turned on or off, a rule toggled — confirmed when it cuts. */
  _actBtn(act, arg, label, cls = "", extra = "") {
    return arg ? `<button class="b ${cls}" data-act="${act}" data-arg="${networkEsc(arg)}"${extra}>${networkEsc(label)}</button>` : "";
  },

  _toggleSw(id, name) {
    const st = this._st(id);
    if (!st) return "";
    const on = networkOn(st);
    const off = st.state === "unavailable";
    return `<button class="tg${on ? " on" : ""}" role="switch" aria-checked="${on}" aria-label="${networkEsc(name || networkName(st))}" data-act="toggle" data-arg="${networkEsc(id)}" data-on="${on ? "0" : "1"}"${off ? " disabled" : ""}></button>`;
  },

  /** The named port down by its name, several by their count. */
  _watchedLabel(ports, n) {
    if (!n) return this._t("healthy");
    return n === 1 ? this._t("port_down", { port: ports.find((p) => p.state === "down" && p.watched).title }) : this._t("watched_down", { n });
  },

  _chip(text, cls = "") {
    return text ? `<span class="chip ${cls}">${networkEsc(text)}</span>` : "";
  },

  /** A state as text, empty when unknown or unavailable. */
  _text(id) {
    const v = this._st(id)?.state;
    return v && v !== "unknown" && v !== "unavailable" ? v : "";
  },

  _rate(id) {
    return networkBits(this._st(id));
  },

  /** The entities whose last 24 hours the tiles draw. */
  _histIds() {
    const inv = this._inv;
    const ids = [];
    const e = (o, ...k) => k.map((x) => o?.entities?.[x]).filter(Boolean);
    if (inv.box) ids.push(...e(inv.box, "rate_down", "rate_up", "cpu", "ram"), ...(inv.box.temps || []).slice(0, 3));
    for (const r of inv.routers) ids.push(...e(r, "cpu", "ram", "temperature", "rate_down", "rate_up"));
    for (const sw of inv.switches) ids.push(...e(sw, "rate_down", "rate_up", "rx_total", "tx_total"));
    if (inv.dns) ids.push(...["queries", "blocked", "ratio", "speed"].map((k) => inv.dns.entities[k]).filter(Boolean));
    return [...new Set(ids.filter((id) => this._st(id)))];
  },

  /** The last 24 hours of the tiles' entities, read again every 10 minutes. */
  async _fetch24() {
    const ids = this._histIds();
    const key = ids.join(",");
    if (!ids.length || (key === this._h24Key && Date.now() - (this._h24At || 0) < 600000)) return;
    this._h24Key = key;
    this._h24At = Date.now();
    try {
      const end = new Date();
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: new Date(end.getTime() - 86400000).toISOString(),
        end_time: end.toISOString(),
        entity_ids: ids,
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: false,
      });
      const hist = {};
      for (const id of ids)
        hist[id] = (res?.[id] || []).map((p) => ({ t: (p.lu ?? p.lc ?? 0) * 1000, v: Number.parseFloat(p.s) })).filter((p) => Number.isFinite(p.v) && p.t);
      this._hist = hist;
      this._render(true);
    } catch (_err) {
      // No recorder: the tiles stay without their curve
    }
  },

  // ----- Overview -----

  _pnode(pic, name, lines, cls, chip, tab) {
    return `<button class="pnode" data-act="tab" data-arg="${tab}"><span class="ppic">${pic}</span><b>${networkEsc(name)}</b>${lines
      .filter(Boolean)
      .map((l) => `<span class="pl">${networkEsc(l)}</span>`)
      .join("")}<span class="chip ${cls}">${networkEsc(chip)}</span></button>`;
  },

  _plan() {
    const inv = this._inv;
    const lang = this._lang;
    const nodes = [];
    const box = inv.box;
    if (box) {
      const online = this._online();
      const up = networkUptime(this._st(box.entities.uptime), this._now());
      const ip = this._text(box.entities.ip);
      const conn = this._text(box.entities.connection);
      nodes.push(this._pnode(`<span class="globe${online === false ? " down" : ""}">${networkIcon("web")}</span>`, this._t("internet"), [[conn.toUpperCase(), ip].filter(Boolean).join(" · "), up !== null ? this._t("online_since", { time: networkDuration(lang, up) }) : ""], online === false ? "bad" : "ok", this._t(online === false ? "offline" : "online"), "internet"));
      const temp = networkValue(this._st(box.entities.temperature ?? box.temps?.[0]));
      const wifiOn = box.wifi.some((id) => networkOn(this._st(id)));
      nodes.push(this._pnode(`<img src="${networkEsc(networkBoxPicture(box))}" alt="">`, networkBoxModel(box)?.name || box.name, [this._t("down_up", { down: networkRate(lang, this._rate(box.entities.rate_down)), up: networkRate(lang, this._rate(box.entities.rate_up)) }), [temp !== null ? `${networkNum(lang, temp, 0)} °C` : "", box.wifi.length ? `${this._t("wifi")} ${this._t(wifiOn ? "state_on" : "state_off")}` : ""].filter(Boolean).join(" · ")], online === false ? "bad" : "ok", this._t(online === false ? "offline" : "healthy"), "internet"));
    }
    inv.switches.forEach((sw, i) => {
      const ports = this._switchPorts(sw);
      const active = ports.filter((p) => p.state === "up").length;
      const watched = ports.filter((p) => p.state === "down" && p.watched).length;
      nodes.push(this._pnode(`<span class="psw">${networkChassisSvg(ports, `plan${i}`)}</span>`, sw.name, [ports.length ? this._t("ports_active", { n: ports.length, active }) : sw.model, this._rate(sw.entities.rate_down) !== null ? `↓ ${networkRate(lang, this._rate(sw.entities.rate_down))}` : ""], watched ? "warn" : "ok", this._watchedLabel(ports, watched), "wifi"));
    });
    for (const r of inv.routers) {
      const clients = networkValue(this._st(r.entities.clients));
      const upd = this._st(r.entities.update)?.state === "on";
      nodes.push(this._pnode(`<img src="${networkEsc(networkRouterPicture(r))}" alt="">`, r.name, [clients !== null ? this._t("clients_n", { n: networkNum(lang, clients) }) : r.model, r.sw_version ? `${this._t("firmware")} ${r.sw_version}` : ""], upd ? "warn" : "ok", upd ? this._t("update_available") : this._t("healthy"), "wifi"));
    }
    return nodes.length ? `<div class="c plan"><div class="pnodes">${nodes.join('<span class="plink" aria-hidden="true"></span>')}</div></div>` : "";
  },

  /** What needs attention, the worst first, each with its action. */
  _attention() {
    const inv = this._inv;
    const out = [];
    const online = this._online();
    if (online === false) out.push(["bad", `<b>${networkEsc(this._t("internet"))}</b> · ${networkEsc(this._t("offline"))}`, ""]);
    for (const sw of inv.switches)
      for (const p of this._switchPorts(sw).filter((x) => x.state === "down" && x.watched))
        out.push(["bad", `<b>${networkEsc(sw.name)}</b> · ${networkEsc(this._t("port_down", { port: p.title }))}`, ""]);
    for (const h of this._inv.proxy ? this._proxyHosts() : []) {
      if (h.state === "bad") out.push(["bad", `<b>${networkEsc(h.name)}</b> · ${networkEsc(this._t("upstream_down"))}`, ""]);
      else if (h.expiring) out.push(["warn", `<b>${networkEsc(h.name)}</b> · ${networkEsc(this._t("cert_soon"))}`, this._actBtn("press", h.renew, this._t("renew"), "on")]);
    }
    for (const d of [inv.box, ...inv.routers, ...inv.switches].filter(Boolean)) {
      const u = this._st(d.entities.update);
      if (u?.state === "on") out.push(["warn", `<b>${networkEsc(d.name)}</b> · ${networkEsc(this._t("firmware_update", { v: u.attributes?.latest_version || "" }))}`, this._actBtn("install", u.entity_id, this._t("install"), "warn")]);
    }
    for (const id of inv.dns?.updates || []) {
      const u = this._st(id);
      if (u?.state === "on") out.push(["warn", `<b>${networkEsc(inv.dns.title)}</b> · ${networkEsc(this._t("firmware_update", { v: u.attributes?.latest_version || "" }))}`, this._actBtn("install", id, this._t("install"), "warn")]);
    }
    const missed = inv.box ? networkValue(this._st(inv.box.entities.missed_calls)) : null;
    if (missed) out.push(["warn", `<b>${networkEsc(this._t("missed_n", { n: missed }))}</b>`, this._actBtn("press", inv.box.entities.mark_calls, this._t("mark_read"), "on")]);
    if (this._dnsProtected() === false) out.push(["warn", `<b>${networkEsc(inv.dns.title)}</b> · ${networkEsc(this._t("protection_off"))}`, this._actBtn("toggle", inv.dns.switches[0], this._t("turn_on"), "on", ' data-on="1"')]);
    return out.sort((a, b) => (a[0] === b[0] ? 0 : a[0] === "bad" ? -1 : 1));
  },

  _tab_overview() {
    const inv = this._inv;
    const lang = this._lang;
    const nothing = !inv.box && !inv.routers.length && !inv.switches.length && !inv.dns && !inv.speed && !inv.proxy && !networkTrackers(this._hass.states).length;
    if (nothing) return `<div class="c empty">${networkEsc(this._t("nothing"))}<br><br><button class="b" data-act="integrations">${networkEsc(this._t("open_integrations"))}</button></div>`;
    this._fetch24();
    const att = this._attention();
    const attention = `<div class="c"><div class="h"><span>${networkEsc(this._t("needs_attention"))}</span><span class="s m">${att.length || ""}</span></div><div class="list">${
      att.length ? att.map(([cls, text, btn]) => `<div class="arow ${cls}"><span class="d ${cls}"></span><span class="grow">${text}</span>${btn}</div>`).join("") : `<div class="arow"><span class="d ok"></span><span class="grow">${networkEsc(this._t("all_good"))}</span></div>`
    }</div></div>`;
    const tiles = [];
    if (inv.box) {
      tiles.push(this._gauge(inv.box.entities.rate_down, `${this._t("internet")} ↓`, networkRate(lang, this._rate(inv.box.entities.rate_down))));
      tiles.push(this._gauge(inv.box.entities.rate_up, `${this._t("internet")} ↑`, networkRate(lang, this._rate(inv.box.entities.rate_up))));
    }
    if (inv.dns) {
      const q = networkValue(this._st(inv.dns.entities.queries));
      const r = networkValue(this._st(inv.dns.entities.ratio));
      if (q !== null) tiles.push(this._gauge(inv.dns.entities.queries, this._t("queries"), networkNum(lang, q)));
      if (r !== null) tiles.push(this._gauge(inv.dns.entities.ratio, this._t("ratio"), `${networkNum(lang, r, 1)} %`, "", 100));
    }
    for (const sw of inv.switches) if (this._rate(sw.entities.rate_down) !== null) tiles.push(this._gauge(sw.entities.rate_down, `${sw.name} ↓`, networkRate(lang, this._rate(sw.entities.rate_down))));
    const last = this._speedLast();
    if (last && last.down !== null) tiles.push(this._gauge(inv.speed.entities.download, this._t("last_test"), networkRate(lang, last.down), "", null, last.ping !== null ? `${this._t("ping")} ${networkNum(lang, last.ping, 0)} ms` : ""));
    const traffic = tiles.length ? `<div class="c"><div class="h"><span>${networkEsc(this._t("traffic"))}</span><span class="s m">${networkEsc(this._t("last_24h"))}</span></div><div class="gs">${tiles.join("")}</div></div>` : "";
    return `${this._plan()}<div class="ovgrid"><div class="col">${attention}${traffic}</div><div class="col">${this._devicesCard()}${this._servicesCard()}</div></div>`;
  },

  /** Devices: connected and away, the wired / Wi-Fi / guest split and the latest arrivals. */
  _devicesCard() {
    const trackers = networkTrackers(this._hass.states);
    if (!trackers.length) return "";
    const lang = this._lang;
    const home = trackers.filter((s) => s.state === "home");
    const split = { wired: 0, wifi: 0, guest: 0 };
    for (const s of home) split[networkLinkOf(s)]++;
    const latest = [...home].sort((a, b) => Date.parse(b.last_changed) - Date.parse(a.last_changed)).slice(0, 3);
    const t = (label, n) => `<div class="t"><div class="s m">${networkEsc(this._t(label))}</div><b>${n}</b></div>`;
    return `<div class="c"><div class="h"><span>${networkEsc(this._t("devices"))}</span><span class="s m">${networkEsc(this._t("connected_away", { home: home.length, away: trackers.length - home.length }))}</span></div><div class="kpis k3">${t("wired", split.wired)}${t("wifi", split.wifi)}${t("guest", split.guest)}</div><div class="s m sect">${networkEsc(this._t("latest"))}</div><div class="list">${latest
      .map((s) => `<div class="arow"><span class="d ok"></span><span class="grow">${networkEsc(networkName(s))}<span class="s m"> · ${networkEsc(s.attributes.essid || s.attributes.ssid || this._t(networkLinkOf(s)))}</span></span><span class="s m">${networkEsc(networkAgo(lang, s.last_changed))}</span></div>`)
      .join("")}</div></div>`;
  },

  /** DNS filtering, the proxy and the Wi-Fi in a line each. */
  _servicesCard() {
    const inv = this._inv;
    const lang = this._lang;
    const rows = [];
    if (inv.dns) {
      const prot = this._dnsProtected();
      const q = networkValue(this._st(inv.dns.entities.queries));
      const r = networkValue(this._st(inv.dns.entities.ratio));
      rows.push([prot === false ? "warn" : "ok", `<b>${networkEsc(inv.dns.title)}</b> · ${networkEsc(this._t(prot === false ? "protection_off" : "protection_on"))}`, [q !== null ? networkNum(lang, q) : "", r !== null ? `${networkNum(lang, r, 0)} %` : ""].filter(Boolean).join(" · "), "dns"]);
    }
    if (inv.proxy) {
      const c = this._proxyCounts(this._proxyHosts());
      rows.push([c.bad ? "bad" : "ok", `<b>${networkEsc(inv.proxy.title)}</b> · ${networkEsc(this._t("hosts_ok", { ok: c.ok, n: c.monitored }))}`, c.bad ? this._t("down_n", { n: c.bad }) : "", "proxy"]);
    }
    if (inv.wifi.length) {
      const on = inv.wifi.filter((id) => networkOn(this._st(id)));
      rows.push(["ok", `<b>${networkEsc(this._t("wifi"))}</b> · ${networkEsc(inv.wifi.map((id) => `${networkName(this._st(id))} ${this._t(networkOn(this._st(id)) ? "state_on" : "state_off")}`).join(", "))}`, `${on.length} / ${inv.wifi.length}`, "wifi"]);
    }
    if (inv.speed) {
      const last = this._speedLast();
      rows.push(["ok", `<b>${networkEsc(inv.speed.title)}</b> · ${networkEsc(last.down !== null ? networkRate(lang, last.down) : this._t("no_test"))}`, last.ping !== null ? `${networkNum(lang, last.ping, 0)} ms` : "", "speed"]);
    }
    if (!rows.length) return "";
    return `<div class="c"><div class="h"><span>${networkEsc(this._t("services"))}</span></div><div class="list">${rows
      .map(([cls, text, end, tab]) => `<button class="arow ${cls === "ok" ? "" : cls}" data-act="tab" data-arg="${tab}"><span class="d ${cls}"></span><span class="grow">${text}</span><span class="s ${cls === "bad" ? "bad" : "m"}">${networkEsc(end)}</span></button>`)
      .join("")}</div></div>`;
  },

  // ----- Internet (the box) -----

  _tab_internet() {
    const box = this._inv.box;
    const lang = this._lang;
    const e = box.entities;
    this._fetch24();
    const online = this._online();
    const up = networkUptime(this._st(e.uptime), this._now());
    const conn = this._text(e.connection);
    const ip = this._text(e.ip);
    const missed = networkValue(this._st(e.missed_calls));
    const model = networkBoxModel(box);
    const facts = [
      `<span class="pill ${online === false ? "bad" : "ok"}"><span class="dot"></span>${networkEsc(this._t(online === false ? "offline" : "online"))}</span>`,
      conn ? this._chip(conn.toUpperCase()) : "",
      ip ? this._chip(ip) : "",
      up !== null ? this._chip(this._t("online_since", { time: networkDuration(lang, up) })) : "",
      missed ? this._chip(this._t("missed_n", { n: missed }), "warn") : "",
      this._st(e.update)?.state === "on" ? this._chip(this._t("update_available"), "warn") : "",
    ].join("");
    const pic = `<img src="${networkEsc(networkBoxPicture(box))}" alt="">`;
    const head = `<div class="dhead"><div class="dpic">${networkHttp(box.url) ? `<a href="${networkEsc(box.url)}" target="_blank" rel="noopener noreferrer">${pic}</a>` : pic}</div><div class="grow"><div class="dname">${networkEsc(model?.name || box.name)}<span class="s m">${networkEsc([box.manufacturer, box.sw_version ? `${this._t("firmware")} ${box.sw_version}` : ""].filter(Boolean).join(" · "))}</span></div><div class="chips">${facts}</div></div>${this._actBtn("press", e.reboot, this._t("restart"), "on", ' data-ask="1"')}</div>`;
    const tiles = [this._gauge(e.rate_down, `↓ ${this._t("download")}`, networkRate(lang, this._rate(e.rate_down))), this._gauge(e.rate_up, `↑ ${this._t("upload")}`, networkRate(lang, this._rate(e.rate_up)))];
    const last = this._speedLast();
    if (last && last.down !== null) tiles.push(this._gauge(this._inv.speed.entities.download, this._t("last_test"), `${networkRate(lang, last.down)}${last.up !== null ? ` / ${networkRate(lang, last.up)}` : ""}`, "", null, last.ping !== null ? `${this._t("ping")} ${networkNum(lang, last.ping, 0)} ms` : ""));
    for (const id of box.temps || []) {
      const v = networkValue(this._st(id));
      if (v !== null) tiles.push(this._gauge(id, networkName(this._st(id)).replace(box.name, "").trim() || this._t("temperature"), `${networkNum(lang, v, 0)} °C`, NETWORK_LEVEL(v, 65, 80), 100));
    }
    for (const id of box.fans || []) {
      const v = networkValue(this._st(id));
      if (v !== null) tiles.push(this._gauge(id, networkName(this._st(id)).replace(box.name, "").trim() || this._t("fan"), `${networkNum(lang, v)} ${this._st(id)?.attributes?.unit_of_measurement || "rpm"}`));
    }
    const services = [];
    if (box.wifi.length) services.push(`<div class="arow"><span class="grow"><b>${networkEsc(this._t("wifi"))}</b> · ${networkEsc(box.wifi.map((id) => networkName(this._st(id))).join(", "))}</span>${box.wifi.map((id) => this._toggleSw(id)).join("")}</div>`);
    if (e.missed_calls) services.push(`<div class="arow ${missed ? "warn" : ""}"><span class="grow"><b>${networkEsc(this._t("missed_calls"))}</b> · ${networkEsc(networkNum(lang, missed ?? 0))}</span>${missed ? this._actBtn("press", e.mark_calls, this._t("mark_read"), "on") : ""}</div>`);
    const clients = networkValue(this._st(e.clients)) ?? networkTrackers(this._hass.states).filter((s) => s.state === "home").length;
    services.push(`<div class="arow"><span class="grow"><b>${networkEsc(this._t("connected_devices"))}</b></span><b>${networkEsc(networkNum(lang, clients))}</b></div>`);
    const disk = this._st(e.disk);
    const storage = disk
      ? `<div><div class="s m sect">${networkEsc(this._t("storage"))}</div><div class="list"><button class="arow" data-act="more" data-arg="${networkEsc(e.disk)}" style="display:block;text-align:left"><div class="r"><b>${networkEsc(networkName(disk).replace(box.name, "").trim() || this._t("storage"))}</b><span class="s m">${networkEsc(`${disk.state} ${disk.attributes?.unit_of_measurement || ""}`)}</span></div>${disk.attributes?.unit_of_measurement === "%" ? `<div class="bar"><i style="width:${Math.min(100, Number(disk.state) || 0)}%"></i></div>` : ""}</button></div></div>`
      : "";
    return `<div class="c">${head}<div class="gs">${tiles.join("")}</div><div class="grid2" style="margin-top:4px"><div><div class="s m sect">${networkEsc(this._t("services"))}</div><div class="list">${services.join("")}</div></div>${storage}</div></div>`;
  },

  // ----- Wi-Fi & switches -----

  _switchCard(sw, i) {
    const lang = this._lang;
    const e = sw.entities;
    const ports = this._switchPorts(sw);
    const active = ports.filter((p) => p.state === "up").length;
    const watched = ports.filter((p) => p.state === "down" && p.watched).length;
    const up = networkUptime(this._st(e.uptime), this._now());
    // The ports the user named, with their number and state
    const named = ports.filter((p) => p.watched);
    const names = named.length ? `<div class="chips pnames">${named.map((p) => this._chip(`${p.label} · ${p.title}`, p.state === "up" ? "ok" : p.state === "down" ? "bad" : "")).join("")}</div>` : "";
    const tiles = [
      `<div class="g ${watched ? "warn" : ""}"><span class="gl">${networkEsc(this._t("ports_up"))}</span><b>${ports.length ? `${active} / ${ports.length}` : "—"}</b>${watched ? `<span class="gl">${networkEsc(this._watchedLabel(ports, watched))}</span>` : ""}</div>`,
      this._traffic(e.rate_down, e.rx_total, `↓ ${this._t("received")}`),
      this._traffic(e.rate_up, e.tx_total, `↑ ${this._t("sent")}`),
    ].join("");
    const power = this._st(e.power) ? `<div class="r" style="margin-top:10px"><span class="s m">${networkEsc(this._t("power"))}</span>${this._toggleSw(e.power, sw.name)}</div>` : "";
    return `<div class="c swc"><div class="h"><span>${networkEsc(sw.name)}</span><span class="s m">${networkEsc([sw.model, up !== null ? this._t("online_since", { time: networkDuration(lang, up) }) : ""].filter(Boolean).join(" · "))}</span></div>${networkChassisSvg(ports, `tab${i}`)}${names}<div class="gs">${tiles}</div>${power}</div>`;
  },

  /** A switch's traffic: its rate, else its byte counter; nothing when neither reads. */
  _traffic(rate, total, label) {
    const bits = this._rate(rate);
    if (bits !== null) return this._gauge(rate, label, networkRate(this._lang, bits));
    const v = networkValue(this._st(total));
    return v === null ? "" : this._gauge(total, label, `${networkNum(this._lang, v)} ${this._st(total).attributes?.unit_of_measurement || ""}`.trim());
  },

  _apCard(r) {
    const lang = this._lang;
    const e = r.entities;
    // Offline when none of its entities reads
    const online = Object.values(e).some((id) => {
      const st = this._st(id);
      return st && st.state !== "unavailable";
    });
    const clients = networkValue(this._st(e.clients));
    const u = this._st(e.update);
    const up = networkUptime(this._st(e.uptime), this._now());
    const cpu = networkValue(this._st(e.cpu));
    const ram = networkValue(this._st(e.ram));
    const temp = networkValue(this._st(e.temperature));
    const chips = [
      this._chip(this._t(online ? "online" : "offline"), online ? "ok" : "bad"),
      u?.state === "on" ? this._chip(this._t("firmware_update", { v: u.attributes?.latest_version || "" }), "warn") : "",
      clients !== null ? this._chip(this._t("clients_n", { n: networkNum(lang, clients) })) : "",
      up !== null ? this._chip(this._t("online_since", { time: networkDuration(lang, up) })) : "",
    ].join("");
    const tiles = [
      cpu !== null ? this._gauge(e.cpu, this._t("cpu"), `${networkNum(lang, cpu, 0)} %`, NETWORK_LEVEL(cpu, 75, 90), 100) : "",
      ram !== null ? this._gauge(e.ram, this._t("ram"), `${networkNum(lang, ram, 0)} %`, NETWORK_LEVEL(ram, 80, 92), 100) : "",
      temp !== null ? this._gauge(e.temperature, this._t("temperature"), `${networkNum(lang, temp, 0)} °C`, NETWORK_LEVEL(temp, 70, 85), 100) : "",
      this._rate(e.rate_down) !== null ? this._gauge(e.rate_down, `↓ ${this._t("download")}`, networkRate(lang, this._rate(e.rate_down))) : "",
    ].join("");
    const btns = [u?.state === "on" ? this._actBtn("install", u.entity_id, this._t("install"), "warn") : "", this._actBtn("press", e.reboot, this._t("restart"), "on", ' data-ask="1"'), networkHttp(r.url) ? `<a class="b" href="${networkEsc(r.url)}" target="_blank" rel="noopener noreferrer">${networkEsc(this._t("open_admin"))}</a>` : ""].join("");
    return `<div class="c"><div class="h"><span>${networkEsc(r.name)}</span><span class="s m">${networkEsc([r.model, r.sw_version ? `${this._t("firmware")} ${r.sw_version}` : ""].filter(Boolean).join(" · "))}</span></div><div class="dhead sm"><div class="dpic sm"><img src="${networkEsc(networkRouterPicture(r))}" alt=""></div><div class="grow chips">${chips}</div><div class="chips">${btns}</div></div>${tiles ? `<div class="gs">${tiles}</div>` : ""}</div>`;
  },

  _tab_wifi() {
    const inv = this._inv;
    this._fetch24();
    const trackers = networkTrackers(this._hass.states).filter((s) => s.state === "home");
    const ssidClients = (st) => {
      const n = networkName(st).toLowerCase();
      return trackers.filter((t) => String(t.attributes.essid || t.attributes.ssid || "").toLowerCase() && n.includes(String(t.attributes.essid || t.attributes.ssid).toLowerCase())).length;
    };
    const wifi = inv.wifi.length
      ? `<div class="c"><div class="h"><span>${networkEsc(this._t("wifi_networks"))}</span><span class="s m">${inv.wifi.length}</span></div><div class="list">${inv.wifi
          .map((id) => {
            const st = this._st(id);
            const on = networkOn(st);
            const owners = [inv.box, ...inv.routers].filter((d) => d?.wifi?.includes(id)).map((d) => d.name);
            const n = ssidClients(st);
            return `<div class="arow"><span class="d ${on ? "ok" : ""}"></span><span class="grow"><b>${networkEsc(networkName(st) || id)}</b><span class="s m"> · ${networkEsc([owners.join(", "), on ? (n ? this._t("clients_n", { n }) : this._t("state_on")) : this._t("state_off")].filter(Boolean).join(" · "))}</span></span>${this._toggleSw(id)}</div>`;
          })
          .join("")}</div></div>`
      : "";
    const aps = inv.routers.map((r) => this._apCard(r)).join("");
    const sws = inv.switches.map((sw, i) => this._switchCard(sw, i)).join("");
    if (!wifi && !aps && !sws) return this._empty("empty_wifi");
    return `<div class="grid2">${sws}${aps}${wifi}</div>`;
  },

  // ----- DNS -----

  _tab_dns() {
    const dns = this._inv.dns;
    const lang = this._lang;
    const e = dns.entities;
    this._fetch24();
    const val = (id) => networkValue(this._st(id));
    const q = val(e.queries);
    const b = val(e.blocked);
    const ratio = val(e.ratio) ?? (q ? ((b ?? 0) / q) * 100 : null);
    const speed = val(e.speed);
    const prot = this._dnsProtected();
    const pill = prot === null ? "" : `<span class="pill ${prot ? "ok" : "warn"}"><span class="dot"></span>${networkEsc(this._t(prot ? "protection_on" : "protection_off"))}</span>`;
    const tiles = [
      this._gauge(e.queries, this._t("queries"), q === null ? "—" : networkNum(lang, q)),
      this._gauge(e.blocked, this._t("blocked"), b === null ? "—" : networkNum(lang, b), "bad"),
      this._gauge(e.ratio, this._t("ratio"), ratio === null ? "—" : `${networkNum(lang, ratio, 1)} %`, "", 100),
      speed !== null ? this._gauge(e.speed, this._t("avg_time"), `${networkNum(lang, speed, speed < 10 ? 1 : 0)} ms`) : "",
    ].join("");
    const settings = dns.switches
      .map((id) => {
        const st = this._st(id);
        const on = networkOn(st);
        const label = networkName(st).replace(new RegExp(`^${dns.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "") || networkName(st);
        return `<button class="chip set${on ? " ok" : ""}" data-act="toggle" data-arg="${networkEsc(id)}" data-on="${on ? "0" : "1"}" aria-pressed="${on}">${networkEsc(label)}</button>`;
      })
      .join("");
    const details = (dns.details || [])
      .map((id) => {
        const st = this._st(id);
        if (!st || st.state === "unknown") return "";
        const v = networkValue(st);
        return `<button class="arow" data-act="more" data-arg="${networkEsc(id)}"><span class="grow">${networkEsc(networkName(st).replace(dns.title, "").trim() || networkName(st))}</span><b>${networkEsc(v !== null ? networkNum(lang, v, 1) : st.state)}</b></button>`;
      })
      .join("");
    const updates = (dns.updates || [])
      .map((id) => this._st(id))
      .filter((u) => u?.state === "on")
      .map((u) => `<button class="chip warn" data-act="more" data-arg="${networkEsc(u.entity_id)}">${networkEsc(this._t("firmware_update", { v: u.attributes?.latest_version || "" }))}</button>`)
      .join("");
    const buttons = (dns.buttons || []).map((id) => this._actBtn("press", id, networkName(this._st(id)).replace(dns.title, "").trim() || this._t("refresh"), "on")).join("");
    return `<div class="grid2"><div class="c"><div class="dnsart">${NETWORK_DNS_ART}</div><div class="h"><span>${networkEsc(this._t("dns_filter"))}<span class="s m"> · ${networkEsc(dns.title)}</span></span>${pill}</div><div class="gs g2">${tiles}</div></div><div class="c">${settings ? `<div class="s m sect">${networkEsc(this._t("settings_dns"))}</div><div class="chips">${settings}</div>` : ""}${details ? `<div class="s m sect">${networkEsc(this._t("details"))}</div><div class="list">${details}</div>` : ""}${updates || buttons ? `<div class="r" style="margin-top:12px"><div class="chips">${updates}</div><div class="chips">${buttons}</div></div>` : ""}</div></div>`;
  },

  // ----- Speed -----

  _speedDial(v, top) {
    const f = top ? Math.max(0, Math.min(1, v / top)) : 0;
    const a = Math.PI * (1 - f);
    const cx = 100 + 82 * Math.cos(a);
    const cy = 100 - 82 * Math.sin(a);
    const nx = 100 + 66 * Math.cos(a);
    const ny = 100 - 66 * Math.sin(a);
    return `<svg class="dial" viewBox="0 0 200 112" aria-hidden="true" focusable="false"><path class="bg" d="M18 100 A82 82 0 0 1 182 100"/>${f > 0 ? `<path class="fg" d="M18 100 A82 82 0 0 1 ${cx.toFixed(1)} ${cy.toFixed(1)}"/>` : ""}<line x1="100" y1="100" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}"/><circle cx="100" cy="100" r="6"/></svg>`;
  },

  _tab_speed() {
    const sp = this._inv.speed;
    const lang = this._lang;
    const last = this._speedLast();
    const st = this._st(sp.entities.download);
    const factor = networkBits(st) !== null && networkValue(st) ? networkBits(st) / networkValue(st) : 1e6;
    const week = (this._history?.download || []).filter((p) => p.t >= Date.now() - 7 * 86400000).map((p) => ({ t: p.t, v: p.v * factor }));
    const best = Math.max(last.down || 0, ...week.map((p) => p.v));
    const avg = week.length ? week.reduce((a, p) => a + p.v, 0) / week.length : null;
    const slow = week.length ? week.reduce((m, p) => (p.v < m.v ? p : m), week[0]) : null;
    const median = week.length ? [...week].sort((a, b) => a.v - b.v)[Math.floor(week.length / 2)].v : null;
    const status = last.down === null ? "no_result" : median && last.down < median / 2 ? "slow" : last.ping !== null && last.ping > 100 ? "high_latency" : "normal";
    const jitter = networkValue(this._st(sp.entities.jitter));
    const loss = networkValue(this._st(sp.entities.loss));
    const server = st?.attributes?.server_name || st?.attributes?.server || null;
    const rows = [
      [`↑ ${this._t("upload")}`, networkRate(lang, last.up)],
      [this._t("ping"), [last.ping !== null ? `${networkNum(lang, last.ping, 0)} ms` : "—", jitter !== null ? `${this._t("jitter")} ${networkNum(lang, jitter, 1)} ms` : ""].filter(Boolean).join(" · ")],
      loss !== null ? [this._t("loss"), `${networkNum(lang, loss, 1)} %`] : null,
      server ? [this._t("server"), server] : null,
    ].filter(Boolean);
    const chart = this._chart([
      { cls: "dn", points: this._history?.download || [] },
      { cls: "up", points: this._history?.upload || [] },
    ]);
    const run = sp.button ? this._actBtn("press", sp.button, this._t("run_test"), "on") : `<button class="b on" data-act="test" data-arg="${networkEsc(sp.entities.download || "")}">${networkEsc(this._t("run_test"))}</button>`;
    return `<div class="grid2"><div class="c"><div class="h"><span>${networkEsc(sp.title)}</span><span class="pill ${status === "normal" ? "ok" : status === "no_result" ? "idle" : "warn"}"><span class="dot"></span>${networkEsc(this._t(`speed_${status}`))}</span></div><div class="dialrow">${this._speedDial(last.down || 0, best || 1)}<div><div class="big">${networkEsc(networkRate(lang, last.down))}</div><div class="s m">${networkEsc(this._t("of_best", { pct: best && last.down ? networkNum(lang, (last.down / best) * 100, 0) : "—" }))}</div><div class="s m">${st ? networkEsc(networkAgo(lang, st.last_changed)) : ""}</div></div></div><div class="list">${rows.map(([k, v]) => `<div class="arow"><span class="grow">${networkEsc(k)}</span><b>${networkEsc(v)}</b></div>`).join("")}</div><div class="r" style="margin-top:12px"><span></span>${run}</div></div><div class="c"><div class="h"><span>${networkEsc(this._t("speed_30d", { name: sp.title }))}</span><div class="legend"><span><i style="background:var(--nw-ok)"></i>${networkEsc(this._t("download"))}</span><span><i style="background:var(--nw-accent)"></i>${networkEsc(this._t("upload"))}</span></div></div>${chart}<div class="kpis" style="margin-top:12px">${avg !== null ? `<div class="t"><div class="s m">${networkEsc(this._t("avg_7d"))}</div><b>${networkEsc(networkRate(lang, avg))}</b></div>` : ""}${slow ? `<div class="t ${median && slow.v < median / 2 ? "warn" : ""}"><div class="s m">${networkEsc(this._t("slowest"))}</div><b>${networkEsc(networkRate(lang, slow.v))}</b><div class="s m">${networkEsc(new Date(slow.t).toLocaleString(lang, { weekday: "short", hour: "numeric", minute: "2-digit" }))}</div></div>` : ""}</div></div></div>`;
  },

  // ----- Proxy (Zoraxy's controls, a switch per rule) -----

  _proxyExtras() {
    const px = this._inv.proxy;
    const ids = (px.controls || []).filter((id) => this._st(id));
    // The device name all the controls start with ("Zoraxy HTTPS redirect") is left out
    const names = ids.map((id) => networkName(this._st(id)));
    const first = names[0]?.split(" ")[0] || "";
    const strip = names.length > 1 && names.every((n) => n.startsWith(`${first} `));
    const controls = ids.map((id, i) => `<div class="arow"><span class="grow">${networkEsc(strip ? names[i].slice(first.length + 1) : names[i])}</span>${this._toggleSw(id)}</div>`).join("");
    const rules = this._st(px.summary?.rules)?.attributes?.rules;
    const hosts = new Map(this._proxyHosts().map((h) => [h.name, h]));
    const ruleRows = Array.isArray(rules)
      ? rules
          .map((r) => {
            const host = hosts.get(r.domain);
            const cls = host?.state === "bad" ? "bad" : r.enabled ? "ok" : "";
            return `<div class="arow ${cls === "bad" ? "bad" : ""}"><span class="d ${cls}"></span><span class="grow">${networkEsc(r.domain)}<span class="s m"> → ${networkEsc(r.target || "")}</span></span><button class="tg${r.enabled ? " on" : ""}" role="switch" aria-checked="${!!r.enabled}" aria-label="${networkEsc(r.domain)}" data-act="rule" data-arg="${networkEsc(r.domain)}" data-on="${r.enabled ? "0" : "1"}"></button></div>`;
          })
          .join("")
      : "";
    return { controls, rules: ruleRows };
  },
});
