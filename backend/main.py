from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import vault, notes, snapshots, git, commands, projects, search, assets, rag, services

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nexus-DevOS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vault.router)
app.include_router(notes.router)
app.include_router(snapshots.router)
app.include_router(git.router)
app.include_router(commands.router)
app.include_router(projects.router)
app.include_router(search.router)
app.include_router(assets.router)
app.include_router(rag.router)
app.include_router(services.router)

@app.get('/')
def read_root():
    return {'status': 'Nexus-DevOS API is running'}
