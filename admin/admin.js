const WORKER_URL =
  "https://maru-website-admin.maru-0727.workers.dev";

const DATA_URL =
  "../site-data.json";


let siteData = null;
let savedSnapshot = null;
let currentPage = "overview";


const pageTitles = {
  overview: "概要",
  site: "サイト",
  pages: "ページ",
  sections: "セクション",
  projects: "プロジェクト",
  updates: "更新情報",
  links: "リンク",
  embeds: "埋め込み",
  navigation: "ナビゲーション",
  settings: "サイト設定"
};


const pageDescriptions = {
  overview:
    "サイト全体の状態を確認します。",

  site:
    "サイト名や説明、アイコンなどを変更します。",

  pages:
    "サイトのページ構成を管理します。",

  sections:
    "ホームページの構成と順番を管理します。",

  projects:
    "プロジェクトを追加・編集します。",

  updates:
    "アップデート情報を追加・編集します。",

  links:
    "サイトで使用するリンクを管理します。",

  embeds:
    "URLを指定して外部コンテンツを埋め込めます。",

  navigation:
    "サイト上部のナビゲーションを管理します。",

  settings:
    "サイト全体の表示設定を変更します。"
};


/* =========================
   DOM
========================= */

const pageContent =
  document.getElementById("pageContent");

const pageTitle =
  document.getElementById("pageTitle");

const saveState =
  document.getElementById("saveState");

const saveButton =
  document.getElementById("saveButton");

const previewContent =
  document.getElementById("previewContent");


/* =========================
   認証
========================= */

function getToken() {
  return sessionStorage.getItem(
    "maru_admin_token"
  );
}


function getExpiresAt() {
  return Number(
    sessionStorage.getItem(
      "maru_admin_expires"
    ) || 0
  );
}


function isAuthenticated() {
  const token = getToken();
  const expires = getExpiresAt();

  return Boolean(
    token &&
    expires &&
    Date.now() < expires
  );
}


function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "./";
    return false;
  }

  return true;
}


/* =========================
   共通
========================= */

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}


function makeId(prefix) {
  return (
    prefix +
    "-" +
    Date.now().toString(36) +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function markDirty() {
  saveState.textContent =
    "未保存";

  saveState.className =
    "save-state dirty";
}


function markSaved() {
  saveState.textContent =
    "保存済み";

  saveState.className =
    "save-state saved";
}


function showToast(message) {

  const toast =
    document.createElement("div");

  toast.className =
    "toast";

  toast.textContent =
    message;

  document.body.appendChild(
    toast
  );

  setTimeout(() => {
    toast.remove();
  }, 2500);
}


function getArray(name) {

  if (
    !Array.isArray(
      siteData[name]
    )
  ) {
    siteData[name] = [];
  }

  return siteData[name];
}


function bindInput(
  id,
  callback
) {

  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  element.addEventListener(
    "input",
    (event) => {

      callback(
        event.target.value
      );

      markDirty();
      renderPreview();

    }
  );

}


/* =========================
   データ読み込み
========================= */

async function loadData() {

  try {

    const response =
      await fetch(
        `${DATA_URL}?cb=${Date.now()}`,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }


    siteData =
      await response.json();


    normalizeData();


    savedSnapshot =
      clone(siteData);


    markSaved();

    renderPage(
      currentPage
    );

    renderPreview();


  } catch (error) {

    console.error(error);

    pageContent.innerHTML = `

      <div class="card">

        <strong>
          データを読み込めませんでした
        </strong>

        <p style="
          color:#777e87;
          font-size:11px;
        ">
          ${escapeHtml(
            error.message
          )}
        </p>

      </div>

    `;

  }

}


/* =========================
   データ補正
========================= */

function normalizeData() {

  if (!siteData.site) {
    siteData.site = {};
  }


  if (
    !siteData.site.name
  ) {
    siteData.site.name =
      "maru_m4ru_maru";
  }


  if (
    !siteData.site.avatar
  ) {
    siteData.site.avatar =
      "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";
  }


  const arrays = [
    "navigation",
    "stats",
    "projects",
    "updates",
    "embeds",
    "links",
    "sections"
  ];


  arrays.forEach(
    (name) => {

      if (
        !Array.isArray(
          siteData[name]
        )
      ) {
        siteData[name] = [];
      }

    }
  );


  if (!siteData.settings) {
    siteData.settings = {};
  }


  if (
    typeof siteData.settings
      .showFooter !==
    "boolean"
  ) {

    siteData.settings.showFooter =
      true;

  }

}


/* =========================
   ページ移動
========================= */

document
  .querySelectorAll(
    ".nav-item"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          currentPage =
            button.dataset.page;


          document
            .querySelectorAll(
              ".nav-item"
            )
            .forEach(
              (item) => {

                item.classList.toggle(
                  "active",
                  item === button
                );

              }
            );


          renderPage(
            currentPage
          );

        }
      );

    }
  );


function renderPage(page) {

  pageTitle.textContent =
    pageTitles[page] ||
    page;


  pageContent.innerHTML =
    "";


  switch (page) {

    case "overview":
      renderOverview();
      break;

    case "site":
      renderSite();
      break;

    case "pages":
      renderPages();
      break;

    case "sections":
      renderSections();
      break;

    case "projects":
      renderProjects();
      break;

    case "updates":
      renderUpdates();
      break;

    case "links":
      renderLinks();
      break;

    case "embeds":
      renderEmbeds();
      break;

    case "navigation":
      renderNavigation();
      break;

    case "settings":
      renderSettings();
      break;

    default:
      renderOverview();

  }

}


/* =========================
   概要
========================= */

