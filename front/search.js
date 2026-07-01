const API_GET_URL = "/animals";
const API_FAVORITE_URL = "/favorites";

const LINE_OFFICIAL_ACCOUNT_ID = "@889qbfcv";

const viewer = document.getElementById("scroll-viewer");
const resultCount = document.getElementById("resultCount");
const searchBtn = document.getElementById("searchBtn");

let allAnimals = [];

/* -------------------------
   年齢セレクト生成
------------------------- */
function initAgeSelect() {
    const minAge = document.getElementById("minAge");
    const maxAge = document.getElementById("maxAge");

    for (let i = 0; i <= 30; i++) {
        minAge.add(new Option(i, i));
        maxAge.add(new Option(i, i));
    }

    minAge.value = 0;
    maxAge.value = 30;
}

/* -------------------------
   HTMLエスケープ
------------------------- */
function escapeHtml(s) {
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* -------------------------
   データ変換
------------------------- */
function formatDataForDisplay(data) {
    return data.map(p => {

        let ageStr = "不詳";

        if (
            p.age !== undefined &&
            p.age !== null &&
            p.age !== -1 &&
            p.age !== "-1"
        ) {
            const ageNum = parseInt(p.age, 10);

            if (!isNaN(ageNum)) {
                ageStr = `${ageNum}歳`;

                if (p.is_estimated) {
                    ageStr += "（推定）";
                }
            }
        }

        const diseaseList = [];

        if (p.diseases) {
            p.diseases.forEach(d => {
                if (d && d !== "other") {
                    diseaseList.push(d);
                }
            });
        }

        if (p.other_disease) {
            diseaseList.push(p.other_disease);
        }

        const diseaseStr =
            diseaseList.length > 0
                ? diseaseList.join(" / ")
                : "特になし";

        return {
            raw: p,
            photo: p.image,
            name: p.name || "不明",
            age: ageStr,
            kind:
                p.type === "dog"
                    ? "犬"
                    : p.type === "cat"
                    ? "猫"
                    : "動物",

            plf: [
                { label: "名前", value: p.name || "不明" },
                { label: "年齢", value: ageStr },
                { label: "性別", value: p.gender === "male" ? "男の子" : "女の子" },
                { label: "毛色", value: p.coat_color || "不明" },
                { label: "避妊・去勢", value: p.sterilization === "done" ? "済" : "未" },
                { label: "病歴", value: diseaseStr },
                { label: "性格", value: p.personality || "" }
            ],

            uuid: p.uuid || "不明"
        };
    });
}

/* -------------------------
   LINE送信用
------------------------- */
function buildLineMessage(profile) {
    return [
        '契約について問い合わせしたいです。',
        `UUID: ${profile.uuid || '不明'}`,
        `名前: ${profile.name || '不明'}`
    ].join('\n');
}

function openOfficialLine(profile) {

    const message = buildLineMessage(profile);

    const lineUrl =
        `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OFFICIAL_ACCOUNT_ID)}/?${encodeURIComponent(message)}`;

    window.location.href = lineUrl;
}

/* -------------------------
   お気に入り
------------------------- */
async function toggleFavorite(profile, button) {

    const active =
        button.classList.contains("active");

    try {

        if (!active) {

            const response =
                await fetch(API_FAVORITE_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type":
                        "application/json"
                    },
                    body: JSON.stringify({
                        uuid: profile.uuid
                    })
                });

            if (response.ok) {
                button.classList.add("active");
                button.textContent = "♥";
            }

        } else {

            const response =
                await fetch(
                    `${API_FAVORITE_URL}/${profile.uuid}`,
                    {
                        method: "DELETE"
                    }
                );

            if (response.ok) {
                button.classList.remove("active");
                button.textContent = "♡";
            }
        }

    } catch (e) {
        console.error(e);
    }
}

async function getFavoriteUUIDsFromServer() {

    try {

        const response =
            await fetch(API_FAVORITE_URL);

        if (!response.ok) {
            return [];
        }

        return await response.json();

    } catch {

        return [];
    }
}

