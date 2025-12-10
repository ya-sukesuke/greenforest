/* --- 保存済みプロフィールを読み込む --- */
let profiles = JSON.parse(localStorage.getItem("profiles"));

if (!profiles || profiles.length === 0) {
  alert("表示するプロフィールがありません。先に登録してください。");
  profiles = [];
}

/* --- Base64 をそのまま使う形式に変換 --- */
const words = profiles.map(p => ({
  id: p.id,
  photo: p.image || "",
  kind: p.type,
  breed: p.breed,
  plf: `
【名前】${p.name}
【性別】${p.gender}
【年齢】${p.age}歳${p.month}ヶ月
【誕生日】${p.birthday}
【保護日】${p.protect_day}

【紹介文】
  ${p.bio}
  `.trim()
}));

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
const saveBtn = document.getElementById('saveBtn');

let index = 0;
let currentCard = null;
let isAnimating = false;

/* --- カード作成（画像は escape しない） --- */
function makeCard(item, pos){
  const c = document.createElement('div');
  c.className = 'card ' + (pos || '');
  const img = document.createElement('img');
  img.className = 'photo';
  img.src = item.photo;
  img.alt = escapeHtml(item.kind);

  img.onerror = () => {
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E画像なし%3C/text%3E%3C/svg%3E';
  };

  const frontDiv = document.createElement('div');
  frontDiv.className = 'inner front';

  // ID
  const idDiv = document.createElement('div');
  idDiv.className = 'id';
  idDiv.textContent = `ID: ${escapeHtml(String(item.id))}`;
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

/* --- 最初のカード表示 --- */
function renderInitial(){
  viewer.innerHTML = "";
  const card = makeCard(words[index]);
  card.classList.add('current','enter');
  viewer.appendChild(card);
  currentCard = card;
  updateButtons();
}
renderInitial();

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
  if(isAnimating || index <= 0) return;
  changeCard(index - 1, 'to-right', 'from-left');
}

/* --- カード切り替え --- */
function changeCard(newIndex, outClass, inClass){
  isAnimating = true;

  const newCard = makeCard(words[newIndex], inClass);

  requestAnimationFrame(()=>{
    currentCard.classList.add(outClass);
    currentCard.remove();
    viewer.appendChild(newCard);
    newCard.classList.add('enter');
  });

  setTimeout(()=>{
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
  prevBtn.disabled = (index === 0);
}

/* --- イベント --- */
nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);
flipBtn.addEventListener('click', () => flip(currentCard));
saveBtn.addEventListener('click', () => {
  saveBtn.classList.toggle('active');
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
