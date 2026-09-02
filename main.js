const DATA_URL = "./site-data.json";

const DEFAULT_AVATAR =
  "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";

let siteData = null;


/* =========================
   UTILS
========================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function safeString(value) {
  return typeof value === "string"
    ? value
    : "";
}


function isEnabled(item) {
  return item?.enabled !== false;
}


function safeUrl(url) {
  if (
    typeof url !== "string" ||
    !url.trim()
  ) {
    return "#";
  }

  return url.trim();
}


/* =========================
   DATA
========================= */

async function loadSiteData() {

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

    const data =
      await response.json();

    siteData = data;

    renderSite();

  } catch (error) {

    console.error(
      "[maru website] data load failed:",
      error
    );

    renderFallback();

  }

}


/* =========================
   SITE
========================= */

function renderSite() {

  const site =
    siteData.site || {};

  const settings =
    siteData.settings || {};


  /* -------------------------
     BASIC SITE INFO
  ------------------------- */

  const siteName =
    site.name ||
    "maru_m4ru_maru";

  const avatar =
    site.avatar ||
    DEFAULT_AVATAR;

  const description =
    site.description ||
    "";

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
     MAIN SECTIONS
  ------------------------- */

  renderSections();


  /* -------------------------
     FOOTER
  ------------------------- */

  const footer =
    document.getElementById(
      "siteFooter"
    );

  footer.style.display =
    settings.showFooter === false
      ? "none"
      : "";


  const footerText =
    document.getElementById(
      "footerText"
    );

  footerText.textContent =
    settings.footerText ||
    "Built by maru_m4ru_maru";


  document
    .getElementById(
      "currentYear"
    )
    .textContent =
      new Date().getFullYear();

}


/* =========================
   NAVIGATION
========================= */

function renderNavigation() {

  const container =
    document.getElementById(
      "siteNavigation"
    );

  const navigation =
    Array.isArray(
      siteData.navigation
    )
      ? siteData.navigation
      : [];


  const visible =
    navigation.filter(
      isEnabled
    );


  container.innerHTML =
    visible
      .map(
        (item) => {

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
              ? `target="_blank" rel="noopener noreferrer"`
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

        }
      )
      .join("");

}


/* =========================
   SECTIONS
========================= */

