const DATA_URL = "https://raw.githubusercontent.com/maru-m4ru-maru/maru-website/main/site-data.json";

const DEFAULT_AVATAR =
  "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";


/* =========================================================
   STATE
========================================================= */

let siteData = null;


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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


function isEnabled(item) {

  return (
    item &&
    item.enabled !== false
  );

}


function arrayValue(value) {

  return Array.isArray(value)
    ? value
    : [];

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
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
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
        "site-data.json が不正です"
      );

    }


    siteData = data;

    renderSite();


    console.log(
      "[Maru Website] CMS loaded",
      siteData
    );


  } catch (error) {

    console.error(
      "[Maru Website] CMS error",
      error
    );

    renderFallback();

  }

}


/* =========================================================
   RENDER SITE
========================================================= */

function renderSite() {

  const site =
    siteData.site || {};

  const settings =
    siteData.settings || {};


  /* -------------------------
     BASIC
  ------------------------- */

  const siteName =
    site.name ||
    "maru_m4ru_maru";


  const description =
    site.description ||
    "";


  const avatar =
    site.avatar ||
    DEFAULT_AVATAR;


  document.title =
    `${siteName} - Official Website`;


  document
    .getElementById(
      "metaDescription"
    )
    .setAttribute(
      "content",
      description
    );


  document
    .getElementById(
      "siteName"
    )
    .textContent =
      siteName;


  document
    .getElementById(
      "footerSiteName"
    )
    .textContent =
      siteName;


  const avatarElement =
    document.getElementById(
      "siteAvatar"
    );


  avatarElement.src =
    avatar;


  avatarElement.alt =
    siteName;


  /* -------------------------
     NAVIGATION
  ------------------------- */

  renderNavigation();


  /* -------------------------
     SECTIONS
  ------------------------- */

  renderSections();


  /* -------------------------
     FOOTER
  ------------------------- */

  const footer =
    document.getElementById(
      "siteFooter"
    );


  if (
    settings.showFooter === false
  ) {

    footer.hidden = true;

  } else {

    footer.hidden = false;

  }


  document
    .getElementById(
      "footerText"
    )
    .textContent =
      settings.footerText ||
      "Built by maru_m4ru_maru";


  document
    .getElementById(
      "currentYear"
    )
    .textContent =
      new Date().getFullYear();

}


/* =========================================================
   NAVIGATION
========================================================= */

function renderNavigation() {

  const navigation =
    arrayValue(
      siteData.navigation
    ).filter(
      isEnabled
    );


  const nav =
    document.getElementById(
      "siteNavigation"
    );


  nav.innerHTML =
    navigation
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
            ? `
              target="_blank"
              rel="noopener noreferrer"
            `
            : "";


        return `

          <a
            class="nav-link"
            href="${href}"
            ${target}
          >

            <span>
              ${label}
            </span>

          </a>

        `;

      })
      .join("");

}


/* =========================================================
   SECTIONS
========================================================= */

function renderSections() {

  const container =
    document.getElementById(
      "siteSections"
    );


  const sections =
    arrayValue(
      siteData.sections
    ).filter(
      isEnabled
    );


  container.innerHTML = "";


  for (
    const section of sections
  ) {

    let html = "";


    switch (
      section.type
    ) {

      case "hero":

        html =
          renderHero(
            section
          );

        break;


      case "stats":

        html =
          renderStats(
            section
          );

        break;


      case "projects":

        html =
          renderProjects(
            section
          );

        break;


      case "updates":

        html =
          renderUpdates(
            section
          );

        break;


      case "embeds":

        html =
          renderEmbeds();

        break;


      case "links":

        html =
          renderLinks();

        break;


      case "github":

        html =
          renderGithub(
            section
          );

        break;


      case "text":

        html =
          renderText(
            section
          );

        break;

    }


    if (html) {

      container.insertAdjacentHTML(
        "beforeend",
        html
      );

    }

  }

}


/* =========================================================
   HERO
========================================================= */

