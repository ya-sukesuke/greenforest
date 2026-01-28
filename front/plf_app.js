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

   // --- 共通のDOM要素取得 ---
const imgInput = document.getElementById("imgInput");
const imgPreview = document.getElementById("imgPreview");
const birthdayInput = document.getElementById("birthday");
const protectDayInput = document.getElementById("ProtectDay");
const tensionRange = document.getElementById("tensionRange");
const tensionValue = document.getElementById("tensionValue");

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

// 2. 緊張度スライダーの数値表示更新
if (tensionRange && tensionValue) {
    // スライダーを動かすたびに実行される
    tensionRange.addEventListener("input", (e) => {
        const val = e.target.value;
        tensionValue.textContent = val; // HTML上の数字（<span id="tensionValue">）を書き換え
    });
}

// 3. 保存ボタンのクリックイベント
saveBtn.addEventListener("click", async () => {
    // ボタンの無効化
    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "送信中...";

    try {
        const file = imgInput.files[0];
        if (!file) throw new Error("画像を選択してください");

        // --- 送信直前に最新の入力値を取得 ---
        
        // ラジオボタン系
        const type = document.querySelector('input[name="type"]:checked')?.value;
        const gender = document.querySelector('input[name="gender"]:checked')?.value;
        const operated = document.querySelector('input[name="sterilization"]:checked')?.value;
        const tension = parseInt(document.getElementById("tensionRange").value);

        // チェックボックス（病歴）
        const diseases = Array.from(document.querySelectorAll('.disease-group input[type="checkbox"]:checked'))
            .filter(cb => cb.id !== "diseaseOther") // 「その他」チェックボックス自体は除外
            .map(cb => cb.value);

        const otherDisease = document.getElementById("diseaseOther").checked 
            ? document.getElementById("otherDiseaseInput").value 
            : null;

        // ペイロードの構築
        const payload = {
            type: type,
            gender: gender,
            name: document.getElementById("Name").value,
            breed: document.getElementById("Breed").value,
            birthday: birthdayInput.value,
            protect_day: protectDayInput.value,
            operated: operated,
            diseases: diseases,
            other_disease: otherDisease,
            tension: tension,
            bio: document.getElementById("meBio").value,
            image: await toBase64(file)
        };

        const res = await fetch(API_POST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("登録が完了しました！");
            location.reload();
        } else {
            // ステータスコードを含めてエラーを詳細化
            const err = await res.json();
            let errorMessage = `サーバーエラー (Status: ${res.status})\n`;
            
            if (res.status === 422) {
                // FastAPIのバリデーションエラー（Pydanticエラー）の場合
                errorMessage += "【入力形式エラー】以下の項目を確認してください:\n";
                err.detail.forEach(d => {
                    errorMessage += `- ${d.loc.join('.')}: ${d.msg}\n`;
                });
            } else {
                // その他のエラー
                errorMessage += `詳細: ${err.detail || JSON.stringify(err)}`;
            }
            
            console.error("Server Response Error:", err);
            alert(errorMessage);
        }
    } catch (e) {
        // fetch自体に失敗した場合（ネットワークエラーなど）
        console.error("Fetch/Client Error:", e);
        alert(`クライアント側エラーが発生しました:\n${e.message}\n\n※コンソールログを確認してください。`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
});
}

// 最後にこの関数を呼び出す
initApp();