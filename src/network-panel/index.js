// Entry point: the modules in their original order. scripts/build-frontend.mjs (scripts/bundle.mjs) concatenates them
// in this order into the single module the integration serves.
import "./core.js";
import "./pictures.js";
import "./models.js";
import "./switch.js";
import "./scene.js";
import "./dns-art.js";
import "./styles.js";
import "./panel.js";
// The assembled module's own exports (the other `export`s only join the modules)
export { NETWORK_LANGS, NETWORK_PANEL_EN, NETWORK_PANEL_VERSION, NETWORK_TABS, networkBits, networkDuration, networkEsc, networkRate, networkT } from "./core.js";
export { networkBoxModel, networkRouterKind } from "./models.js";
export { networkDailyPeaks, networkHostState, networkHttp, networkTrackers, NetworkPanel } from "./panel.js";
export { networkSceneSvg } from "./scene.js";
export { networkChassisSvg, networkPortState } from "./switch.js";
