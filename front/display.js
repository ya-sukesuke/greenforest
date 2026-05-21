// 【重要】FastAPIサーバーのエンドポイントURL
const API_GET_URL = "/animals";
const API_FAVORITE_URL = "/favorites"; // ★お気に入り用のURLを追加

/* --- グローバル変数 --- */
let words = [];
let profiles = [];

const viewer = document.getElementById('viewer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const flipBtn = document.getElementById('flipBtn');
const saveBtn = document.getElementById('saveBtn');

let index = 0;
let currentCard = null;
let isAnimating = false;

/* --- HTML エスケープ --- */
function escapeHtml(s) {
    if (!s) return '';

    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* --- データ変換 --- */
function formatDataForDisplay(data) {
    return data.map(p => ({
        id: p.uuid,
        photo: p.image,
        // 前面で表示するために名前と年齢を個別に取り出す
        name: p.name || "不明",
        age: p.age || 0,
        month: p.month || 0,
        kind: p.type === "dog" ? "犬" : "猫",
        breed: p.breed || "",
        // plf は前面の名前・年齢を除いた詳細情報にする
        plf: `
【性別】${p.gender === "male" ? "男の子" : "女の子"}
【避妊・去勢】${p.sterilization === "done" ? "済" : "未"}
【緊張度】${p.tension || "不明"}
【病歴】${(p.diseases && p.diseases.length > 0) ? p.diseases.join(" / ") : "特になし"}
【推定誕生日】${p.birthday || "不明"}
【保護日】${p.protect_day || "不明"}
【紹介文】${p.bio || ""}
`.trim()
    }));
}

/* --- カード作成 --- */
function makeCard(item, pos = '') {
    const c = document.createElement('div');
    c.className = `card ${pos}`;

    /* --- 画像 --- */
    const img = document.createElement('img');
    img.className = 'photo';
    img.src = item.photo || "";
    img.alt = escapeHtml(item.kind);

    img.onerror = () => {
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E画像なし%3C/text%3E%3C/svg%3E';
    };

    /* --- 表面 --- */
    const frontDiv = document.createElement('div');
    frontDiv.className = 'inner front';

    // 表面には名前と年齢のみ表示（画像は任意で表示）
    frontDiv.appendChild(img);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    nameDiv.textContent = item.name || '不明';
    frontDiv.appendChild(nameDiv);

    // 種類（犬／猫）を表面に表示
    const kindFrontDiv = document.createElement('div');
    kindFrontDiv.className = 'kind';
    kindFrontDiv.textContent = item.kind;
    frontDiv.appendChild(kindFrontDiv);

    const ageDiv = document.createElement('div');
    ageDiv.className = 'age';
    ageDiv.textContent = `${item.age || 0}歳 ${item.month || 0}ヶ月`;
    frontDiv.appendChild(ageDiv);

    /* --- 裏面 --- */
    const backDiv = document.createElement('div');
    backDiv.className = 'inner back';

    const idDivBack = document.createElement('div');
    idDivBack.className = 'id';
    idDivBack.textContent = `UUID: ${item.id}`;
    backDiv.appendChild(idDivBack);

    // 裏面の種類表示は不要になったため削除

    const breedDivBack = document.createElement('div');
    breedDivBack.className = 'breed';
    breedDivBack.textContent = item.breed;
    backDiv.appendChild(breedDivBack);

    const plfDiv = document.createElement('div');
    plfDiv.className = 'plf';
    plfDiv.innerHTML = escapeHtml(item.plf).replace(/\n/g, "<br>");
    backDiv.appendChild(plfDiv);

    c.appendChild(frontDiv);
    c.appendChild(backDiv);

    c.addEventListener('click', () => {
        flip(c);
    });

    return c;
}

/* --- ★修正：サーバーと直接通信してお気に入り登録/解除を行う関数 --- */
async function toggleFavorite(profile) {
    if (!profile || !profile.uuid) return;

    try {
        // 現在アクティブ（色反転）状態かで処理を切り替える
        const isCurrentlySaved = saveBtn.classList.contains('active');

        if (!isCurrentlySaved) {
            /* --- 登録要求 (POST) --- */
            const response = await fetch(API_FAVORITE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ uuid: profile.uuid })
            });

            if (response.ok) {
                saveBtn.classList.add('active'); // 色を反転
                //alert("登録しました");
            } else {
                //alert("登録に失敗しました");
            }
        } else {
            /* --- 削除要求 (DELETE) --- */
            const response = await fetch(`${API_FAVORITE_URL}/${profile.uuid}`, {
                method: "DELETE"
            });

            if (response.ok) {
                saveBtn.classList.remove('active'); // 色を戻す
                //alert("削除されました");
            } else {
                //alert("削除に失敗しました");
            }
        }
    } catch (error) {
        console.error("Favorite Error:", error);
        alert("サーバーとの通信に失敗しました");
    }
}

