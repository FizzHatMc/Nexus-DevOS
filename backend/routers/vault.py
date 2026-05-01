from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, vault
from database import get_db

router = APIRouter(
    prefix="/vault",
    tags=["vault"]
)

@router.post("/", response_model=schemas.VaultSecretResponse)
def create_secret(secret: schemas.VaultSecretCreate, db: Session = Depends(get_db)):
    db_secret = db.query(models.VaultSecret).filter(models.VaultSecret.key_name == secret.key_name).first()
    if db_secret:
        raise HTTPException(status_code=400, detail="Secret key name already exists")
    
    encrypted_val = vault.encrypt_secret(secret.value)
    
    new_secret = models.VaultSecret(
        key_name=secret.key_name,
        encrypted_value=encrypted_val,
        description=secret.description,
        project_id=secret.project_id
    )
    db.add(new_secret)
    db.commit()
    db.refresh(new_secret)
    return new_secret

@router.get("/", response_model=List[schemas.VaultSecretResponse])
def list_secrets(project_id: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.VaultSecret)
    if project_id:
        query = query.filter(models.VaultSecret.project_id == project_id)
    else:
        query = query.filter(models.VaultSecret.project_id.is_(None))
    return query.offset(skip).limit(limit).all()

@router.get("/{secret_id}/reveal", response_model=schemas.VaultSecretDecrypted)
def reveal_secret(secret_id: int, db: Session = Depends(get_db)):
    db_secret = db.query(models.VaultSecret).filter(models.VaultSecret.id == secret_id).first()
    if not db_secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    
    decrypted_val = vault.decrypt_secret(db_secret.encrypted_value)
    
    # Create the response manually to include decrypted value
    return schemas.VaultSecretDecrypted(
        id=db_secret.id,
        key_name=db_secret.key_name,
        description=db_secret.description,
        project_id=db_secret.project_id,
        created_at=db_secret.created_at,
        updated_at=db_secret.updated_at,
        value=decrypted_val
    )

@router.delete("/{secret_id}")
def delete_secret(secret_id: int, db: Session = Depends(get_db)):
    db_secret = db.query(models.VaultSecret).filter(models.VaultSecret.id == secret_id).first()
    if not db_secret:
        raise HTTPException(status_code=404, detail="Secret not found")
    db.delete(db_secret)
    db.commit()
    return {"status": "deleted"}
