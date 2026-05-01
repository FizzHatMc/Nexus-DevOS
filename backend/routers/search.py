from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import notes_manager
from typing import List, Dict, Any

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

@router.get("/")
def global_search(q: str = "", project_id: str = None, db: Session = Depends(get_db)) -> Dict[str, List[Any]]:
    if not q:
        return {"notes": [], "commands": [], "secrets": [], "projects": []}
        
    search_term = f"%{q}%"
    q_lower = q.lower()
    
    # 1. Database Queries
    cmds_query = db.query(models.CommandSnippet).filter(
        (models.CommandSnippet.title.ilike(search_term)) | 
        (models.CommandSnippet.command.ilike(search_term)) |
        (models.CommandSnippet.description.ilike(search_term))
    )
    
    secrets_query = db.query(models.VaultSecret).filter(
        (models.VaultSecret.key_name.ilike(search_term)) |
        (models.VaultSecret.description.ilike(search_term))
    )
    
    projects_query = db.query(models.Project).filter(
        (models.Project.name.ilike(search_term)) | 
        (models.Project.id.ilike(search_term)) |
        (models.Project.description.ilike(search_term))
    )

    if project_id:
        cmds_query = cmds_query.filter(models.CommandSnippet.project_id == project_id)
        secrets_query = secrets_query.filter(models.VaultSecret.project_id == project_id)
        projects_query = projects_query.filter(models.Project.id == project_id)

    cmds = cmds_query.limit(10).all()
    secrets = secrets_query.limit(10).all()
    projects = projects_query.limit(10).all()

    # 2. File-based Full Text Search for Notes
    # First, get all notes from DB to filter by project_id easily
    notes_query = db.query(models.NoteMeta)
    if project_id:
        notes_query = notes_query.filter(models.NoteMeta.project_id == project_id)
    else:
        notes_query = notes_query.filter(models.NoteMeta.project_id.is_(None))
        
    db_notes = notes_query.all()
    
    matched_notes = []
    for n in db_notes:
        if len(matched_notes) >= 10:
            break
            
        # Match by title or filename first
        if q_lower in (n.title or "").lower() or q_lower in (n.file_path or "").lower():
            matched_notes.append({"id": n.id, "title": n.title, "path": n.file_path, "preview": "Matches title or path"})
            continue
            
        # Match by content
        _, content = notes_manager.read_note(n.file_path)
        if content and q_lower in content.lower():
            # Create a small preview
            idx = content.lower().find(q_lower)
            start = max(0, idx - 20)
            end = min(len(content), idx + len(q) + 20)
            preview = "... " + content[start:end].replace("\n", " ") + " ..."
            matched_notes.append({"id": n.id, "title": n.title, "path": n.file_path, "preview": preview})

    return {
        "notes": matched_notes,
        "commands": [{"id": c.id, "title": c.title, "command": c.command} for c in cmds],
        "secrets": [{"id": s.id, "key": s.key_name} for s in secrets],
        "projects": [{"id": p.id, "name": p.name} for p in projects]
    }