function renderHero(section) {

  const site =
    siteData.site || {};


  const title =
    section.title ||
    site.tagline ||
    "こんにちは！";


  const description =
    section.description ||
    site.description ||
    "";


  const github =
    safeUrl(
      site.github
    );


  return `

    <section
      id="hero"
      class="hero"
    >

      <div class="container">

        <div class="hero-shell">

          <div class="hero-content">

            <div class="eyebrow">
              INDIE DEVELOPER
            </div>


            <h1>
              ${escapeHtml(
                title
              )}
            </h1>


            <p class="hero-description">
              ${escapeHtml(
                description
              )}
            </p>


            <div class="hero-actions">

              <a
                class="button button-dark"
                href="#projects"
              >
                Projects
                <span>↓</span>
              </a>


              ${
                github !== "#"
                  ? `

                    <a
                      class="button button-light"
                      href="${escapeHtml(
                        github
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                      <span>↗</span>
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

function renderStats(section) {

  const stats =
    arrayValue(
      siteData.stats
    ).filter(
      isEnabled
    );


  if (!stats.length) {
    return "";
  }


  return `

    <section
      id="stats"
      class="section section-stats"
    >

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="eyebrow muted">
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

          ${stats
            .map(
              (stat) => `

                <article
                  class="stat-card"
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


/* =========================================================
   PROJECTS
========================================================= */

function renderProjects(section) {

  const projects =
    arrayValue(
      siteData.projects
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

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="eyebrow muted">
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


        <div class="projects-grid">

          ${projects
            .map(
              renderProjectCard
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
  project
) {

  const url =
    safeUrl(
      project.url
    );


  const github =
    safeUrl(
      project.github
    );


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
    >

      <div class="project-top">

        <div class="project-icon">

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


      <div class="project-body">

        <h3>
          ${escapeHtml(
            project.title ||
            "Untitled Project"
          )}
        </h3>


        <p>
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
        url !== "#" ||
        github !== "#"
          ? `

            <div
              class="project-actions"
            >

              ${
                url !== "#"
                  ? `
                    <a
                      href="${escapeHtml(
                        url
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                      <span>↗</span>
                    </a>
                  `
                  : ""
              }


              ${
                github !== "#"
                  ? `
                    <a
                      href="${escapeHtml(
                        github
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                      <span>↗</span>
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

function renderUpdates(section) {

  const updates =
    arrayValue(
      siteData.updates
    )
      .filter(
        isEnabled
      )
      .slice(
        0,
        8
      );


  if (!updates.length) {
    return "";
  }


  return `

    <section
      id="updates"
      class="section"
    >

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="eyebrow muted">
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


        <div
          class="updates-list"
        >

          ${updates
            .map(
              (update) => `

                <article
                  class="update-card"
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


                    <h3>
                      ${escapeHtml(
                        update.title ||
                        "Update"
                      )}
                    </h3>


                    <p>
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


/* =========================================================
   EMBEDS
========================================================= */

function renderEmbeds() {

  const embeds =
    arrayValue(
      siteData.embeds
    ).filter(
      (embed) =>
        isEnabled(embed) &&
        embed.url
    );


  if (!embeds.length) {
    return "";
  }


  return `

    <section
      class="section"
    >

      <div class="container embed-list">

        ${embeds
          .map(
            (embed) => `

              <article
                class="embed-card"
              >

                <div
                  class="embed-header"
                >

                  <h2>
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

function renderLinks() {

  const links =
    arrayValue(
      siteData.links
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

      <div class="container">

        <div
          class="section-heading"
        >

          <div>

            <span class="eyebrow muted">
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
              (link) => `

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
   GITHUB
========================================================= */

function renderGithub(section) {

  if (
    siteData.settings?.showGitHubCTA ===
    false
  ) {
    return "";
  }


  const github =
    safeUrl(
      siteData.site?.github
    );


  return `

    <section
      id="github"
      class="section github-section"
    >

      <div class="container">

        <div
          class="github-shell"
        >

          <div>

            <span
              class="eyebrow"
            >
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
                  <span>↗</span>
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
   TEXT
========================================================= */

function renderText(section) {

  return `

    <section
      class="section"
    >

      <div class="container">

        <article
          class="text-card"
        >

          <span
            class="eyebrow muted"
          >
            SECTION
          </span>


          <h2>
            ${escapeHtml(
              section.title ||
              "Text"
            )}
          </h2>


          <p>
            ${escapeHtml(
              section.description ||
              ""
            )}
          </p>

        </article>

      </div>

    </section>

  `;

}


/* =========================================================
   FALLBACK
========================================================= */

function renderFallback() {

  document
    .getElementById(
      "siteSections"
    )
    .innerHTML = `

      <section class="hero">

        <div class="container">

          <div class="hero-shell">

            <div class="hero-content">

              <div class="eyebrow">
                WEBSITE
              </div>

              <h1>
                maru_m4ru_maru
              </h1>

              <p class="hero-description">
                サイトデータを読み込めませんでした。
              </p>

            </div>

          </div>

        </div>

      </section>

    `;

}


/* =========================================================
   SMOOTH SCROLL
========================================================= */

document.addEventListener(
  "click",
  (event) => {

    const link =
      event.target.closest(
        'a[href^="#"]'
      );


    if (!link) {
      return;
    }


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

  }
);


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSiteData();

  }
);
