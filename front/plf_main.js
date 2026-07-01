// パスワードチェック（管理者ログインチェック）
(function() {
    if (sessionStorage.getItem('admin_logged_in') !== 'true') {
        window.location.href = "admin.html";
    } else {
        document.documentElement.style.display = "block";
    }
})();

const API_POST_URL = "/add_animal";

// Base64変換関数
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// --- メインアプリ初期化 ---
async function initApp() {
    console.log("アプリ初期化開始...");

    // fetchで読み込まれる「saveProfile」ボタンが現れるまで待機する
    let saveBtn = null;
    let retryCount = 0;
    while (!saveBtn && retryCount < 50) { // 最大5秒間待機
        saveBtn = document.getElementById("saveProfile");
        if (!saveBtn) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retryCount++;
        }
    }

    if (!saveBtn) {
        console.error("エラー: 保存ボタンが見つかりませんでした。");
        return;
    }

    console.log("要素を検出しました。セットアップを開始します。");

    const imgInput = document.getElementById("imgInput");
    const imgPreview = document.getElementById("imgPreview");
    const ageSelect = document.getElementById("ageSelect");
    const coatColorInput = document.getElementById("CoatColor");
    const personalityInput = document.getElementById("personality");

    // 1. 画像プレビューの設定
    if (imgInput && imgPreview) {
        imgInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imgPreview.src = event.target.result;
                    imgPreview.classList.remove("hidden");
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 2. セレクトボックスの生成
    if (ageSelect) {
        for (let i = 0; i <= 30; i++) {
            ageSelect.add(new Option(`${i}`, i));
        }
        ageSelect.add(new Option('不詳', -1));

        const estimateCheckbox = document.getElementById("estimateCheckbox");
        if (estimateCheckbox) {
            ageSelect.addEventListener("change", () => {
                if (ageSelect.value === "-1") {
                    estimateCheckbox.checked = false;
                    estimateCheckbox.disabled = true;
                } else {
                    estimateCheckbox.disabled = false;
                }
            });
        }
    }

    // 3. 保存ボタンのクリックイベント
    saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = "送信中...";

        try {
            const genderInput = document.querySelector('input[name="gender"]:checked');
            const sterilizationInput = document.querySelector('input[name="sterilization"]:checked');
            const file = imgInput && imgInput.files ? imgInput.files[0] : null;
            if (!file) throw new Error("画像を選択してください");
            if (!genderInput) throw new Error("性別を選択してください");
            if (!sterilizationInput) throw new Error("避妊・去勢を選択してください");
            if (!ageSelect.value) throw new Error("年齢を選択してください");

            const ageValue = parseInt(ageSelect.value, 10);
            const isEstimated = document.getElementById("estimateCheckbox") ? document.getElementById("estimateCheckbox").checked : false;

            const checkedDiseases = [
                ...document.querySelectorAll('.disease-option input[type="checkbox"]:checked')
            ]
            .filter(cb => cb.value !== "other")
            .map(cb => cb.value === "fiv" ? "エイズ" : "白血病");

            const otherDiseaseCheckbox = document.getElementById("diseaseOther");
            const otherDiseaseValue = (otherDiseaseCheckbox && otherDiseaseCheckbox.checked)
                ? document.getElementById("otherDiseaseInput").value.trim()
                : null;

            const payload = {
                type: document.querySelector('input[name="type"]:checked').value,
                gender: genderInput.value,
                age: ageValue,

                name: document.getElementById("Name").value,
                coat_color: coatColorInput ? coatColorInput.value : "",
                sterilization: sterilizationInput.value,

                diseases: checkedDiseases,
                other_disease: otherDiseaseValue,

                personality: personalityInput ? personalityInput.value : "",

                image: await toBase64(file),
                is_estimated: isEstimated
            };

            // サーバーにデータを送信
            const res = await fetch(API_POST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const resultData = await res.json();
                // サーバー側で発行された本物のUUID（resultData.uuid）を受け取る
                location.reload();
            } else {
                const err = await res.json();
                alert("エラー: " + JSON.stringify(err.detail));
            }
        } catch (e) {
            alert(e.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "保存";
        }
    });
}

// アプリケーションの起動
initApp();
