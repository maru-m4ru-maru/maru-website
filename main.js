(() => {
  "use strict";

  console.log("[Maru Website] Loaded");

  const year =
    new Date().getFullYear();

  const footer =
    document.querySelector(".footer-bottom");

  if (footer) {
    footer.textContent =
      `© ${year} maru_m4ru_maru`;
  }
})();
