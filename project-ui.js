/* Public project card color support */
(function () {
  "use strict";

  function escape(value) {
    return escapeHtml(value);
  }

  function safeColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || ""))
      ? String(value)
      : "#ffffff";
  }

  window.renderProjectCard = function (project) {
    const url = safeUrl(project.url);
    const github = safeUrl(project.github);
    const tags = arrayValue(project.tags);
    const color = safeColor(project.color);

    return `
      <article
        class="project-card ${project.featured ? "project-featured" : ""}"
        style="--project-color:${escape(color)};"
      >
        <div class="project-top">
          <div class="project-icon" style="background:color-mix(in srgb, var(--project-color) 16%, white);color:color-mix(in srgb, var(--project-color) 70%, #111318);">
            ${escape(project.icon || "PR")}
          </div>
          ${project.status ? `<span class="project-status" style="background:color-mix(in srgb, var(--project-color) 14%, white);color:color-mix(in srgb, var(--project-color) 70%, #111318);">${escape(project.status)}</span>` : ""}
        </div>

        <div class="project-body">
          <h3>${escape(project.title || "Untitled Project")}</h3>
          <p>${escape(project.description || "")}</p>
          ${tags.length ? `
            <div class="project-tags">
              ${tags.map((tag) => `<span style="background:color-mix(in srgb, var(--project-color) 10%, white);border-color:color-mix(in srgb, var(--project-color) 22%, #d9dde3);">${escape(tag)}</span>`).join("")}
            </div>
          ` : ""}
        </div>

        ${url !== "#" || github !== "#" ? `
          <div class="project-actions">
            ${url !== "#" ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">Open <span>↗</span></a>` : ""}
            ${github !== "#" ? `<a href="${escape(github)}" target="_blank" rel="noopener noreferrer">GitHub <span>↗</span></a>` : ""}
          </div>
        ` : ""}
      </article>
    `;
  };

  window.renderProjects = function (section) {
    const projects = arrayValue(siteData.projects).filter(isEnabled);
    if (!projects.length) return "";

    return `
      <section id="projects" class="section">
        <div class="container">
          <div class="section-heading">
            <div>
              <span class="eyebrow muted">WORK</span>
              <h2>${escape(section.title || "Projects")}</h2>
            </div>
          </div>
          <div class="projects-grid">
            ${projects.map(window.renderProjectCard).join("")}
          </div>
        </div>
      </section>
    `;
  };
})();
