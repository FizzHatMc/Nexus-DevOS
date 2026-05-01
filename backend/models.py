from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True) # e.g. "nexus-devos"
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    github_repo = Column(String, nullable=True) # "owner/repo"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class NoteMeta(Base):
    """Metadata for Markdown notes. The actual content is stored in flat .md files."""
    __tablename__ = "note_meta"

    id = Column(String, primary_key=True, index=True) # Usually the filename or a UUID
    title = Column(String, index=True)
    file_path = Column(String, unique=True, index=True) # Relative path to the file
    tags = Column(String) # Comma-separated tags
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
class Asset(Base):
    """Metadata for uploaded assets (images, pdfs, STLs)."""
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String, unique=True)
    mime_type = Column(String)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VaultSecret(Base):
    """Encrypted secrets for The Vault."""
    __tablename__ = "vault_secrets"

    id = Column(Integer, primary_key=True, index=True)
    key_name = Column(String, unique=True, index=True)
    encrypted_value = Column(Text)
    description = Column(String, nullable=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CommandSnippet(Base):
    """Searchable command library."""
    __tablename__ = "command_snippets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    command = Column(Text) # e.g., "sudo dnf install {{package}}"
    description = Column(Text, nullable=True)
    tags = Column(String, nullable=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ServiceLink(Base):
    """Service Hub Links."""
    __tablename__ = "service_links"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    url = Column(String) # e.g., "http://192.168.1.100:8080"
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True) # Optional icon identifier
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

