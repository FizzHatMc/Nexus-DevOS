from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
import httpx
from bs4 import BeautifulSoup
import markdownify
import re
from datetime import datetime
from database import get_db
import notes_manager
import models
import schemas

router = APIRouter(
    prefix="/snapshots",
    tags=["snapshots"]
)

class SnapshotRequest(BaseModel):
    url: str
    tags: str = "snapshot"

def extract_article_content(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    
    # Try to extract title
    title = soup.title.string if soup.title else "Untitled Snapshot"
    
    # Remove script and style elements
    for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
        script.extract()
        
    # Try to find main content
    main_content = soup.find("main") or soup.find("article") or soup.find("div", role="main") or soup.body
    
    if not main_content:
        return title, "Could not extract content."
        
    md = markdownify.markdownify(str(main_content), heading_style="ATX")
    
    # Basic cleanup
    md = re.sub(r'\n{3,}', '\n\n', md)
    return title.strip(), md.strip()

@router.post("/")
async def create_snapshot(request: SnapshotRequest, db: Session = Depends(get_db)):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(request.url)
            response.raise_for_status()
            
            title, markdown_content = extract_article_content(response.text)
            
            # Format filename
            safe_title = re.sub(r'[^a-zA-Z0-9]+', '-', title).strip('-').lower()
            if not safe_title:
                safe_title = "snapshot-" + str(int(datetime.utcnow().timestamp()))
            filename = f"snapshot-{safe_title}.md"
            
            frontmatter = {
                "title": title,
                "tags": request.tags,
                "source_url": request.url,
            }
            
            # Save via notes manager
            updated_fm = notes_manager.write_note(filename, frontmatter, markdown_content)
            
            # Sync to DB
            note_id = updated_fm.get("id")
            db_note = db.query(models.NoteMeta).filter(models.NoteMeta.id == note_id).first()
            if not db_note:
                db_note = models.NoteMeta(
                    id=note_id,
                    title=title,
                    file_path=filename,
                    tags=request.tags
                )
                db.add(db_note)
            else:
                db_note.title = title
                db_note.tags = request.tags
                
            db.commit()
            
            return {"status": "success", "filename": filename, "title": title}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
