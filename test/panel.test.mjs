// The sidebar panel: languages, formatting, what each tab shows and the buttons it presses.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { history, inventory, NOW, states } from "../scripts/mock-states.mjs";
import { defined_elements, lib } from "./load.mjs";

const i18n = new URL("../custom_components/network_panel/frontend/i18n/", import.meta.url);
const placeholders = (s) => (String(s).match(/\{\w+\}/g) || []).sort();

test("every language file has one string per English key, with its placeholders", () => {
  const files = readdirSync(i18n).map((f) => f.replace(/\.json$/, ""));
  assert.deepEqual([...files].sort(), [...lib.NETWORK_LANGS].sort());
  for (const lang of files) {
    const strings = JSON.parse(readFileSync(new URL(`${lang}.json`, i18n), "utf8"));
    assert.deepEqual(Object.keys(strings).sort(), Object.keys(lib.NETWORK_PANEL_EN).sort(), lang);
    for (const [k, v] of Object.entries(strings)) assert.deepEqual(placeholders(v), placeholders(lib.NETWORK_PANEL_EN[k]), `${lang}.${k}`);
  }
});

test("the element is defined once", () => {
  assert.equal(defined_elements.get("network-panel"), lib.NetworkPanel);
});

test("strings fill their placeholders and fall back to English", () => {
  assert.equal(lib.networkT(null, "sub_devices", { n: 3 }), "3 devices connected");
  assert.equal(lib.networkT({ sub_devices: "{n} appareils connectés" }, "sub_devices", { n: 3 }), "3 appareils connectés");
  assert.equal(lib.networkT({}, "refresh"), "Refresh");
});

test("HTML is escaped", () => {
  assert.equal(lib.networkEsc('<b a="1">&\''), "&lt;b a=&quot;1&quot;&gt;&amp;&#39;");
});

test("rates in bit/s from the sensor's unit, shown in their largest unit", () => {
  assert.equal(lib.networkBits({ state: "312", attributes: { unit_of_measurement: "Mbit/s" } }), 312e6);
  assert.equal(lib.networkBits({ state: "unavailable", attributes: {} }), null);
  assert.equal(lib.networkRate("en", 312e6), "312 Mb/s");
  assert.equal(lib.networkRate("en", 1.24e9), "1.24 Gb/s");
  assert.equal(lib.networkRate("en", 640e3), "640 kb/s");
  assert.equal(lib.networkRate("fr", 1.24e9), "1,24 Gb/s");
  assert.equal(lib.networkRate("en", null), "-");
});

test("port, proxy host and router states", () => {
  assert.equal(lib.networkPortState({ state: "on" }), "up");
  assert.equal(lib.networkPortState({ state: "off" }), "down");
  assert.equal(lib.networkPortState({ state: "1000" }), "up");
  // SNMP ifOperStatus: 1 up, 2 down
  assert.equal(lib.networkPortState({ state: "1" }), "up");
  assert.equal(lib.networkPortState({ state: "2" }), "down");
  assert.equal(lib.networkPortState({ state: "unavailable" }), "unknown");
  assert.equal(lib.networkPortState(undefined), "unknown");
  assert.equal(lib.networkHostState({ state: "200" }), "ok");
  assert.equal(lib.networkHostState({ state: "502" }), "bad");
  assert.equal(lib.networkHostState({ state: "on" }), "ok");
  assert.equal(lib.networkHostState({ state: "off" }), "bad");
  assert.equal(lib.networkHostState(undefined), "idle");
  assert.equal(lib.networkRouterKind({ kind: "ap", platform: "unifi" }), "ap");
  assert.equal(lib.networkRouterKind({ kind: "router", platform: "opnsense" }), "firewall");
  assert.equal(lib.networkRouterKind({ kind: "ap", platform: "tplink_deco" }), "mesh");
});

test("only http(s) links are opened", () => {
  assert.equal(lib.networkHttp("https://192.168.1.1/"), true);
  assert.equal(lib.networkHttp("http://unifi.local"), true);
  assert.equal(lib.networkHttp("javascript:alert(1)"), false);
  assert.equal(lib.networkHttp(""), false);
});

test("the box model comes from its integration, else a generic drawing", () => {
  assert.equal(lib.networkBoxModel(null), null);
  assert.ok(lib.networkBoxModel(inventory.box).name);
  assert.equal(lib.networkBoxModel({ platform: "unknown_box", name: "Box" }).id, "generic_router");
});

