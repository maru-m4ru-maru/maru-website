const WORKER_URL =
  "https://maru-website-admin.maru-0727.workers.dev";

const LOGIN_ENDPOINT =
  `${WORKER_URL}/admin/login`;


const loginForm =
  document.getElementById(
    "loginForm"
  );

const loginButton =
  document.getElementById(
    "loginButton"
  );

const loginMessage =
  document.getElementById(
    "loginMessage"
  );


/* =========================
   表示
========================= */

function setMessage(
  message,
  type = ""
) {

  loginMessage.textContent =
    message;

  loginMessage.className =
    `message ${type}`;

}


/* =========================
   既存セッション確認
========================= */

function hasValidSession() {

  const token =
    sessionStorage.getItem(
      "maru_admin_token"
    );

  const expires =
    Number(
      sessionStorage.getItem(
        "maru_admin_expires"
      ) || 0
    );


  if (!token) {
    return false;
  }


  if (!expires) {
    return false;
  }


  if (
    Date.now() >=
    expires
  ) {

    sessionStorage.removeItem(
      "maru_admin_token"
    );

    sessionStorage.removeItem(
      "maru_admin_expires"
    );

    return false;

  }


  return true;

}


/* =========================
   すでにログイン済みなら
   パネルへ
========================= */

if (hasValidSession()) {

  window.location.replace(
    "./panel.html"
  );

}


/* =========================
   ログイン
========================= */

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const password1 =
      document.getElementById(
        "password1"
      ).value;

    const password2 =
      document.getElementById(
        "password2"
      ).value;


    if (!password1 || !password2) {

      setMessage(
        "2つのパスワードを入力してください。",
        "error"
      );

      return;

    }


    loginButton.disabled =
      true;

    loginButton.textContent =
      "認証中...";

    setMessage("");


    try {

      const response =
        await fetch(
          LOGIN_ENDPOINT,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              password1,
              password2
            })
          }
        );


      let result = null;


      try {

        result =
          await response.json();

      } catch {

        result = null;

      }


      if (!response.ok) {

        const message =
          result?.message ||
          result?.error ||
          `認証に失敗しました (HTTP ${response.status})`;

        throw new Error(
          message
        );

      }


      /*
        Workerから返ってくる想定:

        {
          success: true,
          token: "...",
          expiresAt: 1234567890
        }
      */

      const token =
        result?.token;

      const expiresAt =
        Number(
          result?.expiresAt || 0
        );


      if (!token) {

        throw new Error(
          "認証トークンを取得できませんでした。"
        );

      }


      /*
        expiresAtがWorkerから
        返ってこない場合は安全のため
        ログインを完了しない。
      */

      if (!expiresAt) {

        throw new Error(
          "セッション有効期限を取得できませんでした。"
        );

      }


      /*
        期限切れトークンは保存しない
      */

      if (
        Date.now() >=
        expiresAt
      ) {

        throw new Error(
          "取得したセッションがすでに期限切れです。"
        );

      }


      /*
        セッション保存
      */

      sessionStorage.setItem(
        "maru_admin_token",
        token
      );


      sessionStorage.setItem(
        "maru_admin_expires",
        String(expiresAt)
      );


      setMessage(
        "認証しました。管理画面を開いています...",
        "success"
      );


      /*
        replaceを使うことで、
        戻るボタンでログイン画面に
        戻りにくくする。
      */

      window.location.replace(
        "./panel.html"
      );


    } catch (error) {

      console.error(
        "[maru-admin] login failed",
        error
      );


      /*
        ログイン失敗時は
        古いセッションを消しておく。
      */

      sessionStorage.removeItem(
        "maru_admin_token"
      );

      sessionStorage.removeItem(
        "maru_admin_expires"
      );


      setMessage(
        error?.message ||
          "ログインに失敗しました。",
        "error"
      );


    } finally {

      loginButton.disabled =
        false;

      loginButton.textContent =
        "ログイン";

    }

  }
);


/* =========================
   Enterでログイン
========================= */

document
  .getElementById(
    "password2"
  )
  .addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        loginForm.requestSubmit();

      }

    }
  );
