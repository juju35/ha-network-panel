// The sidebar panel: languages, formatting, what each tab shows and the buttons it presses.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { history, inventory, states } from "../scripts/mock-states.mjs";
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
  assert.deepEqual(p._tabs(), ["overview", "devices", "wifi", "speed", "settings"]);
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
