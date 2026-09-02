const SITE_DATA_URL =
  "./site-data.json";


const DEFAULT_AVATAR =
  "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";


let siteData = null;


/* =========================
   共通
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function normalizeVersion(version) {

  if (!version) {
    return "";
  }

  const value =
    String(version).trim();

  if (
    value.startsWith("v")
  ) {
    return value;
  }

  return `v${value}`;
}


function isEnabled(item) {

  return (
    item &&
    item.enabled !== false
  );

}


function safeUrl(value) {

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "";
  }


  const url =
    value.trim();


  /*
   * 相対URLとハッシュは許可
   */

  if (
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../") ||
    url.startsWith("#")
  ) {
    return url;
  }


  try {

    const parsed =
      new URL(url);


    if (
      parsed.protocol === "https:" ||
      parsed.protocol === "http:"
    ) {
      return parsed.href;
    }


    return "";

  } catch {

    return "";

  }

}


/* =========================
   DATA LOAD
========================= */

async function loadSiteData() {

  try {

    const response =
      await fetch(
        `${SITE_DATA_URL}?cb=${Date.now()}`,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `site-data.json returned HTTP ${response.status}`
      );

    }


    siteData =
      await response.json();


    normalizeData();


    renderSite();


    console.log(
      "[maru-website] CMS data loaded",
      siteData
    );


  } catch (error) {

    console.error(
      "[maru-website] Failed to load CMS data",
      error
    );


    renderFallback();

  }

}


/* =========================
   NORMALIZE
========================= */

function normalizeData() {

  if (
    !siteData ||
    typeof siteData !== "object"
  ) {
    siteData = {};
  }


  if (
    !siteData.site ||
    typeof siteData.site !== "object"
  ) {
    siteData.site = {};
  }


  siteData.site.name ||=
    "maru_m4ru_maru";


  siteData.site.tagline ||=
    "ScratchやWebを、もっと便利に。";


  siteData.site.description ||=
    "maru_m4ru_maru が制作しているツール・サービス・プロジェクトを紹介しています。";


  siteData.site.avatar ||=
    DEFAULT_AVATAR;


  siteData.site.github ||=
    "https://github.com/maru-m4ru-maru";


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


  if (
    !siteData.settings ||
    typeof siteData.settings !== "object"
  ) {

    siteData.settings = {};

  }


  if (
    typeof siteData.settings.showFooter !==
    "boolean"
  ) {

    siteData.settings.showFooter =
      true;

  }


  if (
    typeof siteData.settings.showGitHubCTA !==
    "boolean"
  ) {

    siteData.settings.showGitHubCTA =
      true;

  }

}


/* =========================
   SITE
========================= */

function renderSite() {

  renderNavigation();

  renderSections();

  renderFooter();

  updateMeta();

}


/* =========================
   NAVIGATION
========================= */

