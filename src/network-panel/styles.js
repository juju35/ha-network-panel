// The panel's stylesheet: the ha-* card charter (illustrated banner, pill tabs, rounded tiles with a soft shadow, big
// numbers, outlined buttons, status pills), on Home Assistant's theme variables so a dark theme stays readable.
export const NETWORK_PANEL_STYLE = `
:host { display:block; min-height:100vh; background:var(--primary-background-color); color:var(--primary-text-color);
  font-family:var(--ha-font-family-body, Roboto, "Segoe UI", Helvetica, Arial, sans-serif);
  --nw-accent:#2f6fde; --nw-ok:#1e8e5a; --nw-warn:#c77700; --nw-bad:#d93838; --nw-idle:#8a929c;
  --nw-tile:var(--card-background-color, #fff); --nw-soft:var(--secondary-background-color, #f3f5f8);
  --nw-muted:var(--secondary-text-color, #5b6470); --nw-line:var(--divider-color, rgba(0,0,0,.12));
  --hs-top:#d9dce1; --hs-bottom:#b9bec6; --hs-edge:#8f96a1; --hs-text:#4a525c; }
:host(.night) { --nw-accent:#7ea4f2; --nw-ok:#5fd39b; --nw-warn:#f5b451; --nw-bad:#f58a8a;
  --hs-top:#4a505b; --hs-bottom:#30343c; --hs-edge:#22252b; --hs-text:#d0d4da; }
* { box-sizing:border-box; }
button { font:inherit; color:inherit; }
.banner { position:relative; height:90px; overflow:hidden; background:#e7ecfb; }
:host(.night) .banner { background:#1b1e3a; }
.banner::after { content:""; position:absolute; left:0; right:0; bottom:0; height:10px; background:#a9b8df; }
:host(.night) .banner::after { background:#3a4170; }
.banner .scene { position:absolute; right:58px; bottom:0; height:90px; width:560px; max-width:100%; -webkit-mask-image:linear-gradient(to right, transparent, #000 22%); mask-image:linear-gradient(to right, transparent, #000 22%); }
.head { position:absolute; z-index:1; inset:0 0 10px 0; display:flex; align-items:center; gap:14px; padding:0 16px 0 20px; min-width:0; }
.menu { width:38px; height:38px; border:0; border-radius:50%; background:transparent; cursor:pointer; display:grid; place-items:center; color:#1f2328; }
:host(.night) .menu { color:#fff; }
.ico { width:46px; height:46px; flex:none; border-radius:50%; background:#fff; box-shadow:0 2px 8px rgba(47,111,222,.2); display:grid; place-items:center; color:var(--nw-accent); }
:host(.night) .ico { background:rgba(255,255,255,.12); box-shadow:inset 0 0 0 1px rgba(255,255,255,.16); }
.ico svg, .menu svg, .hbtn svg { width:22px; height:22px; fill:currentColor; }
.htext { min-width:0; }
.ttl { display:flex; align-items:center; gap:10px; font-size:21px; font-weight:800; letter-spacing:-.01em; color:#1f2328; }
:host(.night) .ttl { color:#fff; }
.sub { font-size:13px; color:#4f5761; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
:host(.night) .sub { color:rgba(255,255,255,.78); }
.pill { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; border-radius:999px; padding:4px 10px; white-space:nowrap; background:color-mix(in srgb, var(--pc, var(--nw-ok)) 14%, transparent); color:var(--pc, var(--nw-ok)); }
.head .pill { background:#fff; box-shadow:0 1px 4px rgba(31,35,40,.1); }
:host(.night) .head .pill { background:rgba(255,255,255,.12); box-shadow:none; }
.pill .dot { width:7px; height:7px; border-radius:50%; background:currentColor; }
.pill.ok { --pc:var(--nw-ok); } .pill.warn { --pc:var(--nw-warn); } .pill.bad { --pc:var(--nw-bad); } .pill.idle { --pc:var(--nw-idle); }
.hbtn { margin-left:auto; width:38px; height:38px; flex:none; border-radius:50%; border:0; background:#fff; box-shadow:0 1px 4px rgba(31,35,40,.12); color:#4f5761; cursor:pointer; display:grid; place-items:center; }
.hbtn svg { width:18px; height:18px; }
:host(.night) .hbtn { background:rgba(255,255,255,.12); color:#fff; box-shadow:none; }
.tabs { display:flex; gap:6px; padding:10px 20px; background:var(--nw-tile); border-bottom:1px solid var(--nw-line); overflow-x:auto; scrollbar-width:none; }
.tab { border:0; border-radius:999px; padding:8px 14px; font-size:13.5px; color:var(--nw-muted); background:transparent; cursor:pointer; white-space:nowrap; }
.tab.on { color:var(--nw-accent); font-weight:700; background:color-mix(in srgb, var(--nw-accent) 13%, transparent); }
.body { padding:20px 24px 32px; display:grid; gap:16px; align-content:start; }
.grid2 { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; align-items:start; }
.col { display:grid; gap:16px; min-width:0; }
@media (max-width: 720px) { .grid2, .ovgrid { grid-template-columns:minmax(0, 1fr); } .body { padding:16px 12px 24px; } .banner .scene { opacity:.55; } }
.c { background:var(--nw-tile); border-radius:20px; padding:16px; box-shadow:0 1px 2px rgba(31,35,40,.05), 0 6px 18px rgba(47,111,222,.07); min-width:0; }
.h { display:flex; justify-content:space-between; align-items:center; gap:10px; margin:0 0 12px; font-size:15px; font-weight:700; }
.h .s { font-weight:400; }
.s { font-size:12px; } .m { color:var(--nw-muted); }
.r { display:flex; justify-content:space-between; align-items:center; gap:10px; }
.t { background:var(--nw-soft); border-radius:12px; padding:9px 12px; min-width:0; }
.list { display:grid; gap:8px; font-size:13px; }
.big { font-size:26px; font-weight:800; letter-spacing:-.02em; line-height:1.15; }
.kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:8px; }
.kpis .t b { display:block; font-size:20px; font-weight:800; letter-spacing:-.01em; margin-top:2px; }
.b { font-size:12.5px; font-weight:600; border:1px solid var(--nw-line); background:transparent; border-radius:999px; padding:6px 12px; min-height:34px; cursor:pointer; white-space:nowrap; }
.b:hover { background:var(--nw-soft); }
.b.on { color:var(--nw-accent); border-color:color-mix(in srgb, var(--nw-accent) 45%, transparent); background:color-mix(in srgb, var(--nw-accent) 8%, transparent); }
.b.bad { color:var(--nw-bad); border-color:color-mix(in srgb, var(--nw-bad) 40%, transparent); }
.chips { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.empty { padding:28px 16px; text-align:center; color:var(--nw-muted); font-size:13.5px; line-height:1.5; }
.wifi { display:flex; align-items:center; gap:10px; background:var(--nw-soft); border-radius:12px; padding:9px 12px; }
.hosts { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:8px; font-size:13px; }
.hosts.one { grid-template-columns:minmax(0, 1fr); }
.host a { color:inherit; text-decoration:none; } .host a:hover { text-decoration:underline; }
.wifi .grow { flex:1; min-width:0; }
.wifi .grow b, .wifi .grow div { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dnsart { height:58px; border-radius:14px; background:#eef3fb; overflow:hidden; display:flex; justify-content:flex-end; margin:-4px -4px 12px; }
:host(.night) .dnsart { background:#252a44; }
.dnsart svg { height:100%; width:auto; }
table { width:100%; border-collapse:collapse; font-size:13px; }
th { text-align:left; font-size:11.5px; color:var(--nw-muted); font-weight:600; text-transform:uppercase; letter-spacing:.04em; padding:8px 10px; border-bottom:1px solid var(--nw-line); }
td { padding:9px 10px; border-bottom:1px solid var(--nw-line); white-space:nowrap; }
tr:last-child td { border-bottom:0; }
.scroll { overflow-x:auto; }
.search { font:inherit; font-size:13px; border:1px solid var(--nw-line); border-radius:999px; padding:7px 14px; min-height:34px; background:var(--nw-tile); color:var(--primary-text-color); min-width:200px; }
.ok { color:var(--nw-ok); } .bad { color:var(--nw-bad); } .warn { color:var(--nw-warn); }
.chassis .hs-vent { fill:var(--hs-edge); opacity:.55; }
.chassis .hs-slot { fill:#00000022; }
.chassis .hs-edge { stroke:var(--hs-edge); }
.chassis .hs-label { fill:var(--hs-text); font-family:Arial, Helvetica, sans-serif; }
.chassis .hs-divider { fill:var(--hs-edge); }
.chassis .hs-top { stop-color:var(--hs-top); } .chassis .hs-bottom { stop-color:var(--hs-bottom); }
.swc .chassis { width:100%; height:auto; display:block; margin:4px 0 10px; }
.chart { width:100%; height:180px; display:block; }
.chart .grid { stroke:var(--nw-line); stroke-width:1; }
.chart .dn { stroke:var(--nw-ok); fill:none; stroke-width:2.5; }
.chart .up { stroke:var(--nw-accent); fill:none; stroke-width:2.5; }
.legend { display:flex; gap:14px; font-size:12px; color:var(--nw-muted); }
.legend i { display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:5px; vertical-align:-1px; }
.ovgrid { display:grid; grid-template-columns:minmax(0, 1.25fr) minmax(0, 1fr); gap:16px; align-items:start; }
.sect { margin:14px 0 8px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; font-size:11px; }
.plan { padding:14px; }
.pnodes { display:flex; align-items:stretch; gap:0; overflow-x:auto; scrollbar-width:thin; }
.pnode { flex:1 1 0; min-width:150px; border:0; border-radius:16px; background:var(--nw-soft); padding:10px; text-align:left; cursor:pointer; display:flex; flex-direction:column; gap:2px; }
.pnode:hover { background:color-mix(in srgb, var(--nw-accent) 8%, var(--nw-soft)); }
.pnode b { font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:6px; }
.pnode .pl { font-size:12px; color:var(--nw-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pnode .chip { align-self:flex-start; margin-top:6px; }
.ppic { height:58px; border-radius:12px; background:#eef3fb; display:flex; align-items:center; justify-content:center; overflow:hidden; padding:4px 8px; }
:host(.night) .ppic { background:#252a44; }
.ppic img { max-width:100%; max-height:100%; display:block; }
.ppic .chassis { width:100%; height:auto; max-height:50px; }
.globe { width:100%; height:100%; display:grid; place-items:center; color:var(--nw-ok); background:color-mix(in srgb, var(--nw-ok) 12%, transparent); border-radius:10px; }
.globe.down { color:var(--nw-bad); background:color-mix(in srgb, var(--nw-bad) 12%, transparent); }
.globe svg { width:32px; height:32px; fill:currentColor; }
.plink { flex:0 0 22px; align-self:center; height:2px; background:repeating-linear-gradient(90deg, #9aa7c7 0 4px, transparent 4px 8px); }
.arow { display:flex; align-items:center; gap:10px; background:var(--nw-soft); border:0; border-radius:12px; padding:9px 12px; font-size:13px; text-align:left; width:100%; min-height:40px; }
button.arow { cursor:pointer; } button.arow:hover { background:color-mix(in srgb, var(--nw-accent) 8%, var(--nw-soft)); }
.arow.bad { background:color-mix(in srgb, var(--nw-bad) 9%, var(--nw-soft)); } .arow.warn { background:color-mix(in srgb, var(--nw-warn) 10%, var(--nw-soft)); }
.arow.bad, .arow.warn, .g.bad, .g.warn { color:inherit; }
.arow .grow { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; }
.d { width:9px; height:9px; border-radius:50%; flex:none; background:var(--nw-idle); }
.d.ok { background:var(--nw-ok); } .d.bad { background:var(--nw-bad); } .d.warn { background:var(--nw-warn); }
.gs { display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px; }
.gs.g2 { grid-template-columns:repeat(2, minmax(0, 1fr)); }
.g { position:relative; overflow:hidden; border:0; border-radius:12px; background:var(--nw-soft); padding:9px 12px 20px; text-align:left; min-height:72px; display:flex; flex-direction:column; justify-content:center; }
button.g { cursor:pointer; } button.g:disabled { cursor:default; }
.g > * { position:relative; }
.g .gl { font-size:12px; color:var(--nw-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.g b { font-size:19px; font-weight:800; letter-spacing:-.01em; white-space:nowrap; }
.g.warn b { color:var(--nw-warn); } .g.bad b { color:var(--nw-bad); }
.g .spark { position:absolute; inset:auto 0 0 0; width:100%; height:38%; }
.spark polygon { fill:color-mix(in srgb, var(--nw-accent) 12%, transparent); } .spark polyline { fill:none; stroke:color-mix(in srgb, var(--nw-accent) 55%, transparent); stroke-width:1.5; vector-effect:non-scaling-stroke; }
.g.warn .spark polygon { fill:color-mix(in srgb, var(--nw-warn) 14%, transparent); } .g.warn .spark polyline { stroke:var(--nw-warn); }
.g.bad .spark polygon { fill:color-mix(in srgb, var(--nw-bad) 12%, transparent); } .g.bad .spark polyline { stroke:var(--nw-bad); }
.chip { display:inline-flex; align-items:center; font-size:12px; font-weight:600; border-radius:999px; padding:4px 10px; border:1px solid var(--nw-line); background:transparent; white-space:nowrap; color:var(--nw-muted); }
.chip.ok { color:var(--nw-ok); border-color:color-mix(in srgb, var(--nw-ok) 40%, transparent); } .chip.warn { color:var(--nw-warn); border-color:color-mix(in srgb, var(--nw-warn) 45%, transparent); } .chip.bad { color:var(--nw-bad); border-color:color-mix(in srgb, var(--nw-bad) 40%, transparent); }
button.chip { cursor:pointer; min-height:32px; }
.tg { flex:none; width:42px; height:24px; border-radius:999px; border:1px solid var(--nw-line); background:var(--nw-tile); position:relative; cursor:pointer; padding:0; }
.tg::after { content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:var(--nw-idle); transition:left .15s; }
.tg.on { border-color:color-mix(in srgb, var(--nw-ok) 55%, transparent); } .tg.on::after { left:21px; background:var(--nw-ok); }
.tg:disabled { opacity:.45; cursor:default; }
.dhead { display:flex; align-items:center; gap:14px; margin-bottom:14px; flex-wrap:wrap; }
.dhead .grow { flex:1; min-width:200px; }
.dpic { width:150px; height:84px; flex:none; border-radius:14px; background:#eef3fb; display:flex; align-items:center; justify-content:center; padding:6px; }
.dpic.sm { width:96px; height:54px; }
:host(.night) .dpic { background:#252a44; }
.dpic a { display:flex; width:100%; height:100%; align-items:center; justify-content:center; }
.dpic img { max-width:100%; max-height:100%; display:block; }
.dname { font-size:17px; font-weight:800; display:flex; flex-direction:column; gap:2px; margin-bottom:8px; }
.dname .s { font-weight:400; }
.k3 { grid-template-columns:repeat(3, minmax(0, 1fr)); }
.bar { height:7px; border-radius:99px; background:var(--nw-line); overflow:hidden; margin-top:6px; }
.bar i { display:block; height:100%; background:var(--nw-accent); border-radius:99px; }
.pnames { margin:0 0 12px; }
.dialrow { display:flex; align-items:center; gap:16px; margin-bottom:12px; }
.dial { width:180px; height:auto; flex:none; }
.dial path { fill:none; stroke-width:14; stroke-linecap:round; } .dial .bg { stroke:var(--nw-line); } .dial .fg { stroke:var(--nw-ok); }
.dial line { stroke:var(--primary-text-color); stroke-width:3; stroke-linecap:round; } .dial circle { fill:var(--primary-text-color); }
label.set { display:flex; align-items:center; gap:10px; font-size:13.5px; padding:6px 0; cursor:pointer; }
.ask { position:fixed; inset:0; background:rgba(0,0,0,.35); display:grid; place-items:center; z-index:5; }
.ask .c { width:min(380px, calc(100vw - 32px)); }
.ask .chips { justify-content:flex-end; margin-top:14px; }
`;
