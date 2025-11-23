from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import feeders, events, audit

app = FastAPI(title="FLUXEON Backend", version="0.1.0")

# 🔥 CORS: permitir frontend en 3000
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(feeders.router, prefix="/feeders", tags=["feeders"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(audit.router, prefix="/audit", tags=["audit"])


@app.get("/")
def root():
    return {"status": "ok", "service": "fluxeon-backend"}