// 【重要】FastAPIサーバーの POST エンドポイントURL
// サーバーが http://localhost:8000/ で起動していることを前提
const API_POST_URL = "/add_animal"; 

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
    monthSelect.appendChild(option); // 'manthSelect'ではなく'monthSelect'が正しい前提で修正
}

// ---------- Base64 変換 (非同期処理) ----------
function toBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// --- ローカル保存ロジックは削除 (generateIncrementId, saveProfileData) ---

// ---------- フォームリセット ----------
function resetForm() {
    document.getElementById("Name").value = "";
    document.getElementById("Breed").value = "";
    document.getElementById("ProtectDay").value = "";
    document.getElementById("birthday").value = "";
    document.getElementById("meBio").value = "";

    // セレクトボックスの値をリセット（仮にIDが存在すると想定）
    const typeSelect = document.querySelector("#typeSelect");
    if (typeSelect) typeSelect.value = "";
    const genderSelect = document.querySelector("#genderSelect");
    if (genderSelect) genderSelect.value = "";
    
    ageSelect.value = 0;
    monthSelect.value = 0; // 'manthSelect'ではなく'monthSelect'が正しい前提で修正

    const preview = document.getElementById("imgPreview");
    preview.src = "";
    preview.classList.add("hidden");

    document.getElementById("imgInput").value = "";
}


// ---------- 保存ボタン処理 (FastAPI連携に置き換え) ----------
document.getElementById("saveProfile").addEventListener("click", async () => {

    // 1. フォームデータの取得
    // HTMLのセレクタを修正後のものに仮定（document.querySelectorAll(".selectbox-2 select")[x]を避ける）
    const type = document.querySelector("#typeSelect").value;
    const gender = document.querySelector("#genderSelect").value;
    
    // 値をFastAPIのPydanticモデルに合わせて数値(int)に変換
    const age = parseInt(document.getElementById("ageSelect").value);
    const month = parseInt(document.getElementById("manthSelect").value);

    const name = document.getElementById("Name").value;
    const breed = document.getElementById("Breed").value;
    const protectDay = document.getElementById("ProtectDay").value;
    const birthday = document.getElementById("birthday").value;
    const bio = document.getElementById("meBio").value;

    const file = document.getElementById("imgInput").files[0];
    
    // 2. Base64 変換とバリデーション
    let imageBase64 = "";
    if (file) {
      imageBase64 = await toBase64(file);
    } else {
        alert("画像ファイルは必須です。");
        return; 
    }
    
    // 必須フィールドの簡易チェック
    if (!type || !gender || !name || !protectDay || !birthday) {
        alert("必須項目が入力されていません。");
        return;
    }

    // 3. FastAPIのPydanticモデルに一致するデータ構造を作成
    const profileData = {
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

    // 4. FastAPIサーバーへ POST リクエストを送信
    try {
        const response = await fetch(API_POST_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(profileData) 
        });

        const result = await response.json(); 

        if (response.ok) {
            // サーバー処理成功 (通常 201 Created)
            alert(`FastAPIサーバーに登録しました！\nUUID: ${result.uuid}`);
            resetForm();
        } else {
            // サーバー側でエラーが発生 (バリデーションエラーなど)
            let errorMessage = `登録エラー (${response.status}): ${result.detail || result.message || JSON.stringify(result)}`;
            alert(errorMessage);
            console.error('API Error:', result);
        }
        resetForm();

    } catch (error) {
        // ネットワークエラー
        alert("通信エラー: FastAPIサーバーが起動しているか、またはネットワーク接続を確認してください。");
        console.error('Fetch Error:', error);
    }
});