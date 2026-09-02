const SITE_DATA_URL = "./site-data.json";

const DEFAULT_AVATAR =
  "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";

/* =========================
   HELPERS
========================= */

function setText(selector, value) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((element) => {
    element.textContent =
      value === undefined || value === null
        ? ""
        : String(value);
  });
}

function setAttribute(selector, attribute, value) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((element) => {
    if (value === undefined || value === null || value === "") {
      element.removeAttribute(attribute);
      return;
    }

    element.setAttribute(attribute, String(value));
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeVersion(version) {
  if (!version) {
    return "";
  }

  const value = String(version).trim();

  if (!value) {
    return "";
  }

  return value.startsWith("v")
    ? value
    : `v${value}`;
}

/* =========================
   SITE DATA
========================= */

let currentSiteData = null;

async function loadSiteData() {
  try {
    const cacheBuster =
      `cb=${Date.now()}`;

    const response = await fetch(
      `${SITE_DATA_URL}?${cacheBuster}`,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `site-data.json returned ${response.status}`
      );
    }

    const data = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "site-data.json is not a valid object"
      );
    }

    currentSiteData = data;

    applySiteData(data);

    console.log(
      "[maru-website] site data loaded",
      data
    );
  } catch (error) {
    console.warn(
      "[maru-website] Failed to load site-data.json",
      error
    );

    /*
      JSONが取得できなくても、
      index.html に書かれている固定内容を
      そのまま表示できるようにする。
    */
  }
}

/* =========================
   APPLY SITE DATA
========================= */

function applySiteData(data) {
  const site =
    data.site &&
    typeof data.site === "object"
      ? data.site
      : {};

  const siteName =
    site.name ||
    "maru_m4ru_maru";

  const tagline =
    site.tagline ||
    "ScratchやWebを、もっと便利に。";

  const description =
    site.description ||
    "maru_m4ru_maru が制作しているツール・サービス・プロジェクトを紹介しています。";

  const avatar =
    site.avatar ||
    DEFAULT_AVATAR;

  const github =
    site.github ||
    "https://github.com/maru-m4ru-maru";

  /* -------------------------
     SITE BASIC
  ------------------------- */

  setText(
    "[data-site-name]",
    siteName
  );

  setText(
    "[data-description]",
    description
  );

  setAttribute(
    "[data-avatar]",
    "src",
    avatar
  );

  setAttribute(
    "[data-avatar]",
    "alt",
    siteName
  );

  document.title =
    `${siteName} - Official Website`;

  const metaDescription =
    document.querySelector(
      'meta[name="description"]'
    );

  if (metaDescription) {
    metaDescription.setAttribute(
      "content",
      description
    );
  }

  /* -------------------------
     TAGLINE
     data-tagline がある場合に反映
  ------------------------- */

  setText(
    "[data-tagline]",
    tagline
  );

  /* -------------------------
     GITHUB LINKS
  ------------------------- */

  const githubLinks =
    document.querySelectorAll(
      'a[href*="github.com/maru-m4ru-maru"]'
    );

  githubLinks.forEach((link) => {
    link.href = github;

    if (
      link.target === "_blank"
    ) {
      link.rel =
        "noopener noreferrer";
    }
  });

  /* -------------------------
     NAVIGATION
  ------------------------- */

  applyNavigation(
    data.navigation
  );

  /* -------------------------
     STATS
  ------------------------- */

  applyStats(
    data.stats
  );

  /* -------------------------
     PROJECTS
  ------------------------- */

  applyProjects(
    data.projects
  );

  /* -------------------------
     FEATURED PROJECT
  ------------------------- */

  applyFeaturedProject(
    data.projects
  );

  /* -------------------------
     UPDATES
  ------------------------- */

  applyUpdates(
    data.updates
  );

  /* -------------------------
     SECTIONS
  ------------------------- */

  applySections(
    data.sections
  );

  /* -------------------------
     SETTINGS
  ------------------------- */

  applySettings(
    data.settings
  );
}

/* =========================
   NAVIGATION
========================= */

