const DATA_URL = "../site-data.json";

const WORKER_URL =
  "https://maru-website-admin.maru-0727.workers.dev";

const ADMIN_PAGE_URL =
  "../admin/";

const DEFAULT_AVATAR =
  "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";


/* =========================================================
   STATE
========================================================= */

let siteData = null;

let selectedElement = null;

let selectedMeta = null;

let historyStack = [];

let futureStack = [];

let hasChanges = false;

let isRendering = false;


/* =========================================================
   DOM
========================================================= */

const websiteFrame =
  document.getElementById(
    "websiteFrame"
  );

const propertyEmpty =
  document.getElementById(
    "propertyEmpty"
  );

const propertyContent =
  document.getElementById(
    "propertyContent"
  );

const propertyType =
  document.getElementById(
    "propertyType"
  );

const propertyTitle =
  document.getElementById(
    "propertyTitle"
  );

const textControls =
  document.getElementById(
    "textControls"
  );

const colorControls =
  document.getElementById(
    "colorControls"
  );

const linkControls =
  document.getElementById(
    "linkControls"
  );

const imageControls =
  document.getElementById(
    "imageControls"
  );

const saveStatus =
  document.getElementById(
    "saveStatus"
  );

const floatingToolbar =
  document.getElementById(
    "floatingToolbar"
  );


/* =========================================================
   AUTH
========================================================= */

function getAdminToken() {

  return sessionStorage.getItem(
    "maru_admin_token"
  );

}


function getAdminExpiresAt() {

  return Number(
    sessionStorage.getItem(
      "maru_admin_expires"
    ) || 0
  );

}


function isAdminAuthenticated() {

  const token =
    getAdminToken();

  const expiresAt =
    getAdminExpiresAt();

  if (!token) {
    return false;
  }

  if (
    !expiresAt ||
    !Number.isFinite(
      expiresAt
    )
  ) {
    return false;
  }

  if (
    Date.now() >=
    expiresAt
  ) {
    return false;
  }

  return true;

}


function requireAdminAuth() {

  if (
    !isAdminAuthenticated()
  ) {

    window.location.replace(
      ADMIN_PAGE_URL
    );

    return false;

  }

  return true;

}


/* =========================================================
   STATUS
========================================================= */

function setSaveStatus(
  status,
  text
) {

  if (!saveStatus) {
    return;
  }

  saveStatus.className =
    "save-status";

  saveStatus.classList.add(
    status
  );

  saveStatus.textContent =
    text;

}


/* =========================================================
   BASIC HELPERS
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function isObject(
  value
) {

  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );

}


function isEnabled(
  item
) {

  return (
    item &&
    item.enabled !== false
  );

}


function arrayValue(
  value
) {

  return Array.isArray(value)
    ? value
    : [];

}


function safeUrl(
  value
) {

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {

    return "#";

  }

  return value.trim();

}


function cloneData(
  data
) {

  return JSON.parse(
    JSON.stringify(data)
  );

}


/* =========================================================
   HISTORY
========================================================= */

function pushHistory() {

  if (!siteData) {
    return;
  }

  historyStack.push(
    cloneData(
      siteData
    )
  );

  if (
    historyStack.length > 50
  ) {

    historyStack.shift();

  }

  futureStack = [];

  updateHistoryButtons();

}


function undo() {

  if (
    historyStack.length === 0
  ) {
    return;
  }

  futureStack.push(
    cloneData(
      siteData
    )
  );

  siteData =
    historyStack.pop();

  hasChanges = true;

  selectedElement = null;
  selectedMeta = null;

  renderSite();

  updateHistoryButtons();

  setSaveStatus(
    "dirty",
    "未保存の変更"
  );

}


function redo() {

  if (
    futureStack.length === 0
  ) {
    return;
  }

  historyStack.push(
    cloneData(
      siteData
    )
  );

  siteData =
    futureStack.pop();

  hasChanges = true;

  selectedElement = null;
  selectedMeta = null;

  renderSite();

  updateHistoryButtons();

  setSaveStatus(
    "dirty",
    "未保存の変更"
  );

}


function updateHistoryButtons() {

  const undoButton =
    document.getElementById(
      "undoButton"
    );

  const redoButton =
    document.getElementById(
      "redoButton"
    );


  if (undoButton) {

    undoButton.disabled =
      historyStack.length === 0;

  }


  if (redoButton) {

    redoButton.disabled =
      futureStack.length === 0;

  }

}


/* =========================================================
   DATA LOAD
========================================================= */

async function loadSiteData() {

  try {

    const response =
      await fetch(
        `${DATA_URL}?cb=${Date.now()}`,
        {
          cache:
            "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `site-data.json の読み込みに失敗しました (HTTP ${response.status})`
      );

    }


    const data =
      await response.json();


    if (
      !isObject(data)
    ) {

      throw new Error(
        "site-data.json の形式が不正です"
      );

    }


    siteData =
      data;


    renderSite();


    setSaveStatus(
      "saved",
      "保存済み"
    );


  } catch (
    error
  ) {

    console.error(
      "[Editor] data load error",
      error
    );


    setSaveStatus(
      "dirty",
      "読み込み失敗"
    );


    websiteFrame.innerHTML = `

      <div
        class="editor-load-error"
        style="
          padding:60px;
          text-align:center;
          font-family:sans-serif;
          color:#555;
        "
      >

        <h2>
          サイトを読み込めませんでした
        </h2>

        <p>
          ${escapeHtml(
            error.message
          )}
        </p>

      </div>

    `;

  }

}


/* =========================================================
   RENDER SITE
========================================================= */

