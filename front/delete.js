// delete.js
// パスワードチェック（管理者ログインチェック）
(function() {
    if (sessionStorage.getItem('admin_logged_in') !== 'true') {
        window.location.href = "admin.html";
    } else {
        document.documentElement.style.display = "block";
    }
})();

const API_URL = "/animals";

let targetUuid = null;
let targetCardElement = null;

const animalGrid = document.getElementById('animalGrid');
const deleteModal = document.getElementById('deleteModal');
const deleteTargetName = document.getElementById('deleteTargetName');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const toastElement = document.getElementById('toast');

// トースト通知を表示する関数
function showToast(message, type = 'success') {
    toastElement.textContent = message;
    toastElement.className = `toast show ${type}`;
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}

// 避妊・去勢、性別、種類などの表示変換
function getGenderLabel(gender) {
    return gender === 'male' ? '男の子' : '女の子';
}

function getSterilizationLabel(sterilization) {
    return sterilization === 'done' ? '済' : '未';
}

// 動物データをフェッチ
async function fetchAnimals() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("データの取得に失敗しました");
        const animals = await response.json();
        
        renderAnimals(animals);
    } catch (error) {
        console.error(error);
        animalGrid.innerHTML = `<div class="empty-message">データの取得に失敗しました。<br>${error.message}</div>`;
    }
}

// カードの描画
function renderAnimals(animals) {
    if (!animals || animals.length === 0) {
        animalGrid.innerHTML = '<div class="empty-message">登録されている動物情報がありません。</div>';
        return;
    }

    animalGrid.innerHTML = '';
    animals.forEach(animal => {
        const card = document.createElement('div');
        card.className = 'delete-card';
        card.dataset.uuid = animal.uuid;

        // 画像URLが空かチェック
        const imgUrl = animal.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E画像なし%3C/text%3E%3C/svg%3E';

        const kindText = animal.type === 'dog' ? '犬' : '猫';
        const tagClass = animal.type === 'dog' ? 'tag-dog' : 'tag-cat';

        card.innerHTML = `
            <div class="card-img-wrapper">
                <img class="card-img" src="${imgUrl}" alt="${escapeHtml(animal.name)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"%3E%3Crect fill=\"%23f0f0f0\" width=\"200\" height=\"200\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\" fill=\"%23999\" font-size=\"16\"%3E画像なし%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="card-info">
                <div>
                    <div class="info-header">
                        <h4 class="animal-name">${escapeHtml(animal.name || '名前なし')}</h4>
                        <span class="animal-tag ${tagClass}">${kindText}</span>
                    </div>
                    <div class="animal-details">
                        <div class="detail-item">
                            <span class="detail-label">性別</span>
                            <span class="detail-val">${getGenderLabel(animal.gender)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">年齢</span>
                            <span class="detail-val">${animal.age !== undefined && animal.age !== "" ? animal.age : '不詳'}歳</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">毛色</span>
                            <span class="detail-val">${escapeHtml(animal.coat_color || '不明')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">避妊・去勢</span>
                            <span class="detail-val">${getSterilizationLabel(animal.sterilization)}</span>
                        </div>
                    </div>
                </div>
                <div class="delete-btn-wrapper">
                    <button class="delete-action-btn" data-uuid="${animal.uuid}" data-name="${escapeHtml(animal.name || '名前なし')}">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        削除する
                    </button>
                </div>
            </div>
        `;

        animalGrid.appendChild(card);
    });

    // 削除ボタンへのイベントリスナー設定
    document.querySelectorAll('.delete-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnEl = e.currentTarget;
            targetUuid = btnEl.dataset.uuid;
            const name = btnEl.dataset.name;
            targetCardElement = btnEl.closest('.delete-card');

            deleteTargetName.textContent = name;
            deleteModal.classList.add('show');
        });
    });
}

function escapeHtml(s) {
    if(!s) return '';
    return String(s).replace(/&/g,'&amp;')
                    .replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;')
                    .replace(/"/g,'&quot;');
}

// モーダルを閉じる
function closeModal() {
    deleteModal.classList.remove('show');
    targetUuid = null;
    targetCardElement = null;
}

cancelDeleteBtn.addEventListener('click', closeModal);

// 背景クリックでも閉じる
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        closeModal();
    }
});

// 削除実行
confirmDeleteBtn.addEventListener('click', async () => {
    if (!targetUuid) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = '削除中...';

    try {
        const response = await fetch(`${API_URL}/${targetUuid}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('サーバーエラーが発生しました');

        // アニメーションを伴ってカードを削除
        if (targetCardElement) {
            targetCardElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            targetCardElement.style.opacity = '0';
            targetCardElement.style.transform = 'scale(0.8)';
            setTimeout(() => {
                targetCardElement.remove();
                
                // カードが残っているかチェック
                if (animalGrid.children.length === 0) {
                    animalGrid.innerHTML = '<div class="empty-message">登録されている動物情報がありません。</div>';
                }
            }, 300);
        }

        showToast('動物情報を正常に削除しました。');
        closeModal();
    } catch (error) {
        console.error(error);
        showToast('削除に失敗しました: ' + error.message, 'error');
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = '完全に削除する';
    }
});

// 初期化
fetchAnimals();
