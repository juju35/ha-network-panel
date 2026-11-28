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
    st("sensor.freebox_connection_type", "ftth", { friendly_name: "Freebox Connection type" }),
    st("sensor.freebox_cpu_temperature", 54, { friendly_name: "Freebox Server CPU temperature", unit_of_measurement: "°C", device_class: "temperature" }),
    st("sensor.freebox_switch_temperature", 47, { friendly_name: "Freebox Server Switch temperature", unit_of_measurement: "°C", device_class: "temperature" }),
    st("sensor.freebox_fan_speed", 1820, { friendly_name: "Freebox Server Fan speed", unit_of_measurement: "rpm" }),
    st("sensor.freebox_missed_calls", 2, { friendly_name: "Freebox Missed calls" }),
    st("button.freebox_mark_calls_as_read", "unknown", { friendly_name: "Freebox Mark calls as read" }),
    st("button.freebox_restart", "unknown", { friendly_name: "Freebox Restart", device_class: "restart" }),
    st("sensor.freebox_disk_usage", 38, { friendly_name: "Freebox Server Disk", unit_of_measurement: "%" }),
    st("switch.freebox_wifi", "on", { friendly_name: "Home" }),
    st("switch.iot_wifi", "on", { friendly_name: "IoT" }),
    st("switch.guest_wifi", "off", { friendly_name: "Guest" }),
    ...switchPorts("office_switch", "Office switch", [1, 2, 3, 5, 6, 7, 8]),
    ...switchPorts("garage_switch", "Garage switch", [1, 2, 4, 8]),
    st("sensor.office_switch_rx", 412, { friendly_name: "Office switch RX", unit_of_measurement: "Mbit/s", device_class: "data_rate" }),
    st("sensor.office_switch_tx", 96, { friendly_name: "Office switch TX", unit_of_measurement: "Mbit/s", device_class: "data_rate" }),
    st("sensor.office_switch_uptime", ago(86400 * 12 + 7200), { friendly_name: "Office switch Uptime", device_class: "timestamp" }),
    st("switch.office_switch_poe", "on", { friendly_name: "Office switch PoE power" }),
    st("sensor.upstairs_ap_cpu", 21, { friendly_name: "Upstairs AP CPU utilization", unit_of_measurement: "%" }),
    st("sensor.upstairs_ap_memory", 58, { friendly_name: "Upstairs AP Memory utilization", unit_of_measurement: "%" }),
    st("update.upstairs_ap", "on", { friendly_name: "Upstairs AP", installed_version: "6.6.77", latest_version: "6.7.10" }),
    st("button.upstairs_ap_restart", "unknown", { friendly_name: "Upstairs AP Restart", device_class: "restart" }),
    st("sensor.upstairs_ap_uptime", ago(86400 * 6), { friendly_name: "Upstairs AP Uptime", device_class: "timestamp" }),
    st("sensor.living_room_ap_cpu", 12, { friendly_name: "Living room AP CPU utilization", unit_of_measurement: "%" }),
    st("sensor.living_room_ap_memory", 46, { friendly_name: "Living room AP Memory utilization", unit_of_measurement: "%" }),
    st("update.living_room_ap", "off", { friendly_name: "Living room AP", installed_version: "6.6.77", latest_version: "6.6.77" }),
    st("button.living_room_ap_restart", "unknown", { friendly_name: "Living room AP Restart", device_class: "restart" }),
    st("sensor.upstairs_ap_clients", 15, { friendly_name: "Upstairs AP Clients" }),
    st("sensor.upstairs_ap_temperature", 41, { friendly_name: "Upstairs AP Temperature", unit_of_measurement: "°C", device_class: "temperature" }),
    st("sensor.living_room_ap_clients", 24, { friendly_name: "Living room AP Clients" }),
    st("sensor.adguard_home_dns_queries", 48120, { friendly_name: "AdGuard Home DNS queries", unit_of_measurement: "queries" }),
    st("sensor.adguard_home_dns_queries_blocked", 8850, { friendly_name: "AdGuard Home DNS queries blocked", unit_of_measurement: "queries" }),
    st("sensor.adguard_home_dns_queries_blocked_ratio", 18.4, { friendly_name: "AdGuard Home DNS queries blocked ratio", unit_of_measurement: "%" }),
    st("sensor.adguard_home_average_processing_speed", 12.3, { friendly_name: "AdGuard Home Average processing speed", unit_of_measurement: "ms" }),
    st("sensor.adguard_home_safe_browsing_blocked", 214, { friendly_name: "AdGuard Home Safe browsing blocked", unit_of_measurement: "requests" }),
    st("sensor.adguard_home_parental_control_blocked", 37, { friendly_name: "AdGuard Home Parental control blocked", unit_of_measurement: "requests" }),
    st("sensor.adguard_home_safe_searches_enforced", 129, { friendly_name: "AdGuard Home Safe searches enforced", unit_of_measurement: "requests" }),
    st("sensor.adguard_home_rules_count", 182340, { friendly_name: "AdGuard Home Rules count", unit_of_measurement: "rules" }),
    st("update.adguard_home", "on", { friendly_name: "AdGuard Home", installed_version: "v0.107.61", latest_version: "v0.107.63" }),
    st("button.adguard_home_refresh_filters", "unknown", { friendly_name: "AdGuard Home Refresh filters" }),
    st("switch.adguard_home_protection", "on", { friendly_name: "AdGuard Home Protection" }),
    st("switch.adguard_home_filtering", "on", { friendly_name: "AdGuard Home Filtering" }),
    st("switch.adguard_home_parental_control", "on", { friendly_name: "AdGuard Home Parental control" }),
    st("switch.adguard_home_safe_search", "off", { friendly_name: "AdGuard Home Safe search" }),
    st("sensor.speedtest_download", 890.4, { friendly_name: "SpeedTest Download", unit_of_measurement: "Mbit/s", device_class: "data_rate" }, 5400),
    st("sensor.speedtest_upload", 612.7, { friendly_name: "SpeedTest Upload", unit_of_measurement: "Mbit/s", device_class: "data_rate" }, 5400),
    st("sensor.speedtest_ping", 4, { friendly_name: "SpeedTest Ping", unit_of_measurement: "ms" }, 5400),
    st("sensor.speedtest_jitter", 0.8, { friendly_name: "SpeedTest Jitter", unit_of_measurement: "ms" }, 5400),
    st("binary_sensor.zoraxy_running", "on", { friendly_name: "Zoraxy Running" }),
    st("sensor.zoraxy_proxy_rules", 7, {
      friendly_name: "Zoraxy Proxy rules",
      rules: [...PROXY_HOSTS.map(([h]) => ({ domain: `${h}.example.org`, target: `192.168.1.253:${8000 + h.length}`, enabled: true, tls: true })), { domain: "old.example.org", target: "192.168.1.250:5000", enabled: false, tls: true }],
    }),
    st("switch.zoraxy_https_redirect", "on", { friendly_name: "Zoraxy HTTPS redirect" }),
    st("switch.zoraxy_port_80", "on", { friendly_name: "Zoraxy Port 80 listener" }),
    st("switch.zoraxy_development_mode", "off", { friendly_name: "Zoraxy Development mode" }),
    st("sensor.zoraxy_active_rules", 6, { friendly_name: "Zoraxy Active rules" }),
    // Rule domains: upstream check (problem sensor, on = offline), certificate expiry, expiring flag; docs is down,
    // git is not monitored, auth's certificate expires soon
    ...PROXY_HOSTS.flatMap(([h, up, days]) => [
      st(`binary_sensor.zoraxy_upstream_${h}`, up, { domain: `${h}.example.org`, device_class: "problem" }, up === "on" ? 1800 : 86400 * 5),
      st(`sensor.zoraxy_certificate_${h}`, new Date(NOW + days * 86400000).toISOString(), { domain: `${h}.example.org`, device_class: "timestamp" }),
      st(`binary_sensor.zoraxy_cert_expiring_${h}`, days < 14 ? "on" : "off", { domain: `${h}.example.org`, device_class: "problem" }),
      st(`button.zoraxy_renew_${h}`, "unknown", { domain: `${h}.example.org`, friendly_name: `Renew ${h}.example.org` }),
    ]),
    ...devices.map(([id, name, ip, state, essid, changed], i) =>
      st(`device_tracker.${id}`, state, { friendly_name: name, source_type: "router", ip, mac: MAC(i), host_name: id.replace(/_/g, "-"), ...(essid ? { essid } : { is_wired: true }) }, changed),
    ),
  ].map((s) => [s.entity_id, s]),
);

