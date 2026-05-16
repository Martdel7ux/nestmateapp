import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

type InsertAction = {
  label: string;
  syntax: string;
  wrap?: boolean;
  block?: boolean;
};

const TOOLBAR_ACTIONS: InsertAction[] = [
  { label: "B", syntax: "**", wrap: true },
  { label: "I", syntax: "_", wrap: true },
  { label: "H", syntax: "## ", block: true },
  { label: "</>", syntax: "`", wrap: true },
  { label: "- List", syntax: "- ", block: true },
];

export function NoteEditor({ value, onChange, placeholder = "Write your notes here…" }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSyntax = (action: InsertAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    let newText = value;
    let newCursorPos = end;

    if (action.block) {
      // Insert at beginning of line
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const before = value.slice(0, lineStart);
      const line = value.slice(lineStart);
      newText = before + action.syntax + line;
      newCursorPos = start + action.syntax.length;
    } else if (action.wrap && selected) {
      // Wrap selected text
      newText =
        value.slice(0, start) + action.syntax + selected + action.syntax + value.slice(end);
      newCursorPos = end + action.syntax.length * 2;
    } else if (action.wrap) {
      // Insert wrapping syntax and place cursor between
      newText =
        value.slice(0, start) + action.syntax + action.syntax + value.slice(end);
      newCursorPos = start + action.syntax.length;
    }

    onChange(newText);

    // Restore focus and cursor
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  return (
    <div className="flex flex-col gap-0 rounded-2xl border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border bg-muted/50 px-3 py-1.5">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // Don't steal focus from textarea
              insertSyntax(action);
            }}
            className={cn(
              "rounded px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground transition-colors",
              action.label === "B" && "font-black",
              action.label === "I" && "italic"
            )}
          >
            {action.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-muted-foreground/60">Markdown</div>
      </div>

      {/* Split view */}
      <div className="flex min-h-[240px]">
        {/* Editor */}
        <div className="flex-1 border-r border-border">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-full min-h-[240px] w-full resize-none bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground font-mono leading-relaxed"
          />
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {value.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Preview will appear here…</p>
          )}
        </div>
      </div>
    </div>
  );
}
