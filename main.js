const SITE_DATA_URL = "./site-data.json";

const DEFAULT_AVATAR =
  "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";

let currentSiteData = null;


/* =========================
   UTILITIES
========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function safeUrl(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "#";
  }

  return value.trim();
}


function normalizeVersion(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  const version =
    String(value).trim();

  if (!version) {
    return "";
  }

  return version.startsWith("v")
    ? version
    : `v${version}`;
}


function formatDate(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value);
}


function enabled(value) {
  return value?.enabled !== false;
}


function setText(selector, value) {
  document
    .querySelectorAll(selector)
    .forEach((element) => {
      element.textContent =
        value ?? "";
    });
}


function setAttribute(
  selector,
  attribute,
  value
) {
  document
    .querySelectorAll(selector)
    .forEach((element) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        element.removeAttribute(attribute);
        return;
      }

      element.setAttribute(
        attribute,
        String(value)
      );
    });
}


/* =========================
   SITE DATA
========================= */

async function loadSiteData() {

  try {

    const response =
      await fetch(
        `${SITE_DATA_URL}?v=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `site-data.json HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "site-data.json is invalid"
      );
    }

    currentSiteData = data;

    renderSite(data);

    console.log(
      "[maru-website] CMS data loaded",
      data
    );

  } catch (error) {

    console.error(
      "[maru-website] CMS load failed",
      error
    );

    renderFallback();

  }

}


/* =========================
   MAIN RENDER
========================= */

function renderSite(data) {

  const site =
    data.site &&
    typeof data.site === "object"
      ? data.site
      : {};

  const settings =
    data.settings &&
    typeof data.settings === "object"
      ? data.settings
      : {};

  applyBasicSiteData(site);

  renderNavigation(
    data.navigation
  );

  renderSections(data);

  renderFooter(
    data.links,
    settings
  );

  applySettings(settings);

}


/* =========================
   BASIC SITE
========================= */

function applyBasicSiteData(site) {

  const name =
    site.name ||
    "maru_m4ru_maru";

  const description =
    site.description ||
    "";

  const avatar =
    site.avatar ||
    DEFAULT_AVATAR;

  const github =
    site.github ||
    "https://github.com/maru-m4ru-maru";

  document.title =
    `${name} - Official Website`;

  setText(
    "[data-site-name]",
    name
  );

  setAttribute(
    "[data-site-avatar]",
    "src",
    avatar
  );

  setAttribute(
    "[data-site-avatar]",
    "alt",
    name
  );

  const meta =
    document.querySelector(
      "#metaDescription"
    );

  if (meta) {

    meta.setAttribute(
      "content",
      description
    );

  }

  document
    .querySelectorAll(
      'a[data-site-github]'
    )
    .forEach((link) => {

      link.href =
        safeUrl(github);

    });

}


/* =========================
   NAVIGATION
========================= */

function renderNavigation(
  navigation
) {

  const nav =
    document.querySelector(
      "#siteNavigation"
    );

  if (!nav) {
    return;
  }

  if (!Array.isArray(navigation)) {

    nav.innerHTML = "";

    return;
  }

  const items =
    navigation.filter(
      enabled
    );

  nav.innerHTML =
    items
      .map((item) => {

        const label =
          escapeHtml(
            item.label ||
            "Link"
          );

        const href =
          escapeHtml(
            safeUrl(
              item.href
            )
          );

        const target =
          item.newTab
            ? ' target="_blank" rel="noopener noreferrer"'
            : "";

        return `
          <a
            class="nav-link"
            href="${href}"
            ${target}
          >
            ${label}
          </a>
        `;

      })
      .join("");

}


/* =========================
   SECTIONS
========================= */

