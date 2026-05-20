// 【重要】FastAPIサーバーの GET エンドポイントURL
const API_GET_URL = "/animals";

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

        kind: p.type === "dog" ? "犬" : "猫",

        breed: p.breed || "",

        plf: `
【名前】${p.name || "不明"}

【性別】${p.gender === "male" ? "男の子" : "女の子"}

【年齢】${p.age || 0}歳${p.month || 0}ヶ月

【避妊・去勢】
${p.sterilization === "done" ? "済" : "未"}

【緊張度】
${p.tension || "不明"}

【病歴】
${(p.diseases && p.diseases.length > 0)
            ? p.diseases.join(" / ")
            : "特になし"}

【推定誕生日】
${p.birthday || "不明"}

【保護日】
${p.protect_day || "不明"}

【紹介文】
${p.bio || ""}
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

        img.src =
            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E画像なし%3C/text%3E%3C/svg%3E';
    };

    /* --- 表面 --- */
    const frontDiv = document.createElement('div');

    frontDiv.className = 'inner front';

    const idDiv = document.createElement('div');

    idDiv.className = 'id';

    idDiv.textContent = `UUID: ${item.id}`;

    frontDiv.appendChild(idDiv);

    frontDiv.appendChild(img);

    const kindDiv = document.createElement('div');

    kindDiv.className = 'kind';

    kindDiv.textContent = item.kind;

    frontDiv.appendChild(kindDiv);

    const breedDiv = document.createElement('div');

    breedDiv.className = 'breed';

    breedDiv.textContent = item.breed;

    frontDiv.appendChild(breedDiv);

    /* --- 裏面 --- */
    const backDiv = document.createElement('div');

    backDiv.className = 'inner back';

    backDiv.innerHTML =
        `<div class="plf">${escapeHtml(item.plf).replace(/\n/g, "<br>")}</div>`;

    /* --- カードに追加 --- */
    c.appendChild(frontDiv);

    c.appendChild(backDiv);

    /* --- クリックで反転 --- */
    c.addEventListener('click', () => {

        flip(c);
    });

    return c;
}

/* --- お気に入り登録/解除 --- */
function toggleFavorite(profile) {

    let GoodProfiles = JSON.parse(
        localStorage.getItem("GoodProfiles")
    ) || [];

    const favIndex = GoodProfiles.indexOf(profile.uuid);

    if (favIndex === -1) {

        /* --- 登録 --- */
        GoodProfiles.push(profile.uuid);

        localStorage.setItem(
            "GoodProfiles",
            JSON.stringify(GoodProfiles)
        );

        saveBtn.classList.add('active');

        alert("登録しました");

    } else {

        /* --- 削除 --- */
        GoodProfiles.splice(favIndex, 1);

        localStorage.setItem(
            "GoodProfiles",
            JSON.stringify(GoodProfiles)
        );

        saveBtn.classList.remove('active');

        alert("削除されました");
    }
}

/* --- 保存状態チェック --- */
function updateSaveButtonState() {

    if (!profiles || !profiles[index]) return;

    const currentProfileData = profiles[index];

    let GoodProfiles = JSON.parse(
        localStorage.getItem("GoodProfiles")
    ) || [];

    const isSaved =
        GoodProfiles.includes(currentProfileData.uuid);

    if (isSaved) {

        saveBtn.classList.add('active');

    } else {

        saveBtn.classList.remove('active');
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

    updateSaveButtonState();
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

        updateSaveButtonState();

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

        changeCard(
            words.length - 1,
            'to-right',
            'from-left'
        );

    } else {

        changeCard(
            index - 1,
            'to-right',
            'from-left'
        );
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

/* --- お気に入りボタン --- */
saveBtn.addEventListener('click', () => {

    if (!profiles || !profiles[index]) return;

    const currentProfileData = profiles[index];

    toggleFavorite(currentProfileData);
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
        const localData =
            localStorage.getItem("animalData");

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

            viewer.innerHTML =
                "<p>登録されている動物がいません。</p>";
        }

    } catch (error) {

        console.error("Error:", error);

        viewer.innerHTML =
            "<p>データ取得に失敗しました。</p>";
    }
}

/* --- 起動 --- */
fetchAnimals();