function renderOverview() {

  const projects =
    getArray("projects")
      .filter(
        (item) =>
          item.enabled !== false
      ).length;


  const sections =
    getArray("sections")
      .filter(
        (item) =>
          item.enabled !== false
      ).length;


  const updates =
    getArray("updates").length;


  const embeds =
    getArray("embeds").length;


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        こんにちは。
      </h2>

      <p>
        ここからサイトの内容をまとめて管理できます。
      </p>

    </div>


    <div class="dashboard-grid">

      <div class="dashboard-card">

        <span>
          PROJECTS
        </span>

        <strong>
          ${projects}
        </strong>

        <p>
          公開中のプロジェクト
        </p>

      </div>


      <div class="dashboard-card">

        <span>
          SECTIONS
        </span>

        <strong>
          ${sections}
        </strong>

        <p>
          有効なセクション
        </p>

      </div>


      <div class="dashboard-card">

        <span>
          UPDATES
        </span>

        <strong>
          ${updates}
        </strong>

        <p>
          登録されている更新情報
        </p>

      </div>


      <div class="dashboard-card">

        <span>
          EMBEDS
        </span>

        <strong>
          ${embeds}
        </strong>

        <p>
          埋め込みコンテンツ
        </p>

      </div>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>
          現在のサイト
        </strong>

        <span>
          LIVE
        </span>

      </div>


      <div>

        <strong>
          ${escapeHtml(
            siteData.site.name
          )}
        </strong>

        <div style="
          margin-top:4px;
          color:#777e87;
          font-size:10px;
        ">
          ${escapeHtml(
            siteData.site.tagline
          )}
        </div>

      </div>

    </div>

  `;

}


/* =========================
   サイト
========================= */

function renderSite() {

  const site =
    siteData.site;


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        サイト情報
      </h2>

      <p>
        サイト全体で使用する基本情報を編集します。
      </p>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            サイト名
          </label>

          <input
            id="siteName"
            value="${escapeHtml(
              site.name || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            キャッチコピー
          </label>

          <input
            id="siteTagline"
            value="${escapeHtml(
              site.tagline || ""
            )}"
          >

        </div>


        <div class="field full">

          <label>
            説明
          </label>

          <textarea
            id="siteDescription"
          >${escapeHtml(
            site.description || ""
          )}</textarea>

        </div>


        <div class="field">

          <label>
            アイコンURL
          </label>

          <input
            id="siteAvatar"
            value="${escapeHtml(
              site.avatar || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            GitHub URL
          </label>

          <input
            id="siteGithub"
            value="${escapeHtml(
              site.github || ""
            )}"
          >

        </div>

      </div>

    </div>

  `;


  bindInput(
    "siteName",
    (value) => {
      siteData.site.name =
        value;
    }
  );


  bindInput(
    "siteTagline",
    (value) => {
      siteData.site.tagline =
        value;
    }
  );


  bindInput(
    "siteDescription",
    (value) => {
      siteData.site.description =
        value;
    }
  );


  bindInput(
    "siteAvatar",
    (value) => {
      siteData.site.avatar =
        value;
    }
  );


  bindInput(
    "siteGithub",
    (value) => {
      siteData.site.github =
        value;
    }
  );

}


/* =========================
   ページ
========================= */

function renderPages() {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        ページ
      </h2>

      <p>
        サイトのページ構成を管理します。
      </p>

    </div>


    <div class="card">

      <div class="editor-item">

        <div class="drag-handle">
          ☰
        </div>

        <div class="item-main">

          <strong>
            Home
          </strong>

          <span>
            /
          </span>

        </div>

        <div class="item-actions">

          <button disabled>
            基本ページ
          </button>

        </div>

      </div>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>
          今後の拡張
        </strong>

        <span>
          CMS
        </span>

      </div>

      <p style="
        margin:0;
        color:#777e87;
        font-size:10px;
        line-height:1.7;
      ">
        今後、独立したページも
        この管理画面から作成できるようにできます。
      </p>

    </div>

  `;

}


/* =========================
   セクション
========================= */

function renderSections() {

  const sections =
    getArray("sections");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        ホーム構成
      </h2>

      <p>
        ホームページに表示するセクションを管理します。
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>
          表示順
        </strong>

        <button
          id="addSectionButton"
          class="button small"
        >
          ＋ セクション追加
        </button>

      </div>


      <div
        id="sectionsList"
        class="editor-list"
      ></div>

    </div>

  `;


  const list =
    document.getElementById(
      "sectionsList"
    );


  sections.forEach(
    (section, index) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "section-row";


      row.innerHTML = `

        <div class="section-order">
          ${index + 1}
        </div>


        <div>

          <strong>
            ${escapeHtml(
              section.title ||
              section.type
            )}
          </strong>

          <small>
            ${escapeHtml(
              section.type
            )}
          </small>

        </div>


        <button
          class="toggle ${
            section.enabled !== false
              ? "on"
              : ""
          }"
        ></button>


        <div class="item-actions">

          <button
            class="move-up"
          >
            ↑
          </button>

          <button
            class="move-down"
          >
            ↓
          </button>

          <button
            class="edit-section"
          >
            編集
          </button>

          <button
            class="delete-section"
          >
            削除
          </button>

        </div>

      `;


      row
        .querySelector(
          ".toggle"
        )
        .addEventListener(
          "click",
          () => {

            section.enabled =
              section.enabled === false;

            markDirty();

            renderSections();

            renderPreview();

          }
        );


      row
        .querySelector(
          ".move-up"
        )
        .addEventListener(
          "click",
          () => {

            if (
              index <= 0
            ) {
              return;
            }


            [
              sections[index - 1],
              sections[index]
            ] = [
              sections[index],
              sections[index - 1]
            ];


            markDirty();

            renderSections();

            renderPreview();

          }
        );


      row
        .querySelector(
          ".move-down"
        )
        .addEventListener(
          "click",
          () => {

            if (
              index >=
              sections.length - 1
            ) {
              return;
            }


            [
              sections[index + 1],
              sections[index]
            ] = [
              sections[index],
              sections[index + 1]
            ];


            markDirty();

            renderSections();

            renderPreview();

          }
        );


      row
        .querySelector(
          ".edit-section"
        )
        .addEventListener(
          "click",
          () => {
            openSectionEditor(
              section
            );
          }
        );


      row
        .querySelector(
          ".delete-section"
        )
        .addEventListener(
          "click",
          () => {

            if (
              !confirm(
                "このセクションを削除しますか？"
              )
            ) {
              return;
            }


            sections.splice(
              index,
              1
            );


            markDirty();

            renderSections();

            renderPreview();

          }
        );


      list.appendChild(row);

    }
  );


  document
    .getElementById(
      "addSectionButton"
    )
    .addEventListener(
      "click",
      () => {

        const section = {
          id: makeId("section"),
          type: "text",
          title: "新しいセクション",
          description: "",
          enabled: true
        };


        sections.push(
          section
        );


        markDirty();

        renderSections();

        renderPreview();

      }
    );

}


