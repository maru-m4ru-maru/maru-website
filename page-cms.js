/* PAGE CMS RENDERER */
(function () {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("page");
  if (!slug) return;

  function getPages(data) {
    return Array.isArray(data?.pages) ? data.pages : [];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderNotFound() {
    const container = document.getElementById("siteSections");
    if (!container) return;
    document.title = `Page not found - ${siteData?.site?.name || "maru_m4ru_maru"}`;
    container.innerHTML = `
      <section class="section"><div class="container">
        <div class="section-heading"><div><span class="eyebrow muted">404</span><h2>ページが見つかりません</h2></div></div>
        <p>指定されたページは存在しないか、現在公開されていません。</p>
        <p style="margin-top:20px;"><a class="button button-dark" href="./">Homeへ戻る ↗</a></p>
      </div></section>`;
  }

  function renderPage(page) {
    if (!page || page.enabled === false) {
      renderNotFound();
      return;
    }

    document.title = `${page.title || "Page"} - ${siteData?.site?.name || "maru_m4ru_maru"}`;
    const meta = document.getElementById("metaDescription");
    if (meta) meta.setAttribute("content", page.description || siteData?.site?.description || "");

    const container = document.getElementById("siteSections");
    if (!container) return;
    container.innerHTML = "";

    const sections = Array.isArray(page.sections)
      ? page.sections.filter(section => section.enabled !== false)
      : [];

    for (const section of sections) {
      let html = "";
      switch (section.type) {
        case "hero": html = typeof renderHero === "function" ? renderHero(section) : ""; break;
        case "stats": html = typeof renderStats === "function" ? renderStats(section) : ""; break;
        case "projects": html = typeof renderProjects === "function" ? renderProjects(section) : ""; break;
        case "updates": html = typeof renderUpdates === "function" ? renderUpdates(section) : ""; break;
        case "embeds": html = typeof renderEmbeds === "function" ? renderEmbeds(section) : ""; break;
        case "links": html = typeof renderLinks === "function" ? renderLinks(section) : ""; break;
        case "github": html = typeof renderGithub === "function" ? renderGithub(section) : ""; break;
        case "text":
          html = typeof renderText === "function" ? renderText(section) : `
            <section class="section"><div class="container"><div class="section-heading"><h2>${escapeHtml(section.title || "")}</h2></div><p>${escapeHtml(section.description || "")}</p></div></section>`;
          break;
      }
      if (html) container.insertAdjacentHTML("beforeend", html);
    }
  }

  const start = setInterval(() => {
    if (typeof siteData !== "undefined" && siteData) {
      clearInterval(start);
      const page = getPages(siteData).find(item => String(item.slug || "") === slug);
      if (page) renderPage(page);
      else renderNotFound();
    }
  }, 20);

  setTimeout(() => clearInterval(start), 10000);
})();
