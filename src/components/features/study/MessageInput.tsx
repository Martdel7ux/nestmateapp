import { useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { uploadNoteAttachment } from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (content: string, attachmentUrl?: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: Props) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const content = text.trim();
    if (!content || disabled || uploading) return;
    onSend(content);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large (max ${MAX_SIZE_MB} MB)`);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadNoteAttachment(user.id, file);
      onSend(`📎 ${file.name}`, url);
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-end gap-2 px-4 py-3 border-t border-border bg-background">
      {/* Attachment button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
          (disabled || uploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <Paperclip size={17} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.pptx,.xlsx"
      />

      {/* Text area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={uploading ? "Uploading…" : "Write a message…"}
        disabled={disabled || uploading}
        rows={1}
        className="flex-1 resize-none rounded-2xl border border-border bg-muted px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 max-h-32 overflow-y-auto"
        style={{ lineHeight: "1.5" }}
      />

      {/* Send button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={!text.trim() || disabled || uploading}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all",
          (!text.trim() || disabled || uploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <Send size={16} />
      </button>
    </div>
  );
}
