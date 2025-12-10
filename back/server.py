from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AddAnimalRequest(BaseModel):
    type: str
    gender: str
    age: int
    month: int
    name: str
    breed: str
    protect_day: str
    birthday: str
    bio: str
    image_url: str

@app.post("/add_animal")
def add_animal()