function openSectionEditor(
  section
) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        セクションを編集
      </h2>

      <p>
        セクションの内容を変更します。
      </p>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            種類
          </label>

          <select
            id="sectionType"
          >

            <option value="hero">
              Hero
            </option>

            <option value="stats">
              Stats
            </option>

            <option value="projects">
              Projects
            </option>

            <option value="updates">
              Updates
            </option>

            <option value="embeds">
              Embeds
            </option>

            <option value="links">
              Links
            </option>

            <option value="github">
              GitHub
            </option>

            <option value="text">
              Text
            </option>

          </select>

        </div>


        <div class="field">

          <label>
            タイトル
          </label>

          <input
            id="sectionTitle"
            value="${escapeHtml(
              section.title || ""
            )}"
          >

        </div>


        <div class="field full">

          <label>
            説明
          </label>

          <textarea
            id="sectionDescription"
          >${escapeHtml(
            section.description || ""
          )}</textarea>

        </div>

      </div>


      <div style="
        margin-top:16px;
        display:flex;
        gap:8px;
      ">

        <button
          id="saveSectionLocal"
          class="button primary"
        >
          変更を適用
        </button>

        <button
          id="cancelSectionEdit"
          class="button"
        >
          戻る
        </button>

      </div>

    </div>

  `;


  document.getElementById(
    "sectionType"
  ).value =
    section.type ||
    "text";


  document
    .getElementById(
      "saveSectionLocal"
    )
    .addEventListener(
      "click",
      () => {

        section.type =
          document.getElementById(
            "sectionType"
          ).value;


        section.title =
          document.getElementById(
            "sectionTitle"
          ).value;


        section.description =
          document.getElementById(
            "sectionDescription"
          ).value;


        markDirty();

        renderSections();

        renderPreview();

      }
    );


  document
    .getElementById(
      "cancelSectionEdit"
    )
    .addEventListener(
      "click",
      () => {
        renderSections();
      }
    );

}


/* =========================
   プロジェクト
========================= */

function renderProjects() {

  const projects =
    getArray("projects");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        プロジェクト
      </h2>

      <p>
        プロジェクトカードを追加・編集できます。
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>
          プロジェクト一覧
        </strong>

        <button
          id="addProjectButton"
          class="button primary small"
        >
          ＋ プロジェクト追加
        </button>

      </div>


      <div
        id="projectList"
        class="editor-list"
      ></div>

    </div>

  `;


  const list =
    document.getElementById(
      "projectList"
    );


  if (!projects.length) {

    list.innerHTML =
      `<div class="empty">
        プロジェクトはまだありません。
      </div>`;

  }


  projects.forEach(
    (project, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "editor-item";


      item.innerHTML = `

        <div class="drag-handle">
          ◆
        </div>


        <div class="item-main">

          <strong>
            ${escapeHtml(
              project.title
            )}
          </strong>

          <span>
            ${escapeHtml(
              project.status ||
              "ステータス未設定"
            )}
          </span>

        </div>


        <div class="item-actions">

          <button
            class="toggleProject"
          >
            ${
              project.enabled !== false
                ? "公開中"
                : "非公開"
            }
          </button>


          <button
            class="editProject"
          >
            編集
          </button>


          <button
            class="deleteProject"
          >
            削除
          </button>

        </div>

      `;


      item
        .querySelector(
          ".toggleProject"
        )
        .addEventListener(
          "click",
          () => {

            project.enabled =
              project.enabled === false;

            markDirty();

            renderProjects();

            renderPreview();

          }
        );


      item
        .querySelector(
          ".editProject"
        )
        .addEventListener(
          "click",
          () => {

            openProjectEditor(
              project
            );

          }
        );


      item
        .querySelector(
          ".deleteProject"
        )
        .addEventListener(
          "click",
          () => {

            if (
              !confirm(
                `「${project.title}」を削除しますか？`
              )
            ) {
              return;
            }


            projects.splice(
              index,
              1
            );


            markDirty();

            renderProjects();

            renderPreview();

          }
        );


      list.appendChild(item);

    }
  );


  document
    .getElementById(
      "addProjectButton"
    )
    .addEventListener(
      "click",
      () => {

        const project = {
          id: makeId("project"),
          title: "新しいプロジェクト",
          description: "",
          status: "DRAFT",
          tags: [],
          url: "",
          github: "",
          icon: "PR",
          featured: false,
          enabled: true
        };


        projects.push(
          project
        );


        markDirty();

        openProjectEditor(
          project
        );

      }
    );

}