/* -------------------------
   カード生成
------------------------- */
function makeCard(item) {

    const card = document.createElement("div");
    card.className = "card";

    const frontDiv =
        document.createElement("div");

    frontDiv.className =
        "inner front";

    const actionsDiv =
        document.createElement("div");

    actionsDiv.className =
        "card-actions";

    const favoriteBtn =
        document.createElement("button");

    favoriteBtn.className =
        "icon-btn favorite-btn";

    favoriteBtn.textContent = "♡";

    favoriteBtn.addEventListener(
        "click",
        async e => {

            e.stopPropagation();

            favoriteBtn.disabled = true;

            await toggleFavorite(
                item.raw,
                favoriteBtn
            );

            favoriteBtn.disabled = false;
        }
    );

    const lineBtn =
        document.createElement("button");

    lineBtn.className =
        "icon-btn line-btn";

    lineBtn.textContent = "↗";

    lineBtn.addEventListener(
        "click",
        e => {

            e.stopPropagation();

            openOfficialLine(item.raw);
        }
    );

    actionsDiv.appendChild(favoriteBtn);
    actionsDiv.appendChild(lineBtn);

    const img =
        document.createElement("img");

    img.className = "photo";
    img.src = item.photo || "";

    frontDiv.appendChild(img);
    frontDiv.appendChild(actionsDiv);

    const infoDiv =
        document.createElement("div");

    infoDiv.className =
        "front-info";

    infoDiv.innerHTML = `
        <div class="name">${item.name}</div>
        <div class="age">${item.age}</div>
    `;

    frontDiv.appendChild(infoDiv);

    const backDiv =
        document.createElement("div");

    backDiv.className =
        "inner back";

    const plfDiv =
        document.createElement("div");

    plfDiv.className = "plf";

    const dl =
        document.createElement("dl");

    dl.className = "plf-list";

    item.plf.forEach(info => {

        if (!info.value) return;

        const dt =
            document.createElement("dt");

        dt.textContent =
            `【${info.label}】`;

        const dd =
            document.createElement("dd");

        dd.textContent =
            info.value;

        dl.appendChild(dt);
        dl.appendChild(dd);
    });

    plfDiv.appendChild(dl);

    backDiv.appendChild(plfDiv);

    card.appendChild(frontDiv);
    card.appendChild(backDiv);

    card.addEventListener("click", () => {
        card.classList.toggle("flipped");
    });

    return card;
}

/* -------------------------
   検索
------------------------- */
async function searchAnimals() {

    const minAge =
        parseInt(
            document.getElementById("minAge").value
        );

    const maxAge =
        parseInt(
            document.getElementById("maxAge").value
        );

    const result = allAnimals.filter(a => {

        if (
            document.getElementById("typeDog").checked &&
            a.type !== "dog"
        ) return false;

        if (
            document.getElementById("typeCat").checked &&
            a.type !== "cat"
        ) return false;

        if (
            document.getElementById("genderMale").checked &&
            a.gender !== "male"
        ) return false;

        if (
            document.getElementById("genderFemale").checked &&
            a.gender !== "female"
        ) return false;

        if (
            document.getElementById("sterDone").checked &&
            a.sterilization !== "done"
        ) return false;

        if (
            document.getElementById("sterNotDone").checked &&
            a.sterilization === "done"
        ) return false;

        if (
            document.getElementById("diseaseFiv").checked
        ) {

            if (
                !a.diseases ||
                !a.diseases.includes("エイズ")
            ) return false;
        }

        if (
            document.getElementById("diseaseFelv").checked
        ) {

            if (
                !a.diseases ||
                !a.diseases.includes("白血病")
            ) return false;
        }

        if (
            a.age !== -1 &&
            a.age !== null &&
            a.age !== undefined
        ) {

            const age =
                parseInt(a.age);

            if (
                age < minAge ||
                age > maxAge
            ) {
                return false;
            }
        }

        return true;
    });

    renderResults(result);
}

/* -------------------------
   表示
------------------------- */
async function renderResults(data) {

    const favorites =
        await getFavoriteUUIDsFromServer();

    viewer.innerHTML = "";

    if (data.length === 0) {

        resultCount.textContent = "";

        viewer.innerHTML =
            `<div class="not-found">
                お探しのわんにゃんは見つかりませんでした
            </div>`;

        return;
    }

    resultCount.textContent =
        `${data.length}件見つかりました`;

    const cards =
        formatDataForDisplay(data);

    cards.forEach(item => {

        const card =
            makeCard(item);

        const favoriteBtn =
            card.querySelector(".favorite-btn");

        if (
            favoriteBtn &&
            favorites.includes(item.uuid)
        ) {
            favoriteBtn.classList.add("active");
            favoriteBtn.textContent = "♥";
        }

        viewer.appendChild(card);
    });
}

/* -------------------------
   初期ロード
------------------------- */
async function loadAnimals() {

    const response =
        await fetch(API_GET_URL);

    allAnimals =
        await response.json();

    resultCount.textContent =
        `${allAnimals.length}件登録されています`;

    renderResults(allAnimals);
}

searchBtn.addEventListener(
    "click",
    searchAnimals
);

initAgeSelect();
loadAnimals();