
"use client";
import { API_URL } from '@/lib/api';


import { useState, useEffect, Suspense } from "react";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { useSearchParams, useRouter } from "next/navigation";
import { useProject } from "@/lib/ProjectContext";
import { Trash2 } from "lucide-react";

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const noteId = searchParams.get("note") || "Home.md";
  const { activeProject } = useProject();
  
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/notes/${noteId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setContent(data.content);
        setLoading(false);
      })
      .catch(() => {
        setContent(`# ${noteId.replace('.md', '')}\n\nStart typing here...`);
        setLoading(false);
      });
  }, [noteId]);

  const handleSave = async (newContent: string) => {
    try {
      await fetch(`${API_URL}/notes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: noteId,
          title: noteId.replace(".md", ""),
          content: newContent,
          project_id: activeProject ? activeProject.id : null
        }),
      });
      if (!searchParams.get("note")) {
        router.push(`/?note=${noteId}`);
      }
    } catch (e) {
      alert("Failed to save note.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${noteId}? This action cannot be undone.`)) {
      try {
        const res = await fetch(`${API_URL}/notes/${noteId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          // Redirect to Home after deletion
          router.push(`/?note=Home.md`);
          // We could force a reload to ensure the sidebar updates, or let the user click around
          window.location.href = "/?note=Home.md";
        } else {
          alert("Failed to delete note.");
        }
      } catch (e) {
        alert("Failed to delete note.");
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background min-w-0">
      <header className="h-14 border-b border-border/50 flex items-center px-4 shrink-0 bg-muted/10 justify-between">
        <div className="text-sm text-muted-foreground flex gap-2">
          <span>Index</span>
          <span>/</span>
          {activeProject && <span>{activeProject.id} /</span>}
          <span className="text-foreground font-medium">{noteId}</span>
        </div>
        <button 
          onClick={handleDelete}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
          title="Delete Note"
        >
          <Trash2 size={16} />
        </button>
      </header>
      
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="p-8">Loading...</div>
        ) : (
          <MarkdownEditor key={noteId} initialContent={content} onSave={handleSave} />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8">Loading workspace...</div>}>
      <EditorContent />
    </Suspense>
  );
}

