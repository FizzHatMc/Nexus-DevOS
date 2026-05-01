"use client";

import { Folder, FileText, Lock, Settings, TerminalSquare, Link as LinkIcon, Plus, X, Bot, Globe } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/lib/ProjectContext";

export function SidebarLeft() {
  const [notes, setNotes] = useState<any[]>([]);
  const [snapUrl, setSnapUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { activeProject, setActiveProject } = useProject();

  const fetchNotes = () => {
    const url = activeProject 
      ? `http://localhost:8000/notes/?project_id=${activeProject.id}` 
      : "http://localhost:8000/notes/";
    fetch(url)
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchNotes();
  }, [activeProject]);

  const handleSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapUrl) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/snapshots/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // TODO: The backend snapshots router currently doesn't accept project_id. 
        // We'll just pass it in tags for now if it's there or update the endpoint later.
        body: JSON.stringify({ url: snapUrl, tags: activeProject ? activeProject.id : "snapshot" })
      });
      const data = await res.json();
      setSnapUrl("");
      fetchNotes();
      router.push(`/?note=${data.filename}`);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleNewNote = () => {
    const name = window.prompt("Enter note name (e.g. architecture):");
    if (!name) return;
    
    let newId = name.trim().replace(/\s+/g, '-').toLowerCase();
    if (!newId.endsWith(".md")) {
      newId += ".md";
    }
    router.push(`/?note=${newId}`);
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-background flex flex-col border-r border-border/50">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        {activeProject ? (
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-bold tracking-tight text-primary truncate" title={activeProject.name}>
              {activeProject.name}
            </h1>
            <button 
              onClick={() => setActiveProject(null)} 
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              title="Exit Project"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <h1 className="text-xl font-bold tracking-tight">Nexus-DevOS</h1>
        )}
      </div>
      
      <div className="p-3 border-b border-border/50">
        <form onSubmit={handleSnapshot} className="flex gap-2">
          <input 
            type="url" 
            placeholder="Snapshot URL..." 
            className="flex-1 bg-muted/50 border border-border/50 rounded px-2 py-1 text-xs outline-none focus:border-primary"
            value={snapUrl}
            onChange={(e) => setSnapUrl(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="bg-secondary text-secondary-foreground p-1 rounded hover:bg-secondary/80" title="Web Snapshot">
            <LinkIcon size={14} />
          </button>
        </form>
      </div>

      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        <div>
          <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Notes</span>
            <button onClick={handleNewNote} className="hover:text-foreground"><Plus size={14}/></button>
          </div>
          {notes.map(note => (
            <Link 
              key={note.id}
              href={`/?note=${note.file_path}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors truncate"
            >
              <FileText size={14} className="shrink-0" />
              <span className="truncate">{note.title || note.file_path}</span>
            </Link>
          ))}
        </div>

        <div>
          <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Modules
          </div>
          <NavItem href="/projects" icon={<Folder size={16} />} label="Projects" />
          <NavItem href="/services" icon={<Globe size={16} />} label="Service Hub" />
          <NavItem href="/chat" icon={<Bot size={16} />} label="Knowledge Chat" />
          <NavItem href="/commands" icon={<TerminalSquare size={16} />} label="Command Library" />
          <NavItem href="/vault" icon={<Lock size={16} />} label="The Vault" />
        </div>
      </nav>
      
      <div className="p-2 border-t border-border/50">
        <NavItem href="/settings" icon={<Settings size={16} />} label="Settings" />
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

