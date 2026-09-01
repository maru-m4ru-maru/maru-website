(() => {
  "use strict";

  const WORKER_URL =
    "https://maru-website-admin.maru-0727.workers.dev";

  const DATA_URL =
    "../site-data.json";


  const token =
    sessionStorage.getItem(
      "maru_admin_token"
    );


  const siteName =
    document.getElementById(
      "site-name"
    );

  const tagline =
    document.getElementById(
      "tagline"
    );

  const description =
    document.getElementById(
      "description"
    );

  const addonsVersion =
    document.getElementById(
      "addons-version"
    );

  const addonsUpdate =
    document.getElementById(
      "addons-update"
    );

  const updateDate =
    document.getElementById(
      "update-date"
    );


  const quickVersion =
    document.getElementById(
      "quick-version"
    );

  const quickUpdate =
    document.getElementById(
      "quick-update"
    );


  const saveButtons = [
    document.getElementById("save-top"),
    document.getElementById("save-bottom")
  ].filter(Boolean);


  const resetButton =
    document.getElementById(
      "reset"
    );


  const logoutButton =
    document.getElementById(
      "logout"
    );


  const saveIndicator =
    document.getElementById(
      "save-indicator"
    );


  const saveStatus =
    document.getElementById(
      "save-status"
    );


  const saveTime =
    document.getElementById(
      "save-time"
    );


  const toast =
    document.getElementById(
      "toast"
    );


  let originalData = null;

  let currentData = null;

  let dirty = false;

  let saveInProgress = false;


  const sections = {
    overview: {
      title: "Overview",
      description:
        "サイトの状態を確認します。"
    },

    site: {
      title: "Site",
      description:
        "サイトの基本情報を編集します。"
    },

    addons: {
      title: "Addons",
      description:
        "まる Addonsの情報を編集します。"
    },

    updates: {
      title: "Updates",
      description:
        "サイトの更新情報を管理します。"
    }
  };


  function markDirty() {

    dirty = true;

    saveIndicator?.classList.remove(
      "saved"
    );

    saveIndicator?.classList.add(
      "unsaved"
    );

    saveIndicator.querySelector(
      "span"
    ).nextSibling.textContent =
      " 未保存";

    saveStatus.textContent =
      "変更があります";

  }


  function markSaved() {

    dirty = false;

    saveIndicator?.classList.remove(
      "unsaved"
    );

    saveIndicator?.classList.add(
      "saved"
    );

    saveIndicator.querySelector(
      "span"
    ).nextSibling.textContent =
      " 保存済み";

    saveStatus.textContent =
      "保存済み";

    saveTime.textContent =
      new Date().toLocaleTimeString(
        "ja-JP",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

  }


  function showToast(
    text
  ) {

    toast.textContent =
      text;

    toast.classList.add(
      "show"
    );

    clearTimeout(
      toast.__timer
    );

    toast.__timer =
      setTimeout(
        () => {
          toast.classList.remove(
            "show"
          );
        },
        1800
      );

  }


  function setField(
    element,
    value
  ) {

    if (!element) return;

    element.value =
      typeof value === "string"
        ? value
        : "";

  }


  function getField(
    element
  ) {

    return element?.value?.trim() ||
      "";

  }


  function applyData(
    data
  ) {

    currentData = {
      siteName:
        data.siteName || "",

      tagline:
        data.tagline || "",

      description:
        data.description || "",

      addonsVersion:
        data.addonsVersion || "",

      addonsUpdate:
        data.addonsUpdate || "",

      updateDate:
        data.updateDate || ""
    };


    setField(
      siteName,
      currentData.siteName
    );

    setField(
      tagline,
      currentData.tagline
    );

    setField(
      description,
      currentData.description
    );

    setField(
      addonsVersion,
      currentData.addonsVersion
    );

    setField(
      addonsUpdate,
      currentData.addonsUpdate
    );

    setField(
      updateDate,
      currentData.updateDate
    );


    setField(
      quickVersion,
      currentData.addonsVersion
    );

    setField(
      quickUpdate,
      currentData.addonsUpdate
    );


    updateAllPreviews();

    updateCounts();

  }


  function collectData() {

    return {
      siteName:
        getField(siteName),

      tagline:
        getField(tagline),

      description:
        getField(description),

      addonsVersion:
        getField(addonsVersion),

      addonsUpdate:
        getField(addonsUpdate),

      updateDate:
        getField(updateDate)
    };

  }


  function syncQuickEdit() {

    if (
      document.activeElement !==
      quickVersion
    ) {
      quickVersion.value =
        addonsVersion.value;
    }


    if (
      document.activeElement !==
      quickUpdate
    ) {
      quickUpdate.value =
        addonsUpdate.value;
    }

  }


  function updateAllPreviews() {

    const data =
      collectData();


    document
      .getElementById(
        "stat-site-name"
      )
      .textContent =
        data.siteName ||
        "—";


    document
      .getElementById(
        "stat-version"
      )
      .textContent =
        data.addonsVersion
          ? `v${data.addonsVersion}`
          : "—";


    document
      .getElementById(
        "stat-date"
      )
      .textContent =
        data.updateDate ||
        "—";


    document
      .getElementById(
        "preview-site-name"
      )
      .textContent =
        data.siteName ||
        "maru_m4ru_maru";


    document
      .getElementById(
        "preview-tagline"
      )
      .textContent =
        data.tagline ||
        "";


    document
      .getElementById(
        "live-name"
      )
      .textContent =
        data.siteName ||
        "maru_m4ru_maru";


    document
      .getElementById(
        "live-tagline"
      )
      .textContent =
        data.tagline ||
        "";


    document
      .getElementById(
        "live-description"
      )
      .textContent =
        data.description ||
        "";


    document
      .getElementById(
        "live-version"
      )
      .textContent =
        data.addonsVersion
          ? `v${data.addonsVersion}`
          : "";


    document
      .getElementById(
        "live-update"
      )
      .textContent =
        data.addonsUpdate ||
        "";

  }


  function updateCounts() {

    updateCount(
      siteName,
      "site-name-count",
      100
    );

    updateCount(
      tagline,
      "tagline-count",
      200
    );

    updateCount(
      description,
      "description-count",
      1000
    );

    updateCount(
      addonsUpdate,
      "addons-update-count",
      1000
    );

  }


  function updateCount(
    input,
    targetId,
    max
  ) {

    const target =
      document.getElementById(
        targetId
      );

    if (!target || !input) {
      return;
    }

    target.textContent =
      `${input.value.length} / ${max}`;

  }


  function setupFieldListeners() {

    const fields = [
      siteName,
      tagline,
      description,
      addonsVersion,
      addonsUpdate,
      updateDate,
      quickVersion,
      quickUpdate
    ];


    fields.forEach(
      field => {

        if (!field) return;

        field.addEventListener(
          "input",
          () => {

            if (
              field ===
              quickVersion
            ) {
              addonsVersion.value =
                field.value;
            }


            if (
              field ===
              quickUpdate
            ) {
              addonsUpdate.value =
                field.value;
            }


            if (
              field ===
              addonsVersion
            ) {
              if (
                quickVersion !==
                document.activeElement
              ) {
                quickVersion.value =
                  field.value;
              }
            }


            if (
              field ===
              addonsUpdate
            ) {
              if (
                quickUpdate !==
                document.activeElement
              ) {
                quickUpdate.value =
                  field.value;
              }
            }


            updateCounts();
            updateAllPreviews();
            markDirty();

          }
        );

      }
    );

  }


  function setupNavigation() {

    const buttons =
      document.querySelectorAll(
        ".nav-item"
      );


    buttons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const key =
              button.dataset.section;

            if (
              !sections[key]
            ) {
              return;
            }


            buttons.forEach(
              item => {
                item.classList.toggle(
                  "active",
                  item === button
                );
              }
            );


            document
              .querySelectorAll(
                ".section"
              )
              .forEach(
                section => {

                  section.classList.toggle(
                    "active",
                    section.dataset.content ===
                      key
                  );

                }
              );


            document
              .getElementById(
                "page-title"
              )
              .textContent =
                sections[key].title;


            document
              .getElementById(
                "page-description"
              )
              .textContent =
                sections[key].description;

          }
        );

      }
    );

  }


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


      const data =
        await response.json();


      originalData =
        JSON.parse(
          JSON.stringify(data)
        );


      applyData(
        originalData
      );


      markSaved();


    } catch (error) {

      console.error(
        "[Maru Admin]",
        error
      );


      saveStatus.textContent =
        "データの読み込みに失敗しました";


      saveStatus.style.color =
        "#d54848";

    }

  }


  async function saveData() {

    if (saveInProgress) {
      return;
    }


    const currentToken =
      sessionStorage.getItem(
        "maru_admin_token"
      );


    if (!currentToken) {

      window.location.replace(
        "./"
      );

      return;
    }


    const data =
      collectData();


    saveInProgress =
      true;


    saveButtons.forEach(
      button => {

        button.disabled =
          true;

        button.textContent =
          "保存中...";

      }
    );


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
                `Bearer ${currentToken}`
            },

            body:
              JSON.stringify({
                siteData: data
              })
          }
        );


      const result =
        await response.json();


      if (
        response.status === 401
      ) {

        sessionStorage.removeItem(
          "maru_admin_token"
        );

        sessionStorage.removeItem(
          "maru_admin_expires"
        );

        alert(
          "ログインの有効期限が切れました。"
        );

        window.location.replace(
          "./"
        );

        return;
      }


      if (
        !response.ok ||
        !result.success
      ) {

        throw new Error(
          result.message ||
          `保存に失敗しました (HTTP ${response.status})`
        );

      }


      originalData =
        JSON.parse(
          JSON.stringify(data)
        );


      markSaved();

      showToast(
        "保存しました"
      );


    } catch (error) {

      console.error(
        "[Maru Admin Save]",
        error
      );


      saveStatus.textContent =
        error.message ||
        "保存に失敗しました";


      saveStatus.style.color =
        "#d54848";


      showToast(
        "保存に失敗しました"
      );


    } finally {

      saveInProgress =
        false;


      saveButtons.forEach(
        button => {

          button.disabled =
            false;

          button.textContent =
            "保存する";

        }
      );

    }

  }


  function resetData() {

    if (!originalData) {
      return;
    }


    if (!dirty) {
      return;
    }


    const confirmed =
      confirm(
        "未保存の変更をすべて元に戻しますか？"
      );


    if (!confirmed) {
      return;
    }


    applyData(
      originalData
    );


    markSaved();

    showToast(
      "変更を元に戻しました"
    );

  }


  function setupSaveButtons() {

    saveButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          saveData
        );

      }
    );


    resetButton?.addEventListener(
      "click",
      resetData
    );

  }


  function setupLogout() {

    logoutButton?.addEventListener(
      "click",
      () => {

        if (
          dirty &&
          !confirm(
            "未保存の変更があります。\nログアウトしますか？"
          )
        ) {
          return;
        }


        sessionStorage.removeItem(
          "maru_admin_token"
        );

        sessionStorage.removeItem(
          "maru_admin_expires"
        );


        window.location.replace(
          "./"
        );

      }
    );

  }


  function setupKeyboardShortcut() {

    document.addEventListener(
      "keydown",
      event => {

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

  }


  window.addEventListener(
    "beforeunload",
    event => {

      if (!dirty) {
        return;
      }

      event.preventDefault();

      event.returnValue = "";

    }
  );


  setupNavigation();
  setupFieldListeners();
  setupSaveButtons();
  setupLogout();
  setupKeyboardShortcut();

  loadData();

})();
