
"use client";
import { API_URL } from '@/lib/api';


import { useState, useEffect } from "react";
import { TerminalSquare, Copy, Check, Trash2, Plus } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";

interface Command {
  id: number;
  title: string;
  command: string;
  description: string | null;
  tags: string | null;
}

export default function Commands() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newCmd, setNewCmd] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { activeProject } = useProject();
  
  // For variable injection: track variables per command
  const [vars, setVars] = useState<Record<number, Record<string, string>>>({});

  const fetchCommands = () => {
    const url = activeProject 
      ? `${API_URL}/commands/?project_id=${activeProject.id}` 
      : `${API_URL}/commands/`;
    fetch(url)
      .then(res => res.json())
      .then(data => setCommands(data))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchCommands();
  }, [activeProject]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/commands/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        title: newTitle, 
        command: newCmd, 
        description: newDesc, 
        tags: "",
        project_id: activeProject ? activeProject.id : null 
      })
    });
    setNewTitle("");
    setNewCmd("");
    setNewDesc("");
    fetchCommands();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API_URL}/commands/${id}`, { method: "DELETE" });
    fetchCommands();
  };

  const extractVariables = (cmdString: string) => {
    const matches = cmdString.match(/{{([^}]+)}}/g);
    return matches ? matches.map(m => m.slice(2, -2)) : [];
  };

  const handleVarChange = (cmdId: number, varName: string, value: string) => {
    setVars(prev => ({
      ...prev,
      [cmdId]: {
        ...(prev[cmdId] || {}),
        [varName]: value
      }
    }));
  };

  const generateFinalCommand = (cmd: Command) => {
    let finalStr = cmd.command;
    const cmdVars = vars[cmd.id] || {};
    const variables = extractVariables(cmd.command);
    variables.forEach(v => {
      if (cmdVars[v]) {
        finalStr = finalStr.replace(new RegExp(`{{${v}}}`, 'g'), cmdVars[v]);
      }
    });
    return finalStr;
  };

  const handleCopy = (cmd: Command) => {
    const finalStr = generateFinalCommand(cmd);
    navigator.clipboard.writeText(finalStr);
    setCopiedId(cmd.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background min-w-0 p-8 overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <TerminalSquare className="text-primary" size={28} />
        <h1 className="text-3xl font-bold">Command Library {activeProject && `- ${activeProject.name}`}</h1>
      </div>
      
      <p className="text-muted-foreground mb-8">
        Store reusable system commands. Use <code>{`{{variable}}`}</code> syntax to create injectable variables.
      </p>

      <div className="grid gap-8 max-w-5xl">
        <div className="border border-border/50 rounded-lg p-6 bg-muted/10">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><Plus size={18}/> Add Command</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Title (e.g., Update System)" 
                className="flex-1 bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="Description (Optional)" 
                className="flex-1 bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
            <textarea 
              placeholder="Command (e.g., sudo dnf install {{package}})" 
              className="w-full bg-background border border-border/50 rounded px-3 py-2 text-sm outline-none focus:border-primary font-mono h-24 resize-none"
              value={newCmd}
              onChange={e => setNewCmd(e.target.value)}
              required
            />
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 self-end">
              Save Command
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {commands.map(cmd => {
            const variables = extractVariables(cmd.command);
            const finalCommand = generateFinalCommand(cmd);
            
            return (
              <div key={cmd.id} className="border border-border/50 rounded-lg p-4 bg-background flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{cmd.title}</h3>
                    {cmd.description && <p className="text-sm text-muted-foreground">{cmd.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(cmd.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>

                {variables.length > 0 && (
                  <div className="flex flex-wrap gap-3 bg-muted/20 p-3 rounded border border-border/30">
                    <span className="text-xs text-muted-foreground self-center uppercase font-semibold">Variables:</span>
                    {variables.map(v => (
                      <input
                        key={v}
                        type="text"
                        placeholder={v}
                        className="bg-background border border-border/50 rounded px-2 py-1 text-xs outline-none focus:border-primary w-32"
                        value={vars[cmd.id]?.[v] || ""}
                        onChange={(e) => handleVarChange(cmd.id, v, e.target.value)}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-zinc-950 text-green-400 font-mono text-sm p-3 rounded overflow-x-auto border border-zinc-800">
                    {finalCommand}
                  </div>
                  <button 
                    onClick={() => handleCopy(cmd)} 
                    className="p-3 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 shrink-0 border border-border/50"
                    title="Copy Command"
                  >
                    {copiedId === cmd.id ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            );
          })}
          {commands.length === 0 && (
            <div className="text-center p-8 text-muted-foreground italic border border-border/50 rounded-lg border-dashed">
              No commands saved yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
