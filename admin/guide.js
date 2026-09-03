(function () {
  "use strict";

  const guideData = {
    start: {
      label: "はじめに",
      title: "コードを書かなくても、このサイトは作れます。",
      intro: "この管理パネルでは、文章・画像・リンク・ページを入力するだけでサイトを編集できます。HTMLが分からなくても大丈夫です。<code>&lt;p&gt;text&lt;/p&gt;</code> のようなコードは、ここでは基本的に使いません。",
      steps: [
        ["1", "内容を入力", "名前・説明・URLなどをフォームに入力します。"],
        ["2", "右側で確認", "ライブプレビューを見ながら、見た目をチェックします。"],
        ["3", "保存する", "右上の「保存する」を押すと、サイトのデータが更新されます。"]
      ]
    },
    pages: {
      label: "ページを作る",
      title: "新しいページを3ステップで作ろう",
      intro: "「ページ」は、ホームとは別のページです。プロフィール、作品紹介、About、連絡先などに使えます。",
      steps: [
        ["1", "＋ 新しいページ", "「ページ」を開いて、新しいページを作ります。最初は「下書き」で作るので安心です。"],
        ["2", "ブロックを追加", "文章、画像、ボタン、Projects、Updatesなどを上から順番に追加します。ドラッグでも並べ替えできます。"],
        ["3", "公開", "内容を確認したら「公開」に切り替えます。ナビゲーション表示をONにすると、サイトのメニューにも出せます。"]
      ]
    },
    content: {
      label: "内容を編集",
      title: "どこを編集すれば何が変わる？",
      intro: "迷ったら、まずこの対応表を見ればOKです。",
      steps: [
        ["サイト", "サイト名・説明・アイコン", "サイト全体のプロフィール情報を変えます。"],
        ["プロジェクト", "作品カード", "作品名、説明、リンクなどを編集します。"],
        ["更新情報", "お知らせ・変更履歴", "新しい出来事を時系列で追加します。"],
        ["リンク", "SNSや外部サイト", "Scratch、GitHubなどへのリンクを管理します。"],
        ["埋め込み", "外部コンテンツ", "対応している外部コンテンツをページに表示します。"],
        ["セクション", "ホームの並び順", "ホームページのどのブロックを表示するか決めます。"]
      ]
    },
    design: {
      label: "見た目を変える",
      title: "色や余白も、コードなしで変更できます。",
      intro: "「デザイン」では、アクセント色・背景・カード・文字・角丸・最大幅などを調整できます。",
      steps: [
        ["アクセント", "ボタンなどの主役の色", "サイトの印象を決めるメインカラーです。"],
        ["背景 / Surface", "ページとカードの背景", "明るさやコントラストを調整します。"],
        ["角丸", "カードやボタンの丸み", "小さくするとシャープ、大きくすると柔らかい印象になります。"],
        ["最大幅", "コンテンツの横幅", "数字が大きいほど、画面いっぱいに広く表示されます。"]
      ]
    },
    save: {
      label: "保存と復元",
      title: "怖がらなくてOK。下書き機能があります。",
      intro: "編集中の内容はブラウザ側にも下書きとして保存されます。大きな変更をする前に、まず落ち着いて編集しましょう。",
      steps: [
        ["未保存", "まだ本番データに反映されていない", "右上に「未保存」と出ているときは、保存前です。"],
        ["保存する", "本番データへ反映", "問題がないことを確認してから押します。"],
        ["履歴", "過去の保存状態", "履歴画面では保存した状態を確認・復元できます。"],
        ["Undo / Redo", "直前の編集を戻す", "うっかり変更しても、元に戻せる操作があります。"]
      ]
    },
    trouble: {
      label: "困ったとき",
      title: "エラーかな？ まずここを確認",
      intro: "難しいコードを触る前に、次の順番で確認すると大抵の問題は見つかります。",
      steps: [
        ["①", "文字が変わらない", "入力後に「未保存」になったか確認し、最後に「保存する」を押します。"],
        ["②", "ページが見えない", "ページが「公開」になっているか、セクションが「表示中」か確認します。"],
        ["③", "メニューにない", "ページ設定の「ナビゲーションに表示する」をONにします。"],
        ["④", "怖くなった", "変更を保存する前なら、Undoや下書きで戻せます。大きな変更は一気に保存しないのがコツです。"]
      ]
    }
  };

  const helpModal = document.getElementById("helpModal");
  const helpButton = document.getElementById("helpButton");
  const closeButton = document.getElementById("closeHelpButton");
  if (!helpModal || !helpButton) return;

  const card = helpModal.querySelector(".modal-card");
  const backdrop = helpModal.querySelector(".modal-backdrop");
  let activeKey = "start";

  function renderGuide(key) {
    activeKey = guideData[key] ? key : "start";
    const current = guideData[activeKey];
    card.innerHTML = `
      <div class="beginner-guide-head">
        <div>
          <span class="modal-kicker">MARU ADMIN • BEGINNER GUIDE</span>
          <h2>操作説明</h2>
          <p>「何を押せばいい？」から始める人向けのやさしいガイドです。</p>
        </div>
        <button id="closeGuide" class="icon-button" type="button" aria-label="閉じる">×</button>
      </div>
      <div class="beginner-guide-body">
        <div class="guide-tabs">
          ${Object.entries(guideData).map(([key, item]) => `<button class="guide-tab ${key === activeKey ? "is-active" : ""}" data-guide="${key}" type="button">${item.label}</button>`).join("")}
        </div>
        <section class="guide-hero">
          <span class="guide-eyebrow">${current.label}</span>
          <h3>${current.title}</h3>
          <p>${current.intro}</p>
        </section>
        <div class="guide-step-grid">
          ${current.steps.map((step, index) => {
            const [a, b, c] = step;
            return `<article class="guide-card"><div class="guide-step-number">${escapeHtml(a)}</div><div><strong>${escapeHtml(b)}</strong><p>${c}</p></div></article>`;
          }).join("")}
        </div>
        <div class="guide-tip"><strong>💡 覚えておくのは3つだけ</strong><span>入力する → プレビューを見る → 保存する</span></div>
      </div>
    `;

    card.querySelectorAll("[data-guide]").forEach(button => {
      button.addEventListener("click", () => renderGuide(button.dataset.guide));
    });
    card.querySelector("#closeGuide")?.addEventListener("click", closeGuide);
  }

  function openGuide() {
    renderGuide(activeKey);
    helpModal.classList.remove("hidden");
  }

  function closeGuide() {
    helpModal.classList.add("hidden");
  }

  helpButton.addEventListener("click", openGuide);
  closeButton?.addEventListener("click", closeGuide);
  backdrop?.addEventListener("click", closeGuide);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !helpModal.classList.contains("hidden")) closeGuide();
  });
})();