function applyNavigation(navigation) {
  if (!Array.isArray(navigation)) {
    return;
  }

  const nav = document.querySelector(".nav");

  if (!nav) {
    return;
  }

  const enabledItems =
    navigation.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.enabled !== false
    );

  /*
    管理画面で設定したナビゲーションを反映。
  */

  if (enabledItems.length === 0) {
    nav.innerHTML = "";
    return;
  }

  nav.innerHTML =
    enabledItems
      .map((item) => {
        const label =
          escapeHtml(item.label || "");

        const href =
          escapeHtml(item.href || "#");

        const target =
          item.newTab
            ? ' target="_blank" rel="noopener noreferrer"'
            : "";

        return `
          <a
            href="${href}"
            ${target}
          >
            ${label}
          </a>
        `;
      })
      .join("");

  setupSmoothLinks();
}

/* =========================
   STATS
========================= */

function applyStats(stats) {
  if (!Array.isArray(stats)) {
    return;
  }

  const cards =
    document.querySelectorAll(
      ".stats-grid .stat-card"
    );

  if (!cards.length) {
    return;
  }

  stats
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.enabled !== false
    )
    .slice(0, cards.length)
    .forEach((item, index) => {
      const card =
        cards[index];

      const label =
        card.querySelector(
          ".stat-label"
        );

      const value =
        card.querySelector(
          ".stat-value"
        );

      const meta =
        card.querySelector(
          ".stat-meta"
        );

      if (label) {
        label.textContent =
          item.label || "";
      }

      if (value) {
        value.textContent =
          item.value || "";
      }

      if (meta) {
        meta.textContent =
          item.meta || "";
      }
    });

  /*
    もし管理画面で件数を減らした場合、
    余ったカードを非表示にする。
  */

  stats
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.enabled !== false
    )
    .slice(0, cards.length);

  cards.forEach(
    (card, index) => {
      const exists =
        stats
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              item.enabled !== false
          )
          .slice(0, cards.length)
          [index];

      card.style.display =
        exists
          ? ""
          : "none";
    }
  );
}

/* =========================
   PROJECTS
========================= */