test("router trackers only, connected first then by name", () => {
  const list = lib.networkTrackers(states);
  assert.ok(list.length > 0);
  assert.ok(list.every((s) => s.attributes.source_type === "router"));
  const firstAway = list.findIndex((s) => s.state !== "home");
  if (firstAway > 0) assert.ok(list.slice(firstAway).every((s) => s.state !== "home"));
});

test("daily peaks over the last days, oldest first", () => {
  const now = Date.parse("2026-03-12T12:00:00");
  const day = 86400000;
  const peaks = lib.networkDailyPeaks(
    [
      { t: now - 2 * day, v: 400 },
      { t: now - 2 * day + 3600000, v: 500 },
      { t: now, v: 800 },
    ],
    3,
    now,
  );
  assert.deepEqual(peaks, [500, null, 800]);
});

test("the switch chassis draws one port per entry, with its own gradient", () => {
  const svg = lib.networkChassisSvg(
    Array.from({ length: 8 }, (_, i) => ({ label: String(i + 1), state: i % 2 ? "up" : "down", title: `Port ${i + 1}` })),
    "t1",
  );
  assert.match(svg, /^<svg/);
  assert.match(svg, /hs-body-t1/);
  assert.equal((svg.match(/<title>Port \d<\/title>/g) || []).length, 8);
});

test("the banner scene is day or night", () => {
  const day = lib.networkSceneSvg({ night: false, box: "", switches: [], router: "", wifi: true, online: true });
  const night = lib.networkSceneSvg({ night: true, box: "", switches: [], router: "", wifi: true, online: true });
  assert.notEqual(day, night);
  assert.match(night, /<svg/);
});

const panel = (calls = [], extra = {}) => {
  const p = new lib.NetworkPanel();
  p._hass = { states, language: "en", themes: { darkMode: false }, callService: async (...args) => calls.push(args), callWS: async () => ({}), ...extra };
  p._inv = JSON.parse(JSON.stringify(inventory));
  const parse = (id) => history[id].map((x) => ({ t: x.lu * 1000, v: Number(x.s) }));
  p._history = { download: parse("sensor.speedtest_download"), upload: parse("sensor.speedtest_upload") };
  return p;
};

test("every tab renders with the mock network", () => {
  for (const tab of lib.NETWORK_TABS) {
    const p = panel();
    p._tab = tab;
    p._render(true);
    const html = p.shadowRoot.innerHTML;
    assert.match(html, /class="banner"/, tab);
    assert.match(html, new RegExp(`class="tab on" data-act="tab" data-arg="${tab}"`), tab);
    assert.doesNotMatch(html, /undefined|NaN|\[object Object\]/, tab);
  }
});

test("tabs without a source are hidden", () => {
  const p = panel();
  p._inv.dns = null;
  p._inv.proxy = null;
  assert.deepEqual(p._tabs(), ["overview", "internet", "devices", "wifi", "speed", "settings"]);
  p._inv.box = null;
  assert.equal(p._tabs().includes("internet"), false);
  p._tab = "dns";
  p._render(true);
  assert.match(p.shadowRoot.innerHTML, /class="tab on" data-act="tab" data-arg="overview"/);
});

test("the devices tab filters and searches the trackers", () => {
  const p = panel();
  p._tab = "devices";
  p._filter = "all";
  p._render(true);
  const rows = (p.shadowRoot.innerHTML.match(/<tr><td>/g) || []).length;
  assert.equal(rows, lib.networkTrackers(states).length);
  p._filter = "home";
  p._render(true);
  assert.equal((p.shadowRoot.innerHTML.match(/<tr><td>/g) || []).length, lib.networkTrackers(states).filter((s) => s.state === "home").length);
  p._search = "zzzz-nothing";
  p._render(true);
  assert.match(p.shadowRoot.innerHTML, /No result\./);
});

test("turning a Wi-Fi network off asks first, then calls the service", () => {
  const calls = [];
  const p = panel(calls);
  p._toggle("switch.guest_wifi", false);
  assert.equal(calls.length, 0);
  assert.equal(p._ask.id, "switch.guest_wifi");
  p._onClick({ composedPath: () => [{ dataset: { act: "confirm" } }] });
  assert.deepEqual(calls, [["switch", "turn_off", { entity_id: "switch.guest_wifi" }]]);
  p._toggle("switch.guest_wifi", true);
  assert.deepEqual(calls[1], ["switch", "turn_on", { entity_id: "switch.guest_wifi" }]);
});

test("without confirmation, turning off is immediate", () => {
  const calls = [];
  const p = panel(calls);
  p._inv.settings.confirm_actions = false;
  p._toggle("switch.iot_wifi", false);
  assert.deepEqual(calls, [["switch", "turn_off", { entity_id: "switch.iot_wifi" }]]);
});

