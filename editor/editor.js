const DATA_URL = "../site-data.json";
const SITE_CSS_URL = "../style.css";


/* =========================================================
   STATE
========================================================= */

let siteData = null;

let selectedElement = null;

let historyStack = [];

let futureStack = [];

let hasChanges = false;


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


/* =========================================================
   STATUS
========================================================= */

function setSaveStatus(
  status,
  text
) {

  saveStatus.className =
    "save-status";

  saveStatus.classList.add(
    status
  );

  saveStatus.textContent =
    text;

}


/* =========================================================
   HISTORY
========================================================= */

function createSnapshot() {

  return JSON.stringify(
    siteData
  );

}


function pushHistory() {

  historyStack.push(
    createSnapshot()
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
    !historyStack.length
  ) {
    return;
  }

  futureStack.push(
    createSnapshot()
  );

  const snapshot =
    historyStack.pop();

  siteData =
    JSON.parse(
      snapshot
    );

  hasChanges = true;

  renderSite();

  updateHistoryButtons();

  setSaveStatus(
    "dirty",
    "未保存の変更"
  );

}


function redo() {

  if (
    !futureStack.length
  ) {
    return;
  }

  historyStack.push(
    createSnapshot()
  );

  const snapshot =
    futureStack.pop();

  siteData =
    JSON.parse(
      snapshot
    );

  hasChanges = true;

  renderSite();

  updateHistoryButtons();

  setSaveStatus(
    "dirty",
    "未保存の変更"
  );

}


function updateHistoryButtons() {

  document
    .getElementById(
      "undoButton"
    )
    .disabled =
      historyStack.length === 0;

  document
    .getElementById(
      "redoButton"
    )
    .disabled =
      futureStack.length === 0;

}


/* =========================================================
   LOAD DATA
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
        `HTTP ${response.status}`
      );

    }


    siteData =
      await response.json();


    renderSite();


    setSaveStatus(
      "saved",
      "保存済み"
    );


  } catch (error) {

    console.error(
      error
    );

    setSaveStatus(
      "dirty",
      "読み込み失敗"
    );

    websiteFrame.innerHTML = `
      <div style="
        padding:60px;
        text-align:center;
        font-family:sans-serif;
      ">

        <h2>
          サイトを読み込めませんでした
        </h2>

        <p>
          site-data.json を確認してください。
        </p>

      </div>
    `;

  }

}


/* =========================================================
   RENDER
========================================================= */

async function renderSite() {

  websiteFrame.innerHTML = `
    <div
      class="editor-loading"
      style="
        padding:60px;
        text-align:center;
        color:#888;
        font-family:sans-serif;
      "
    >
      読み込み中…
    </div>
  `;


  const site =
    siteData.site || {};


  const container =
    document.createElement(
      "div"
    );


  container.className =
    "website-page";


  /*
    Editor側で公開ページのCSSを
    読み込む。
  */

  const style =
    document.createElement(
      "link"
    );

  style.rel =
    "stylesheet";

  style.href =
    SITE_CSS_URL;


  container.appendChild(
    style
  );


  /*
    ページ本体
  */

  container.insertAdjacentHTML(
    "beforeend",
    renderWebsite(
      siteData
    )
  );


  websiteFrame.innerHTML =
    "";

  websiteFrame.appendChild(
    container
  );


  bindEditorElements(
    container
  );

}


/* =========================================================
   WEBSITE RENDERER
========================================================= */

