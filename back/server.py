from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    new_uuid = uuid.uuid4() # 変数名をuuidからnew_uuidに変更 (Pythonのuuidモジュールと被らないように)

    # 【修正箇所1】os.exists -> os.path.exists
    if not os.path.exists(SAVE_FILE_PATH):
        with open(SAVE_FILE_PATH, 'w') as f:
            f.write("[]")

    with open(SAVE_FILE_PATH, 'r') as f:
        data = json.load(f)

    new_entry = request.dict()
    new_entry['uuid'] = str(new_uuid)
    data.append(new_entry)
    with open(SAVE_FILE_PATH, 'w') as f:
        json.dump(data, f, indent=4)

    splitString = request.image.split(",")
    # Base64本体は最後の要素 (splitString[1]で正しいケースが多いが、念のためsplitString[-1]も考慮)
    img_binary = base64.b64decode(splitString[1]) 
    
    # os.path.isdir は元々正しい
    if not os.path.isdir(IMAGE_SAVE_DIR):
        os.makedirs(IMAGE_SAVE_DIR)
        
    with open(IMAGE_SAVE_DIR + str(new_uuid) + ".png", 'wb') as f:
       f.write(img_binary) 
    
    # 成功レスポンスを追加（推奨）
    return {"message": "Animal successfully registered.", "uuid": str(new_uuid)} 

@app.get("/animals")
def get_animals():
    # 【修正箇所2】os.exists -> os.path.exists
    if not os.path.exists(SAVE_FILE_PATH):
        return []
    try:
        with open(SAVE_FILE_PATH, 'r') as f:
            data = json.load(f)
        return data
    except json.JSONDecodeError:
        # ファイルが空や不正なJSONの場合の簡易エラー処理
        return []


if __name__ == "__main__":
    # 他のPCやブラウザからのアクセスを許可するため、host="0.0.0.0"を推奨
    uvicorn.run(app, host="0.0.0.0", port=8000)