function renderSections() {

  const container =
    document.getElementById(
      "siteSections"
    );

  const sections =
    Array.isArray(
      siteData.sections
    )
      ? siteData.sections
      : [];


  container.innerHTML = "";


  sections
    .filter(
      isEnabled
    )
    .forEach(
      (section) => {

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
    );

}


/* =========================
   HERO
========================= */

function renderHero(
  section
) {

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


  return `
    <section
      id="hero"
      class="section hero-section"
    >

      <div class="section-inner">

        <div class="hero-kicker">
          INDIE DEVELOPER
        </div>

        <h1>
          ${escapeHtml(title)}
        </h1>

        <p>
          ${escapeHtml(description)}
        </p>

      </div>

    </section>
  `;

}


/* =========================
   STATS
========================= */

function renderStats(
  section
) {

  const stats =
    Array.isArray(
      siteData.stats
    )
      ? siteData.stats.filter(
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

      <div class="section-inner">

        <div class="content-block">

          <h2>
            ${escapeHtml(
              section.title ||
              "Quick Stats"
            )}
          </h2>

          <div class="stats-grid">

            ${stats
              .map(
                (stat) => `
                  <div
                    class="stat-card"
                  >

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

                    ${
                      stat.meta
                        ? `
                          <small>
                            ${escapeHtml(
                              stat.meta
                            )}
                          </small>
                        `
                        : ""
                    }

                  </div>
                `
              )
              .join("")}

          </div>

        </div>

      </div>

    </section>
  `;

}


/* =========================
   PROJECTS
========================= */

function renderProjects(
  section
) {

  const projects =
    Array.isArray(
      siteData.projects
    )
      ? siteData.projects.filter(
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

      <div class="section-inner">

        <div class="content-block">

          <h2>
            ${escapeHtml(
              section.title ||
              "Projects"
            )}
          </h2>


          <div class="projects-list">

            ${projects
              .map(
                (project) => {

                  const url =
                    safeUrl(
                      project.url
                    );

                  return `
                    <article
                      class="project-card"
                    >

                      <strong>
                        ${escapeHtml(
                          project.title ||
                          "Project"
                        )}
                      </strong>

                      <p>
                        ${escapeHtml(
                          project.description ||
                          ""
                        )}
                      </p>


                      ${
                        project.tags?.length
                          ? `
                            <div class="tags">

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


                      ${
                        project.status
                          ? `
                            <small class="project-status">
                              ${escapeHtml(
                                project.status
                              )}
                            </small>
                          `
                          : ""
                      }


                      <div class="project-links">

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
                                Open ↗
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
                                GitHub ↗
                              </a>
                            `
                            : ""
                        }

                      </div>

                    </article>
                  `;

                }
              )
              .join("")}

          </div>

        </div>

      </div>

    </section>
  `;

}


/* =========================
   UPDATES
========================= */

function renderUpdates(
  section
) {

  const updates =
    Array.isArray(
      siteData.updates
    )
      ? siteData.updates.filter(
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

      <div class="section-inner">

        <div class="content-block">

          <h2>
            ${escapeHtml(
              section.title ||
              "What's New"
            )}
          </h2>


          <div class="updates-list">

            ${updates
              .map(
                (update) => `
                  <article
                    class="update-card"
                  >

                    <strong>
                      ${escapeHtml(
                        update.title ||
                        "Update"
                      )}
                    </strong>

                    ${
                      update.project
                        ? `
                          <span>
                            ${escapeHtml(
                              update.project
                            )}
                          </span>
                        `
                        : ""
                    }

                    ${
                      update.description
                        ? `
                          <p>
                            ${escapeHtml(
                              update.description
                            )}
                          </p>
                        `
                        : ""
                    }

                    <div
                      class="update-meta"
                    >

                      ${
                        update.version
                          ? `
                            <small>
                              ${escapeHtml(
                                update.version
                              )}
                            </small>
                          `
                          : ""
                      }

                      ${
                        update.date
                          ? `
                            <small>
                              ${escapeHtml(
                                update.date
                              )}
                            </small>
                          `
                          : ""
                      }

                    </div>

                  </article>
                `
              )
              .join("")}

          </div>

        </div>

      </div>

    </section>
  `;

}


/* =========================
   EMBEDS
========================= */

function renderEmbeds() {

  const embeds =
    Array.isArray(
      siteData.embeds
    )
      ? siteData.embeds.filter(
          (item) =>
            isEnabled(item) &&
            item.url
        )
      : [];


  if (!embeds.length) {
    return "";
  }


  return `
    <section
      class="section"
    >

      <div class="section-inner">

        ${embeds
          .map(
            (embed) => `
              <div class="content-block">

                <h2>
                  ${escapeHtml(
                    embed.title ||
                    "Embed"
                  )}
                </h2>

                <iframe
                  class="embed-frame"
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

              </div>
            `
          )
          .join("")}

      </div>

    </section>
  `;

}


/* =========================
   LINKS
========================= */

function renderLinks() {

  const links =
    Array.isArray(
      siteData.links
    )
      ? siteData.links.filter(
          isEnabled
        )
      : [];


  if (!links.length) {
    return "";
  }


  return `
    <section class="section">

      <div class="section-inner">

        <div class="content-block">

          <h2>
            Links
          </h2>

          <div class="links-list">

            ${links
              .map(
                (link) => {

                  const href =
                    safeUrl(
                      link.url
                    );

                  const target =
                    link.newTab
                      ? `target="_blank" rel="noopener noreferrer"`
                      : "";

                  return `
                    <a
                      class="link-card"
                      href="${escapeHtml(
                        href
                      )}"
                      ${target}
                    >

                      <strong>
                        ${escapeHtml(
                          link.label ||
                          "Link"
                        )}
                      </strong>

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

      </div>

    </section>
  `;

}


/* =========================
   GITHUB
========================= */

function renderGithub(
  section
) {

  const site =
    siteData.site || {};


  if (
    siteData.settings?.showGitHubCTA ===
    false
  ) {
    return "";
  }


  const github =
    safeUrl(
      site.github
    );


  return `
    <section
      id="github"
      class="section"
    >

      <div class="section-inner">

        <div class="content-block">

          <h2>
            ${escapeHtml(
              section.title ||
              "Open Source"
            )}
          </h2>

          <div class="github-card">

            <strong>
              ${escapeHtml(
                github
              )}
            </strong>

            <p>
              公開プロジェクトとソースコード。
            </p>

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
                    GitHubを見る ↗
                  </a>
                `
                : ""
            }

          </div>

        </div>

      </div>

    </section>
  `;

}


/* =========================
   TEXT
========================= */

function renderText(
  section
) {

  return `
    <section class="section">

      <div class="section-inner">

        <div class="content-block">

          <h2>
            ${escapeHtml(
              section.title ||
              "Text Section"
            )}
          </h2>

          <p class="text-section">
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


/* =========================
   FALLBACK
========================= */

function renderFallback() {

  const container =
    document.getElementById(
      "siteSections"
    );

  container.innerHTML = `
    <section class="section">

      <div class="section-inner">

        <div class="content-block">

          <h1>
            maru_m4ru_maru
          </h1>

          <p>
            サイトデータを読み込めませんでした。
          </p>

        </div>

      </div>

    </section>
  `;

}


/* =========================
   INIT
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSiteData();

  }
);
