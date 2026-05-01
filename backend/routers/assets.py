from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import os
import shutil
from typing import List

router = APIRouter(
    prefix="/assets",
    tags=["assets"]
)

ASSETS_DIR = os.getenv("NEXUS_ASSETS_DIR", "./data/assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

@router.post("/")
async def upload_asset(
    file: UploadFile = File(...), 
    project_id: str = Form(None), 
    db: Session = Depends(get_db)
):
    # Ensure directory exists for project if provided
    save_dir = os.path.join(ASSETS_DIR, project_id) if project_id else ASSETS_DIR
    os.makedirs(save_dir, exist_ok=True)
    
    file_path = os.path.join(save_dir, file.filename)
    
    # Save the file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Relative path for DB storage (e.g. project_id/filename.png or filename.png)
    rel_path = os.path.join(project_id, file.filename) if project_id else file.filename
    
    # Save metadata to database
    db_asset = models.Asset(
        filename=file.filename,
        file_path=rel_path,
        mime_type=file.content_type,
        project_id=project_id
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    return {"id": db_asset.id, "filename": db_asset.filename, "path": db_asset.file_path}

@router.get("/")
def list_assets(project_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Asset)
    if project_id:
        query = query.filter(models.Asset.project_id == project_id)
    else:
        query = query.filter(models.Asset.project_id.is_(None))
    return query.all()

@router.get("/{asset_id}/download")
def download_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    full_path = os.path.join(ASSETS_DIR, db_asset.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File missing on disk")
        
    return FileResponse(path=full_path, filename=db_asset.filename, media_type=db_asset.mime_type)

@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    full_path = os.path.join(ASSETS_DIR, db_asset.file_path)
    if os.path.exists(full_path):
        os.remove(full_path)
        
    db.delete(db_asset)
    db.commit()
    return {"status": "deleted"}