function renderSite() {

  if (!siteData) {
    return;
  }


  isRendering = true;


  clearSelection();


  websiteFrame.innerHTML =
    "";


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "website-page";


  /*
    公開サイトのCSSをそのまま使う。
  */

  const style =
    document.createElement(
      "style"
    );


  style.textContent =
    getEditorScopedCSS();


  wrapper.appendChild(
    style
  );


  wrapper.insertAdjacentHTML(
    "beforeend",
    renderWebsite(
      siteData
    )
  );


  websiteFrame.appendChild(
    wrapper
  );


  bindEditorElements(
    wrapper
  );


  isRendering = false;

}


/* =========================================================
   WEBSITE
========================================================= */

function renderWebsite(
  data
) {

  const site =
    data.site || {};

  const settings =
    data.settings || {};


  const siteName =
    site.name ||
    "maru_m4ru_maru";


  const avatar =
    site.avatar ||
    DEFAULT_AVATAR;


  let html = "";


  /* -------------------------------------------------------
     HEADER
  ------------------------------------------------------- */

  html += `

    <header
      class="site-header"
      data-editor-ignore
    >

      <div
        class="container header-inner"
      >

        <a
          class="brand"
          href="#top"
        >

          <span
            class="brand-avatar-wrap"
          >

            <img
              class="brand-avatar"
              src="${escapeHtml(
                avatar
              )}"
              alt="${escapeHtml(
                siteName
              )}"
            >

          </span>


          <span
            class="brand-copy"
          >

            <strong
              class="brand-name"
            >
              ${escapeHtml(
                siteName
              )}
            </strong>

            <span
              class="brand-subtitle"
            >
              OFFICIAL WEBSITE
            </span>

          </span>

        </a>


        <nav class="nav">

          ${
            renderNavigation(
              data.navigation
            )
          }

        </nav>

      </div>

    </header>

  `;


  /* -------------------------------------------------------
     MAIN
  ------------------------------------------------------- */

  html += `
    <main id="top">
  `;


  const sections =
    arrayValue(
      data.sections
    );


  sections
    .filter(
      isEnabled
    )
    .forEach(
      (
        section,
        sectionIndex
      ) => {

        const type =
          String(
            section.type ||
            ""
          ).toLowerCase();


        switch (
          type
        ) {

          case "hero":

            html +=
              renderHero(
                section,
                data,
                sectionIndex
              );

            break;


          case "stats":

            html +=
              renderStats(
                section,
                data,
                sectionIndex
              );

            break;


          case "projects":

            html +=
              renderProjects(
                section,
                data,
                sectionIndex
              );

            break;


          case "updates":

            html +=
              renderUpdates(
                section,
                data,
                sectionIndex
              );

            break;


          case "embeds":

            html +=
              renderEmbeds(
                section,
                data,
                sectionIndex
              );

            break;


          case "links":

            html +=
              renderLinks(
                section,
                data,
                sectionIndex
              );

            break;


          case "github":

            html +=
              renderGithub(
                section,
                data,
                sectionIndex
              );

            break;


          case "text":

            html +=
              renderText(
                section,
                sectionIndex
              );

            break;

        }

      }
    );


  html += `
    </main>
  `;


  /* -------------------------------------------------------
     FOOTER
  ------------------------------------------------------- */

  if (
    settings.showFooter !== false
  ) {

    html += `

      <footer
        class="site-footer"
        data-editor-element
        data-editor-label="フッター"
      >

        <div
          class="container footer-inner"
        >

          <div
            class="footer-left"
          >

            <strong
              data-editor-text
              data-editor-label="フッターサイト名"
              data-cms-path="site.name"
            >
              ${escapeHtml(
                siteName
              )}
            </strong>


            <span
              class="footer-text"
              data-editor-text
              data-editor-label="フッターテキスト"
              data-cms-path="settings.footerText"
            >
              ${escapeHtml(
                settings.footerText ||
                "Built by maru_m4ru_maru"
              )}
            </span>

          </div>


          <div
            class="footer-right"
          >

            ©
            ${new Date().getFullYear()}

          </div>

        </div>

      </footer>

    `;

  }


  return html;

}


/* =========================================================
   NAVIGATION
========================================================= */

function renderNavigation(
  navigation
) {

  const items =
    arrayValue(
      navigation
    );


  return items
    .filter(
      isEnabled
    )
    .map(
      (
        item,
        index
      ) => `

        <a
          class="nav-link"
          href="${escapeHtml(
            safeUrl(
              item.href
            )
          )}"
          ${
            item.newTab
              ? `target="_blank"
                 rel="noopener noreferrer"`
              : ""
          }
          data-editor-element
          data-editor-label="ナビゲーション"
          data-cms-path="navigation.${index}.label"
          data-cms-kind="navigation"
          data-cms-index="${index}"
        >
          ${escapeHtml(
            item.label ||
            "Link"
          )}
        </a>

      `
    )
    .join("");

}


/* =========================================================
   HERO
========================================================= */

