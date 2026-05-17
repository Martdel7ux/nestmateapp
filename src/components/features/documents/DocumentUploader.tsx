import { useRef, useState } from "react";
import { Upload, FileText, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateDocumentFile, formatFileSize, isPdf } from "@/utils/fileValidation";

interface Props {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function DocumentUploader({ value, onChange, error }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleFile(file: File) {
    const result = validateDocumentFile(file);
    if (!result.ok) {
      setValidationError(result.error ?? "Invalid file");
      return;
    }
    setValidationError(null);
    onChange(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const displayError = error ?? validationError;

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          {isPdf(value.type)
            ? <FileText size={18} className="text-primary" />
            : <Image    size={18} className="text-primary" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{value.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p>
        </div>
        <button type="button" onClick={() => onChange(null)}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted hover:bg-muted/80">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-background/40 hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Upload size={20} className="text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Tap to upload or drag & drop</p>
          <p className="text-xs text-muted-foreground mt-0.5">PDF, JPEG, PNG, WebP · max 25 MB</p>
        </div>
      </button>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {displayError && (
        <p className="text-xs text-destructive">{displayError}</p>
      )}
    </div>
  );
}
