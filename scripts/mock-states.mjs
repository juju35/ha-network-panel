// Mock home network for the screenshots and the panel tests: a Freebox, two switches, two access points, three
// Wi-Fi networks, router device trackers, AdGuard Home, Speedtest.net and a reverse proxy. Neutral names only.
export const NOW = Date.parse("2026-03-12T18:30:00Z");
const ago = (s) => new Date(NOW - s * 1000).toISOString();
// Reverse proxy rule domains: [name, upstream problem state, days before the certificate expires]
const PROXY_HOSTS = [
  ["home", "off", 74],
  ["auth", "off", 9],
  ["photos", "off", 61],
  ["media", "off", 52],
  ["docs", "on", 80],
  ["git", "unknown", 33],
];
const st = (entity_id, state, attributes = {}, changed = 3600) => ({ entity_id, state: String(state), attributes, last_changed: ago(changed), last_updated: ago(60) });

const switchPorts = (prefix, name, up) =>
  Array.from({ length: 8 }, (_, i) => st(`binary_sensor.${prefix}_port_${i + 1}`, up.includes(i + 1) ? "on" : "off", { friendly_name: `${name} Port ${i + 1}`, device_class: "connectivity" }));

const devices = [
  ["laptop", "Laptop", "192.168.1.60", "home", "Home", 900],
  ["nas", "NAS", "192.168.1.250", "home", null, 86400 * 9],
  ["living_room_tv", "Living room TV", "192.168.1.41", "home", null, 7200],
  ["docker_host", "Docker host", "192.168.1.253", "home", null, 86400 * 9],
  ["phone_a", "Phone A", "192.168.1.62", "home", "Home", 1500],
  ["phone_b", "Phone B", "192.168.1.63", "home", "Home", 400],
  ["tablet", "Tablet", "192.168.1.66", "not_home", "Home", 7400],
  ["printer", "Printer", "192.168.1.90", "home", "IoT", 86400 * 3],
  ["camera_garden", "Garden camera", "192.168.1.71", "home", "IoT", 86400 * 2],
  ["smart_speaker", "Smart speaker", "192.168.1.73", "home", "IoT", 86400],
  ["thermostat", "Thermostat", "192.168.1.75", "home", "IoT", 86400 * 4],
  ["robot_vacuum", "Robot vacuum", "192.168.1.77", "home", "IoT", 3000],
  ["game_console", "Game console", "192.168.1.44", "not_home", null, 86400],
  ["desktop", "Desktop", "192.168.1.61", "home", null, 28000],
  ["watch", "Watch", "192.168.1.68", "home", "Home", 240],
  ["guest_phone", "Guest phone", "192.168.2.21", "home", "Guest", 1800],
  ["e_reader", "E-reader", "192.168.1.69", "not_home", "Home", 86400 * 2],
  ["washing_machine", "Washing machine", "192.168.1.80", "home", "IoT", 86400 * 6],
];
const MAC = (i) => `a4:5e:60:${(16 + i).toString(16).padStart(2, "0")}:3c:${(32 + i * 7).toString(16).slice(-2).padStart(2, "0")}`;