function renderHero(
  section,
  data,
  sectionIndex
) {

  const site =
    data.site || {};


  const title =
    section.title ||
    site.tagline ||
    "こんにちは！";


  const description =
    section.description ||
    site.description ||
    "";


  return `

    <section
      id="hero"
      class="hero"
      data-editor-element
      data-editor-label="Hero"
      data-cms-kind="section"
      data-cms-index="${sectionIndex}"
    >

      <div
        class="container"
      >

        <div
          class="hero-shell"
        >

          <div
            class="hero-content"
          >

            <div
              class="eyebrow"
              data-editor-text
              data-editor-label="Heroラベル"
            >
              INDIE DEVELOPER
            </div>


            <h1
              data-editor-text
              data-editor-label="Heroタイトル"
              data-cms-path="sections.${sectionIndex}.title"
            >
              ${escapeHtml(
                title
              )}
            </h1>


            <p
              class="hero-description"
              data-editor-text
              data-editor-label="Hero説明"
              data-cms-path="sections.${sectionIndex}.description"
            >
              ${escapeHtml(
                description
              )}
            </p>


            <div
              class="hero-actions"
            >

              <a
                class="button button-dark"
                href="#projects"
                data-editor-element
                data-editor-label="Projectsボタン"
              >
                Projects
              </a>


              ${
                site.github
                  ? `

                    <a
                      class="button button-light"
                      href="${escapeHtml(
                        site.github
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-editor-element
                      data-editor-label="GitHubボタン"
                      data-cms-path="site.github"
                    >
                      GitHub
                    </a>

                  `
                  : ""
              }

            </div>

          </div>

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   STATS
========================================================= */

function renderStats(
  section,
  data,
  sectionIndex
) {

  const stats =
    arrayValue(
      data.stats
    ).filter(
      isEnabled
    );


  if (!stats.length) {
    return "";
  }


  return `

    <section
      id="stats"
      class="section"
    >

      <div
        class="container"
      >

        <div
          class="section-heading"
        >

          <div>

            <span
              class="eyebrow muted"
            >
              OVERVIEW
            </span>


            <h2
              data-editor-text
              data-editor-label="Statsタイトル"
              data-cms-path="sections.${sectionIndex}.title"
            >
              ${escapeHtml(
                section.title ||
                "Quick Stats"
              )}
            </h2>

          </div>

        </div>


        <div
          class="stats-grid"
        >

          ${stats
            .map(
              (
                stat,
                visibleIndex
              ) => {

                const originalIndex =
                  data.stats.indexOf(
                    stat
                  );


                return `

                  <article
                    class="stat-card"
                    data-editor-element
                    data-editor-label="統計カード"
                    data-cms-kind="stat"
                    data-cms-index="${originalIndex}"
                  >

                    <span
                      class="stat-label"
                      data-editor-text
                      data-editor-label="統計ラベル"
                      data-cms-path="stats.${originalIndex}.label"
                    >
                      ${escapeHtml(
                        stat.label ||
                        ""
                      )}
                    </span>


                    <strong
                      class="stat-value"
                      data-editor-text
                      data-editor-label="統計値"
                      data-cms-path="stats.${originalIndex}.value"
                    >
                      ${escapeHtml(
                        stat.value ||
                        ""
                      )}
                    </strong>


                    ${
                      stat.meta
                        ? `

                          <span
                            class="stat-meta"
                            data-editor-text
                            data-editor-label="統計補足"
                            data-cms-path="stats.${originalIndex}.meta"
                          >
                            ${escapeHtml(
                              stat.meta
                            )}
                          </span>

                        `
                        : ""
                    }

                  </article>

                `;

              }
            )
            .join("")}

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   PROJECTS
========================================================= */

function renderProjects(
  section,
  data,
  sectionIndex
) {

  const projects =
    arrayValue(
      data.projects
    ).filter(
      isEnabled
    );


  if (!projects.length) {
    return "";
  }


  return `

    <section
      id="projects"
      class="section"
    >

      <div
        class="container"
      >

        <div
          class="section-heading"
        >

          <div>

            <span
              class="eyebrow muted"
            >
              WORK
            </span>


            <h2
              data-editor-text
              data-editor-label="Projectsタイトル"
              data-cms-path="sections.${sectionIndex}.title"
            >
              ${escapeHtml(
                section.title ||
                "Projects"
              )}
            </h2>

          </div>

        </div>


        <div
          class="projects-grid"
        >

          ${projects
            .map(
              (
                project
              ) => {

                const originalIndex =
                  data.projects.indexOf(
                    project
                  );


                return renderProjectCard(
                  project,
                  originalIndex
                );

              }
            )
            .join("")}

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   PROJECT CARD
========================================================= */

function renderProjectCard(
  project,
  index
) {

  const tags =
    arrayValue(
      project.tags
    );


  return `

    <article
      class="
        project-card
        ${
          project.featured
            ? "project-featured"
            : ""
        }
      "
      data-editor-element
      data-editor-label="プロジェクト"
      data-cms-kind="project"
      data-cms-index="${index}"
    >

      <div
        class="project-top"
      >

        <div
          class="project-icon"
        >
          ${escapeHtml(
            project.icon ||
            "PR"
          )}
        </div>


        ${
          project.status
            ? `

              <span
                class="project-status"
              >
                ${escapeHtml(
                  project.status
                )}
              </span>

            `
            : ""
        }

      </div>


      <div
        class="project-body"
      >

        <h3
          data-editor-text
          data-editor-label="プロジェクト名"
          data-cms-path="projects.${index}.title"
        >
          ${escapeHtml(
            project.title ||
            "Untitled Project"
          )}
        </h3>


        <p
          data-editor-text
          data-editor-label="プロジェクト説明"
          data-cms-path="projects.${index}.description"
        >
          ${escapeHtml(
            project.description ||
            ""
          )}
        </p>


        ${
          tags.length
            ? `

              <div
                class="project-tags"
              >

                ${tags
                  .map(
                    (tag) => `
                      <span>
                        ${escapeHtml(
                          tag
                        )}
                      </span>
                    `
                  )
                  .join("")}

              </div>

            `
            : ""
        }

      </div>


      ${
        project.url ||
        project.github
          ? `

            <div
              class="project-actions"
            >

              ${
                project.url
                  ? `

                    <a
                      href="${escapeHtml(
                        project.url
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </a>

                  `
                  : ""
              }


              ${
                project.github
                  ? `

                    <a
                      href="${escapeHtml(
                        project.github
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>

                  `
                  : ""
              }

            </div>

          `
          : ""
      }

    </article>

  `;

}


/* =========================================================
   UPDATES
========================================================= */

function renderUpdates(
  section,
  data,
  sectionIndex
) {

  const updates =
    arrayValue(
      data.updates
    )
      .filter(
        isEnabled
      )
      .slice(
        0,
        10
      );


  if (!updates.length) {
    return "";
  }


  return `

    <section
      id="updates"
      class="section"
    >

      <div
        class="container"
      >

        <div
          class="section-heading"
        >

          <div>

            <span
              class="eyebrow muted"
            >
              CHANGELOG
            </span>


            <h2
              data-editor-text
              data-editor-label="Updatesタイトル"
              data-cms-path="sections.${sectionIndex}.title"
            >
              ${escapeHtml(
                section.title ||
                "What's New"
              )}
            </h2>

          </div>

        </div>


        <div
          class="updates-list"
        >

          ${updates
            .map(
              (
                update
              ) => {

                const originalIndex =
                  data.updates.indexOf(
                    update
                  );


                return `

                  <article
                    class="update-card"
                    data-editor-element
                    data-editor-label="アップデート"
                    data-cms-kind="update"
                    data-cms-index="${originalIndex}"
                  >

                    <div
                      class="update-date"
                    >
                      ${escapeHtml(
                        update.date ||
                        ""
                      )}
                    </div>


                    <div
                      class="update-content"
                    >

                      ${
                        update.project
                          ? `

                            <span
                              class="update-project"
                            >
                              ${escapeHtml(
                                update.project
                              )}
                            </span>

                          `
                          : ""
                      }


                      <h3
                        data-editor-text
                        data-editor-label="アップデートタイトル"
                        data-cms-path="updates.${originalIndex}.title"
                      >
                        ${escapeHtml(
                          update.title ||
                          "Update"
                        )}
                      </h3>


                      <p
                        data-editor-text
                        data-editor-label="アップデート説明"
                        data-cms-path="updates.${originalIndex}.description"
                      >
                        ${escapeHtml(
                          update.description ||
                          ""
                        )}
                      </p>

                    </div>


                    ${
                      update.version
                        ? `

                          <span
                            class="update-version"
                          >
                            ${escapeHtml(
                              update.version
                            )}
                          </span>

                        `
                        : ""
                    }

                  </article>

                `;

              }
            )
            .join("")}

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   GITHUB
========================================================= */

function renderGithub(
  section,
  data,
  sectionIndex
) {

  if (
    data.settings?.showGitHubCTA ===
    false
  ) {
    return "";
  }


  const github =
    safeUrl(
      data.site?.github
    );


  return `

    <section
      id="github"
      class="section github-section"
    >

      <div
        class="container"
      >

        <div
          class="github-shell"
          data-editor-element
          data-editor-label="GitHubセクション"
        >

          <div>

            <span
              class="eyebrow"
            >
              OPEN SOURCE
            </span>


            <h2
              data-editor-text
              data-editor-label="GitHubタイトル"
              data-cms-path="sections.${sectionIndex}.title"
            >
              ${escapeHtml(
                section.title ||
                "Open Source"
              )}
            </h2>


            <p
              data-editor-text
              data-editor-label="GitHub説明"
            >
              コードや制作物はGitHubで公開しています。
            </p>

          </div>


          ${
            github !== "#"
              ? `

                <a
                  class="button button-dark"
                  href="${escapeHtml(
                    github
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-editor-element
                  data-editor-label="GitHubリンク"
                >
                  GitHubを見る
                </a>

              `
              : ""
          }

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   EMBEDS
========================================================= */

function renderEmbeds(
  section,
  data,
  sectionIndex
) {

  const embeds =
    arrayValue(
      data.embeds
    ).filter(
      (item) =>
        isEnabled(item) &&
        item.url
    );


  if (!embeds.length) {
    return "";
  }


  return `

    <section
      class="section"
    >

      <div
        class="container embed-list"
      >

        ${embeds
          .map(
            (
              embed
            ) => `

              <article
                class="embed-card"
                data-editor-element
                data-editor-label="埋め込み"
              >

                <div
                  class="embed-header"
                >

                  <h2
                    data-editor-text
                    data-editor-label="埋め込みタイトル"
                  >
                    ${escapeHtml(
                      embed.title ||
                      "Embed"
                    )}
                  </h2>

                </div>


                <iframe
                  src="${escapeHtml(
                    embed.url
                  )}"
                  width="${escapeHtml(
                    embed.width ||
                    "100%"
                  )}"
                  height="${escapeHtml(
                    embed.height ||
                    "420"
                  )}"
                  loading="lazy"
                  title="${escapeHtml(
                    embed.title ||
                    "Embedded content"
                  )}"
                ></iframe>

              </article>

            `
          )
          .join("")}

      </div>

    </section>

  `;

}


/* =========================================================
   LINKS
========================================================= */

function renderLinks(
  section,
  data
) {

  const links =
    arrayValue(
      data.links
    ).filter(
      isEnabled
    );


  if (!links.length) {
    return "";
  }


  return `

    <section
      class="section"
    >

      <div
        class="container"
      >

        <div
          class="section-heading"
        >

          <div>

            <span
              class="eyebrow muted"
            >
              LINKS
            </span>

            <h2>
              Links
            </h2>

          </div>

        </div>


        <div
          class="links-grid"
        >

          ${links
            .map(
              (
                link,
                index
              ) => `

                <a
                  class="link-card"
                  href="${escapeHtml(
                    safeUrl(
                      link.url
                    )
                  )}"
                  ${
                    link.newTab
                      ? `target="_blank"
                         rel="noopener noreferrer"`
                      : ""
                  }
                  data-editor-element
                  data-editor-label="リンク"
                  data-cms-path="links.${index}.label"
                >

                  <span>
                    ${escapeHtml(
                      link.label ||
                      "Link"
                    )}
                  </span>

                  <span>
                    ↗
                  </span>

                </a>

              `
            )
            .join("")}

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   TEXT
========================================================= */

function renderText(
  section,
  sectionIndex
) {

  return `

    <section
      class="section"
    >

      <div
        class="container"
      >

        <div
          class="text-card"
          data-editor-element
          data-editor-label="テキストセクション"
        >

          <span
            class="eyebrow muted"
          >
            SECTION
          </span>


          <h2
            data-editor-text
            data-editor-label="見出し"
            data-cms-path="sections.${sectionIndex}.title"
          >
            ${escapeHtml(
              section.title ||
              "Text"
            )}
          </h2>


          <p
            data-editor-text
            data-editor-label="本文"
            data-cms-path="sections.${sectionIndex}.description"
          >
            ${escapeHtml(
              section.description ||
              ""
            )}
          </p>

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   EDITOR BINDING
========================================================= */

function bindEditorElements(
  root
) {

  root
    .querySelectorAll(
      `
        [data-editor-text],
        [data-editor-element]
      `
    )
    .forEach(
      (
        element
      ) => {

        if (
          element.dataset.editorIgnore !==
          undefined
        ) {
          return;
        }


        element.addEventListener(
          "mouseenter",
          () => {

            if (
              selectedElement ===
              element
            ) {
              return;
            }

            element.classList.add(
              "editor-hover"
            );

          }
        );


        element.addEventListener(
          "mouseleave",
          () => {

            element.classList.remove(
              "editor-hover"
            );

          }
        );


        element.addEventListener(
          "click",
          (event) => {

            event.preventDefault();

            event.stopPropagation();

            selectElement(
              element
            );

          }
        );

      }
    );

}


/* =========================================================
   SELECT ELEMENT
========================================================= */

function selectElement(
  element
) {

  if (
    isRendering
  ) {
    return;
  }


  if (
    selectedElement &&
    selectedElement !== element
  ) {

    selectedElement.classList.remove(
      "editor-selected"
    );

  }


  selectedElement =
    element;


  selectedMeta = {
    label:
      element.dataset.editorLabel ||
      "要素",
    type:
      element.dataset.editorText !==
      undefined
        ? "TEXT"
        : "ELEMENT",
    path:
      element.dataset.cmsPath ||
      null
  };


  element.classList.add(
    "editor-selected"
  );


  showPropertyPanel(
    element
  );


  positionFloatingToolbar(
    element
  );

}


/* =========================================================
   CLEAR SELECTION
========================================================= */

function clearSelection() {

  if (
    selectedElement
  ) {

    selectedElement.classList.remove(
      "editor-selected"
    );

  }


  selectedElement =
    null;

  selectedMeta =
    null;


  if (
    floatingToolbar
  ) {

    floatingToolbar.classList.add(
      "hidden"
    );

  }


  if (
    propertyEmpty &&
    propertyContent
  ) {

    propertyEmpty.classList.remove(
      "hidden"
    );

    propertyContent.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   PROPERTY PANEL
========================================================= */

function showPropertyPanel(
  element
) {

  propertyEmpty.classList.add(
    "hidden"
  );

  propertyContent.classList.remove(
    "hidden"
  );


  propertyTitle.textContent =
    element.dataset.editorLabel ||
    "要素を編集";


  if (
    element.dataset.editorText !==
    undefined
  ) {

    propertyType.textContent =
      "TEXT";

    setupTextControls(
      element
    );

  } else {

    propertyType.textContent =
      "ELEMENT";

    setupElementControls(
      element
    );

  }

}


/* =========================================================
   CONTROLS VISIBILITY
========================================================= */

function hideAllControls() {

  textControls.classList.add(
    "hidden"
  );

  colorControls.classList.add(
    "hidden"
  );

  linkControls.classList.add(
    "hidden"
  );

  imageControls.classList.add(
    "hidden"
  );

}


/* =========================================================
   TEXT CONTROLS
========================================================= */

function setupTextControls(
  element
) {

  hideAllControls();


  textControls.classList.remove(
    "hidden"
  );


  const textValue =
    document.getElementById(
      "textValue"
    );


  const textColor =
    document.getElementById(
      "textColor"
    );


  const textColorText =
    document.getElementById(
      "textColorText"
    );


  const fontSize =
    document.getElementById(
      "fontSize"
    );


  const fontSizeValue =
    document.getElementById(
      "fontSizeValue"
    );


  textValue.value =
    element.innerText;


  const computed =
    getComputedStyle(
      element
    );


  const color =
    rgbToHex(
      computed.color
    );


  textColor.value =
    color;


  textColorText.value =
    color;


  const currentSize =
    parseInt(
      computed.fontSize,
      10
    ) || 16;


  fontSize.value =
    Math.min(
      120,
      Math.max(
        10,
        currentSize
      )
    );


  fontSizeValue.value =
    `${currentSize}px`;


  updateFontWeightButtons(
    computed.fontWeight
  );


  /*
    既存inputイベントを
    一度リセット。
  */

  textValue.oninput =
    null;

  textColor.oninput =
    null;

  textColorText.onchange =
    null;

  fontSize.oninput =
    null;


  textValue.oninput =
    () => {

      if (
        !selectedElement
      ) {
        return;
      }


      pushHistory();


      const value =
        textValue.value;


      selectedElement.innerText =
        value;


      writeCmsValue(
        selectedElement,
        value
      );


      markChanged();

    };


  textColor.oninput =
    () => {

      if (
        !selectedElement
      ) {
        return;
      }


      pushHistory();


      selectedElement.style.color =
        textColor.value;


      textColorText.value =
        textColor.value;


      writeStyleValue(
        selectedElement,
        "color",
        textColor.value
      );


      markChanged();

    };


  textColorText.onchange =
    () => {

      if (
        !selectedElement
      ) {
        return;
      }


      const normalized =
        normalizeHex(
          textColorText.value
        );


      if (!normalized) {
        return;
      }


      pushHistory();


      selectedElement.style.color =
        normalized;


      textColor.value =
        normalized;


      writeStyleValue(
        selectedElement,
        "color",
        normalized
      );


      markChanged();

    };


  fontSize.oninput =
    () => {

      if (
        !selectedElement
      ) {
        return;
      }


      pushHistory();


      const px =
        `${fontSize.value}px`;


      selectedElement.style.fontSize =
        px;


      fontSizeValue.value =
        px;


      writeStyleValue(
        selectedElement,
        "fontSize",
        px
      );


      markChanged();

    };

}


/* =========================================================
   ELEMENT CONTROLS
========================================================= */

function setupElementControls(
  element
) {

  hideAllControls();


  colorControls.classList.remove(
    "hidden"
  );


  linkControls.classList.remove(
    "hidden"
  );


  if (
    element.tagName ===
    "IMG"
  ) {

    imageControls.classList.remove(
      "hidden"
    );

  }


  const backgroundColor =
    document.getElementById(
      "backgroundColor"
    );


  const backgroundColorText =
    document.getElementById(
      "backgroundColorText"
    );


  const computed =
    getComputedStyle(
      element
    );


  const background =
    rgbToHex(
      computed.backgroundColor
    );


  backgroundColor.value =
    background;


  backgroundColorText.value =
    background;


  backgroundColor.oninput =
    () => {

      if (
        !selectedElement
      ) {
        return;
      }


      pushHistory();


      selectedElement.style.backgroundColor =
        backgroundColor.value;


      backgroundColorText.value =
        backgroundColor.value;


      writeStyleValue(
        selectedElement,
        "backgroundColor",
        backgroundColor.value
      );


      markChanged();

    };


  backgroundColorText.onchange =
    () => {

      if (
        !selectedElement
      ) {
        return;
      }


      const normalized =
        normalizeHex(
          backgroundColorText.value
        );


      if (!normalized) {
        return;
      }


      pushHistory();


      selectedElement.style.backgroundColor =
        normalized;


      backgroundColor.value =
        normalized;


      writeStyleValue(
        selectedElement,
        "backgroundColor",
        normalized
      );


      markChanged();

    };


  const linkValue =
    document.getElementById(
      "linkValue"
    );


  if (
    element.tagName ===
    "A"
  ) {

    linkValue.value =
      element.getAttribute(
        "href"
      ) || "";

  } else {

    linkValue.value =
      "";

  }


  linkValue.oninput =
    () => {

      if (
        selectedElement &&
        selectedElement.tagName ===
          "A"
      ) {

        selectedElement.href =
          linkValue.value;

        writeCmsValue(
          selectedElement,
          linkValue.value,
          "href"
        );

        markChanged();

      }

    };


  const imageValue =
    document.getElementById(
      "imageValue"
    );


  if (
    imageValue
  ) {

    if (
      element.tagName ===
      "IMG"
    ) {

      imageValue.value =
        element.src;

    } else {

      imageValue.value =
        "";

    }


    imageValue.oninput =
      () => {

        if (
          selectedElement &&
          selectedElement.tagName ===
            "IMG"
        ) {

          selectedElement.src =
            imageValue.value;

          markChanged();

        }

      };

  }

}


/* =========================================================
   CMS PATH
========================================================= */

function parseCmsPath(
  path
) {

  if (
    typeof path !==
      "string" ||
    !path
  ) {

    return null;

  }


  return path
    .split(".")
    .map(
      (part) => {

        if (
          /^[0-9]+$/.test(
            part
          )
        ) {

          return Number(
            part
          );

        }

        return part;

      }
    );

}


function getPathParent(
  root,
  pathParts
) {

  if (
    !Array.isArray(pathParts) ||
    !pathParts.length
  ) {
    return null;
  }


  let current =
    root;


  for (
    let i = 0;
    i < pathParts.length - 1;
    i++
  ) {

    const key =
      pathParts[i];


    if (
      current === null ||
      current === undefined
    ) {

      return null;

    }


    if (
      current[key] ===
      undefined
    ) {

      current[key] =
        typeof pathParts[i + 1] ===
        "number"
          ? []
          : {};

    }


    current =
      current[key];

  }


  return current;

}


function writeCmsValue(
  element,
  value,
  propertyOverride = null
) {

  const path =
    element.dataset.cmsPath;


  if (!path) {

    return;

  }


  const parts =
    parseCmsPath(
      path
    );


  if (
    !parts ||
    !parts.length
  ) {

    return;

  }


  const parent =
    getPathParent(
      siteData,
      parts
    );


  if (!parent) {

    return;

  }


  const finalKey =
    propertyOverride ||
    parts[
      parts.length - 1
    ];


  parent[finalKey] =
    value;

}


/* =========================================================
   STYLE STORAGE
========================================================= */

function writeStyleValue(
  element,
  property,
  value
) {

  /*
    site-data.json に style 情報を
    保存できるようにする。

    例:
    projects.0.style.color
  */

  const cmsPath =
    element.dataset.cmsPath;


  if (!cmsPath) {
    return;
  }


  const parts =
    parseCmsPath(
      cmsPath
    );


  if (
    !parts ||
    !parts.length
  ) {
    return;
  }


  let base =
    siteData;


  for (
    const part of parts
  ) {

    if (
      base[part] ===
      undefined
    ) {

      base[part] =
        {};

    }


    base =
      base[part];

  }


  /*
    最後の値が文字列なら
    その親要素へ style を追加。
  */

  const parent =
    getPathParent(
      siteData,
      parts
    );


  if (
    !parent ||
    !isObject(parent[
      parts[
        parts.length - 1
      ]
    ])
  ) {

    /*
      CMS項目そのものが文字列なので、
      その横に保存するための
      _style オブジェクトを使う。
    */

    const key =
      parts[
        parts.length - 1
      ];


    if (
      isObject(
        parent[
          `${String(key)}Style`
        ]
      )
    ) {

      parent[
        `${String(key)}Style`
      ][
        property
      ] =
        value;

    } else {

      parent[
        `${String(key)}Style`
      ] =
        {
          [property]:
            value
        };

    }


    return;

  }


  const target =
    parent[
      parts[
        parts.length - 1
      ]
    ];


  if (
    !isObject(
      target.style
    )
  ) {

    target.style =
      {};

  }


  target.style[
    property
  ] =
    value;

}


/* =========================================================
   CHANGED
========================================================= */

function markChanged() {

  hasChanges =
    true;


  setSaveStatus(
    "dirty",
    "未保存の変更"
  );

}


/* =========================================================
   FONT WEIGHT
========================================================= */

function updateFontWeightButtons(
  current
) {

  const numeric =
    Number(
      current
    ) || 400;


  document
    .querySelectorAll(
      "[data-font-weight]"
    )
    .forEach(
      (
        button
      ) => {

        button.classList.toggle(
          "active",
          Number(
            button.dataset.fontWeight
          ) === numeric
        );

      }
    );

}


/* =========================================================
   COLOR
========================================================= */

function rgbToHex(
  value
) {

  if (
    typeof value !==
    "string"
  ) {

    return "#111318";

  }


  if (
    value.startsWith("#")
  ) {

    return (
      normalizeHex(
        value
      ) ||
      "#111318"
    );

  }


  const match =
    value.match(
      /\d+/g
    );


  if (
    !match ||
    match.length < 3
  ) {

    return "#111318";

  }


  return (
    "#" +
    match
      .slice(
        0,
        3
      )
      .map(
        (
          number
        ) =>
          Number(
            number
          )
            .toString(16)
            .padStart(
              2,
              "0"
            )
      )
      .join("")
  );

}


function normalizeHex(
  value
) {

  const v =
    String(
      value ||
      ""
    ).trim();


  if (
    /^#[0-9a-f]{6}$/i.test(
      v
    )
  ) {

    return v.toLowerCase();

  }


  if (
    /^#[0-9a-f]{3}$/i.test(
      v
    )
  ) {

    return (
      "#" +
      v
        .slice(
          1
        )
        .split("")
        .map(
          (
            char
          ) =>
            char + char
        )
        .join("")
    ).toLowerCase();

  }


  return null;

}


/* =========================================================
   FLOATING TOOLBAR
========================================================= */

function positionFloatingToolbar(
  element
) {

  if (
    !floatingToolbar
  ) {
    return;
  }


  floatingToolbar.classList.remove(
    "hidden"
  );


  const rect =
    element.getBoundingClientRect();


  const width =
    floatingToolbar.offsetWidth;


  const height =
    floatingToolbar.offsetHeight;


  const left =
    Math.min(
      window.innerWidth -
        width -
        12,
      Math.max(
        12,
        rect.left
      )
    );


  let top =
    rect.top -
    height -
    10;


  if (
    top < 10
  ) {

    top =
      rect.bottom +
      10;

  }


  floatingToolbar.style.left =
    `${left}px`;


  floatingToolbar.style.top =
    `${top}px`;

}


/* =========================================================
   SAVE
========================================================= */

async function saveSite() {

  if (!siteData) {

    return;

  }


  /*
    保存直前にも認証を確認。
  */

  if (
    !isAdminAuthenticated()
  ) {

    window.location.replace(
      ADMIN_PAGE_URL
    );

    return;

  }


  const token =
    getAdminToken();


  setSaveStatus(
    "saving",
    "保存中…"
  );


  try {

    const response =
      await fetch(
        `${WORKER_URL}/admin/save`,
        {
          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${token}`

          },

          body:
            JSON.stringify({
              file:
                "site-data.json",

              siteData:
                siteData

            })

        }
      );


    let result =
      null;


    try {

      result =
        await response.json();

    } catch {

      result =
        null;

    }


    if (
      !response.ok
    ) {

      if (
        response.status ===
        401
      ) {

        sessionStorage.removeItem(
          "maru_admin_token"
        );

        sessionStorage.removeItem(
          "maru_admin_expires"
        );


        window.location.replace(
          ADMIN_PAGE_URL
        );


        return;

      }


      throw new Error(
        result?.message ||
        `保存に失敗しました (HTTP ${response.status})`
      );

    }


    hasChanges =
      false;


    setSaveStatus(
      "saved",
      "保存しました"
    );


  } catch (
    error
  ) {

    console.error(
      "[Editor] save error",
      error
    );


    setSaveStatus(
      "dirty",
      "保存失敗"
    );


    alert(
      error.message
    );

  }

}


