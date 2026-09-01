(() => {
  "use strict";

  const THEME_KEY = "maru-website-theme";

  const body = document.body;
  const themeButton = document.getElementById("theme-toggle");

  function applyTheme(theme) {
    if (theme === "light") {
      body.classList.add("light");

      if (themeButton) {
        themeButton.textContent = "☾";
      }
    } else {
      body.classList.remove("light");

      if (themeButton) {
        themeButton.textContent = "☀";
      }
    }
  }

  function getInitialTheme() {
    const savedTheme =
      localStorage.getItem(THEME_KEY);

    if (savedTheme === "light") {
      return "light";
    }

    if (savedTheme === "dark") {
      return "dark";
    }

    return "dark";
  }

  function toggleTheme() {
    const nextTheme =
      body.classList.contains("light")
        ? "dark"
        : "light";

    applyTheme(nextTheme);

    localStorage.setItem(
      THEME_KEY,
      nextTheme
    );
  }

  if (themeButton) {
    themeButton.addEventListener(
      "click",
      toggleTheme
    );
  }

  applyTheme(getInitialTheme());


  /*
   * フェードイン
   */

  const observer =
    new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          entry.target.classList.add(
            "is-visible"
          );

          observer.unobserve(
            entry.target
          );
        }
      },
      {
        threshold: 0.08
      }
    );

  const animatedElements =
    document.querySelectorAll(
      ".section, .project-card, .update-item, .cta-box"
    );

  animatedElements.forEach(element => {
    observer.observe(element);
  });


  /*
   * ヘッダーのスクロール状態
   */

  const header =
    document.querySelector(".header");

  function updateHeader() {
    if (!header) return;

    if (window.scrollY > 20) {
      header.classList.add(
        "scrolled"
      );
    } else {
      header.classList.remove(
        "scrolled"
      );
    }
  }

  window.addEventListener(
    "scroll",
    updateHeader,
    {
      passive: true
    }
  );

  updateHeader();


  /*
   * 年を自動更新
   */

  document
    .querySelectorAll(
      ".footer-bottom span:first-child"
    )
    .forEach(element => {
      const year =
        new Date().getFullYear();

      element.textContent =
        `© ${year} Maru`;
    });


  console.log(
    "[Maru Website] Ready"
  );
})();
