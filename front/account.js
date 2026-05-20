const API_GET_URL = "/animals";
const API_FAVORITE_URL = "/favorites"; // ★お気に入り用のURLを追加

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
   ★修正：サーバーからお気に入りUUID一覧をまとめて取得する関数
   （全動物のチェックに使うため、サーバー側の全お気に入りリストを取得します）
========================= */
async function getFavoriteUUIDsFromServer() {
    try {
        // server.pyに追加したお気に入りデータから、現在登録されているすべてのUUIDを引っ張るために、
        // 全動物をループするか、直接お気に入り一覧が取れるエンドポイントを叩きます。
        // ここでは、各動物が登録されているか調べるために一度サーバー側の「お気に入り一覧」を
        // 取得するAPIとして `API_FAVORITE_URL` をGETで叩けるか、もしくは
        // allAnimalsを回して個別にチェックするかですが、効率化のため、
        // server.py側に全お気に入りリストを返すAPI（GET /favorites）を想定します。
        
        const response = await fetch(API_FAVORITE_URL);
        if (response.ok) {
            // 例: ["uuid1", "uuid2"] のような配列が返ってくる想定
            return await response.json(); 
        }
        return [];
    } catch (error) {
        console.error("お気に入り一覧の取得に失敗しました:", error);
        return [];
    }
}

/* =========================
   ★修正：お気に入り解除（サーバーと直接やり取り）
========================= */
async function removeFavorite(uuid){
    try {
        // サーバーに DELETE 要求を送信して削除
        const response = await fetch(`${API_FAVORITE_URL}/${uuid}`, {
            method: "DELETE"
        });

        if (response.ok) {
            alert("削除されました");
            // 削除が成功したら画面を再描画
            renderFavorites();
        } else {
            alert("削除に失敗しました");
        }
    } catch (error) {
        console.error("削除エラー:", error);
        alert("サーバーとの通信に失敗しました");
    }
}

/* =========================
   カード生成
========================= */
function createCard(profile){
    const card = document.createElement("div");
    card.className = "favorite-card";

    card.innerHTML = `
        <img class="favorite-image"
             src="${profile.image || ''}"
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
   ★修正：描画処理の非同期連携
========================= */
async function renderFavorites(){
    favoriteContainer.innerHTML = "";

    // サーバーからお気に入りUUID一覧を取得
    const favoriteUUIDs = await getFavoriteUUIDsFromServer();

    if(!favoriteUUIDs || favoriteUUIDs.length === 0){
        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    try {
        // すべての動物データを取得
        const response = await fetch(API_GET_URL);
        const allAnimals = await response.json();

        // サーバーから取得したUUID一覧に含まれる動物だけを抽出
        const favoriteAnimals = allAnimals.filter(animal =>
            favoriteUUIDs.includes(animal.uuid)
        );

        if (favoriteAnimals.length === 0) {
            emptyMessage.style.display = "block";
            return;
        }

        // カードを生成して画面に追加
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