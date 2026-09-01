const SITE_DATA_URL = "./site-data.json";

const DEFAULT_AVATAR =
  "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";


function setText(selector, value) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((element) => {
    element.textContent = value;
  });
}


function setAttribute(selector, attribute, value) {
  const elements = document.querySelectorAll(selector);

  elements.forEach((element) => {
    element.setAttribute(attribute, value);
  });
}


function normalizeVersion(version) {
  if (!version) {
    return "";
  }

  const value = String(version).trim();

  if (value.startsWith("v")) {
    return value;
  }

  return `v${value}`;
}


async function loadSiteData() {
  try {
    const cacheBuster = `cb=${Date.now()}`;

    const response = await fetch(
      `${SITE_DATA_URL}?${cacheBuster}`,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `site-data.json returned ${response.status}`
      );
    }

    const data = await response.json();

    const siteName =
      data.siteName ||
      "maru_m4ru_maru";

    const tagline =
      data.tagline ||
      "ScratchやWebを、もっと便利に。";

    const description =
      data.description ||
      "maru_m4ru_maru が制作しているツール・サービス・プロジェクトを紹介しています。";

    const addonsVersion =
      normalizeVersion(data.addonsVersion) ||
      "v1.4.5";

    const addonsUpdate =
      data.addonsUpdate ||
      "最新アップデート情報";

    const updateDate =
      data.updateDate ||
      "—";


    /* =========================
       BASIC SITE DATA
    ========================== */

    setText("[data-site-name]", siteName);

    setText("[data-tagline]", tagline);

    setText("[data-description]", description);

    setText(
      "[data-addons-version]",
      addonsVersion
    );

    setText(
      "[data-addons-update]",
      addonsUpdate
    );

    setText(
      "[data-update-date]",
      updateDate
    );


    /* =========================
       AVATAR
    ========================== */

    setAttribute(
      "[data-avatar]",
      "src",
      DEFAULT_AVATAR
    );


    setAttribute(
      "[data-avatar]",
      "alt",
      siteName
    );


    /* =========================
       PAGE TITLE
    ========================== */

    document.title =
      `${siteName} - Official Website`;


    /* =========================
       META DESCRIPTION
    ========================== */

    const metaDescription =
      document.querySelector(
        'meta[name="description"]'
      );

    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        description
      );
    }


    console.log(
      "[maru-website] site data loaded",
      data
    );

  } catch (error) {

    console.warn(
      "[maru-website] Failed to load site-data.json",
      error
    );

    /*
      固定のHTML内容をそのまま使用するため、
      エラーでもページ自体は表示されます。
    */
  }
}


/* =========================
   CURRENT YEAR
========================= */

function setCurrentYear() {
  setText(
    "[data-current-year]",
    new Date().getFullYear()
  );
}


/* =========================
   LINK BEHAVIOR
========================= */

function setupSmoothLinks() {
  const links =
    document.querySelectorAll(
      'a[href^="#"]'
    );

  links.forEach((link) => {

    link.addEventListener(
      "click",
      (event) => {

        const targetId =
          link.getAttribute("href");

        if (!targetId || targetId === "#") {
          return;
        }

        const target =
          document.querySelector(targetId);

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

  });
}


/* =========================
   SUBTLE REVEAL
========================= */

function setupReveal() {
  const elements =
    document.querySelectorAll(
      ".stat-card, .project-card, .featured-card, .update-card, .github-card"
    );

  if (!("IntersectionObserver" in window)) {
    return;
  }

  elements.forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(10px)";
    element.style.transition =
      "opacity 0.45s ease, transform 0.45s ease";
  });


  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) {
            return;
          }

          entry.target.style.opacity = "1";
          entry.target.style.transform =
            "translateY(0)";

          observer.unobserve(entry.target);

        });

      },
      {
        threshold: 0.08
      }
    );


  elements.forEach((element) => {
    observer.observe(element);
  });
}


/* =========================
   IMAGE FALLBACK
========================= */

function setupImageFallback() {
  const avatars =
    document.querySelectorAll(
      "[data-avatar]"
    );

  avatars.forEach((avatar) => {

    avatar.addEventListener(
      "error",
      () => {

        /*
          画像が読み込めない場合の
          最低限のフォールバック。
        */

        avatar.removeAttribute("src");

        avatar.style.background =
          "#e8ebef";

      },
      {
        once: true
      }
    );

  });
}


/* =========================
   INIT
========================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setCurrentYear();

    setupSmoothLinks();

    setupReveal();

    setupImageFallback();

    await loadSiteData();

  }
);