function renderNavigation() {

  const navigation =
    document.getElementById(
      "siteNavigation"
    );


  if (!navigation) {
    return;
  }


  const items =
    siteData.navigation
      .filter(isEnabled);


  navigation.innerHTML =
    items
      .map(
        (item) => {

          const href =
            safeUrl(item.href);


          if (!href) {
            return "";
          }


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
   SECTIONS
========================= */

function renderSections() {

  const container =
    document.getElementById(
      "siteSections"
    );


  if (!container) {
    return;
  }


  const sections =
    [...siteData.sections]
      .filter(isEnabled);


  /*
   * sectionsが空でも
   * CMSのデータから最低限表示する。
   */

  if (!sections.length) {

    container.innerHTML =
      renderDefaultHome();

    return;

  }


  container.innerHTML =
    sections
      .map(
        (section) =>
          renderSection(
            section
          )
      )
      .join("");


}


/* =========================
   SECTION ROUTER
========================= */

function renderSection(
  section
) {

  switch (
    section.type
  ) {

    case "hero":
      return renderHero(
        section
      );


    case "stats":
      return renderStats(
        section
      );


    case "projects":
      return renderProjects(
        section
      );


    case "updates":
      return renderUpdates(
        section
      );


    case "embeds":
      return renderEmbeds(
        section
      );


    case "links":
      return renderLinks(
        section
      );


    case "github":
      return renderGithub(
        section
      );


    case "text":
      return renderText(
        section
      );


    default:
      return "";

  }

}


/* =========================
   HERO
========================= */

function renderHero(
  section
) {

  const title =
    section.title ||
    siteData.site.tagline;


  const description =
    section.description ||
    siteData.site.description;


  return `

    <section class="hero">

      <div class="container">

        <div class="hero-grid">

          <div class="hero-main">

            <div class="eyebrow">

              <span class="status-dot"></span>

              Indie Developer

            </div>


            <h1>

              ${formatHeroTitle(
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
                href="#projects"
                class="button button-primary"
              >
                Projects
              </a>


              <a
                href="${escapeHtml(
                  safeUrl(
                    siteData.site.github
                  )
                )}"
                target="_blank"
                rel="noopener noreferrer"
                class="button button-secondary"
              >
                GitHub
              </a>

            </div>

          </div>


          <div class="hero-side">

            <div class="profile-card">

              <div class="profile-top">

                <img
                  src="${escapeHtml(
                    siteData.site.avatar ||
                    DEFAULT_AVATAR
                  )}"
                  alt="${escapeHtml(
                    siteData.site.name
                  )}"
                  class="profile-avatar"
                >


                <div>

                  <strong>
                    ${escapeHtml(
                      siteData.site.name
                    )}
                  </strong>

                  <span>
                    Creator / Developer
                  </span>

                </div>

              </div>


              <div class="profile-line"></div>


              <div class="profile-tags">

                <span>Scratch</span>
                <span>Web</span>
                <span>JavaScript</span>
                <span>Python</span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>

  `;

}


function formatHeroTitle(
  text
) {

  const value =
    String(text);


  /*
   * 「、」を基準に
   * 2行っぽく見せる。
   */

  if (
    value.includes("、")
  ) {

    const index =
      value.indexOf("、") + 1;


    return `
      ${escapeHtml(
        value.slice(0, index)
      )}
      <br>
      <span>
        ${escapeHtml(
          value.slice(index)
        )}
      </span>
    `;

  }


  return escapeHtml(
    value
  );

}


/* =========================
   STATS
========================= */

function renderStats() {

  const stats =
    siteData.stats
      .filter(isEnabled);


  if (!stats.length) {
    return "";
  }


  return `

    <section class="stats-section">

      <div class="container">

        <div class="stats-grid">

          ${stats
            .map(
              (stat) => `

                <div class="stat-card">

                  <span class="stat-label">

                    ${escapeHtml(
                      stat.label ||
                      ""
                    )}

                  </span>


                  <strong class="stat-value">

                    ${escapeHtml(
                      stat.value ||
                      ""
                    )}

                  </strong>


                  <span class="stat-meta">

                    ${escapeHtml(
                      stat.meta ||
                      ""
                    )}

                  </span>

                </div>

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
  section
) {

  const projects =
    siteData.projects
      .filter(isEnabled);


  if (!projects.length) {
    return "";
  }


  return `

    <section
      class="section projects-section"
      id="projects"
    >

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="section-kicker">
              PROJECTS
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


function renderProjectCard(
  project
) {

  const url =
    safeUrl(project.url);


  const github =
    safeUrl(project.github);


  const tags =
    Array.isArray(
      project.tags
    )
      ? project.tags
      : [];


  return `

    <article
      class="project-card"
    >

      <div class="project-card-top">

        <div class="project-icon">

          ${escapeHtml(
            project.icon ||
            "PR"
          )}

        </div>


        <span class="project-status">

          ${escapeHtml(
            project.status ||
            "DRAFT"
          )}

        </span>

      </div>


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


      <div class="project-tags">

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


      ${
        url || github
          ? `

            <div
              class="project-links"
              style="
                display:flex;
                gap:8px;
                margin-top:16px;
              "
            >

              ${
                url
                  ? `
                    <a
                      href="${escapeHtml(
                        url
                      )}"
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
                      href="${escapeHtml(
                        github
                      )}"
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

}


/* =========================
   UPDATES
========================= */