/* =========================================================
   IMAGE / ELEMENT TOOLBAR
========================================================= */

const editTextQuickButton =
  document.getElementById(
    "editTextQuickButton"
  );

const editColorQuickButton =
  document.getElementById(
    "editColorQuickButton"
  );

const editLinkQuickButton =
  document.getElementById(
    "editLinkQuickButton"
  );


if (
  editTextQuickButton
) {

  editTextQuickButton.addEventListener(
    "click",
    () => {

      if (
        selectedElement
      ) {

        showPropertyPanel(
          selectedElement
        );

        const textValue =
          document.getElementById(
            "textValue"
          );

        if (
          textValue
        ) {

          textValue.focus();

        }

      }

    }
  );

}


if (
  editColorQuickButton
) {

  editColorQuickButton.addEventListener(
    "click",
    () => {

      if (
        selectedElement
      ) {

        const colorInput =
          document.getElementById(
            selectedElement.dataset.editorText !==
              undefined
              ? "textColor"
              : "backgroundColor"
          );


        if (
          colorInput
        ) {

          colorInput.click();

        }

      }

    }
  );

}


if (
  editLinkQuickButton
) {

  editLinkQuickButton.addEventListener(
    "click",
    () => {

      if (
        !selectedElement
      ) {
        return;
      }


      const linkValue =
        document.getElementById(
          "linkValue"
        );


      if (
        linkValue
      ) {

        linkValue.focus();

      }

    }
  );

}


