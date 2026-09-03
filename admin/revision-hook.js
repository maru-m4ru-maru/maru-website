(function () {
  "use strict";
  const button = document.getElementById("saveButton");
  if (!button) return;
  button.addEventListener("click", () => {
    try {
      if (window.CMS_PRO && typeof window.CMS_PRO.captureRevision === "function" && typeof siteData !== "undefined" && typeof savedSnapshot !== "undefined") {
        const current = JSON.stringify(siteData);
        const saved = JSON.stringify(savedSnapshot);
        if (current !== saved) window.CMS_PRO.captureRevision("公開保存");
      }
    } catch (error) {
      console.warn("[Maru CMS] revision hook error", error);
    }
  }, true);
})();