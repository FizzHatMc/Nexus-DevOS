from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, notes_manager
from database import get_db

router = APIRouter(
    prefix="/notes",
    tags=["notes"]
)

@router.post("/", response_model=schemas.NoteResponse)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    filename = note.filename
    if not filename.endswith(".md"):
        filename += ".md"
        
    frontmatter = {
        "title": note.title,
        "tags": note.tags,
        "project_id": note.project_id
    }
    
    # Write to file system
    updated_fm = notes_manager.write_note(filename, frontmatter, note.content)
    
    # Sync to DB
    note_id = updated_fm.get("id")
    db_note = db.query(models.NoteMeta).filter(models.NoteMeta.id == note_id).first()
    
    if not db_note:
        db_note = models.NoteMeta(
            id=note_id,
            title=note.title,
            file_path=filename,
            tags=note.tags,
            project_id=note.project_id
        )
        db.add(db_note)
    else:
        db_note.title = note.title
        db_note.tags = note.tags
        db_note.project_id = note.project_id
        
    db.commit()
    db.refresh(db_note)
    
    return schemas.NoteResponse(
        id=db_note.id,
        filename=filename,
        title=note.title,
        tags=note.tags,
        project_id=note.project_id,
        content=note.content,
        frontmatter=updated_fm,
        created_at=db_note.created_at,
        updated_at=db_note.updated_at
    )

@router.get("/", response_model=List[schemas.NoteMetaResponse])
def list_notes(project_id: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.NoteMeta)
    if project_id:
        query = query.filter(models.NoteMeta.project_id == project_id)
    else:
        # If no project_id is specified, return global notes (where project_id is null)
        query = query.filter(models.NoteMeta.project_id.is_(None))
    return query.offset(skip).limit(limit).all()

@router.get("/{filename}", response_model=schemas.NoteResponse)
def get_note(filename: str, db: Session = Depends(get_db)):
    if not filename.endswith(".md"):
        filename += ".md"
        
    frontmatter, content = notes_manager.read_note(filename)
    if frontmatter is None:
        raise HTTPException(status_code=404, detail="Note not found")
        
    note_id = frontmatter.get("id", filename.replace(".md", ""))
    db_note = db.query(models.NoteMeta).filter(models.NoteMeta.id == note_id).first()
    
    return schemas.NoteResponse(
        id=note_id,
        filename=filename,
        title=frontmatter.get("title", ""),
        tags=frontmatter.get("tags", ""),
        content=content,
        frontmatter=frontmatter,
        created_at=db_note.created_at if db_note else None,
        updated_at=db_note.updated_at if db_note else None
    )

@router.delete("/{filename}")
def delete_note(filename: str, db: Session = Depends(get_db)):
    if not filename.endswith(".md"):
        filename += ".md"
        
    deleted = notes_manager.delete_note_file(filename)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note file not found")
        
    db_note = db.query(models.NoteMeta).filter(models.NoteMeta.file_path == filename).first()
    if db_note:
        db.delete(db_note)
        db.commit()
        
    return {"status": "deleted"}
