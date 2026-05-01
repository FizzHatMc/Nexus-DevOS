
"use client";
import { API_URL } from '@/lib/api';


import { GitCommit, Paperclip, Link as LinkIcon, AlertCircle, Upload, Trash2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useProject } from "@/lib/ProjectContext";

export function SidebarRight() {
  const { activeProject } = useProject();
  const [repo, setRepo] = useState("vercel/next.js");
  const [commits, setCommits] = useState<any[]>([]);
  const [loadingGit, setLoadingGit] = useState(false);
  
  const [assets, setAssets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (activeProject && activeProject.github_repo) {
      setRepo(activeProject.github_repo);
    }
  }, [activeProject]);

  useEffect(() => {
    if (!repo || !repo.includes("/")) return;
    setLoadingGit(true);
    fetch(`${API_URL}/git/${repo}/commits?limit=3`)
      .then(res => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then(data => setCommits(data))
      .catch(e => setCommits([]))
      .finally(() => setLoadingGit(false));
  }, [repo]);

  const fetchAssets = () => {
    const url = activeProject 
      ? `${API_URL}/assets/?project_id=${activeProject.id}` 
      : `${API_URL}/assets/`;
    fetch(url)
      .then(res => res.json())
      .then(data => setAssets(data))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchAssets();
  }, [activeProject]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append("file", file);
    if (activeProject) {
      formData.append("project_id", activeProject.id);
    }

    setUploading(true);
    try {
      await fetch(`${API_URL}/assets/`, {
        method: "POST",
        body: formData,
      });
      fetchAssets();
    } catch (e) {
      console.error(e);
    }
    setUploading(false);
    // Reset file input
    e.target.value = "";
  };

  const handleDeleteAsset = async (id: number) => {
    if (!confirm("Delete this asset?")) return;
    await fetch(`${API_URL}/assets/${id}`, { method: "DELETE" });
    fetchAssets();
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-background flex flex-col border-l border-border/50">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Context</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Linked Notes Section */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
            <LinkIcon size={16} /> Linked Notes
          </h3>
          <p className="text-xs text-muted-foreground italic">No linked notes.</p>
        </section>

        {/* Assets Section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Paperclip size={16} /> Assets
            </h3>
            <label className="cursor-pointer text-muted-foreground hover:text-foreground">
              <Upload size={14} />
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          
          {uploading && <p className="text-xs text-muted-foreground mb-2">Uploading...</p>}
          
          {assets.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No assets attached.</p>
          ) : (
            <div className="space-y-2">
              {assets.map(a => (
                <div key={a.id} className="flex items-center justify-between text-xs bg-muted/20 p-2 rounded border border-border/50 group">
                  <span className="truncate flex-1" title={a.filename}>{a.filename}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`${API_URL}/assets/${a.id}/download`} download className="text-muted-foreground hover:text-primary">
                      <Download size={14} />
                    </a>
                    <button onClick={() => handleDeleteAsset(a.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Git Section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <GitCommit size={16} /> Git Status
            </h3>
          </div>
          
          <input 
            type="text" 
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repo"
            className="w-full bg-muted/30 border border-border/50 rounded px-2 py-1 text-xs mb-2 outline-none"
          />

          <div className="rounded border border-border/50 p-2 text-xs bg-muted/10">
            {loadingGit ? (
              <p className="text-muted-foreground">Loading commits...</p>
            ) : commits.length > 0 ? (
              <div className="space-y-3">
                {commits.map(c => (
                  <div key={c.sha}>
                    <p className="font-medium truncate" title={c.message}>{c.message}</p>
                    <p className="text-muted-foreground text-[10px]">{c.author} • {new Date(c.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground flex items-center gap-1">
                <AlertCircle size={12} /> Not found or private
              </p>
            )}
          </div>
        </section>

      </div>
    </aside>
  );
}


