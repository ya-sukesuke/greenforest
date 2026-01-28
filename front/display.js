// 【重要】FastAPIサーバーの GET エンドポイントURL
const API_GET_URL = "/animals"; 

/* --- データ保存形式を統一するために、wordsはグローバル変数とする --- */
let words = [];
let profiles = []; // 元のコードとの互換性のために残すが、サーバーデータが入る

/* --- プロフィール保存関数(お気に入り登録) --- */
// サーバー連携は実装しないため、元のローカルストレージへの保存ロジックを残します
function saveProfileData(profile) {
    let GoodProfiles = JSON.parse(localStorage.getItem("GoodProfiles")) || [];
    GoodProfiles.push(profile);
    localStorage.setItem("GoodProfiles", JSON.stringify(GoodProfiles));
    alert("お気に入りとしてローカルに登録しました。");
}

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
    return data.map(p => {
        // 避妊・去勢の表示変換
        const operatedText = p.operated === "done" ? "済" : "未";
        
        // 病歴の整形
        let diseaseText = "特になし";
        if (p.diseases && p.diseases.length > 0) {
            // 内部的な値を日本語に変換（必要に応じて）
            const diseaseMap = { fiv: "エイズ", felv: "白血病" };
            const knownDiseases = p.diseases.map(d => diseaseMap[d] || d);
            diseaseText = knownDiseases.join(", ");
        }
        if (p.other_disease) {
            diseaseText += diseaseText === "特になし" ? p.other_disease : `、${p.other_disease}`;
        }

        // 緊張度の視覚化（例：3/5）
        const tensionText = `${p.tension} / 5 (5に近いほどフレンドリー)`;

        return {
            id: p.uuid,
            photo: p.image || "", 
            kind: p.type === "dog" ? "犬" : "猫",
            breed: p.breed,
            plf: `      
【名前】${p.name}
【性別】${p.gender === "male" ? "男の子" : "女の子"}
【年齢】${p.age}歳${p.month}ヶ月
【誕生日】${p.birthday}
【保護日】${p.protect_day}

【避妊・去勢】${operatedText}
【病歴】${diseaseText}
【フレンドリー度】${tensionText}

【紹介文】
${p.bio}
  `.trim()
        };
    });
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

/* --- FastAPIからデータを取得し、レンダリングするメイン関数 --- */
async function fetchAnimals() {
    try {
        const response = await fetch(API_GET_URL);
        if (!response.ok) throw new Error("データの取得に失敗しました");
        const data = await response.json();
        
        // データを表示用フォーマットに変換
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