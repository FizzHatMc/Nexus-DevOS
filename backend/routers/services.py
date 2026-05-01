from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
import httpx

router = APIRouter(
    prefix="/services",
    tags=["services"]
)

@router.post("/", response_model=schemas.ServiceLinkResponse)
def create_service(service: schemas.ServiceLinkCreate, db: Session = Depends(get_db)):
    db_service = models.ServiceLink(**service.model_dump())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@router.get("/", response_model=List[schemas.ServiceLinkResponse])
def list_services(project_id: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.ServiceLink)
    if project_id:
        query = query.filter(models.ServiceLink.project_id == project_id)
    else:
        query = query.filter(models.ServiceLink.project_id.is_(None))
    return query.offset(skip).limit(limit).all()

@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db)):
    db_service = db.query(models.ServiceLink).filter(models.ServiceLink.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(db_service)
    db.commit()
    return {"status": "deleted"}

@router.get("/{service_id}/status")
async def check_service_status(service_id: int, db: Session = Depends(get_db)):
    db_service = db.query(models.ServiceLink).filter(models.ServiceLink.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(db_service.url)
            return {"status": "online", "code": res.status_code}
    except Exception as e:
        return {"status": "offline", "error": str(e)}