test("a speed test updates the download sensor", () => {
  const calls = [];
  const p = panel(calls);
  p._onClick({ composedPath: () => [{ dataset: { act: "test", arg: "sensor.speedtest_download" } }] });
  assert.deepEqual(calls, [["homeassistant", "update_entity", { entity_id: "sensor.speedtest_download" }]]);
});

test("denied and error states", () => {
  const p = panel();
  p._err = "denied";
  p._render(true);
  assert.match(p.shadowRoot.innerHTML, /administrators/);
  p._err = "boom <x>";
  p._render(true);
  assert.match(p.shadowRoot.innerHTML, /boom &lt;x&gt;/);
});

test("an empty network says what to add", () => {
  const p = panel([], { states: {} });
  p._inv = { box: null, routers: [], switches: [], wifi: [], dns: null, speed: null, proxy: null, sources: [], settings: {} };
  p._render(true);
  assert.match(p.shadowRoot.innerHTML, /No network integration/);
});

test("ports of a switch without port entities are found by its name (SNMP sensors in YAML)", () => {
  const st = (state) => ({ state, attributes: {} });
  const states = {
    "sensor.switch_sejour_port_2_status": st("2"),
    "sensor.switch_sejour_port_1_in": st("12345"),
    "sensor.switch_sejour_port_1_status": st("1"),
    "sensor.switch_parents_port_1_status": st("1"),
  };
  const ports = lib.networkPortsByName(states, "Switch Séjour");
  assert.deepEqual(ports.map((p) => [p.n, p.entity]), [
    [1, "sensor.switch_sejour_port_1_status"],
    [2, "sensor.switch_sejour_port_2_status"],
  ]);
  assert.deepEqual(lib.networkPortsByName(states, ""), []);
});

test("proxy hosts: an upstream problem sensor is offline when on, unmonitored when unknown", () => {
  assert.equal(lib.networkProxyHostState({ problem: true }, { state: "on" }), "bad");
  assert.equal(lib.networkProxyHostState({ problem: true }, { state: "off" }), "ok");
  assert.equal(lib.networkProxyHostState({ problem: true }, { state: "unknown" }), "idle");
  assert.equal(lib.networkProxyHostState({ problem: false }, { state: "off" }), "bad");
});

test("the proxy tab counts hosts once, problems first, with the certificates", () => {
  const p = panel();
  p._now = () => NOW;
  const hosts = p._proxyHosts();
  // docs is offline, auth's certificate expires soon, git is not monitored
  assert.deepEqual(
    hosts.map((h) => [h.name, h.state]),
    [["docs.example.org", "bad"], ["auth.example.org", "ok"], ["home.example.org", "ok"], ["media.example.org", "ok"], ["photos.example.org", "ok"], ["git.example.org", "idle"]],
  );
  const c = p._proxyCounts(hosts);
  assert.deepEqual([c.ok, c.monitored, c.bad, c.expiring, c.active, c.rules, c.running], [4, 5, 1, 1, 6, 7, true]);
  p._tab = "proxy";
  p._render(true);
  const html = p.shadowRoot.innerHTML;
  assert.match(html, /Active rules/);
  assert.match(html, /href="https:\/\/docs\.example\.org"/);
  assert.match(html, /not monitored/);
});

test("the overview lists what needs attention, the worst first, with its action", () => {
  const p = panel();
  p._now = () => NOW;
  const att = p._attention();
  const text = att.map(([cls, t]) => `${cls} ${t.replace(/<[^>]+>/g, "")}`);
  // the proxy upstream down and the printer's port first, then the AP and AdGuard updates, the certificate, the calls
  assert.deepEqual(att.map(([cls]) => cls).slice(0, 2), ["bad", "bad"]);
  assert.ok(text.some((t) => /Office switch · Printer down/.test(t)));
  assert.ok(text.some((t) => /docs\.example\.org · upstream offline/.test(t)));
  assert.ok(text.some((t) => /Upstairs AP · update 6\.7\.10 available/.test(t)));
  assert.ok(text.some((t) => /2 missed calls/.test(t)));
  assert.match(att.find(([, t]) => /missed/.test(t))[2], /data-act="press" data-arg="button\.freebox_mark_calls_as_read"/);
});

test("devices are split wired, Wi-Fi and guest", () => {
  assert.equal(lib.networkLinkOf({ attributes: { is_wired: true } }), "wired");
  assert.equal(lib.networkLinkOf({ attributes: { essid: "Home" } }), "wifi");
  assert.equal(lib.networkLinkOf({ attributes: { essid: "Guest" } }), "guest");
  assert.equal(lib.networkLinkOf({ attributes: { essid: "Home", is_guest: true } }), "guest");
});

