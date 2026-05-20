from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Literal, List, Optional
from datetime import date
import uuid
import os
import json
import base64
from pathlib import Path
from fastapi.responses import FileResponse

SAVE_FILE_PATH = "save.json"
FAVORITES_FILE_PATH = "favorites.json"  # ★お気に入り保存用のファイルパス
IMAGE_SAVE_DIR = "images"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. リクエストモデル ---
class AddAnimalRequest(BaseModel):
    type: Literal['dog', 'cat']
    gender: Literal['male', 'female']
    age: Optional[int] = 0
    month: Optional[int] = 0
    name: str
    breed: str
    birthday: str 
    protect_day: str
    
    # 新しく追加されたフィールド
    operated: Literal['done', 'not_done'] # 避妊・去勢
    diseases: List[str]                  # 病歴（配列）
    other_disease: Optional[str] = None  # その他病名
    tension: int                         # 緊張度 (1-5)
    
    bio: str
    image: str

# ★お気に入り登録用のリクエストモデル
class FavoriteRequest(BaseModel):
    uuid: str

# --- 共通ヘルパー関数：お気に入りデータの読み書き ---
def load_favorites() -> List[str]:
    if not os.path.exists(FAVORITES_FILE_PATH):
        return []
    try:
        with open(FAVORITES_FILE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_favorites(favorites: List[str]):
    try:
        with open(FAVORITES_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(favorites, f, indent=4, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Favorites write error: {e}")


# --- 動物データ取得・追加エンドポイント ---
@app.get("/animals")
def get_animals():
    if not os.path.exists(SAVE_FILE_PATH):
        return []
    try:
        with open(SAVE_FILE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Read error: {e}")

@app.post("/add_animal")
def add_animal(request: AddAnimalRequest):
    new_uuid = str(uuid.uuid4())
    data = []
    if os.path.exists(SAVE_FILE_PATH):
        with open(SAVE_FILE_PATH, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []

    # データのダンプと整形
    new_entry = request.model_dump()
    new_entry['uuid'] = new_uuid
    
    # 画像のデコードと保存
    try:
        if "," in request.image:
            img_binary = base64.b64decode(request.image.split(",")[1])
            if not os.path.exists(IMAGE_SAVE_DIR):
                os.makedirs(IMAGE_SAVE_DIR)
            with open(os.path.join(IMAGE_SAVE_DIR, f"{new_uuid}.png"), 'wb') as f:
               f.write(img_binary) 
    except Exception as e:
        print(f"Image save error: {e}")

    data.append(new_entry)
    with open(SAVE_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    return {"message": "Success", "uuid": new_uuid}


# --- ★新設：お気に入り（Favorites）関連エンドポイント ---

# ① お気に入り状態の確認 (GET /favorites/{uuid})
@app.get("/favorites/{uuid}")
def check_favorite(uuid: str):
    favorites = load_favorites()
    is_favorite = uuid in favorites
    return {"is_favorite": is_favorite}

# ② お気に入り登録 (POST /favorites)
@app.post("/favorites")
def add_favorite(request: FavoriteRequest):
    favorites = load_favorites()
    if request.uuid not in favorites:
        favorites.append(request.uuid)
        save_favorites(favorites)
    return {"status": "success", "message": "Registered"}

# ③ お気に入り解除 (DELETE /favorites/{uuid})
@app.delete("/favorites/{uuid}")
def remove_favorite(uuid: str):
    favorites = load_favorites()
    if uuid in favorites:
        favorites.remove(uuid)
        save_favorites(favorites)
        return {"status": "success", "message": "Deleted"}
    raise HTTPException(status_code=404, detail="UUID not found in favorites")


# --- 静的ファイル配信関連 ---
BASE_DIR = Path(__file__).resolve().parent
FRONT_DIR = BASE_DIR / "front"

@app.get("/")
async def read_index():
    index_path = FRONT_DIR / "index.html"
    return FileResponse(index_path) if index_path.exists() else {"msg": "No index.html"}

if os.path.exists(FRONT_DIR):
    app.mount("/", StaticFiles(directory=str(FRONT_DIR), html=True), name="front")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)