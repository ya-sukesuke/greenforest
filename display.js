/* --- 保存済みプロフィールを読み込む --- */
let profiles = JSON.parse(localStorage.getItem("profiles"));

if (!profiles || profiles.length === 0) {
  alert("表示するプロフィールがありません。先に登録してください。");
  profiles = [];
}

/* --- display.js が使う形式に変換 --- */
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


const viewer = document.getElementById('viewer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const flipBtn = document.getElementById('flipBtn');
const saveBtn = document.getElementById('saveBtn');

let index = 0;
let currentCard = null;
let isAnimating = false;

/* HTML特殊文字を安全に */
function escapeHtml(s){
  if(!s) return '';
  return s.replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;');
}

/* カード生成 */
function makeCard(item, pos){
  const c = document.createElement('div');
  c.className = 'card ' + (pos || '');
  c.innerHTML = `
    <div class="inner front">
      <div class="id">ID: ${escapeHtml(String(item.id || ''))}</div>
      <img class="photo" src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.kind)}">
      <div class="kind">${escapeHtml(item.kind)}</div>
      <div class="breed">${escapeHtml(item.breed || '')}</div>
    </div>
    <div class="inner back">
      <div class="plf">${escapeHtml(item.plf)}</div>
    </div>
  `;
  c.addEventListener('click', () => flip(c));
  return c;
}

/* 初期表示 */
function renderInitial(){
  viewer.innerHTML = "";
  const card = makeCard(words[index]);
  card.classList.add('current','enter');
  viewer.appendChild(card);
  currentCard = card;
  updateButtons();
}
renderInitial();

/* 次へ */
function goNext(){
  if(isAnimating) return;
  
  if(index >= words.length - 1){
    // 最後のカードなら最初に戻す
    changeCard(0, 'to-left', 'from-right');
  } else {
    changeCard(index + 1, 'to-left', 'from-right');
  }
}

/* 前へ */
function goPrev(){
  if(isAnimating || index <= 0) return;
  changeCard(index - 1, 'to-right', 'from-left');
}

/* カード切り替え共通処理 */
function changeCard(newIndex, outClass, inClass){
  isAnimating = true;

  const newCard = makeCard(words[newIndex], inClass);

  requestAnimationFrame(()=>{
    currentCard.classList.add(outClass);
    currentCard.remove();
    viewer.appendChild(newCard);
    newCard.classList.add('enter');
    newCard.style.transform = 'rotateY(0deg)';
    newCard.style.opacity = '1';
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

/* 裏返す */
function flip(card){
  card.classList.toggle('flipped');}

/* ボタン更新 */
function updateButtons(){
  prevBtn.disabled = (index === 0);
}

/* クリックイベント */
nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);
flipBtn.addEventListener('click', () => flip(currentCard));
saveBtn.addEventListener('click', () => {
  saveBtn.classList.toggle('active');
});

/* スワイプ操作 */
let startX = null;
viewer.addEventListener('touchstart', e=>{
  if(e.touches[0]) startX = e.touches[0].clientX;
});
viewer.addEventListener('touchend', e=>{
  if(startX === null) return;
  const dx = e.changedTouches[0].clientX - startX;
  if(Math.abs(dx) > 40){
    if(dx < 0) goNext();
    else goPrev();
  }
  startX = null;
});

/* キーボード操作 */
document.addEventListener('keydown', e=>{
  if(e.key === 'ArrowLeft') goPrev();
  else if(e.key === 'ArrowRight') goNext();
  else if(e.key === ' '){
    e.preventDefault();
    flip(currentCard);
  }
});

