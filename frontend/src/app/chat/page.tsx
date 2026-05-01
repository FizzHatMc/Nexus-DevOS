
"use client";
import { API_URL } from '@/lib/api';


import { useState } from "react";
import { MessageSquare, Database, Send, Bot } from "lucide-react";
import { useProject } from "@/lib/ProjectContext";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string, sources?: any[]}[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const { activeProject } = useProject();

  const handleIndex = async () => {
    setIndexing(true);
    try {
      const res = await fetch(`${API_URL}/rag/index`, { method: "POST" });
      const data = await res.json();
      alert(data.status);
    } catch(e) {
      alert("Failed to index notes");
    }
    setIndexing(false);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const userMsg = query;
    setQuery("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/rag/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg, project_id: activeProject?.id || null })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.answer, sources: data.sources }]);
    } catch(e) {
      setMessages(prev => [...prev, { role: 'ai', content: "Error connecting to AI backend." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background min-w-0">
      <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <Bot className="text-primary" size={24} />
          <h1 className="text-xl font-bold">Knowledge Chat</h1>
        </div>
        <button 
          onClick={handleIndex} 
          disabled={indexing}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded text-sm hover:bg-secondary/80 disabled:opacity-50"
        >
          <Database size={16} />
          {indexing ? "Indexing..." : "Sync Database"}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <MessageSquare size={48} className="mb-4" />
            <p>Ask a question about your {activeProject ? "project notes" : "global knowledge base"}.</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 max-w-4xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {msg.role === 'user' ? "U" : <Bot size={18} />}
            </div>
            <div className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-primary/10 text-foreground' : 'bg-muted/30 border border-border/50'} prose prose-invert max-w-full text-sm`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Sources Context Used:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {msg.sources.map((s: any, idx: number) => (
                      <li key={idx} className="truncate">📄 {s.title} ({s.project_id})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4 max-w-4xl mr-auto">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"><Bot size={18} /></div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">Thinking...</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/50 bg-background shrink-0">
        <form onSubmit={handleAsk} className="flex gap-2 max-w-4xl mx-auto relative">
          <input 
            type="text" 
            placeholder="Ask anything..." 
            className="flex-1 bg-muted/30 border border-border/50 rounded-full px-4 py-3 text-sm outline-none focus:border-primary pr-12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !query.trim()} 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