export const states = Object.fromEntries(
  [
    st("sensor.freebox_download_speed", 39000, { friendly_name: "Freebox Download speed", unit_of_measurement: "kB/s", device_class: "data_rate" }),
    st("sensor.freebox_upload_speed", 6000, { friendly_name: "Freebox Upload speed", unit_of_measurement: "kB/s", device_class: "data_rate" }),
    st("binary_sensor.freebox_wan", "on", { friendly_name: "Freebox WAN", device_class: "connectivity" }, 86400 * 21),
    st("sensor.freebox_uptime", ago(86400 * 21 + 3000), { friendly_name: "Freebox Uptime", device_class: "timestamp" }),
    st("sensor.freebox_external_ip", "203.0.113.42", { friendly_name: "Freebox External IP" }),
    st("switch.freebox_wifi", "on", { friendly_name: "Home" }),
    st("switch.iot_wifi", "on", { friendly_name: "IoT" }),
    st("switch.guest_wifi", "off", { friendly_name: "Guest" }),
    ...switchPorts("office_switch", "Office switch", [1, 2, 3, 5, 6, 7, 8]),
    ...switchPorts("garage_switch", "Garage switch", [1, 2, 4, 8]),
    st("sensor.upstairs_ap_clients", 15, { friendly_name: "Upstairs AP Clients" }),
    st("sensor.upstairs_ap_temperature", 41, { friendly_name: "Upstairs AP Temperature", unit_of_measurement: "°C", device_class: "temperature" }),
    st("sensor.living_room_ap_clients", 24, { friendly_name: "Living room AP Clients" }),
    st("sensor.adguard_home_dns_queries", 48120, { friendly_name: "AdGuard Home DNS queries", unit_of_measurement: "queries" }),
    st("sensor.adguard_home_dns_queries_blocked", 8850, { friendly_name: "AdGuard Home DNS queries blocked", unit_of_measurement: "queries" }),
    st("sensor.adguard_home_dns_queries_blocked_ratio", 18.4, { friendly_name: "AdGuard Home DNS queries blocked ratio", unit_of_measurement: "%" }),
    st("sensor.adguard_home_average_processing_speed", 12.3, { friendly_name: "AdGuard Home Average processing speed", unit_of_measurement: "ms" }),
    st("switch.adguard_home_protection", "on", { friendly_name: "Protection" }),
    st("switch.adguard_home_filtering", "on", { friendly_name: "Filtering" }),
    st("switch.adguard_home_parental_control", "on", { friendly_name: "Parental control" }),
    st("switch.adguard_home_safe_search", "off", { friendly_name: "Safe search" }),
    st("sensor.speedtest_download", 890.4, { friendly_name: "SpeedTest Download", unit_of_measurement: "Mbit/s", device_class: "data_rate" }, 5400),
    st("sensor.speedtest_upload", 612.7, { friendly_name: "SpeedTest Upload", unit_of_measurement: "Mbit/s", device_class: "data_rate" }, 5400),
    st("sensor.speedtest_ping", 4, { friendly_name: "SpeedTest Ping", unit_of_measurement: "ms" }, 5400),
    st("binary_sensor.zoraxy_running", "on", { friendly_name: "Zoraxy Running" }),
    st("sensor.zoraxy_proxy_rules", 7, { friendly_name: "Zoraxy Proxy rules" }),
    st("sensor.zoraxy_active_rules", 6, { friendly_name: "Zoraxy Active rules" }),
    // Rule domains: upstream check (problem sensor, on = offline), certificate expiry, expiring flag; docs is down,
    // git is not monitored, auth's certificate expires soon
    ...PROXY_HOSTS.flatMap(([h, up, days]) => [
      st(`binary_sensor.zoraxy_upstream_${h}`, up, { domain: `${h}.example.org`, device_class: "problem" }, up === "on" ? 1800 : 86400 * 5),
      st(`sensor.zoraxy_certificate_${h}`, new Date(NOW + days * 86400000).toISOString(), { domain: `${h}.example.org`, device_class: "timestamp" }),
      st(`binary_sensor.zoraxy_cert_expiring_${h}`, days < 14 ? "on" : "off", { domain: `${h}.example.org`, device_class: "problem" }),
    ]),
    ...devices.map(([id, name, ip, state, essid, changed], i) =>
      st(`device_tracker.${id}`, state, { friendly_name: name, source_type: "router", ip, mac: MAC(i), host_name: id.replace(/_/g, "-"), ...(essid ? { essid } : { is_wired: true }) }, changed),
    ),
  ].map((s) => [s.entity_id, s]),
);

const ports = (prefix, name) => Array.from({ length: 8 }, (_, i) => ({ n: i + 1, entity: `binary_sensor.${prefix}_port_${i + 1}`, label: `${name} Port ${i + 1}` }));

