const API_FAVORITE_URL = "/favorites";
const LINE_OFFICIAL_ACCOUNT_ID = "@889qbfcv";

function escapeHtml(s){
    if(!s) return '';
    return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

function formatDataForDisplay(data){

    return data.map(p=>{

        let ageStr = "不詳";

        if(
            p.age !== undefined &&
            p.age !== null &&
            p.age !== -1 &&
            p.age !== "-1"
        ){

            const ageNum =
                parseInt(p.age,10);

            if(!isNaN(ageNum)){

                ageStr = `${ageNum}歳`;

                if(p.is_estimated){
                    ageStr += "（推定）";
                }
            }
        }

        const diseaseList = [];

        if(p.diseases){

            p.diseases.forEach(d=>{

                if(d && d !== "other"){
                    diseaseList.push(d);
                }

            });
        }

        if(p.other_disease){
            diseaseList.push(
                p.other_disease
            );
        }

        const diseaseStr =
            diseaseList.length
            ? diseaseList.join(" / ")
            : "特になし";

        return {

            raw:p,

            photo:p.image,

            name:p.name || "不明",

            age:ageStr,

            kind:
                p.type==="dog" ? "犬" :
                p.type==="cat" ? "猫" :
                "動物",

            plf:[
                {
                    label:"名前",
                    value:p.name || "不明"
                },
                {
                    label:"年齢",
                    value:ageStr
                },
                {
                    label:"性別",
                    value:
                        p.gender==="male"
                        ? "男の子"
                        : "女の子"
                },
                {
                    label:"毛色",
                    value:
                        p.coat_color ||
                        "不明"
                },
                {
                    label:"避妊・去勢",
                    value:
                        p.sterilization==="done"
                        ? "済"
                        : "未"
                },
                {
                    label:"病歴",
                    value:diseaseStr
                },
                {
                    label:"性格",
                    value:
                        p.personality ||
                        ""
                }
            ],

            uuid:p.uuid
        };

    });
}

async function toggleFavorite(profile,button){

    const active =
        button.classList.contains(
            "active"
        );

    if(!active){

        const res = await fetch(
            API_FAVORITE_URL,
            {
                method:"POST",
                headers:{
                    "Content-Type":
                    "application/json"
                },
                body:JSON.stringify({
                    uuid:profile.uuid
                })
            }
        );

        if(res.ok){

            button.classList.add(
                "active"
            );

            button.textContent="♥";
        }

    }else{

        const res = await fetch(
            `${API_FAVORITE_URL}/${profile.uuid}`,
            {
                method:"DELETE"
            }
        );

        if(res.ok){

            button.classList.remove(
                "active"
            );

            button.textContent="♡";
        }
    }
}

function buildLineMessage(profile){

    return `
契約について問い合わせしたいです。

UUID:${profile.uuid}
名前:${profile.name}
`
.trim();
}

function openOfficialLine(profile){

    const msg =
        buildLineMessage(profile);

    const url =
`https://line.me/R/oaMessage/${encodeURIComponent(LINE_OFFICIAL_ACCOUNT_ID)}/?${encodeURIComponent(msg)}`;

    window.location.href = url;
}

function makeCard(item){

    const card =
        document.createElement("div");

    card.className="card";

    card.innerHTML=`
<div class="inner front">

<div class="card-actions">

<button
class="icon-btn favorite-btn">
♡
</button>

<button
class="icon-btn line-btn">
↗
</button>

</div>

<img
class="photo"
src="${item.photo || ""}">

<div class="front-info">

<div class="name">
${item.name}
</div>

<div class="age">
${item.age}
</div>

</div>

</div>

<div class="inner back">

<div class="plf">

<dl class="plf-list">

${item.plf.map(x=>`
<dt>【${x.label}】</dt>
<dd>${escapeHtml(x.value)}</dd>
`).join("")}

</dl>

<div class="uuid">
UUID: ${item.uuid}
</div>

</div>

</div>
`;

    card.addEventListener(
        "click",
        ()=>{
            card.classList.toggle(
                "flipped"
            );
        }
    );

    const favoriteBtn =
        card.querySelector(
            ".favorite-btn"
        );

    favoriteBtn.addEventListener(
        "click",
        async e=>{

            e.stopPropagation();

            await toggleFavorite(
                item.raw,
                favoriteBtn
            );

        }
    );

    const lineBtn =
        card.querySelector(
            ".line-btn"
        );

    lineBtn.addEventListener(
        "click",
        e=>{

            e.stopPropagation();

            openOfficialLine(
                item.raw
            );

        }
    );

    return card;
}