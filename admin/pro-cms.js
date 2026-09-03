/* maru CMS Pro workspace */
(function () {
  "use strict";

  const MAX_REVISIONS = 12;
  const DRAFT_KEY = "maru_cms_local_draft_v2";
  const NAV_EXTRAS = [
    ["media", "メディア", "MEDIA", "◇"],
    ["design", "デザイン", "DESIGN", "✦"],
    ["seo", "SEO", "SEO", "⌕"],
    ["revisions", "履歴", "REVISIONS", "◷"]
  ];

  let undoStack = [];
  let redoStack = [];
  let lastObserved = null;
  let autosaveTimer = 0;
  let revisionCounter = 0;

  function safeClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function ensureArray(name) {
    if (!Array.isArray(siteData[name])) siteData[name] = [];
    return siteData[name];
  }

  function ensureProData() {
    if (!siteData) return;
    siteData.pages = Array.isArray(siteData.pages) ? siteData.pages : [];
    siteData.media = Array.isArray(siteData.media) ? siteData.media : [];
    siteData.revisions = Array.isArray(siteData.revisions) ? siteData.revisions : [];
    siteData.cms = siteData.cms && typeof siteData.cms === "object" ? siteData.cms : {};
    if (typeof siteData.cms.version !== "number") siteData.cms.version = 1;
    if (typeof siteData.cms.autoDraft !== "boolean") siteData.cms.autoDraft = true;
    if (!siteData.cms.updatedAt) siteData.cms.updatedAt = new Date().toISOString();
    siteData.design = siteData.design && typeof siteData.design === "object" ? siteData.design : {};
    Object.assign(siteData.design, {
      accent: siteData.design.accent || "#111318",
      background: siteData.design.background || "#f5f7fa",
      surface: siteData.design.surface || "#ffffff",
      text: siteData.design.text || "#111318",
      muted: siteData.design.muted || "#707783",
      radius: siteData.design.radius || 16,
      maxWidth: siteData.design.maxWidth || 1180
    });
    siteData.seo = siteData.seo && typeof siteData.seo === "object" ? siteData.seo : {};
    if (typeof siteData.seo.titleSuffix !== "string") siteData.seo.titleSuffix = " - Official Website";
    if (typeof siteData.seo.defaultDescription !== "string") siteData.seo.defaultDescription = siteData.site?.description || "";
    if (!siteData.seo.robots) siteData.seo.robots = "index,follow";
  }

  function snapshotWithoutHistory(data = siteData) {
    const copy = safeClone(data);
    copy.revisions = [];
    return copy;
  }

  function dataHash(data) {
    try { return JSON.stringify(data); } catch { return ""; }
  }

  function noteHistory() {
    if (!siteData) return;
    const current = snapshotWithoutHistory();
    if (lastObserved === null) {
      lastObserved = current;
      return;
    }
    const previousHash = dataHash(lastObserved);
    const currentHash = dataHash(current);
    if (previousHash === currentHash) return;
    undoStack.push(lastObserved);
    if (undoStack.length > 30) undoStack.shift();
    redoStack = [];
    lastObserved = current;
    scheduleLocalDraft();
  }

  function restoreSnapshot(snapshot, source) {
    if (!snapshot) return;
    const current = snapshotWithoutHistory();
    redoStack.push(current);
    siteData = safeClone(snapshot);
    ensureProData();
    markDirty();
    lastObserved = snapshotWithoutHistory();
    renderPage(currentPage || "overview");
    renderPreview();
    scheduleLocalDraft();
    showToast(source || "復元しました");
  }

  function undo() {
    if (!undoStack.length || !siteData) return showToast("これ以上戻れません");
    const snapshot = undoStack.pop();
    const current = snapshotWithoutHistory();
    redoStack.push(current);
    siteData = safeClone(snapshot);
    ensureProData();
    markDirty();
    lastObserved = snapshotWithoutHistory();
    renderPage(currentPage || "overview");
    renderPreview();
    scheduleLocalDraft();
    showToast("元に戻しました");
  }

  function redo() {
    if (!redoStack.length || !siteData) return showToast("やり直す変更がありません");
    const snapshot = redoStack.pop();
    const current = snapshotWithoutHistory();
    undoStack.push(current);
    siteData = safeClone(snapshot);
    ensureProData();
    markDirty();
    lastObserved = snapshotWithoutHistory();
    renderPage(currentPage || "overview");
    renderPreview();
    scheduleLocalDraft();
    showToast("やり直しました");
  }

  function scheduleLocalDraft() {
    clearTimeout(autosaveTimer);
    if (!siteData || siteData.cms?.autoDraft === false) return;
    autosaveTimer = setTimeout(() => {
      try {
        const payload = snapshotWithoutHistory();
        payload._localSavedAt = new Date().toISOString();
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        const el = document.getElementById("localDraftState");
        if (el) el.textContent = "ローカル下書き保存済み";
      } catch (error) {
        console.warn("[Maru CMS] local draft error", error);
      }
    }, 700);
  }

  function clearLocalDraft() {
    localStorage.removeItem(DRAFT_KEY);
    const el = document.getElementById("localDraftState");
    if (el) el.textContent = "ローカル下書きなし";
  }

  function tryRestoreLocalDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw || !siteData) return;
      const draft = JSON.parse(raw);
      if (!draft || typeof draft !== "object" || !draft._localSavedAt) return;
      const savedAt = new Date(draft._localSavedAt).getTime();
      const remoteAt = new Date(siteData.cms?.updatedAt || 0).getTime();
      if (!Number.isFinite(savedAt) || savedAt <= remoteAt) return;
      const ok = confirm("未反映のローカル下書きがあります。復元しますか？");
      if (!ok) return;
      delete draft._localSavedAt;
      siteData = draft;
      ensureProData();
      markDirty();
      lastObserved = snapshotWithoutHistory();
      renderPage(currentPage || "overview");
      renderPreview();
      showToast("ローカル下書きを復元しました");
    } catch (error) {
      console.warn("[Maru CMS] draft restore error", error);
    }
  }

  function addAdminNav() {
    const nav = document.querySelector(".sidebar-nav");
    if (!nav) return;
    NAV_EXTRAS.forEach(([page, label, small, icon]) => {
      if (nav.querySelector(`[data-page="${page}"]`)) return;
      const button = document.createElement("button");
      button.className = "nav-item";
      button.dataset.page = page;
      button.innerHTML = `<span>${icon}</span><b>${escapeHtml(label)}</b><small>${small}</small>`;
      nav.appendChild(button);
      button.addEventListener("click", () => {
        currentPage = page;
        nav.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item === button));
        renderPage(page);
      });
    });
    const original = document.querySelector('.nav-item[data-page="overview"]');
    if (original && !original.dataset.proEnhanced) {
      original.dataset.proEnhanced = "1";
      original.addEventListener("dblclick", () => renderPage("overview"));
    }
  }

  function renderProHeader(title, description, actions = "") {
    pageContent.innerHTML = `<div class="page-heading"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>${actions}`;
  }

  function statusPill(status) {
    const published = status === "published";
    return `<span class="pro-status ${published ? "is-published" : "is-draft"}">${published ? "公開" : "下書き"}</span>`;
  }

  function pageStatus(page) {
    if (page.status) return page.status === "published" ? "published" : "draft";
    return page.enabled === false ? "draft" : "published";
  }

  function pageSectionDefaults(type = "text") {
    const defaults = {
      hero: { type: "hero", title: "こんにちは！", description: "", enabled: true },
      stats: { type: "stats", title: "統計", enabled: true },
      projects: { type: "projects", title: "Projects", enabled: true },
      updates: { type: "updates", title: "Updates", enabled: true },
      embeds: { type: "embeds", title: "埋め込み", enabled: true },
      links: { type: "links", title: "Links", enabled: true },
      github: { type: "github", title: "Open Source", enabled: true },
      text: { type: "text", title: "新しいセクション", description: "", enabled: true },
      image: { type: "image", title: "画像", url: "", alt: "", enabled: true },
      quote: { type: "quote", title: "引用", description: "", enabled: true },
      button: { type: "button", title: "ボタン", url: "#", description: "", enabled: true }
    };
    return safeClone(defaults[type] || defaults.text);
  }

  function sectionLabel(type) {
    return ({ hero: "Hero", stats: "Stats", projects: "Projects", updates: "Updates", embeds: "Embeds", links: "Links", github: "GitHub", text: "Text", image: "Image", quote: "Quote", button: "Button" })[type] || type || "Text";
  }

  window.renderPages = function renderPagesPro() {
    ensureProData();
    const pages = siteData.pages;
    renderProHeader("ページ", "ページを作成・設計し、下書きから公開まで管理します。", `<div class="pro-toolbar"><button id="addCmsPageButton" class="button primary">＋ 新しいページ</button><span id="localDraftState" class="pro-muted">ローカル下書き自動保存</span></div>`);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="card-header"><strong>ページ</strong><span>${pages.length} pages</span></div><div id="proPageList" class="pro-page-list"></div>`;
    pageContent.appendChild(card);
    const list = card.querySelector("#proPageList");
    if (!pages.length) list.innerHTML = `<div class="empty pro-empty">まだページがありません。最初のページを作ってみよう。</div>`;
    pages.forEach((page, index) => {
      const status = pageStatus(page);
      const item = document.createElement("article");
      item.className = "pro-page-row";
      item.draggable = true;
      item.innerHTML = `<div class="pro-drag">⠿</div><div class="pro-page-main"><div class="pro-page-title"><strong>${escapeHtml(page.title || "無題")}</strong>${statusPill(status)}</div><div class="pro-page-meta">/${escapeHtml(page.slug || "page")} · ${(page.sections || []).length} セクション${page.showInNavigation ? " · ナビ表示" : ""}</div></div><div class="pro-page-actions"><button class="button small previewPage">プレビュー</button><button class="button small editPage">編集</button><button class="button small togglePage">${status === "published" ? "下書きへ" : "公開"}</button><button class="button small dangerText deletePage">削除</button></div>`;
      item.querySelector(".previewPage").onclick = () => window.open(pageUrl(page), "_blank", "noopener,noreferrer");
      item.querySelector(".editPage").onclick = () => openPageBuilder(page);
      item.querySelector(".togglePage").onclick = () => {
        page.status = status === "published" ? "draft" : "published";
        page.enabled = page.status === "published";
        page.updatedAt = new Date().toISOString();
        if (page.status === "published") page.publishedAt = page.updatedAt;
        markDirty(); renderPages(); renderPreview();
      };
      item.querySelector(".deletePage").onclick = () => {
        if (!confirm(`「${page.title || "無題"}」を削除しますか？`)) return;
        pages.splice(index, 1); markDirty(); renderPages(); renderPreview();
      };
      item.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", String(index)); item.classList.add("is-dragging"); });
      item.addEventListener("dragend", () => item.classList.remove("is-dragging"));
      item.addEventListener("dragover", e => e.preventDefault());
      item.addEventListener("drop", e => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData("text/plain"));
        if (!Number.isInteger(from) || from === index) return;
        const moved = pages.splice(from, 1)[0]; pages.splice(index, 0, moved);
        markDirty(); renderPages();
      });
      list.appendChild(item);
    });
    document.getElementById("addCmsPageButton").onclick = () => {
      const page = { id: makeId("page"), title: "新しいページ", slug: uniquePageSlug("new-page"), description: "", navLabel: "新しいページ", showInNavigation: false, enabled: false, status: "draft", sections: [pageSectionDefaults("hero"), pageSectionDefaults("text")], seo: { title: "", description: "", ogImage: "", noindex: false }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      pages.push(page); markDirty(); openPageBuilder(page);
    };
  };

  function openPageBuilder(page) {
    normalizePageLocal(page);
    const types = ["hero", "text", "image", "quote", "button", "stats", "projects", "updates", "embeds", "links", "github"];
    pageContent.innerHTML = `<div class="page-heading"><div><h2>${escapeHtml(page.title || "ページ")}</h2><p>ページビルダー。ブロックを並べて、公開設定まで一画面で管理します。</p></div></div><div class="builder-grid"><div><div class="card"><div class="card-header"><strong>キャンバス</strong><span>${statusPill(pageStatus(page))}</span></div><div id="builderSections" class="builder-sections"></div><div class="builder-add"><select id="sectionTypePicker">${types.map(type => `<option value="${type}">${sectionLabel(type)}</option>`).join("")}</select><button id="addBuilderSection" class="button primary small">＋ ブロック追加</button></div></div></div><div><div class="card sticky-card"><div class="card-header"><strong>ページ設定</strong><span>PAGE</span></div><div class="form-grid"><div class="field"><label>タイトル</label><input id="builderTitle" value="${escapeHtml(page.title || "")}"></div><div class="field"><label>URLスラッグ</label><input id="builderSlug" value="${escapeHtml(page.slug || "")}"></div><div class="field full"><label>説明</label><textarea id="builderDescription">${escapeHtml(page.description || "")}</textarea></div><div class="field"><label>ナビ表示名</label><input id="builderNavLabel" value="${escapeHtml(page.navLabel || page.title || "")}"></div><div class="field"><label>公開状態</label><select id="builderStatus"><option value="draft">下書き</option><option value="published">公開</option></select></div></div><label class="checkbox-row"><input id="builderShowNav" type="checkbox" ${page.showInNavigation ? "checked" : ""}> ナビゲーションに表示</label><div class="card-inner-divider"></div><strong class="settings-subhead">SEO</strong><div class="form-grid"><div class="field full"><label>SEOタイトル</label><input id="builderSeoTitle" value="${escapeHtml(page.seo?.title || "")}"></div><div class="field full"><label>SEO説明</label><textarea id="builderSeoDescription">${escapeHtml(page.seo?.description || "")}</textarea></div><div class="field"><label>OGP画像URL</label><input id="builderSeoImage" value="${escapeHtml(page.seo?.ogImage || "")}"></div><label class="checkbox-row"><input id="builderNoindex" type="checkbox" ${page.seo?.noindex ? "checked" : ""}> 検索エンジンに表示しない</label></div><div class="builder-actions"><button id="applyPageBuilder" class="button primary">変更を保存</button><a class="button" href="${escapeHtml(pageUrl(page))}" target="_blank" rel="noopener noreferrer">プレビュー ↗</a><button id="backPageBuilder" class="button">戻る</button></div></div></div></div>`;
    renderBuilderSections(page);
    document.getElementById("builderStatus").value = pageStatus(page);

    ["builderTitle","builderSlug","builderDescription","builderNavLabel","builderSeoTitle","builderSeoDescription","builderSeoImage"].forEach(id => {
      document.getElementById(id).addEventListener("input", () => { markDirty(); scheduleLocalDraft(); });
    });

    document.getElementById("applyPageBuilder").onclick = () => {
      const title = document.getElementById("builderTitle").value.trim() || "無題のページ";
      page.title = title;
      page.slug = uniquePageSlug(document.getElementById("builderSlug").value.trim() || title, page);
      page.description = document.getElementById("builderDescription").value;
      page.navLabel = document.getElementById("builderNavLabel").value.trim() || title;
      page.showInNavigation = document.getElementById("builderShowNav").checked;
      page.status = document.getElementById("builderStatus").value;
      page.enabled = page.status === "published";
      page.updatedAt = new Date().toISOString();
      if (page.status === "published") page.publishedAt = page.publishedAt || page.updatedAt;
      page.seo = { title: document.getElementById("builderSeoTitle").value, description: document.getElementById("builderSeoDescription").value, ogImage: document.getElementById("builderSeoImage").value, noindex: document.getElementById("builderNoindex").checked };
      markDirty(); renderPages(); renderPreview();
    };
    document.getElementById("backPageBuilder").onclick = renderPages;
    document.getElementById("addBuilderSection").onclick = () => { page.sections.push(pageSectionDefaults(document.getElementById("sectionTypePicker").value)); markDirty(); renderBuilderSections(page); renderPreview(); };
  }

  function renderBuilderSections(page) {
    const list = document.getElementById("builderSections");
    if (!list) return;
    list.innerHTML = "";
    page.sections.forEach((section, index) => {
      const card = document.createElement("article");
      card.className = "builder-block";
      card.draggable = true;
      card.innerHTML = `<div class="builder-block-top"><span class="builder-grip">⠿</span><div><strong>${escapeHtml(section.title || sectionLabel(section.type))}</strong><small>${sectionLabel(section.type)} · ${section.enabled === false ? "非表示" : "表示"}</small></div><div class="item-actions"><button class="button small editBuilderBlock">編集</button><button class="button small toggleBuilderBlock">${section.enabled === false ? "表示" : "非表示"}</button><button class="button small dangerText deleteBuilderBlock">削除</button></div></div>`;
      card.querySelector(".editBuilderBlock").onclick = () => openBuilderBlockEditor(page, section);
      card.querySelector(".toggleBuilderBlock").onclick = () => { section.enabled = section.enabled === false; markDirty(); renderBuilderSections(page); renderPreview(); };
      card.querySelector(".deleteBuilderBlock").onclick = () => { if (!confirm("このブロックを削除しますか？")) return; page.sections.splice(index, 1); markDirty(); renderBuilderSections(page); renderPreview(); };
      card.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", String(index)); });
      card.addEventListener("dragover", e => e.preventDefault());
      card.addEventListener("drop", e => { e.preventDefault(); const from = Number(e.dataTransfer.getData("text/plain")); if (!Number.isInteger(from) || from === index) return; const moved = page.sections.splice(from, 1)[0]; page.sections.splice(index, 0, moved); markDirty(); renderBuilderSections(page); renderPreview(); });
      list.appendChild(card);
    });
    if (!page.sections.length) list.innerHTML = `<div class="empty pro-empty">ブロックがありません。</div>`;
  }

  function openBuilderBlockEditor(page, section) {
    const type = section.type || "text";
    const common = `<div class="form-grid"><div class="field"><label>種類</label><input value="${escapeHtml(sectionLabel(type))}" disabled></div><div class="field"><label>タイトル</label><input id="blockTitle" value="${escapeHtml(section.title || "")}"></div><div class="field full"><label>説明</label><textarea id="blockDescription">${escapeHtml(section.description || "")}</textarea></div>`;
    let extra = "";
    if (type === "image") extra = `<div class="field full"><label>画像URL</label><input id="blockUrl" value="${escapeHtml(section.url || "")}"></div><div class="field full"><label>代替テキスト</label><input id="blockAlt" value="${escapeHtml(section.alt || "")}"></div>`;
    if (type === "button") extra = `<div class="field full"><label>リンクURL</label><input id="blockUrl" value="${escapeHtml(section.url || "")}"></div><label class="checkbox-row"><input id="blockNewTab" type="checkbox" ${section.newTab !== false ? "checked" : ""}> 新しいタブで開く</label>`;
    pageContent.innerHTML = `<div class="page-heading"><h2>ブロックを編集</h2><p>${escapeHtml(sectionLabel(type))} ブロックの内容を設定します。</p></div><div class="card">${common}${extra}</div><div class="card"><label class="checkbox-row"><input id="blockEnabled" type="checkbox" ${section.enabled !== false ? "checked" : ""}> このブロックを表示</label><div class="builder-actions"><button id="applyBlock" class="button primary">適用</button><button id="cancelBlock" class="button">戻る</button></div></div>`;
    document.getElementById("applyBlock").onclick = () => {
      section.title = document.getElementById("blockTitle").value;
      section.description = document.getElementById("blockDescription").value;
      if (document.getElementById("blockUrl")) section.url = document.getElementById("blockUrl").value;
      if (document.getElementById("blockAlt")) section.alt = document.getElementById("blockAlt").value;
      if (document.getElementById("blockNewTab")) section.newTab = document.getElementById("blockNewTab").checked;
      section.enabled = document.getElementById("blockEnabled").checked;
      markDirty(); openPageBuilder(page); renderPreview();
    };
    document.getElementById("cancelBlock").onclick = () => openPageBuilder(page);
  }

  function normalizePageLocal(page) {
    if (!page.id) page.id = makeId("page");
    if (!page.title) page.title = "新しいページ";
    if (!page.slug) page.slug = uniquePageSlug(page.title);
    if (!Array.isArray(page.sections)) page.sections = [];
    if (!page.seo) page.seo = { title: "", description: "", ogImage: "", noindex: false };
    if (!page.navLabel) page.navLabel = page.title;
    if (!page.status) page.status = page.enabled === false ? "draft" : "published";
  }

  function uniquePageSlug(value, currentPage) {
    const base = slugifyPage(value);
    let slug = base, n = 2;
    while (ensureArray("pages").some(p => p !== currentPage && String(p.slug || "") === slug)) slug = `${base}-${n++}`;
    return slug;
  }

  function slugifyPage(value) {
    const raw = String(value || "").trim().toLowerCase();
    const slug = raw.replace(/\s+/g, "-").replace(/[^a-z0-9\-_ぁ-んァ-ヶ一-龠]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return slug || `page-${Date.now().toString(36)}`;
  }

  function pageUrl(page) { return `../?page=${encodeURIComponent(page.slug)}`; }

  window.renderOverview = function renderOverviewPro() {
    ensureProData();
    const pages = siteData.pages.filter(p => pageStatus(p) === "published").length;
    const drafts = siteData.pages.filter(p => pageStatus(p) !== "published").length;
    const media = siteData.media.length;
    const revisions = siteData.revisions.length;
    renderProHeader("ダッシュボード", "サイト全体の状態、下書き、履歴をひとまとめに確認できます。", `<div class="pro-toolbar"><button id="undoPro" class="button small">↶ Undo</button><button id="redoPro" class="button small">↷ Redo</button><button id="openPublicSite" class="button small">公開サイト ↗</button></div>`);
    pageContent.innerHTML += `<div class="dashboard-grid pro-dashboard"><div class="dashboard-card"><span>PUBLISHED PAGES</span><strong>${pages}</strong><p>公開中のページ</p></div><div class="dashboard-card"><span>DRAFTS</span><strong>${drafts}</strong><p>編集中の下書き</p></div><div class="dashboard-card"><span>MEDIA</span><strong>${media}</strong><p>メディアライブラリ</p></div><div class="dashboard-card"><span>REVISIONS</span><strong>${revisions}</strong><p>保存履歴</p></div></div><div class="card"><div class="card-header"><strong>公開前チェック</strong><span>QUALITY</span></div><div class="pro-checks"><div>✓ ページ構成 <b>${siteData.pages.length}</b></div><div>${siteData.site?.name ? "✓" : "⚠"} サイト名</div><div>${siteData.site?.description ? "✓" : "⚠"} メタ説明</div><div>${siteData.seo?.robots ? "✓" : "⚠"} Robots設定</div><div>${siteData.media.length ? "✓" : "⚠"} OGP/メディア</div></div></div><div class="card"><div class="card-header"><strong>最近の変更</strong><button id="goRevisions" class="button small">履歴を見る</button></div><div class="revision-list">${siteData.revisions.slice(0,5).map(r => `<div class="revision-row"><div><strong>v${escapeHtml(r.version || "?")}</strong><span>${escapeHtml(formatDate(r.createdAt))}</span></div><small>${escapeHtml(r.message || "保存")}</small></div>`).join("") || `<div class="empty">まだ保存履歴がありません。</div>`}</div></div>`;
    document.getElementById("undoPro").onclick = undo;
    document.getElementById("redoPro").onclick = redo;
    document.getElementById("openPublicSite").onclick = () => window.open("../", "_blank", "noopener,noreferrer");
    document.getElementById("goRevisions").onclick = () => { currentPage = "revisions"; document.querySelectorAll(".nav-item").forEach(x => x.classList.toggle("active", x.dataset.page === "revisions")); renderPage("revisions"); };
  };

  window.renderMedia = function renderMedia() {
    ensureProData();
    renderProHeader("メディア", "画像・OGP素材などのURLをライブラリとして整理します。", `<div class="pro-toolbar"><button id="addMedia" class="button primary">＋ メディア追加</button></div>`);
    pageContent.innerHTML += `<div class="card"><div id="mediaGrid" class="media-grid"></div></div>`;
    const grid = document.getElementById("mediaGrid");
    if (!siteData.media.length) grid.innerHTML = `<div class="empty pro-empty">まだメディアがありません。</div>`;
    siteData.media.forEach((media, index) => {
      const item = document.createElement("article"); item.className = "media-card";
      item.innerHTML = `<div class="media-thumb">${media.url ? `<img src="${escapeHtml(media.url)}" alt="${escapeHtml(media.alt || "")}" loading="lazy">` : "<span>NO IMAGE</span>"}</div><div class="media-info"><strong>${escapeHtml(media.name || "Untitled")}</strong><small>${escapeHtml(media.url || "URLなし")}</small></div><div class="media-actions"><button class="button small copyMedia">URLコピー</button><button class="button small editMedia">編集</button><button class="button small dangerText deleteMedia">削除</button></div>`;
      item.querySelector(".copyMedia").onclick = async () => { try { await navigator.clipboard.writeText(media.url || ""); showToast("URLをコピーしました"); } catch { showToast("コピーできませんでした"); } };
      item.querySelector(".editMedia").onclick = () => openMediaEditor(media);
      item.querySelector(".deleteMedia").onclick = () => { if (!confirm("このメディアを削除しますか？")) return; siteData.media.splice(index,1); markDirty(); renderMedia(); };
      grid.appendChild(item);
    });
    document.getElementById("addMedia").onclick = () => openMediaEditor({ id: makeId("media"), name: "新しい画像", url: "", alt: "" }, true);
  };

  function openMediaEditor(media, isNew) {
    pageContent.innerHTML = `<div class="page-heading"><h2>メディアを編集</h2><p>URLベースのメディアライブラリです。画像をページやSEO設定から再利用できます。</p></div><div class="card"><div class="form-grid"><div class="field"><label>名前</label><input id="mediaName" value="${escapeHtml(media.name || "")}"></div><div class="field"><label>画像URL</label><input id="mediaUrl" value="${escapeHtml(media.url || "")}"></div><div class="field full"><label>代替テキスト</label><input id="mediaAlt" value="${escapeHtml(media.alt || "")}"></div></div><div class="builder-actions"><button id="applyMedia" class="button primary">保存</button><button id="cancelMedia" class="button">戻る</button></div></div>`;
    document.getElementById("applyMedia").onclick = () => { media.name = document.getElementById("mediaName").value.trim() || "Untitled"; media.url = document.getElementById("mediaUrl").value.trim(); media.alt = document.getElementById("mediaAlt").value.trim(); if (isNew) siteData.media.push(media); markDirty(); renderMedia(); };
    document.getElementById("cancelMedia").onclick = renderMedia;
  }

  window.renderDesign = function renderDesign() {
    ensureProData(); const d = siteData.design;
    renderProHeader("デザイン", "サイトの基本デザイントークンをまとめて管理します。", "");
    pageContent.innerHTML += `<div class="card"><div class="form-grid"><div class="field"><label>アクセント</label><input id="designAccent" type="color" value="${escapeHtml(d.accent)}"></div><div class="field"><label>背景色</label><input id="designBackground" type="color" value="${escapeHtml(d.background)}"></div><div class="field"><label>サーフェス</label><input id="designSurface" type="color" value="${escapeHtml(d.surface)}"></div><div class="field"><label>文字色</label><input id="designText" type="color" value="${escapeHtml(d.text)}"></div><div class="field"><label>角丸(px)</label><input id="designRadius" type="number" min="0" max="40" value="${Number(d.radius) || 16}"></div><div class="field"><label>最大幅(px)</label><input id="designMaxWidth" type="number" min="720" max="1600" value="${Number(d.maxWidth) || 1180}"></div></div><div class="card-preview-token" id="designTokenPreview"></div></div>`;
    const ids = ["designAccent","designBackground","designSurface","designText","designRadius","designMaxWidth"];
    ids.forEach(id => document.getElementById(id).addEventListener("input", () => { d.accent = document.getElementById("designAccent").value; d.background = document.getElementById("designBackground").value; d.surface = document.getElementById("designSurface").value; d.text = document.getElementById("designText").value; d.radius = Number(document.getElementById("designRadius").value) || 16; d.maxWidth = Number(document.getElementById("designMaxWidth").value) || 1180; markDirty(); renderDesignPreview(); }));
    renderDesignPreview();
  };

  function renderDesignPreview() {
    const d = siteData.design, el = document.getElementById("designTokenPreview");
    if (!el) return; el.style.setProperty("--token-bg", d.background); el.style.setProperty("--token-surface", d.surface); el.style.setProperty("--token-text", d.text); el.style.setProperty("--token-accent", d.accent); el.style.setProperty("--token-radius", `${d.radius}px`); el.innerHTML = `<div class="token-demo"><strong>maru CMS</strong><span>Design tokens preview</span><button>Accent Button</button></div>`;
  }

  window.renderSeo = function renderSeo() {
    ensureProData(); const s = siteData.seo;
    renderProHeader("SEO", "検索結果・SNS共有・クロール設定を管理します。", "");
    pageContent.innerHTML += `<div class="card"><div class="form-grid"><div class="field full"><label>タイトルサフィックス</label><input id="seoSuffix" value="${escapeHtml(s.titleSuffix || "")}"></div><div class="field full"><label>デフォルト説明</label><textarea id="seoDescription">${escapeHtml(s.defaultDescription || "")}</textarea></div><div class="field"><label>Robots</label><select id="seoRobots"><option value="index,follow">index,follow</option><option value="noindex,nofollow">noindex,nofollow</option><option value="index,nofollow">index,nofollow</option><option value="noindex,follow">noindex,follow</option></select></div><div class="field"><label>デフォルトOGP画像</label><input id="seoOgImage" value="${escapeHtml(s.ogImage || "")}"></div></div></div><div class="card"><div class="card-header"><strong>公開ページSEO</strong><span>各ページから個別設定できます</span></div><p class="pro-muted">ページビルダーのSEO欄でタイトル、説明、OGP画像、noindexを個別に指定できます。</p></div>`;
    document.getElementById("seoRobots").value = s.robots || "index,follow";
    ["seoSuffix","seoDescription","seoOgImage","seoRobots"].forEach(id => document.getElementById(id).addEventListener("input", () => { s.titleSuffix = document.getElementById("seoSuffix").value; s.defaultDescription = document.getElementById("seoDescription").value; s.ogImage = document.getElementById("seoOgImage").value; s.robots = document.getElementById("seoRobots").value; markDirty(); }));
  };

  window.renderRevisions = function renderRevisions() {
    ensureProData();
    renderProHeader("履歴", "保存したスナップショットから過去の状態を復元できます。", `<div class="pro-toolbar"><button id="manualRevision" class="button small">現在の状態を履歴に追加</button></div>`);
    pageContent.innerHTML += `<div class="card"><div id="revisionList" class="revision-list"></div></div>`;
    const list = document.getElementById("revisionList");
    if (!siteData.revisions.length) list.innerHTML = `<div class="empty">保存履歴はまだありません。</div>`;
    siteData.revisions.forEach((revision, index) => {
      const item = document.createElement("div"); item.className = "revision-card";
      item.innerHTML = `<div><div class="revision-version">v${escapeHtml(revision.version || "?")}</div><strong>${escapeHtml(revision.message || "保存")}</strong><small>${escapeHtml(formatDate(revision.createdAt))}</small></div><div class="item-actions"><button class="button small restoreRevision">復元</button></div>`;
      item.querySelector(".restoreRevision").onclick = () => { if (!revision.snapshot) return; if (!confirm(`v${revision.version} に戻しますか？現在の未保存変更は失われます。`)) return; const current = snapshotWithoutHistory(); undoStack.push(current); siteData = safeClone(revision.snapshot); ensureProData(); markDirty(); lastObserved = snapshotWithoutHistory(); renderPage("revisions"); renderPreview(); };
      list.appendChild(item);
    });
    document.getElementById("manualRevision").onclick = () => { captureRevision("手動スナップショット"); renderRevisions(); showToast("履歴に追加しました"); };
  };

  window.renderNavigation = function renderNavigationPro() {
    ensureProData();
    renderProHeader("ナビゲーション", "サイト上部のリンクとCMSページをひとつのメニューとして並べ替えます。", `<div class="pro-toolbar"><button id="addNav" class="button primary">＋ リンク追加</button><button id="autoNav" class="button small">公開ページを追加</button></div>`);
    pageContent.innerHTML += `<div class="card"><div class="card-header"><strong>メニュー</strong><span>${siteData.navigation.length} links</span></div><div id="proNavList" class="editor-list"></div></div>`;
    const list = document.getElementById("proNavList");
    siteData.navigation.forEach((item, index) => {
      const row = document.createElement("div"); row.className = "editor-item"; row.innerHTML = `<div class="drag-handle">☰</div><div class="item-main"><strong>${escapeHtml(item.label || "Link")}</strong><span>${escapeHtml(item.href || "")}</span></div><div class="item-actions"><button class="button small up">↑</button><button class="button small down">↓</button><button class="button small edit">編集</button><button class="button small dangerText delete">削除</button></div>`;
      row.querySelector(".up").onclick = () => { if (index <= 0) return; [siteData.navigation[index-1],siteData.navigation[index]]=[siteData.navigation[index],siteData.navigation[index-1]]; markDirty(); renderNavigation(); };
      row.querySelector(".down").onclick = () => { if (index >= siteData.navigation.length-1) return; [siteData.navigation[index+1],siteData.navigation[index]]=[siteData.navigation[index],siteData.navigation[index+1]]; markDirty(); renderNavigation(); };
      row.querySelector(".edit").onclick = () => openNavEditor(item);
      row.querySelector(".delete").onclick = () => { if (!confirm("このメニューを削除しますか？")) return; siteData.navigation.splice(index,1); markDirty(); renderNavigation(); };
      list.appendChild(row);
    });
    document.getElementById("addNav").onclick = () => openNavEditor({ id: makeId("nav"), label: "新しいリンク", href: "", enabled: true, newTab: false }, true);
    document.getElementById("autoNav").onclick = () => {
      const existing = new Set(siteData.navigation.map(n => n.href));
      siteData.pages.filter(p => p.showInNavigation && pageStatus(p) === "published").forEach(p => { const href = pageUrl(p); if (existing.has(href)) return; siteData.navigation.push({ id: makeId("nav"), label: p.navLabel || p.title, href, enabled: true, newTab: false }); });
      markDirty(); renderNavigation();
    };
  };

  function openNavEditor(item, isNew) {
    pageContent.innerHTML = `<div class="page-heading"><h2>ナビゲーションを編集</h2><p>メニュー名とリンク先を設定します。</p></div><div class="card"><div class="form-grid"><div class="field"><label>表示名</label><input id="navLabel" value="${escapeHtml(item.label || "")}"></div><div class="field"><label>URL</label><input id="navHref" value="${escapeHtml(item.href || "")}"></div></div><label class="checkbox-row"><input id="navEnabled" type="checkbox" ${item.enabled !== false ? "checked" : ""}> 表示する</label><label class="checkbox-row"><input id="navNewTab" type="checkbox" ${item.newTab ? "checked" : ""}> 新しいタブで開く</label><div class="builder-actions"><button id="applyNav" class="button primary">保存</button><button id="cancelNav" class="button">戻る</button></div></div>`;
    document.getElementById("applyNav").onclick = () => { item.label = document.getElementById("navLabel").value.trim() || "Link"; item.href = document.getElementById("navHref").value.trim(); item.enabled = document.getElementById("navEnabled").checked; item.newTab = document.getElementById("navNewTab").checked; if (isNew) siteData.navigation.push(item); markDirty(); renderNavigation(); };
    document.getElementById("cancelNav").onclick = renderNavigation;
  }

  function captureRevision(message) {
    ensureProData();
    const current = snapshotWithoutHistory();
    const last = siteData.revisions[0];
    if (last && dataHash(last.snapshot) === dataHash(current)) return false;
    revisionCounter = Math.max(revisionCounter, ...siteData.revisions.map(r => Number(r.version) || 0), Number(siteData.cms.version) || 0);
    revisionCounter += 1;
    siteData.cms.version = revisionCounter;
    siteData.cms.updatedAt = new Date().toISOString();
    siteData.revisions.unshift({ id: makeId("rev"), version: revisionCounter, message: message || "保存", createdAt: new Date().toISOString(), snapshot: current });
    siteData.revisions = siteData.revisions.slice(0, MAX_REVISIONS);
    return true;
  }

  function formatDate(value) {
    try { return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); } catch { return String(value || ""); }
  }

  function installSaveRevisionHook() {
    if (!window.saveButton || saveButton.dataset.proHook) return;
    saveButton.dataset.proHook = "1";
    saveButton.addEventListener("click", () => { if (siteData && dataHash(snapshotWithoutHistory()) !== dataHash(savedSnapshot || {})) captureRevision("公開保存"); }, true);
  }

  function installObservers() {
    document.addEventListener("input", () => noteHistory(), true);
    document.addEventListener("change", () => { noteHistory(); scheduleLocalDraft(); }, true);
    document.addEventListener("click", () => setTimeout(noteHistory, 0), true);
    document.addEventListener("keydown", event => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if (event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
    });
  }

  const baseNormalize = window.normalizeData;
  window.normalizeData = function () { if (baseNormalize) baseNormalize(); ensureProData(); };

  const boot = setInterval(() => {
    if (!siteData) return;
    clearInterval(boot);
    ensureProData();
    lastObserved = snapshotWithoutHistory();
    tryRestoreLocalDraft();
    addAdminNav();
    installObservers();
    installSaveRevisionHook();
    scheduleLocalDraft();
  }, 30);

  window.CMS_PRO = { undo, redo, ensureProData, captureRevision };
})();