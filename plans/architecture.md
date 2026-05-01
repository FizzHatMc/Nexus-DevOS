# Nexus-DevOS Technical Architecture

## 1. Technology Stack Selection
Given the requirements for an API-first design, local RAG/AI readiness, and a rich markdown-native UI, the following stack is recommended:

*   **Backend (API & File Manager):** Python with **FastAPI**.
    *   *Why:* Python is the industry standard for AI/RAG pipelines. FastAPI provides auto-generating REST API docs, fast execution, and modern async support.
*   **Database (Metadata & Vault):** **SQLite** (via SQLModel or SQLAlchemy).
    *   *Why:* Perfect for a self-hosted, local-first system. Highly portable, easily backed up, and requires zero separate database server configuration. Can be swapped for PostgreSQL later if multi-node scaling is ever needed.
*   **Frontend (UI):** **Next.js** (React) with **Tailwind CSS** and **shadcn/ui**.
    *   *Why:* Excellent for building complex, app-like interfaces (3-column layouts, command palettes). Robust ecosystem for Markdown rendering (`react-markdown`, `remark-gfm`).

## 2. Directory Structure Strategy
The system will operate out of a base data directory (e.g., `/data/nexus` on the server) structured as:
```text
/data/nexus/
├── notes/          # Flat .md files with YAML frontmatter
├── assets/         # /assets/{project_id}/ for images, PDFs, etc.
├── db/             # nexus.db (SQLite database)
└── config/         # System configuration
```

## 3. Core System Components

### A. Markdown Knowledge Base
*   **Backend:** File watcher/parser that reads `.md` files, extracts YAML frontmatter, and syncs metadata (tags, links) to the SQLite DB.
*   **Frontend:** Dual-pane or WYSIWYG markdown editor supporting GitHub Flavored Markdown (GFM) and custom `[[wiki-links]]` parsing.

### B. Web Snapshotting
*   **Backend:** A service (e.g., using `Playwright` or `BeautifulSoup` + `Readability.js` port) that takes a URL, extracts the main article content, strips ads/scripts, and saves it as a clean `.md` file in the notes directory, attaching original URL metadata.

### C. Git Integration
*   **Backend:** Integration with Git CLI or a library like `GitPython` to read local repository states or GitHub API for remote issues/PRs.
*   **Frontend:** Contextual sidebar components fetching this data via the REST API.

### D. The Vault (Secrets & .envs)
*   **Backend:** SQLite table storing AES-encrypted strings. The encryption key is provided via a master environment variable or password on startup. Endpoints for CRUD and export to `.env` format.

### E. Command Library
*   **Database:** A table for commands, descriptions, and tags.
*   **Frontend:** Searchable interface supporting variable injection (`{{variable}}`) via simple string replacement before copying to clipboard.

### F. RAG / AI Readiness
*   **Data Structure:** Every note and snapshot will enforce strict YAML frontmatter (ID, created_at, tags, source) to ensure clean indexing when the vector database (e.g., ChromaDB) and LLM are introduced in the future.

## 4. UI/UX Design
*   **Layout:**
    *   Left: Navigation (Projects, Tags, Vault, Settings).
    *   Middle: Main content area (Editor, Snapshot view, Command list).
    *   Right: Contextual metadata (Git status, Linked Notes, Table of Contents).
*   **Command Palette:** Global search using `cmdk` library in React, hitting a unified search API endpoint on the backend.
