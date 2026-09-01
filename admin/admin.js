const WORKER_URL =
  "https://maru-website-admin.maru-0727.workers.dev";

const DATA_URL =
  "../site-data.json";


let siteData = null;
let savedSnapshot = null;
let currentPage = "overview";


const pageTitles = {
  overview: "Overview",
  site: "Site",
  pages: "Pages",
  sections: "Sections",
  projects: "Projects",
  updates: "Updates",
  links: "Links",
  embeds: "Embeds",
  navigation: "Navigation",
  settings: "Site Settings"
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
   AUTH
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
   UTILITIES
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
  saveState.textContent = "Unsaved";
  saveState.className =
    "save-state dirty";
}


function markSaved() {
  saveState.textContent = "Saved";
  saveState.className =
    "save-state saved";
}


function showToast(message) {

  const toast =
    document.createElement("div");

  toast.className = "toast";
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2600);
}


function getArray(name) {
  if (!Array.isArray(siteData[name])) {
    siteData[name] = [];
  }

  return siteData[name];
}


/* =========================
   LOAD
========================= */

async function loadData() {

  try {

    const response = await fetch(
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

    siteData = await response.json();

    normalizeData();

    savedSnapshot = clone(siteData);

    markSaved();

    renderPage(currentPage);

    renderPreview();

  } catch (error) {

    console.error(error);

    pageContent.innerHTML = `
      <div class="card">
        <strong>Failed to load site-data.json</strong>
        <p>
          ${escapeHtml(error.message)}
        </p>
      </div>
    `;

  }

}


/* =========================
   DATA NORMALIZATION
========================= */

function normalizeData() {

  if (!siteData.site) {
    siteData.site = {};
  }

  if (!siteData.site.name) {
    siteData.site.name =
      "maru_m4ru_maru";
  }

  if (!siteData.site.avatar) {
    siteData.site.avatar =
      "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";
  }

  if (!siteData.navigation) {
    siteData.navigation = [];
  }

  if (!siteData.stats) {
    siteData.stats = [];
  }

  if (!siteData.projects) {
    siteData.projects = [];
  }

  if (!siteData.updates) {
    siteData.updates = [];
  }

  if (!siteData.embeds) {
    siteData.embeds = [];
  }

  if (!siteData.links) {
    siteData.links = [];
  }

  if (!siteData.sections) {
    siteData.sections = [];
  }

  if (!siteData.settings) {
    siteData.settings = {};
  }

  if (
    typeof siteData.settings.showFooter !==
    "boolean"
  ) {
    siteData.settings.showFooter = true;
  }

}


/* =========================
   PAGE NAVIGATION
========================= */

document
  .querySelectorAll(".nav-item")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        currentPage =
          button.dataset.page;

        document
          .querySelectorAll(".nav-item")
          .forEach((item) => {
            item.classList.toggle(
              "active",
              item === button
            );
          });

        renderPage(currentPage);

      }
    );

  });