function renderUpdates(
  section
) {

  const updates =
    siteData.updates
      .filter(isEnabled);


  if (!updates.length) {
    return "";
  }


  const latest =
    updates[0];


  return `

    <section
      class="section updates-section"
      id="updates"
    >

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="section-kicker">
              LATEST UPDATE
            </span>

            <h2>

              ${escapeHtml(
                section.title ||
                "What's New"
              )}

            </h2>

          </div>

        </div>


        <div class="update-card">

          <div class="update-date">

            <span>
              Latest
            </span>

            <strong>

              ${escapeHtml(
                latest.date ||
                "—"
              )}

            </strong>

          </div>


          <div class="update-main">

            <div class="update-label">

              ${escapeHtml(
                latest.project ||
                "Update"
              )}

            </div>


            <h3>

              ${escapeHtml(
                latest.title ||
                ""
              )}

            </h3>


            <p>

              ${escapeHtml(
                latest.description ||
                ""
              )}

            </p>

          </div>


          <div class="update-version">

            <span>
              Version
            </span>

            <strong>

              ${escapeHtml(
                normalizeVersion(
                  latest.version
                )
              )}

            </strong>

          </div>

        </div>

      </div>

    </section>

  `;

}


/* =========================
   EMBEDS
========================= */

function renderEmbeds(
  section
) {

  const embeds =
    siteData.embeds
      .filter(isEnabled)
      .filter(
        (embed) =>
          safeUrl(
            embed.url
          )
      );


  if (!embeds.length) {
    return "";
  }


  return `

    <section
      class="section embeds-section"
      id="embeds"
    >

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="section-kicker">
              EMBEDS
            </span>

            <h2>

              ${escapeHtml(
                section.title ||
                "Embedded Tools"
              )}

            </h2>

          </div>

        </div>


        <div
          class="embeds-grid"
          style="
            display:grid;
            gap:16px;
          "
        >

          ${embeds
            .map(
              (embed) => {

                const url =
                  safeUrl(
                    embed.url
                  );


                const height =
                  Number(
                    embed.height
                  );


                const iframeHeight =
                  Number.isFinite(
                    height
                  ) &&
                  height > 100 &&
                  height < 2000
                    ? height
                    : 420;


                return `

                  <article
                    class="embed-card"
                    style="
                      padding:18px;
                      border:1px solid var(--border);
                      border-radius:var(--radius-md);
                      background:var(--surface);
                    "
                  >

                    <h3
                      style="
                        margin:0 0 12px;
                        font-size:18px;
                      "
                    >
                      ${escapeHtml(
                        embed.title ||
                        "Embedded Content"
                      )}
                    </h3>


                    <div
                      style="
                        overflow:hidden;
                        border:1px solid var(--border);
                        border-radius:10px;
                        background:#fff;
                      "
                    >

                      <iframe
                        src="${escapeHtml(
                          url
                        )}"
                        title="${escapeHtml(
                          embed.title ||
                          "Embedded Content"
                        )}"
                        loading="lazy"
                        style="
                          display:block;
                          width:100%;
                          min-height:${iframeHeight}px;
                          border:0;
                        "
                        referrerpolicy="strict-origin-when-cross-origin"
                      ></iframe>

                    </div>

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
  section
) {

  const links =
    siteData.links
      .filter(isEnabled)
      .filter(
        (link) =>
          safeUrl(
            link.url
          )
      );


  if (!links.length) {
    return "";
  }


  return `

    <section
      class="section links-section"
      id="links"
    >

      <div class="container">

        <div class="section-heading">

          <div>

            <span class="section-kicker">
              LINKS
            </span>

            <h2>

              ${escapeHtml(
                section.title ||
                "Links"
              )}

            </h2>

          </div>

        </div>


        <div
          style="
            display:grid;
            gap:9px;
          "
        >

          ${links
            .map(
              (link) => {

                const url =
                  safeUrl(
                    link.url
                  );


                const target =
                  link.newTab !== false
                    ? ' target="_blank" rel="noopener noreferrer"'
                    : "";


                return `

                  <a
                    href="${escapeHtml(
                      url
                    )}"
                    ${target}
                    style="
                      display:flex;
                      align-items:center;
                      justify-content:space-between;
                      gap:12px;
                      padding:15px 17px;
                      border:1px solid var(--border);
                      border-radius:var(--radius-md);
                      background:var(--surface);
                      font-weight:700;
                    "
                  >

                    <span>
                      ${escapeHtml(
                        link.label ||
                        "Link"
                      )}
                    </span>


                    <span
                      style="
                        color:var(--text-muted);
                        font-size:12px;
                      "
                    >
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
   GITHUB