function renderWebsite(
  data
) {

  const site =
    data.site || {};

  const settings =
    data.settings || {};


  const name =
    site.name ||
    "maru_m4ru_maru";


  const avatar =
    site.avatar ||
    "";


  let output = `

    <header class="site-header">

      <div class="container header-inner">

        <a
          class="brand"
          href="#top"
          data-editor-ignore
        >

          ${
            avatar
              ? `
                <span
                  class="brand-avatar-wrap"
                >

                  <img
                    class="brand-avatar"
                    src="${escapeHtml(
                      avatar
                    )}"
                    alt=""
                  >

                </span>
              `
              : ""
          }


          <span
            class="brand-copy"
          >

            <strong
              class="brand-name"
              data-editor-text
              data-editor-label="サイト名"
            >
              ${escapeHtml(
                name
              )}
            </strong>

            <span
              class="brand-subtitle"
            >
              OFFICIAL WEBSITE
            </span>

          </span>

        </a>


        <nav
          class="nav"
        >

          ${renderNavigation(
            data.navigation
          )}

        </nav>

      </div>

    </header>


    <main id="top">

  `;


  const sections =
    Array.isArray(
      data.sections
    )
      ? data.sections
      : [];


  sections
    .filter(
      isEnabled
    )
    .forEach(
      (section) => {

        switch (
          section.type
        ) {

          case "hero":

            output +=
              renderHero(
                section,
                data
              );

            break;


          case "stats":

            output +=
              renderStats(
                section,
                data
              );

            break;


          case "projects":

            output +=
              renderProjects(
                section,
                data
              );

            break;


          case "updates":

            output +=
              renderUpdates(
                section,
                data
              );

            break;


          case "github":

            output +=
              renderGithub(
                section,
                data
              );

            break;


          case "links":

            output +=
              renderLinks(
                section,
                data
              );

            break;


          case "text":

            output +=
              renderText(
                section
              );

            break;

        }

      }
    );


  output += `
    </main>
  `;


  if (
    settings.showFooter !== false
  ) {

    output += `

      <footer
        class="site-footer"
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
            >
              ${escapeHtml(
                name
              )}
            </strong>

            <span
              class="footer-text"
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


  return output;

}


/* =========================================================
   COMPONENTS
========================================================= */

function isEnabled(item) {

  return (
    item &&
    item.enabled !== false
  );

}


function escapeHtml(value) {

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


function renderNavigation(
  navigation
) {

  if (
    !Array.isArray(
      navigation
    )
  ) {
    return "";
  }


  return navigation
    .filter(
      isEnabled
    )
    .map(
      (item) => `

        <a
          class="nav-link"
          href="${escapeHtml(
            item.href ||
            "#"
          )}"
          ${
            item.newTab
              ? `target="_blank"
                 rel="noopener noreferrer"`
              : ""
          }
          data-editor-element
          data-editor-label="ナビゲーション"
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


function renderHero(
  section,
  data
) {

  const site =
    data.site || {};


  return `

    <section
      id="hero"
      class="hero"
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
              data-editor-label="Hero見出し"
            >
              INDIE DEVELOPER
            </div>


            <h1
              data-editor-text
              data-editor-label="Heroタイトル"
            >
              ${escapeHtml(
                section.title ||
                site.tagline ||
                "こんにちは！"
              )}
            </h1>


            <p
              class="hero-description"
              data-editor-text
              data-editor-label="Hero説明"
            >
              ${escapeHtml(
                section.description ||
                site.description ||
                ""
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


function renderStats(
  section,
  data
) {

  const stats =
    Array.isArray(
      data.stats
    )
      ? data.stats.filter(
          isEnabled
        )
      : [];


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
              (stat) => `

                <article
                  class="stat-card"
                  data-editor-element
                  data-editor-label="統計カード"
                >

                  <span
                    class="stat-label"
                  >
                    ${escapeHtml(
                      stat.label ||
                      ""
                    )}
                  </span>

                  <strong
                    class="stat-value"
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
                        >
                          ${escapeHtml(
                            stat.meta
                          )}
                        </span>
                      `
                      : ""
                  }

                </article>

              `
            )
            .join("")}

        </div>

      </div>

    </section>

  `;

}


function renderProjects(
  section,
  data
) {

  const projects =
    Array.isArray(
      data.projects
    )
      ? data.projects.filter(
          isEnabled
        )
      : [];


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
              (project) => `

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
                    >
                      ${escapeHtml(
                        project.title ||
                        "Untitled Project"
                      )}
                    </h3>


                    <p
                      data-editor-text
                      data-editor-label="プロジェクト説明"
                    >
                      ${escapeHtml(
                        project.description ||
                        ""
                      )}
                    </p>


                    ${
                      Array.isArray(
                        project.tags
                      ) &&
                      project.tags.length
                        ? `
                          <div
                            class="project-tags"
                          >

                            ${project.tags
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

              `
            )
            .join("")}

        </div>

      </div>

    </section>

  `;

}


function renderUpdates(
  section,
  data
) {

  const updates =
    Array.isArray(
      data.updates
    )
      ? data.updates.filter(
          isEnabled
        )
      : [];


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
              (update) => `

                <article
                  class="update-card"
                  data-editor-element
                  data-editor-label="アップデート"
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
                    >
                      ${escapeHtml(
                        update.title ||
                        "Update"
                      )}
                    </h3>


                    <p
                      data-editor-text
                      data-editor-label="アップデート説明"
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

              `
            )
            .join("")}

        </div>

      </div>

    </section>

  `;

}


