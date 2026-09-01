(() => {
  "use strict";

  const DATA_URL = "./site-data.json";

  const AVATAR_URL =
    "https://uploads.scratch.mit.edu/get_image/user/175225580_60x60.png";


  async function loadSiteData() {
    try {
      const response = await fetch(
        `${DATA_URL}?cb=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `site-data.json の読み込みに失敗しました: HTTP ${response.status}`
        );
      }

      const data = await response.json();

      applySiteData(data);

      console.log(
        "[Maru Website] site-data.json を読み込みました",
        data
      );

    } catch (error) {

      console.error(
        "[Maru Website]",
        error
      );

    }
  }


  function applySiteData(data) {

    setText(
      "[data-site-name]",
      data.siteName
    );


    setText(
      "[data-tagline]",
      data.tagline
    );


    setText(
      "[data-description]",
      data.description
    );


    setText(
      "[data-addons-version]",
      `v${data.addonsVersion}`
    );


    setText(
      "[data-addons-update]",
      data.addonsUpdate
    );


    setText(
      "[data-update-date]",
      data.updateDate
    );


    document
      .querySelectorAll("[data-avatar]")
      .forEach(element => {

        element.src = AVATAR_URL;

      });


    const updateTime =
      document.querySelector(
        "[data-update-date]"
      );


    if (updateTime) {
      updateTime.setAttribute(
        "datetime",
        convertDate(data.updateDate)
      );
    }


    document.title =
      `${data.siteName} - Official Website`;
  }


  function setText(
    selector,
    value
  ) {

    if (
      typeof value !== "string"
    ) {
      return;
    }


    document
      .querySelectorAll(selector)
      .forEach(element => {

        element.textContent =
          value;

      });
  }


  function convertDate(value) {

    if (
      typeof value !== "string"
    ) {
      return "";
    }


    const match =
      value.match(
        /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/
      );


    if (!match) {
      return "";
    }


    const year =
      match[1];

    const month =
      match[2].padStart(2, "0");

    const day =
      match[3].padStart(2, "0");


    return `${year}-${month}-${day}`;
  }


  function setupCurrentYear() {

    const elements =
      document.querySelectorAll(
        "[data-current-year]"
      );


    const year =
      new Date().getFullYear();


    elements.forEach(
      element => {

        element.textContent =
          `© ${year} maru_m4ru_maru`;

      }
    );
  }


  loadSiteData();

  setupCurrentYear();

})();
