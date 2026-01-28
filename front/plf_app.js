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

// --- ここからが「3.」のメイン部分 ---
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
    alert("JavaScriptが正常に起動しました！"); // 動作確認用

    // --- 以降、これまでのセットアップ処理をここにまとめる ---

    const imgInput = document.getElementById("imgInput");
    const imgPreview = document.getElementById("imgPreview");
    const ageSelect = document.getElementById("ageSelect");
    const monthSelect = document.getElementById("monthSelect");

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
            ageSelect.add(new Option(`${i}歳`, i));
        }
    }
    if (monthSelect) {
        for (let i = 0; i <= 11; i++) {
            monthSelect.add(new Option(`${i}ヶ月`, i));
        }
    }

    // 3. 保存ボタンのクリックイベント
    saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = "送信中...";

        try {
            const file = imgInput.files[0];
            if (!file) throw new Error("画像を選択してください");

            const payload = {
                type: document.querySelector('input[name="type"]:checked').value,
                gender: document.querySelector('input[name="gender"]:checked').value,
                sterilization: document.querySelector('input[name="sterilization"]:checked').value,

                age: parseInt(ageSelect.value),
                month: parseInt(monthSelect.value),

                name: document.getElementById("Name").value,
                breed: document.getElementById("Breed").value,

                birthday: document.getElementById("birthday").value,
                protect_day: document.getElementById("ProtectDay").value,

                tension: document.getElementById("tensionRange").value,
                bio: document.getElementById("meBio").value,

                diseases: [
                ...document.querySelectorAll('.disease-option input[type="checkbox"]:checked')
                ].map(cb => {
                if (cb.value === "other") {
                    return document.getElementById("otherDiseaseInput").value;
                }
                return cb.value === "fiv" ? "エイズ" : "白血病";
                }),

                image: await toBase64(file)
            };

            // display.html 用に保存
            localStorage.setItem("animalData", JSON.stringify(payload));

            const res = await fetch(API_POST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("登録が完了しました！");
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

// 最後にこの関数を呼び出す
initApp();