/* =========================================================
   SAVE EVENTS
========================================================= */

const saveButton =
  document.getElementById(
    "saveButton"
  );

const saveModal =
  document.getElementById(
    "saveModal"
  );

const cancelSaveButton =
  document.getElementById(
    "cancelSaveButton"
  );

const confirmSaveButton =
  document.getElementById(
    "confirmSaveButton"
  );


if (
  saveButton
) {

  saveButton.addEventListener(
    "click",
    () => {

      if (
        !hasChanges
      ) {

        setSaveStatus(
          "saved",
          "変更はありません"
        );

        return;

      }


      saveModal.classList.remove(
        "hidden"
      );

    }
  );

}


if (
  cancelSaveButton
) {

  cancelSaveButton.addEventListener(
    "click",
    () => {

      saveModal.classList.add(
        "hidden"
      );

    }
  );

}


if (
  confirmSaveButton
) {

  confirmSaveButton.addEventListener(
    "click",
    async () => {

      saveModal.classList.add(
        "hidden"
      );

      await saveSite();

    }
  );

}


/* =========================================================
   UNDO / REDO
========================================================= */

const undoButton =
  document.getElementById(
    "undoButton"
  );

const redoButton =
  document.getElementById(
    "redoButton"
  );


if (
  undoButton
) {

  undoButton.addEventListener(
    "click",
    undo
  );

}