function openProjectEditor(
  project
) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        プロジェクトを編集
      </h2>

      <p>
        このプロジェクトに表示する内容を設定します。
      </p>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            名前
          </label>

          <input
            id="projectTitle"
            value="${escapeHtml(
              project.title || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            ステータス
          </label>

          <input
            id="projectStatus"
            value="${escapeHtml(
              project.status || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            アイコン
          </label>

          <input
            id="projectIcon"
            maxlength="5"
            value="${escapeHtml(
              project.icon || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            プロジェクトURL
          </label>

          <input
            id="projectUrl"
            value="${escapeHtml(
              project.url || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            GitHub URL
          </label>

          <input
            id="projectGithub"
            value="${escapeHtml(
              project.github || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            タグ
          </label>

          <input
            id="projectTags"
            value="${escapeHtml(
              (
                project.tags ||
                []
              ).join(", ")
            )}"
          >

        </div>


        <div class="field full">

          <label>
            説明
          </label>

          <textarea
            id="projectDescription"
          >${escapeHtml(
            project.description || ""
          )}</textarea>

        </div>

      </div>


      <label class="checkbox-row">

        <input
          id="projectFeatured"
          type="checkbox"
          ${
            project.featured
              ? "checked"
              : ""
          }
        >

        メインプロジェクトとして表示

      </label>


      <label class="checkbox-row">

        <input
          id="projectEnabled"
          type="checkbox"
          ${
            project.enabled !== false
              ? "checked"
              : ""
          }
        >

        サイトに公開

      </label>


      <div style="
        margin-top:17px;
        display:flex;
        gap:8px;
      ">

        <button
          id="applyProject"
          class="button primary"
        >
          変更を適用
        </button>

        <button
          id="cancelProject"
          class="button"
        >
          戻る
        </button>

      </div>

    </div>

  `;


  document
    .getElementById(
      "applyProject"
    )
    .addEventListener(
      "click",
      () => {

        project.title =
          document.getElementById(
            "projectTitle"
          ).value;


        project.status =
          document.getElementById(
            "projectStatus"
          ).value;


        project.icon =
          document.getElementById(
            "projectIcon"
          ).value;


        project.url =
          document.getElementById(
            "projectUrl"
          ).value;


        project.github =
          document.getElementById(
            "projectGithub"
          ).value;


        project.tags =
          document
            .getElementById(
              "projectTags"
            )
            .value
            .split(",")
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean);


        project.description =
          document.getElementById(
            "projectDescription"
          ).value;


        project.featured =
          document.getElementById(
            "projectFeatured"
          ).checked;


        project.enabled =
          document.getElementById(
            "projectEnabled"
          ).checked;


        markDirty();

        renderProjects();

        renderPreview();

      }
    );


  document
    .getElementById(
      "cancelProject"
    )
    .addEventListener(
      "click",
      () => {
        renderProjects();
      }
    );

}


/* =========================
   更新情報
========================= */

function renderUpdates() {

  const updates =
    getArray("updates");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        更新情報
      </h2>

      <p>
        アップデート情報や変更履歴を管理します。
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>
          更新一覧
        </strong>

        <button
          id="addUpdateButton"
          class="button primary small"
        >
          ＋ 更新追加
        </button>

      </div>


      <div
        id="updateList"
        class="editor-list"
      ></div>

    </div>

  `;


  const list =
    document.getElementById(
      "updateList"
    );


  if (!updates.length) {

    list.innerHTML =
      `<div class="empty">
        更新情報はまだありません。
      </div>`;

  }


  updates.forEach(
    (update, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "editor-item";


      item.innerHTML = `

        <div class="drag-handle">
          ↗
        </div>


        <div class="item-main">

          <strong>
            ${escapeHtml(
              update.title
            )}
          </strong>

          <span>
            ${escapeHtml(
              update.date || ""
            )}
            ·
            ${escapeHtml(
              update.version || ""
            )}
          </span>

        </div>


        <div class="item-actions">

          <button
            class="editUpdate"
          >
            編集
          </button>

          <button
            class="deleteUpdate"
          >
            削除
          </button>

        </div>

      `;


      item
        .querySelector(
          ".editUpdate"
        )
        .addEventListener(
          "click",
          () => {
            openUpdateEditor(
              update
            );
          }
        );


      item
        .querySelector(
          ".deleteUpdate"
        )
        .addEventListener(
          "click",
          () => {

            if (
              !confirm(
                "この更新情報を削除しますか？"
              )
            ) {
              return;
            }


            updates.splice(
              index,
              1
            );


            markDirty();

            renderUpdates();

            renderPreview();

          }
        );


      list.appendChild(item);

    }
  );


  document
    .getElementById(
      "addUpdateButton"
    )
    .addEventListener(
      "click",
      () => {

        const update = {
          id: makeId("update"),
          project: "",
          title: "新しい更新情報",
          description: "",
          version: "",
          date: new Date()
            .toISOString()
            .slice(0, 10)
            .replaceAll("-", "."),
          enabled: true
        };


        updates.unshift(
          update
        );


        markDirty();

        openUpdateEditor(
          update
        );

      }
    );

}


