// Imports the panel (the assembled ES module) with just enough browser stubs to define its element.
const defined = new Map();
globalThis.HTMLElement ??= class {
  constructor() {
    this.classList = { toggle() {}, add() {}, remove() {} };
  }
  attachShadow() {
    const listeners = [];
    this.shadowRoot = {
      innerHTML: "",
      activeElement: null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: (type, fn) => listeners.push([type, fn]),
    };
    return this.shadowRoot;
  }
  dispatchEvent(ev) {
    (this.events ||= []).push(ev);
  }
};
globalThis.customElements ??= { get: (n) => defined.get(n), define: (n, c) => defined.set(n, c) };
globalThis.CustomEvent ??= class {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
};
globalThis.history ??= { replaceState() {}, pushState() {} };
globalThis.window ??= { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} };
// Language files are not fetched in tests: the panel stays in English
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });

export const lib = await import(new URL("../custom_components/network_panel/frontend/network-panel.js", import.meta.url));
export const defined_elements = defined;
