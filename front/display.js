// ================================
// API
// ================================

const API_GET_URL = "/animals";

// ================================
// グローバル変数
// ================================

let words = [];
let profiles = [];

let index = 0;
let currentCard = null;
let isAnimating = false;

// ================================
// 要素取得
// ================================

const viewer = document.getElementById('viewer');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const flipBtn = document.getElementById('flipBtn');
const saveBtn = document.getElementById('saveBtn');

// ================================
// HTMLエスケープ
// ================================

function escapeHtml(s){

    if(!s) return '';

    return s.replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;');
}

// ================================
// 表示用データ変換
// ================================

function formatDataForDisplay(data){

    return data.map(p => ({

        id: p.uuid,

        photo: p.image,

        kind: p.type === "dog" ? "犬" : "猫",

        breed: p.breed,

plf: `【名前】
${p.name}

【性別】
${p.gender === "male" ? "男の子" : "女の子"}

【年齢】
${p.age}歳 ${p.month}ヶ月

【避妊・去勢】
${p.sterilization === "done" ? "済" : "未"}

【緊張度】
${p.tension}

【病歴】
${(p.diseases && p.diseases.length > 0)
? p.diseases.join(" / ")
: "特になし"}

【推定誕生日】
${p.birthday || "不明"}

【保護日】
${p.protect_day || "不明"}

【紹介文】
${p.bio}`.trim()

    }));
}

// ================================
// カード生成
// ================================

function makeCard(item){

    const c = document.createElement('div');

    c.className = 'card';

    // ============================
    // 表
    // ============================

    const frontDiv = document.createElement('div');

    frontDiv.className = 'inner front';

    const img = document.createElement('img');

    img.className = 'photo';

    img.src = item.photo;

    img.alt = escapeHtml(item.kind);

    img.onerror = () => {

        img.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E画像なし%3C/text%3E%3C/svg%3E';
    };

    const idDiv = document.createElement('div');

    idDiv.className = 'id';

    idDiv.textContent = `UUID: ${item.id}`;

    const kindDiv = document.createElement('div');

    kindDiv.className = 'kind';

    kindDiv.textContent = item.kind;

    const breedDiv = document.createElement('div');

    breedDiv.className = 'breed';

    breedDiv.textContent = item.breed || '';

    frontDiv.appendChild(idDiv);
    frontDiv.appendChild(img);
    frontDiv.appendChild(kindDiv);
    frontDiv.appendChild(breedDiv);

    // ============================
    // 裏
    // ============================

    const backDiv = document.createElement('div');

    backDiv.className = 'inner back';

    backDiv.innerHTML = `
        <div class="plf">
            ${escapeHtml(item.plf).replace(/\n/g, "<br>")}
        </div>
    `;

    // ============================
    // 組み立て
    // ============================

    c.appendChild(frontDiv);

    c.appendChild(backDiv);

    // カードクリックで裏返し

    c.addEventListener('click', () => {

        flip(c);

    });

    return c;
}

// ================================
// 裏返す
// ================================

function flip(card){

    card.classList.toggle('flipped');
}

// ================================
// お気に入り切り替え
// ================================

function toggleFavorite(profile){

    let favorites = JSON.parse(
        localStorage.getItem("GoodProfiles")
    ) || [];

    const favoriteIndex = favorites.indexOf(profile.uuid);

    if(favoriteIndex === -1){

        favorites.push(profile.uuid);

        saveBtn.classList.add('active');

    }else{

        favorites.splice(favoriteIndex, 1);

        saveBtn.classList.remove('active');
    }

    localStorage.setItem(
        "GoodProfiles",
        JSON.stringify(favorites)
    );
}

// ================================
// お気に入り状態反映
// ================================

function updateSaveButtonState(){

    if(!profiles[index]) return;

    const currentProfile = profiles[index];

    const favorites = JSON.parse(
        localStorage.getItem("GoodProfiles")
    ) || [];

    const isSaved = favorites.includes(currentProfile.uuid);

    if(isSaved){

        saveBtn.classList.add('active');

    }else{

        saveBtn.classList.remove('active');
    }
}

// ================================
// 初期表示
// ================================

function renderInitial(){

    if(words.length === 0){

        viewer.innerHTML =
        "<p>登録されている動物がいません。</p>";

        return;
    }

    viewer.innerHTML = "";

    const card = makeCard(words[index]);

    card.classList.add('current');

    viewer.appendChild(card);

    currentCard = card;

    updateSaveButtonState();
}

// ================================
// カード切り替え
// ================================

function changeCard(newIndex){

    if(isAnimating) return;

    isAnimating = true;

    const newCard = makeCard(words[newIndex]);

    viewer.innerHTML = "";

    viewer.appendChild(newCard);

    currentCard = newCard;

    index = newIndex;

    updateSaveButtonState();

    isAnimating = false;
}

// ================================
// 次へ
// ================================

function goNext(){

    const newIndex =
        (index + 1) % words.length;

    changeCard(newIndex);
}

// ================================
// 前へ
// ================================

function goPrev(){

    const newIndex =
        (index - 1 + words.length) % words.length;

    changeCard(newIndex);
}

// ================================
// イベント
// ================================

nextBtn.addEventListener('click', goNext);

prevBtn.addEventListener('click', goPrev);

flipBtn.addEventListener('click', () => {

    if(currentCard){

        flip(currentCard);
    }
});

saveBtn.addEventListener('click', () => {

    if(!profiles[index]) return;

    toggleFavorite(profiles[index]);
});

// ================================
// キーボード操作
// ================================

document.addEventListener('keydown', e => {

    if(e.key === 'ArrowLeft'){

        goPrev();

    }else if(e.key === 'ArrowRight'){

        goNext();

    }else if(e.key === ' '){

        e.preventDefault();

        if(currentCard){

            flip(currentCard);
        }
    }
});

// ================================
// データ取得
// ================================

async function fetchAnimals(){

    try{

        let data = [];

        // localStorage登録データ

        const localData =
            localStorage.getItem("animalData");

        if(localData){

            const parsed = JSON.parse(localData);

            data.push({

                uuid: "local-" + Date.now(),

                ...parsed
            });
        }

        // API取得

        const response = await fetch(API_GET_URL);

        if(response.ok){

            const apiData = await response.json();

            data = data.concat(apiData);
        }

        profiles = data;

        words = formatDataForDisplay(data);

        renderInitial();

    }catch(error){

        console.error(error);
    }
}

// ================================
// 起動
// ================================

fetchAnimals();