test("a restart and an update install ask first, then press or install", () => {
  const calls = [];
  const p = panel(calls);
  p._onClick({ composedPath: () => [{ dataset: { act: "press", arg: "button.freebox_restart", ask: "1" } }] });
  assert.equal(calls.length, 0);
  assert.match(p._askHtml(), /Run Freebox Restart\?/);
  p._onClick({ composedPath: () => [{ dataset: { act: "confirm" } }] });
  assert.deepEqual(calls.pop(), ["button", "press", { entity_id: "button.freebox_restart" }]);
  p._onClick({ composedPath: () => [{ dataset: { act: "install", arg: "update.upstairs_ap" } }] });
  assert.match(p._askHtml(), /Install the update of Upstairs AP\?/);
  p._onClick({ composedPath: () => [{ dataset: { act: "confirm" } }] });
  assert.deepEqual(calls.pop(), ["update", "install", { entity_id: "update.upstairs_ap" }]);
  // A button that cuts nothing is pressed at once
  p._onClick({ composedPath: () => [{ dataset: { act: "press", arg: "button.freebox_mark_calls_as_read" } }] });
  assert.deepEqual(calls.pop(), ["button", "press", { entity_id: "button.freebox_mark_calls_as_read" }]);
});

test("a proxy rule is toggled through the Reverse Proxy service", () => {
  const calls = [];
  const p = panel(calls);
  p._tab = "proxy";
  p._render(true);
  const html = p.shadowRoot.innerHTML;
  assert.match(html, /data-act="rule" data-arg="old\.example\.org" data-on="1"/);
  assert.match(html, /Development mode/);
  assert.match(html, /data-act="press" data-arg="button\.zoraxy_renew_auth"/);
  p._onClick({ composedPath: () => [{ dataset: { act: "rule", arg: "old.example.org", on: "1" } }] });
  assert.deepEqual(calls, [["reverse_proxy", "toggle_proxy_rule", { domain: "old.example.org", enable: true }]]);
});

test("the internet tab shows the box, its sensors and its buttons", () => {
  const p = panel();
  p._tab = "internet";
  p._render(true);
  const html = p.shadowRoot.innerHTML;
  assert.match(html, /FTTH/);
  assert.match(html, /203\.0\.113\.42/);
  assert.match(html, /54 °C/);
  assert.match(html, /1,820 rpm/);
  assert.match(html, /data-act="press" data-arg="button\.freebox_restart" data-ask="1"/);
});

test("the sparkline draws the last 24 hours only", () => {
  const end = NOW;
  assert.equal(lib.networkSpark([{ t: end - 1000, v: 1 }], null, end), "");
  const svg = lib.networkSpark([{ t: end - 2 * 86400000, v: 9 }, { t: end - 3600000, v: 1 }, { t: end - 60000, v: 2 }], 4, end);
  assert.match(svg, /<polyline/);
  assert.doesNotMatch(svg, /NaN/);
});

test("turning a proxy rule off asks first", () => {
  const calls = [];
  const p = panel(calls);
  p._onClick({ composedPath: () => [{ dataset: { act: "rule", arg: "home.example.org", on: "0" } }] });
  assert.equal(calls.length, 0);
  assert.match(p._askHtml(), /Turn off home\.example\.org\?/);
  p._onClick({ composedPath: () => [{ dataset: { act: "confirm" } }] });
  assert.deepEqual(calls, [["reverse_proxy", "toggle_proxy_rule", { domain: "home.example.org", enable: false }]]);
});

test("an access point whose entities are all unavailable reads offline", () => {
  const off = Object.fromEntries(Object.entries(states).map(([id, s]) => [id, id.includes("upstairs_ap") ? { ...s, state: "unavailable" } : s]));
  const p = panel([], { states: off });
  const html = p._apCard(p._inv.routers[1]);
  assert.match(html, /chip bad">offline/);
  assert.match(p._apCard(p._inv.routers[0]), /chip ok">online/);
});

test("a switch's own entities are part of what re-renders", () => {
  const p = panel();
  assert.match(p._signature(), new RegExp(states["sensor.office_switch_rx"].last_updated.replace(/[.]/g, "\\.")));
  const before = p._signature();
  p._hass = { ...p._hass, states: { ...states, "switch.office_switch_poe": { ...states["switch.office_switch_poe"], state: "off", last_updated: "2026-03-12T18:31:00Z" } } };
  assert.notEqual(p._signature(), before);
});
