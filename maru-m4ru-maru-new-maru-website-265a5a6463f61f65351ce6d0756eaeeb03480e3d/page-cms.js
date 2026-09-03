/* PAGE CMS RENDERER */
(function () {
  "use strict";
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("page");
  if (!slug) return;

  function getPages(data) { return Array.isArray(data?.pages) ? data.pages : []; }
  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function isPublished(page) {
    if (!page || page.enabled === false) return false;
    return page.status ? page.status === "published" : true;
  }
  function renderNotFound() {
    const container = document.getElementById("siteSections");
    if (!container) return;
    document.title = `Page not found - ${siteData?.site?.name || "maru_m4ru_maru"}`;
    container.innerHTML = `<section class="section"><div class="container"><div class="section-heading"><div><span class="eyebrow muted">404</span><h2>ページが見つかりません</h2></div></div><p>指定されたページは存在しないか、現在公開されていません。</p><p style="margin-top:20px;"><a class="button button-dark" href="./">Homeへ戻る ↗</a></p></div></section>`;
  }
  function renderCustomSection(section) {
    if (section.type === "image") return `<section class="section"><div class="container"><div class="section-heading"><div><span class="eyebrow muted">MEDIA</span><h2>${escapeHtml(section.title || "Image")}</h2></div></div>${section.url ? `<figure style="margin:0;"><img src="${escapeHtml(section.url)}" alt="${escapeHtml(section.alt || section.title || "")}" loading="lazy" style="display:block;width:100%;height:auto;border-radius:var(--cms-radius,16px);"></figure>` : ""}${section.description ? `<p style="margin-top:14px;white-space:pre-wrap;">${escapeHtml(section.description)}</p>` : ""}</div></section>`;
    if (section.type === "quote") return `<section class="section"><div class="container"><blockquote style="margin:0;padding:24px;border-left:4px solid var(--cms-accent,#111318);background:rgba(0,0,0,.03);border-radius:var(--cms-radius,16px);font-size:1.2rem;line-height:1.8;"><p style="margin:0;white-space:pre-wrap;">${escapeHtml(section.description || section.title || "")}</p></blockquote></div></section>`;
    if (section.type === "button") return `<section class="section"><div class="container"><div class="section-heading"><div><h2>${escapeHtml(section.title || "Link")}</h2></div></div>${section.description ? `<p style="white-space:pre-wrap;">${escapeHtml(section.description)}</p>` : ""}${section.url ? `<p style="margin-top:20px;"><a class="button button-dark" href="${escapeHtml(section.url)}"${section.newTab ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(section.title || "Open")} ↗</a></p>` : ""}</div></section>`;
    return "";
  }
  function renderPage(page) {
    if (!isPublished(page)) { renderNotFound(); return; }
    const container = document.getElementById("siteSections");
    if (!container) return;
    const pageTitle = page.seo?.title || page.title || "Page";
    const baseName = siteData?.site?.name || "maru_m4ru_maru";
    document.title = `${pageTitle} - ${baseName}`;
    const meta = document.getElementById("metaDescription");
    if (meta) meta.setAttribute("content", page.seo?.description || page.description || siteData?.site?.description || "");
    container.innerHTML = "";
    const sections = Array.isArray(page.sections) ? page.sections.filter(section => section.enabled !== false) : [];
    for (const section of sections) {
      let html = "";
      switch (section.type) {
        case "hero": html = typeof renderHero === "function" ? renderHero(section) : ""; break;
        case "stats": html = typeof renderStats === "function" ? renderStats(section) : ""; break;
        case "projects": html = typeof renderProjects === "function" ? renderProjects(section) : ""; break;
        case "updates": html = typeof renderUpdates === "function" ? renderUpdates(section) : ""; break;
        case "embeds": html = typeof renderEmbeds === "function" ? renderEmbeds() : ""; break;
        case "links": html = typeof renderLinks === "function" ? renderLinks() : ""; break;
        case "github": html = typeof renderGithub === "function" ? renderGithub(section) : ""; break;
        case "text": html = typeof renderText === "function" ? renderText(section) : `<section class="section"><div class="container"><div class="section-heading"><h2>${escapeHtml(section.title || "")}</h2></div><p style="white-space:pre-wrap;">${escapeHtml(section.description || "")}</p></div></section>`; break;
        case "image": case "quote": case "button": html = renderCustomSection(section); break;
      }
      if (html) container.insertAdjacentHTML("beforeend", html);
    }
  }

  const start = setInterval(() => {
    if (typeof siteData !== "undefined" && siteData) {
      clearInterval(start);
      const page = getPages(siteData).find(item => String(item.slug || "") === slug);
      if (page) renderPage(page); else renderNotFound();
    }
  }, 20);
  setTimeout(() => clearInterval(start), 10000);
})();