function openUpdateEditor(
  update
) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        更新情報を編集
      </h2>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            対象プロジェクト
          </label>

          <input
            id="updateProject"
            value="${escapeHtml(
              update.project || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            日付
          </label>

          <input
            id="updateDate"
            value="${escapeHtml(
              update.date || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            バージョン
          </label>

          <input
            id="updateVersion"
            value="${escapeHtml(
              update.version || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            タイトル
          </label>

          <input
            id="updateTitle"
            value="${escapeHtml(
              update.title || ""
            )}"
          >

        </div>


        <div class="field full">

          <label>
            説明
          </label>

          <textarea
            id="updateDescription"
          >${escapeHtml(
            update.description || ""
          )}</textarea>

        </div>

      </div>


      <div style="
        margin-top:17px;
        display:flex;
        gap:8px;
      ">

        <button
          id="applyUpdate"
          class="button primary"
        >
          変更を適用
        </button>

        <button
          id="cancelUpdate"
          class="button"
        >
          戻る
        </button>

      </div>

    </div>

  `;


  document
    .getElementById(
      "applyUpdate"
    )
    .addEventListener(
      "click",
      () => {

        update.project =
          document.getElementById(
            "updateProject"
          ).value;


        update.date =
          document.getElementById(
            "updateDate"
          ).value;


        update.version =
          document.getElementById(
            "updateVersion"
          ).value;


        update.title =
          document.getElementById(
            "updateTitle"
          ).value;


        update.description =
          document.getElementById(
            "updateDescription"
          ).value;


        markDirty();

        renderUpdates();

        renderPreview();

      }
    );


  document
    .getElementById(
      "cancelUpdate"
    )
    .addEventListener(
      "click",
      () => {
        renderUpdates();
      }
    );

}


/* =========================
   リンク
========================= */

function renderLinks() {

  const links =
    getArray("links");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        リンク
      </h2>

      <p>
        ボタンやカードなどで使用するリンクを管理します。
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>
          リンク一覧
        </strong>

        <button
          id="addLinkButton"
          class="button primary small"
        >
          ＋ リンク追加
        </button>

      </div>


      <div
        id="linkList"
        class="editor-list"
      ></div>

    </div>

  `;


  const list =
    document.getElementById(
      "linkList"
    );


  if (!links.length) {

    list.innerHTML =
      `<div class="empty">
        リンクはまだありません。
      </div>`;

  }


  links.forEach(
    (link, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "editor-item";


      item.innerHTML = `

        <div class="drag-handle">
          ↗
        </div>


        <div class="item-main">

          <strong>
            ${escapeHtml(
              link.label
            )}
          </strong>

          <span>
            ${escapeHtml(
              link.url
            )}
          </span>

        </div>


        <div class="item-actions">

          <button
            class="editLink"
          >
            編集
          </button>

          <button
            class="deleteLink"
          >
            削除
          </button>

        </div>

      `;


      item
        .querySelector(
          ".editLink"
        )
        .addEventListener(
          "click",
          () => {
            openLinkEditor(
              link
            );
          }
        );


      item
        .querySelector(
          ".deleteLink"
        )
        .addEventListener(
          "click",
          () => {

            links.splice(
              index,
              1
            );

            markDirty();

            renderLinks();

            renderPreview();

          }
        );


      list.appendChild(item);

    }
  );


  document
    .getElementById(
      "addLinkButton"
    )
    .addEventListener(
      "click",
      () => {

        const link = {
          id: makeId("link"),
          label: "新しいリンク",
          url: "",
          newTab: true,
          enabled: true
        };


        links.push(
          link
        );


        markDirty();

        openLinkEditor(
          link
        );

      }
    );

}


function openLinkEditor(
  link
) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        リンクを編集
      </h2>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            表示名
          </label>

          <input
            id="linkLabel"
            value="${escapeHtml(
              link.label || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            URL
          </label>

          <input
            id="linkUrl"
            value="${escapeHtml(
              link.url || ""
            )}"
          >

        </div>

      </div>


      <label class="checkbox-row">

        <input
          id="linkNewTab"
          type="checkbox"
          ${
            link.newTab !== false
              ? "checked"
              : ""
          }
        >

        新しいタブで開く

      </label>


      <div style="
        margin-top:17px;
        display:flex;
        gap:8px;
      ">

        <button
          id="applyLink"
          class="button primary"
        >
          変更を適用
        </button>

        <button
          id="cancelLink"
          class="button"
        >
          戻る
        </button>

      </div>

    </div>

  `;


  document
    .getElementById(
      "applyLink"
    )
    .addEventListener(
      "click",
      () => {

        link.label =
          document.getElementById(
            "linkLabel"
          ).value;


        link.url =
          document.getElementById(
            "linkUrl"
          ).value;


        link.newTab =
          document.getElementById(
            "linkNewTab"
          ).checked;


        markDirty();

        renderLinks();

        renderPreview();

      }
    );


  document
    .getElementById(
      "cancelLink"
    )
    .addEventListener(
      "click",
      () => {
        renderLinks();
      }
    );

}


/* =========================
   埋め込み
========================= */

function renderEmbeds() {

  const embeds =
    getArray("embeds");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        埋め込み
      </h2>

      <p>
        URLを貼り付けるだけで外部コンテンツを追加できます。
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>
          埋め込み一覧
        </strong>

        <button
          id="addEmbedButton"
          class="button primary small"
        >
          ＋ 埋め込み追加
        </button>

      </div>


      <div
        id="embedList"
        class="editor-list"
      ></div>

    </div>

  `;


  const list =
    document.getElementById(
      "embedList"
    );


  if (!embeds.length) {

    list.innerHTML =
      `<div class="empty">
        埋め込みはまだありません。<br>
        「＋ 埋め込み追加」からURLを追加できます。
      </div>`;

  }


  embeds.forEach(
    (embed, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "editor-item";


      item.innerHTML = `

        <div class="drag-handle">
          ▤
        </div>


        <div class="item-main">

          <strong>
            ${escapeHtml(
              embed.title
            )}
          </strong>

          <span>
            ${escapeHtml(
              embed.url
            )}
          </span>

        </div>


        <div class="item-actions">

          <button
            class="editEmbed"
          >
            編集
          </button>

          <button
            class="deleteEmbed"
          >
            削除
          </button>

        </div>

      `;


      item
        .querySelector(
          ".editEmbed"
        )
        .addEventListener(
          "click",
          () => {
            openEmbedEditor(
              embed
            );
          }
        );


      item
        .querySelector(
          ".deleteEmbed"
        )
        .addEventListener(
          "click",
          () => {

            embeds.splice(
              index,
              1
            );

            markDirty();

            renderEmbeds();

            renderPreview();

          }
        );


      list.appendChild(item);

    }
  );


  document
    .getElementById(
      "addEmbedButton"
    )
    .addEventListener(
      "click",
      () => {

        const embed = {
          id: makeId("embed"),
          title: "新しい埋め込み",
          url: "",
          width: "100%",
          height: "420",
          enabled: true
        };


        embeds.push(
          embed
        );


        markDirty();

        openEmbedEditor(
          embed
        );

      }
    );

}


