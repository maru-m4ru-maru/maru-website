/* Public CMS enhancements */
(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function safeUrl(value) { return typeof value === "string" && value.trim() ? value.trim() : "#"; }
  function isPublished(page) {
    if (!page || page.enabled === false) return false;
    return page.status ? page.status === "published" : true;
  }
  function pageHref(page) { return `./?page=${encodeURIComponent(page.slug || "")}`; }
  function upsertMeta(name, content, property) {
    const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
    let meta = document.head.querySelector(selector);
    if (!meta) { meta = document.createElement("meta"); if (property) meta.setAttribute("property", property); else meta.setAttribute("name", name); document.head.appendChild(meta); }
    meta.setAttribute("content", content || "");
  }
  function applyDesign(data) {
    const d = data.design || {}, root = document.documentElement;
    if (d.accent) root.style.setProperty("--cms-accent", d.accent);
    if (d.background) root.style.setProperty("--cms-background", d.background);
    if (d.surface) root.style.setProperty("--cms-surface", d.surface);
    if (d.text) root.style.setProperty("--cms-text", d.text);
    if (d.muted) root.style.setProperty("--cms-muted", d.muted);
    if (d.radius) root.style.setProperty("--cms-radius", `${Number(d.radius) || 16}px`);
    if (d.maxWidth) root.style.setProperty("--cms-max-width", `${Number(d.maxWidth) || 1180}px`);
  }
  function applyNavigation(data) {
    const nav = document.getElementById("siteNavigation"); if (!nav) return;
    const custom = Array.isArray(data.navigation) ? data.navigation.filter(item => item && item.enabled !== false) : [];
    const pages = Array.isArray(data.pages) ? data.pages.filter(isPublished).filter(page => page.showInNavigation) : [];
    const merged = [...custom]; const seen = new Set(custom.map(item => String(item.href || "")));
    pages.forEach(page => { const href = pageHref(page); if (seen.has(href)) return; merged.push({ label: page.navLabel || page.title, href, enabled: true, newTab: false }); });
    nav.innerHTML = merged.map(item => `<a class="nav-link" href="${escapeHtml(safeUrl(item.href))}"${item.newTab ? ' target="_blank" rel="noopener noreferrer"' : ""}><span>${escapeHtml(item.label || "Link")}</span></a>`).join("");
  }
  function applySeo(data) {
    const site = data.site || {}, globalSeo = data.seo || {}, params = new URLSearchParams(location.search), slug = params.get("page");
    const page = slug && Array.isArray(data.pages) ? data.pages.find(item => String(item.slug || "") === slug) : null;
    const title = page?.seo?.title || page?.title || site.name || "maru_m4ru_maru";
    const suffix = page?.seo?.title ? "" : (globalSeo.titleSuffix || " - Official Website");
    const description = page?.seo?.description || page?.description || globalSeo.defaultDescription || site.description || "";
    const image = page?.seo?.ogImage || globalSeo.ogImage || site.avatar || "";
    document.title = `${title}${suffix}`;
    upsertMeta("description", description);
    upsertMeta("robots", page?.seo?.noindex ? "noindex,nofollow" : (globalSeo.robots || "index,follow"));
    upsertMeta("", document.title, "og:title"); upsertMeta("", description, "og:description"); upsertMeta("", image, "og:image"); upsertMeta("", location.href, "og:url");
  }
  function init(data) { applyDesign(data); applyNavigation(data); applySeo(data); }
  let attempts = 0;
  const timer = setInterval(() => { attempts += 1; if (typeof siteData !== "undefined" && siteData) { clearInterval(timer); init(siteData); } else if (attempts > 300) clearInterval(timer); }, 25);
})();