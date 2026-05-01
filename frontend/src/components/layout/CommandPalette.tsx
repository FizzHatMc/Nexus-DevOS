"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useProject } from "@/lib/ProjectContext";
import { FileText, TerminalSquare, Lock, Folder } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    notes: any[];
    commands: any[];
    secrets: any[];
    projects: any[];
  }>({ notes: [], commands: [], secrets: [], projects: [] });
  
  const router = useRouter();
  const { activeProject, setActiveProject } = useProject();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (!query) {
      setResults({ notes: [], commands: [], secrets: [], projects: [] });
      return;
    }

    const timer = setTimeout(() => {
      let url = `http://localhost:8000/search/?q=${encodeURIComponent(query)}`;
      if (activeProject) {
        url += `&project_id=${activeProject.id}`;
      }
      
      fetch(url)
        .then(res => res.json())
        .then(data => setResults(data))
        .catch(e => console.error(e));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeProject]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden">
        <Command label="Global Command Palette" shouldFilter={false}>
          <div className="flex items-center border-b border-border/50 px-4">
            <Command.Input 
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search notes, commands, secrets, or projects... (Cmd+K)" 
              className="w-full bg-transparent border-none py-4 outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              {query ? "No results found." : "Start typing to search..."}
            </Command.Empty>

            {results.projects.length > 0 && (
              <Command.Group heading="Projects" className="text-xs font-medium text-muted-foreground p-2">
                {results.projects.map((p) => (
                  <Command.Item 
                    key={p.id} 
                    onSelect={() => {
                      setActiveProject(p);
                      router.push(`/`);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 mt-1 rounded-md text-sm text-foreground cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground transition-colors"
                  >
                    <Folder size={16} />
                    {p.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.notes.length > 0 && (
              <Command.Group heading="Notes" className="text-xs font-medium text-muted-foreground p-2">
                {results.notes.map((n) => (
                  <Command.Item 
                    key={n.id} 
                    onSelect={() => {
                      router.push(`/?note=${n.path}`);
                      setOpen(false);
                    }}
                    className="flex flex-col items-start gap-1 px-3 py-2 mt-1 rounded-md text-sm text-foreground cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <FileText size={16} />
                      {n.title || n.path}
                    </div>
                    {n.preview && (
                      <span className="text-[11px] opacity-70 italic ml-6 line-clamp-1">{n.preview}</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.commands.length > 0 && (
              <Command.Group heading="Commands" className="text-xs font-medium text-muted-foreground p-2">
                {results.commands.map((c) => (
                  <Command.Item 
                    key={c.id} 
                    onSelect={() => {
                      router.push(`/commands`);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 mt-1 rounded-md text-sm text-foreground cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <TerminalSquare size={16} />
                      {c.title}
                    </div>
                    <span className="opacity-50 text-xs font-mono">{c.command}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {results.secrets.length > 0 && (
              <Command.Group heading="Vault Secrets" className="text-xs font-medium text-muted-foreground p-2">
                {results.secrets.map((s) => (
                  <Command.Item 
                    key={s.id} 
                    onSelect={() => {
                      router.push(`/vault`);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 mt-1 rounded-md text-sm text-foreground cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground transition-colors"
                  >
                    <Lock size={16} />
                    {s.key}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

          </Command.List>
        </Command>
      </div>
      {/* Click outside to close */}
      <div className="absolute inset-0 z-[-1]" onClick={() => setOpen(false)} />
    </div>
  );
}