function renderSections(data) {

  const container =
    document.querySelector(
      "#siteSections"
    );

  if (!container) {
    return;
  }

  const sections =
    Array.isArray(data.sections)
      ? data.sections
      : [];

  if (!sections.length) {

    renderFallbackMain();

    return;
  }

  container.innerHTML = "";

  sections
    .filter(enabled)
    .forEach((section) => {

      const type =
        String(
          section.type || ""
        ).toLowerCase();

      let html = "";

      switch (type) {

        case "hero":

          html =
            renderHero(
              section,
              data
            );

          break;


        case "stats":

          html =
            renderStats(
              section,
              data.stats
            );

          break;


        case "projects":

          html =
            renderProjects(
              section,
              data.projects
            );

          break;


        case "updates":

          html =
            renderUpdates(
              section,
              data.updates
            );

          break;


        case "github":

          html =
            renderGithub(
              section,
              data.site
            );

          break;


        case "embeds":

          html =
            renderEmbeds(
              data.embeds
            );

          break;


        case "links":

          html =
            renderLinks(
              data.links
            );

          break;


        default:

          html = "";

          break;

      }

      if (html) {

        container.insertAdjacentHTML(
          "beforeend",
          html
        );

      }

    });


  if (!container.innerHTML.trim()) {

    renderFallbackMain();

  }

}


/* =========================
   HERO
========================= */

function renderHero(
  section,
  data
) {

  const site =
    data.site || {};

  const title =
    section.title ||
    "こんにちは！";

  const description =
    section.description ||
    site.description ||
    "";

  const tagline =
    site.tagline ||
    "";

  const avatar =
    site.avatar ||
    DEFAULT_AVATAR;

  const github =
    safeUrl(
      site.github
    );

  return `
    <section
      class="hero-section section"
      id="hero"
    >

      <div class="container">

        <div class="hero-card">

          <div class="hero-content">

            <div class="hero-eyebrow">
              PERSONAL WEBSITE
            </div>

            <h1 class="hero-title">
              ${escapeHtml(title)}
            </h1>

            ${
              tagline
                ? `
                  <p class="hero-tagline">
                    ${escapeHtml(tagline)}
                  </p>
                `
                : ""
            }

            <p class="hero-description">
              ${escapeHtml(description)}
            </p>

            <div class="hero-actions">

              <a
                class="button button-primary"
                href="#projects"
              >
                Projects
              </a>

              <a
                class="button button-secondary"
                href="${escapeHtml(github)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>

            </div>

          </div>

          <div class="hero-visual">

            <div class="hero-avatar-ring">

              <img
                src="${escapeHtml(avatar)}"
                alt="${escapeHtml(
                  site.name ||
                  "maru_m4ru_maru"
                )}"
                class="hero-avatar"
              >

            </div>

          </div>

        </div>

      </div>

    </section>
  `;

}


/* =========================
   STATS
========================= */