function renderPage(page) {

  pageTitle.textContent =
    pageTitles[page] ||
    page;

  pageContent.innerHTML = "";

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
   OVERVIEW
========================= */

function renderOverview() {

  const enabledProjects =
    getArray("projects")
      .filter(
        (item) => item.enabled !== false
      ).length;

  const enabledSections =
    getArray("sections")
      .filter(
        (item) => item.enabled !== false
      ).length;

  const updates =
    getArray("updates").length;

  const embeds =
    getArray("embeds").length;

  pageContent.innerHTML = `

    <div class="page-heading">
      <h2>Welcome back.</h2>
      <p>
        Manage your website content from one place.
        Changes are kept locally until you press
        Save Changes.
      </p>
    </div>


    <div class="dashboard-grid">

      <div class="dashboard-card">
        <span>Projects</span>
        <strong>${enabledProjects}</strong>
        <p>Visible projects</p>
      </div>

      <div class="dashboard-card">
        <span>Sections</span>
        <strong>${enabledSections}</strong>
        <p>Active homepage sections</p>
      </div>

      <div class="dashboard-card">
        <span>Updates</span>
        <strong>${updates}</strong>
        <p>Published updates</p>
      </div>

      <div class="dashboard-card">
        <span>Embeds</span>
        <strong>${embeds}</strong>
        <p>Embedded pages</p>
      </div>

    </div>


    <div class="card">

      <div class="card-header">
        <strong>Current Site</strong>
        <span>LIVE DATA</span>
      </div>

      <div class="form-grid">

        <div>
          <strong>
            ${escapeHtml(
              siteData.site.name
            )}
          </strong>

          <div style="
            margin-top:4px;
            color:#7d838c;
            font-size:11px;
          ">
            ${escapeHtml(
              siteData.site.tagline
            )}
          </div>
        </div>

        <div style="
          text-align:right;
          color:#7d838c;
          font-size:11px;
        ">
          ${escapeHtml(
            siteData.site.github || ""
          )}
        </div>

      </div>

    </div>

  `;

}


/* =========================
   SITE
========================= */

function renderSite() {

  const site =
    siteData.site || {};

  pageContent.innerHTML = `

    <div class="page-heading">
      <h2>Site Identity</h2>
      <p>
        Basic information displayed across the website.
      </p>
    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>Site Name</label>

          <input
            id="siteName"
            value="${escapeHtml(
              site.name || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Tagline</label>

          <input
            id="siteTagline"
            value="${escapeHtml(
              site.tagline || ""
            )}"
          >

        </div>


        <div class="field full">

          <label>Description</label>

          <textarea
            id="siteDescription"
          >${escapeHtml(
            site.description || ""
          )}</textarea>

        </div>


        <div class="field">

          <label>Avatar URL</label>

          <input
            id="siteAvatar"
            value="${escapeHtml(
              site.avatar || ""
            )}"
          >

        </div>


        <div class="field">

          <label>GitHub URL</label>

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
      siteData.site.name = value;
    }
  );

  bindInput(
    "siteTagline",
    (value) => {
      siteData.site.tagline = value;
    }
  );

  bindInput(
    "siteDescription",
    (value) => {
      siteData.site.description = value;
    }
  );

  bindInput(
    "siteAvatar",
    (value) => {
      siteData.site.avatar = value;
    }
  );

  bindInput(
    "siteGithub",
    (value) => {
      siteData.site.github = value;
    }
  );

}


/* =========================
   PAGES
========================= */

function renderPages() {

  pageContent.innerHTML = `

    <div class="page-heading">
      <h2>Pages</h2>
      <p>
        Homepage and future pages can be managed here.
      </p>
    </div>


    <div class="card">

      <div class="editor-item">

        <div class="drag-handle">
          ☰
        </div>

        <div class="item-main">

          <strong>Home</strong>

          <span>
            /
          </span>

        </div>

        <div class="item-actions">

          <button
            disabled
          >
            Primary
          </button>

        </div>

      </div>

    </div>


    <div class="card">

      <div class="card-header">
        <strong>Coming Next</strong>
        <span>CMS</span>
      </div>

      <p style="
        margin:0;
        color:#757c85;
        font-size:11px;
        line-height:1.7;
      ">
        Additional custom pages can be connected
        to the same CMS structure later.
      </p>

    </div>

  `;

}


/* =========================
   SECTIONS
========================= */

function renderSections() {

  const sections =
    getArray("sections");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Homepage Sections</h2>

      <p>
        Enable, disable and reorder homepage sections.
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>Section Order</strong>

        <button
          id="addSectionButton"
          class="button small"
        >
          + Add Section
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
          title="Toggle section"
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
            Edit
          </button>

          <button
            class="delete-section"
          >
            Delete
          </button>

        </div>

      `;


      row
        .querySelector(".toggle")
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
        .querySelector(".move-up")
        .addEventListener(
          "click",
          () => {

            if (index <= 0) {
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
        .querySelector(".move-down")
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
        .querySelector(".edit-section")
        .addEventListener(
          "click",
          () => {

            openSectionEditor(
              section
            );

          }
        );


      row
        .querySelector(".delete-section")
        .addEventListener(
          "click",
          () => {

            if (
              !confirm(
                `Delete section "${section.title}"?`
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
          title: "New Section",
          description: "",
          enabled: true
        };

        sections.push(section);

        markDirty();

        renderSections();

        renderPreview();

      }
    );

}


function openSectionEditor(section) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Edit Section</h2>

      <p>
        Configure this homepage section.
      </p>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>Type</label>

          <select id="sectionType">

            <option value="hero">Hero</option>
            <option value="stats">Stats</option>
            <option value="projects">Projects</option>
            <option value="updates">Updates</option>
            <option value="embeds">Embeds</option>
            <option value="links">Links</option>
            <option value="github">GitHub</option>
            <option value="text">Text</option>

          </select>

        </div>


        <div class="field">

          <label>Title</label>

          <input
            id="sectionTitle"
            value="${escapeHtml(
              section.title || ""
            )}"
          >

        </div>


        <div class="field full">

          <label>Description</label>

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
          Apply
        </button>

        <button
          id="cancelSectionEdit"
          class="button"
        >
          Cancel
        </button>

      </div>

    </div>

  `;


  document.getElementById(
    "sectionType"
  ).value =
    section.type || "text";


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
   PROJECTS
========================= */

function renderProjects() {

  const projects =
    getArray("projects");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Projects</h2>

      <p>
        Create and manage project cards displayed
        on the homepage.
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>Project Collection</strong>

        <button
          id="addProjectButton"
          class="button primary small"
        >
          + Add Project
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
        No projects yet.
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
              project.status || "No status"
            )}
          </span>

        </div>

        <div class="item-actions">

          <button
            class="toggleProject"
          >
            ${
              project.enabled !== false
                ? "Enabled"
                : "Disabled"
            }
          </button>

          <button
            class="editProject"
          >
            Edit
          </button>

          <button
            class="deleteProject"
          >
            Delete
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
                `Delete "${project.title}"?`
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
          title: "New Project",
          description: "",
          status: "In Development",
          tags: [],
          url: "",
          github: "",
          icon: "PR",
          featured: false,
          enabled: true
        };

        projects.push(project);

        markDirty();

        openProjectEditor(
          project
        );

      }
    );

}


function openProjectEditor(project) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Edit Project</h2>

      <p>
        Everything here is stored in site-data.json.
      </p>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>Title</label>

          <input
            id="projectTitle"
            value="${escapeHtml(
              project.title || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Status</label>

          <input
            id="projectStatus"
            value="${escapeHtml(
              project.status || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Icon</label>

          <input
            id="projectIcon"
            maxlength="5"
            value="${escapeHtml(
              project.icon || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Project URL</label>

          <input
            id="projectUrl"
            value="${escapeHtml(
              project.url || ""
            )}"
          >

        </div>


        <div class="field">

          <label>GitHub URL</label>

          <input
            id="projectGithub"
            value="${escapeHtml(
              project.github || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Tags</label>

          <input
            id="projectTags"
            value="${escapeHtml(
              (project.tags || []).join(", ")
            )}"
          >

        </div>


        <div class="field full">

          <label>Description</label>

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

        Featured project

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

        Visible on website

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
          Apply
        </button>

        <button
          id="cancelProject"
          class="button"
        >
          Cancel
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
   UPDATES
========================= */

function renderUpdates() {

  const updates =
    getArray("updates");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Updates</h2>

      <p>
        Publish changelog entries without editing code.
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>Update Feed</strong>

        <button
          id="addUpdateButton"
          class="button primary small"
        >
          + Add Update
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
        No updates yet.
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
            Edit
          </button>

          <button
            class="deleteUpdate"
          >
            Delete
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
                "Delete this update?"
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
          title: "New Update",
          description: "",
          version: "",
          date: new Date()
            .toISOString()
            .slice(0, 10)
            .replaceAll("-", "."),
          enabled: true
        };

        updates.unshift(update);

        markDirty();

        openUpdateEditor(
          update
        );

      }
    );

}


function openUpdateEditor(update) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Edit Update</h2>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>Project</label>

          <input
            id="updateProject"
            value="${escapeHtml(
              update.project || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Date</label>

          <input
            id="updateDate"
            value="${escapeHtml(
              update.date || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Version</label>

          <input
            id="updateVersion"
            value="${escapeHtml(
              update.version || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Title</label>

          <input
            id="updateTitle"
            value="${escapeHtml(
              update.title || ""
            )}"
          >

        </div>


        <div class="field full">

          <label>Description</label>

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
          Apply
        </button>

        <button
          id="cancelUpdate"
          class="button"
        >
          Cancel
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
   LINKS
========================= */

function renderLinks() {

  const links =
    getArray("links");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Links</h2>

      <p>
        Manage reusable links for buttons,
        cards and future sections.
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>Link Library</strong>

        <button
          id="addLinkButton"
          class="button primary small"
        >
          + Add Link
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
        No links yet.
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
            Edit
          </button>

          <button
            class="deleteLink"
          >
            Delete
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
            openLinkEditor(link);
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
          label: "New Link",
          url: "",
          newTab: true,
          enabled: true
        };

        links.push(link);

        markDirty();

        openLinkEditor(link);

      }
    );

}


function openLinkEditor(link) {

  pageContent.innerHTML = `

    <div class="page-heading">
      <h2>Edit Link</h2>
    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>Label</label>

          <input
            id="linkLabel"
            value="${escapeHtml(
              link.label || ""
            )}"
          >

        </div>


        <div class="field">

          <label>URL</label>

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

        Open in new tab

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
          Apply
        </button>

        <button
          id="cancelLink"
          class="button"
        >
          Cancel
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
   EMBEDS
========================= */

function renderEmbeds() {

  const embeds =
    getArray("embeds");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Embeds</h2>

      <p>
        Add external websites or tools through iframe embeds.
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>Embed Library</strong>

        <button
          id="addEmbedButton"
          class="button primary small"
        >
          + Add Embed
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
        No embeds yet.
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
            Edit
          </button>

          <button
            class="deleteEmbed"
          >
            Delete
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
            openEmbedEditor(embed);
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
          title: "New Embed",
          url: "",
          width: "100%",
          height: "420",
          enabled: true
        };

        embeds.push(embed);

        markDirty();

        openEmbedEditor(embed);

      }
    );

}


