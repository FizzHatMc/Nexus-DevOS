from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/commands",
    tags=["commands"]
)

@router.post("/", response_model=schemas.CommandResponse)
def create_command(cmd: schemas.CommandCreate, db: Session = Depends(get_db)):
    db_cmd = models.CommandSnippet(**cmd.model_dump())
    db.add(db_cmd)
    db.commit()
    db.refresh(db_cmd)
    return db_cmd

@router.get("/", response_model=List[schemas.CommandResponse])
def list_commands(project_id: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.CommandSnippet)
    if project_id:
        query = query.filter(models.CommandSnippet.project_id == project_id)
    else:
        query = query.filter(models.CommandSnippet.project_id.is_(None))
    return query.offset(skip).limit(limit).all()

@router.delete("/{cmd_id}")
def delete_command(cmd_id: int, db: Session = Depends(get_db)):
    db_cmd = db.query(models.CommandSnippet).filter(models.CommandSnippet.id == cmd_id).first()
    if not db_cmd:
        raise HTTPException(status_code=404, detail="Command not found")
    db.delete(db_cmd)
    db.commit()
    return {"status": "deleted"}
