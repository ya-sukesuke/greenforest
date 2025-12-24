from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # 追加
from pydantic import BaseModel
from typing import Literal
from datetime import date
import uuid
import os
import json
import base64
import uvicorn

SAVE_FILE_PATH = "save.json"
IMAGE_SAVE_DIR = "images/"

app = FastAPI()


# CORS設定（同じサーバー内なら不要ですが、開発用に残します）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AddAnimalRequest(BaseModel):
    type: Literal['dog', 'cat']
    gender: Literal['male', 'female']
    age: int
    month: int
    name: str
    breed: str
    birthday: date
    protect_day: date
    bio: str
    image: str

@app.post("/add_animal")
def add_animal(request: AddAnimalRequest):
    new_uuid = uuid.uuid4()
    
    if not os.path.exists(SAVE_FILE_PATH):
        with open(SAVE_FILE_PATH, 'w', encoding='utf-8') as f:
            f.write("[]")

    with open(SAVE_FILE_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    new_entry = request.dict()
    # dateオブジェクトはJSON保存できないので文字列に変換
    new_entry['birthday'] = str(new_entry['birthday'])
    new_entry['protect_day'] = str(new_entry['protect_day'])
    new_entry['uuid'] = str(new_uuid)
    
    data.append(new_entry)
    with open(SAVE_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    # 画像保存
    try:
        splitString = request.image.split(",")
        img_binary = base64.b64decode(splitString[1]) 
        
        if not os.path.isdir(IMAGE_SAVE_DIR):
            os.makedirs(IMAGE_SAVE_DIR)
            
        with open(os.path.join(IMAGE_SAVE_DIR, f"{new_uuid}.png"), 'wb') as f:
           f.write(img_binary) 
    except Exception as e:
        print(f"Image save error: {e}")

    return {"message": "Animal successfully registered.", "uuid": str(new_uuid)}

@app.get("/animals")
def get_animals():
    if not os.path.exists(SAVE_FILE_PATH):
        return []
    with open(SAVE_FILE_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

# --- 重要：静的ファイルの配信設定 ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONT_DIR = os.path.join(BASE_DIR, "..", "front")

# front フォルダが存在するかチェック（デバッグ用）
if not os.path.exists(FRONT_DIR):
    print(f"警告: frontフォルダが見つかりません: {FRONT_DIR}")

# マウント設定を修正
app.mount("/", StaticFiles(directory=FRONT_DIR, html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)