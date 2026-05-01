from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
import models
import notes_manager
import os
import chromadb
import google.generativeai as genai
from typing import List, Dict

router = APIRouter(
    prefix="/rag",
    tags=["rag"]
)

# Initialize ChromaDB in the data directory
CHROMA_DIR = os.getenv("NEXUS_DATA_DIR", "./data") + "/chroma"
os.makedirs(CHROMA_DIR, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

# Get or create collection
collection = chroma_client.get_or_create_collection(name="nexus_notes")

def get_gemini_key(db: Session):
    # Try ENV first
    key = os.getenv("GEMINI_API_KEY")
    if key: return key
    # Try Vault
    db_secret = db.query(models.VaultSecret).filter(models.VaultSecret.key_name == "GEMINI_API_KEY").first()
    if db_secret:
        import vault
        return vault.decrypt_secret(db_secret.encrypted_value)
    return None

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Simple character-based chunking."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks

@router.post("/index")
def index_all_notes(db: Session = Depends(get_db)):
    notes = db.query(models.NoteMeta).all()
    if not notes:
        return {"status": "No notes to index"}
        
    ids = []
    documents = []
    metadatas = []
    
    for note in notes:
        frontmatter, content = notes_manager.read_note(note.file_path)
        if not content:
            continue
            
        chunks = chunk_text(content)
        for i, chunk in enumerate(chunks):
            # unique ID for each chunk
            chunk_id = f"{note.id}_chunk_{i}"
            ids.append(chunk_id)
            documents.append(chunk)
            metadatas.append({
                "note_id": note.id,
                "title": note.title or "Untitled",
                "file_path": note.file_path,
                "project_id": note.project_id or "global"
            })
            
    if documents:
        # Upsert clears old ones if ids match, but since chunk counts might change, 
        # it's better to clear collection in a real app or track carefully.
        # For simplicity, we just upsert.
        collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        
    return {"status": f"Indexed {len(documents)} chunks from {len(notes)} notes."}

@router.post("/ask")
def ask_question(query: str = Body(..., embed=True), project_id: str = Body(None, embed=True), db: Session = Depends(get_db)):
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    # Search ChromaDB
    # Filter by project if provided
    where_filter = None
    if project_id:
        where_filter = {"project_id": project_id}
        
    results = collection.query(
        query_texts=[query],
        n_results=5,
        where=where_filter
    )
    
    contexts = results["documents"][0] if results["documents"] else []
    metadata_list = results["metadatas"][0] if results["metadatas"] else []
    
    context_text = "\n\n---\n\n".join(
        [f"Source: {meta.get('title', 'Unknown')}\nContent: {doc}" for doc, meta in zip(contexts, metadata_list)]
    )
    
    gemini_key = get_gemini_key(db)
    
    if not gemini_key:
        # If no LLM, just return the retrieved context directly
        return {
            "answer": "GEMINI_API_KEY is not configured in .env or The Vault. Here is the context retrieved from your notes:\n\n" + context_text,
            "sources": metadata_list
        }
        
    # Construct Prompt
    prompt = f"""You are Nexus-DevOS, an AI assistant for a developer. Use the following context from the user's personal knowledge base to answer their question. If the context does not contain the answer, say "I don't have enough information in your notes to answer that."

Context:
{context_text}

Question:
{query}

Answer:"""

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        return {
            "answer": response.text,
            "sources": metadata_list
        }
    except Exception as e:
        return {
            "answer": f"Error calling Gemini API: {str(e)}",
            "sources": metadata_list
        }