========================= */

function renderGithub(
  section
) {

  if (
    siteData.settings
      .showGitHubCTA === false
  ) {
    return "";
  }


  const github =
    safeUrl(
      siteData.site.github
    );


  if (!github) {
    return "";
  }


  return `

    <section
      class="github-section"
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

              制作しているプロジェクトは
              GitHubで公開しています。

            </p>

          </div>


          <a
            href="${escapeHtml(
              github
            )}"
            target="_blank"
            rel="noopener noreferrer"
            class="button button-dark"
          >
            Visit GitHub ↗
          </a>

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

    <section
      class="section text-section"
    >

      <div class="container">

        <div class="card">

          <div class="section-heading">

            <div>

              <span class="section-kicker">
                SECTION
              </span>

              <h2>

                ${escapeHtml(
                  section.title ||
                  ""
                )}

              </h2>

            </div>

          </div>


          <p
            style="
              margin:0;
              color:var(--text-soft);
              line-height:1.9;
            "
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


/* =========================
   FALLBACK
========================= */

function renderDefaultHome() {

  return `

    ${renderHero({
      title:
        siteData.site.tagline,
      description:
        siteData.site.description
    })}

    ${renderStats()}

    ${renderProjects({
      title:
        "Projects"
    })}

    ${renderUpdates({
      title:
        "What's New"
    })}

    ${renderGithub({
      title:
        "Open Source"
    })}

  `;

}


/* =========================
   FOOTER
========================= */

function renderFooter() {

  const footer =
    document.getElementById(
      "siteFooter"
    );


  if (!footer) {
    return;
  }


  if (
    siteData.settings.showFooter ===
    false
  ) {

    footer.style.display =
      "none";

    return;

  }


  footer.style.display =
    "";


  const currentYear =
    document.querySelector(
      "[data-current-year]"
    );


  if (currentYear) {

    currentYear.textContent =
      new Date().getFullYear();

  }


  const footerLinks =
    document.getElementById(
      "footerLinks"
    );


  if (!footerLinks) {
    return;
  }


  const links = [
    {
      label: "Home",
      href: "#top"
    },
    {
      label: "Projects",
      href: "#projects"
    },
    {
      label: "Updates",
      href: "#updates"
    }
  ];


  if (
    safeUrl(
      siteData.site.github
    )
  ) {

    links.push({
      label: "GitHub",
      href:
        siteData.site.github,
      newTab: true
    });

  }


  footerLinks.innerHTML =
    links
      .map(
        (link) => {

          const href =
            safeUrl(
              link.href
            );


          if (!href) {
            return "";
          }


          const target =
            link.newTab
              ? ' target="_blank" rel="noopener noreferrer"'
              : "";


          return `
            <a
              href="${escapeHtml(
                href
              )}"
              ${target}
            >
              ${escapeHtml(
                link.label
              )}
            </a>
          `;

        }
      )
      .join("");

}


/* =========================
   META
========================= */

function updateMeta() {

  const name =
    siteData.site.name;


  document.title =
    `${name} - Official Website`;


  const meta =
    document.getElementById(
      "metaDescription"
    );


  if (meta) {

    meta.setAttribute(
      "content",
      siteData.site.description
    );

  }


  document
    .querySelectorAll(
      "[data-site-name]"
    )
    .forEach(
      (element) => {

        element.textContent =
          name;

      }
    );


  document
    .querySelectorAll(
      "[data-site-avatar]"
    )
    .forEach(
      (element) => {

        element.src =
          siteData.site.avatar ||
          DEFAULT_AVATAR;


        element.alt =
          name;

      }
    );

}


/* =========================
   IMAGE ERROR FALLBACK
========================= */

document.addEventListener(
  "error",
  (event) => {

    const target =
      event.target;


    if (
      target instanceof
        HTMLImageElement &&
      target.hasAttribute(
        "data-site-avatar"
      )
    ) {

      if (
        target.src !==
        DEFAULT_AVATAR
      ) {

        target.src =
          DEFAULT_AVATAR;

      }

    }

  },
  true
);


/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSiteData();

  }
);