function openEmbedEditor(
  embed
) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        埋め込みを編集
      </h2>

      <p>
        外部ページのURLを指定します。
      </p>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            タイトル
          </label>

          <input
            id="embedTitle"
            value="${escapeHtml(
              embed.title || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            URL
          </label>

          <input
            id="embedUrl"
            value="${escapeHtml(
              embed.url || ""
            )}"
            placeholder="https://example.com"
          >

        </div>


        <div class="field">

          <label>
            横幅
          </label>

          <input
            id="embedWidth"
            value="${escapeHtml(
              embed.width ||
              "100%"
            )}"
          >

        </div>


        <div class="field">

          <label>
            高さ
          </label>

          <input
            id="embedHeight"
            value="${escapeHtml(
              embed.height ||
              "420"
            )}"
          >

        </div>

      </div>


      <label class="checkbox-row">

        <input
          id="embedEnabled"
          type="checkbox"
          ${
            embed.enabled !== false
              ? "checked"
              : ""
          }
        >

        サイトに表示する

      </label>


      <div style="
        margin-top:17px;
        display:flex;
        gap:8px;
      ">

        <button
          id="applyEmbed"
          class="button primary"
        >
          変更を適用
        </button>

        <button
          id="cancelEmbed"
          class="button"
        >
          戻る
        </button>

      </div>

    </div>

  `;


  document
    .getElementById(
      "applyEmbed"
    )
    .addEventListener(
      "click",
      () => {

        embed.title =
          document.getElementById(
            "embedTitle"
          ).value;


        embed.url =
          document.getElementById(
            "embedUrl"
          ).value;


        embed.width =
          document.getElementById(
            "embedWidth"
          ).value;


        embed.height =
          document.getElementById(
            "embedHeight"
          ).value;


        embed.enabled =
          document.getElementById(
            "embedEnabled"
          ).checked;


        markDirty();

        renderEmbeds();

        renderPreview();

      }
    );


  document
    .getElementById(
      "cancelEmbed"
    )
    .addEventListener(
      "click",
      () => {
        renderEmbeds();
      }
    );

}


/* =========================
   ナビゲーション
========================= */

function renderNavigation() {

  const navigation =
    getArray(
      "navigation"
    );


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        ナビゲーション
      </h2>

      <p>
        ホームページ上部のメニューを管理します。
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>
          メニュー一覧
        </strong>

        <button
          id="addNavButton"
          class="button primary small"
        >
          ＋ リンク追加
        </button>

      </div>


      <div
        id="navigationList"
        class="editor-list"
      ></div>

    </div>

  `;


  const list =
    document.getElementById(
      "navigationList"
    );


  navigation.forEach(
    (nav, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "editor-item";


      item.innerHTML = `

        <div class="drag-handle">
          ☰
        </div>


        <div class="item-main">

          <strong>
            ${escapeHtml(
              nav.label
            )}
          </strong>

          <span>
            ${escapeHtml(
              nav.href
            )}
          </span>

        </div>


        <div class="item-actions">

          <button
            class="toggleNav"
          >
            ${
              nav.enabled !== false
                ? "表示中"
                : "非表示"
            }
          </button>


          <button
            class="editNav"
          >
            編集
          </button>


          <button
            class="deleteNav"
          >
            削除
          </button>

        </div>

      `;


      item
        .querySelector(
          ".toggleNav"
        )
        .addEventListener(
          "click",
          () => {

            nav.enabled =
              nav.enabled === false;

            markDirty();

            renderNavigation();

            renderPreview();

          }
        );


      item
        .querySelector(
          ".editNav"
        )
        .addEventListener(
          "click",
          () => {
            openNavigationEditor(
              nav
            );
          }
        );


      item
        .querySelector(
          ".deleteNav"
        )
        .addEventListener(
          "click",
          () => {

            navigation.splice(
              index,
              1
            );

            markDirty();

            renderNavigation();

            renderPreview();

          }
        );


      list.appendChild(
        item
      );

    }
  );


  document
    .getElementById(
      "addNavButton"
    )
    .addEventListener(
      "click",
      () => {

        const nav = {
          id: makeId("nav"),
          label: "新しいリンク",
          href: "#",
          enabled: true,
          newTab: false
        };


        navigation.push(
          nav
        );


        markDirty();

        openNavigationEditor(
          nav
        );

      }
    );

}


