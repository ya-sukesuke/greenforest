const API_GET_URL = "/animals";
const API_FAVORITE_URL = "/favorites";

// 公式LINEのアカウントIDを設定してください（例: @greenforest）
const LINE_OFFICIAL_ACCOUNT_ID = "@889qbfcv";

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

        return {
            raw: p,
            photo: p.image,
            name: p.name || '不明',
            age: ageStr,
            kind: p.type === 'dog' ? '犬' : p.type === 'cat' ? '猫' : '動物',
            plf: [
                { label: "名前", value: p.name || "不明" },
                { label: "年齢", value: ageStr },
                { label: "性別", value: p.gender === "male" ? "男の子" : "女の子" },
                { label: "毛色", value: p.coat_color || p.breed || "不明" },
                { label: "避妊・去勢", value: p.sterilization === "done" || p.operated === "done" ? "済" : "未" },
                { label: "病歴", value: (p.diseases && p.diseases.length > 0) ? p.diseases.join(" / ") : "特になし" },
                { label: "性格", value: p.personality || p.bio || "" }
            ],
            uuid: p.uuid || '不明'
        };
    });
}

function buildLineMessage(profile) {
    const kind = profile.type === 'dog' ? '犬' : profile.type === 'cat' ? '猫' : '動物';
    const coatColor = profile.coat_color || profile.breed || '不明';
    const sterilization = profile.sterilization === 'done' || profile.operated === 'done' ? '済' : '未';
    const diseases = (profile.diseases && profile.diseases.length > 0) ? profile.diseases.join(' / ') : '特になし';

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

async function getFavoriteUUIDsFromServer() {
    try {
        const response = await fetch(API_FAVORITE_URL);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('お気に入り一覧の取得に失敗しました:', error);
        return [];
    }
}

async function toggleFavorite(profile, button) {
    if (!profile || !profile.uuid) return;

    const isActive = button.classList.contains('active');

    try {
        if (!isActive) {
            const response = await fetch(API_FAVORITE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uuid: profile.uuid })
            });

            if (response.ok) {
                button.classList.add('active');
                button.textContent = '♥';
            }
        } else {
            const response = await fetch(`${API_FAVORITE_URL}/${profile.uuid}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                button.classList.remove('active');
                button.textContent = '♡';
            }
        }
    } catch (error) {
        console.error('Favorite Error:', error);
        alert('サーバーとの通信に失敗しました');
    }
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

function makeCard(item) {
    const card = document.createElement('div');
    card.className = 'card';

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
    img.src = item.photo || '';
    img.alt = escapeHtml(item.kind);
    img.onerror = () => {
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="16"%3E画像なし%3C/text%3E%3C/svg%3E';
    };
    frontDiv.appendChild(img);
    frontDiv.appendChild(actionsDiv);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'front-info';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    nameDiv.textContent = item.name;
    infoDiv.appendChild(nameDiv);

    const ageDiv = document.createElement('div');
    ageDiv.className = 'age';
    ageDiv.textContent = `${item.age}歳`;
    infoDiv.appendChild(ageDiv);

    frontDiv.appendChild(infoDiv);

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

    card.appendChild(frontDiv);
    card.appendChild(backDiv);

    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
    });

    return card;
}

async function fetchAnimals() {
    try {
        const [animalResponse, favoriteUUIDs] = await Promise.all([
            fetch(API_GET_URL),
            getFavoriteUUIDsFromServer()
        ]);

        if (!animalResponse.ok) {
            viewer.innerHTML = '<div class="empty-state">データ取得に失敗しました。</div>';
            return;
        }

        const apiData = await animalResponse.json();
        const cards = formatDataForDisplay(apiData);

        if (cards.length === 0) {
            viewer.innerHTML = '<div class="empty-state">登録されている動物がいません。</div>';
            return;
        }

        viewer.innerHTML = '';
        cards.forEach(item => {
            const card = makeCard(item);
            const favoriteBtn = card.querySelector('.favorite-btn');
            if (favoriteBtn && favoriteUUIDs.includes(item.uuid)) {
                favoriteBtn.classList.add('active');
                favoriteBtn.textContent = '♥';
            }
            viewer.appendChild(card);
        });
    } catch (error) {
        console.error('Error:', error);
        viewer.innerHTML = '<div class="empty-state">データ取得に失敗しました。</div>';
    }
}

fetchAnimals();
