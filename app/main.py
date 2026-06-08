from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import app.models
from app.core.deps import get_db
from app.api.api_router import router


app = FastAPI()

app.include_router(router)

@app.get("/")
def test_db(db: Session = Depends(get_db)):
    return {"message": "Conexión exitosa 🚀"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#http://localhost:5173