export const inventory = {
  box: {
    id: "dev_box",
    name: "Freebox Server",
    platform: "freebox",
    kind: "box",
    model: "Freebox v9 (r1)",
    manufacturer: "Freebox SAS",
    sw_version: "4.9.2",
    url: "https://mafreebox.freebox.fr",
    entities: {
      rate_down: "sensor.freebox_download_speed",
      rate_up: "sensor.freebox_upload_speed",
      wan: "binary_sensor.freebox_wan",
      uptime: "sensor.freebox_uptime",
      ip: "sensor.freebox_external_ip",
    },
    wifi: ["switch.freebox_wifi"],
    ports: [],
  },
  routers: [
    { id: "dev_ap1", name: "Living room AP", platform: "unifi", kind: "ap", model: "U6 Lite", manufacturer: "Ubiquiti", sw_version: "6.6.77", url: "", entities: { clients: "sensor.living_room_ap_clients" }, wifi: ["switch.iot_wifi", "switch.guest_wifi"], ports: [] },
    { id: "dev_ap2", name: "Upstairs AP", platform: "unifi", kind: "ap", model: "U6 Pro", manufacturer: "Ubiquiti", sw_version: "6.6.77", url: "", entities: { clients: "sensor.upstairs_ap_clients", temperature: "sensor.upstairs_ap_temperature" }, wifi: [], ports: [] },
  ],
  switches: [
    { id: "dev_sw1", name: "Office switch", platform: "unifi", kind: "switch", model: "USW Lite 8 PoE", manufacturer: "Ubiquiti", sw_version: "7.1.26", url: "", entities: {}, wifi: [], ports: ports("office_switch", "Office switch") },
    { id: "dev_sw2", name: "Garage switch", platform: "unifi", kind: "switch", model: "USW Flex Mini", manufacturer: "Ubiquiti", sw_version: "2.1.6", url: "", entities: {}, wifi: [], ports: ports("garage_switch", "Garage switch") },
  ],
  wifi: ["switch.freebox_wifi", "switch.iot_wifi", "switch.guest_wifi"],
  dns: {
    platform: "adguard",
    title: "AdGuard Home",
    entities: {
      queries: "sensor.adguard_home_dns_queries",
      blocked: "sensor.adguard_home_dns_queries_blocked",
      ratio: "sensor.adguard_home_dns_queries_blocked_ratio",
      speed: "sensor.adguard_home_average_processing_speed",
    },
    switches: ["switch.adguard_home_protection", "switch.adguard_home_filtering", "switch.adguard_home_parental_control", "switch.adguard_home_safe_search"],
  },
  speed: { platform: "speedtestdotcom", title: "Speedtest.net", entities: { download: "sensor.speedtest_download", upload: "sensor.speedtest_upload", ping: "sensor.speedtest_ping" } },
  proxy: {
    platform: "reverse_proxy",
    title: "Reverse Proxy",
    summary: { running: "binary_sensor.zoraxy_running", rules: "sensor.zoraxy_proxy_rules", active: "sensor.zoraxy_active_rules" },
    hosts: PROXY_HOSTS.map(([h]) => ({
      id: `${h}_example_org`,
      problem: true,
      upstream: `binary_sensor.zoraxy_upstream_${h}`,
      cert: `sensor.zoraxy_certificate_${h}`,
      expiring: `binary_sensor.zoraxy_cert_expiring_${h}`,
    })),
  },
  sources: [
    { platform: "freebox", title: "Freebox Server", state: "loaded", entry_id: "e1" },
    { platform: "unifi", title: "Home network", state: "loaded", entry_id: "e2" },
    { platform: "adguard", title: "AdGuard Home", state: "loaded", entry_id: "e3" },
    { platform: "speedtestdotcom", title: "Speedtest.net", state: "loaded", entry_id: "e4" },
    { platform: "reverse_proxy", title: "Reverse Proxy", state: "loaded", entry_id: "e5" },
  ],
  settings: { show_away: true, confirm_actions: true },
};

// 30 days of speed tests, four a day: around 880 / 600 Mbit/s, the evenings of the weekend slower
const series = (base, spread) => {
  const out = [];
  for (let d = 29; d >= 0; d--)
    for (const h of [3, 9, 15, 21]) {
      const t = NOW - d * 86400000 - (18 - h) * 3600000;
      const day = new Date(t).getUTCDay();
      const slow = (day === 0 || day === 6) && h === 21 ? 0.6 : 1;
      const wave = Math.sin(d * 1.7 + h) * spread;
      out.push({ s: String(Math.round((base + wave) * slow * 10) / 10), lu: t / 1000 });
    }
  return out;
};
export const history = { "sensor.speedtest_download": series(870, 40), "sensor.speedtest_upload": series(600, 30) };
