const PAGE_SECTION_TYPES = [
  ["hero", "Hero"],
  ["stats", "Stats"],
  ["projects", "Projects"],
  ["updates", "Updates"],
  ["embeds", "Embeds"],
  ["links", "Links"],
  ["github", "GitHub"],
  ["text", "Text"]
];

function getPages() {
  if (!Array.isArray(siteData.pages)) siteData.pages = [];
  return siteData.pages;
}

function normalizePage(page) {
  if (!page.id) page.id = makeId("page");
  if (!page.title) page.title = "新しいページ";
  if (!page.slug) page.slug = slugifyPage(page.title);
  if (!Array.isArray(page.sections)) page.sections = [];
  if (typeof page.enabled !== "boolean") page.enabled = true;
  if (typeof page.showInNavigation !== "boolean") page.showInNavigation = false;
  if (!page.navLabel) page.navLabel = page.title;
  return page;
}

function slugifyPage(value) {
  let slug = String(value || "")
    .trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_ぁ-んァ-ヶ一-龠]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `page-${Date.now().toString(36)}`;
}

function uniquePageSlug(value, currentPage) {
  const pages = getPages();
  const base = slugifyPage(value);
  let slug = base;
  let n = 2;
  while (pages.some(p => p !== currentPage && String(p.slug || "") === slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function pageUrl(page) {
  return `../?page=${encodeURIComponent(page.slug)}`;
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
    text: { type: "text", title: "新しいセクション", description: "", enabled: true }
  };
  return clone(defaults[type] || defaults.text);
}

function pageSectionLabel(section) {
  return PAGE_SECTION_TYPES.find(([type]) => type === section.type)?.[1] || section.type || "Text";
}

function renderPages() {
  const pages = getPages().map(normalizePage);
  pageContent.innerHTML = `
    <div class="page-heading">
      <h2>ページ</h2>
      <p>サイトのページ構成を管理します。Homeとは別の独立したページを作成できます。</p>
    </div>
    <div class="card">
      <div class="card-header">
        <strong>ページ一覧</strong>
        <button id="addCmsPageButton" class="button primary small" type="button">＋ ページ追加</button>
      </div>
      <div id="cmsPageList" class="editor-list"></div>
    </div>
    <div class="card">
      <div class="card-header"><strong>使い方</strong><span>CMS</span></div>
      <p style="margin:0;color:#777e87;font-size:11px;line-height:1.8;">ページを追加すると、公開URLは <code>?page=slug</code> 形式になります。ナビゲーション表示も設定できます。</p>
    </div>`;

  const list = document.getElementById("cmsPageList");
  if (!pages.length) {
    list.innerHTML = `<div class="empty">独立ページはまだありません。<br>「＋ ページ追加」から作成できます。</div>`;
  }

  pages.forEach((page, index) => {
    const item = document.createElement("div");
    item.className = "editor-item";
    item.innerHTML = `
      <div class="drag-handle">☰</div>
      <div class="item-main"><strong>${escapeHtml(page.title)}</strong><span>/${escapeHtml(page.slug)}</span></div>
      <div class="item-actions">
        <button class="toggleCmsPage" type="button">${page.enabled !== false ? "公開中" : "非公開"}</button>
        <button class="editCmsPage" type="button">編集</button>
        <button class="deleteCmsPage" type="button">削除</button>
      </div>`;

    item.querySelector(".toggleCmsPage").addEventListener("click", () => {
      page.enabled = page.enabled === false;
      markDirty(); renderPages(); renderPreview();
    });
    item.querySelector(".editCmsPage").addEventListener("click", () => openCmsPageEditor(page));
    item.querySelector(".deleteCmsPage").addEventListener("click", () => {
      if (!confirm(`「${page.title}」を削除しますか？`)) return;
      pages.splice(index, 1); markDirty(); renderPages(); renderPreview();
    });
    list.appendChild(item);
  });

  document.getElementById("addCmsPageButton").addEventListener("click", () => {
    const page = {
      id: makeId("page"), title: "新しいページ", slug: uniquePageSlug("new-page"),
      description: "", navLabel: "新しいページ", showInNavigation: false,
      enabled: true, sections: [pageSectionDefaults("hero"), pageSectionDefaults("text")]
    };
    pages.push(page); markDirty(); openCmsPageEditor(page);
  });
}

function openCmsPageEditor(page) {
  normalizePage(page);
  pageContent.innerHTML = `
    <div class="page-heading"><h2>ページを編集</h2><p>ページ情報と、このページに表示するセクションを設定します。</p></div>
    <div class="card">
      <div class="form-grid">
        <div class="field"><label>ページ名</label><input id="cmsPageTitle" value="${escapeHtml(page.title)}"></div>
        <div class="field"><label>URLスラッグ</label><input id="cmsPageSlug" value="${escapeHtml(page.slug)}" placeholder="about"></div>
        <div class="field full"><label>説明</label><textarea id="cmsPageDescription">${escapeHtml(page.description || "")}</textarea></div>
        <div class="field"><label>ナビゲーション表示名</label><input id="cmsPageNavLabel" value="${escapeHtml(page.navLabel || page.title)}"></div>
      </div>
      <label class="checkbox-row"><input id="cmsPageEnabled" type="checkbox" ${page.enabled !== false ? "checked" : ""}> ページを公開する</label>
      <label class="checkbox-row"><input id="cmsPageShowNav" type="checkbox" ${page.showInNavigation ? "checked" : ""}> ナビゲーションに表示する</label>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button id="applyCmsPage" class="button primary" type="button">変更を適用</button>
        <a class="button" href="${escapeHtml(pageUrl(page))}" target="_blank" rel="noopener noreferrer">ページを開く ↗</a>
        <button id="cancelCmsPage" class="button" type="button">戻る</button>
      </div>
    </div>
    <div class="card"><div class="card-header"><strong>ページ内セクション</strong><button id="addCmsPageSection" class="button primary small" type="button">＋ セクション追加</button></div><div id="cmsPageSectionList" class="editor-list"></div></div>`;

  renderCmsPageSections(page);
  document.getElementById("applyCmsPage").addEventListener("click", () => {
    const title = document.getElementById("cmsPageTitle").value.trim();
    const slugInput = document.getElementById("cmsPageSlug").value.trim();
    page.title = title || "無題のページ";
    page.slug = uniquePageSlug(slugInput || page.title, page);
    page.description = document.getElementById("cmsPageDescription").value;
    page.navLabel = document.getElementById("cmsPageNavLabel").value.trim() || page.title;
    page.enabled = document.getElementById("cmsPageEnabled").checked;
    page.showInNavigation = document.getElementById("cmsPageShowNav").checked;
    markDirty(); renderPages(); renderPreview();
  });
  document.getElementById("cancelCmsPage").addEventListener("click", renderPages);
  document.getElementById("addCmsPageSection").addEventListener("click", () => {
    page.sections.push(pageSectionDefaults("text")); markDirty(); renderCmsPageSections(page); renderPreview();
  });
}

function renderCmsPageSections(page) {
  const list = document.getElementById("cmsPageSectionList");
  if (!list) return;
  const sections = Array.isArray(page.sections) ? page.sections : (page.sections = []);
  list.innerHTML = "";
  if (!sections.length) { list.innerHTML = `<div class="empty">セクションはまだありません。</div>`; return; }

  sections.forEach((section, index) => {
    const item = document.createElement("div"); item.className = "editor-item";
    item.innerHTML = `
      <div class="drag-handle">☰</div>
      <div class="item-main"><strong>${escapeHtml(section.title || pageSectionLabel(section))}</strong><span>${escapeHtml(pageSectionLabel(section))}</span></div>
      <div class="item-actions"><button class="up" type="button">↑</button><button class="down" type="button">↓</button><button class="toggle" type="button">${section.enabled !== false ? "表示中" : "非表示"}</button><button class="edit" type="button">編集</button><button class="delete" type="button">削除</button></div>`;
    item.querySelector(".up").addEventListener("click", () => { if(index<=0)return; [sections[index-1],sections[index]]=[sections[index],sections[index-1]]; markDirty(); renderCmsPageSections(page); renderPreview(); });
    item.querySelector(".down").addEventListener("click", () => { if(index>=sections.length-1)return; [sections[index+1],sections[index]]=[sections[index],sections[index+1]]; markDirty(); renderCmsPageSections(page); renderPreview(); });
    item.querySelector(".toggle").addEventListener("click", () => { section.enabled = section.enabled === false; markDirty(); renderCmsPageSections(page); renderPreview(); });
    item.querySelector(".edit").addEventListener("click", () => openCmsPageSectionEditor(page, section));
    item.querySelector(".delete").addEventListener("click", () => { if(!confirm("このページ内セクションを削除しますか？")) return; sections.splice(index,1); markDirty(); renderCmsPageSections(page); renderPreview(); });
    list.appendChild(item);
  });
}

function openCmsPageSectionEditor(page, section) {
  pageContent.innerHTML = `
    <div class="page-heading"><h2>ページ内セクションを編集</h2><p>このページだけに表示するセクションを設定します。</p></div>
    <div class="card"><div class="form-grid">
      <div class="field"><label>種類</label><select id="cmsSectionType">${PAGE_SECTION_TYPES.map(([type,label])=>`<option value="${type}">${label}</option>`).join("")}</select></div>
      <div class="field"><label>タイトル</label><input id="cmsSectionTitle" value="${escapeHtml(section.title || "")}"></div>
      <div class="field full"><label>説明</label><textarea id="cmsSectionDescription">${escapeHtml(section.description || "")}</textarea></div>
    </div>
    <label class="checkbox-row"><input id="cmsSectionEnabled" type="checkbox" ${section.enabled !== false ? "checked" : ""}> このセクションを表示する</label>
    <div style="margin-top:16px;display:flex;gap:8px;"><button id="applyCmsPageSection" class="button primary" type="button">変更を適用</button><button id="cancelCmsPageSection" class="button" type="button">戻る</button></div></div>`;
  document.getElementById("cmsSectionType").value = section.type || "text";
  document.getElementById("applyCmsPageSection").addEventListener("click", () => {
    section.type = document.getElementById("cmsSectionType").value;
    section.title = document.getElementById("cmsSectionTitle").value;
    section.description = document.getElementById("cmsSectionDescription").value;
    section.enabled = document.getElementById("cmsSectionEnabled").checked;
    markDirty(); openCmsPageEditor(page); renderPreview();
  });
  document.getElementById("cancelCmsPageSection").addEventListener("click", () => openCmsPageEditor(page));
}
