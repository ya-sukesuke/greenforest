const API_GET_URL = "/animals";

const viewer = document.getElementById('scroll-viewer');

function escapeHtml(s) {
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDataForDisplay(data) {
    return data.map(p => ({
        photo: p.image,
        name: p.name || '不明',
        age: p.age || 0,
        kind: p.type === 'dog' ? '犬' : p.type === 'cat' ? '猫' : '動物',
        plf: `
【名前】${p.name || '不明'}
【年齢】${p.age || 0}歳
【性別】${p.gender === 'male' ? '男の子' : '女の子'}
【毛色】${p.coat_color || p.breed || '不明'}
【避妊・去勢】${p.sterilization === 'done' || p.operated === 'done' ? '済' : '未'}
【病歴】${(p.diseases && p.diseases.length > 0) ? p.diseases.join(' / ') : '特になし'}
【性格】${p.personality || p.bio || ''}
`.trim(),
        uuid: p.uuid || '不明'
    }));
}

function makeCard(item) {
    const card = document.createElement('div');
    card.className = 'card';

    const frontDiv = document.createElement('div');
    frontDiv.className = 'inner front';

    const img = document.createElement('img');
    img.className = 'photo';
    img.src = item.photo || '';
    img.alt = escapeHtml(item.kind);
    img.onerror = () => {
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E画像なし%3C/text%3E%3C/svg%3E';
    };
    frontDiv.appendChild(img);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'kind';
    nameDiv.textContent = item.name;
    frontDiv.appendChild(nameDiv);

    const ageDiv = document.createElement('div');
    ageDiv.className = 'breed';
    ageDiv.textContent = `${item.age}歳`;
    frontDiv.appendChild(ageDiv);

    const backDiv = document.createElement('div');
    backDiv.className = 'inner back';

    const plfDiv = document.createElement('div');
    plfDiv.className = 'plf';
    plfDiv.innerHTML = escapeHtml(item.plf).replace(/\n/g, '<br>');

    const uuidDiv = document.createElement('div');
    uuidDiv.className = 'uuid';
    uuidDiv.textContent = `UUID: ${item.uuid}`;

    backDiv.appendChild(plfDiv);
    backDiv.appendChild(uuidDiv);

    card.appendChild(frontDiv);
    card.appendChild(backDiv);

    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
    });

    return card;
}

async function fetchAnimals() {
    try {
        const response = await fetch(API_GET_URL);

        if (!response.ok) {
            viewer.innerHTML = '<div class="empty-state">データ取得に失敗しました。</div>';
            return;
        }

        const apiData = await response.json();
        const cards = formatDataForDisplay(apiData);

        if (cards.length === 0) {
            viewer.innerHTML = '<div class="empty-state">登録されている動物がいません。</div>';
            return;
        }

        viewer.innerHTML = '';
        cards.forEach(item => {
            viewer.appendChild(makeCard(item));
        });
    } catch (error) {
        console.error('Error:', error);
        viewer.innerHTML = '<div class="empty-state">データ取得に失敗しました。</div>';
    }
}

fetchAnimals();