function openNavigationEditor(
  nav
) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        ナビゲーションを編集
      </h2>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            表示名
          </label>

          <input
            id="navLabel"
            value="${escapeHtml(
              nav.label || ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            URL
          </label>

          <input
            id="navHref"
            value="${escapeHtml(
              nav.href || ""
            )}"
          >

        </div>

      </div>


      <label class="checkbox-row">

        <input
          id="navNewTab"
          type="checkbox"
          ${
            nav.newTab
              ? "checked"
              : ""
          }
        >

        新しいタブで開く

      </label>


      <div style="
        margin-top:17px;
        display:flex;
        gap:8px;
      ">

        <button
          id="applyNav"
          class="button primary"
        >
          変更を適用
        </button>

        <button
          id="cancelNav"
          class="button"
        >
          戻る
        </button>

      </div>

    </div>

  `;


  document
    .getElementById(
      "applyNav"
    )
    .addEventListener(
      "click",
      () => {

        nav.label =
          document.getElementById(
            "navLabel"
          ).value;


        nav.href =
          document.getElementById(
            "navHref"
          ).value;


        nav.newTab =
          document.getElementById(
            "navNewTab"
          ).checked;


        markDirty();

        renderNavigation();

        renderPreview();

      }
    );


  document
    .getElementById(
      "cancelNav"
    )
    .addEventListener(
      "click",
      () => {
        renderNavigation();
      }
    );

}


/* =========================
   設定
========================= */

function renderSettings() {

  const settings =
    siteData.settings;


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>
        サイト設定
      </h2>

      <p>
        サイト全体の表示に関する設定です。
      </p>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>
            フッター文字
          </label>

          <input
            id="footerText"
            value="${escapeHtml(
              settings.footerText ||
              ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            アクセント
          </label>

          <select
            id="accentSelect"
          >

            <option value="default">
              Default
            </option>

          </select>

        </div>

      </div>


      <label class="checkbox-row">

        <input
          id="showFooter"
          type="checkbox"
          ${
            settings.showFooter !== false
              ? "checked"
              : ""
          }
        >

        フッターを表示

      </label>


      <label class="checkbox-row">

        <input
          id="showGitHubCTA"
          type="checkbox"
          ${
            settings.showGitHubCTA !== false
              ? "checked"
              : ""
          }
        >

        GitHub案内を表示

      </label>

    </div>

  `;


  bindInput(
    "footerText",
    (value) => {

      settings.footerText =
        value;

    }
  );


  document
    .getElementById(
      "showFooter"
    )
    .addEventListener(
      "change",
      (event) => {

        settings.showFooter =
          event.target.checked;

        markDirty();

        renderPreview();

      }
    );


  document
    .getElementById(
      "showGitHubCTA"
    )
    .addEventListener(
      "change",
      (event) => {

        settings.showGitHubCTA =
          event.target.checked;

        markDirty();

        renderPreview();

      }
    );

}


/* =========================
   プレビュー
========================= */

function renderPreview() {

  if (!siteData) {
    return;
  }


  const sections =
    getArray("sections")
      .filter(
        (section) =>
          section.enabled !== false
      );


  let html = "";


  sections.forEach(
    (section) => {

      switch (
        section.type
      ) {

        case "hero":

          html +=
            renderPreviewHero(
              section
            );

          break;


        case "stats":

          html +=
            renderPreviewStats();

          break;


        case "projects":

          html +=
            renderPreviewProjects();

          break;


        case "updates":

          html +=
            renderPreviewUpdates();

          break;


        case "embeds":

          html +=
            renderPreviewEmbeds();

          break;


        case "links":

          html +=
            renderPreviewLinks();

          break;


        case "github":

          html +=
            renderPreviewGithub();

          break;


        case "text":

          html +=
            renderPreviewText(
              section
            );

          break;

      }

    }
  );


  previewContent.innerHTML =
    html;

}


function renderPreviewHero(
  section
) {

  return `

    <div class="preview-hero">

      <div class="preview-kicker">
        INDIE DEVELOPER
      </div>


      <h1>
        ${escapeHtml(
          section.title ||
          siteData.site.tagline
        )}
      </h1>


      <p>
        ${escapeHtml(
          section.description ||
          siteData.site.description
        )}
      </p>

    </div>

  `;

}


function renderPreviewStats() {

  const stats =
    getArray("stats")
      .filter(
        (item) =>
          item.enabled !== false
      );


  if (!stats.length) {
    return "";
  }


  return `

    <div class="preview-block">

      <h3>
        Quick Stats
      </h3>


      <div class="preview-stat-grid">

        ${stats
          .map(
            (stat) => `

              <div class="preview-stat">

                <span>
                  ${escapeHtml(
                    stat.label
                  )}
                </span>


                <strong>
                  ${escapeHtml(
                    stat.value
                  )}
                </strong>

              </div>

            `
          )
          .join("")}

      </div>

    </div>

  `;

}


function renderPreviewProjects() {

  const projects =
    getArray("projects")
      .filter(
        (project) =>
          project.enabled !== false
      );


  if (!projects.length) {
    return "";
  }


  return `

    <div class="preview-block">

      <h3>
        Projects
      </h3>


      ${projects
        .map(
          (project) => `

            <div class="preview-project">

              <strong>
                ${escapeHtml(
                  project.title
                )}
              </strong>


              <p>
                ${escapeHtml(
                  project.description
                )}
              </p>

            </div>

          `
        )
        .join("")}

    </div>

  `;

}


