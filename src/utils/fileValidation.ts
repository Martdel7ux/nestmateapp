const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

export function validateDocumentFile(file: File): FileValidationResult {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, WebP, and PDF files are accepted." };
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, error: "File must be smaller than 25 MB." };
  }
  return { ok: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)             return `${bytes} B`;
  if (bytes < 1024 * 1024)      return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}