// Ports the user named (named: true) are watched: the office printer's port is down
const ports = (prefix, name, named = {}) =>
  Array.from({ length: 8 }, (_, i) => ({ n: i + 1, entity: `binary_sensor.${prefix}_port_${i + 1}`, label: named[i + 1] || `${name} Port ${i + 1}`, named: !!named[i + 1] }));

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
      connection: "sensor.freebox_connection_type",
      temperature: "sensor.freebox_cpu_temperature",
      missed_calls: "sensor.freebox_missed_calls",
      mark_calls: "button.freebox_mark_calls_as_read",
      reboot: "button.freebox_restart",
      disk: "sensor.freebox_disk_usage",
    },
    temps: ["sensor.freebox_cpu_temperature", "sensor.freebox_switch_temperature"],
    fans: ["sensor.freebox_fan_speed"],
    wifi: ["switch.freebox_wifi"],
    ports: [],
  },
  routers: [
    { id: "dev_ap1", name: "Living room AP", platform: "unifi", kind: "ap", model: "U6 Lite", manufacturer: "Ubiquiti", sw_version: "6.6.77", url: "", entities: { clients: "sensor.living_room_ap_clients", cpu: "sensor.living_room_ap_cpu", ram: "sensor.living_room_ap_memory", update: "update.living_room_ap", reboot: "button.living_room_ap_restart" }, wifi: ["switch.iot_wifi", "switch.guest_wifi"], ports: [] },
    { id: "dev_ap2", name: "Upstairs AP", platform: "unifi", kind: "ap", model: "U6 Pro", manufacturer: "Ubiquiti", sw_version: "6.6.77", url: "", entities: { clients: "sensor.upstairs_ap_clients", temperature: "sensor.upstairs_ap_temperature", cpu: "sensor.upstairs_ap_cpu", ram: "sensor.upstairs_ap_memory", update: "update.upstairs_ap", reboot: "button.upstairs_ap_restart", uptime: "sensor.upstairs_ap_uptime" }, temps: ["sensor.upstairs_ap_temperature"], wifi: [], ports: [] },
  ],
  switches: [
    { id: "dev_sw1", name: "Office switch", platform: "unifi", kind: "switch", model: "USW Lite 8 PoE", manufacturer: "Ubiquiti", sw_version: "7.1.26", url: "", entities: { rate_down: "sensor.office_switch_rx", rate_up: "sensor.office_switch_tx", uptime: "sensor.office_switch_uptime", power: "switch.office_switch_poe" }, wifi: [], ports: ports("office_switch", "Office switch", { 1: "Router", 2: "NAS", 4: "Printer" }) },
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
    details: ["sensor.adguard_home_safe_browsing_blocked", "sensor.adguard_home_parental_control_blocked", "sensor.adguard_home_safe_searches_enforced", "sensor.adguard_home_rules_count"],
    buttons: ["button.adguard_home_refresh_filters"],
    updates: ["update.adguard_home"],
    switches: ["switch.adguard_home_protection", "switch.adguard_home_filtering", "switch.adguard_home_parental_control", "switch.adguard_home_safe_search"],
  },
  speed: { platform: "speedtestdotcom", title: "Speedtest.net", entities: { download: "sensor.speedtest_download", upload: "sensor.speedtest_upload", ping: "sensor.speedtest_ping", jitter: "sensor.speedtest_jitter" } },
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
      renew: `button.zoraxy_renew_${h}`,
    })),
    controls: ["switch.zoraxy_https_redirect", "switch.zoraxy_port_80", "switch.zoraxy_development_mode"],
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
// The last 24 hours of the tiles, a point every 20 minutes: busier in the evening
const day = (base, swing, phase = 0, busy = true) =>
  Array.from({ length: 73 }, (_, i) => {
    const t = NOW - (72 - i) * 1200000;
    const hour = new Date(t).getUTCHours();
    const evening = !busy ? 1 : hour >= 18 && hour <= 23 ? 1.6 : hour < 7 ? 0.35 : 1;
    return { s: String(Math.max(0, Math.round((base + Math.sin(i / 4 + phase) * swing) * evening * 10) / 10)), lu: t / 1000 };
  });
