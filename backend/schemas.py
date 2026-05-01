from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    github_repo: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VaultSecretBase(BaseModel):
    key_name: str
    description: Optional[str] = None
    project_id: Optional[str] = None


class VaultSecretCreate(VaultSecretBase):
    value: str # The raw unencrypted value sent from the client

class VaultSecretResponse(VaultSecretBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VaultSecretDecrypted(VaultSecretResponse):
    value: str

class NoteBase(BaseModel):
    title: str
    tags: Optional[str] = None
    project_id: Optional[str] = None

class NoteCreate(NoteBase):
    filename: str
    content: str

class NoteResponse(NoteBase):
    id: str
    filename: str
    content: str
    frontmatter: dict
    created_at: datetime
    updated_at: Optional[datetime] = None

class NoteMetaResponse(NoteBase):
    id: str
    file_path: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CommandBase(BaseModel):
    title: str
    command: str
    description: Optional[str] = None
    tags: Optional[str] = None
    project_id: Optional[str] = None

class CommandCreate(CommandBase):
    pass

class CommandResponse(CommandBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


