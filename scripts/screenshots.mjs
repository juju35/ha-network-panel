// Renders the sidebar panel with the mock home network and saves the README screenshots.
// Usage: npm run screenshots (CHROMIUM_PATH=/path/to/chrome to use an installed browser)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { history, inventory, NOW, states } from "./mock-states.mjs";
import { shots } from "./screenshot-shots.mjs";
import { writeIfChanged } from "./screenshot-write.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const frontend = `${root}custom_components/network_panel/frontend/`;
// The panel is an ES module: the page is served from a fake origin whose /network_panel/ files come from the repository.
const ORIGIN = "http://ha.test";

const THEMES = {
  light: {
    "--primary-background-color": "#f3f4f7",
    "--secondary-background-color": "#f1f3f6",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#1f2328",
    "--secondary-text-color": "#5b6470",
    "--divider-color": "rgba(0,0,0,.12)",
  },
  dark: {
    "--primary-background-color": "#111111",
    "--secondary-background-color": "#232428",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--divider-color": "rgba(225,225,225,.12)",
  },
};

const pageHtml = (theme, width) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { --primary-color: #03a9f4; ${Object.entries(THEMES[theme]).map(([k, v]) => `${k}:${v};`).join("")} }
  body { margin: 0; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${width}px; }
</style></head><body><div id="root"></div></body></html>`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

for (const s of shots) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: s.width, height: 900 } });
  await page.clock.setFixedTime(NOW);
  page.on("pageerror", (err) => {
    console.error(`${s.file}: ${err.message}`);
    process.exitCode = 1;
  });
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/network_panel/network-panel.js") return route.fulfill({ contentType: "text/javascript", body: readFileSync(`${frontend}network-panel.js`, "utf8") });
    if (path.startsWith("/network_panel/i18n/")) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ contentType: "text/html", body: pageHtml(s.theme, s.width) });
  });
  await page.goto(`${ORIGIN}/`);
  await page.addScriptTag({ url: "/network_panel/network-panel.js", type: "module" });
  await page.evaluate(
    async ({ s, states, inventory, history }) => {
      const hass = {
        states,
        language: "en",
        locale: { language: "en" },
        user: { is_admin: true },
        themes: { darkMode: s.theme === "dark" },
        callWS: async (msg) => (msg.type === "network_panel/inventory" ? inventory : msg.type === "history/history_during_period" ? history : { settings: inventory.settings }),
        callService: async () => {},
      };
      await customElements.whenDefined("network-panel");
      const el = document.createElement("network-panel");
      el.panel = { url_path: "network", config: { version: "test" } };
      el.route = { path: `/${s.tab}` };
      el.hass = hass;
      document.getElementById("root").appendChild(el);
    },
    { s, states, inventory, history },
  );
  await page.waitForTimeout(700);
  const box = await page.locator("#root").boundingBox();
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: s.width, height: Math.ceil(box.height) }, animations: "disabled" });
  // Rewritten only when the pixels change: an identical picture never shows up as a modified file.
  const written = writeIfChanged(`${root}screenshots/${s.file}.png`, png);
  console.log(`screenshots/${s.file}.png${written ? "" : " (unchanged)"}`);
  await page.close();
}

await browser.close();
