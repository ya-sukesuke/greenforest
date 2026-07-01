const API_GET_URL = "/animals";
const STORAGE_FAVORITE_KEY = "favorites"; // ローカルストレージのお気に入りキー

const favoriteContainer = document.getElementById("favoriteContainer");
const emptyMessage = document.getElementById("emptyMessage");

/* =========================
   HTMLエスケープ
========================= */
function escapeHtml(s){
    if(!s) return '';
    return String(s).replace(/&/g,'&amp;')
                    .replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;')
                    .replace(/"/g,'&quot;');
}

/* =========================
   ★修正：ローカルストレージからお気に入りUUID一覧をまとめて取得する関数
========================= */
async function getFavoriteUUIDsFromStorage() {
    try {
        const favs = localStorage.getItem(STORAGE_FAVORITE_KEY);
        return favs ? JSON.parse(favs) : [];
    } catch (error) {
        console.error("お気に入り一覧の取得に失敗しました:", error);
        return [];
    }
}

/* =========================
   ★修正：お気に入り解除（ローカルストレージから削除）
========================= */
async function removeFavorite(uuid){
    try {
        const favs = localStorage.getItem(STORAGE_FAVORITE_KEY);
        let favorites = favs ? JSON.parse(favs) : [];
        favorites = favorites.filter(id => id !== uuid);
        localStorage.setItem(STORAGE_FAVORITE_KEY, JSON.stringify(favorites));

        alert("削除されました");
        // 削除が成功したら、画面上の該当カードを再描画（リロードなしで反映）
        renderFavorites();
    } catch (error) {
        console.error("削除エラー:", error);
        alert("削除に失敗しました");
    }
}

/* =========================
   カード生成
========================= */
function createCard(profile){
    const card = document.createElement("div");
    card.className = "favorite-card";

    let ageStr = "不詳";
    if (profile.age !== undefined && profile.age !== null && profile.age !== -1 && profile.age !== "-1") {
        const ageNum = parseInt(profile.age, 10);
        if (!isNaN(ageNum)) {
            ageStr = `${ageNum}歳`;
            if (profile.is_estimated) {
                ageStr += "（推定）";
            }
        }
    }

    const diseaseList = [];
    if (profile.diseases && profile.diseases.length > 0) {
        profile.diseases.forEach(d => {
            if (d && d !== 'other') {
                diseaseList.push(d);
            }
        });
    }
    if (profile.other_disease) {
        diseaseList.push(profile.other_disease);
    }
    const diseaseStr = diseaseList.length > 0 ? diseaseList.join(" / ") : "特になし";

    card.innerHTML = `
        <img class="favorite-image"
             src="${profile.image || ''}"
             alt="animal image">
        <div class="favorite-content">
            <div class="favorite-kind">
                ${escapeHtml(profile.name || "名前不明")}
            </div>
            <div class="favorite-breed">
                ${escapeHtml(profile.coat_color || profile.breed || "毛色不明")}
            </div>
            <div class="favorite-profile">
【名前】${escapeHtml(profile.name || "")}
【性別】${profile.gender === "male" ? "男の子" : "女の子"}
【年齢】${ageStr}
【避妊・去勢】${profile.sterilization === "done" || profile.operated === "done" ? "済" : "未"}
【病気】
${escapeHtml(diseaseStr)}
【性格】
${escapeHtml(profile.personality || profile.bio || "")}
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
   ★修正：描画処理の非同期連携
========================= */
async function renderFavorites(){
    favoriteContainer.innerHTML = "";

    // 1. ローカルストレージからお気に入り登録されているUUID一覧を取得
    const favoriteUUIDs = await getFavoriteUUIDsFromStorage();

    if(!favoriteUUIDs || favoriteUUIDs.length === 0){
        emptyMessage.style.display = "block";
        return;
    }

    try {
        // 2. すべての動物データをサーバーから取得
        const response = await fetch(API_GET_URL);
        const allAnimals = await response.json();

        // 3. 全データの中から、お気に入りUUIDが含まれている動物だけをフィルタリング
        const favoriteAnimals = allAnimals.filter(animal =>
            favoriteUUIDs.includes(animal.uuid)
        );

        // クリーンアップ：サーバー上にすでに存在しない動物のUUIDがお気に入りにある場合、ローカルストレージから削除する
        const allAnimalUUIDs = allAnimals.map(animal => animal.uuid);
        const validFavoriteUUIDs = favoriteUUIDs.filter(uuid => allAnimalUUIDs.includes(uuid));
        if (validFavoriteUUIDs.length !== favoriteUUIDs.length) {
            localStorage.setItem(STORAGE_FAVORITE_KEY, JSON.stringify(validFavoriteUUIDs));
        }

        if (favoriteAnimals.length === 0) {
            emptyMessage.style.display = "block";
            return;
        }

        emptyMessage.style.display = "none";

        // 4. マッチした動物のカードを画面に生成
        favoriteAnimals.forEach(profile => {
            const card = createCard(profile);
            favoriteContainer.appendChild(card);
        });

    } catch(error){
        console.error("データの描画中にエラーが発生しました:", error);
        emptyMessage.style.display = "block";
    }
}

/* =========================
   初期化
========================= */
renderFavorites();