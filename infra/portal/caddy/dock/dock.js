// Universal ZAO nav dock. Injected into every *.zaoos.com subdomain via wrapper pages.
// Minimalistic top-sticky thin bar: Portal / Todos / AO / Claude / ZOE / Agents.
// Active surface = gold text + 2px gold underline. No pill fill. Subtle.
(function () {
  if (window.__zaoDockLoaded) return;
  window.__zaoDockLoaded = true;

  const here = (window.location.hostname || "").toLowerCase();
  const path = (window.location.pathname || "").toLowerCase();

  const tiles = [
    { name: "Portal",  url: "https://portal.zaoos.com/",                     match: (h, p) => h === "portal.zaoos.com" && (p === "/" || p === "") },
    { name: "Todos",   url: "https://portal.zaoos.com/todos",                match: (h, p) => h === "portal.zaoos.com" && p.startsWith("/todos") },
    { name: "AO",      url: "https://ao.zaoos.com/",                         match: (h) => h === "ao.zaoos.com" },
    { name: "Claude",  url: "https://claude.zaoos.com/",                    match: (h) => h === "claude.zaoos.com" },
    // ZOE lives in Telegram. Tap = open conversation with @zaoclaw_bot.
    { name: "ZOE",     url: "https://t.me/zaoclaw_bot",                      match: () => false, external: true },
    { name: "Agents",  url: "https://portal.zaoos.com/agents",               match: (h, p) => h === "portal.zaoos.com" && p.startsWith("/agents") },
  ];

  const dock = document.createElement("nav");
  dock.id = "zao-dock";
  dock.setAttribute("aria-label", "ZAO surfaces");

  const style = document.createElement("style");
  style.textContent = [
    // Top-sticky thin bar across the full viewport width.
    "#zao-dock{position:sticky;top:0;left:0;right:0;width:100%;display:flex;align-items:center;justify-content:center;gap:2px;padding:6px 10px;padding-top:calc(env(safe-area-inset-top,0px) + 6px);background:rgba(10,22,40,.75);backdrop-filter:saturate(140%) blur(12px);-webkit-backdrop-filter:saturate(140%) blur(12px);border-bottom:1px solid rgba(255,255,255,.06);z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,system-ui,\"Segoe UI\",sans-serif;pointer-events:auto}",
    // Inactive tab: quiet gray, no weight, no pill.
    "#zao-dock a{display:inline-block;padding:6px 10px;font-size:11px;font-weight:500;color:#a0a9b8;text-decoration:none;line-height:1;letter-spacing:.3px;border-bottom:2px solid transparent;transition:color .15s,border-color .15s,background .15s;-webkit-tap-highlight-color:transparent}",
    "#zao-dock a:hover{color:#e8edf5;background:rgba(255,255,255,.04)}",
    // Active tab: gold text + thin gold underline. No fill.
    "#zao-dock a.active{color:#f5a623;border-bottom-color:#f5a623}",
    "#zao-dock a:active{background:rgba(245,166,35,.08)}",
    // External tab (ZOE in Telegram): subtle \u2197 indicator.
    '#zao-dock a[data-external="1"]::after{content:"\\u2197";margin-left:3px;opacity:.5;font-size:9px}',
    "@media (max-width: 420px){#zao-dock a{padding:6px 8px;font-size:10.5px}}"
  ].join("");

  for (const t of tiles) {
    const a = document.createElement("a");
    a.href = t.url;
    a.textContent = t.name;
    if (t.external) {
      a.setAttribute("data-external", "1");
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    }
    if (t.match(here, path)) a.className = "active";
    dock.appendChild(a);
  }

  const attach = () => {
    document.head.appendChild(style);
    // Insert at the TOP of the body so the sticky bar floats above everything.
    if (document.body.firstChild) {
      document.body.insertBefore(dock, document.body.firstChild);
    } else {
      document.body.appendChild(dock);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
})();
