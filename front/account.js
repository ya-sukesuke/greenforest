const API_GET_URL = "/animals";

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
   UUID一覧取得
========================= */

function getFavoriteUUIDs(){

    return JSON.parse(
        localStorage.getItem("GoodProfiles")
    ) || [];
}

/* =========================
   お気に入り解除
========================= */

function removeFavorite(uuid){

    let favorites = getFavoriteUUIDs();

    favorites = favorites.filter(id => id !== uuid);

    localStorage.setItem(
        "GoodProfiles",
        JSON.stringify(favorites)
    );

    renderFavorites();
}

/* =========================
   カード生成
========================= */

function createCard(profile){

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

    const removeBtn = card.querySelector(".remove-btn");

    removeBtn.addEventListener("click", () => {

        removeFavorite(profile.uuid);

    });

    return card;
}

/* =========================
   描画
========================= */

async function renderFavorites(){

    favoriteContainer.innerHTML = "";

    const favoriteUUIDs = getFavoriteUUIDs();

    if(favoriteUUIDs.length === 0){

        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    try {

        const response = await fetch(API_GET_URL);

        const allAnimals = await response.json();

        // UUID一致だけ抽出
        const favoriteAnimals = allAnimals.filter(animal =>
            favoriteUUIDs.includes(animal.uuid)
        );

        favoriteAnimals.forEach(profile => {

            const card = createCard(profile);

            favoriteContainer.appendChild(card);

        });

    } catch(error){

        console.error(error);
    }
}

/* =========================
   初期化
========================= */

renderFavorites();