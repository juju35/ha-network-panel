// The README captures: every tab of the panel, light and dark (screenshots/<file>.png).
export const TABS = ["overview", "devices", "wifi", "dns", "speed", "proxy", "settings"];
export const shots = TABS.flatMap((tab) => [
  { file: `panel-${tab}`, tab, theme: "light", width: 1280 },
  { file: `panel-${tab}-dark`, tab, theme: "dark", width: 1280 },
]);
