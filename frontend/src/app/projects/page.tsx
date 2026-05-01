"use client";

import { useState, useEffect } from "react";
import { Folder, Plus, GitBranch, Trash2 } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description: string | null;
  github_repo: string | null;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRepo, setNewRepo] = useState("");
  const { setActiveProject } = useProject();
  const router = useRouter();

  const fetchProjects = () => {
    fetch("http://localhost:8000/projects/")
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:8000/projects/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: newId, name: newName, description: newDesc, github_repo: newRepo })
    });
    setNewId("");
    setNewName("");
    setNewDesc("");
    setNewRepo("");
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    await fetch(`http://localhost:8000/projects/${id}`, { method: "DELETE" });
    fetchProjects();
  };

  const openProject = (p: Project) => {
    setActiveProject(p);
    router.push("/");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background min-w-0 p-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <Folder className="text-primary" size={28} />
        <h1 className="text-3xl font-bold">Projects</h1>
      </div>
      
      <p className="text-muted-foreground mb-8">
        Organize your Knowledge Base, Vault Secrets, and Git repositories into dedicated spaces.
      </p>

      <div className="grid gap-8 max-w-5xl">
        <div className="border border-border/50 rounded-lg p-6 bg-muted/10">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><Plus size={18}/> Create Project</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="ID (e.g. nexus-devos)" 
                className="flex-1 bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                value={newId}
                onChange={e => setNewId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                required
              />
              <input 
                type="text" 
                placeholder="Name (e.g. Nexus DevOS)" 
                className="flex-[2] bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
            </div>
            <input 
              type="text" 
              placeholder="Description" 
              className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="GitHub Repo (e.g. facebook/react)" 
              className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
              value={newRepo}
              onChange={e => setNewRepo(e.target.value)}
            />
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 self-end">
              Create Project
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <div key={p.id} className="border border-border/50 rounded-lg p-5 bg-background flex flex-col gap-3 hover:border-primary transition-colors group relative cursor-pointer" onClick={() => openProject(p)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg hover:underline">{p.name}</h3>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{p.description}</p>
              
              <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono bg-muted/50 px-2 py-1 rounded">{p.id}</span>
                {p.github_repo && (
                  <span className="flex items-center gap-1">
                    <GitBranch size={14} /> {p.github_repo}
                  </span>
                )}
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center p-8 text-muted-foreground italic border border-border/50 rounded-lg border-dashed">
              No projects created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
