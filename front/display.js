// 【重要】FastAPIサーバーの GET エンドポイントURL
const API_GET_URL = "/animals";
// ローカルストレージのお気に入りキー
const STORAGE_FAVORITE_KEY = "favorites";

function getFavoritesFromStorage() {
    try {
        const favs = localStorage.getItem(STORAGE_FAVORITE_KEY);
        return favs ? JSON.parse(favs) : [];
    } catch (e) {
        console.error("Failed to load favorites from localStorage", e);
        return [];
    }
}

function saveFavoritesToStorage(favorites) {
    try {
        localStorage.setItem(STORAGE_FAVORITE_KEY, JSON.stringify(favorites));
    } catch (e) {
        console.error("Failed to save favorites to localStorage", e);
    }
}

// ================================
// グローバル変数
// ================================
let words = [];
let profiles = [];

let index = 0;
let currentCard = null;

// ================================
// 要素取得
// ================================
const viewer = document.getElementById('viewer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const flipBtn = document.getElementById('flipBtn');

// 公式LINEのアカウントIDを設定してください（例: @greenforest）
const LINE_OFFICIAL_ACCOUNT_ID = "@889qbfcv";

// ================================
// HTMLエスケープ
// ================================
function escapeHtml(s){
    if(!s) return '';
    return String(s).replace(/&/g,'&amp;')
                    .replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;')
                    .replace(/"/g,'&quot;');
}

/* --- データ変換 --- */
function formatDataForDisplay(data) {
    return data.map(p => {
        let ageStr = "不詳";
        if (p.age !== undefined && p.age !== null && p.age !== -1 && p.age !== "-1") {
            const ageNum = parseInt(p.age, 10);
            if (!isNaN(ageNum)) {
                ageStr = `${ageNum}歳`;
                if (p.is_estimated) {
                    ageStr += "（推定）";
                }
            }
        }

        const diseaseList = [];
        if (p.diseases && p.diseases.length > 0) {
            p.diseases.forEach(d => {
                if (d && d !== "other") {
                    diseaseList.push(d);
                }
            });
        }
        if (p.other_disease) {
            diseaseList.push(p.other_disease);
        }
        const diseaseStr = diseaseList.length > 0 ? diseaseList.join(" / ") : "特になし";

        return {
            raw: p,
            photo: p.image,
            name: p.name || "不明",
            age: ageStr,
            kind: p.type === "dog" ? "犬" : p.type === "cat" ? "猫" : "動物",
            plf: [
                { label: "名前", value: p.name || "不明" },
                { label: "年齢", value: ageStr },
                { label: "性別", value: p.gender === "male" ? "男の子" : "女の子" },
                { label: "毛色", value: p.coat_color || p.breed || "不明" },
                { label: "避妊・去勢", value: p.sterilization === "done" || p.operated === "done" ? "済" : "未" },
                { label: "病歴", value: diseaseStr },
                { label: "性格", value: p.personality || p.bio || "" }
            ],
            uuid: p.uuid || "不明"
        };
    });
}

function buildLineMessage(profile) {
    const kind = profile.type === 'dog' ? '犬' : profile.type === 'cat' ? '猫' : '動物';
    const coatColor = profile.coat_color || profile.breed || '不明';
    const sterilization = profile.sterilization === 'done' || profile.operated === 'done' ? '済' : '未';

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
    const diseases = diseaseList.length > 0 ? diseaseList.join(' / ') : '特になし';

    return [
        '契約について問い合わせしたいです。',
        `UUID: ${profile.uuid || '不明'}`,
        `名前: ${profile.name || '不明'}`,
        `年齢: ${ageStr}`,
        `性別: ${profile.gender === 'male' ? '男の子' : profile.gender === 'female' ? '女の子' : '不明'}`,
        `種類: ${kind}`,
        `毛色: ${coatColor}`,
        `避妊・去勢: ${sterilization}`,
        `病歴: ${diseases}`,
        `性格: ${profile.personality || profile.bio || '不明'}`,
        '',
        '画像URL:',
        profile.image || '不明'
    ].join('\n');
}

function openOfficialLine(profile) {
    if (!profile || !profile.uuid) return;

    if (!LINE_OFFICIAL_ACCOUNT_ID) {
        alert('公式LINEのアカウントIDを設定してください');
        return;
    }

    const message = buildLineMessage(profile);
    const lineUrl = `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OFFICIAL_ACCOUNT_ID)}/?${encodeURIComponent(message)}`;
    window.location.href = lineUrl;
}

/* --- カード作成 --- */
function makeCard(item, pos = '') {
    const c = document.createElement('div');
    c.className = `card ${pos}`;

    // ============================
    // 表
    // ============================
    const frontDiv = document.createElement('div');
    frontDiv.className = 'inner front';

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';

    const favoriteBtn = document.createElement('button');
    favoriteBtn.type = 'button';
    favoriteBtn.className = 'icon-btn favorite-btn';
    favoriteBtn.setAttribute('aria-label', 'お気に入り');
    favoriteBtn.textContent = '♡';

    favoriteBtn.addEventListener('click', async event => {
        event.stopPropagation();
        favoriteBtn.disabled = true;
        await toggleFavorite(item.raw, favoriteBtn);
        favoriteBtn.disabled = false;
    });

    const lineBtn = document.createElement('button');
    lineBtn.type = 'button';
    lineBtn.className = 'icon-btn line-btn';
    lineBtn.setAttribute('aria-label', '公式LINEへ送信');
    lineBtn.textContent = '↗';

    lineBtn.addEventListener('click', event => {
        event.stopPropagation();
        openOfficialLine(item.raw);
    });

    actionsDiv.appendChild(favoriteBtn);
    actionsDiv.appendChild(lineBtn);

    const img = document.createElement('img');
    img.className = 'photo';
    img.src = item.photo || "";
    img.alt = escapeHtml(item.kind);

    img.onerror = () => {
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E画像なし%3C/text%3E%3C/svg%3E';
    };

    frontDiv.appendChild(img);
    frontDiv.appendChild(actionsDiv);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'front-info';

    const kindDiv = document.createElement('div');
    kindDiv.className = 'name';
    kindDiv.textContent = item.name;
    infoDiv.appendChild(kindDiv);

    const coatColorDiv = document.createElement('div');
    coatColorDiv.className = 'age';
    coatColorDiv.textContent = item.age;
    infoDiv.appendChild(coatColorDiv);

    frontDiv.appendChild(infoDiv);

    // ============================
    // 裏
    // ============================
    const backDiv = document.createElement('div');
    backDiv.className = 'inner back';

    const plfDiv = document.createElement('div');
    plfDiv.className = 'plf';

    const dl = document.createElement('dl');
    dl.className = 'plf-list';
    item.plf.forEach(info => {
        if (info.value) {
            const dt = document.createElement('dt');
            dt.textContent = `【${info.label}】`;
            const dd = document.createElement('dd');
            dd.textContent = info.value;
            dl.appendChild(dt);
            dl.appendChild(dd);
        }
    });
    plfDiv.appendChild(dl);

    const uuidDiv = document.createElement('div');
    uuidDiv.className = 'uuid';
    uuidDiv.textContent = `UUID: ${item.uuid}`;

    backDiv.appendChild(plfDiv);
    backDiv.appendChild(uuidDiv);

    /* --- カードに追加 --- */
    c.appendChild(frontDiv);
    c.appendChild(backDiv);

    /* --- クリックで反転 --- */
    c.addEventListener('click', () => {
        flip(c);
    });

    return c;
}

/* --- ★修正：ローカルストレージでお気に入り登録/解除を行う関数 --- */
async function toggleFavorite(profile, button) {
    if (!profile || !profile.uuid || !button) return;

    const isCurrentlySaved = button.classList.contains('active');

    try {
        let favorites = getFavoritesFromStorage();
        if (!isCurrentlySaved) {
            if (!favorites.includes(profile.uuid)) {
                favorites.push(profile.uuid);
                saveFavoritesToStorage(favorites);
            }
            button.classList.add('active');
            button.textContent = '♥';
        } else {
            favorites = favorites.filter(id => id !== profile.uuid);
            saveFavoritesToStorage(favorites);
            button.classList.remove('active');
            button.textContent = '♡';
        }
    } catch (error) {
        console.error('Favorite Error:', error);
        alert('お気に入りの保存に失敗しました');
    }
}

async function updateFavoriteButtonState() {
    if (!currentCard || !profiles[index]) return;

    const currentProfile = profiles[index];
    const activeButton = currentCard.querySelector('.favorite-btn');
    if (!activeButton) return;

    try {
        const favorites = getFavoritesFromStorage();
        const isFavorite = favorites.includes(currentProfile.uuid);
        if (!currentCard || !profiles[index] || profiles[index].uuid !== currentProfile.uuid) return;

        if (isFavorite) {
            activeButton.classList.add('active');
            activeButton.textContent = '♥';
        } else {
            activeButton.classList.remove('active');
            activeButton.textContent = '♡';
        }
    } catch (error) {
        console.error('Check Favorite Error:', error);
        activeButton.classList.remove('active');
        activeButton.textContent = '♡';
    }
}

/* --- 初期表示 --- */
function renderInitial() {
    if (words.length === 0) return;

    viewer.innerHTML = "";
    const card = makeCard(words[index]);

    card.classList.add('current');
    viewer.appendChild(card);
    currentCard = card;

    updateFavoriteButtonState();
}

/* --- カード切り替え --- */
function changeCard(newIndex) {
    if (!words[newIndex]) return;

    viewer.innerHTML = "";
    const newCard = makeCard(words[newIndex]);
    newCard.classList.add('current');
    viewer.appendChild(newCard);

    currentCard = newCard;
    index = newIndex;

    updateFavoriteButtonState();
}

/* --- 次へ --- */
function goNext() {
    if (words.length === 0) return;

    if (index >= words.length - 1) {
        changeCard(0);
    } else {
        changeCard(index + 1);
    }
}

/* --- 前へ --- */
function goPrev() {
    if (words.length === 0) return;

    if (index <= 0) {
        changeCard(words.length - 1);
    } else {
        changeCard(index - 1);
    }
}

/* --- カード反転 --- */
function flip(card) {
    if (!card) return;
    card.classList.toggle('flipped');
}

/* --- ナビゲーションボタン --- */
nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);
flipBtn.addEventListener('click', () => {
    flip(currentCard);
});

// ================================
// キーボード操作
// ================================
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

/* --- ★修正：FastAPI（サーバー）からのみデータを純粋に取得 --- */
async function fetchAnimals() {
    try {
        // localStorageからダミーのlocal-xxxデータを混ぜるバグ処理を完全撤廃しました
        const response = await fetch(API_GET_URL);

        if (response.ok) {
            const apiData = await response.json();
            profiles = apiData;
            words = formatDataForDisplay(apiData);

            if (words.length > 0) {
                renderInitial();
            } else {
                viewer.innerHTML = "<p>登録されている動物がいません。</p>";
            }
        } else {
            viewer.innerHTML = "<p>データ取得に失敗しました。</p>";
        }

    } catch (error) {
        console.error("Error:", error);
        viewer.innerHTML = "<p>データ取得に失敗しました。</p>";
    }
}

// ================================
// 起動
// ================================
fetchAnimals();