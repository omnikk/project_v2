from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# В Docker БД лежит в /app/data/, локально — рядом с файлом
if os.path.exists("/app/data"):
    DATABASE_URL = "sqlite:////app/data/salon_data.db"
else:
    DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'salon_data.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()