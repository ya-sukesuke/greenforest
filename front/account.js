const favoriteContainer = document.getElementById("favoriteContainer");
const emptyMessage = document.getElementById("emptyMessage");

/* =========================
   HTMLエスケープ
========================= */

function escapeHtml(s){
    if(!s) return '';

    return s.replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;');
}

/* =========================
   お気に入り取得
========================= */

function getFavorites(){
    return JSON.parse(localStorage.getItem("GoodProfiles")) || [];
}

/* =========================
   カード生成
========================= */

function createCard(profile, index){

    const card = document.createElement("div");
    card.className = "favorite-card";

    card.innerHTML = `
        <img class="favorite-image"
             src="${profile.image}"
             alt="animal image">

        <div class="favorite-content">

            <div class="favorite-kind">
                ${profile.type === "dog" ? "犬" : "猫"}
            </div>

            <div class="favorite-breed">
                ${escapeHtml(profile.breed || "種類不明")}
            </div>

            <div class="favorite-profile">
【名前】${escapeHtml(profile.name || "")}

【性別】${profile.gender === "male" ? "男の子" : "女の子"}

【年齢】${profile.age || 0}歳 ${profile.month || 0}ヶ月

【紹介文】
${escapeHtml(profile.bio || "")}
            </div>

        </div>

        <button class="remove-btn">
            お気に入り解除
        </button>
    `;

    /* =========================
       削除処理
    ========================= */

    const removeBtn = card.querySelector(".remove-btn");

    removeBtn.addEventListener("click", () => {

        let favorites = getFavorites();

        favorites.splice(index, 1);

        localStorage.setItem(
            "GoodProfiles",
            JSON.stringify(favorites)
        );

        renderFavorites();
    });

    return card;
}

/* =========================
   描画
========================= */

function renderFavorites(){

    favoriteContainer.innerHTML = "";

    const favorites = getFavorites();

    if(favorites.length === 0){

        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    favorites.forEach((profile, index) => {

        const card = createCard(profile, index);

        favoriteContainer.appendChild(card);

    });
}

/* =========================
   初期化
========================= */

renderFavorites();