/* --- ★修正：サーバーから現在のお気に入り状態を取得してUIに反映する関数 --- */
async function updateSaveButtonState() {
    if (!profiles || !profiles[index]) return;

    const currentProfileData = profiles[index];

    try {
        // サーバーに現在のUUIDがお気に入りか問い合わせ (GET /favorites/{uuid})
        const response = await fetch(`${API_FAVORITE_URL}/${currentProfileData.uuid}`);
        
        if (response.ok) {
            const result = await response.json();
            // サーバー側から返ってきた成否フラグ（例: result.is_favorite）を評価
            if (result.is_favorite) {
                saveBtn.classList.add('active');
            } else {
                saveBtn.classList.remove('active');
            }
        } else {
            saveBtn.classList.remove('active');
        }
    } catch (error) {
        console.error("Check Favorite Error:", error);
        saveBtn.classList.remove('active'); // 通信エラー時は安全のため外す
    }
}

/* --- 初期表示 --- */
function renderInitial() {
    if (words.length === 0) return;

    viewer.innerHTML = "";
    const card = makeCard(words[index]);
    card.classList.add('current', 'enter');
    viewer.appendChild(card);
    currentCard = card;

    updateButtons();
    updateSaveButtonState(); // 初期表示時にお気に入り状態を反映
}

/* --- カード切り替え --- */
function changeCard(newIndex, outClass, inClass) {
    if (isAnimating) return;
    isAnimating = true;

    const newCard = makeCard(words[newIndex], inClass);

    requestAnimationFrame(() => {
        currentCard.classList.add(outClass);
        viewer.appendChild(newCard);
        newCard.classList.add('enter');
    });

    setTimeout(() => {
        currentCard.remove();
        newCard.classList.remove(inClass, 'enter');
        newCard.classList.add('current');
        currentCard = newCard;
        index = newIndex;
        isAnimating = false;

        updateButtons();
        updateSaveButtonState(); // カード変更時にお気に入り状態を反映
    }, 520);
}

/* --- 次へ --- */
function goNext() {
    if (words.length === 0) return;

    if (index >= words.length - 1) {
        changeCard(0, 'to-left', 'from-right');
    } else {
        changeCard(index + 1, 'to-left', 'from-right');
    }
}

/* --- 前へ --- */
function goPrev() {
    if (words.length === 0) return;

    if (index <= 0) {
        changeCard(words.length - 1, 'to-right', 'from-left');
    } else {
        changeCard(index - 1, 'to-right', 'from-left');
    }
}

/* --- カード反転 --- */
function flip(card) {
    if (!card) return;
    card.classList.toggle('flipped');
}

/* --- ボタン更新 --- */
function updateButtons() {
    // 必要ならここに追加
}

/* --- お気に入りボタンのクリック --- */
saveBtn.addEventListener('click', async () => {
    if (!profiles || !profiles[index]) return;

    const currentProfileData = profiles[index];

    // 非同期通信中の二重送信防止
    saveBtn.disabled = true;
    await toggleFavorite(currentProfileData);
    saveBtn.disabled = false;
});

/* --- ナビゲーションボタン --- */
nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);
flipBtn.addEventListener('click', () => {
    flip(currentCard);
});

/* --- キーボード操作 --- */
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
        goPrev();
    } else if (e.key === 'ArrowRight') {
        goNext();
    } else if (e.key === ' ') {
        e.preventDefault();
        flip(currentCard);
    }
});

/* --- FastAPIから取得 --- */
async function fetchAnimals() {
    try {
        let data = [];

        /* --- localStorage から取得 --- */
        const localData = localStorage.getItem("animalData");
        if (localData) {
            const parsed = JSON.parse(localData);
            data.push({
                uuid: "local-" + Date.now(),
                ...parsed
            });
        }

        /* --- FastAPI から取得 --- */
        const response = await fetch(API_GET_URL);
        if (response.ok) {
            const apiData = await response.json();
            data = data.concat(apiData);
        }

        profiles = data;
        words = formatDataForDisplay(data);

        if (words.length > 0) {
            renderInitial();
        } else {
            viewer.innerHTML = "<p>登録されている動物がいません。</p>";
        }

    } catch (error) {
        console.error("Error:", error);
        viewer.innerHTML = "<p>データ取得に失敗しました。</p>";
    }
}

/* --- 起動 --- */
fetchAnimals();