export const history = {
  "sensor.speedtest_download": series(870, 40),
  "sensor.speedtest_upload": series(600, 30),
  "sensor.freebox_download_speed": day(26000, 9000),
  "sensor.freebox_upload_speed": day(4000, 1500, 1),
  "sensor.freebox_cpu_temperature": day(52, 3, 2, false),
  "sensor.freebox_switch_temperature": day(46, 2, 3, false),
  "sensor.office_switch_rx": day(280, 120),
  "sensor.office_switch_tx": day(70, 30, 2),
  "sensor.upstairs_ap_cpu": day(18, 6, 1),
  "sensor.upstairs_ap_memory": day(57, 2, 0, false),
  "sensor.upstairs_ap_temperature": day(40, 2, 4, false),
  "sensor.living_room_ap_cpu": day(11, 4, 2),
  "sensor.living_room_ap_memory": day(45, 2, 1, false),
  "sensor.adguard_home_dns_queries": day(30000, 10000).map((p, i) => ({ ...p, s: String(Math.round(i * 660)) })),
  "sensor.adguard_home_dns_queries_blocked": day(5000, 1000).map((p, i) => ({ ...p, s: String(Math.round(i * 121)) })),
  "sensor.adguard_home_dns_queries_blocked_ratio": day(18, 2, 0, false),
  "sensor.adguard_home_average_processing_speed": day(12, 3, 1, false),
};