if (
  redoButton
) {

  redoButton.addEventListener(
    "click",
    redo
  );

}


/* =========================================================
   CLOSE PROPERTY
========================================================= */

const closePropertyButton =
  document.getElementById(
    "closePropertyButton"
  );


if (
  closePropertyButton
) {

  closePropertyButton.addEventListener(
    "click",
    () => {

      clearSelection();

    }
  );

}


/* =========================================================
   BACK TO ADMIN
========================================================= */

const backButton =
  document.getElementById(
    "backButton"
  );


if (
  backButton
) {

  backButton.addEventListener(
    "click",
    () => {

      if (
        hasChanges
      ) {

        const leave =
          confirm(
            "保存していない変更があります。Adminへ戻りますか？"
          );


        if (!leave) {
          return;
        }

      }


      window.location.href =
        "../admin/panel.html";

    }
  );

}


/* =========================================================
   PREVIEW BUTTON
========================================================= */

const previewButton =
  document.getElementById(
    "previewButton"
  );


if (
  previewButton
) {

  previewButton.addEventListener(
    "click",
    () => {

      window.open(
        "../index.html",
        "_blank",
        "noopener,noreferrer"
      );

    }
  );

}


/* =========================================================
   HELPERS
========================================================= */

function getEditorScopedCSS() {

  /*
    Editor内で公開ページCSSを
    そのまま使う。

    今は外部style.cssを直接リンクせず、
    既存ページとの競合を減らす。
  */

  return `

    @import url("../style.css");

    /*
      Editorの選択UI
    */

    .editor-selected {
      outline:
        2px solid
        #111318 !important;

      outline-offset:
        5px !important;

      box-shadow:
        0 0 0 5px
        rgba(17,19,24,.10)
        !important;

      cursor:
        pointer !important;
    }


    .editor-hover {
      outline:
        1px dashed
        #858b94 !important;

      outline-offset:
        4px !important;

      cursor:
        pointer !important;
    }


    .website-page
    a {
      cursor:
        pointer;
    }


    .website-page
    [data-editor-ignore] {
      cursor:
        default;
    }

  `;

}


