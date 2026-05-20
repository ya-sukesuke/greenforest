// 【重要】FastAPIサーバーの GET エンドポイントURL
const API_GET_URL = "/animals"; 

/* --- データ保存形式を統一するために、wordsはグローバル変数とする --- */
let words = [];
let profiles = []; // 元のコードとの互換性のために残すが、サーバーデータが入る


/* --- HTML エスケープ（画像には使わない） --- */
function escapeHtml(s){
  if(!s) return '';
  return s.replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;');
}

const viewer = document.getElementById('viewer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const flipBtn = document.getElementById('flipBtn');
const saveBtn = document.getElementById('saveBtn'); // お気に入りボタン

let index = 0;
let currentCard = null;
let isAnimating = false;

/* --- データ変換＆カード表示用のデータを準備する関数 --- */
function formatDataForDisplay(data) {
  return data.map(p => ({
    id: p.uuid,
    photo: p.image,

    kind: p.type === "dog" ? "犬" : "猫",
    breed: p.breed,

    plf: `
【名前】${p.name}
【性別】${p.gender === "male" ? "男の子" : "女の子"}
【年齢】${p.age}歳${p.month}ヶ月
【避妊・去勢】${p.sterilization === "done" ? "済" : "未"}
【緊張度】${p.tension}

【病歴】
${(p.diseases && p.diseases.length > 0) ? p.diseases.join(" / ") : "特になし"}

【推定誕生日】${p.birthday || "不明"}
【保護日】${p.protect_day || "不明"}

【紹介文】
${p.bio}
`.trim()
  }));
}

/* --- カード作成（画像は escape しない） --- */
function makeCard(item, pos){
  const c = document.createElement('div');
  c.className = 'card ' + (pos || '');
  const img = document.createElement('img');
  img.className = 'photo';
  // FastAPIから返されるデータにはBase64文字列がそのまま含まれることを想定
  img.src = item.photo; 
  img.alt = escapeHtml(item.kind);

  img.onerror = () => {
    // 画像データが無効または読み込み失敗の場合の代替表示
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E画像なし%3C/text%3E%3C/svg%3E';
  };

  const frontDiv = document.createElement('div');
  frontDiv.className = 'inner front';

  // ID (UUID)
  const idDiv = document.createElement('div');
  idDiv.className = 'id';
  idDiv.textContent = `UUID: ${escapeHtml(String(item.id))}`;
  frontDiv.appendChild(idDiv);

  // 画像（ID の下に配置）
  frontDiv.appendChild(img);

  // 種類と品種
  const kindDiv = document.createElement('div');
  kindDiv.className = 'kind';
  kindDiv.textContent = escapeHtml(item.kind);
  frontDiv.appendChild(kindDiv);

  const breedDiv = document.createElement('div');
  breedDiv.className = 'breed';
  breedDiv.textContent = escapeHtml(item.breed || '');
  frontDiv.appendChild(breedDiv);
  const backDiv = document.createElement('div');
  backDiv.className = 'inner back';
  backDiv.innerHTML = `<div class="plf">${escapeHtml(item.plf).replace(/\n/g, "<br>")}</div>`;

  c.appendChild(frontDiv);
  c.appendChild(backDiv);
  c.addEventListener('click', () => flip(c));
  return c;
}

/* --- お気に入り登録・解除を切り替えるメイン関数 --- */
function toggleFavorite(profile) {
    let GoodProfiles = JSON.parse(localStorage.getItem("GoodProfiles")) || [];
    
    // すでに保存されているか「名前」でチェック
    const index = GoodProfiles.findIndex(p => p.name === profile.name);
    
    if (index === -1) {
        // 【1回目：登録されていない場合】
        // ① ローカルストレージに保存する
        GoodProfiles.push(profile);
        localStorage.setItem("GoodProfiles", JSON.stringify(GoodProfiles));
        
        // ② ボックスの色を反転する（activeクラスをつける）
        saveBtn.classList.add('active');
        
        // ③ アラートを出す
        //alert("登録しました");
    } else {
        // 【2回目（もう一度押された場合）：すでに登録されている場合】
        // ① ローカルストレージから削除する
        GoodProfiles.splice(index, 1);
        localStorage.setItem("GoodProfiles", JSON.stringify(GoodProfiles));
        
        // ② 色を元に戻す（activeクラスを外す）
        saveBtn.classList.remove('active');
        
        // ③ アラートを出す
        //alert("削除されました");
    }
}

/* --- プロフィール保存関数(お気に入り登録 / 解除のトグル) --- */
function toggleFavorite(profile) {
    // ローカルストレージから uuid の配列を取得（なければ空配列）
    let GoodProfiles = JSON.parse(localStorage.getItem("GoodProfiles")) || [];
    
    // 【修正】配列内に現在の動物の uuid が含まれているかチェック
    const index = GoodProfiles.indexOf(profile.uuid);
    
    if (index === -1) {
        // 【1回目：未登録の場合】
        // ① 配列に uuid だけを追加してローカルストレージに保存
        GoodProfiles.push(profile.uuid);
        localStorage.setItem("GoodProfiles", JSON.stringify(GoodProfiles));
        
        // ② ボックスの色を反転（activeクラスを付与）
        saveBtn.classList.add('active');
        
        // ③ アラートを出す
        alert("登録しました");
    } else {
        // 【2回目：登録済の場合】
        // ① 配列から該当の uuid を削除してローカルストレージに保存
        GoodProfiles.splice(index, 1);
        localStorage.setItem("GoodProfiles", JSON.stringify(GoodProfiles));
        
        // ② 色を元に戻す（activeクラスを除去）
        saveBtn.classList.remove('active');
        
        // ③ アラートを出す
        alert("削除されました");
    }
}

/* --- カード切り替え時や初期表示時に、保存状態に合わせてボタンの色を維持する関数 --- */
function updateSaveButtonState() {
    if (!profiles || !profiles[index]) return;
    
    const currentProfileData = profiles[index];
    let GoodProfiles = JSON.parse(localStorage.getItem("GoodProfiles")) || [];
    
    // 【修正】ローカルストレージの配列に現在の uuid が含まれているか確認
    const isSaved = GoodProfiles.includes(currentProfileData.uuid);
    
    if (isSaved) {
        saveBtn.classList.add('active');    // uuidがあれば色を反転したままにする
    } else {
        saveBtn.classList.remove('active'); // なければ元の色にする
    }
}

/* --- 【重要】お気に入りボタンのクリックイベント --- */
saveBtn.addEventListener('click', () => {
    if (!profiles || !profiles[index]) return;
    
    // 現在表示されている動物のデータを取得
    const currentProfileData = profiles[index];
    
    // 登録・解除の切り替え処理を実行
    toggleFavorite(currentProfileData);
});

/* --- 既存のカード切り替え関数 (changeCard) の末尾を修正 --- */
function changeCard(newIndex, outClass, inClass){
  isAnimating = true;
  const newCard = makeCard(words[newIndex], inClass);

  requestAnimationFrame(()=>{
    currentCard.classList.add(outClass);
    viewer.appendChild(newCard);
    newCard.classList.add('enter');
  });

  setTimeout(()=>{
    currentCard.remove();
    newCard.classList.remove(inClass,'enter');
    newCard.classList.add('current');
    currentCard = newCard;
    index = newIndex;
    isAnimating = false;
    updateButtons();
    
    // ★カードが切り替わった時に状態をチェック
    updateSaveButtonState();
  }, 520);
}

/* --- 既存の初期表示関数 (renderInitial) の末尾を修正 --- */
function renderInitial(){
    if (words.length === 0) return;
    
    viewer.innerHTML = "";
    const card = makeCard(words[index]);
    card.classList.add('current','enter');
    viewer.appendChild(card);
    currentCard = card;
    updateButtons();
    
    // ★最初の1枚目を表示した時にも状態をチェック
    updateSaveButtonState();
}

/* --- 【重要】お気に入りボタンのクリックイベント（ここを丸ごと差し替え） --- */
saveBtn.addEventListener('click', () => {
    if (!profiles || !profiles[index]) return;
    
    // 現在表示されている動物のデータを取得
    const currentProfileData = profiles[index];
    
    // 登録・解除の切り替え処理を実行（この中で色反転・アラート・保存がすべて完結します）
    toggleFavorite(currentProfileData);
});

/* --- FastAPIからデータを取得し、レンダリングするメイン関数 --- */
async function fetchAnimals() {
  try {
    let data = [];

    /* --- ① localStorage からデータ取得 --- */
    const localData = localStorage.getItem("animalData");
    if (localData) {
      const parsed = JSON.parse(localData);

      // FastAPI のデータ構造に寄せる
      data.push({
        uuid: "local-" + Date.now(),
        ...parsed
      });
    }

    /* --- ② FastAPI から取得（あれば） --- */
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
  }
}

/* --- 最初のカード表示 --- */
function renderInitial(){
    if (words.length === 0) return;
    
    viewer.innerHTML = "";
    const card = makeCard(words[index]);
    card.classList.add('current','enter');
    viewer.appendChild(card);
    currentCard = card;
    updateButtons();
}

/* --- 次へ --- */
function goNext(){
  if(isAnimating) return;

  if(index >= words.length - 1){
    changeCard(0, 'to-left', 'from-right');
  } else {
    changeCard(index + 1, 'to-left', 'from-right');
  }
}

/* --- 前へ --- */
function goPrev(){
  // 修正: 最後の要素から逆順にループできるようにする
  if(isAnimating) return;
    
  if(index <= 0){
    changeCard(words.length - 1, 'to-right', 'from-left');
  } else {
    changeCard(index - 1, 'to-right', 'from-left');
  }
}

/* --- カード切り替え --- */
function changeCard(newIndex, outClass, inClass){
  isAnimating = true;

  const newCard = makeCard(words[newIndex], inClass);

  requestAnimationFrame(()=>{
    // 既存のカードをアニメーション用にクラスを追加
    currentCard.classList.add(outClass);
    // 新しいカードを一時的に追加
    viewer.appendChild(newCard);
    newCard.classList.add('enter');
  });

  setTimeout(()=>{
    // 古いカードを削除
    currentCard.remove();
    
    newCard.classList.remove(inClass,'enter');
    newCard.classList.add('current');
    currentCard = newCard;
    index = newIndex;
    isAnimating = false;
    updateButtons();
  }, 520);
}

/* --- 裏返す --- */
function flip(card){
  card.classList.toggle('flipped');
}

/* --- ボタン更新 --- */
function updateButtons(){
  // 前へのボタンは、ループ処理にしたため無効化の必要なし
  // prevBtn.disabled = (index === 0);
}

/* --- イベント --- */
nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);
flipBtn.addEventListener('click', () => flip(currentCard));
saveBtn.addEventListener('click', () => {
    // 現在表示されているカードの元のデータを取得
    const currentProfileData = profiles[index];
    saveProfileData(currentProfileData);
    saveBtn.classList.add('active'); // トグルではなく、一度アクティブにする
    setTimeout(() => saveBtn.classList.remove('active'), 500); // 0.5秒後に戻す
});

/* --- キーボード操作 --- */
document.addEventListener('keydown', e=>{
  if(e.key === 'ArrowLeft') goPrev();
  else if(e.key === 'ArrowRight') goNext();
  else if(e.key === ' '){
    e.preventDefault();
    flip(currentCard);
  }
});


// アプリケーション起動時にデータを取得してレンダリングを開始
fetchAnimals();