function renderPreviewUpdates() {

  const updates =
    getArray("updates")
      .filter(
        (update) =>
          update.enabled !== false
      );


  if (!updates.length) {
    return "";
  }


  return `

    <div class="preview-block">

      <h3>
        What's New
      </h3>


      ${updates
        .slice(0, 3)
        .map(
          (update) => `

            <div class="preview-update">

              <strong>
                ${escapeHtml(
                  update.title
                )}
              </strong>

            </div>

          `
        )
        .join("")}

    </div>

  `;

}


function renderPreviewEmbeds() {

  const embeds =
    getArray("embeds")
      .filter(
        (embed) =>
          embed.enabled !== false &&
          embed.url
      );


  if (!embeds.length) {
    return "";
  }


  return embeds
    .map(
      (embed) => `

        <div class="preview-block">

          <h3>
            ${escapeHtml(
              embed.title
            )}
          </h3>


          <div class="preview-embed">

            <iframe
              src="${escapeHtml(
                embed.url
              )}"
              loading="lazy"
              title="${escapeHtml(
                embed.title
              )}"
            ></iframe>

          </div>

        </div>

      `
    )
    .join("");

}


function renderPreviewLinks() {

  const links =
    getArray("links")
      .filter(
        (link) =>
          link.enabled !== false
      );


  if (!links.length) {
    return "";
  }


  return `

    <div class="preview-block">

      <h3>
        Links
      </h3>


      ${links
        .map(
          (link) => `

            <div class="preview-project">

              <strong>
                ${escapeHtml(
                  link.label
                )}
              </strong>


              <p>
                ${escapeHtml(
                  link.url
                )}
              </p>

            </div>

          `
        )
        .join("")}

    </div>

  `;

}


function renderPreviewGithub() {

  return `

    <div class="preview-block">

      <h3>
        Open Source
      </h3>


      <div class="preview-project">

        <strong>
          ${escapeHtml(
            siteData.site.github ||
            "GitHub"
          )}
        </strong>


        <p>
          公開プロジェクトとソースコード。
        </p>

      </div>

    </div>

  `;

}


function renderPreviewText(
  section
) {

  return `

    <div class="preview-block">

      <h3>
        ${escapeHtml(
          section.title ||
          "Text Section"
        )}
      </h3>


      <p style="
        margin:0;
        color:#777e87;
        font-size:8px;
        line-height:1.7;
      ">
        ${escapeHtml(
          section.description ||
          ""
        )}
      </p>

    </div>

  `;

}


/* =========================
   保存
========================= */

saveButton.addEventListener(
  "click",
  saveData
);


async function saveData() {

  if (!requireAuth()) {
    return;
  }


  const token =
    getToken();


  saveState.textContent =
    "保存中...";


  saveState.className =
    "save-state saving";


  saveButton.disabled =
    true;


  try {

    const response =
      await fetch(
        `${WORKER_URL}/admin/save`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${token}`
          },

          body: JSON.stringify({
            file: "site-data.json",

            content:
              JSON.stringify(
                siteData,
                null,
                2
              )
          })
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.message ||
        result.error ||
        `HTTP ${response.status}`
      );

    }


    savedSnapshot =
      clone(siteData);


    markSaved();


    showToast(
      "保存しました。"
    );


  } catch (error) {

    console.error(error);


    saveState.textContent =
      "保存失敗";


    saveState.className =
      "save-state dirty";


    showToast(
      `保存に失敗しました: ${error.message}`
    );


  } finally {

    saveButton.disabled =
      false;

  }

}


/* =========================
   ショートカット
========================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      (event.ctrlKey ||
       event.metaKey) &&
      event.key.toLowerCase() ===
        "s"
    ) {

      event.preventDefault();

      saveData();

    }

  }
);


/* =========================
   ログアウト
========================= */

document
  .getElementById(
    "logoutButton"
  )
  .addEventListener(
    "click",
    () => {

      sessionStorage.removeItem(
        "maru_admin_token"
      );


      sessionStorage.removeItem(
        "maru_admin_expires"
      );


      window.location.href =
        "./";

    }
  );


/* =========================
   操作説明
========================= */

const helpModal =
  document.getElementById(
    "helpModal"
  );


document
  .getElementById(
    "helpButton"
  )
  .addEventListener(
    "click",
    () => {

      helpModal.classList.remove(
        "hidden"
      );

    }
  );


document
  .getElementById(
    "closeHelpButton"
  )
  .addEventListener(
    "click",
    () => {

      helpModal.classList.add(
        "hidden"
      );

    }
  );


helpModal
  .querySelector(
    ".modal-backdrop"
  )
  .addEventListener(
    "click",
    () => {

      helpModal.classList.add(
        "hidden"
      );

    }
  );


/* =========================
   プレビュー更新
========================= */

document
  .getElementById(
    "refreshPreviewButton"
  )
  .addEventListener(
    "click",
    () => {

      renderPreview();

      showToast(
        "プレビューを更新しました。"
      );

    }
  );


/* =========================
   未保存警告
========================= */

window.addEventListener(
  "beforeunload",
  (event) => {

    if (
      saveState.classList.contains(
        "dirty"
      )
    ) {

      event.preventDefault();

      event.returnValue = "";

    }

  }
);


/* =========================
   起動
========================= */

if (requireAuth()) {
  loadData();
}
const openEditorButton =
  document.getElementById("openEditorButton");

if (openEditorButton) {
  openEditorButton.addEventListener("click", () => {
    window.location.href = "../editor/index.html";
  });
}
