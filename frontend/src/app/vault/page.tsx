"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, Trash2, Copy, Check } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";

interface Secret {
  id: number;
  key_name: string;
  description: string | null;
  created_at: string;
}

export default function Vault() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { activeProject } = useProject();

  const fetchSecrets = () => {
    const url = activeProject 
      ? `http://localhost:8000/vault/?project_id=${activeProject.id}` 
      : "http://localhost:8000/vault/";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setSecrets(data))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetchSecrets();
  }, [activeProject]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:8000/vault/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        key_name: newKey, 
        value: newVal, 
        description: newDesc,
        project_id: activeProject ? activeProject.id : null 
      }),
    });
    setNewKey("");
    setNewVal("");
    setNewDesc("");
    fetchSecrets();
  };

  const handleReveal = async (id: number) => {
    if (revealed[id]) {
      setRevealed(prev => {
        const next = {...prev};
        delete next[id];
        return next;
      });
      return;
    }
    const res = await fetch(`http://localhost:8000/vault/${id}/reveal`);
    const data = await res.json();
    setRevealed(prev => ({ ...prev, [id]: data.value }));
  };

  const handleCopy = async (id: number) => {
    let valToCopy = revealed[id];
    if (!valToCopy) {
      const res = await fetch(`http://localhost:8000/vault/${id}/reveal`);
      const data = await res.json();
      valToCopy = data.value;
    }
    navigator.clipboard.writeText(valToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: number) => {
    await fetch(`http://localhost:8000/vault/${id}`, { method: "DELETE" });
    fetchSecrets();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background min-w-0 p-8">
      <div className="flex items-center gap-3 mb-8">
        <Lock className="text-primary" size={28} />
        <h1 className="text-3xl font-bold">The Vault {activeProject && `- ${activeProject.name}`}</h1>
      </div>
      
      <p className="text-muted-foreground mb-8">
        Securely store your API keys and \`.env\` variables here. They are encrypted at rest using symmetric AES.
      </p>

      <div className="grid gap-8 max-w-5xl">
        <div className="border border-border/50 rounded-lg p-6 bg-muted/10">
          <h2 className="text-lg font-medium mb-4">Add New Secret</h2>
          <form onSubmit={handleAdd} className="flex gap-4">
            <input 
              type="text" 
              placeholder="Key Name (e.g., OPENAI_API_KEY)" 
              className="flex-1 bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Value" 
              className="flex-1 bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
              value={newVal}
              onChange={e => setNewVal(e.target.value)}
              required
            />
            <input 
              type="text" 
              placeholder="Note/Description (e.g., Personal Account)" 
              className="flex-1 bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 shrink-0">
              Save Secret
            </button>
          </form>
        </div>

        <div className="border border-border/50 rounded-lg overflow-hidden bg-background">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 font-medium w-1/4">Key Name</th>
                <th className="px-4 py-3 font-medium w-1/3">Value</th>
                <th className="px-4 py-3 font-medium w-1/4">Note</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {secrets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                    No secrets stored in the Vault.
                  </td>
                </tr>
              ) : secrets.map(secret => (
                <tr key={secret.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-primary">{secret.key_name}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground cursor-pointer group" onClick={() => handleCopy(secret.id)} title="Click to copy value">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {revealed[secret.id] ? revealed[secret.id] : "••••••••••••••••"}
                      </span>
                      {copiedId === secret.id ? <Check size={14} className="text-green-500 shrink-0" /> : <Copy size={14} className="opacity-0 group-hover:opacity-100 shrink-0" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{secret.description || "-"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleReveal(secret.id)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded" title={revealed[secret.id] ? "Hide" : "Reveal"}>
                      {revealed[secret.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => handleDelete(secret.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
