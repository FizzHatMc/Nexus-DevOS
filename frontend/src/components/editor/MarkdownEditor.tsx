"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

interface MarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

export function MarkdownEditor({ initialContent = "", onSave }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 p-2 border-b border-border/50 bg-muted/30">
        <button
          onClick={() => setIsPreview(false)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${!isPreview ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          Edit
        </button>
        <button
          onClick={() => setIsPreview(true)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${isPreview ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          Preview
        </button>
        <div className="flex-1"></div>
        {onSave && (
          <button
            onClick={() => onSave(content)}
            className="px-3 py-1.5 text-sm rounded-md bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Save Note
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto p-8 prose prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const {children, className, node, ...rest} = props
                  const match = /language-(\w+)/.exec(className || '')
                  const codeString = String(children).replace(/\n$/, '')
                  
                  return match ? (
                    <div className="relative group rounded-md overflow-hidden my-4 border border-border/50">
                      <div className="flex items-center justify-between px-4 py-1 bg-zinc-900 text-zinc-400 text-xs border-b border-zinc-800">
                        <span>{match[1]}</span>
                        <button
                          onClick={() => handleCopy(codeString)}
                          className="hover:text-zinc-100 transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === codeString ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        PreTag="div"
                        children={codeString}
                        language={match[1]}
                        style={vscDarkPlus as any}
                        customStyle={{ margin: 0, borderRadius: 0 }}
                      />
                    </div>
                  ) : (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            className="w-full h-full p-8 bg-transparent outline-none resize-none font-mono text-sm leading-relaxed text-foreground"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your markdown..."
            spellCheck="false"
          />
        )}
      </div>
    </div>
  );
}
