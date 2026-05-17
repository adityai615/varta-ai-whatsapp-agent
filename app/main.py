from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.db import Base, engine
from app.api.business import router as business_router
from app.api.messages import router as messages_router
from app.api.webhook import router as webhook_router


def create_app() -> FastAPI:
    app = FastAPI(title="Varta AI", version="0.1.0")

    cors_origins = (os.getenv("CORS_ORIGINS") or "http://localhost:5173,http://127.0.0.1:5173,http://0.0.0.0:5173").split(",")
    cors_origins = [o.strip().strip('"').strip("'") for o in cors_origins if o.strip()]
    cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX") or r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$"
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Base.metadata.create_all(bind=engine)
    app.include_router(business_router)
    app.include_router(messages_router)
    app.include_router(webhook_router)
    return app


app = create_app()