function applyProjects(projects) {
  if (!Array.isArray(projects)) {
    return;
  }

  const grid =
    document.querySelector(
      ".projects-grid"
    );

  if (!grid) {
    return;
  }

  const items =
    projects.filter(
      (project) =>
        project &&
        typeof project === "object" &&
        project.enabled !== false &&
        project.featured !== true
    );

  /*
    featured=true のプロジェクトは
    FEATURED PROJECT 側で表示するため
    Other Projects から除外。
  */

  if (items.length === 0) {
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML =
    items
      .map((project) => {
        const title =
          escapeHtml(
            project.title ||
            "Untitled Project"
          );

        const description =
          escapeHtml(
            project.description || ""
          );

        const status =
          escapeHtml(
            project.status ||
            "Unknown"
          );

        const icon =
          escapeHtml(
            project.icon ||
            "PR"
          );

        const tags =
          Array.isArray(project.tags)
            ? project.tags
                .slice(0, 10)
                .map(
                  (tag) => `
                    <span>
                      ${escapeHtml(tag)}
                    </span>
                  `
                )
                .join("")
            : "";

        const url =
          project.url
            ? escapeHtml(project.url)
            : "";

        const github =
          project.github
            ? escapeHtml(project.github)
            : "";

        return `
          <article class="project-card">

            <div class="project-card-top">

              <div class="project-icon">
                ${icon}
              </div>

              <span class="project-status">
                ${status}
              </span>

            </div>

            <h3>
              ${title}
            </h3>

            <p>
              ${description}
            </p>

            <div class="project-tags">
              ${tags}
            </div>

            ${
              url || github
                ? `
                  <div
                    style="
                      display:flex;
                      gap:10px;
                      margin-top:18px;
                      flex-wrap:wrap;
                    "
                  >

                    ${
                      url
                        ? `
                          <a
                            href="${url}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-link"
                          >
                            Open ↗
                          </a>
                        `
                        : ""
                    }

                    ${
                      github
                        ? `
                          <a
                            href="${github}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-link"
                          >
                            GitHub ↗
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
      })
      .join("");
}

/* =========================
   FEATURED PROJECT
========================= */

function applyFeaturedProject(projects) {
  if (!Array.isArray(projects)) {
    return;
  }

  const featured =
    projects.find(
      (project) =>
        project &&
        typeof project === "object" &&
        project.featured === true &&
        project.enabled !== false
    );

  if (!featured) {
    return;
  }

  const heading =
    document.querySelector(
      ".featured-section .section-heading h2"
    );

  if (heading) {
    heading.textContent =
      featured.title ||
      "Featured Project";
  }

  const badge =
    document.querySelector(
      ".featured-section .project-badge"
    );

  if (badge) {
    badge.textContent =
      featured.status ||
      "Featured Project";
  }

  const title =
    document.querySelector(
      ".featured-section .featured-content h3"
    );

  if (title && featured.title) {
    title.textContent =
      featured.title;
  }

  const description =
    document.querySelector(
      ".featured-section .featured-content > p"
    );

  if (
    description &&
    featured.description
  ) {
    description.textContent =
      featured.description;
  }

  const openProject =
    document.querySelector(
      ".featured-section .button-primary"
    );

  if (
    openProject &&
    featured.url
  ) {
    openProject.href =
      featured.url;
  }

  const sourceCode =
    document.querySelector(
      ".featured-section .button-ghost"
    );

  if (
    sourceCode &&
    featured.github
  ) {
    sourceCode.href =
      featured.github;
  }
}

/* =========================
   UPDATES
========================= */

function applyUpdates(updates) {
  if (!Array.isArray(updates)) {
    return;
  }

  const latest =
    updates.find(
      (update) =>
        update &&
        typeof update === "object" &&
        update.enabled !== false
    );

  if (!latest) {
    return;
  }

  const updateLabel =
    document.querySelector(
      ".update-label"
    );

  const updateTitle =
    document.querySelector(
      ".update-main h3"
    );

  const updateDescription =
    document.querySelector(
      ".update-main p"
    );

  const updateDate =
    document.querySelector(
      "[data-update-date]"
    );

  const updateVersion =
    document.querySelector(
      ".update-version strong"
    );

  if (updateLabel) {
    updateLabel.textContent =
      latest.project ||
      "Update";
  }

  if (updateTitle) {
    updateTitle.textContent =
      latest.title ||
      "";
  }

  if (updateDescription) {
    updateDescription.textContent =
      latest.description ||
      "";
  }

  if (updateDate) {
    updateDate.textContent =
      latest.date ||
      "—";
  }

  if (updateVersion) {
    updateVersion.textContent =
      normalizeVersion(
        latest.version
      );
  }
}

/* =========================
   SECTIONS
========================= */

function applySections(sections) {
  if (!Array.isArray(sections)) {
    return;
  }

  sections.forEach((section) => {
    if (
      !section ||
      typeof section !== "object"
    ) {
      return;
    }

    /*
      type によって実ページ上の
      section を有効/無効化する。
    */

    const type =
      String(
        section.type || ""
      ).toLowerCase();

    let element = null;

    switch (type) {
      case "hero":
        element =
          document.querySelector(
            ".hero"
          );
        break;

      case "stats":
        element =
          document.querySelector(
            ".stats-section"
          );
        break;

      case "projects":
        element =
          document.querySelector(
            ".projects-section"
          );
        break;

      case "updates":
        element =
          document.querySelector(
            ".updates-section"
          );
        break;

      case "github":
        element =
          document.querySelector(
            ".github-section"
          );
        break;

      default:
        break;
    }

    if (!element) {
      return;
    }

    element.style.display =
      section.enabled === false
        ? "none"
        : "";
  });
}

/* =========================
   SETTINGS
========================= */

function applySettings(settings) {
  if (
    !settings ||
    typeof settings !== "object" ||
    Array.isArray(settings)
  ) {
    return;
  }

  const footer =
    document.querySelector(
      ".site-footer"
    );

  const githubSection =
    document.querySelector(
      ".github-section"
    );

  const footerText =
    document.querySelector(
      ".site-footer .footer-inner > div:first-child"
    );

  if (footer) {
    footer.style.display =
      settings.showFooter === false
        ? "none"
        : "";
  }

  if (githubSection) {
    githubSection.style.display =
      settings.showGitHubCTA === false
        ? "none"
        : "";
  }

  /*
    footerText が設定されていても
    既存のサイト名表示は壊さない。
  */

  if (
    footerText &&
    typeof settings.footerText === "string" &&
    settings.footerText.trim()
  ) {
    const footerName =
      footerText.querySelector(
        "[data-site-name]"
      );

    if (footerName) {
      /*
        サイト名は site.name を維持。
        footerText は今後専用要素を
        追加したときにも使えるようにしておく。
      */
    }
  }
}

/* =========================
   CURRENT YEAR
========================= */

function setCurrentYear() {
  setText(
    "[data-current-year]",
    new Date().getFullYear()
  );
}

/* =========================
   LINK BEHAVIOR
========================= */

function setupSmoothLinks() {
  const links =
    document.querySelectorAll(
      'a[href^="#"]'
    );

  links.forEach((link) => {
    /*
      同じリンクに何度もイベントを
      付けないためのフラグ。
    */

    if (
      link.dataset.smoothBound === "true"
    ) {
      return;
    }

    link.dataset.smoothBound = "true";

    link.addEventListener(
      "click",
      (event) => {
        const targetId =
          link.getAttribute("href");

        if (
          !targetId ||
          targetId === "#"
        ) {
          return;
        }

        const target =
          document.querySelector(
            targetId
          );

        if (!target) {
          return;
        }

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    );
  });
}

/* =========================
   REVEAL
========================= */

function setupReveal() {
  const elements =
    document.querySelectorAll(
      ".stat-card, .project-card, .featured-card, .update-card, .github-card"
    );

  if (
    !elements.length
  ) {
    return;
  }

  if (
    !("IntersectionObserver" in window)
  ) {
    elements.forEach(
      (element) => {
        element.style.opacity = "1";
        element.style.transform =
          "translateY(0)";
      }
    );

    return;
  }

  elements.forEach(
    (element) => {
      /*
        すでに初期化済みなら再設定しない。
      */

      if (
        element.dataset.revealReady ===
        "true"
      ) {
        return;
      }

      element.dataset.revealReady =
        "true";

      element.style.opacity = "0";
      element.style.transform =
        "translateY(10px)";
      element.style.transition =
        "opacity 0.45s ease, transform 0.45s ease";
    }
  );

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              !entry.isIntersecting
            ) {
              return;
            }

            entry.target.style.opacity =
              "1";

            entry.target.style.transform =
              "translateY(0)";

            observer.unobserve(
              entry.target
            );
          }
        );
      },
      {
        threshold: 0.08
      }
    );

  elements.forEach(
    (element) => {
      observer.observe(element);
    }
  );
}

/* =========================
   IMAGE FALLBACK
========================= */

function setupImageFallback() {
  const avatars =
    document.querySelectorAll(
      "[data-avatar]"
    );

  avatars.forEach(
    (avatar) => {
      if (
        avatar.dataset.fallbackBound ===
        "true"
      ) {
        return;
      }

      avatar.dataset.fallbackBound =
        "true";

      avatar.addEventListener(
        "error",
        () => {
          avatar.removeAttribute(
            "src"
          );

          avatar.style.background =
            "#e8ebef";
        },
        {
          once: true
        }
      );
    }
  );
}

/* =========================
   INIT
========================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    setCurrentYear();

    /*
      先にJSONを読み込み、
      その後でページ上の要素を
      アニメーション初期化する。
    */

    await loadSiteData();

    setupSmoothLinks();
    setupReveal();
    setupImageFallback();
  }
);
