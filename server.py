from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Literal, List, Optional, Union
import uuid
import os
import base64
from pathlib import Path
from fastapi.responses import FileResponse
# --- Supabase用のライブラリを追加 ---
from supabase import create_client, Client

# 環境変数からSupabaseの接続情報を取得
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ 警告: SUPABASE_URL または SUPABASE_KEY が設定されていません。ローカル環境の場合は環境変数を確認してください。")

# Supabaseクライアントの初期化
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- リクエストモデル ---
class AddAnimalRequest(BaseModel):
    type: Literal['dog', 'cat']
    gender: Literal['male', 'female']
    age: int
    name: str
    coat_color: str
    sterilization: Literal['done', 'not_done']
    diseases: List[str]
    other_disease: Optional[str] = None
    personality: str
    image: str
    is_estimated: bool = False

class FavoriteRequest(BaseModel):
    uuid: str


# --- 動物データ取得・追加エンドポイント ---
@app.get("/animals")
def get_animals():
    try:
        # Supabaseのanimalsテーブルから全データを取得
        response = supabase.table("animals").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Read error: {e}")

@app.post("/add_animal")
def add_animal(request: AddAnimalRequest):
    new_uuid = str(uuid.uuid4())
    image_url = ""

    # 画像のデコードとSupabase Storageへのアップロード
    try:
        if "," in request.image:
            img_binary = base64.b64decode(request.image.split(",")[1])
            
            # 'images' バケットに、[uuid].png という名前でバイナリをアップロード
            supabase.storage.from_("images").upload(
                path=f"{new_uuid}.png",
                file=img_binary,
                file_options={"content-type": "image/png"}
            )
            # アップロードした画像の公開URLを取得
            image_url = supabase.storage.from_("images").get_public_url(f"{new_uuid}.png")
    except Exception as e:
        print(f"Image save error: {e}")

    # データベースに挿入するデータの整形
    new_entry = request.model_dump()
    new_entry['uuid'] = new_uuid
    new_entry['image'] = image_url  # Base64文字列の代わりに画像のURLを保存する

    try:
        # Supabaseのanimalsテーブルにデータを1行追加
        supabase.table("animals").insert(new_entry).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert error: {e}")

    return {"message": "Success", "uuid": new_uuid}


# --- お気に入り（Favorites）関連エンドポイント ---

@app.get("/favorites")
def get_all_favorites():
    try:
        response = supabase.table("favorites").select("uuid").execute()
        return [row["uuid"] for row in response.data]
    except Exception:
        return []

@app.get("/favorites/{uuid}")
def check_favorite(uuid: str):
    try:
        response = supabase.table("favorites").select("uuid").eq("uuid", uuid).execute()
        is_favorite = len(response.data) > 0
        return {"is_favorite": is_favorite}
    except Exception:
        return {"is_favorite": False}

@app.post("/favorites")
def add_favorite(request: FavoriteRequest):
    try:
        # 重複を避けるためupsert（あれば更新、なければ挿入）を使用
        supabase.table("favorites").upsert({"uuid": request.uuid}).execute()
        return {"status": "success", "message": "Registered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")

@app.delete("/favorites/{uuid}")
def remove_favorite(uuid: str):
    try:
        response = supabase.table("favorites").delete().eq("uuid", uuid).execute()
        return {"status": "success", "message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")

@app.delete("/animals/{uuid}")
def delete_animal(uuid: str):
    try:
        # 1. お気に入りテーブルから削除（存在する場合のみ）
        try:
            supabase.table("favorites").delete().eq("uuid", uuid).execute()
        except Exception as fe:
            print(f"Warning: Failed to delete from favorites table: {fe}")

        # 2. Supabase Storage から画像を削除 (画像名は uuid.png)
        try:
            supabase.storage.from_("images").remove([f"{uuid}.png"])
        except Exception as se:
            print(f"Warning: Failed to delete image from storage: {se}")

        # 3. animalsテーブルからデータを削除
        response = supabase.table("animals").delete().eq("uuid", uuid).execute()
        
        return {"status": "success", "message": "Animal and its image deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting animal: {e}")



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
    # Renderのポート番号自動割当に対応
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)