function openEmbedEditor(embed) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Edit Embed</h2>

      <p>
        Paste a URL and it can be rendered as an iframe
        by the website renderer.
      </p>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>Title</label>

          <input
            id="embedTitle"
            value="${escapeHtml(
              embed.title || ""
            )}"
          >

        </div>


        <div class="field">

          <label>URL</label>

          <input
            id="embedUrl"
            value="${escapeHtml(
              embed.url || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Width</label>

          <input
            id="embedWidth"
            value="${escapeHtml(
              embed.width || "100%"
            )}"
          >

        </div>


        <div class="field">

          <label>Height</label>

          <input
            id="embedHeight"
            value="${escapeHtml(
              embed.height || "420"
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

        Enabled

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
          Apply
        </button>

        <button
          id="cancelEmbed"
          class="button"
        >
          Cancel
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
   NAVIGATION
========================= */

function renderNavigation() {

  const navigation =
    getArray("navigation");


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Navigation</h2>

      <p>
        Edit the links displayed in the website header.
      </p>

    </div>


    <div class="card">

      <div class="card-header">

        <strong>Header Links</strong>

        <button
          id="addNavButton"
          class="button primary small"
        >
          + Add Link
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
                ? "Enabled"
                : "Disabled"
            }
          </button>

          <button
            class="editNav"
          >
            Edit
          </button>

          <button
            class="deleteNav"
          >
            Delete
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
            openNavigationEditor(nav);
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


      list.appendChild(item);

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
          label: "New Link",
          href: "#",
          enabled: true,
          newTab: false
        };

        navigation.push(nav);

        markDirty();

        openNavigationEditor(nav);

      }
    );

}