/* =========================================================
   UNSAVED WARNING
========================================================= */

window.addEventListener(
  "beforeunload",
  (event) => {

    if (
      !hasChanges
    ) {
      return;
    }


    event.preventDefault();

    event.returnValue =
      "";

  }
);


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    const modifier =
      event.ctrlKey ||
      event.metaKey;


    if (
      modifier &&
      event.key.toLowerCase() ===
        "z"
    ) {

      event.preventDefault();


      if (
        event.shiftKey
      ) {

        redo();

      } else {

        undo();

      }


      return;

    }


    if (
      modifier &&
      event.key.toLowerCase() ===
        "y"
    ) {

      event.preventDefault();

      redo();

      return;

    }


    if (
      modifier &&
      event.key.toLowerCase() ===
        "s"
    ) {

      event.preventDefault();


      if (
        hasChanges
      ) {

        saveSite();

      }


      return;

    }


    if (
      event.key ===
      "Escape"
    ) {

      clearSelection();

    }

  }
);


/* =========================================================
   FLOATING TOOLBAR POSITION
========================================================= */

window.addEventListener(
  "scroll",
  () => {

    if (
      selectedElement
    ) {

      positionFloatingToolbar(
        selectedElement
      );

    }

  },
  true
);


window.addEventListener(
  "resize",
  () => {

    if (
      selectedElement
    ) {

      positionFloatingToolbar(
        selectedElement
      );

    }

  }
);


/* =========================================================
   AUTH + INIT
========================================================= */

async function initEditor() {

  /*
    ここが最重要。

    Editorへ直接URLでアクセスしても、
    Adminログイン済みでなければ
    一切編集画面を使わせない。
  */

  if (
    !requireAdminAuth()
  ) {

    return;

  }


  updateHistoryButtons();


  await loadSiteData();

}


initEditor();
