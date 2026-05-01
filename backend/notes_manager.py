import os
import yaml
import re
from datetime import datetime

# The actual flat files are stored here
NOTES_DIR = os.getenv("NEXUS_NOTES_DIR", "./data/notes")
os.makedirs(NOTES_DIR, exist_ok=True)

FRONTMATTER_REGEX = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)", re.DOTALL)

def parse_markdown(content: str):
    """Extracts YAML frontmatter and the markdown body."""
    match = FRONTMATTER_REGEX.match(content)
    if match:
        try:
            frontmatter = yaml.safe_load(match.group(1)) or {}
            body = match.group(2)
            return frontmatter, body
        except yaml.YAMLError:
            return {}, content
    return {}, content

def serialize_markdown(frontmatter: dict, body: str) -> str:
    """Generates markdown with YAML frontmatter."""
    if not frontmatter:
        return body
    yaml_str = yaml.dump(frontmatter, default_flow_style=False, sort_keys=False)
    return f"---\n{yaml_str}---\n{body}"

def read_note(filename: str) -> tuple[dict, str]:
    """Reads a note from disk and parses it."""
    filepath = os.path.join(NOTES_DIR, filename)
    if not os.path.exists(filepath):
        return None, None
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    return parse_markdown(content)

def write_note(filename: str, frontmatter: dict, body: str):
    """Writes a note to disk with frontmatter."""
    filepath = os.path.join(NOTES_DIR, filename)
    # Ensure ID and timestamps in frontmatter
    if "id" not in frontmatter:
        frontmatter["id"] = filename.replace(".md", "")
    
    if not os.path.exists(filepath):
        frontmatter["created_at"] = datetime.utcnow().isoformat()
    frontmatter["updated_at"] = datetime.utcnow().isoformat()

    content = serialize_markdown(frontmatter, body)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return frontmatter

def delete_note_file(filename: str):
    filepath = os.path.join(NOTES_DIR, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return True
    return False

def list_note_files():
    """Returns a list of all .md files in the notes directory."""
    return [f for f in os.listdir(NOTES_DIR) if f.endswith(".md")]
