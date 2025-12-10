// ---------- 画像プレビュー ----------
document.getElementById("imgInput").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById("imgPreview");
    preview.src = URL.createObjectURL(file);
    preview.classList.remove("hidden");
});

// ---------- 年齢セレクト作成 ----------
const ageSelect = document.getElementById("ageSelect");
for (let age = 0; age <= 35; age++) {
    const option = document.createElement("option");
    option.value = age;
    option.textContent = `${age}歳`;
    ageSelect.appendChild(option);
}

const monthSelect = document.getElementById("manthSelect");
for (let m = 0; m <= 11; m++) {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = `${m}ヶ月`;
    monthSelect.appendChild(option);
}

// ---------- Base64 変換 ----------
function toBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// ---------- 自動 ID 発行 ----------
function generateIncrementId() {
    let lastId = Number(localStorage.getItem("last_profile_id")) || 0;
    lastId += 1;
    localStorage.setItem("last_profile_id", lastId);
    return lastId;
}

// ---------- データ保存 ----------
function saveProfileData(profile) {
    let profiles = JSON.parse(localStorage.getItem("profiles")) || [];
    profiles.push(profile);
    localStorage.setItem("profiles", JSON.stringify(profiles));
}

// ---------- フォームリセット ----------
function resetForm() {
    // テキスト・日付入力のクリア
    document.getElementById("Name").value = "";
    document.getElementById("Breed").value = "";
    document.getElementById("ProtectDay").value = "";
    document.getElementById("birthday").value = "";
    document.getElementById("meBio").value = "";

    // セレクトボックス初期化
    document.querySelectorAll(".selectbox-2 select")[0].value = "";
    document.querySelectorAll(".selectbox-2 select")[1].value = "";
    document.getElementById("ageSelect").value = "0";
    document.getElementById("manthSelect").value = "0";

    // 画像プレビュークリア
    const preview = document.getElementById("imgPreview");
    preview.src = "";
    preview.classList.add("hidden");

    // ファイル選択クリア
    document.getElementById("imgInput").value = "";
}


// ---------- 保存ボタン処理 ----------
document.getElementById("saveProfile").addEventListener("click", async () => {

    const id = generateIncrementId();

    const type = document.querySelectorAll(".selectbox-2 select")[0].value;
    const gender = document.querySelectorAll(".selectbox-2 select")[1].value;

    const age = document.getElementById("ageSelect").value;
    const month = document.getElementById("manthSelect").value;

    const name = document.getElementById("Name").value;
    const breed = document.getElementById("Breed").value;
    const protectDay = document.getElementById("ProtectDay").value;
    const birthday = document.getElementById("birthday").value;
    const bio = document.getElementById("meBio").value;

    const file = document.getElementById("imgInput").files[0];
    let imageBase64 = "";
    if (file) imageBase64 = await toBase64(file);

    const profileData = {
        id,
        type,
        gender,
        age,
        month,
        name,
        breed,
        protect_day: protectDay,
        birthday,
        bio,
        image: imageBase64
    };

    saveProfileData(profileData);

    alert(`ID ${id} で登録しました`);
    
    resetForm();
});
