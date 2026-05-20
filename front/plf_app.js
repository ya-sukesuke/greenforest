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
    alert("JavaScriptが正常に起動しました！"); // 動作確認用

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

            // サーバー(server.py)のAddAnimalRequestモデルの要求定義に完全準拠したデータ構造
            const payload = {
                type: document.querySelector('input[name="type"]:checked').value,
                gender: document.querySelector('input[name="gender"]:checked').value,
                
                // 【修正】キー名を server.py に合わせて operated に変更
                operated: document.querySelector('input[name="sterilization"]:checked').value === "done" ? "done" : "not_done",

                age: parseInt(ageSelect.value) || 0,
                month: parseInt(monthSelect.value) || 0,

                name: document.getElementById("Name").value,
                breed: document.getElementById("Breed").value,

                birthday: document.getElementById("birthday").value,
                protect_day: document.getElementById("ProtectDay").value,

                // 【修正】文字列ではなく整数(int)として送信するために parseInt を実行
                tension: parseInt(document.getElementById("tensionRange").value) || 3,
                
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

            // サーバーにデータを送信
            const res = await fetch(API_POST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const resultData = await res.json();
                // サーバー側で発行された本物のUUID（resultData.uuid）を受け取る
                alert(`登録が完了しました！\nUUID: ${resultData.uuid}`);
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