function renderGithub(
  section,
  data
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
              コードや制作物は
              GitHub で公開しています。
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


function renderLinks(
  section,
  data
) {

  const links =
    Array.isArray(
      data.links
    )
      ? data.links.filter(
          isEnabled
        )
      : [];


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
          class="links-grid"
        >

          ${links
            .map(
              (link) => `

                <a
                  class="link-card"
                  href="${escapeHtml(
                    link.url ||
                    "#"
                  )}"
                  ${
                    link.newTab
                      ? `target="_blank"
                         rel="noopener noreferrer"`
                      : ""
                  }
                  data-editor-element
                  data-editor-label="リンク"
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


function renderText(
  section
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
          >
            ${escapeHtml(
              section.title ||
              "Text"
            )}
          </h2>


          <p
            data-editor-text
            data-editor-label="本文"
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


function safeUrl(
  value
) {

  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {

    return "#";

  }

  return value.trim();

}


/* =========================================================
   EDITOR BINDING
========================================================= */

function bindEditorElements(
  root
) {

  const editableElements =
    root.querySelectorAll(
      `
        [data-editor-text],
        [data-editor-element]
      `
    );


  editableElements.forEach(
    (element) => {

      if (
        element.dataset.editorIgnore
      ) {
        return;
      }


      element.addEventListener(
        "mouseenter",
        () => {

          if (
            element ===
            selectedElement
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
   SELECT
========================================================= */

function selectElement(
  element
) {

  if (
    selectedElement
  ) {

    selectedElement.classList.remove(
      "editor-selected"
    );

  }


  selectedElement =
    element;


  selectedElement.classList.add(
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


  const label =
    element.dataset.editorLabel ||
    "要素を編集";


  propertyTitle.textContent =
    label;


  if (
    element.dataset.editorText !==
    undefined
  ) {

    propertyType.textContent =
      "TEXT";

    showTextEditor(
      element
    );

  } else {

    propertyType.textContent =
      "ELEMENT";

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

  }

}


/* =========================================================
   TEXT EDITOR
========================================================= */

function showTextEditor(
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


  textValue.value =
    element.innerText;


  const color =
    getComputedStyle(
      element
    ).color;


  const hex =
    rgbToHex(
      color
    );


  const textColor =
    document.getElementById(
      "textColor"
    );


  const textColorText =
    document.getElementById(
      "textColorText"
    );


  textColor.value =
    hex;


  textColorText.value =
    hex;


  const size =
    parseInt(
      getComputedStyle(
        element
      ).fontSize,
      10
    ) || 16;


  const fontSize =
    document.getElementById(
      "fontSize"
    );


  const fontSizeValue =
    document.getElementById(
      "fontSizeValue"
    );


  fontSize.value =
    Math.min(
      120,
      Math.max(
        10,
        size
      )
    );


  fontSizeValue.value =
    `${size}px`;


  updateFontWeightButtons(
    getComputedStyle(
      element
    ).fontWeight
  );


  textValue.oninput =
    () => {

      pushHistory();

      element.innerText =
        textValue.value;

      markChanged();

    };


  textColor.oninput =
    () => {

      pushHistory();

      element.style.color =
        textColor.value;

      textColorText.value =
        textColor.value;

      markChanged();

    };


  textColorText.onchange =
    () => {

      const normalized =
        normalizeHex(
          textColorText.value
        );

      if (!normalized) {
        return;
      }

      pushHistory();

      element.style.color =
        normalized;

      textColor.value =
        normalized;

      markChanged();

    };


  fontSize.oninput =
    () => {

      pushHistory();

      element.style.fontSize =
        `${fontSize.value}px`;

      fontSizeValue.value =
        `${fontSize.value}px`;

      markChanged();

    };

}


/* =========================================================
   CONTROLS
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


function updateFontWeightButtons(
  value
) {

  const numeric =
    Number(
      value
    ) || 400;


  document
    .querySelectorAll(
      "[data-font-weight]"
    )
    .forEach(
      (button) => {

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
   CHANGES
========================================================= */

function markChanged() {

  hasChanges =
    true;

  setSaveStatus(
    "dirty",
    "未保存の変更"
  );

}


function rgbToHex(
  rgb
) {

  const match =
    rgb.match(
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
        (value) =>
          Number(
            value
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
      value || ""
    )
      .trim();


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
        .slice(1)
        .split("")
        .map(
          (x) =>
            x + x
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

  const toolbar =
    document.getElementById(
      "floatingToolbar"
    );


  const rect =
    element.getBoundingClientRect();


  toolbar.classList.remove(
    "hidden"
  );


  const width =
    toolbar.offsetWidth;


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


  const top =
    Math.max(
      10,
      rect.top -
        toolbar.offsetHeight -
        10
    );


  toolbar.style.left =
    `${left}px`;


  toolbar.style.top =
    `${top}px`;

}


/* =========================================================
   SAVE
========================================================= */

async function saveSite() {

  if (!siteData) {
    return;
  }


  setSaveStatus(
    "saving",
    "保存中…"
  );


  try {

    const token =
      localStorage.getItem(
        "adminSessionToken"
      ) ||
      localStorage.getItem(
        "admin_token"
      );


    if (!token) {

      throw new Error(
        "Adminセッションがありません"
      );

    }


    const response =
      await fetch(
        "https://maru-website-api.maru-0727.workers.dev/admin/save",
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

              siteData
            })

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.message ||
        "保存に失敗しました"
      );

    }


    hasChanges =
      false;


    setSaveStatus(
      "saved",
      "保存しました"
    );


  } catch (error) {

    console.error(
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
   EVENTS
========================================================= */

document
  .getElementById(
    "undoButton"
  )
  .addEventListener(
    "click",
    undo
  );


document
  .getElementById(
    "redoButton"
  )
  .addEventListener(
    "click",
    redo
  );


document
  .getElementById(
    "saveButton"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "saveModal"
        )
        .classList.remove(
          "hidden"
        );

    }
  );


document
  .getElementById(
    "cancelSaveButton"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "saveModal"
        )
        .classList.add(
          "hidden"
        );

    }
  );


document
  .getElementById(
    "confirmSaveButton"
  )
  .addEventListener(
    "click",
    async () => {

      document
        .getElementById(
          "saveModal"
        )
        .classList.add(
          "hidden"
        );

      await saveSite();

    }
  );


document
  .getElementById(
    "closePropertyButton"
  )
  .addEventListener(
    "click",
    () => {

      if (
        selectedElement
      ) {

        selectedElement.classList.remove(
          "editor-selected"
        );

      }


      selectedElement =
        null;


      propertyEmpty.classList.remove(
        "hidden"
      );

      propertyContent.classList.add(
        "hidden"
      );


      document
        .getElementById(
          "floatingToolbar"
        )
        .classList.add(
          "hidden"
        );

    }
  );


document
  .getElementById(
    "backButton"
  )
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "../admin/panel.html";

    }
  );


/* font weight */

document
  .querySelectorAll(
    "[data-font-weight]"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          if (
            !selectedElement
          ) {
            return;
          }


          pushHistory();


          selectedElement.style.fontWeight =
            button.dataset.fontWeight;


          updateFontWeightButtons(
            button.dataset.fontWeight
          );


          markChanged();

        }
      );

    }
  );


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.ctrlKey &&
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

    }


    if (
      event.ctrlKey &&
      event.key.toLowerCase() ===
        "y"
    ) {

      event.preventDefault();

      redo();

    }


    if (
      event.key ===
      "Escape"
    ) {

      document
        .getElementById(
          "closePropertyButton"
        )
        .click();

    }

  }
);


/* =========================================================
   START
========================================================= */

loadSiteData();
