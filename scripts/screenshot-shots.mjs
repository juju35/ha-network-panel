// The README captures: every tab of the panel, light and dark (screenshots/<file>.png): panel-overview,
// panel-internet, panel-devices, panel-wifi, panel-dns, panel-speed, panel-proxy, panel-settings.
export const TABS = ["overview", "internet", "devices", "wifi", "dns", "speed", "proxy", "settings"];
export const shots = TABS.flatMap((tab) => [
  { file: `panel-${tab}`, tab, theme: "light", width: 1280 },
  { file: `panel-${tab}-dark`, tab, theme: "dark", width: 1280 },
]);