function renderStats(
  section,
  stats
) {

  const items =
    Array.isArray(stats)
      ? stats.filter(enabled)
      : [];

  if (!items.length) {
    return "";
  }

  return `
    <section
      class="stats-section section"
      id="stats"
    >

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="section-kicker">
              OVERVIEW
            </span>

            <h2>
              ${escapeHtml(
                section.title ||
                "Quick Stats"
              )}
            </h2>

          </div>

        </div>

        <div class="stats-grid">

          ${items
            .map(
              (item) => `
                <article
                  class="stat-card"
                >

                  <span
                    class="stat-label"
                  >
                    ${escapeHtml(
                      item.label ||
                      ""
                    )}
                  </span>

                  <strong
                    class="stat-value"
                  >
                    ${escapeHtml(
                      item.value ||
                      ""
                    )}
                  </strong>

                  ${
                    item.meta
                      ? `
                        <span
                          class="stat-meta"
                        >
                          ${escapeHtml(
                            item.meta
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


/* =========================
   PROJECTS
========================= */

function renderProjects(
  section,
  projects
) {

  const items =
    Array.isArray(projects)
      ? projects.filter(enabled)
      : [];

  if (!items.length) {
    return "";
  }

  const featured =
    items.find(
      (project) =>
        project.featured === true
    );

  const normalProjects =
    items.filter(
      (project) =>
        project.featured !== true
    );

  let html = `
    <section
      class="projects-section section"
      id="projects"
    >

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="section-kicker">
              WORK
            </span>

            <h2>
              ${escapeHtml(
                section.title ||
                "Projects"
              )}
            </h2>

          </div>

        </div>
  `;


  if (featured) {

    html += renderFeaturedProject(
      featured
    );

  }


  if (normalProjects.length) {

    html += `
      <div
        class="project-grid"
      >

        ${normalProjects
          .map(
            renderProjectCard
          )
          .join("")}

      </div>
    `;

  }


  html += `

      </div>

    </section>
  `;

  return html;

}


/* =========================
   FEATURED PROJECT
========================= */

function renderFeaturedProject(
  project
) {

  const title =
    project.title ||
    "Featured Project";

  const description =
    project.description ||
    "";

  const status =
    project.status ||
    "";

  const tags =
    Array.isArray(project.tags)
      ? project.tags
      : [];

  const url =
    safeUrl(
      project.url
    );

  const github =
    safeUrl(
      project.github
    );

  const icon =
    project.icon ||
    "PR";

  return `
    <article
      class="featured-project"
    >

      <div class="featured-project-visual">

        <div
          class="project-icon project-icon-large"
        >
          ${escapeHtml(icon)}
        </div>

        <div class="featured-orb"></div>

      </div>

      <div class="featured-project-content">

        <div class="project-badge">
          ${escapeHtml(
            status ||
            "FEATURED"
          )}
        </div>

        <h3>
          ${escapeHtml(title)}
        </h3>

        <p>
          ${escapeHtml(description)}
        </p>

        ${
          tags.length
            ? `
              <div class="project-tags">

                ${tags
                  .map(
                    (tag) =>
                      `
                        <span>
                          ${escapeHtml(tag)}
                        </span>
                      `
                  )
                  .join("")}

              </div>
            `
            : ""
        }

        <div class="project-actions">

          ${
            url !== "#"
              ? `
                <a
                  class="button button-primary"
                  href="${escapeHtml(url)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Project ↗
                </a>
              `
              : ""
          }

          ${
            github !== "#"
              ? `
                <a
                  class="button button-secondary"
                  href="${escapeHtml(github)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source Code ↗
                </a>
              `
              : ""
          }

        </div>

      </div>

    </article>
  `;

}


/* =========================
   PROJECT CARD
========================= */

function renderProjectCard(
  project
) {

  const title =
    project.title ||
    "Untitled Project";

  const description =
    project.description ||
    "";

  const status =
    project.status ||
    "";

  const tags =
    Array.isArray(project.tags)
      ? project.tags
      : [];

  const icon =
    project.icon ||
    "PR";

  const url =
    safeUrl(
      project.url
    );

  const github =
    safeUrl(
      project.github
    );

  return `
    <article
      class="project-card"
    >

      <div class="project-card-top">

        <div class="project-icon">
          ${escapeHtml(icon)}
        </div>

        ${
          status
            ? `
              <span
                class="project-status"
              >
                ${escapeHtml(status)}
              </span>
            `
            : ""
        }

      </div>

      <h3>
        ${escapeHtml(title)}
      </h3>

      <p>
        ${escapeHtml(description)}
      </p>

      ${
        tags.length
          ? `
            <div class="project-tags">

              ${tags
                .map(
                  (tag) =>
                    `
                      <span>
                        ${escapeHtml(tag)}
                      </span>
                    `
                )
                .join("")}

            </div>
          `
          : ""
      }

      ${
        url !== "#" ||
        github !== "#"
          ? `
            <div class="project-links">

              ${
                url !== "#"
                  ? `
                    <a
                      href="${escapeHtml(url)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open ↗
                    </a>
                  `
                  : ""
              }

              ${
                github !== "#"
                  ? `
                    <a
                      href="${escapeHtml(github)}"
                      target="_blank"
                      rel="noopener noreferrer"
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

}


/* =========================
   UPDATES
========================= */

function renderUpdates(
  section,
  updates
) {

  const items =
    Array.isArray(updates)
      ? updates.filter(enabled)
      : [];

  if (!items.length) {
    return "";
  }

  return `
    <section
      class="updates-section section"
      id="updates"
    >

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="section-kicker">
              CHANGELOG
            </span>

            <h2>
              ${escapeHtml(
                section.title ||
                "What's New"
              )}
            </h2>

          </div>

        </div>

        <div class="updates-list">

          ${items
            .map(
              (item) => `
                <article
                  class="update-card"
                >

                  <div class="update-date">
                    ${escapeHtml(
                      formatDate(
                        item.date
                      )
                    )}
                  </div>

                  <div class="update-content">

                    ${
                      item.project
                        ? `
                          <span class="update-project">
                            ${escapeHtml(
                              item.project
                            )}
                          </span>
                        `
                        : ""
                    }

                    <h3>
                      ${escapeHtml(
                        item.title ||
                        "Update"
                      )}
                    </h3>

                    <p>
                      ${escapeHtml(
                        item.description ||
                        ""
                      )}
                    </p>

                  </div>

                  ${
                    item.version
                      ? `
                        <div class="update-version">
                          ${escapeHtml(
                            normalizeVersion(
                              item.version
                            )
                          )}
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


/* =========================
   GITHUB
========================= */

function renderGithub(
  section,
  site
) {

  const github =
    safeUrl(
      site?.github
    );

  return `
    <section
      class="github-section section"
      id="github"
    >

      <div class="container">

        <div class="github-card">

          <div>

            <span class="section-kicker">
              OPEN SOURCE
            </span>

            <h2>
              ${escapeHtml(
                section.title ||
                "Open Source"
              )}
            </h2>

            <p>
              コードや制作物は
              GitHub で公開しています。
            </p>

          </div>

          <a
            class="button button-primary"
            href="${escapeHtml(github)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub を見る ↗
          </a>

        </div>

      </div>

    </section>
  `;

}


/* =========================
   EMBEDS
========================= */

function renderEmbeds(
  embeds
) {

  const items =
    Array.isArray(embeds)
      ? embeds.filter(enabled)
      : [];

  if (!items.length) {
    return "";
  }

  return `
    <section
      class="embeds-section section"
    >

      <div class="container">

        <div class="embeds-grid">

          ${items
            .map(
              (item) => {

                const url =
                  safeUrl(
                    item.url
                  );

                if (url === "#") {
                  return "";
                }

                return `
                  <article
                    class="embed-card"
                  >

                    ${
                      item.title
                        ? `
                          <h3>
                            ${escapeHtml(
                              item.title
                            )}
                          </h3>
                        `
                        : ""
                    }

                    <iframe
                      src="${escapeHtml(url)}"
                      title="${escapeHtml(
                        item.title ||
                        "Embedded content"
                      )}"
                      width="${escapeHtml(
                        item.width ||
                        "100%"
                      )}"
                      height="${escapeHtml(
                        item.height ||
                        "420"
                      )}"
                      loading="lazy"
                      frameborder="0"
                    ></iframe>

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


/* =========================
   LINKS
========================= */

function renderLinks(
  links
) {

  const items =
    Array.isArray(links)
      ? links.filter(enabled)
      : [];

  if (!items.length) {
    return "";
  }

  return `
    <section
      class="links-section section"
    >

      <div class="container">

        <div class="links-grid">

          ${items
            .map(
              (item) => {

                const href =
                  safeUrl(
                    item.url
                  );

                const target =
                  item.newTab
                    ? ' target="_blank" rel="noopener noreferrer"'
                    : "";

                return `
                  <a
                    class="link-card"
                    href="${escapeHtml(href)}"
                    ${target}
                  >

                    <span>
                      ${escapeHtml(
                        item.label ||
                        "Link"
                      )}
                    </span>

                    <span>
                      ↗
                    </span>

                  </a>
                `;

              }
            )
            .join("")}

        </div>

      </div>

    </section>
  `;

}


/* =========================
   FOOTER
========================= */

function renderFooter(
  links,
  settings
) {

  const container =
    document.querySelector(
      "#footerLinks"
    );

  if (!container) {
    return;
  }

  const items =
    Array.isArray(links)
      ? links.filter(enabled)
      : [];

  container.innerHTML =
    items
      .slice(0, 10)
      .map(
        (item) => {

          const href =
            safeUrl(
              item.url
            );

          const target =
            item.newTab
              ? ' target="_blank" rel="noopener noreferrer"'
              : "";

          return `
            <a
              href="${escapeHtml(href)}"
              ${target}
            >
              ${escapeHtml(
                item.label ||
                "Link"
              )}
            </a>
          `;

        }
      )
      .join("");

}


/* =========================
   SETTINGS
========================= */

function applySettings(
  settings
) {

  const footer =
    document.querySelector(
      "#siteFooter"
    );

  const footerText =
    settings.footerText;

  if (
    settings.showFooter === false &&
    footer
  ) {

    footer.hidden = true;

  }

  /*
    footerText は今後専用UIを
    追加したときに利用できるよう
    data属性へ渡す。
  */

  if (
    footer &&
    typeof footerText === "string" &&
    footerText.trim()
  ) {

    footer.dataset.footerText =
      footerText;

  }

}


/* =========================
   CURRENT YEAR
========================= */

function updateYear() {

  setText(
    "[data-current-year]",
    new Date().getFullYear()
  );

}


/* =========================
   SMOOTH SCROLL
========================= */

function setupSmoothScroll() {

  document
    .querySelectorAll(
      'a[href^="#"]'
    )
    .forEach((link) => {

      link.addEventListener(
        "click",
        (event) => {

          const href =
            link.getAttribute(
              "href"
            );

          if (
            !href ||
            href === "#"
          ) {
            return;
          }

          const target =
            document.querySelector(
              href
            );

          if (!target) {
            return;
          }

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

          history.replaceState(
            null,
            "",
            href
          );

        }
      );

    });

}


/* =========================
   REVEAL ANIMATION
========================= */

function setupReveal() {

  const elements =
    document.querySelectorAll(
      ".stat-card, .project-card, .featured-project, .update-card, .github-card, .hero-card"
    );

  if (!elements.length) {
    return;
  }

  if (
    !("IntersectionObserver" in window)
  ) {
    elements.forEach(
      (element) => {
        element.classList.add(
          "is-visible"
        );
      }
    );

    return;
  }

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

            entry.target.classList.add(
              "is-visible"
            );

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

      element.classList.add(
        "reveal"
      );

      observer.observe(
        element
      );

    }
  );

}


/* =========================
   FALLBACK
========================= */

function renderFallbackMain() {

  const container =
    document.querySelector(
      "#siteSections"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <section class="hero-section section">
      <div class="container">
        <div class="hero-card">
          <div class="hero-content">

            <div class="hero-eyebrow">
              PERSONAL WEBSITE
            </div>

            <h1 class="hero-title">
              こんにちは！
            </h1>

            <p class="hero-description">
              maru_m4ru_maru が制作している
              ツール・サービス・プロジェクトを紹介しています。
            </p>

          </div>
        </div>
      </div>
    </section>
  `;

}


function renderFallback() {

  console.warn(
    "[maru-website] rendering fallback"
  );

  renderFallbackMain();

  renderNavigation([]);

}


/* =========================
   INIT
========================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    updateYear();

    await loadSiteData();

    setupSmoothScroll();

    setupReveal();

  }
);
