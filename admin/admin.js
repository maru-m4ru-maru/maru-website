(() => {
  "use strict";

  const WORKER_URL =
    "https://maru-website-admin.maru-0727.workers.dev";

  const form =
    document.getElementById("login-form");

  const password1 =
    document.getElementById("password1");

  const password2 =
    document.getElementById("password2");

  const button =
    document.getElementById("login-button");

  const message =
    document.getElementById("message");

  form.addEventListener("submit", async event => {
    event.preventDefault();

    message.textContent = "";
    button.disabled = true;
    button.textContent = "確認中...";

    try {
      const response = await fetch(
        `${WORKER_URL}/admin/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            password1: password1.value,
            password2: password2.value
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "ログインに失敗しました"
        );
      }

      sessionStorage.setItem(
        "maru_admin_authenticated",
        "1"
      );

      window.location.href =
        "./panel.html";

    } catch (error) {
      console.error(
        "[Maru Admin]",
        error
      );

      message.textContent =
        error.message ||
        "ログインに失敗しました";

    } finally {
      button.disabled = false;
      button.textContent = "ログイン";
    }
  });
})();
