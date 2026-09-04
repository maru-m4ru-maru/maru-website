/* Project editor enhancements: color picker + drag sorting */
(function () {
  "use strict";

  function validColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || ""));
  }

  function getColor(project) {
    return validColor(project?.color) ? project.color : "#ffffff";
  }

  function openColorPicker(input) {
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch (_) {
      // Fall back to the normal input click below.
    }
    input.click();
  }

  function renderProjectList() {
    const projects = getArray("projects");

    pageContent.innerHTML = `
      <div class="page-heading">
        <h2>プロジェクト</h2>
        <p>プロジェクトカードを追加・編集できます。カードをクリックして色を変更、ドラッグして順番を変更できます。</p>
      </div>
      <div class="card">
        <div class="card-header">
          <strong>プロジェクト一覧</strong>
          <button id="addProjectButton" class="button primary small" type="button">＋ プロジェクト追加</button>
        </div>
        <div id="projectList" class="editor-list"></div>
      </div>
    `;

    const list = document.getElementById("projectList");

    if (!projects.length) {
      list.innerHTML = `<div class="empty">プロジェクトはまだありません。</div>`;
    }

    projects.forEach((project, index) => {
      const color = getColor(project);
      const item = document.createElement("div");
      item.className = "editor-item project-editor-item";
      item.draggable = true;
      item.style.setProperty("--project-editor-color", color);
      item.innerHTML = `
        <div class="drag-handle project-drag-handle" title="ドラッグして並べ替え">☰</div>
        <button class="project-color-swatch" type="button" style="background:${escapeHtml(color)}" aria-label="${escapeHtml(project.title || "プロジェクト")} の色を変更" title="クリックで色変更"></button>
        <input class="project-color-input" type="color" value="${escapeHtml(color)}" tabindex="-1" aria-hidden="true">
        <div class="item-main">
          <strong>${escapeHtml(project.title || "無題のプロジェクト")}</strong>
          <span>${escapeHtml(project.status || "ステータス未設定")}</span>
        </div>
        <div class="item-actions">
          <button class="toggleProject" type="button">${project.enabled !== false ? "公開中" : "非公開"}</button>
          <button class="editProject" type="button">編集</button>
          <button class="deleteProject" type="button">削除</button>
        </div>
      `;

      const colorInput = item.querySelector(".project-color-input");
      const colorSwatch = item.querySelector(".project-color-swatch");

      const applyColor = (value) => {
        const next = validColor(value) ? value : "#ffffff";
        project.color = next;
        colorInput.value = next;
        colorSwatch.style.background = next;
        item.style.setProperty("--project-editor-color", next);
        markDirty();
        renderPreview();
      };

      colorSwatch.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openColorPicker(colorInput);
      });

      item.addEventListener("click", (event) => {
        if (event.target.closest("button, input, textarea, select, a")) return;
        openColorPicker(colorInput);
      });

      colorInput.addEventListener("input", (event) => {
        applyColor(event.target.value);
      });

      item.querySelector(".toggleProject").addEventListener("click", () => {
        project.enabled = project.enabled === false;
        markDirty();
        renderProjects();
        renderPreview();
      });

      item.querySelector(".editProject").addEventListener("click", () => {
        openProjectEditor(project);
      });

      item.querySelector(".deleteProject").addEventListener("click", () => {
        if (!confirm(`「${project.title || "無題のプロジェクト"}」を削除しますか？`)) return;
        projects.splice(index, 1);
        markDirty();
        renderProjects();
        renderPreview();
      });

      item.addEventListener("dragstart", (event) => {
        if (event.target.closest("button, input, textarea, select, a")) {
          event.preventDefault();
          return;
        }
        item.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        list.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
      });

      item.addEventListener("dragover", (event) => {
        event.preventDefault();
        const dragging = list.querySelector(".dragging");
        if (!dragging || dragging === item) return;
        list.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
        item.classList.add("drag-over");
      });

      item.addEventListener("dragleave", (event) => {
        if (!item.contains(event.relatedTarget)) item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (event) => {
        event.preventDefault();
        item.classList.remove("drag-over");
        const from = Number(event.dataTransfer.getData("text/plain"));
        if (!Number.isInteger(from) || from < 0 || from >= projects.length || from === index) return;
        const [moved] = projects.splice(from, 1);
        projects.splice(index, 0, moved);
        markDirty();
        renderProjects();
        renderPreview();
      });

      list.appendChild(item);
    });

    document.getElementById("addProjectButton").addEventListener("click", () => {
      const project = {
        id: makeId("project"),
        title: "新しいプロジェクト",
        description: "",
        status: "DRAFT",
        tags: [],
        url: "",
        github: "",
        icon: "PR",
        color: "#ffffff",
        featured: false,
        enabled: true
      };
      projects.push(project);
      markDirty();
      openProjectEditor(project);
    });
  }

  const originalOpenProjectEditor = window.openProjectEditor;
  window.openProjectEditor = function (project) {
    if (!validColor(project.color)) project.color = "#ffffff";
    originalOpenProjectEditor(project);
    const grid = document.querySelector("#projectTitle")?.closest(".form-grid");
    if (!grid || document.getElementById("projectColor")) return;

    const card = document.createElement("div");
    card.className = "field";
    card.innerHTML = `<label for="projectColor">カードカラー</label><div style="display:flex;gap:8px;align-items:center"><input id="projectColor" type="color" value="${escapeHtml(project.color)}"><code id="projectColorValue">${escapeHtml(project.color)}</code></div>`;
    grid.appendChild(card);

    const input = document.getElementById("projectColor");
    const value = document.getElementById("projectColorValue");
    input?.addEventListener("input", (event) => {
      project.color = event.target.value;
      if (value) value.textContent = event.target.value;
      markDirty();
      renderPreview();
    });
  };

  window.renderProjects = renderProjectList;
})();
