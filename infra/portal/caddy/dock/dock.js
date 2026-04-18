// Universal ZAO nav dock. Injected into every *.zaoos.com subdomain via wrapper pages.
// Renders a floating bottom pill bar with Portal / Todos / AO / Claude / Tests.
// Highlights the current surface based on hostname + path.
(function () {
  if (window.__zaoDockLoaded) return;
  window.__zaoDockLoaded = true;

  const here = (window.location.hostname || "").toLowerCase();
  const path = (window.location.pathname || "").toLowerCase();

  const tiles = [
    { name: "Portal",  host: "portal.zaoos.com", url: "https://portal.zaoos.com/",               match: (h, p) => h === "portal.zaoos.com" && p === "/" },
    { name: "Todos",   host: "portal.zaoos.com", url: "https://portal.zaoos.com/todos",          match: (h, p) => h === "portal.zaoos.com" && p.startsWith("/todos") },
    { name: "AO",      host: "ao.zaoos.com",     url: "https://ao.zaoos.com/",                   match: (h) => h === "ao.zaoos.com" },
    { name: "Claude",  host: "claude.zaoos.com", url: "https://claude.zaoos.com/",               match: (h) => h === "claude.zaoos.com" },
    { name: "Tests",   host: "portal.zaoos.com", url: "https://portal.zaoos.com/test-checklist", match: (h, p) => h === "portal.zaoos.com" && p.includes("test-checklist") },
  ];

  const dock = document.createElement("div");
  dock.id = "zao-dock";
  dock.setAttribute("role", "navigation");
  dock.setAttribute("aria-label", "ZAO surfaces");

  const style = document.createElement("style");
  style.textContent = [
    "#zao-dock{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 6px);transform:translateX(-50%);display:flex;gap:4px;padding:4px;background:rgba(10,22,40,.92);backdrop-filter:saturate(140%) blur(10px);-webkit-backdrop-filter:saturate(140%) blur(10px);border:1px solid rgba(245,166,35,.22);border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.35);z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,system-ui,\"Segoe UI\",sans-serif;pointer-events:auto}",
    "#zao-dock a{display:block;padding:8px 14px;font-size:12px;font-weight:600;color:#f5f4ed;text-decoration:none;border-radius:999px;line-height:1;transition:background .15s,color .15s;-webkit-tap-highlight-color:transparent}",
    "#zao-dock a:active{background:rgba(245,166,35,.15)}",
    "#zao-dock a.active{background:#f5a623;color:#0a1628}",
    "@media (max-width: 380px){#zao-dock a{padding:8px 10px;font-size:11px}}"
  ].join("");

  for (const t of tiles) {
    const a = document.createElement("a");
    a.href = t.url;
    a.textContent = t.name;
    if (t.match(here, path)) a.className = "active";
    dock.appendChild(a);
  }

  const attach = () => {
    document.head.appendChild(style);
    document.body.appendChild(dock);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
})();
