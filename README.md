# Nexus-DevOS

**Nexus-DevOS** is a self-hosted, developer-centric "Knowledge Engine" and "Project Cockpit" designed for Fedora servers. It bridges the gap between static notes, live code repositories, system commands, and encrypted secret management. Built with an "API-first" and "Markdown-native" approach, it serves as the ultimate ground truth for your projects and is architected to seamlessly integrate with local AI (RAG) pipelines in the future.

## 🚀 Features

### Implemented Modules
- [x] **Markdown Knowledge Base:** GFM-supported dual-pane editor (Edit/Preview) that reads/writes pure `.md` files to the filesystem with YAML frontmatter sync.
- [x] **The Vault (Secrets Manager):** Securely store API keys and environment variables with symmetric AES encryption at rest. Features click-to-copy and visibility toggles.
- [x] **Command Library:** Save, tag, and search reusable system commands. Features dynamic `{{variable}}` injection for easy copy-pasting.
- [x] **Web Snapshotting:** Paste any URL to automatically strip ads/scripts and convert the article into a clean, offline Markdown note in your Knowledge Base.
- [x] **Git Integration:** Link GitHub repositories to your projects and instantly view the latest live commit history in the contextual sidebar.
- [x] **Projects Module:** Create dedicated project workspaces to logically group your notes, secrets, and Git repositories.
- [x] **Global Command Palette:** A global search (Cmd+K) to jump between notes, files, and commands instantly.
- [x] **Asset Management:** A project-linked file upload system for images, PDFs, STLs, and logs.
- [x] **Local AI (RAG) Integration:** Vectorize notes and snapshots via ChromaDB and chat with your knowledge base using Google's Gemini API.

---

## 💻 Local Development Setup

To run Nexus-DevOS locally while developing, you need to boot up the FastAPI backend and the Next.js frontend in separate terminal instances.

### 1. Backend (FastAPI + SQLite)
Requires Python 3.10+
\`\`\`bash
cd backend
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the development server
uvicorn main:app --reload
\`\`\`
*The backend API will run on `http://localhost:8000`. You can view the auto-generated Swagger documentation at `http://localhost:8000/docs`.*

### 2. Frontend (Next.js 14 + Tailwind CSS)
Requires Node.js 18+
\`\`\`bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
\`\`\`
*The frontend UI will run on `http://localhost:3000`. Open this URL in your browser.*

---

## 🌍 Final Deployment (Production with Docker)

For the final deployment on a Fedora Server (or any Linux machine), the recommended approach is using **Docker Compose**. This provides an isolated, easily upgradeable environment.

### 1. Prerequisites
Ensure you have Docker and Docker Compose installed on your Fedora server:
\`\`\`bash
sudo dnf install docker docker-compose
sudo systemctl enable --now docker
\`\`\`

### 2. Environment Setup
Create a \`.env\` file in the root directory to store your secrets:
\`\`\`bash
# Generate a key using: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
NEXUS_VAULT_KEY=your_secure_generated_key_here
GITHUB_TOKEN=your_github_pat_here
\`\`\`

### 3. Deploy
Run the following command in the root directory where \`docker-compose.yml\` is located:
\`\`\`bash
docker-compose up -d --build
\`\`\`

- The **Frontend** will be exposed on port \`3000\`.
- The **Backend API** will be exposed on port \`8000\`.
- Data (SQLite DB and Markdown files) is safely persisted in the \`nexus-data\` Docker volume.

### 4. Reverse Proxy (Optional but Recommended)
Use Nginx or Caddy to expose port \`3000\` via a domain name with SSL/TLS. Since the frontend makes client-side fetches to \`http://localhost:8000\` by default, ensure you configure an API gateway or update frontend fetch URLs to match your production domain.
