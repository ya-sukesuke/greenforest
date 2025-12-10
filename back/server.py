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
    uuid=uuid.uuid4()

    if not os.exists(SAVE_FILE_PATH):
        with open(SAVE_FILE_PATH, 'w') as f:
            f.write("[]")

    with open(SAVE_FILE_PATH, 'r') as f:
        data = json.load(f)

    new_entry = request.dict()
    new_entry['uuid'] = str(uuid)
    data.append(new_entry)
    with open(SAVE_FILE_PATH, 'w') as f:
        json.dump(data, f, indent=4)

    splitString = request.image.split(",")
    img_binary = base64.b64decode(splitString[1]) 
    if not os.path.isdir(IMAGE_SAVE_DIR):
        os.makedirs(IMAGE_SAVE_DIR)
    with open(IMAGE_SAVE_DIR + str(uuid) + ".png", 'wb') as f:
       f.write(img_binary) 

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)