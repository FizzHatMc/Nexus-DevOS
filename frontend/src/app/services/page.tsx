"use client";

import { useState, useEffect } from "react";
import { Globe, Plus, Trash2, ExternalLink, Activity } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";

interface ServiceLink {
  id: number;
  name: string;
  url: string;
  description: string | null;
  icon: string | null;
}

export default function Services() {
  const [services, setServices] = useState<ServiceLink[]>([]);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});
  const { activeProject } = useProject();

  const fetchServices = () => {
    const url = activeProject 
      ? `http://localhost:8000/services/?project_id=${activeProject.id}` 
      : "http://localhost:8000/services/";
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setServices(data);
        data.forEach((s: ServiceLink) => checkStatus(s.id));
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchServices();
  }, [activeProject]);

  const checkStatus = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/services/${id}/status`);
      const data = await res.json();
      setStatusMap(prev => ({ ...prev, [id]: data.status }));
    } catch(e) {
      setStatusMap(prev => ({ ...prev, [id]: "error" }));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:8000/services/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: newName, 
        url: newUrl, 
        description: newDesc,
        project_id: activeProject ? activeProject.id : null 
      })
    });
    setNewName("");
    setNewUrl("");
    setNewDesc("");
    fetchServices();
  };

  const handleDelete = async (id: number) => {
    await fetch(`http://localhost:8000/services/${id}`, { method: "DELETE" });
    fetchServices();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background min-w-0 p-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <Globe className="text-primary" size={28} />
        <h1 className="text-3xl font-bold">Service Hub {activeProject && `- ${activeProject.name}`}</h1>
      </div>
      
      <p className="text-muted-foreground mb-8">
        Centralize your links and specific ports. Quickly access your servers, dashboards, or external websites.
      </p>

      <div className="grid gap-8 max-w-5xl">
        <div className="border border-border/50 rounded-lg p-6 bg-muted/10">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><Plus size={18}/> Add Service</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Name (e.g. Proxmox, NAS)" 
                className="flex-[1] bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
              <input 
                type="url" 
                placeholder="URL (e.g. http://192.168.1.10:8006)" 
                className="flex-[2] bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                required
              />
            </div>
            <input 
              type="text" 
              placeholder="Description (Optional)" 
              className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 self-end">
              Save Service
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(s => {
            const isOnline = statusMap[s.id] === "online";
            return (
              <div key={s.id} className="border border-border/50 rounded-lg p-5 bg-background flex flex-col gap-3 hover:border-primary transition-colors group relative">
                <div className="flex justify-between items-start">
                  <div className="flex-1 flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} title={isOnline ? 'Online' : 'Offline / Unreachable'} />
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => checkStatus(s.id)} className="p-1.5 text-muted-foreground hover:text-foreground rounded" title="Check Status">
                      <Activity size={16} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {s.description && <p className="text-sm text-muted-foreground flex-1">{s.description}</p>}
                
                <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono bg-muted/50 px-2 py-1 rounded truncate max-w-[200px]">{s.url}</span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-medium">
                    Open <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            );
          })}
          {services.length === 0 && (
            <div className="col-span-full text-center p-8 text-muted-foreground italic border border-border/50 rounded-lg border-dashed">
              No services added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