function openNavigationEditor(nav) {

  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Edit Navigation Link</h2>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>Label</label>

          <input
            id="navLabel"
            value="${escapeHtml(
              nav.label || ""
            )}"
          >

        </div>


        <div class="field">

          <label>URL</label>

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

        Open in new tab

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
          Apply
        </button>

        <button
          id="cancelNav"
          class="button"
        >
          Cancel
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
   SETTINGS
========================= */

function renderSettings() {

  const settings =
    siteData.settings;


  pageContent.innerHTML = `

    <div class="page-heading">

      <h2>Site Settings</h2>

      <p>
        Global website behaviour.
      </p>

    </div>


    <div class="card">

      <div class="form-grid">

        <div class="field">

          <label>Footer Text</label>

          <input
            id="footerText"
            value="${escapeHtml(
              settings.footerText || ""
            )}"
          >

        </div>


        <div class="field">

          <label>Accent</label>

          <select id="accentSelect">

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

        Show Footer

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

        Show GitHub CTA

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
   INPUT BINDING
========================= */

function bindInput(id, callback) {

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
   PREVIEW
========================= */

function renderPreview() {

  if (!siteData) {
    return;
  }


  const site =
    siteData.site;

  const sections =
    getArray("sections")
      .filter(
        (section) =>
          section.enabled !== false
      );


  let html = "";


  sections.forEach(
    (section) => {

      switch (section.type) {

        case "hero":
          html += renderPreviewHero(
            section
          );
          break;

        case "stats":
          html += renderPreviewStats();
          break;

        case "projects":
          html += renderPreviewProjects();
          break;

        case "updates":
          html += renderPreviewUpdates();
          break;

        case "embeds":
          html += renderPreviewEmbeds();
          break;

        case "links":
          html += renderPreviewLinks();
          break;

        case "github":
          html += renderPreviewGithub();
          break;

        case "text":
          html += renderPreviewText(
            section
          );
          break;

      }

    }
  );


  previewContent.innerHTML = html;
}


function renderPreviewHero(section) {

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

      <h3>Quick Stats</h3>

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

      <h3>Projects</h3>

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

      <h3>What's New</h3>

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

      <h3>Links</h3>

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

      <h3>Open Source</h3>

      <div class="preview-project">

        <strong>
          ${escapeHtml(
            siteData.site.github ||
            "GitHub"
          )}
        </strong>

        <p>
          Source code and projects.
        </p>

      </div>

    </div>

  `;
}


function renderPreviewText(section) {

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
        font-size:9px;
        line-height:1.7;
      ">
        ${escapeHtml(
          section.description || ""
        )}
      </p>

    </div>

  `;
}


/* =========================
   SAVE
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
    "Saving...";

  saveState.className =
    "save-state saving";


  saveButton.disabled = true;


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
            content: JSON.stringify(
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
      "Changes saved successfully."
    );


  } catch (error) {

    console.error(error);

    saveState.textContent =
      "Save failed";

    saveState.className =
      "save-state dirty";


    showToast(
      `Save failed: ${error.message}`
    );


  } finally {

    saveButton.disabled = false;

  }

}


/* =========================
   RESET
========================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      (event.ctrlKey ||
       event.metaKey) &&
      event.key.toLowerCase() === "s"
    ) {

      event.preventDefault();

      saveData();

    }

  }
);


/* =========================
   LOGOUT
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

      window.location.href = "./";

    }
  );


/* =========================
   HELP
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
   PREVIEW REFRESH
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
        "Preview refreshed."
      );

    }
  );


/* =========================
   UNSAVED WARNING
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
   INIT
========================= */

if (requireAuth()) {
  loadData();
}
